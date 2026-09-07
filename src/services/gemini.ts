export const GEMINI_API_KEY_STORAGE_KEY = "gemini_api_key";

export type ParsedFoodItem = {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ParsedMeal = {
  title: string;
  items: ParsedFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

export function getStoredGeminiApiKey() {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveGeminiApiKey(apiKey: string) {
  localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey.trim());
}

export function clearGeminiApiKey() {
  localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
}

export function maskGeminiApiKey(apiKey: string) {
  if (!apiKey) {
    return "";
  }

  if (apiKey.length <= 8) {
    return "••••••••";
  }

  return `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`;
}

function readGeminiText(response: GeminiGenerateContentResponse) {
  return response.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text ?? "";
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function normalizeParsedMeal(value: Partial<ParsedMeal>, fallbackTitle: string): ParsedMeal {
  const items = Array.isArray(value.items) ? value.items : [];
  const parsedItems = items.map((item) => ({
    name: String(item.name ?? "Food").trim() || "Food",
    quantity: String(item.quantity ?? "").trim(),
    calories: cleanNumber(item.calories),
    protein: cleanNumber(item.protein),
    carbs: cleanNumber(item.carbs),
    fat: cleanNumber(item.fat),
  }));

  const itemCalories = parsedItems.reduce((total, item) => total + item.calories, 0);
  const itemProtein = parsedItems.reduce((total, item) => total + item.protein, 0);
  const itemCarbs = parsedItems.reduce((total, item) => total + item.carbs, 0);
  const itemFat = parsedItems.reduce((total, item) => total + item.fat, 0);

  return {
    title: String(value.title ?? fallbackTitle).trim() || fallbackTitle,
    items: parsedItems,
    totalCalories: cleanNumber(value.totalCalories) || itemCalories,
    totalProtein: cleanNumber(value.totalProtein) || itemProtein,
    totalCarbs: cleanNumber(value.totalCarbs) || itemCarbs,
    totalFat: cleanNumber(value.totalFat) || itemFat,
  };
}

export async function parseMealWithGemini(input: string, apiKey: string): Promise<ParsedMeal> {
  const trimmedInput = input.trim();

  if (!apiKey.trim()) {
    throw new Error("Add your Gemini API key before using AI logging.");
  }

  if (!trimmedInput) {
    throw new Error("Describe what you ate first.");
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey.trim(),
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: [
                "Parse this meal for a personal calorie tracker.",
                "Estimate calories and macros for each individual food item.",
                "Return realistic estimates only. Do not include commentary.",
                `Meal: ${trimmedInput}`,
              ].join("\n"),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  quantity: { type: "STRING" },
                  calories: { type: "INTEGER" },
                  protein: { type: "INTEGER" },
                  carbs: { type: "INTEGER" },
                  fat: { type: "INTEGER" },
                },
                required: ["name", "quantity", "calories", "protein", "carbs", "fat"],
              },
            },
            totalCalories: { type: "INTEGER" },
            totalProtein: { type: "INTEGER" },
            totalCarbs: { type: "INTEGER" },
            totalFat: { type: "INTEGER" },
          },
          required: ["title", "items", "totalCalories", "totalProtein", "totalCarbs", "totalFat"],
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as GeminiGenerateContentResponse;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Gemini rejected this API key. Replace it and try again.");
    }

    if (response.status === 429) {
      throw new Error("Gemini rate limit reached. Try again later.");
    }

    throw new Error(payload.error?.message ?? "Gemini could not estimate this meal.");
  }

  const text = readGeminiText(payload);
  if (!text) {
    throw new Error("Gemini did not return a food estimate.");
  }

  try {
    return normalizeParsedMeal(JSON.parse(text), trimmedInput);
  } catch {
    throw new Error("Gemini returned an estimate I could not read. Try a shorter meal description.");
  }
}

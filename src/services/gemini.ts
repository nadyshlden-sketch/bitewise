import { findFoodDatabaseMatches, formatFoodDatabaseReference } from "../data/foodDatabase";

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

export type LabelNutritionEstimate = {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
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

function normalizeLabelEstimate(value: Partial<LabelNutritionEstimate>): LabelNutritionEstimate {
  return {
    name: String(value.name ?? "Food label").trim() || "Food label",
    caloriesPer100g: cleanNumber(value.caloriesPer100g),
    proteinPer100g: cleanNumber(value.proteinPer100g),
    carbsPer100g: cleanNumber(value.carbsPer100g),
    fatPer100g: cleanNumber(value.fatPer100g),
  };
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

export async function parseMealWithGemini(input: string, apiKey: string): Promise<ParsedMeal> {
  const trimmedInput = input.trim();

  if (!apiKey.trim()) {
    throw new Error("Add your Gemini API key before using AI logging.");
  }

  if (!trimmedInput) {
    throw new Error("Describe what you ate first.");
  }

  const databaseMatches = findFoodDatabaseMatches(trimmedInput, 35);
  const foodReference = formatFoodDatabaseReference(databaseMatches);

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
                "Use the local nutrition database reference first.",
                "When a described food clearly matches a database item, scale that database item's calories and macros by the user's quantity and serving size.",
                "Only estimate from general nutrition knowledge when no database match is relevant.",
                "Break combined meals into individual food items whenever possible.",
                "Estimate calories and macros for each individual food item.",
                "Return realistic estimates only. Do not include commentary.",
                "Local nutrition database reference:",
                foodReference,
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

export async function estimateFoodLabelWithGemini(file: File, apiKey: string): Promise<LabelNutritionEstimate> {
  if (!apiKey.trim()) {
    throw new Error("Add your Gemini API key before using label scanning.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a food label photo.");
  }

  const imageData = await fileToBase64(file);
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
                "Read this nutrition label for a personal calorie tracker.",
                "Return calories and macros per 100g only.",
                "If the label uses a serving size instead of 100g, convert the nutrition to per 100g using the serving size.",
                "Use grams. If the image is unclear, make the best estimate and keep the food name generic.",
                "Return JSON only. Do not include commentary.",
              ].join("\n"),
            },
            {
              inlineData: {
                mimeType: file.type,
                data: imageData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            caloriesPer100g: { type: "INTEGER" },
            proteinPer100g: { type: "INTEGER" },
            carbsPer100g: { type: "INTEGER" },
            fatPer100g: { type: "INTEGER" },
          },
          required: ["name", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"],
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

    throw new Error(payload.error?.message ?? "Gemini could not read this label.");
  }

  const text = readGeminiText(payload);
  if (!text) {
    throw new Error("Gemini did not return a label estimate.");
  }

  try {
    const estimate = normalizeLabelEstimate(JSON.parse(text));
    if (estimate.caloriesPer100g <= 0) {
      throw new Error("Gemini could not find calories on this label.");
    }

    return estimate;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Gemini returned a label estimate I could not read.");
  }
}

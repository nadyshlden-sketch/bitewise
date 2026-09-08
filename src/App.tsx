import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  clearGeminiApiKey,
  getStoredGeminiApiKey,
  maskGeminiApiKey,
  ParsedMeal,
  parseMealWithGemini,
  saveGeminiApiKey,
} from "./services/gemini";

type Gender = "female" | "male";
type Goal = "lose" | "maintain" | "gain";
type ActivityLevel = "sedentary" | "light" | "moderate" | "very";
type MacroLabel = "Protein" | "Carbs" | "Fat";
type MealName = "Breakfast" | "Lunch" | "Snack" | "Dinner";

type Macro = {
  label: MacroLabel;
  current: number;
  goal: number;
  unit: "g";
};

type Profile = {
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  calorieGoal: number;
  macroGoals: Record<MacroLabel, number>;
};

type MealLog = {
  id: string;
  kind: "meal";
  dateKey: string;
  loggedAt: string;
  mealName: MealName;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  aiItems?: ParsedMeal["items"];
};

type StoredState = {
  version: number;
  profile: Profile | null;
  logs: MealLog[];
};

type MealSummary = {
  name: MealName;
  calories: number;
  items: MealLog[];
  tone: "spring" | "meadow" | "lagoon" | "ocean";
};

type LogDraft = {
  editingId: string | null;
  mealName: MealName;
  title: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  aiInput: string;
  aiResult: ParsedMeal | null;
  aiError: string;
  aiStatus: "idle" | "loading" | "ready" | "error";
};

type OnboardingDraft = {
  name: string;
  gender: Gender;
  age: string;
  heightCm: string;
  weightKg: string;
  goal: Goal;
  activityLevel: ActivityLevel;
};

type NutritionInput = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
};

type ApiKeyDraft = {
  value: string;
  error: string;
};

const CURRENT_STORAGE_VERSION = 5;
const STORAGE_KEY = "bitewise-state-v5";

const mealOrder: Array<Omit<MealSummary, "calories" | "items">> = [
  { name: "Breakfast", tone: "spring" },
  { name: "Lunch", tone: "meadow" },
  { name: "Snack", tone: "lagoon" },
  { name: "Dinner", tone: "ocean" },
];

const activityOptions: Array<{ value: ActivityLevel; label: string; multiplier: number }> = [
  { value: "sedentary", label: "Sedentary", multiplier: 1.2 },
  { value: "light", label: "Lightly active", multiplier: 1.375 },
  { value: "moderate", label: "Moderately active", multiplier: 1.55 },
  { value: "very", label: "Very active", multiplier: 1.725 },
];

const goalOptions: Array<{ value: Goal; label: string; adjustment: number }> = [
  { value: "lose", label: "Lose weight", adjustment: -500 },
  { value: "maintain", label: "Maintain", adjustment: 0 },
  { value: "gain", label: "Gain weight", adjustment: 300 },
];

const fallbackState: StoredState = {
  version: CURRENT_STORAGE_VERSION,
  profile: null,
  logs: [],
};

const addNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

const fallbackMacroGoals: Record<MacroLabel, number> = {
  Protein: 120,
  Carbs: 175,
  Fat: 60,
};

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateFromKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const moveDateKey = (dateKey: string, offset: number) => {
  const next = dateFromKey(dateKey);
  next.setDate(next.getDate() + offset);
  return toDateKey(next);
};

const formatDateKey = (dateKey: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(dateFromKey(dateKey));

const getDateIndicator = (dateKey: string) => {
  const today = toDateKey();

  if (dateKey === today) {
    return "Today";
  }

  if (dateKey === moveDateKey(today, -1)) {
    return "Yesterday";
  }

  if (dateKey === moveDateKey(today, 1)) {
    return "Tomorrow";
  }

  return "";
};

const formatTime = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStoredState(): StoredState {
  try {
    if (typeof localStorage === "undefined") {
      return fallbackState;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallbackState;
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (parsed.version !== CURRENT_STORAGE_VERSION) {
      return fallbackState;
    }

    const profile = parsed.profile ? { ...parsed.profile, ...calculateNutritionTargets(parsed.profile) } : null;
    return { ...fallbackState, ...parsed, profile, logs: normalizeStoredLogs(parsed.logs ?? []) };
  } catch {
    return fallbackState;
  }
}

function normalizeStoredLogs(logs: MealLog[]) {
  return logs.flatMap((log) => {
    if (!log.aiItems?.length) {
      return [log];
    }

    return log.aiItems.map((item, index) => ({
      ...log,
      id: `${log.id}-food-${index}`,
      title: `${item.quantity} ${item.name}`.trim(),
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      aiItems: undefined,
    }));
  });
}

function nutritionInputFromDraft(draft: OnboardingDraft): NutritionInput {
  return {
    gender: draft.gender,
    age: addNumber(draft.age),
    heightCm: addNumber(draft.heightCm),
    weightKg: addNumber(draft.weightKg),
    goal: draft.goal,
    activityLevel: draft.activityLevel,
  };
}

function calculateCalorieGoal(input: NutritionInput) {
  const { age, heightCm, weightKg } = input;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (input.gender === "male" ? 5 : -161);
  const activity = activityOptions.find((option) => option.value === input.activityLevel)?.multiplier ?? 1.2;
  const adjustment = goalOptions.find((option) => option.value === input.goal)?.adjustment ?? 0;

  return Math.max(1200, Math.round((bmr * activity + adjustment) / 10) * 10);
}

function calculateMacroGoals(input: NutritionInput, calorieGoal: number): Record<MacroLabel, number> {
  const proteinPerKg: Record<Goal, number> = {
    lose: 2,
    maintain: 1.6,
    gain: 1.8,
  };
  const protein = Math.round(input.weightKg * proteinPerKg[input.goal]);
  const fat = Math.round(Math.max(input.weightKg * 0.6, (calorieGoal * 0.25) / 9));
  const carbCalories = calorieGoal - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(carbCalories / 4));

  return {
    Protein: protein,
    Carbs: carbs,
    Fat: fat,
  };
}

function calculateNutritionTargets(input: NutritionInput) {
  const calorieGoal = calculateCalorieGoal(input);
  return {
    calorieGoal,
    macroGoals: calculateMacroGoals(input, calorieGoal),
  };
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button className="icon-button" type="button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="segmented-field">
      <legend>{label}</legend>
      <div className="segmented-options">
        {options.map((option) => (
          <button
            className={option.value === value ? "segment segment-active" : "segment"}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: (profile: Profile) => void }) {
  const [draft, setDraft] = useState<OnboardingDraft>({
    name: "",
    gender: "female",
    age: "",
    heightCm: "",
    weightKg: "",
    goal: "lose",
    activityLevel: "light",
  });

  const previewTargets = useMemo(() => {
    const hasEnoughData = addNumber(draft.age) > 0 && addNumber(draft.heightCm) > 0 && addNumber(draft.weightKg) > 0;
    return hasEnoughData
      ? calculateNutritionTargets(nutritionInputFromDraft(draft))
      : {
          calorieGoal: 1650,
          macroGoals: fallbackMacroGoals,
        };
  }, [draft]);

  const canSave =
    draft.name.trim().length > 0 &&
    addNumber(draft.age) >= 13 &&
    addNumber(draft.heightCm) > 0 &&
    addNumber(draft.weightKg) > 0;

  const updateDraft = (next: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
  };

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) {
      return;
    }

    onComplete({
      name: draft.name.trim(),
      gender: draft.gender,
      age: addNumber(draft.age),
      heightCm: addNumber(draft.heightCm),
      weightKg: addNumber(draft.weightKg),
      goal: draft.goal,
      activityLevel: draft.activityLevel,
      calorieGoal: previewTargets.calorieGoal,
      macroGoals: previewTargets.macroGoals,
    });
  };

  return (
    <main className="app-shell">
      <section className="phone-frame onboarding-frame" aria-label="Bitewise onboarding">
        <header className="onboarding-header">
          <p>Bitewise</p>
          <h1>Set your daily goal</h1>
        </header>

        <section className="onboarding-summary" aria-label="Estimated daily goals">
          <div>
            <span className="onboarding-calories">{previewTargets.calorieGoal}</span>
            <p>kcal daily goal</p>
          </div>
          <div className="onboarding-macro-grid" aria-label="Estimated macro goals">
            {(["Protein", "Carbs", "Fat"] as MacroLabel[]).map((macro) => (
              <span key={macro}>
                <strong>{previewTargets.macroGoals[macro]}g</strong>
                <small>{macro}</small>
              </span>
            ))}
          </div>
        </section>

        <form className="onboarding-form" onSubmit={submitProfile}>
          <label className="field-label">
            Name
            <input
              autoComplete="given-name"
              autoFocus
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              placeholder="Your name"
            />
          </label>

          <SegmentedControl
            label="Gender"
            value={draft.gender}
            options={[
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
            ]}
            onChange={(gender) => updateDraft({ gender })}
          />

          <div className="field-grid">
            <label className="field-label">
              Age
              <input
                inputMode="numeric"
                value={draft.age}
                onChange={(event) => updateDraft({ age: event.target.value })}
                placeholder="29"
              />
            </label>
            <label className="field-label">
              Height, cm
              <input
                inputMode="numeric"
                value={draft.heightCm}
                onChange={(event) => updateDraft({ heightCm: event.target.value })}
                placeholder="165"
              />
            </label>
            <label className="field-label">
              Weight, kg
              <input
                inputMode="decimal"
                value={draft.weightKg}
                onChange={(event) => updateDraft({ weightKg: event.target.value })}
                placeholder="68"
              />
            </label>
          </div>

          <SegmentedControl
            label="Goal"
            value={draft.goal}
            options={goalOptions}
            onChange={(goal) => updateDraft({ goal })}
          />

          <SegmentedControl
            label="Activity"
            value={draft.activityLevel}
            options={activityOptions}
            onChange={(activityLevel) => updateDraft({ activityLevel })}
          />

          <button className="save-meal-button onboarding-submit" type="submit" disabled={!canSave}>
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}

function ApiKeySheet({
  savedKey,
  onSave,
  onClear,
  onClose,
}: {
  savedKey: string;
  onSave: (apiKey: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ApiKeyDraft>({ value: "", error: "" });
  const hasSavedKey = savedKey.length > 0;

  const submitKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextKey = draft.value.trim();

    if (!nextKey) {
      setDraft((current) => ({ ...current, error: "Paste your Gemini API key first." }));
      return;
    }

    onSave(nextKey);
  };

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="meal-sheet api-key-sheet" aria-label="Gemini API key" onSubmit={submitKey} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p>Gemini</p>
            <h2>API key</h2>
          </div>
          <button className="sheet-close" type="button" aria-label="Close API key setup" onClick={onClose}>
            <X size={22} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {hasSavedKey ? <p className="key-status">Saved key: {maskGeminiApiKey(savedKey)}</p> : null}

        <label className="field-label">
          {hasSavedKey ? "Replace key" : "API key"}
          <input
            autoFocus
            autoComplete="off"
            value={draft.value}
            onChange={(event) => setDraft({ value: event.target.value, error: "" })}
            placeholder="Paste Gemini API key"
            type="password"
          />
        </label>

        {draft.error ? <p className="form-error">{draft.error}</p> : null}

        <div className="key-actions">
          <button className="save-meal-button" type="submit">
            {hasSavedKey ? "Replace key" : "Save key"}
          </button>
          {hasSavedKey ? (
            <button className="clear-key-button" type="button" onClick={onClear}>
              Clear key
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function MacroMeter({ label, current, goal, unit }: Macro) {
  const progress = Math.min(current / goal, 1);

  return (
    <div className="macro-meter">
      <p className="macro-value">
        <strong>{current}</strong>
        <span>
          /{goal}
          {unit}
        </span>
      </p>
      <p className="macro-label">{label}</p>
      <div className="meter-track" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function CalorieArc({
  calorieGoal,
  consumed,
  macros,
}: {
  calorieGoal: number;
  consumed: number;
  macros: Macro[];
}) {
  const remaining = Math.max(calorieGoal - consumed, 0);
  const progress = Math.min(consumed / calorieGoal, 1);
  const radius = 102;
  const circumference = Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <section className="summary-card" aria-label="Daily calorie summary">
      <div className="arc-wrap">
        <svg className="calorie-arc" viewBox="0 0 260 148" role="img" aria-label={`${remaining} calories left`}>
          <path className="arc-track" d="M28 122a102 102 0 0 1 204 0" pathLength={circumference} />
          <path
            className="arc-progress"
            d="M28 122a102 102 0 0 1 204 0"
            pathLength={circumference}
            style={{ strokeDasharray: circumference, strokeDashoffset: strokeOffset }}
          />
        </svg>
        <div className="calorie-copy">
          <p>
            <strong>{remaining}</strong>
            <span>/{calorieGoal}</span>
          </p>
          <span>Calories left</span>
        </div>
      </div>

      <div className="macro-grid">
        {macros.map((macro) => (
          <MacroMeter key={macro.label} {...macro} />
        ))}
      </div>
    </section>
  );
}

function MealCard({
  meal,
  isExpanded,
  onToggle,
  onLogMeal,
  onEditFood,
  onDeleteFood,
}: {
  meal: MealSummary;
  isExpanded: boolean;
  onToggle: () => void;
  onLogMeal: (mealName: MealName) => void;
  onEditFood: (log: MealLog) => void;
  onDeleteFood: (id: string) => void;
}) {
  return (
    <article className={`meal-card meal-card-${meal.tone} ${isExpanded ? "meal-card-expanded" : ""}`}>
      <button
        className="meal-toggle"
        type="button"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${meal.name}`}
        onClick={onToggle}
      >
        <span className="meal-copy">
          <span className="meal-title">
            {meal.name}
            {isExpanded ? (
              <ChevronUp size={16} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true" />
            )}
          </span>
          <span className="meal-calories">{meal.calories > 0 ? `${meal.calories} kcal` : "0 kcal"}</span>
        </span>
      </button>

      <button
        className="add-meal-button"
        type="button"
        aria-label={`Log Meal for ${meal.name}`}
        onClick={() => onLogMeal(meal.name)}
      >
        <Plus size={36} strokeWidth={2.4} aria-hidden="true" />
      </button>

      {isExpanded ? (
        <div className="meal-dropdown" aria-label={`${meal.name} foods`}>
          {meal.items.length > 0 ? (
            meal.items.map((item) => (
              <div className="food-row" key={item.id}>
                <span className="food-copy">
                  <span className="food-title">{item.title}</span>
                  <span className="food-breakdown">
                    {item.calories} kcal · P {item.protein}g · C {item.carbs}g · F {item.fat}g · {formatTime(item.loggedAt)}
                  </span>
                </span>
                <span className="food-actions">
                  <button className="food-action-button" type="button" aria-label={`Edit ${item.title}`} onClick={() => onEditFood(item)}>
                    <Pencil size={14} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                  <button className="food-action-button" type="button" aria-label={`Delete ${item.title}`} onClick={() => onDeleteFood(item.id)}>
                    <Trash2 size={14} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))
          ) : (
            <p className="empty-meal">No foods logged</p>
          )}
        </div>
      ) : null}
    </article>
  );
}

function LogSheet({
  draft,
  setDraft,
  onClose,
  onSave,
  apiKey,
  onNeedApiKey,
}: {
  draft: LogDraft;
  setDraft: Dispatch<SetStateAction<LogDraft | null>>;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  apiKey: string;
  onNeedApiKey: () => void;
}) {
  const canSave = draft.title.trim().length > 0 && addNumber(draft.calories) > 0;
  const estimateWithAi = async () => {
    if (!apiKey) {
      setDraft((current) =>
        current
          ? {
              ...current,
              aiError: "Add your Gemini API key before using AI logging.",
              aiStatus: "error",
            }
          : current,
      );
      onNeedApiKey();
      return;
    }

    const input = draft.aiInput.trim();
    if (!input) {
      setDraft((current) =>
        current
          ? {
              ...current,
              aiError: "Describe the meal first.",
              aiStatus: "error",
            }
          : current,
      );
      return;
    }

    setDraft((current) => (current ? { ...current, aiError: "", aiStatus: "loading" } : current));

    try {
      const result = await parseMealWithGemini(input, apiKey);
      setDraft((current) =>
        current
          ? {
              ...current,
              title: result.title,
              calories: String(result.totalCalories),
              protein: String(result.totalProtein),
              carbs: String(result.totalCarbs),
              fat: String(result.totalFat),
              aiResult: result,
              aiStatus: "ready",
            }
          : current,
      );
    } catch (error) {
      setDraft((current) =>
        current
          ? {
              ...current,
              aiError: error instanceof Error ? error.message : "Gemini could not estimate this meal.",
              aiStatus: "error",
            }
          : current,
      );
    }
  };

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="meal-sheet" aria-label="Log Meal" onSubmit={onSave} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p>{draft.mealName}</p>
            <h2>{draft.editingId ? "Edit food" : "Log food"}</h2>
          </div>
          <button className="sheet-close" type="button" aria-label="Close Log Sheet" onClick={onClose}>
            <X size={22} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
        <div className="ai-key-row">
          <span>{apiKey ? `Gemini key ${maskGeminiApiKey(apiKey)}` : "Gemini key not set"}</span>
          <button type="button" onClick={onNeedApiKey}>
            {apiKey ? "Replace" : "Add key"}
          </button>
        </div>

        {!draft.editingId ? (
          <section className="ai-log-panel" aria-label="AI food logging">
            <label className="field-label">
              Describe meal
              <textarea
                value={draft.aiInput}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          aiInput: event.target.value,
                          aiError: "",
                        }
                      : current,
                  )
                }
                placeholder="2 scrambled eggs and toast"
              />
            </label>
            <button className="ai-estimate-button" type="button" disabled={draft.aiStatus === "loading"} onClick={estimateWithAi}>
              {draft.aiStatus === "loading" ? "Estimating..." : "Estimate with AI"}
            </button>
            {draft.aiError ? <p className="form-error">{draft.aiError}</p> : null}
            {draft.aiResult ? (
              <div className="ai-result" aria-label="AI estimate result">
                <div className="ai-result-total">
                  <strong>{draft.aiResult.totalCalories}</strong>
                  <span>kcal total</span>
                </div>
                <div className="ai-result-macros" aria-label="AI estimated macros">
                  <span>
                    <strong>{draft.aiResult.totalProtein}g</strong>
                    <small>Protein</small>
                  </span>
                  <span>
                    <strong>{draft.aiResult.totalCarbs}g</strong>
                    <small>Carbs</small>
                  </span>
                  <span>
                    <strong>{draft.aiResult.totalFat}g</strong>
                    <small>Fat</small>
                  </span>
                </div>
                <ul>
                  {draft.aiResult.items.map((item) => (
                    <li key={`${item.name}-${item.quantity}`}>
                      <span className="ai-item-copy">
                        <span>
                          {item.quantity} {item.name}
                        </span>
                        <small>
                          P {item.protein}g · C {item.carbs}g · F {item.fat}g
                        </small>
                      </span>
                      <strong>{item.calories} kcal</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <label className="field-label">
          {draft.editingId ? "Food" : "Food name"}
          <input
            autoFocus
            value={draft.title}
            onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
            placeholder="Food or meal"
          />
        </label>

        <div className="field-grid">
          <label className="field-label">
            kcal
            <input
              inputMode="numeric"
              value={draft.calories}
              onChange={(event) => setDraft((current) => (current ? { ...current, calories: event.target.value } : current))}
              placeholder="0"
            />
          </label>
          <label className="field-label">
            Protein
            <input
              inputMode="numeric"
              value={draft.protein}
              onChange={(event) => setDraft((current) => (current ? { ...current, protein: event.target.value } : current))}
              placeholder="0"
            />
          </label>
          <label className="field-label">
            Carbs
            <input
              inputMode="numeric"
              value={draft.carbs}
              onChange={(event) => setDraft((current) => (current ? { ...current, carbs: event.target.value } : current))}
              placeholder="0"
            />
          </label>
          <label className="field-label">
            Fat
            <input
              inputMode="numeric"
              value={draft.fat}
              onChange={(event) => setDraft((current) => (current ? { ...current, fat: event.target.value } : current))}
              placeholder="0"
            />
          </label>
        </div>

        <button className="save-meal-button" type="submit" disabled={!canSave}>
          {draft.editingId ? "Save food" : `Add to ${draft.mealName}`}
        </button>
      </form>
    </div>
  );
}

export function App() {
  const [storedState, setStoredState] = useState<StoredState>(loadStoredState);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey());
  const [draft, setDraft] = useState<LogDraft | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState(getStoredGeminiApiKey);
  const [showApiKeySheet, setShowApiKeySheet] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<MealName | null>(null);
  const { profile, logs } = storedState;
  const dateIndicator = getDateIndicator(selectedDateKey);

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined" && storedState.version === CURRENT_STORAGE_VERSION) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));
      }
    } catch {
      // Some embedded preview browsers disable storage. The app still works in memory.
    }
  }, [storedState]);

  useEffect(() => {
    if (profile && !geminiApiKey) {
      setShowApiKeySheet(true);
    }
  }, [geminiApiKey, profile]);

  const selectedLogs = useMemo(() => logs.filter((log) => log.dateKey === selectedDateKey), [logs, selectedDateKey]);

  const mealSummaries = useMemo<MealSummary[]>(
    () =>
      mealOrder.map((meal) => {
        const entries = selectedLogs.filter((log) => log.mealName === meal.name);
        return {
          ...meal,
          calories: entries.reduce((total, log) => total + log.calories, 0),
          items: entries,
        };
      }),
    [selectedLogs],
  );

  const consumed = selectedLogs.reduce((total, log) => total + log.calories, 0);

  const macros = useMemo<Macro[]>(() => {
    const totals = selectedLogs.reduce(
      (current, log) => ({
        Protein: current.Protein + log.protein,
        Carbs: current.Carbs + log.carbs,
        Fat: current.Fat + log.fat,
      }),
      { Protein: 0, Carbs: 0, Fat: 0 },
    );

    return (["Protein", "Carbs", "Fat"] as MacroLabel[]).map((label) => ({
      label,
      current: totals[label],
      goal: profile?.macroGoals[label] ?? 0,
      unit: "g",
    }));
  }, [profile, selectedLogs]);

  if (!profile) {
    return (
      <OnboardingScreen
        onComplete={(nextProfile) =>
          setStoredState((current) => ({
            ...current,
            version: CURRENT_STORAGE_VERSION,
            profile: nextProfile,
          }))
        }
      />
    );
  }

  const openLogSheet = (mealName: MealName = "Breakfast") => {
    setExpandedMeal(mealName);
    setDraft({
      editingId: null,
      mealName,
      title: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      aiInput: "",
      aiResult: null,
      aiError: "",
      aiStatus: "idle",
    });
  };

  const openEditSheet = (log: MealLog) => {
    setDraft({
      editingId: log.id,
      mealName: log.mealName,
      title: log.title,
      calories: String(log.calories),
      protein: String(log.protein),
      carbs: String(log.carbs),
      fat: String(log.fat),
      aiInput: "",
      aiResult: null,
      aiError: "",
      aiStatus: "idle",
    });
  };

  const deleteFood = (id: string) => {
    setStoredState((current) => ({
      ...current,
      version: CURRENT_STORAGE_VERSION,
      logs: current.logs.filter((log) => log.id !== id),
    }));
  };

  const saveLog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) {
      return;
    }

    const calories = addNumber(draft.calories);
    const title = draft.title.trim();
    if (!title || calories === 0) {
      return;
    }

    if (draft.editingId) {
      setStoredState((current) => ({
        ...current,
        version: CURRENT_STORAGE_VERSION,
        logs: current.logs.map((log) =>
          log.id === draft.editingId
            ? {
                ...log,
                title,
                calories,
                protein: addNumber(draft.protein),
                carbs: addNumber(draft.carbs),
                fat: addNumber(draft.fat),
              }
            : log,
        ),
      }));
      setDraft(null);
      return;
    }

    const timestamp = new Date().toISOString();
    const nextLogs: MealLog[] = draft.aiResult?.items.length
      ? draft.aiResult.items.map((item) => ({
          id: makeId(),
          kind: "meal",
          dateKey: selectedDateKey,
          loggedAt: timestamp,
          mealName: draft.mealName,
          title: `${item.quantity} ${item.name}`.trim(),
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        }))
      : [
          {
            id: makeId(),
            kind: "meal",
            dateKey: selectedDateKey,
            loggedAt: timestamp,
            mealName: draft.mealName,
            title,
            calories,
            protein: addNumber(draft.protein),
            carbs: addNumber(draft.carbs),
            fat: addNumber(draft.fat),
          },
        ];

    setStoredState((current) => ({
      ...current,
      version: CURRENT_STORAGE_VERSION,
      logs: [...current.logs, ...nextLogs],
    }));
    setExpandedMeal(draft.mealName);
    setDraft(null);
  };

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="Bitewise home">
        <header className="date-header">
          <IconButton label="Previous day" onClick={() => setSelectedDateKey((current) => moveDateKey(current, -1))}>
            <ArrowLeft size={30} strokeWidth={3} aria-hidden="true" />
          </IconButton>
          <div className="date-copy">
            {dateIndicator ? <span>{dateIndicator}</span> : null}
            <h1>{formatDateKey(selectedDateKey)}</h1>
          </div>
          <IconButton label="Next day" onClick={() => setSelectedDateKey((current) => moveDateKey(current, 1))}>
            <ArrowRight size={30} strokeWidth={3} aria-hidden="true" />
          </IconButton>
        </header>

        <CalorieArc calorieGoal={profile.calorieGoal} consumed={consumed} macros={macros} />

        <div className="meal-list" aria-label="Meals">
          {mealSummaries.map((meal) => (
            <MealCard
              key={meal.name}
              meal={meal}
              isExpanded={expandedMeal === meal.name}
              onToggle={() => setExpandedMeal((current) => (current === meal.name ? null : meal.name))}
              onLogMeal={(mealName) => openLogSheet(mealName)}
              onEditFood={openEditSheet}
              onDeleteFood={deleteFood}
            />
          ))}
        </div>

      </section>

      {draft ? (
        <LogSheet
          draft={draft}
          setDraft={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveLog}
          apiKey={geminiApiKey}
          onNeedApiKey={() => setShowApiKeySheet(true)}
        />
      ) : null}
      {showApiKeySheet ? (
        <ApiKeySheet
          savedKey={geminiApiKey}
          onSave={(apiKey) => {
            saveGeminiApiKey(apiKey);
            setGeminiApiKey(apiKey.trim());
            setShowApiKeySheet(false);
          }}
          onClear={() => {
            clearGeminiApiKey();
            setGeminiApiKey("");
          }}
          onClose={() => setShowApiKeySheet(false)}
        />
      ) : null}
    </main>
  );
}

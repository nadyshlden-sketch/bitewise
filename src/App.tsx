import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Home, KeyRound, Pencil, Plus, Settings as SettingsIcon, Star, Trash2, X } from "lucide-react";
import { Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { findFoodDatabaseMatches, FoodDatabaseEntry } from "./data/foodDatabase";
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

type MyFoodEntry = {
  signature: string;
  mealName: MealName;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
  count: number;
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

type TargetDraft = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

type AppView = "home" | "foods" | "settings";

type PortionUnit = "serving" | "g";

type SelectedDatabaseFood = {
  entry: FoodDatabaseEntry;
  amount: string;
  unit: PortionUnit;
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

const macrosOrder: MacroLabel[] = ["Protein", "Carbs", "Fat"];

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

function makeEmptyLogDraft(mealName: MealName): LogDraft {
  return {
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
  };
}

function getServingDetails(entry: FoodDatabaseEntry) {
  const grams = Number(entry.serving.match(/(\d+(?:\.\d+)?)\s*g/i)?.[1] ?? 0);
  let baseLabel = entry.serving
    .split(",")[0]
    .replace(/^1\s+/i, "")
    .trim() || "serving";
  if (/^(small|medium|large)$/i.test(baseLabel)) {
    baseLabel = "piece";
  }
  const prefersGrams = /rice|pasta|quinoa|oatmeal|beans|chickpeas|lentils|yogurt|cheese|hummus|meat|chicken|beef|salmon|tuna|shrimp|tofu|tempeh/i.test(
    entry.name,
  );

  return {
    grams,
    baseLabel,
    defaultUnit: grams > 0 && prefersGrams ? "g" : "serving",
    defaultAmount: grams > 0 && prefersGrams ? String(grams) : "1",
  } satisfies { grams: number; baseLabel: string; defaultUnit: PortionUnit; defaultAmount: string };
}

function scaleDatabaseFood(entry: FoodDatabaseEntry, amountValue: string, unit: PortionUnit) {
  const amount = Number(amountValue);
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const { grams } = getServingDetails(entry);
  const ratio = unit === "g" && grams > 0 ? safeAmount / grams : safeAmount;

  return {
    title: `${safeAmount || 0}${unit === "g" ? "g" : ` ${getServingDetails(entry).baseLabel}`} ${entry.name}`.trim(),
    calories: Math.round(entry.calories * ratio),
    protein: Math.round(entry.protein * ratio),
    carbs: Math.round(entry.carbs * ratio),
    fat: Math.round(entry.fat * ratio),
  };
}

function foodSignature(log: MealLog) {
  return [log.title.trim().toLowerCase(), log.calories, log.protein, log.carbs, log.fat].join("|");
}

function getMyFoods(logs: MealLog[]) {
  const sortedLogs = [...logs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  const bySignature = new Map<string, MyFoodEntry>();

  for (const log of sortedLogs) {
    const signature = foodSignature(log);
    const current = bySignature.get(signature);

    if (current) {
      current.count += 1;
      continue;
    }

    bySignature.set(signature, {
      signature,
      mealName: log.mealName,
      title: log.title,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      loggedAt: log.loggedAt,
      count: 1,
    });
  }

  const entries = [...bySignature.values()];

  return {
    recent: entries.slice(0, 5),
    frequent: [...entries]
      .sort((a, b) => b.count - a.count || new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, 5),
  };
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

function targetDraftFromGoals(calorieGoal: number, macroGoals: Record<MacroLabel, number>): TargetDraft {
  return {
    calories: String(calorieGoal),
    protein: String(macroGoals.Protein),
    carbs: String(macroGoals.Carbs),
    fat: String(macroGoals.Fat),
  };
}

function goalsFromTargetDraft(draft: TargetDraft) {
  return {
    calorieGoal: addNumber(draft.calories),
    macroGoals: {
      Protein: addNumber(draft.protein),
      Carbs: addNumber(draft.carbs),
      Fat: addNumber(draft.fat),
    },
  };
}

function targetDraftIsValid(draft: TargetDraft) {
  const targets = goalsFromTargetDraft(draft);
  return targets.calorieGoal > 0 && macrosOrder.every((macro) => targets.macroGoals[macro] > 0);
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
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [targetOverride, setTargetOverride] = useState<TargetDraft | null>(null);

  const previewTargets = useMemo(() => {
    const hasEnoughData = addNumber(draft.age) > 0 && addNumber(draft.heightCm) > 0 && addNumber(draft.weightKg) > 0;
    return hasEnoughData
      ? calculateNutritionTargets(nutritionInputFromDraft(draft))
      : {
          calorieGoal: 1650,
          macroGoals: fallbackMacroGoals,
        };
  }, [draft]);
  const displayedTargets = targetOverride ? goalsFromTargetDraft(targetOverride) : previewTargets;

  const canSave =
    draft.name.trim().length > 0 &&
    addNumber(draft.age) >= 13 &&
    addNumber(draft.heightCm) > 0 &&
    addNumber(draft.weightKg) > 0 &&
    (!targetOverride || targetDraftIsValid(targetOverride));

  const updateDraft = (next: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
  };

  const startEditingTargets = () => {
    setTargetOverride(targetDraftFromGoals(displayedTargets.calorieGoal, displayedTargets.macroGoals));
    setIsEditingTargets(true);
  };

  const updateTargetOverride = (next: Partial<TargetDraft>) => {
    setTargetOverride((current) => ({ ...(current ?? targetDraftFromGoals(previewTargets.calorieGoal, previewTargets.macroGoals)), ...next }));
  };

  const useFormulaTargets = () => {
    setTargetOverride(null);
    setIsEditingTargets(false);
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
      calorieGoal: displayedTargets.calorieGoal,
      macroGoals: displayedTargets.macroGoals,
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
          <button className="summary-edit-button" type="button" aria-label="Edit daily goals" onClick={startEditingTargets}>
            <Pencil size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <div>
            {isEditingTargets && targetOverride ? (
              <label className="target-inline-field">
                kcal
                <input
                  inputMode="numeric"
                  value={targetOverride.calories}
                  onChange={(event) => updateTargetOverride({ calories: event.target.value })}
                />
              </label>
            ) : (
              <span className="onboarding-calories">{displayedTargets.calorieGoal}</span>
            )}
            <p>kcal daily goal</p>
          </div>
          <div className="onboarding-macro-grid" aria-label="Estimated macro goals">
            {macrosOrder.map((macro) => (
              <span key={macro}>
                {isEditingTargets && targetOverride ? (
                  <input
                    aria-label={`${macro} goal`}
                    inputMode="numeric"
                    value={targetOverride[macro.toLowerCase() as keyof TargetDraft]}
                    onChange={(event) => updateTargetOverride({ [macro.toLowerCase()]: event.target.value } as Partial<TargetDraft>)}
                  />
                ) : (
                  <strong>{displayedTargets.macroGoals[macro]}g</strong>
                )}
                <small>{macro}</small>
              </span>
            ))}
          </div>
          {isEditingTargets ? (
            <button className="formula-button" type="button" onClick={useFormulaTargets}>
              Use formula
            </button>
          ) : null}
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

function SettingsScreen({
  profile,
  savedKey,
  onSaveTargets,
  onSaveApiKey,
  onClearApiKey,
}: {
  profile: Profile;
  savedKey: string;
  onSaveTargets: (targets: ReturnType<typeof goalsFromTargetDraft>) => void;
  onSaveApiKey: (apiKey: string) => void;
  onClearApiKey: () => void;
}) {
  const [targets, setTargets] = useState(() => targetDraftFromGoals(profile.calorieGoal, profile.macroGoals));
  const [apiDraft, setApiDraft] = useState<ApiKeyDraft>({ value: "", error: "" });
  const [targetsSaved, setTargetsSaved] = useState(false);
  const [openPanel, setOpenPanel] = useState<"targets" | "api" | null>(null);
  const hasSavedKey = savedKey.length > 0;

  useEffect(() => {
    setTargets(targetDraftFromGoals(profile.calorieGoal, profile.macroGoals));
  }, [profile.calorieGoal, profile.macroGoals]);

  const updateTargets = (next: Partial<TargetDraft>) => {
    setTargetsSaved(false);
    setTargets((current) => ({ ...current, ...next }));
  };

  const submitTargets = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetDraftIsValid(targets)) {
      return;
    }

    onSaveTargets(goalsFromTargetDraft(targets));
    setTargetsSaved(true);
  };

  const submitKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextKey = apiDraft.value.trim();

    if (!nextKey) {
      setApiDraft((current) => ({ ...current, error: "Paste your Gemini API key first." }));
      return;
    }

    onSaveApiKey(nextKey);
    setApiDraft({ value: "", error: "" });
  };

  return (
    <section className="settings-screen" aria-label="Settings">
      <header className="settings-header">
        <p>Settings</p>
        <h1>Goals and AI</h1>
      </header>

      <form className="settings-card" onSubmit={submitTargets}>
        <button
          className="settings-card-toggle"
          type="button"
          aria-expanded={openPanel === "targets"}
          onClick={() => setOpenPanel((current) => (current === "targets" ? null : "targets"))}
        >
          <span>
            <strong>Daily targets</strong>
            <small>
              {profile.calorieGoal} kcal · P {profile.macroGoals.Protein}g · C {profile.macroGoals.Carbs}g · F {profile.macroGoals.Fat}g
            </small>
          </span>
          <span className="settings-toggle-meta">
            {targetsSaved ? <small>Saved</small> : null}
            {openPanel === "targets" ? <ChevronUp size={19} strokeWidth={2.5} /> : <ChevronDown size={19} strokeWidth={2.5} />}
          </span>
        </button>

        {openPanel === "targets" ? (
          <div className="settings-panel-body">
            <label className="field-label">
              Calories
              <input inputMode="numeric" value={targets.calories} onChange={(event) => updateTargets({ calories: event.target.value })} />
            </label>

            <div className="field-grid">
              <label className="field-label">
                Protein
                <input inputMode="numeric" value={targets.protein} onChange={(event) => updateTargets({ protein: event.target.value })} />
              </label>
              <label className="field-label">
                Carbs
                <input inputMode="numeric" value={targets.carbs} onChange={(event) => updateTargets({ carbs: event.target.value })} />
              </label>
              <label className="field-label">
                Fat
                <input inputMode="numeric" value={targets.fat} onChange={(event) => updateTargets({ fat: event.target.value })} />
              </label>
            </div>

            <button className="save-meal-button" type="submit" disabled={!targetDraftIsValid(targets)}>
              Save targets
            </button>
          </div>
        ) : null}
      </form>

      <form className="settings-card" onSubmit={submitKey}>
        <button
          className="settings-card-toggle"
          type="button"
          aria-expanded={openPanel === "api"}
          onClick={() => setOpenPanel((current) => (current === "api" ? null : "api"))}
        >
          <span>
            <strong>Gemini API key</strong>
            <small>{hasSavedKey ? maskGeminiApiKey(savedKey) : "Not saved"}</small>
          </span>
          <span className="settings-toggle-meta">
            <KeyRound size={18} strokeWidth={2.4} aria-hidden="true" />
            {openPanel === "api" ? <ChevronUp size={19} strokeWidth={2.5} /> : <ChevronDown size={19} strokeWidth={2.5} />}
          </span>
        </button>

        {openPanel === "api" ? (
          <div className="settings-panel-body">
            <label className="field-label">
              {hasSavedKey ? "Replace key" : "API key"}
              <input
                autoComplete="off"
                value={apiDraft.value}
                onChange={(event) => setApiDraft({ value: event.target.value, error: "" })}
                placeholder="Paste Gemini API key"
                type="password"
              />
            </label>

            {apiDraft.error ? <p className="form-error">{apiDraft.error}</p> : null}

            <div className="key-actions">
              <button className="save-meal-button" type="submit">
                {hasSavedKey ? "Replace key" : "Save key"}
              </button>
              {hasSavedKey ? (
                <button className="clear-key-button" type="button" onClick={onClearApiKey}>
                  Clear key
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function BottomNavigation({ activeView, onChange }: { activeView: AppView; onChange: (view: AppView) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <button className={activeView === "home" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} type="button" onClick={() => onChange("home")}>
        <Home size={21} strokeWidth={2.5} aria-hidden="true" />
        <span>Home</span>
      </button>
      <button className={activeView === "foods" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} type="button" onClick={() => onChange("foods")}>
        <Star size={21} strokeWidth={2.5} aria-hidden="true" />
        <span>Foods</span>
      </button>
      <button
        className={activeView === "settings" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"}
        type="button"
        onClick={() => onChange("settings")}
      >
        <SettingsIcon size={21} strokeWidth={2.5} aria-hidden="true" />
        <span>Settings</span>
      </button>
    </nav>
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
        <Plus size={27} strokeWidth={2.4} aria-hidden="true" />
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

function MyFoodsSection({
  recent,
  frequent,
  onRelogFood,
}: {
  recent: MyFoodEntry[];
  frequent: MyFoodEntry[];
  onRelogFood: (entry: MyFoodEntry) => void;
}) {
  const renderFoodCard = (entry: MyFoodEntry, label: "recent" | "frequent") => (
    <button className="my-food-card" key={`${label}-${entry.signature}`} type="button" onClick={() => onRelogFood(entry)}>
      <span className="my-food-title">{entry.title}</span>
      <span className="my-food-meta">
        {entry.calories} kcal · {entry.mealName}
      </span>
      <span className="my-food-macros">
        P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
      </span>
      {label === "frequent" ? <span className="my-food-count">{entry.count}x</span> : null}
    </button>
  );

  return (
    <section className="my-foods" aria-label="My Foods">
      <div className="my-foods-header">
        <span>Saved foods</span>
        <h1>My Foods</h1>
        <p>Tap any card to log it again for the selected day.</p>
      </div>

      {recent.length === 0 && frequent.length === 0 ? <p className="my-foods-empty">Foods you log will appear here automatically.</p> : null}

      {recent.length > 0 ? (
        <div className="my-foods-group">
          <h2>Recent</h2>
          <div className="my-foods-row">{recent.map((entry) => renderFoodCard(entry, "recent"))}</div>
        </div>
      ) : null}

      {frequent.length > 0 ? (
        <div className="my-foods-group">
          <h2>Frequent</h2>
          <div className="my-foods-row">{frequent.map((entry) => renderFoodCard(entry, "frequent"))}</div>
        </div>
      ) : null}
    </section>
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
  onSave: (keepOpen?: boolean) => void;
  apiKey: string;
  onNeedApiKey: () => void;
}) {
  const [databaseQuery, setDatabaseQuery] = useState("");
  const [selectedDatabaseFood, setSelectedDatabaseFood] = useState<SelectedDatabaseFood | null>(null);
  const [showManualDetails, setShowManualDetails] = useState(Boolean(draft.editingId));
  const canSave = draft.title.trim().length > 0 && addNumber(draft.calories) > 0;
  const databaseMatches = useMemo(() => findFoodDatabaseMatches(databaseQuery, 8), [databaseQuery]);

  const applyDatabasePortion = (entry: FoodDatabaseEntry, amount: string, unit: PortionUnit) => {
    const scaled = scaleDatabaseFood(entry, amount, unit);
    setDraft((current) =>
      current
        ? {
            ...current,
            title: scaled.title,
            calories: String(scaled.calories),
            protein: String(scaled.protein),
            carbs: String(scaled.carbs),
            fat: String(scaled.fat),
            aiResult: null,
            aiError: "",
            aiStatus: "idle",
          }
        : current,
    );
  };

  const selectDatabaseFood = (entry: FoodDatabaseEntry) => {
    const details = getServingDetails(entry);
    setSelectedDatabaseFood({
      entry,
      amount: details.defaultAmount,
      unit: details.defaultUnit,
    });
    setDatabaseQuery("");
    applyDatabasePortion(entry, details.defaultAmount, details.defaultUnit);
  };

  const updateDatabasePortion = (next: Partial<Omit<SelectedDatabaseFood, "entry">>) => {
    if (!selectedDatabaseFood) {
      return;
    }

    const updated = { ...selectedDatabaseFood, ...next };
    setSelectedDatabaseFood(updated);
    applyDatabasePortion(updated.entry, updated.amount, updated.unit);
  };

  const quickAddDatabaseFood = () => {
    if (!canSave) {
      return;
    }

    onSave(true);
    setSelectedDatabaseFood(null);
    setDatabaseQuery("");
  };

  const applyAiResultToDraft = (result: ParsedMeal) => {
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
            aiError: "",
            aiStatus: "ready",
          }
        : current,
    );
  };

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
      setSelectedDatabaseFood(null);
      applyAiResultToDraft(result);
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

  const submitLog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(false);
  };

  const manualFields = (
    <>
      <label className="field-label">
        {draft.editingId ? "Food" : "Food name"}
        <input
          autoFocus={Boolean(draft.editingId)}
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
    </>
  );

  return (
      <form className="log-section" aria-label="Log Meal" onSubmit={submitLog}>
        <div className="sheet-header">
          <div>
            <p>{draft.mealName}</p>
            <h2>{draft.editingId ? "Edit food" : "Log food"}</h2>
          </div>
          <button className="sheet-close" type="button" aria-label="Close Log Sheet" onClick={onClose}>
            <X size={22} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {!draft.editingId ? (
          <section className="database-search-panel" aria-label="Food database search">
            <label className="field-label">
              Search database
              <input
                autoFocus={!draft.editingId}
                value={databaseQuery}
                onChange={(event) => setDatabaseQuery(event.target.value)}
                placeholder="Egg, banana, rice..."
              />
            </label>
            {selectedDatabaseFood ? (
              <div className="portion-card" aria-label="Selected food portion">
                <div>
                  <strong>{selectedDatabaseFood.entry.name}</strong>
                  <span>{selectedDatabaseFood.entry.serving}</span>
                </div>
                <div className="portion-controls">
                  <label className="field-label">
                    Amount
                    <input
                      inputMode="decimal"
                      value={selectedDatabaseFood.amount}
                      onChange={(event) => updateDatabasePortion({ amount: event.target.value })}
                    />
                  </label>
                  <label className="field-label">
                    Unit
                    <select
                      value={selectedDatabaseFood.unit}
                      onChange={(event) => updateDatabasePortion({ unit: event.target.value as PortionUnit })}
                    >
                      <option value="serving">{getServingDetails(selectedDatabaseFood.entry).baseLabel}</option>
                      {getServingDetails(selectedDatabaseFood.entry).grams > 0 ? <option value="g">grams</option> : null}
                    </select>
                  </label>
                </div>
                <div className="portion-summary">
                  <span>
                    {draft.calories || 0} kcal · P {draft.protein || 0}g · C {draft.carbs || 0}g · F {draft.fat || 0}g
                  </span>
                  <button className="quick-add-button" type="button" disabled={!canSave} onClick={quickAddDatabaseFood}>
                    Add
                  </button>
                </div>
              </div>
            ) : null}
            {databaseQuery.trim() ? (
              <div className="database-results" aria-label="Database matches">
                {databaseMatches.length > 0 ? (
                  databaseMatches.map((entry) => (
                    <button
                      className="database-result"
                      key={`${entry.name}-${entry.serving}`}
                      type="button"
                      onClick={() => selectDatabaseFood(entry)}
                    >
                      <span>
                        <strong>{entry.name}</strong>
                        <small>{entry.serving}</small>
                      </span>
                      <span className="database-result-nutrition">
                        <strong>{entry.calories} kcal</strong>
                        <small>
                          P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                        </small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="database-empty">No database match yet</p>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

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
                <button className="quick-add-button ai-add-button" type="button" disabled={!canSave} onClick={() => onSave(false)}>
                  Add all
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {draft.editingId ? (
          <div className="manual-details manual-details-open">{manualFields}</div>
        ) : (
          <section className="manual-entry" aria-label="Manual food details">
            <button
              className="manual-toggle"
              type="button"
              aria-expanded={showManualDetails}
              onClick={() => setShowManualDetails((current) => !current)}
            >
              <span>{showManualDetails ? "Hide manual details" : "Manual details"}</span>
              {showManualDetails ? (
                <ChevronUp size={18} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <ChevronDown size={18} strokeWidth={2.5} aria-hidden="true" />
              )}
            </button>
            {showManualDetails ? <div className="manual-details">{manualFields}</div> : null}
          </section>
        )}
      </form>
  );
}

export function App() {
  const [storedState, setStoredState] = useState<StoredState>(loadStoredState);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey());
  const [draft, setDraft] = useState<LogDraft | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState(getStoredGeminiApiKey);
  const [expandedMeal, setExpandedMeal] = useState<MealName | null>(null);
  const [activeView, setActiveView] = useState<AppView>("home");
  const frameRef = useRef<HTMLElement | null>(null);
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
    frameRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeView]);

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

  const myFoods = useMemo(() => getMyFoods(logs), [logs]);

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
    setDraft(makeEmptyLogDraft(mealName));
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

  const relogFood = (entry: MyFoodEntry) => {
    const nextLog: MealLog = {
      id: makeId(),
      kind: "meal",
      dateKey: selectedDateKey,
      loggedAt: new Date().toISOString(),
      mealName: entry.mealName,
      title: entry.title,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    };

    setStoredState((current) => ({
      ...current,
      version: CURRENT_STORAGE_VERSION,
      logs: [...current.logs, nextLog],
    }));
    setExpandedMeal(entry.mealName);
  };

  const saveLog = (keepOpen = false) => {
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
    setDraft(keepOpen ? makeEmptyLogDraft(draft.mealName) : null);
  };

  const saveTargets = ({ calorieGoal, macroGoals }: ReturnType<typeof goalsFromTargetDraft>) => {
    setStoredState((current) =>
      current.profile
        ? {
            ...current,
            version: CURRENT_STORAGE_VERSION,
            profile: {
              ...current.profile,
              calorieGoal,
              macroGoals,
            },
          }
        : current,
    );
  };

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="Bitewise home" ref={frameRef}>
        {activeView === "home" ? (
          <>
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

            {draft ? (
              <LogSheet
                draft={draft}
                setDraft={setDraft}
                onClose={() => setDraft(null)}
                onSave={saveLog}
                apiKey={geminiApiKey}
                onNeedApiKey={() => setActiveView("settings")}
              />
            ) : null}

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
          </>
        ) : activeView === "foods" ? (
          <MyFoodsSection recent={myFoods.recent} frequent={myFoods.frequent} onRelogFood={relogFood} />
        ) : (
          <SettingsScreen
            profile={profile}
            savedKey={geminiApiKey}
            onSaveTargets={saveTargets}
            onSaveApiKey={(apiKey) => {
              saveGeminiApiKey(apiKey);
              setGeminiApiKey(apiKey.trim());
            }}
            onClearApiKey={() => {
              clearGeminiApiKey();
              setGeminiApiKey("");
            }}
          />
        )}

        <BottomNavigation activeView={activeView} onChange={setActiveView} />
      </section>
    </main>
  );
}


export enum GoalType {
  WEIGHT_LOSS = 'Weight Loss',
  WEIGHT_GAIN = 'Weight Gain',
  MAINTENANCE = 'Maintenance'
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentary',
  LIGHT = 'Lightly Active',
  MODERATE = 'Moderately Active',
  ACTIVE = 'Very Active',
  EXTRA_ACTIVE = 'Elite Athlete'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  NON_BINARY = 'Non-Binary'
}

export enum UITheme {
  SUCCESS = '#86A789', // Deep Sage Green
  FOCUS = '#D2B48C',   // Warm Sand
  ALERT = '#E2725B'    // Terracotta
}

export interface MacroStats {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface HealthLogEntry {
  date: string;
  weightKg: number;
  bmi: number;
}

export interface BioFeedbackEntry {
  id: string;
  timestamp: string;
  energy: number; // 1-10
  bloating: number; // 1-10
  skinClarity: number; // 1-10
  mood: number; // 1-10
  notes?: string;
}

export interface HydrationEntry {
  id: string;
  timestamp: string;
  amount: number;
}

export interface UserProfile {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  healthGoals: string[];
  weightHistory: HealthLogEntry[];
  hydrationGoalOunces?: number;
}

export interface AuraAnalysis {
  mealName: string;
  visualizationUrl?: string; // Generated via gemini-2.5-flash-image
  stats: MacroStats;
  sustenanceScore: number; // 0-100: Plant-based/Whole vs Processed
  goalAlignment: number;
  eliteAdjustment: {
    add: string;
    reduce: string;
  };
  metabolicFlexibility: {
    stabilityRating: number; // 0-100
    forecast: string;
    proactiveProtocol: string;
  };
  metabolicPrescription: {
    dailyKcalTarget: number;
    mealFrequency: string;
    bmiDirective: string;
    focusAreas: string[];
  };
  resourceRecipe: {
    name: string;
    description: string;
    reasoning: string;
  };
  correlationAnalysis?: string; // Analysis of food vs symptoms
  insight: {
    performanceNote: string;
    quote: string;
    theme: UITheme;
  };
}

export interface PantryItem {
  id: string;
  name: string;
  isStaple?: boolean;
}

export interface MealPlanEntry {
  day: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  mealName: string;
  ingredients: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  isPurchased: boolean;
}

export interface AppState {
  userName: string;
  goal: GoalType;
  userProfile: UserProfile;
  targetKcal: number;
  targetMacros: MacroStats;
  pantry: PantryItem[];
  history: AuraAnalysis[];
  bioFeedbackHistory: BioFeedbackEntry[];
  hydrationOunces: number;
  hydrationLog: HydrationEntry[];
  isPerformanceMode: boolean;
  performancePulse: number[];
  mealPlan: MealPlanEntry[];
  shoppingList: ShoppingItem[];
}

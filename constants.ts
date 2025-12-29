
import { GoalType, MacroStats, UITheme } from './types';

export const DEFAULT_TARGETS: Record<GoalType, MacroStats & { kcal: number }> = {
  [GoalType.WEIGHT_LOSS]: { kcal: 1800, protein: 160, carbs: 150, fat: 60 },
  [GoalType.WEIGHT_GAIN]: { kcal: 3200, protein: 200, carbs: 400, fat: 80 },
  [GoalType.MAINTENANCE]: { kcal: 2400, protein: 180, carbs: 250, fat: 70 },
};

export const INITIAL_PANTRY = [
  { id: '1', name: 'Chicken Breast' },
  { id: '2', name: 'Avocado' },
  { id: '3', name: 'Greek Yogurt' },
  { id: '4', name: 'Oats' },
  { id: '5', name: 'Spinach' },
  { id: '6', name: 'Olive Oil' },
  { id: '7', name: 'Brown Rice' }
];

export const THEME_MAP: Record<string, UITheme> = {
  SUCCESS: UITheme.SUCCESS,
  FOCUS: UITheme.FOCUS,
  ALERT: UITheme.ALERT
};

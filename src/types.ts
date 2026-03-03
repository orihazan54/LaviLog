// ── Baby profile ──

export interface Baby {
  id: string;
  name: string;
  birthDate: string;
  emoji: string;
  createdAt: string;
}

export const BABY_EMOJIS = ['👶', '👧', '👦', '🧒', '👼', '🍼', '🐣', '🌟', '🦁', '🐻', '🐰', '🎀'];

// ── Regular food entry ──

export type Preference = 'loved' | 'okay' | 'refused';

export const PREFERENCE_LABELS: Record<Preference, string> = {
  loved: 'אהב',
  okay: 'בסדר',
  refused: 'סירב',
};

export const PREFERENCE_EMOJI: Record<Preference, string> = {
  loved: '😍',
  okay: '😐',
  refused: '😣',
};

export interface FoodEntry {
  id: string;
  babyId: string;
  name: string;
  quantity: string;
  timesEaten: number;
  date: string;
  isAllergenic: boolean;
  preference: Preference;
  createdAt: string;
  updatedAt: string;
}

// ── Allergen Exposure System ──

export type Symptom = 'rash' | 'vomiting' | 'fever' | 'diarrhea' | 'other';
export type Severity = 'mild' | 'moderate' | 'severe';
export type ExposureStatus = 'active' | 'completed' | 'cancelled';
export type ExposureDayStatus = 'pending' | 'completed';

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  rash: 'פריחה',
  vomiting: 'הקאה',
  fever: 'חום',
  diarrhea: 'שלשול',
  other: 'אחר',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  mild: 'קל',
  moderate: 'בינוני',
  severe: 'חמור',
};

export interface Reaction {
  symptoms: Symptom[];
  severity: Severity;
  onsetTime: string;
  notes: string;
  photoUri: string | null;
}

export interface ExposureDay {
  dayIndex: number;
  date: string;
  status: ExposureDayStatus;
  mealTime: string;
  mealDetails: string;
  amountEaten: number;
  milkSupplement: string;
  reaction: Reaction | null;
  notes: string;
}

export interface AllergenExposure {
  id: string;
  babyId: string;
  allergenName: string;
  startDate: string;
  status: ExposureStatus;
  days: [ExposureDay, ExposureDay, ExposureDay];
  createdAt: string;
  updatedAt: string;
}

// ── Calendar day color logic ──
export type CalendarDayColor = 'none' | 'blue' | 'yellow' | 'green' | 'red';

// ── Top 9 Allergens ──
export interface AllergenInfo {
  id: string;
  nameHe: string;
  emoji: string;
}

export const TOP_ALLERGENS: AllergenInfo[] = [
  { id: 'milk', nameHe: 'חלב', emoji: '🥛' },
  { id: 'eggs', nameHe: 'ביצים', emoji: '🥚' },
  { id: 'peanuts', nameHe: 'בוטנים', emoji: '🥜' },
  { id: 'tree-nuts', nameHe: 'אגוזי עץ', emoji: '🌰' },
  { id: 'wheat', nameHe: 'חיטה', emoji: '🌾' },
  { id: 'soy', nameHe: 'סויה', emoji: '🫘' },
  { id: 'fish', nameHe: 'דגים', emoji: '🐟' },
  { id: 'shellfish', nameHe: 'רכיכות', emoji: '🦐' },
  { id: 'sesame', nameHe: 'שומשום', emoji: '🫘' },
];

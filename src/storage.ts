import { FoodEntry } from './types';

const STORAGE_KEY = 'lavilog-foods';

export function loadFoods(): FoodEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFoods(foods: FoodEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
}

export function generateId(): string {
  return crypto.randomUUID();
}

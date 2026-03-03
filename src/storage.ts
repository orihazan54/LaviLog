import { Baby, FoodEntry, AllergenExposure } from './types';

const BABIES_KEY = 'lavilog-babies';
const ACTIVE_BABY_KEY = 'lavilog-active-baby';
const FOODS_KEY = 'lavilog-foods';
const EXPOSURES_KEY = 'lavilog-exposures';
const MIGRATED_KEY = 'lavilog-migrated-v2';

// ── Babies ──

export function loadBabies(): Baby[] {
  try {
    const raw = localStorage.getItem(BABIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBabies(babies: Baby[]): void {
  localStorage.setItem(BABIES_KEY, JSON.stringify(babies));
}

export function loadActiveBabyId(): string | null {
  return localStorage.getItem(ACTIVE_BABY_KEY);
}

export function saveActiveBabyId(id: string): void {
  localStorage.setItem(ACTIVE_BABY_KEY, id);
}

// ── Foods ──

export function loadFoods(): FoodEntry[] {
  try {
    const raw = localStorage.getItem(FOODS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFoods(foods: FoodEntry[]): void {
  localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
}

// ── Exposures ──

export function loadExposures(): AllergenExposure[] {
  try {
    const raw = localStorage.getItem(EXPOSURES_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem('lavilog-trials');
    if (legacy) return JSON.parse(legacy);
    return [];
  } catch {
    return [];
  }
}

export function saveExposures(exposures: AllergenExposure[]): void {
  localStorage.setItem(EXPOSURES_KEY, JSON.stringify(exposures));
}

// ── Shared ──

export function generateId(): string {
  return crypto.randomUUID();
}

// ── Migration: assign babyId to orphan entries ──

export function migrateToMultiBaby(): { babies: Baby[]; foods: FoodEntry[]; exposures: AllergenExposure[]; activeBabyId: string } {
  const babies = loadBabies();
  const foods = loadFoods();
  const exposures = loadExposures();
  const alreadyMigrated = localStorage.getItem(MIGRATED_KEY) === '1';

  if (alreadyMigrated && babies.length > 0) {
    const activeBabyId = loadActiveBabyId() ?? babies[0].id;
    return { babies, foods, exposures, activeBabyId };
  }

  const hasOrphanData = foods.some((f) => !f.babyId) || exposures.some((e) => !e.babyId);

  if (hasOrphanData || (babies.length === 0 && (foods.length > 0 || exposures.length > 0))) {
    const defaultBaby: Baby = {
      id: generateId(),
      name: 'התינוק שלי',
      birthDate: '',
      emoji: '👶',
      createdAt: new Date().toISOString(),
    };
    const migratedFoods = foods.map((f) => f.babyId ? f : { ...f, babyId: defaultBaby.id });
    const migratedExposures = exposures.map((e) => e.babyId ? e : { ...e, babyId: defaultBaby.id });
    const allBabies = babies.length === 0 ? [defaultBaby] : babies;

    saveBabies(allBabies);
    saveFoods(migratedFoods);
    saveExposures(migratedExposures);
    localStorage.setItem(MIGRATED_KEY, '1');

    return { babies: allBabies, foods: migratedFoods, exposures: migratedExposures, activeBabyId: defaultBaby.id };
  }

  if (babies.length > 0) {
    localStorage.setItem(MIGRATED_KEY, '1');
    const activeBabyId = loadActiveBabyId() ?? babies[0].id;
    return { babies, foods, exposures, activeBabyId };
  }

  return { babies: [], foods: [], exposures: [], activeBabyId: '' };
}

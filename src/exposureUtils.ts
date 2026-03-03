import { AllergenExposure, CalendarDayColor, FoodEntry, ExposureDay } from './types';
import { toDateString } from './utils';

export function getActiveExposure(exposures: AllergenExposure[]): AllergenExposure | null {
  return exposures.find((e) => e.status === 'active') ?? null;
}

export function createExposureDays(startDate: string): [ExposureDay, ExposureDay, ExposureDay] {
  const base = new Date(startDate + 'T00:00:00');
  return [0, 1, 2].map((i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return {
      dayIndex: i,
      date: toDateString(d),
      status: 'pending' as const,
      mealTime: '',
      mealDetails: '',
      amountEaten: 0,
      milkSupplement: '',
      reaction: null,
      notes: '',
    };
  }) as [ExposureDay, ExposureDay, ExposureDay];
}

export function exposureHasReaction(exposure: AllergenExposure): boolean {
  return exposure.days.some((d) => d.reaction !== null && d.reaction.symptoms.length > 0);
}

export function isExposureComplete(exposure: AllergenExposure): boolean {
  return exposure.days.every((d) => d.status === 'completed');
}

export function getDayColor(
  dateStr: string,
  exposures: AllergenExposure[],
  foods: FoodEntry[]
): CalendarDayColor {
  for (const exp of exposures) {
    if (exp.status === 'cancelled') continue;
    const expDay = exp.days.find((d) => d.date === dateStr);
    if (!expDay) continue;

    if (expDay.reaction && expDay.reaction.symptoms.length > 0) return 'red';
    if (exp.status === 'active') return 'yellow';
    if (exp.status === 'completed') {
      if (exposureHasReaction(exp)) return 'red';
      return 'green';
    }
  }

  const hasFood = foods.some((f) => f.date === dateStr);
  if (hasFood) return 'blue';

  return 'none';
}

export function getExposureForDate(
  dateStr: string,
  exposures: AllergenExposure[]
): { exposure: AllergenExposure; dayIndex: number } | null {
  for (const exp of exposures) {
    if (exp.status === 'cancelled') continue;
    const idx = exp.days.findIndex((d) => d.date === dateStr);
    if (idx !== -1) return { exposure: exp, dayIndex: idx };
  }
  return null;
}

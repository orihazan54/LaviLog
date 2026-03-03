import { useMemo } from 'react';
import { FoodEntry, AllergenExposure } from '../types';
import { exposureHasReaction } from '../exposureUtils';

interface StatsProps {
  foods: FoodEntry[];
  exposures: AllergenExposure[];
}

export function Stats({ foods, exposures }: StatsProps) {
  const stats = useMemo(() => {
    const uniqueFoods = new Set(foods.map((f) => f.name.toLowerCase()));
    const totalMeals = foods.reduce((sum, f) => sum + f.timesEaten, 0);
    const completedExposures = exposures.filter((e) => e.status === 'completed').length;
    const reactionsCount = exposures.filter((e) => exposureHasReaction(e)).length;

    return { uniqueFoods: uniqueFoods.size, totalMeals, completedExposures, reactionsCount };
  }, [foods, exposures]);

  return (
    <div className="stats">
      <div className="stat-card">
        <span className="stat-icon">🍽️</span>
        <span className="stat-value">{stats.uniqueFoods}</span>
        <span className="stat-label">סוגי מאכלים</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon">🥣</span>
        <span className="stat-value">{stats.totalMeals}</span>
        <span className="stat-label">ארוחות</span>
      </div>
      <div className="stat-card exposure-stat">
        <span className="stat-icon">🧪</span>
        <span className="stat-value">{stats.completedExposures}</span>
        <span className="stat-label">חשיפות הושלמו</span>
      </div>
      <div className={`stat-card${stats.reactionsCount > 0 ? ' reaction-stat' : ''}`}>
        <span className="stat-icon">{stats.reactionsCount > 0 ? '⚠️' : '✅'}</span>
        <span className="stat-value">{stats.reactionsCount}</span>
        <span className="stat-label">תגובות</span>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { FoodEntry } from '../types';

interface StatsProps {
  foods: FoodEntry[];
}

export function Stats({ foods }: StatsProps) {
  const stats = useMemo(() => {
    const uniqueFoods = new Set(foods.map((f) => f.name.toLowerCase()));
    const totalMeals = foods.reduce((sum, f) => sum + f.timesEaten, 0);
    const uniqueDays = new Set(foods.map((f) => f.date));
    return {
      totalEntries: foods.length,
      uniqueFoods: uniqueFoods.size,
      totalMeals,
      activeDays: uniqueDays.size,
    };
  }, [foods]);

  return (
    <div className="stats">
      <div className="stat-card">
        <span className="stat-value">{stats.uniqueFoods}</span>
        <span className="stat-label">סוגי מאכלים</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.totalEntries}</span>
        <span className="stat-label">רשומות</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.totalMeals}</span>
        <span className="stat-label">ארוחות</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.activeDays}</span>
        <span className="stat-label">ימים פעילים</span>
      </div>
    </div>
  );
}

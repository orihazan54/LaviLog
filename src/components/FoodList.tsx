import { useMemo } from 'react';
import { FoodEntry, PREFERENCE_EMOJI } from '../types';
import { formatDateHebrew } from '../utils';
import { getFoodEmoji } from '../foodIcons';

interface FoodListProps {
  foods: FoodEntry[];
  onEdit: (food: FoodEntry) => void;
  onDelete: (id: string) => void;
}

export function FoodList({ foods, onEdit, onDelete }: FoodListProps) {
  const grouped = useMemo(() => {
    const sorted = [...foods].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const groups: { date: string; label: string; items: FoodEntry[] }[] = [];
    for (const food of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.date === food.date) {
        last.items.push(food);
      } else {
        groups.push({ date: food.date, label: formatDateHebrew(food.date), items: [food] });
      }
    }
    return groups;
  }, [foods]);

  if (foods.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🥄</span>
        <h3>עדיין לא נוספו מאכלים</h3>
        <p>התחילו על ידי הוספת המאכל הראשון למעלה!</p>
      </div>
    );
  }

  return (
    <div className="food-timeline">
      <h2 className="timeline-title">יומן מאכלים ({foods.length})</h2>
      {grouped.map((group) => (
        <div key={group.date} className="timeline-group">
          <div className="timeline-date-row">
            <span className="timeline-dot" />
            <span className="timeline-date">{group.label}</span>
          </div>
          <div className="timeline-items">
            {group.items.map((food) => (
              <div key={food.id} className={`food-card${food.isAllergenic ? ' allergenic' : ''}`}>
                <div className="food-card-emoji">{getFoodEmoji(food.name)}</div>
                <div className="food-card-body">
                  <div className="food-card-top">
                    <span className="food-card-name">{food.name}</span>
                    <span className="food-card-pref">{PREFERENCE_EMOJI[food.preference ?? 'okay']}</span>
                    <div className="food-card-badges">
                      {food.isAllergenic && <span className="badge badge-allergen">⚠️</span>}
                      <span className="badge badge-count">{food.timesEaten}x</span>
                    </div>
                  </div>
                  {food.quantity && (
                    <div className="food-card-bottom">
                      <span className="food-card-qty">{food.quantity}</span>
                    </div>
                  )}
                </div>
                <div className="food-card-actions">
                  <button className="icon-btn edit" onClick={() => onEdit(food)} title="עריכה">✏️</button>
                  <button className="icon-btn delete" onClick={() => onDelete(food.id)} title="מחיקה">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

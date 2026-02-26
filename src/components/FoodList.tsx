import { FoodEntry } from '../types';
import { FoodCard } from './FoodCard';

interface FoodListProps {
  foods: FoodEntry[];
  onEdit: (food: FoodEntry) => void;
  onDelete: (id: string) => void;
}

export function FoodList({ foods, onEdit, onDelete }: FoodListProps) {
  if (foods.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🥄</span>
        <h3>No foods tracked yet</h3>
        <p>Start by adding your baby's first food above!</p>
      </div>
    );
  }

  return (
    <div className="food-list">
      <h2>Food Log ({foods.length})</h2>
      <div className="food-grid">
        {foods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onEdit={() => onEdit(food)}
            onDelete={() => onDelete(food.id)}
          />
        ))}
      </div>
    </div>
  );
}

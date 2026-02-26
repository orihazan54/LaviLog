import { FoodEntry } from '../types';

interface FoodCardProps {
  food: FoodEntry;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FoodCard({ food, onEdit, onDelete }: FoodCardProps) {
  return (
    <div className="food-card">
      <div className="food-card-header">
        <h3>{food.name}</h3>
        <span className="times-badge">{food.timesEaten}x</span>
      </div>

      {food.quantity && (
        <p className="food-quantity">{food.quantity}</p>
      )}

      <p className="food-date">Added {formatDate(food.createdAt)}</p>

      <div className="food-card-actions">
        <button className="btn btn-sm btn-edit" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-sm btn-delete" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

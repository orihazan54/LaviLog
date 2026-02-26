import { useState, useEffect, FormEvent } from 'react';
import { FoodEntry } from '../types';

interface FoodFormProps {
  onSubmit: (name: string, quantity: string, timesEaten: number) => void;
  editingFood: FoodEntry | null;
  onCancelEdit: () => void;
}

export function FoodForm({ onSubmit, editingFood, onCancelEdit }: FoodFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [timesEaten, setTimesEaten] = useState(1);

  useEffect(() => {
    if (editingFood) {
      setName(editingFood.name);
      setQuantity(editingFood.quantity);
      setTimesEaten(editingFood.timesEaten);
    } else {
      setName('');
      setQuantity('');
      setTimesEaten(1);
    }
  }, [editingFood]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), quantity.trim(), timesEaten);
    if (!editingFood) {
      setName('');
      setQuantity('');
      setTimesEaten(1);
    }
  };

  return (
    <form className="food-form" onSubmit={handleSubmit}>
      <h2>{editingFood ? 'Edit Food' : 'Add New Food'}</h2>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="food-name">Food Name</label>
          <input
            id="food-name"
            type="text"
            placeholder="e.g. Sweet Potato"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="food-quantity">Quantity</label>
          <input
            id="food-quantity"
            type="text"
            placeholder="e.g. 2 spoons, 100ml"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="food-times">Times Eaten</label>
          <input
            id="food-times"
            type="number"
            min="1"
            value={timesEaten}
            onChange={(e) => setTimesEaten(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {editingFood ? 'Update' : 'Add Food'}
        </button>
        {editingFood && (
          <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

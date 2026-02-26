import { useState, FormEvent } from 'react';
import { FoodEntry } from '../types';
import { formatDateHebrew } from '../utils';

interface DayModalProps {
  date: string;
  foods: FoodEntry[];
  onAdd: (name: string, quantity: string, timesEaten: number) => void;
  onEdit: (food: FoodEntry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function DayModal({ date, foods, onAdd, onEdit, onDelete, onClose }: DayModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [timesEaten, setTimesEaten] = useState(1);

  const resetForm = () => {
    setName('');
    setQuantity('');
    setTimesEaten(1);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmitAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), quantity.trim(), timesEaten);
    resetForm();
  };

  const handleStartEdit = (food: FoodEntry) => {
    setEditingId(food.id);
    setName(food.name);
    setQuantity(food.quantity);
    setTimesEaten(food.timesEaten);
    setIsAdding(false);
  };

  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    const food = foods.find((f) => f.id === editingId);
    if (!food) return;
    onEdit({ ...food, name: name.trim(), quantity: quantity.trim(), timesEaten });
    resetForm();
  };

  const dayFoods = foods.filter((f) => f.date === date);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formatDateHebrew(date)}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {dayFoods.length === 0 && !isAdding && (
            <p className="modal-empty">אין מאכלים ביום הזה</p>
          )}

          {dayFoods.map((food) =>
            editingId === food.id ? (
              <form key={food.id} className="modal-form" onSubmit={handleSubmitEdit}>
                <input
                  type="text"
                  placeholder="שם המאכל"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
                <div className="modal-form-row">
                  <input
                    type="text"
                    placeholder="כמות"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    value={timesEaten}
                    onChange={(e) => setTimesEaten(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="modal-form-actions">
                  <button type="submit" className="btn btn-primary btn-sm">שמירה</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>ביטול</button>
                </div>
              </form>
            ) : (
              <div key={food.id} className="modal-food-item">
                <div className="modal-food-info">
                  <span className="modal-food-name">{food.name}</span>
                  <span className="modal-food-meta">
                    {food.quantity && `${food.quantity} · `}{food.timesEaten} פעמים
                  </span>
                </div>
                <div className="modal-food-actions">
                  <button className="btn btn-sm btn-edit" onClick={() => handleStartEdit(food)}>עריכה</button>
                  <button className="btn btn-sm btn-delete" onClick={() => onDelete(food.id)}>מחיקה</button>
                </div>
              </div>
            )
          )}

          {isAdding && (
            <form className="modal-form" onSubmit={handleSubmitAdd}>
              <input
                type="text"
                placeholder="שם המאכל"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <div className="modal-form-row">
                <input
                  type="text"
                  placeholder="כמות (לדוגמה: 2 כפות)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="פעמים"
                  value={timesEaten}
                  onChange={(e) => setTimesEaten(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="modal-form-actions">
                <button type="submit" className="btn btn-primary btn-sm">הוספה</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>ביטול</button>
              </div>
            </form>
          )}
        </div>

        {!isAdding && !editingId && (
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={() => { resetForm(); setIsAdding(true); }}>
              + הוספת מאכל
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

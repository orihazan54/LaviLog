import { useState, FormEvent } from 'react';
import { FoodEntry, AllergenExposure, Preference, PREFERENCE_EMOJI, SYMPTOM_LABELS, SEVERITY_LABELS } from '../types';
import { formatDateHebrew } from '../utils';
import { getFoodEmoji, isCommonAllergen } from '../foodIcons';
import { getExposureForDate } from '../exposureUtils';

interface DayModalProps {
  date: string;
  foods: FoodEntry[];
  exposures: AllergenExposure[];
  onAdd: (name: string, quantity: string, timesEaten: number, isAllergenic: boolean, preference: Preference) => void;
  onEdit: (food: FoodEntry) => void;
  onDelete: (id: string) => void;
  onOpenExposureDay: (exposureId: string, dayIndex: number) => void;
  onClose: () => void;
}

export function DayModal({
  date, foods, exposures,
  onAdd, onEdit, onDelete, onOpenExposureDay, onClose,
}: DayModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [timesEaten, setTimesEaten] = useState(1);
  const [isAllergenic, setIsAllergenic] = useState(false);
  const [preference, setPreference] = useState<Preference>('okay');

  const resetForm = () => {
    setName(''); setQuantity(''); setTimesEaten(1); setIsAllergenic(false);
    setPreference('okay'); setIsAdding(false); setEditingId(null);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingId && value.length > 1) setIsAllergenic(isCommonAllergen(value));
  };

  const handleSubmitAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), quantity.trim(), timesEaten, isAllergenic, preference);
    resetForm();
  };

  const handleStartEdit = (food: FoodEntry) => {
    setEditingId(food.id); setName(food.name); setQuantity(food.quantity);
    setTimesEaten(food.timesEaten); setIsAllergenic(food.isAllergenic);
    setPreference(food.preference ?? 'okay'); setIsAdding(false);
  };

  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    const food = foods.find((f) => f.id === editingId);
    if (!food) return;
    onEdit({ ...food, name: name.trim(), quantity: quantity.trim(), timesEaten, isAllergenic, preference });
    resetForm();
  };

  const dayFoods = foods.filter((f) => f.date === date);
  const expInfo = getExposureForDate(date, exposures);

  const renderForm = (onSubmit: (e: FormEvent) => void, submitLabel: string) => (
    <form className="modal-form" onSubmit={onSubmit}>
      <input type="text" placeholder="שם המאכל" value={name}
        onChange={(e) => handleNameChange(e.target.value)} autoFocus required />
      <div className="modal-form-row">
        <input type="text" placeholder="כמות" value={quantity}
          onChange={(e) => setQuantity(e.target.value)} />
        <input type="number" min="1" placeholder="פעמים" value={timesEaten}
          onChange={(e) => setTimesEaten(Math.max(1, parseInt(e.target.value) || 1))} />
      </div>
      <div className="modal-pref-row">
        {(['loved', 'okay', 'refused'] as Preference[]).map((p) => (
          <button key={p} type="button"
            className={`pref-btn-sm${preference === p ? ` active pref-${p}` : ''}`}
            onClick={() => setPreference(p)}>{PREFERENCE_EMOJI[p]}</button>
        ))}
      </div>
      <div className="modal-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">{submitLabel}</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>ביטול</button>
      </div>
    </form>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formatDateHebrew(date)}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {expInfo && (
            <div className={`day-exposure-card ${expInfo.exposure.status}`}
              onClick={() => onOpenExposureDay(expInfo.exposure.id, expInfo.dayIndex)}>
              <div className="day-exposure-card-header">
                <span>{getFoodEmoji(expInfo.exposure.allergenName)}</span>
                <div>
                  <strong>חשיפה: {expInfo.exposure.allergenName}</strong>
                  <span className="day-exposure-card-day">יום {expInfo.dayIndex + 1}/3</span>
                </div>
                <span className={`day-exposure-status-badge ${expInfo.exposure.days[expInfo.dayIndex].status}`}>
                  {expInfo.exposure.days[expInfo.dayIndex].status === 'completed' ? 'הושלם' : 'ממתין'}
                </span>
              </div>
              {expInfo.exposure.days[expInfo.dayIndex].reaction && (
                <div className="day-exposure-reaction-summary">
                  ⚠️ תגובה:{' '}
                  {expInfo.exposure.days[expInfo.dayIndex].reaction!.symptoms.map((s) => SYMPTOM_LABELS[s]).join(', ')}
                  {' '}({SEVERITY_LABELS[expInfo.exposure.days[expInfo.dayIndex].reaction!.severity]})
                </div>
              )}
            </div>
          )}

          {dayFoods.length === 0 && !expInfo && !isAdding && (
            <p className="modal-empty">אין מאכלים ביום הזה</p>
          )}

          {dayFoods.map((food) =>
            editingId === food.id ? (
              <div key={food.id}>{renderForm(handleSubmitEdit, 'שמירה')}</div>
            ) : (
              <div key={food.id} className={`modal-food-item${food.isAllergenic ? ' allergenic' : ''}`}>
                <span className="modal-food-emoji">{getFoodEmoji(food.name)}</span>
                <div className="modal-food-info">
                  <span className="modal-food-name">
                    {food.name} {PREFERENCE_EMOJI[food.preference ?? 'okay']}
                    {food.isAllergenic && <span className="mini-badge-allergen">⚠️</span>}
                  </span>
                  <span className="modal-food-meta">
                    {food.quantity && `${food.quantity} · `}{food.timesEaten} פעמים
                  </span>
                </div>
                <div className="modal-food-actions">
                  <button className="icon-btn edit" onClick={() => handleStartEdit(food)}>✏️</button>
                  <button className="icon-btn delete" onClick={() => onDelete(food.id)}>🗑️</button>
                </div>
              </div>
            )
          )}

          {isAdding && renderForm(handleSubmitAdd, 'הוספה')}
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

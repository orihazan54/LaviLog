import { useState, FormEvent } from 'react';
import { FoodEntry, Preference, PREFERENCE_EMOJI } from '../types';
import { todayString } from '../utils';
import { getFoodEmoji, isCommonAllergen } from '../foodIcons';

interface FoodFormProps {
  onSubmit: (name: string, quantity: string, timesEaten: number, date: string, isAllergenic: boolean, preference: Preference) => void;
  editingFood: FoodEntry | null;
  onCancelEdit: () => void;
}

const PREF_OPTIONS: { value: Preference; label: string }[] = [
  { value: 'loved', label: 'אהב' },
  { value: 'okay', label: 'בסדר' },
  { value: 'refused', label: 'סירב' },
];

export function FoodForm({ onSubmit, editingFood, onCancelEdit }: FoodFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [timesEatenStr, setTimesEatenStr] = useState('1');
  const [date, setDate] = useState(todayString());
  const [isAllergenic, setIsAllergenic] = useState(false);
  const [preference, setPreference] = useState<Preference>('okay');

  const fillForm = (food: FoodEntry) => {
    setName(food.name); setQuantity(food.quantity);
    setTimesEatenStr(String(food.timesEaten));
    setDate(food.date); setIsAllergenic(food.isAllergenic);
    setPreference(food.preference ?? 'okay');
  };

  const resetForm = () => {
    setName(''); setQuantity(''); setTimesEatenStr('1');
    setDate(todayString()); setIsAllergenic(false); setPreference('okay');
  };

  const prevEditId = useState<string | null>(null);
  if (editingFood && editingFood.id !== prevEditId[0]) {
    prevEditId[1](editingFood.id); fillForm(editingFood);
  } else if (!editingFood && prevEditId[0] !== null) {
    prevEditId[1](null); resetForm();
  }

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingFood && value.length > 1) setIsAllergenic(isCommonAllergen(value));
  };

  const handleTimesChange = (value: string) => {
    setTimesEatenStr(value);
  };

  const handleTimesBlur = () => {
    const parsed = parseInt(timesEatenStr);
    if (isNaN(parsed) || parsed < 1) {
      setTimesEatenStr('1');
    } else {
      setTimesEatenStr(String(parsed));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalTimes = Math.max(1, parseInt(timesEatenStr) || 1);
    onSubmit(name.trim(), quantity.trim(), finalTimes, date, isAllergenic, preference);
    if (!editingFood) resetForm();
  };

  const emoji = name.length > 1 ? getFoodEmoji(name) : '🍽️';

  return (
    <form className="food-form" onSubmit={handleSubmit}>
      <div className="form-title-row">
        <span className="form-emoji">{emoji}</span>
        <h2>{editingFood ? 'עריכת מאכל' : 'הוספת מאכל חדש'}</h2>
      </div>

      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="food-name">שם המאכל</label>
          <input id="food-name" type="text" placeholder="לדוגמה: בטטה, אורז, יוגורט..."
            value={name} onChange={(e) => handleNameChange(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="food-date">תאריך</label>
          <input id="food-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="food-quantity">כמות</label>
          <input id="food-quantity" type="text" placeholder="2 כפות, 100 מ״ל..."
            value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="food-times">מספר פעמים</label>
          <input id="food-times" type="number" min="1" value={timesEatenStr}
            onChange={(e) => handleTimesChange(e.target.value)}
            onBlur={handleTimesBlur}
            inputMode="numeric" />
        </div>

        <div className="form-group full-width">
          <label>איך אהב?</label>
          <div className="preference-selector">
            {PREF_OPTIONS.map((opt) => (
              <button key={opt.value} type="button"
                className={`pref-btn${preference === opt.value ? ` active pref-${opt.value}` : ''}`}
                onClick={() => setPreference(opt.value)}>
                <span>{PREFERENCE_EMOJI[opt.value]}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group full-width">
          <div className={`allergen-toggle${isAllergenic ? ' active' : ''}`}
            onClick={() => setIsAllergenic(!isAllergenic)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsAllergenic(!isAllergenic); }}>
            <span className="allergen-toggle-icon">{isAllergenic ? '⚠️' : '✅'}</span>
            <span className="allergen-toggle-text">{isAllergenic ? 'מאכל אלרגני' : 'לא אלרגני'}</span>
            <span className="allergen-toggle-switch"><span className="allergen-toggle-knob" /></span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{editingFood ? 'עדכון' : 'הוספה'}</button>
        {editingFood && (
          <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>ביטול</button>
        )}
      </div>
    </form>
  );
}

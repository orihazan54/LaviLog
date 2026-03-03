import { useState, FormEvent } from 'react';
import { AllergenExposure, Reaction, Severity, Symptom, ExposureDay, SYMPTOM_LABELS, SEVERITY_LABELS } from '../types';
import { formatDateHebrew } from '../utils';
import { getFoodEmoji } from '../foodIcons';

interface ExposureDayFormProps {
  exposure: AllergenExposure;
  dayIndex: number;
  onSave: (updated: AllergenExposure) => void;
  onClose: () => void;
}

const ALL_SYMPTOMS: Symptom[] = ['rash', 'vomiting', 'fever', 'diarrhea', 'other'];
const ALL_SEVERITIES: Severity[] = ['mild', 'moderate', 'severe'];

export function ExposureDayForm({ exposure, dayIndex, onSave, onClose }: ExposureDayFormProps) {
  const day = exposure.days[dayIndex];

  const [mealTime, setMealTime] = useState(day.mealTime || '');
  const [mealDetails, setMealDetails] = useState(day.mealDetails || '');
  const [amountEaten, setAmountEaten] = useState(day.amountEaten || 50);
  const [milkSupplement, setMilkSupplement] = useState(day.milkSupplement || '');
  const [notes, setNotes] = useState(day.notes || '');

  const [hasReaction, setHasReaction] = useState(day.reaction !== null);
  const [symptoms, setSymptoms] = useState<Symptom[]>(day.reaction?.symptoms ?? []);
  const [severity, setSeverity] = useState<Severity>(day.reaction?.severity ?? 'mild');
  const [onsetTime, setOnsetTime] = useState(day.reaction?.onsetTime ?? '');
  const [reactionNotes, setReactionNotes] = useState(day.reaction?.notes ?? '');

  const toggleSymptom = (s: Symptom) => {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    let reaction: Reaction | null = null;
    if (hasReaction && symptoms.length > 0) {
      reaction = { symptoms, severity, onsetTime, notes: reactionNotes, photoUri: null };
    }

    const updatedDay: ExposureDay = {
      ...day, status: 'completed', mealTime, mealDetails, amountEaten, milkSupplement, notes, reaction,
    };

    const updatedDays = [...exposure.days] as [ExposureDay, ExposureDay, ExposureDay];
    updatedDays[dayIndex] = updatedDay;
    const allDone = updatedDays.every((d) => d.status === 'completed');

    onSave({
      ...exposure,
      days: updatedDays,
      status: allDone ? 'completed' : 'active',
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal exposure-day-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="exposure-day-modal-title">
            <span>{getFoodEmoji(exposure.allergenName)}</span>
            <div>
              <h2>יום {dayIndex + 1}/3 — {exposure.allergenName}</h2>
              <span className="exposure-day-modal-date">{formatDateHebrew(day.date)}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body exposure-form" onSubmit={handleSubmit}>
          <section className="exposure-section">
            <h3>פרטי הארוחה</h3>
            <div className="exposure-form-grid">
              <div className="form-group">
                <label>שעת הארוחה</label>
                <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} />
              </div>
              <div className="form-group">
                <label>תוסף חלב</label>
                <input type="text" placeholder="לדוגמה: 60 מ״ל" value={milkSupplement}
                  onChange={(e) => setMilkSupplement(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>פירוט הארוחה</label>
              <input type="text" placeholder="מה הילד אכל?" value={mealDetails}
                onChange={(e) => setMealDetails(e.target.value)} />
            </div>
            <div className="form-group">
              <label>כמה אכל? ({amountEaten}%)</label>
              <input type="range" min="0" max="100" step="5" value={amountEaten}
                onChange={(e) => setAmountEaten(Number(e.target.value))} className="amount-slider" />
              <div className="amount-labels"><span>0%</span><span>50%</span><span>100%</span></div>
            </div>
            <div className="form-group">
              <label>הערות</label>
              <input type="text" placeholder="הערות נוספות..." value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </div>
          </section>

          <section className="exposure-section">
            <div className="reaction-header">
              <h3>תגובה אלרגית</h3>
              <div className={`allergen-toggle compact${hasReaction ? ' active' : ''}`}
                onClick={() => setHasReaction(!hasReaction)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setHasReaction(!hasReaction); }}>
                <span className="allergen-toggle-text">{hasReaction ? 'יש תגובה' : 'אין תגובה'}</span>
                <span className="allergen-toggle-switch"><span className="allergen-toggle-knob" /></span>
              </div>
            </div>

            {hasReaction && (
              <div className="reaction-fields">
                <div className="form-group">
                  <label>תסמינים</label>
                  <div className="symptom-chips">
                    {ALL_SYMPTOMS.map((s) => (
                      <button key={s} type="button" className={`chip${symptoms.includes(s) ? ' selected' : ''}`}
                        onClick={() => toggleSymptom(s)}>{SYMPTOM_LABELS[s]}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>חומרה</label>
                  <div className="severity-pills">
                    {ALL_SEVERITIES.map((s) => (
                      <button key={s} type="button" className={`pill pill-${s}${severity === s ? ' selected' : ''}`}
                        onClick={() => setSeverity(s)}>{SEVERITY_LABELS[s]}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>שעת הופעת התגובה</label>
                  <input type="time" value={onsetTime} onChange={(e) => setOnsetTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>הערות על התגובה</label>
                  <input type="text" placeholder="תיאור נוסף..." value={reactionNotes}
                    onChange={(e) => setReactionNotes(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>תמונה (בקרוב)</label>
                  <div className="photo-stub">📷 צירוף תמונה — יתווסף בגרסה הבאה</div>
                </div>
              </div>
            )}
          </section>

          <div className="exposure-form-actions">
            <button type="submit" className="btn btn-primary">שמירה</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

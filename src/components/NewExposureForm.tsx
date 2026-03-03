import { useState, FormEvent } from 'react';
import { todayString } from '../utils';
import { getFoodEmoji } from '../foodIcons';

interface NewExposureFormProps {
  onStart: (allergenName: string, startDate: string) => void;
  onClose: () => void;
  initialName?: string;
}

export function NewExposureForm({ onStart, onClose, initialName = '' }: NewExposureFormProps) {
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState(todayString());

  const emoji = name.length > 1 ? getFoodEmoji(name) : '⚠️';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate) return;
    onStart(name.trim(), startDate);
  };

  const endDate = (() => {
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  })();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal new-exposure-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>התחלת חשיפה לאלרגן</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="new-exposure-preview">
            <span className="new-exposure-emoji">{emoji}</span>
            {name.length > 1 && <span className="new-exposure-name">{name}</span>}
          </div>

          <div className="form-group">
            <label>שם האלרגן</label>
            <input
              type="text"
              placeholder="לדוגמה: ביצה, בוטנים, חלב..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>תאריך התחלה</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="exposure-preview-info">
            <p>המעקב יימשך <strong>3 ימים רצופים</strong> ויסתיים ב-{endDate}.</p>
            <p>בכל יום תתבקשו לתעד את הארוחה ולדווח על תגובות.</p>
          </div>

          <div className="exposure-form-actions">
            <button type="submit" className="btn btn-primary">התחלת חשיפה</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

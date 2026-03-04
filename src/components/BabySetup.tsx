import { useState, FormEvent } from 'react';
import { Baby, BABY_EMOJIS } from '../types';
import { generateId } from '../storage';

interface BabySetupProps {
  babies: Baby[];
  onSave: (babies: Baby[], activeBabyId: string) => void;
  onDeleteBaby: (babyId: string) => void;
  onClose: () => void;
  isOnboarding?: boolean;
  isInline?: boolean;
}

export function BabySetup({ babies, onSave, onDeleteBaby, onClose, isOnboarding = false, isInline = false }: BabySetupProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emoji, setEmoji] = useState('👶');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const updated = babies.map((b) =>
        b.id === editingId ? { ...b, name: name.trim(), birthDate, emoji } : b
      );
      onSave(updated, editingId);
    } else {
      const newBaby: Baby = {
        id: generateId(),
        name: name.trim(),
        birthDate,
        emoji,
        createdAt: new Date().toISOString(),
      };
      onSave([...babies, newBaby], newBaby.id);
    }
    resetForm();
  };

  const handleEdit = (baby: Baby) => {
    setEditingId(baby.id);
    setName(baby.name);
    setBirthDate(baby.birthDate);
    setEmoji(baby.emoji);
    setConfirmDeleteId(null);
  };

  const handleDelete = (id: string) => {
    onDeleteBaby(id);
    if (editingId === id) resetForm();
    setConfirmDeleteId(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBirthDate('');
    setEmoji('👶');
    setConfirmDeleteId(null);
  };

  const content = (
    <div className="baby-setup-content">
      {!isOnboarding && babies.length > 0 && (
        <div className="baby-setup-list">
          {babies.map((baby) => (
            <div key={baby.id} className={`baby-setup-item${editingId === baby.id ? ' editing' : ''}${confirmDeleteId === baby.id ? ' confirm-delete' : ''}`}>
              {confirmDeleteId === baby.id ? (
                <div className="baby-delete-confirm">
                  <p>למחוק את <strong>{baby.emoji} {baby.name}</strong> וכל הנתונים שלו?</p>
                  <div className="baby-delete-confirm-actions">
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(baby.id)}>כן, מחק</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>ביטול</button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="baby-setup-item-emoji">{baby.emoji}</span>
                  <div className="baby-setup-item-info">
                    <span className="baby-setup-item-name">{baby.name}</span>
                    {baby.birthDate && (
                      <span className="baby-setup-item-date">
                        {new Date(baby.birthDate + 'T00:00:00').toLocaleDateString('he-IL')}
                      </span>
                    )}
                  </div>
                  <div className="baby-setup-item-actions">
                    <button className="icon-btn edit" onClick={() => handleEdit(baby)}>✏️</button>
                    <button className="icon-btn delete" onClick={() => setConfirmDeleteId(baby.id)}>🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <form className="baby-setup-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'עריכת תינוק' : (isOnboarding ? 'הוסיפו את התינוק שלכם' : 'הוספת תינוק')}</h3>

        <div className="emoji-selector">
          {BABY_EMOJIS.map((e) => (
            <button key={e} type="button"
              className={`emoji-option${emoji === e ? ' active' : ''}`}
              onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label>שם התינוק</label>
          <input type="text" placeholder="לדוגמה: לביא, נועה..." value={name}
            onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>

        <div className="form-group">
          <label>תאריך לידה (אופציונלי)</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>

        <div className="baby-setup-form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'עדכון' : (isOnboarding ? 'בואו נתחיל!' : 'הוספה')}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>ביטול</button>
          )}
        </div>
      </form>
    </div>
  );

  if (isOnboarding) {
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <span className="onboarding-logo">🍼</span>
          <h1>ברוכים הבאים ל-LaviLog</h1>
          <p>מעקב אוכל וחשיפות לתינוק</p>
          {content}
        </div>
      </div>
    );
  }

  if (isInline) {
    return (
      <div className="settings-card">
        {content}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal baby-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ניהול תינוקות</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {content}
        </div>
      </div>
    </div>
  );
}

import { AllergenExposure } from '../types';
import { exposureHasReaction } from '../exposureUtils';
import { formatDateHebrew } from '../utils';
import { getFoodEmoji } from '../foodIcons';

interface ExposureBannerProps {
  exposure: AllergenExposure;
  onLogDay: (dayIndex: number) => void;
  onCancel: () => void;
  onCompleteAll?: () => void;
}

export function ExposureBanner({ exposure, onLogDay, onCancel, onCompleteAll }: ExposureBannerProps) {
  const completedCount = exposure.days.filter((d) => d.status === 'completed').length;
  const hasReaction = exposureHasReaction(exposure);
  const emoji = getFoodEmoji(exposure.allergenName);

  return (
    <div className={`exposure-banner${hasReaction ? ' has-reaction' : ''}`}>
      <div className="exposure-banner-header">
        <div className="exposure-banner-title">
          <span className="exposure-banner-emoji">{emoji}</span>
          <div>
            <h3>חשיפה לאלרגן: {exposure.allergenName}</h3>
            <span className="exposure-banner-dates">
              {formatDateHebrew(exposure.days[0].date)} — {formatDateHebrew(exposure.days[2].date)}
            </span>
          </div>
        </div>
        <div className="exposure-banner-actions">
          {onCompleteAll && completedCount < 3 && (
            <button className="btn btn-sm btn-complete-all" onClick={onCompleteAll}>
              ✅ השלם 3 ימים
            </button>
          )}
          <button className="btn btn-sm btn-cancel-exposure" onClick={onCancel}>
            ביטול
          </button>
        </div>
      </div>

      <div className="exposure-progress">
        {exposure.days.map((day, i) => {
          const isDone = day.status === 'completed';
          const dayHasReaction = day.reaction !== null && day.reaction.symptoms.length > 0;
          const isNext = !isDone && exposure.days.slice(0, i).every((d) => d.status === 'completed');

          return (
            <div
              key={i}
              className={`exposure-day-step${isDone ? ' done' : ''}${dayHasReaction ? ' reaction' : ''}${isNext ? ' next' : ''}`}
              onClick={() => onLogDay(i)}
            >
              <div className="exposure-day-circle">
                {dayHasReaction ? '⚠️' : isDone ? '✓' : i + 1}
              </div>
              <div className="exposure-day-label">
                <span className="exposure-day-num">יום {i + 1}/3</span>
                <span className="exposure-day-date">{formatDateHebrew(day.date)}</span>
                <span className={`exposure-day-status ${day.status}`}>
                  {isDone ? (dayHasReaction ? 'תגובה!' : 'הושלם') : 'ממתין'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="exposure-banner-bar">
        <div className="exposure-banner-bar-fill" style={{ width: `${(completedCount / 3) * 100}%` }} />
      </div>
    </div>
  );
}

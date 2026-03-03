import { useMemo } from 'react';
import { AllergenExposure, TOP_ALLERGENS } from '../types';
import { exposureHasReaction } from '../exposureUtils';
import { todayString } from '../utils';

interface AllergenDashboardProps {
  exposures: AllergenExposure[];
  onStartExposure: (name: string) => void;
}

type AllergenStatus = 'not-tried' | 'active' | 'passed' | 'reaction';

interface AllergenRow {
  id: string;
  nameHe: string;
  emoji: string;
  status: AllergenStatus;
  lastDate: string | null;
  daysSince: number | null;
}

export function AllergenDashboard({ exposures, onStartExposure }: AllergenDashboardProps) {
  const rows = useMemo<AllergenRow[]>(() => {
    const today = new Date(todayString() + 'T00:00:00');

    return TOP_ALLERGENS.map((allergen) => {
      const matching = exposures.filter(
        (e) => e.status !== 'cancelled' && e.allergenName.toLowerCase().includes(allergen.nameHe.toLowerCase())
      );

      if (matching.length === 0) {
        return { ...allergen, status: 'not-tried' as const, lastDate: null, daysSince: null };
      }

      const active = matching.find((e) => e.status === 'active');
      if (active) {
        return { ...allergen, status: 'active' as const, lastDate: active.startDate, daysSince: null };
      }

      const hasReact = matching.some((e) => exposureHasReaction(e));
      const lastCompleted = matching
        .filter((e) => e.status === 'completed')
        .sort((a, b) => b.days[2].date.localeCompare(a.days[2].date))[0];

      const lastDate = lastCompleted?.days[2].date ?? null;
      const daysSince = lastDate
        ? Math.floor((today.getTime() - new Date(lastDate + 'T00:00:00').getTime()) / 86400000)
        : null;

      return {
        ...allergen,
        status: hasReact ? 'reaction' as const : 'passed' as const,
        lastDate,
        daysSince,
      };
    });
  }, [exposures]);

  const statusLabel: Record<AllergenStatus, string> = {
    'not-tried': 'לא נוסה',
    'active': 'בתהליך',
    'passed': 'עבר בהצלחה',
    'reaction': 'תגובה',
  };

  return (
    <div className="allergen-dashboard">
      <h2 className="allergen-dashboard-title">מעקב אלרגנים</h2>
      <div className="allergen-grid">
        {rows.map((row) => (
          <div key={row.id} className={`allergen-card status-${row.status}`}
            onClick={() => row.status === 'not-tried' ? onStartExposure(row.nameHe) : undefined}>
            <span className="allergen-card-emoji">{row.emoji}</span>
            <span className="allergen-card-name">{row.nameHe}</span>
            <span className={`allergen-card-status status-${row.status}`}>
              {statusLabel[row.status]}
            </span>
            {row.daysSince !== null && (
              <span className="allergen-card-days">לפני {row.daysSince} ימים</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

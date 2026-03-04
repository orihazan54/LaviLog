import { useMemo } from 'react';
import { AllergenExposure, FoodEntry, TOP_ALLERGENS, AllergenInfo } from '../types';
import { exposureHasReaction } from '../exposureUtils';
import { todayString } from '../utils';
import { getFoodEmoji } from '../foodIcons';

interface AllergenDashboardProps {
  exposures: AllergenExposure[];
  foods: FoodEntry[];
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
  isCustom?: boolean;
}

export function AllergenDashboard({ exposures, foods, onStartExposure }: AllergenDashboardProps) {
  const allAllergens = useMemo<AllergenInfo[]>(() => {
    const builtIn = [...TOP_ALLERGENS];
    const builtInNames = new Set(builtIn.map((a) => a.nameHe.toLowerCase()));

    const customNames = new Set<string>();
    for (const f of foods) {
      if (f.isAllergenic) {
        const lower = f.name.toLowerCase();
        if (!builtInNames.has(lower) && !customNames.has(lower)) {
          customNames.add(lower);
          builtIn.push({
            id: `custom-${lower}`,
            nameHe: f.name,
            emoji: getFoodEmoji(f.name),
          });
        }
      }
    }

    for (const e of exposures) {
      if (e.status === 'cancelled') continue;
      const lower = e.allergenName.toLowerCase();
      if (!builtInNames.has(lower) && !customNames.has(lower)) {
        customNames.add(lower);
        builtIn.push({
          id: `custom-${lower}`,
          nameHe: e.allergenName,
          emoji: getFoodEmoji(e.allergenName),
        });
      }
    }

    return builtIn;
  }, [foods, exposures]);

  const rows = useMemo<AllergenRow[]>(() => {
    const today = new Date(todayString() + 'T00:00:00');

    return allAllergens.map((allergen) => {
      const matching = exposures.filter(
        (e) => e.status !== 'cancelled' && e.allergenName.toLowerCase().includes(allergen.nameHe.toLowerCase())
      );

      if (matching.length === 0) {
        return { ...allergen, status: 'not-tried' as const, lastDate: null, daysSince: null, isCustom: allergen.id.startsWith('custom-') };
      }

      const active = matching.find((e) => e.status === 'active');
      if (active) {
        return { ...allergen, status: 'active' as const, lastDate: active.startDate, daysSince: null, isCustom: allergen.id.startsWith('custom-') };
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
        isCustom: allergen.id.startsWith('custom-'),
      };
    });
  }, [exposures, allAllergens]);

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
      <p className="allergen-dashboard-hint">
        סמנו מאכל כאלרגני בעת הוספה והוא יופיע כאן אוטומטית
      </p>
    </div>
  );
}

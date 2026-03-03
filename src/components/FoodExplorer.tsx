import { useMemo } from 'react';
import { FoodEntry, PREFERENCE_EMOJI } from '../types';
import { formatDateHebrew } from '../utils';
import { getFoodEmoji } from '../foodIcons';

interface FoodExplorerProps {
  foods: FoodEntry[];
  onQuickLog: (name: string) => void;
}

interface AggregatedFood {
  name: string;
  emoji: string;
  totalTimes: number;
  firstDate: string;
  lastDate: string;
  isAllergenic: boolean;
  lastPreference: string;
}

const CATEGORIES: { key: string; label: string; keywords: string[] }[] = [
  { key: 'fruits', label: 'פירות', keywords: ['תפוח','אגס','בננה','ענבים','תפוז','לימון','אבטיח','תות','דובדבן','אפרסק','מנגו','אננס','קיווי','אבוקדו','שזיף'] },
  { key: 'vegetables', label: 'ירקות', keywords: ['בטטה','גזר','תירס','ברוקולי','מלפפון','עגבניה','חציל','פלפל','בצל','שום','תפוח אדמה','פטריות','חסה','אפונה','דלעת'] },
  { key: 'grains', label: 'דגנים ולחם', keywords: ['אורז','לחם','פסטה','דגנים','שיבולת שועל','קוסקוס','פיתה','קמח','חיטה'] },
  { key: 'protein', label: 'חלבונים', keywords: ['ביצה','ביצים','עוף','בשר','דג','דגים','סלמון','טונה','טופו','חומוס','עדשים'] },
  { key: 'dairy', label: 'חלב ומוצרי חלב', keywords: ['חלב','גבינה','יוגורט','שמנת','קוטג','חמאה'] },
  { key: 'other', label: 'אחר', keywords: [] },
];

function categorize(name: string): string {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.key === 'other') continue;
    if (cat.keywords.some((kw) => lower.includes(kw) || kw.includes(lower))) return cat.key;
  }
  return 'other';
}

export function FoodExplorer({ foods, onQuickLog }: FoodExplorerProps) {
  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedFood>();
    for (const f of foods) {
      const key = f.name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.totalTimes += f.timesEaten;
        if (f.date < existing.firstDate) existing.firstDate = f.date;
        if (f.date > existing.lastDate) { existing.lastDate = f.date; existing.lastPreference = PREFERENCE_EMOJI[f.preference ?? 'okay']; }
      } else {
        map.set(key, {
          name: f.name,
          emoji: getFoodEmoji(f.name),
          totalTimes: f.timesEaten,
          firstDate: f.date,
          lastDate: f.date,
          isAllergenic: f.isAllergenic,
          lastPreference: PREFERENCE_EMOJI[f.preference ?? 'okay'],
        });
      }
    }
    return Array.from(map.values());
  }, [foods]);

  const byCategory = useMemo(() => {
    const result: Record<string, AggregatedFood[]> = {};
    for (const cat of CATEGORIES) result[cat.key] = [];
    for (const food of aggregated) {
      const cat = categorize(food.name);
      result[cat].push(food);
    }
    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => b.totalTimes - a.totalTimes);
    }
    return result;
  }, [aggregated]);

  if (foods.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🔍</span>
        <h3>עדיין לא נוספו מאכלים</h3>
        <p>הוסיפו מאכלים כדי לראות אותם כאן</p>
      </div>
    );
  }

  return (
    <div className="food-explorer">
      <div className="explorer-summary">
        <span className="explorer-total">{aggregated.length} סוגי מאכלים נוסו</span>
      </div>

      {CATEGORIES.map((cat) => {
        const items = byCategory[cat.key];
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="explorer-category">
            <h3 className="explorer-cat-title">{cat.label} ({items.length})</h3>
            <div className="explorer-items">
              {items.map((food) => (
                <div key={food.name} className={`explorer-item${food.isAllergenic ? ' allergenic' : ''}`}>
                  <span className="explorer-item-emoji">{food.emoji}</span>
                  <div className="explorer-item-info">
                    <span className="explorer-item-name">
                      {food.name} {food.lastPreference}
                      {food.isAllergenic && <span className="mini-badge-allergen">⚠️</span>}
                    </span>
                    <span className="explorer-item-meta">
                      {food.totalTimes}x &middot; לאחרונה {formatDateHebrew(food.lastDate)}
                    </span>
                  </div>
                  <button className="icon-btn edit" onClick={() => onQuickLog(food.name)} title="הוסף שוב">+</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

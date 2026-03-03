import { useMemo } from 'react';
import { FoodEntry, AllergenExposure, CalendarDayColor } from '../types';
import { getDayColor, getExposureForDate } from '../exposureUtils';
import { getFoodEmoji } from '../foodIcons';
import {
  getHebrewMonth, getHebrewDays, getDaysInMonth,
  getFirstDayOfMonth, toDateString, todayString,
} from '../utils';

interface CalendarProps {
  year: number;
  month: number;
  foods: FoodEntry[];
  exposures: AllergenExposure[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (date: string) => void;
}

const COLOR_CLASS: Record<CalendarDayColor, string> = {
  none: '', blue: 'cal-blue', yellow: 'cal-yellow', green: 'cal-green', red: 'cal-red',
};

export function Calendar({
  year, month, foods, exposures,
  onPrevMonth, onNextMonth, onDayClick,
}: CalendarProps) {
  const today = todayString();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cellData = useMemo(() => {
    const cells: (null | {
      day: number; dateStr: string; color: CalendarDayColor;
      exposureAllergen: string | null; foodEmojis: string[];
    })[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateString(new Date(year, month, d));
      const color = getDayColor(dateStr, exposures, foods);
      const expInfo = getExposureForDate(dateStr, exposures);
      const dayFoods = foods.filter((f) => f.date === dateStr);
      const foodEmojis = dayFoods.slice(0, 3).map((f) => getFoodEmoji(f.name));
      cells.push({
        day: d, dateStr, color,
        exposureAllergen: expInfo?.exposure.allergenName ?? null,
        foodEmojis,
      });
    }
    return cells;
  }, [year, month, foods, exposures, firstDay, daysInMonth]);

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={onPrevMonth}>‹</button>
        <h2 className="calendar-title">{getHebrewMonth(month)} {year}</h2>
        <button className="cal-nav-btn" onClick={onNextMonth}>›</button>
      </div>

      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot cal-blue" />ארוחה רגילה</span>
        <span className="legend-item"><span className="legend-dot cal-yellow" />חשיפה פעילה</span>
        <span className="legend-item"><span className="legend-dot cal-green" />חשיפה הושלמה</span>
        <span className="legend-item"><span className="legend-dot cal-red" />תגובה</span>
      </div>

      <div className="calendar-grid">
        {getHebrewDays().map((day) => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}

        {cellData.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="calendar-cell empty" />;
          const { day, dateStr, color, exposureAllergen, foodEmojis } = cell;
          const isToday = dateStr === today;

          return (
            <div key={dateStr}
              className={`calendar-cell${isToday ? ' today' : ''} ${COLOR_CLASS[color]}`}
              onClick={() => onDayClick(dateStr)}>
              <span className="cell-day">{day}</span>
              <div className="cell-indicators">
                {exposureAllergen && (
                  <span className={`cell-exposure-tag ${COLOR_CLASS[color]}`}>
                    {color === 'red' ? '⚠️' : color === 'green' ? '✓' : '●'}
                  </span>
                )}
                {foodEmojis.length > 0 && (
                  <div className="cell-food-emojis">
                    {foodEmojis.map((e, j) => <span key={j} className="cell-mini-emoji">{e}</span>)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

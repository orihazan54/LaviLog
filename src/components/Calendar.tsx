import { useMemo } from 'react';
import { FoodEntry } from '../types';
import {
  getHebrewMonth,
  getHebrewDays,
  getDaysInMonth,
  getFirstDayOfMonth,
  toDateString,
  todayString,
} from '../utils';

interface CalendarProps {
  year: number;
  month: number;
  foods: FoodEntry[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (date: string) => void;
}

export function Calendar({
  year,
  month,
  foods,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}: CalendarProps) {
  const today = todayString();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const foodsByDate = useMemo(() => {
    const map: Record<string, FoodEntry[]> = {};
    for (const food of foods) {
      if (!map[food.date]) map[food.date] = [];
      map[food.date].push(food);
    }
    return map;
  }, [foods]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={onPrevMonth}>‹</button>
        <h2 className="calendar-title">
          {getHebrewMonth(month)} {year}
        </h2>
        <button className="cal-nav-btn" onClick={onNextMonth}>›</button>
      </div>

      <div className="calendar-grid">
        {getHebrewDays().map((day) => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}

        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="calendar-cell empty" />;
          }

          const dateStr = toDateString(new Date(year, month, day));
          const dayFoods = foodsByDate[dateStr] || [];
          const isToday = dateStr === today;
          const hasFoods = dayFoods.length > 0;

          return (
            <div
              key={dateStr}
              className={`calendar-cell${isToday ? ' today' : ''}${hasFoods ? ' has-foods' : ''}`}
              onClick={() => onDayClick(dateStr)}
            >
              <span className="cell-day">{day}</span>
              {hasFoods && (
                <div className="cell-foods">
                  {dayFoods.slice(0, 3).map((f) => (
                    <span key={f.id} className="cell-food-dot" title={f.name}>
                      {f.name.charAt(0)}
                    </span>
                  ))}
                  {dayFoods.length > 3 && (
                    <span className="cell-food-more">+{dayFoods.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

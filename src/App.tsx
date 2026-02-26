import { useState, useEffect, useCallback } from 'react';
import { FoodEntry } from './types';
import { loadFoods, saveFoods, generateId } from './storage';
import { Calendar } from './components/Calendar';
import { DayModal } from './components/DayModal';
import { Stats } from './components/Stats';

function App() {
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    setFoods(loadFoods());
  }, []);

  useEffect(() => {
    saveFoods(foods);
  }, [foods]);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const handleAddFood = (date: string, name: string, quantity: string, timesEaten: number) => {
    const nowIso = new Date().toISOString();
    const newFood: FoodEntry = {
      id: generateId(),
      name,
      quantity,
      timesEaten,
      date,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setFoods((prev) => [newFood, ...prev]);
  };

  const handleEditFood = (updated: FoodEntry) => {
    setFoods((prev) =>
      prev.map((f) =>
        f.id === updated.id
          ? { ...updated, updatedAt: new Date().toISOString() }
          : f
      )
    );
  };

  const handleDeleteFood = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <span className="logo">🍼</span>
          <h1>LaviLog</h1>
          <p>מעקב אוכל לתינוק</p>
        </div>
      </header>

      <main className="main">
        <Stats foods={foods} />

        <Calendar
          year={viewYear}
          month={viewMonth}
          foods={foods}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDayClick={setSelectedDate}
        />
      </main>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          foods={foods}
          onAdd={(name, quantity, timesEaten) =>
            handleAddFood(selectedDate, name, quantity, timesEaten)
          }
          onEdit={handleEditFood}
          onDelete={handleDeleteFood}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

export default App;

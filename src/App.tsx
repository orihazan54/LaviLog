import { useState, useEffect } from 'react';
import { FoodEntry } from './types';
import { loadFoods, saveFoods, generateId } from './storage';
import { FoodForm } from './components/FoodForm';
import { FoodList } from './components/FoodList';

function App() {
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);

  useEffect(() => {
    setFoods(loadFoods());
  }, []);

  useEffect(() => {
    saveFoods(foods);
  }, [foods]);

  const handleAddFood = (name: string, quantity: string, timesEaten: number) => {
    const now = new Date().toISOString();
    const newFood: FoodEntry = {
      id: generateId(),
      name,
      quantity,
      timesEaten,
      createdAt: now,
      updatedAt: now,
    };
    setFoods((prev) => [newFood, ...prev]);
  };

  const handleUpdateFood = (name: string, quantity: string, timesEaten: number) => {
    if (!editingFood) return;
    setFoods((prev) =>
      prev.map((f) =>
        f.id === editingFood.id
          ? { ...f, name, quantity, timesEaten, updatedAt: new Date().toISOString() }
          : f
      )
    );
    setEditingFood(null);
  };

  const handleDeleteFood = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
    if (editingFood?.id === id) {
      setEditingFood(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingFood(null);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <span className="logo">🍼</span>
          <h1>LaviLog</h1>
          <p>Baby Food Tracker</p>
        </div>
      </header>

      <main className="main">
        <FoodForm
          onSubmit={editingFood ? handleUpdateFood : handleAddFood}
          editingFood={editingFood}
          onCancelEdit={handleCancelEdit}
        />
        <FoodList
          foods={foods}
          onEdit={setEditingFood}
          onDelete={handleDeleteFood}
        />
      </main>
    </div>
  );
}

export default App;

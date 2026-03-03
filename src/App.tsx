import { useState, useEffect, useCallback, useMemo } from 'react';
import { Baby, FoodEntry, AllergenExposure, Preference } from './types';
import {
  saveFoods, saveExposures, saveBabies, saveActiveBabyId,
  generateId, migrateToMultiBaby,
} from './storage';
import { getActiveExposure, createExposureDays } from './exposureUtils';
import { todayString } from './utils';

import { FoodForm } from './components/FoodForm';
import { FoodList } from './components/FoodList';
import { FoodExplorer } from './components/FoodExplorer';
import { Calendar } from './components/Calendar';
import { DayModal } from './components/DayModal';
import { Stats } from './components/Stats';
import { AllergenDashboard } from './components/AllergenDashboard';
import { Toast, ToastType } from './components/Toast';
import { ExposureBanner } from './components/ExposureBanner';
import { NewExposureForm } from './components/NewExposureForm';
import { ExposureDayForm } from './components/ExposureDayForm';
import { BabySwitcher } from './components/BabySwitcher';
import { BabySetup } from './components/BabySetup';

type ViewMode = 'list' | 'calendar' | 'explorer';

interface ToastState { message: string; type: ToastType }

function App() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string>('');
  const [allFoods, setAllFoods] = useState<FoodEntry[]>([]);
  const [allExposures, setAllExposures] = useState<AllergenExposure[]>([]);

  const [view, setView] = useState<ViewMode>('list');
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showFab, setShowFab] = useState(false);
  const [showBabySetup, setShowBabySetup] = useState(false);

  const [showNewExposure, setShowNewExposure] = useState(false);
  const [newExposureName, setNewExposureName] = useState('');
  const [exposureDayEdit, setExposureDayEdit] = useState<{ id: string; dayIndex: number } | null>(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    const data = migrateToMultiBaby();
    setBabies(data.babies);
    setAllFoods(data.foods);
    setAllExposures(data.exposures);
    if (data.activeBabyId) setActiveBabyId(data.activeBabyId);
  }, []);

  useEffect(() => { if (allFoods.length > 0 || babies.length > 0) saveFoods(allFoods); }, [allFoods]);
  useEffect(() => { if (allExposures.length > 0 || babies.length > 0) saveExposures(allExposures); }, [allExposures]);
  useEffect(() => { if (babies.length > 0) saveBabies(babies); }, [babies]);
  useEffect(() => { if (activeBabyId) saveActiveBabyId(activeBabyId); }, [activeBabyId]);

  const foods = useMemo(() => allFoods.filter((f) => f.babyId === activeBabyId), [allFoods, activeBabyId]);
  const exposures = useMemo(() => allExposures.filter((e) => e.babyId === activeBabyId), [allExposures, activeBabyId]);
  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? null;

  const showToast = (message: string, type: ToastType = 'info') => setToast({ message, type });

  // ── Baby management ──

  const handleSaveBabies = (updated: Baby[], newActiveId: string) => {
    setBabies(updated);
    setActiveBabyId(newActiveId);
    setShowBabySetup(false);
  };

  const handleSwitchBaby = (babyId: string) => {
    setActiveBabyId(babyId);
    setEditingFood(null);
    setSelectedDate(null);
    setExposureDayEdit(null);
  };

  const handleDeleteBaby = (babyId: string) => {
    const remaining = babies.filter((b) => b.id !== babyId);
    setBabies(remaining);
    setAllFoods((prev) => prev.filter((f) => f.babyId !== babyId));
    setAllExposures((prev) => prev.filter((e) => e.babyId !== babyId));

    if (remaining.length === 0) {
      setActiveBabyId('');
      setShowBabySetup(false);
    } else if (activeBabyId === babyId) {
      setActiveBabyId(remaining[0].id);
    }
    setEditingFood(null);
    setSelectedDate(null);
    setExposureDayEdit(null);
  };

  // ── Food CRUD ──

  const addFood = (name: string, quantity: string, timesEaten: number, date: string, isAllergenic: boolean, preference: Preference = 'okay') => {
    const nowIso = new Date().toISOString();
    setAllFoods((prev) => [{
      id: generateId(), babyId: activeBabyId, name, quantity, timesEaten, date, isAllergenic, preference,
      createdAt: nowIso, updatedAt: nowIso,
    }, ...prev]);
  };

  const updateFood = (name: string, quantity: string, timesEaten: number, date: string, isAllergenic: boolean, preference: Preference = 'okay') => {
    if (!editingFood) return;
    setAllFoods((prev) => prev.map((f) =>
      f.id === editingFood.id
        ? { ...f, name, quantity, timesEaten, date, isAllergenic, preference, updatedAt: new Date().toISOString() }
        : f
    ));
    setEditingFood(null);
  };

  const editFoodFromModal = (updated: FoodEntry) => {
    setAllFoods((prev) => prev.map((f) =>
      f.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : f
    ));
  };

  const deleteFood = (id: string) => {
    setAllFoods((prev) => prev.filter((f) => f.id !== id));
    if (editingFood?.id === id) setEditingFood(null);
  };

  // ── Exposure CRUD ──

  const handleStartExposure = (allergenName: string, startDate: string) => {
    const active = getActiveExposure(exposures);
    if (active) {
      showToast(`כבר קיימת חשיפה פעילה (${active.allergenName}). יש לסיים או לבטל אותה קודם.`, 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    setAllExposures((prev) => [{
      id: generateId(), babyId: activeBabyId, allergenName, startDate, status: 'active',
      days: createExposureDays(startDate), createdAt: nowIso, updatedAt: nowIso,
    }, ...prev]);
    setShowNewExposure(false);
    setNewExposureName('');
    showToast(`חשיפה ל-"${allergenName}" התחילה!`, 'success');
  };

  const handleCancelExposure = () => {
    const active = getActiveExposure(exposures);
    if (!active) return;
    setAllExposures((prev) => prev.map((e) =>
      e.id === active.id ? { ...e, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : e
    ));
    showToast('החשיפה בוטלה.', 'info');
  };

  const handleSaveExposure = (updated: AllergenExposure) => {
    setAllExposures((prev) => prev.map((e) => e.id === updated.id ? updated : e));
    if (updated.status === 'completed') {
      showToast(`חשיפה ל-"${updated.allergenName}" הושלמה בהצלחה!`, 'success');
    }
  };

  const handleOpenExposureDay = (exposureId: string, dayIndex: number) => {
    setExposureDayEdit({ id: exposureId, dayIndex });
    setSelectedDate(null);
  };

  const handleOpenExposureDayFromBanner = (dayIndex: number) => {
    const active = getActiveExposure(exposures);
    if (!active) return;
    setExposureDayEdit({ id: active.id, dayIndex });
  };

  const handleStartExposureClick = () => {
    const active = getActiveExposure(exposures);
    if (active) {
      showToast(`כבר קיימת חשיפה פעילה (${active.allergenName}). יש לסיים או לבטל אותה קודם.`, 'error');
      return;
    }
    setNewExposureName('');
    setShowNewExposure(true);
  };

  const handleStartExposureFromDashboard = (name: string) => {
    const active = getActiveExposure(exposures);
    if (active) {
      showToast(`כבר קיימת חשיפה פעילה (${active.allergenName}). יש לסיים או לבטל אותה קודם.`, 'error');
      return;
    }
    setNewExposureName(name);
    setShowNewExposure(true);
  };

  const handleQuickLog = (name: string) => {
    addFood(name, '', 1, todayString(), false, 'okay');
    showToast(`"${name}" נוסף להיום`, 'success');
  };

  // ── Calendar nav ──

  const handlePrevMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 0) { setViewYear((y) => y - 1); return 11; } return m - 1; });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 11) { setViewYear((y) => y + 1); return 0; } return m + 1; });
  }, []);

  // ── Derived ──

  const activeExposure = getActiveExposure(exposures);
  const editingExposureData = exposureDayEdit
    ? allExposures.find((e) => e.id === exposureDayEdit.id) ?? null : null;

  // ── Onboarding: no babies yet ──

  if (babies.length === 0) {
    return (
      <div className="app">
        <BabySetup
          babies={[]}
          onSave={handleSaveBabies}
          onDeleteBaby={handleDeleteBaby}
          onClose={() => {}}
          isOnboarding
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <span className="logo">🍼</span>
          <h1>LaviLog</h1>
          <p>
            {activeBaby ? `מעקב אוכל עבור ${activeBaby.emoji} ${activeBaby.name}` : 'מעקב אוכל לתינוק'}
          </p>
        </div>
      </header>

      <BabySwitcher
        babies={babies}
        activeBabyId={activeBabyId}
        onSwitch={handleSwitchBaby}
        onManage={() => setShowBabySetup(true)}
      />

      <main className="main">
        <Stats foods={foods} exposures={exposures} />

        {activeExposure && (
          <ExposureBanner
            exposure={activeExposure}
            onLogDay={handleOpenExposureDayFromBanner}
            onCancel={handleCancelExposure}
          />
        )}

        {!activeExposure && (
          <button className="start-exposure-btn" onClick={handleStartExposureClick}>
            🧪 התחלת חשיפה לאלרגן חדש
          </button>
        )}

        <div className="view-toggle three-tabs">
          <button className={`toggle-btn${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')}>📋 יומן</button>
          <button className={`toggle-btn${view === 'calendar' ? ' active' : ''}`}
            onClick={() => setView('calendar')}>📅 לוח שנה</button>
          <button className={`toggle-btn${view === 'explorer' ? ' active' : ''}`}
            onClick={() => setView('explorer')}>🔍 סייר</button>
        </div>

        {view === 'list' && (
          <>
            <FoodForm
              onSubmit={editingFood ? updateFood : addFood}
              editingFood={editingFood}
              onCancelEdit={() => setEditingFood(null)}
            />
            <FoodList foods={foods} onEdit={setEditingFood} onDelete={deleteFood} />
          </>
        )}

        {view === 'calendar' && (
          <Calendar
            year={viewYear} month={viewMonth}
            foods={foods} exposures={exposures}
            onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
            onDayClick={setSelectedDate}
          />
        )}

        {view === 'explorer' && (
          <>
            <AllergenDashboard exposures={exposures} onStartExposure={handleStartExposureFromDashboard} />
            <FoodExplorer foods={foods} onQuickLog={handleQuickLog} />
          </>
        )}
      </main>

      {view !== 'list' && (
        <>
          {showFab && (
            <div className="fab-menu">
              <button className="fab-option" onClick={() => { setShowFab(false); setView('list'); }}>
                🍽️ הוספת מאכל
              </button>
              <button className="fab-option" onClick={() => { setShowFab(false); handleStartExposureClick(); }}>
                🧪 חשיפה חדשה
              </button>
            </div>
          )}
          <button className={`fab${showFab ? ' open' : ''}`} onClick={() => setShowFab(!showFab)}>
            {showFab ? '✕' : '+'}
          </button>
        </>
      )}

      {selectedDate && (
        <DayModal
          date={selectedDate} foods={foods} exposures={exposures}
          onAdd={(name, quantity, timesEaten, isAllergenic, preference) =>
            addFood(name, quantity, timesEaten, selectedDate, isAllergenic, preference)
          }
          onEdit={editFoodFromModal} onDelete={deleteFood}
          onOpenExposureDay={handleOpenExposureDay}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {showNewExposure && (
        <NewExposureForm
          onStart={handleStartExposure}
          onClose={() => setShowNewExposure(false)}
          initialName={newExposureName}
        />
      )}

      {editingExposureData && exposureDayEdit && (
        <ExposureDayForm
          exposure={editingExposureData}
          dayIndex={exposureDayEdit.dayIndex}
          onSave={handleSaveExposure}
          onClose={() => setExposureDayEdit(null)}
        />
      )}

      {showBabySetup && (
        <BabySetup
          babies={babies}
          onSave={handleSaveBabies}
          onDeleteBaby={handleDeleteBaby}
          onClose={() => setShowBabySetup(false)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default App;

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FoodEntry, AllergenExposure, Preference, TOP_ALLERGENS } from './types';
import { AuthUser, onAuth, signOut } from './services/authService';
import { useAppData } from './hooks/useAppData';
import { getActiveExposure, exposureHasReaction } from './exposureUtils';
import { todayString, formatDateHebrew } from './utils';
import { getFoodEmoji } from './foodIcons';

import { LoginScreen } from './components/LoginScreen';
import { FoodForm } from './components/FoodForm';
import { FoodExplorer } from './components/FoodExplorer';
import { Calendar } from './components/Calendar';
import { DayModal } from './components/DayModal';
import { AllergenDashboard } from './components/AllergenDashboard';
import { Toast, ToastType } from './components/Toast';
import { ExposureBanner } from './components/ExposureBanner';
import { NewExposureForm } from './components/NewExposureForm';
import { ExposureDayForm } from './components/ExposureDayForm';
import { BabySwitcher } from './components/BabySwitcher';
import { BabySetup } from './components/BabySetup';
import { BottomNav, TabId } from './components/ui/BottomNav';
import { EmptyState } from './components/ui/EmptyState';

interface ToastState { message: string; type: ToastType }

const TIPS = [
  'הכנסת מאכלים חדשים? התחילו עם כמות קטנה ועקבו אחרי תגובות.',
  'חשוב להמתין 3 ימים בין הכנסת אלרגנים חדשים.',
  'מגוון צבעים בצלחת = מגוון רכיבים תזונתיים.',
  'תינוקות צריכים לטעום מאכל 8-15 פעמים לפני שהם מתרגלים אליו.',
  'אל תוותרו אם התינוק מסרב — נסו שוב בהזדמנות אחרת!',
  'הוסיפו תבלינים עדינים לאוכל של התינוק — זה בריא ומעשיר!',
  'עדיף להתחיל עם ירקות לפני פירות כדי להרגיל לטעמים פחות מתוקים.',
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function getBabyAge(birthDate: string): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate + 'T00:00:00');
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 1) {
    const days = Math.floor((now.getTime() - birth.getTime()) / 86400000);
    const weeks = Math.floor(days / 7);
    return weeks > 0 ? `${weeks} שבועות` : `${days} ימים`;
  }
  if (months >= 24) {
    const years = Math.floor(months / 12);
    return `${years} שנים`;
  }
  return `${months} חודשים`;
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    return onAuth((user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
  }, []);

  const data = useAppData(authUser);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('lavilog-tab');
    if (saved && ['home', 'calendar', 'add', 'insights', 'settings'].includes(saved)) {
      return saved as TabId;
    }
    return 'home';
  });
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showBabySetup, setShowBabySetup] = useState(false);

  const [showNewExposure, setShowNewExposure] = useState(false);
  const [newExposureName, setNewExposureName] = useState('');
  const [exposureDayEdit, setExposureDayEdit] = useState<{ id: string; dayIndex: number } | null>(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const showToast = (message: string, type: ToastType = 'info') => setToast({ message, type });

  const todayTip = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    return TIPS[dayOfYear % TIPS.length];
  }, [now.getFullYear()]);

  const todayFoods = useMemo(() => {
    const today = todayString();
    return data.foods.filter((f) => f.date === today);
  }, [data.foods]);

  const weekFoods = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekStr = todayString().substring(0, 10);
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
      days.push({
        label: ds === weekStr ? 'היום' : dayNames[d.getDay()],
        count: data.foods.filter((f) => f.date === ds).length,
      });
    }
    return days;
  }, [data.foods]);

  const uniqueFoodsCount = useMemo(() => {
    return new Set(data.foods.map((f) => f.name.toLowerCase())).size;
  }, [data.foods]);

  const completedExposures = useMemo(() => {
    return data.exposures.filter((e) => e.status === 'completed').length;
  }, [data.exposures]);

  const allergenProgress = useMemo(() => {
    const allNames = new Set(TOP_ALLERGENS.map((a) => a.nameHe.toLowerCase()));
    for (const f of data.foods) {
      if (f.isAllergenic) allNames.add(f.name.toLowerCase());
    }
    for (const e of data.exposures) {
      if (e.status !== 'cancelled') allNames.add(e.allergenName.toLowerCase());
    }
    const total = allNames.size;
    const tried = Array.from(allNames).filter((name) =>
      data.exposures.some((e) =>
        e.status !== 'cancelled' &&
        e.allergenName.toLowerCase().includes(name)
      )
    ).length;
    return { tried, total };
  }, [data.exposures, data.foods]);

  const topFoods = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; count: number }>();
    for (const f of data.foods) {
      const key = f.name.toLowerCase();
      const ex = map.get(key);
      if (ex) { ex.count += f.timesEaten; }
      else { map.set(key, { name: f.name, emoji: getFoodEmoji(f.name), count: f.timesEaten }); }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [data.foods]);

  const prevBabyCount = useRef(0);
  useEffect(() => {
    if (prevBabyCount.current === 0 && data.babies.length > 0) {
      setActiveTab('home');
      localStorage.setItem('lavilog-tab', 'home');
    }
    prevBabyCount.current = data.babies.length;
  }, [data.babies.length]);

  const loggingStreak = useMemo(() => {
    const dates = new Set(data.foods.map((f) => f.date));
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().split('T')[0];
      if (dates.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }, [data.foods]);

  const nextAllergen = useMemo(() => {
    const triedNames = new Set(
      data.exposures
        .filter((e) => e.status !== 'cancelled')
        .map((e) => e.allergenName.toLowerCase())
    );
    return TOP_ALLERGENS.find((a) => !triedNames.has(a.nameHe.toLowerCase())) ?? null;
  }, [data.exposures]);

  const lastNewFood = useMemo(() => {
    const sorted = [...data.foods].sort((a, b) => a.date.localeCompare(b.date));
    const firstOccurrence = new Map<string, FoodEntry>();
    for (const f of sorted) {
      const key = f.name.toLowerCase();
      if (!firstOccurrence.has(key)) firstOccurrence.set(key, f);
    }
    let latest: FoodEntry | null = null;
    for (const f of firstOccurrence.values()) {
      if (!latest || f.date > latest.date) latest = f;
    }
    return latest;
  }, [data.foods]);

  const daysSinceStart = useMemo(() => {
    if (!data.foods.length) return 0;
    const oldest = data.foods.reduce((min, f) => f.date < min ? f.date : min, data.foods[0].date);
    return Math.floor((Date.now() - new Date(oldest + 'T00:00:00').getTime()) / 86400000);
  }, [data.foods]);

  const handleSwitchBaby = (babyId: string) => {
    data.handleSwitchBaby(babyId);
    setEditingFood(null);
    setSelectedDate(null);
    setExposureDayEdit(null);
    setActiveTab('home');
    localStorage.setItem('lavilog-tab', 'home');
  };

  const handleDeleteBaby = (babyId: string) => {
    data.handleDeleteBaby(babyId);
    setEditingFood(null);
    setSelectedDate(null);
    setExposureDayEdit(null);
  };

  const addFood = (name: string, quantity: string, timesEaten: number, date: string, isAllergenic: boolean, preference: Preference = 'okay') => {
    data.addFood(name, quantity, timesEaten, date, isAllergenic, preference);

    if (isAllergenic && activeExposure) {
      showToast(
        `"${name}" נוסף. שימו לב — קיימת חשיפה פעילה ל-"${activeExposure.allergenName}". מומלץ לא להכניס אלרגן חדש במקביל.`,
        'info'
      );
    } else {
      showToast(`"${name}" נוסף בהצלחה`, 'success');
    }
  };

  const updateFood = (name: string, quantity: string, timesEaten: number, date: string, isAllergenic: boolean, preference: Preference = 'okay') => {
    if (!editingFood) return;
    data.updateFood({ ...editingFood, name, quantity, timesEaten, date, isAllergenic, preference });
    setEditingFood(null);
    showToast('מאכל עודכן', 'success');
  };

  const editFoodFromModal = (updated: FoodEntry) => {
    data.updateFood(updated);
  };

  const deleteFood = (id: string) => {
    data.removeFood(id);
    if (editingFood?.id === id) setEditingFood(null);
  };

  const handleStartExposure = (allergenName: string, startDate: string) => {
    const success = data.startExposure(allergenName, startDate);
    if (!success) {
      const active = getActiveExposure(data.exposures);
      showToast(`כבר קיימת חשיפה פעילה (${active?.allergenName}). יש לסיים או לבטל אותה קודם.`, 'error');
      return;
    }
    setShowNewExposure(false);
    setNewExposureName('');
    showToast(`חשיפה ל-"${allergenName}" התחילה!`, 'success');
  };

  const handleCancelExposure = () => {
    data.cancelExposure();
    showToast('החשיפה בוטלה.', 'info');
  };

  const handleSaveExposure = (updated: AllergenExposure) => {
    data.updateExposure(updated);
    if (updated.status === 'completed') {
      showToast(`חשיפה ל-"${updated.allergenName}" הושלמה בהצלחה!`, 'success');
    }
  };

  const handleOpenExposureDay = (exposureId: string, dayIndex: number) => {
    setExposureDayEdit({ id: exposureId, dayIndex });
    setSelectedDate(null);
  };

  const handleOpenExposureDayFromBanner = (dayIndex: number) => {
    const active = getActiveExposure(data.exposures);
    if (!active) return;
    setExposureDayEdit({ id: active.id, dayIndex });
  };

  const handleCompleteAllExposureDays = () => {
    if (!activeExposure) return;
    const updated: AllergenExposure = {
      ...activeExposure,
      status: 'completed',
      days: activeExposure.days.map((d) => ({
        ...d,
        status: 'completed' as const,
        mealTime: d.mealTime || new Date().toTimeString().slice(0, 5),
        mealDetails: d.mealDetails || activeExposure.allergenName,
        amountEaten: d.amountEaten || 1,
      })) as [typeof activeExposure.days[0], typeof activeExposure.days[1], typeof activeExposure.days[2]],
      updatedAt: new Date().toISOString(),
    };
    data.updateExposure(updated);
    showToast(`חשיפה ל-"${activeExposure.allergenName}" הושלמה בהצלחה!`, 'success');
  };

  const handleStartExposureClick = () => {
    const active = getActiveExposure(data.exposures);
    if (active) {
      showToast(`כבר קיימת חשיפה פעילה (${active.allergenName}). יש לסיים או לבטל אותה קודם.`, 'error');
      return;
    }
    setNewExposureName('');
    setShowNewExposure(true);
  };

  const handleStartExposureFromDashboard = (name: string) => {
    const active = getActiveExposure(data.exposures);
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

  const handlePrevMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 0) { setViewYear((y) => y - 1); return 11; } return m - 1; });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((m) => { if (m === 11) { setViewYear((y) => y + 1); return 0; } return m + 1; });
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    localStorage.setItem('lavilog-tab', tab);
    setEditingFood(null);
  };

  const activeExposure = getActiveExposure(data.exposures);
  const editingExposureData = exposureDayEdit
    ? data.allExposures.find((e) => e.id === exposureDayEdit.id) ?? null : null;

  const babyAge = data.activeBaby?.birthDate ? getBabyAge(data.activeBaby.birthDate) : null;
  const reactionsCount = data.exposures.filter((e) => exposureHasReaction(e)).length;
  const maxBarCount = Math.max(...weekFoods.map((d) => d.count), 1);

  const dailySummary = useMemo(() => {
    const today = todayString();
    return data.babies.map((baby) => {
      const babyFoods = data.allFoods
        .filter((f) => f.babyId === baby.id && f.date === today)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      const babyExposure = data.allExposures.find(
        (e) => e.babyId === baby.id && e.status === 'active'
      );

      return { baby, foods: babyFoods, activeExposure: babyExposure ?? null };
    });
  }, [data.babies, data.allFoods, data.allExposures]);

  // ── Auth loading / login ──

  if (authLoading) {
    return (
      <div className="app loading-screen">
        <span className="loading-logo">🍼</span>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="app">
        <LoginScreen onError={(msg) => showToast(msg, 'error')} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="app loading-screen">
        <span className="loading-logo">🍼</span>
        <div className="loading-dots"><span /><span /><span /></div>
        <p>טוען נתונים...</p>
      </div>
    );
  }

  if (data.babies.length === 0) {
    return (
      <div className="app">
        <BabySetup
          babies={[]}
          onSave={data.handleSaveBabies}
          onDeleteBaby={handleDeleteBaby}
          onClose={() => {}}
          isOnboarding
        />
      </div>
    );
  }

  // ── HOME PAGE ──

  const renderHomePage = () => (
    <div className="page page-home">
      {/* Greeting */}
      <div className="greeting-card">
        <div className="greeting-text">
          <h2>{getGreeting()} ✨</h2>
          <p>
            {data.activeBaby && <>{data.activeBaby.emoji} {data.activeBaby.name}</>}
            {babyAge && <span className="baby-age"> · {babyAge}</span>}
          </p>
        </div>
        <div className="greeting-today">
          <span className="greeting-today-num">{todayFoods.length}</span>
          <span className="greeting-today-label">ארוחות היום</span>
        </div>
      </div>

      {/* Active exposure */}
      {activeExposure && (
        <ExposureBanner
          exposure={activeExposure}
          onLogDay={handleOpenExposureDayFromBanner}
          onCancel={handleCancelExposure}
          onCompleteAll={handleCompleteAllExposureDays}
        />
      )}

      {/* Quick actions */}
      <div className="quick-actions-primary">
        <button className="quick-action-btn qa-food" onClick={() => handleTabChange('add')}>
          <span>🍽️</span>
          <span>הוסף מאכל</span>
        </button>
        <button className="quick-action-btn qa-exposure" onClick={handleStartExposureClick}>
          <span>🧪</span>
          <span>חשיפה חדשה</span>
        </button>
      </div>
      <div className="quick-actions-secondary">
        <button className="quick-action-btn qa-breast" onClick={() => handleQuickLog('הנקה')}>
          <span>🤱</span>
          <span>הנקה</span>
        </button>
        <button className="quick-action-btn qa-formula" onClick={() => handleQuickLog('תמ"ל')}>
          <span>🍼</span>
          <span>תמ"ל</span>
        </button>
        <button className="quick-action-btn qa-calendar" onClick={() => handleTabChange('calendar')}>
          <span>📅</span>
          <span>לוח שנה</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-grid stats-grid-3">
        <div className="stat-card-v2 stat-purple">
          <span className="stat-v2-icon">🍽️</span>
          <span className="stat-v2-value">{uniqueFoodsCount}</span>
          <span className="stat-v2-label">סוגי מאכלים</span>
        </div>
        <div className="stat-card-v2 stat-amber">
          <span className="stat-v2-icon">🧪</span>
          <span className="stat-v2-value">{completedExposures}</span>
          <span className="stat-v2-label">חשיפות</span>
        </div>
        <div className={`stat-card-v2 ${reactionsCount > 0 ? 'stat-red' : 'stat-green'}`}>
          <span className="stat-v2-icon">{reactionsCount > 0 ? '⚠️' : '✅'}</span>
          <span className="stat-v2-value">{reactionsCount}</span>
          <span className="stat-v2-label">תגובות</span>
        </div>
      </div>

      {/* Info chips row */}
      <div className="info-chips-row">
        {loggingStreak > 1 && (
          <div className="info-chip chip-streak">
            <span>🔥</span>
            <span>{loggingStreak} ימים ברצף</span>
          </div>
        )}
        {daysSinceStart > 0 && (
          <div className="info-chip chip-days">
            <span>📆</span>
            <span>{daysSinceStart} ימים מההתחלה</span>
          </div>
        )}
        {lastNewFood && (
          <div className="info-chip chip-new-food">
            <span>{getFoodEmoji(lastNewFood.name)}</span>
            <span>חדש: {lastNewFood.name}</span>
          </div>
        )}
        {nextAllergen && !activeExposure && (
          <div className="info-chip chip-next" onClick={() => handleStartExposureFromDashboard(nextAllergen.nameHe)}>
            <span>{nextAllergen.emoji}</span>
            <span>הבא: {nextAllergen.nameHe}</span>
          </div>
        )}
      </div>

      {/* Allergen progress */}
      <div className="progress-card">
        <div className="progress-card-header">
          <span>🛡️ התקדמות אלרגנים</span>
          <span className="progress-card-count">{allergenProgress.tried}/{allergenProgress.total}</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${(allergenProgress.tried / allergenProgress.total) * 100}%` }}
          />
        </div>
        <p className="progress-card-hint">
          {allergenProgress.tried === 0
            ? 'עדיין לא התחלתם — לחצו למטה להתחלת חשיפה ראשונה!'
            : allergenProgress.tried === allergenProgress.total
              ? 'כל הכבוד! סיימתם את כל האלרגנים הנפוצים!'
              : `נותרו עוד ${allergenProgress.total - allergenProgress.tried} אלרגנים לבדיקה`
          }
        </p>
      </div>

      {/* Weekly chart */}
      <div className="week-chart-card">
        <h3>📈 שבוע אחרון</h3>
        <div className="week-bars">
          {weekFoods.map((d, i) => (
            <div key={i} className="week-bar-col">
              <div className="week-bar-track">
                <div
                  className="week-bar-fill"
                  style={{ height: `${(d.count / maxBarCount) * 100}%` }}
                />
              </div>
              <span className="week-bar-count">{d.count || ''}</span>
              <span className="week-bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top foods */}
      {topFoods.length > 0 && (
        <div className="top-foods-card">
          <h3>⭐ המאכלים המובילים</h3>
          <div className="top-foods-list">
            {topFoods.map((f, i) => (
              <div key={f.name} className="top-food-item">
                <span className="top-food-rank">{i + 1}</span>
                <span className="top-food-emoji">{f.emoji}</span>
                <span className="top-food-name">{f.name}</span>
                <span className="top-food-count">{f.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {(uniqueFoodsCount >= 10 || completedExposures >= 3 || loggingStreak >= 7) && (
        <div className="milestones-card">
          <h3>🏆 הישגים</h3>
          <div className="milestones-list">
            {uniqueFoodsCount >= 10 && (
              <div className="milestone-item achieved">
                <span className="milestone-icon">🌈</span>
                <span>10+ סוגי מאכלים!</span>
              </div>
            )}
            {uniqueFoodsCount >= 20 && (
              <div className="milestone-item achieved">
                <span className="milestone-icon">🎯</span>
                <span>20+ מאכלים — גורמה!</span>
              </div>
            )}
            {completedExposures >= 3 && (
              <div className="milestone-item achieved">
                <span className="milestone-icon">🛡️</span>
                <span>3+ חשיפות הושלמו</span>
              </div>
            )}
            {loggingStreak >= 7 && (
              <div className="milestone-item achieved">
                <span className="milestone-icon">🔥</span>
                <span>שבוע רצוף של תיעוד!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tip of the day */}
      <div className="tip-card">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>טיפ של היום</strong>
          <p>{todayTip}</p>
        </div>
      </div>

      {/* Recent activity */}
      {data.foods.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">🕐 פעילות אחרונה</h2>
          </div>
          <div className="recent-list">
            {data.foods.slice(0, 6).map((food) => (
              <div key={food.id} className={`recent-item${food.isAllergenic ? ' allergenic' : ''}`}>
                <span className="recent-emoji">{getFoodEmoji(food.name)}</span>
                <div className="recent-info">
                  <span className="recent-name">{food.name}</span>
                  <span className="recent-meta">{formatDateHebrew(food.date)}{food.quantity ? ` · ${food.quantity}` : ''}</span>
                </div>
                <button className="icon-btn edit" onClick={() => { setEditingFood(food); setActiveTab('add'); }}>✏️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {data.foods.length === 0 && (
        <EmptyState
          icon="🍽️"
          title="עדיין אין מאכלים"
          description="הוסיפו את המאכל הראשון של התינוק"
          action={{ label: '+ הוספה', onClick: () => handleTabChange('add') }}
        />
      )}

      {/* Daily summary */}
      <div className="daily-summary-card">
        <h3>📋 סיכום יומי — {formatDateHebrew(todayString())}</h3>
        {dailySummary.map(({ baby, foods: bFoods, activeExposure: bExp }) => (
          <div key={baby.id} className="daily-summary-baby">
            <div className="daily-summary-baby-header">
              <span>{baby.emoji} {baby.name}</span>
              <span className="daily-summary-count">{bFoods.length} רישומים</span>
            </div>
            {bFoods.length === 0 && (
              <p className="daily-summary-empty">אין רישומים להיום</p>
            )}
            {bFoods.length > 0 && (
              <div className="daily-summary-items">
                {bFoods.map((f) => {
                  const time = f.createdAt ? new Date(f.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={f.id} className={`daily-summary-item${f.isAllergenic ? ' allergenic' : ''}`}>
                      <span className="daily-summary-time">{time}</span>
                      <span className="daily-summary-emoji">{getFoodEmoji(f.name)}</span>
                      <span className="daily-summary-name">{f.name}</span>
                      {f.quantity && <span className="daily-summary-qty">{f.quantity}</span>}
                    </div>
                  );
                })}
              </div>
            )}
            {bExp && (
              <div className="daily-summary-exposure">
                🧪 חשיפה פעילה: {bExp.allergenName} — יום {bExp.days.filter(d => d.status === 'completed').length + 1}/3
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── CALENDAR PAGE ──

  const renderCalendarPage = () => (
    <div className="page page-calendar">
      <div className="page-back-row">
        <button className="back-btn" onClick={() => handleTabChange('home')}>→ חזרה</button>
        <h2 className="page-title">📅 לוח שנה</h2>
      </div>
      <Calendar
        year={viewYear} month={viewMonth}
        foods={data.foods} exposures={data.exposures}
        onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
        onDayClick={setSelectedDate}
      />
    </div>
  );

  // ── ADD PAGE ──

  const renderAddPage = () => (
    <div className="page page-add">
      <div className="page-back-row">
        <button className="back-btn" onClick={() => handleTabChange('home')}>→ חזרה</button>
        <h2 className="page-title">🍽️ הוספת מאכל</h2>
      </div>
      <FoodForm
        onSubmit={editingFood ? updateFood : addFood}
        editingFood={editingFood}
        onCancelEdit={() => setEditingFood(null)}
      />

      {!activeExposure && (
        <button className="start-exposure-btn" onClick={handleStartExposureClick}>
          🧪 התחלת חשיפה לאלרגן חדש
        </button>
      )}

      {activeExposure && (
        <ExposureBanner
          exposure={activeExposure}
          onLogDay={handleOpenExposureDayFromBanner}
          onCancel={handleCancelExposure}
          onCompleteAll={handleCompleteAllExposureDays}
        />
      )}
    </div>
  );

  // ── INSIGHTS PAGE ──

  const renderInsightsPage = () => (
    <div className="page page-insights">
      <div className="page-back-row">
        <button className="back-btn" onClick={() => handleTabChange('home')}>→ חזרה</button>
        <h2 className="page-title">📊 סיכום</h2>
      </div>
      {/* Quick stats at top */}
      <div className="insights-stats-row">
        <div className="insights-stat">
          <span className="insights-stat-value">{uniqueFoodsCount}</span>
          <span className="insights-stat-label">סוגי מאכלים</span>
        </div>
        <div className="insights-stat-divider" />
        <div className="insights-stat">
          <span className="insights-stat-value">{completedExposures}</span>
          <span className="insights-stat-label">חשיפות שהושלמו</span>
        </div>
        <div className="insights-stat-divider" />
        <div className="insights-stat">
          <span className="insights-stat-value">{allergenProgress.tried}</span>
          <span className="insights-stat-label">אלרגנים נבדקו</span>
        </div>
      </div>

      <AllergenDashboard exposures={data.exposures} foods={data.foods} onStartExposure={handleStartExposureFromDashboard} />
      <FoodExplorer foods={data.foods} onQuickLog={handleQuickLog} />
    </div>
  );

  // ── SETTINGS PAGE ──

  const renderSettingsPage = () => (
    <div className="page page-settings">
      <div className="page-back-row">
        <button className="back-btn" onClick={() => handleTabChange('home')}>→ חזרה</button>
        <h2 className="page-title">⚙️ הגדרות</h2>
      </div>
      <div className="settings-section">
        <h2 className="section-title">👶 ניהול תינוקות</h2>
        <BabySetup
          babies={data.babies}
          onSave={data.handleSaveBabies}
          onDeleteBaby={handleDeleteBaby}
          onClose={() => setShowBabySetup(false)}
          isInline
        />
      </div>

      <div className="settings-section">
        <h2 className="section-title">👤 חשבון</h2>
        <div className="settings-card">
          <div className="settings-user-info">
            <span className="settings-user-icon">👤</span>
            <div>
              <strong>{authUser.displayName || 'משתמש'}</strong>
              <span className="settings-user-email">{authUser.email}</span>
            </div>
          </div>
          <button className="btn btn-danger settings-logout" onClick={() => signOut()}>
            🚪 התנתקות
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">ℹ️ אודות</h2>
        <div className="settings-card about-card">
          <span className="about-logo">🍼</span>
          <strong>LaviLog</strong>
          <span className="about-version">גרסה 1.0.0</span>
          <p className="about-desc">מעקב אוכל וחשיפות אלרגנים לתינוקות</p>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return renderHomePage();
      case 'calendar': return renderCalendarPage();
      case 'add': return renderAddPage();
      case 'insights': return renderInsightsPage();
      case 'settings': return renderSettingsPage();
    }
  };

  return (
    <div className="app has-bottom-nav">
      <header className="header header-compact">
        <div className="header-content">
          <div className="header-top-row">
            <span className="logo-sm">🍼</span>
            <h1>LaviLog</h1>
          </div>
        </div>
        <button className="header-logout" onClick={() => signOut()} title="התנתקות">
          🚪
        </button>
      </header>

      {data.babies.length > 1 && (
        <BabySwitcher
          babies={data.babies}
          activeBabyId={data.activeBabyId}
          onSwitch={handleSwitchBaby}
          onManage={() => setShowBabySetup(true)}
        />
      )}

      <main className="main">
        {renderPage()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {selectedDate && (
        <DayModal
          date={selectedDate} foods={data.foods} exposures={data.exposures}
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
          babies={data.babies}
          onSave={data.handleSaveBabies}
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

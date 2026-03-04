import { useState, useEffect, useCallback, useMemo } from 'react';
import { Baby, FoodEntry, AllergenExposure, Preference } from '../types';
import { AuthUser } from '../services/authService';
import {
  ensureUserProfile,
  subscribeBabies, subscribeFoods, subscribeExposures,
  saveBaby, deleteBabyAndData,
  saveFood, deleteFood as deleteFirestoreFood,
  saveExposure,
  migrateLocalToFirestore,
} from '../services/dataService';
import { getActiveExposure, createExposureDays } from '../exposureUtils';

function generateId(): string {
  return crypto.randomUUID();
}

export function useAppData(user: AuthUser | null) {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [allFoods, setAllFoods] = useState<FoodEntry[]>([]);
  const [allExposures, setAllExposures] = useState<AllergenExposure[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  // Ensure user profile exists, then subscribe to Firestore
  useEffect(() => {
    if (!user) {
      setBabies([]);
      setAllFoods([]);
      setAllExposures([]);
      setActiveBabyId('');
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    const unsubs: (() => void)[] = [];

    const init = async () => {
      try {
        await ensureUserProfile(user);
      } catch (err) {
        console.error('ensureUserProfile failed:', err);
      }

      if (cancelled) return;

      let loadedCount = 0;
      const checkDone = () => { loadedCount++; if (loadedCount >= 3) setLoading(false); };
      const onError = () => { setLoading(false); };

      unsubs.push(
        subscribeBabies(user.uid, (b) => { setBabies(b); checkDone(); }, onError),
        subscribeFoods(user.uid, (f) => { setAllFoods(f); checkDone(); }, onError),
        subscribeExposures(user.uid, (e) => { setAllExposures(e); checkDone(); }, onError),
      );
    };

    init();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [user]);

  // Migrate localStorage data on first sign-in
  useEffect(() => {
    if (!user || migrated) return;
    const hasLocal = localStorage.getItem('lavilog-foods') || localStorage.getItem('lavilog-babies');
    if (hasLocal) {
      migrateLocalToFirestore(user.uid).then(() => setMigrated(true));
    } else {
      setMigrated(true);
    }
  }, [user, migrated]);

  // Auto-select first baby when babies change
  useEffect(() => {
    if (babies.length > 0 && (!activeBabyId || !babies.find((b) => b.id === activeBabyId))) {
      setActiveBabyId(babies[0].id);
    }
  }, [babies, activeBabyId]);

  const foods = useMemo(() => allFoods.filter((f) => f.babyId === activeBabyId), [allFoods, activeBabyId]);
  const exposures = useMemo(() => allExposures.filter((e) => e.babyId === activeBabyId), [allExposures, activeBabyId]);
  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? null;

  // ── Baby ops ──

  const handleSaveBabies = useCallback((updated: Baby[], newActiveId: string) => {
    if (!user) return;
    updated.forEach((b) => saveBaby(user.uid, b));
    setActiveBabyId(newActiveId);
  }, [user]);

  const handleSwitchBaby = useCallback((babyId: string) => {
    setActiveBabyId(babyId);
  }, []);

  const handleDeleteBaby = useCallback((babyId: string) => {
    if (!user) return;
    deleteBabyAndData(user.uid, babyId);
    const remaining = babies.filter((b) => b.id !== babyId);
    if (activeBabyId === babyId && remaining.length > 0) {
      setActiveBabyId(remaining[0].id);
    } else if (remaining.length === 0) {
      setActiveBabyId('');
    }
  }, [user, babies, activeBabyId]);

  // ── Food ops ──

  const addFood = useCallback((name: string, quantity: string, timesEaten: number, date: string, isAllergenic: boolean, preference: Preference = 'okay') => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    const food: FoodEntry = {
      id: generateId(), babyId: activeBabyId, name, quantity, timesEaten, date, isAllergenic, preference,
      createdAt: nowIso, updatedAt: nowIso,
    };
    saveFood(user.uid, food);
  }, [user, activeBabyId]);

  const updateFood = useCallback((food: FoodEntry) => {
    if (!user) return;
    saveFood(user.uid, { ...food, updatedAt: new Date().toISOString() });
  }, [user]);

  const removeFood = useCallback((id: string) => {
    if (!user) return;
    deleteFirestoreFood(user.uid, id);
  }, [user]);

  // ── Exposure ops ──

  const startExposure = useCallback((allergenName: string, startDate: string): boolean => {
    if (!user) return false;
    const active = getActiveExposure(exposures);
    if (active) return false;
    const nowIso = new Date().toISOString();
    const exposure: AllergenExposure = {
      id: generateId(), babyId: activeBabyId, allergenName, startDate, status: 'active',
      days: createExposureDays(startDate), createdAt: nowIso, updatedAt: nowIso,
    };
    saveExposure(user.uid, exposure);
    return true;
  }, [user, activeBabyId, exposures]);

  const cancelExposure = useCallback(() => {
    if (!user) return;
    const active = getActiveExposure(exposures);
    if (!active) return;
    saveExposure(user.uid, { ...active, status: 'cancelled', updatedAt: new Date().toISOString() });
  }, [user, exposures]);

  const updateExposure = useCallback((updated: AllergenExposure) => {
    if (!user) return;
    saveExposure(user.uid, updated);
  }, [user]);

  return {
    loading,
    babies,
    activeBabyId,
    activeBaby,
    foods,
    exposures,
    allFoods,
    allExposures,

    handleSaveBabies,
    handleSwitchBaby,
    handleDeleteBaby,

    addFood,
    updateFood,
    removeFood,

    startExposure,
    cancelExposure,
    updateExposure,
  };
}

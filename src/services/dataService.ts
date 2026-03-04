import {
  collection, doc, getDoc, setDoc, deleteDoc, writeBatch,
  query, getDocs, onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Baby, FoodEntry, AllergenExposure } from '../types';
import { AuthUser } from './authService';

function userCol(userId: string, col: string) {
  return collection(db, 'users', userId, col);
}

function userDoc(userId: string, col: string, docId: string) {
  return doc(db, 'users', userId, col, docId);
}

// ── User profile initialization ──

export async function ensureUserProfile(user: AuthUser): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      createdAt: new Date().toISOString(),
    });
  }
}

// ── Real-time listeners ──

export function subscribeBabies(
  userId: string,
  callback: (babies: Baby[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(userCol(userId, 'babies')),
    (snap) => {
      const babies = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Baby));
      babies.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      callback(babies);
    },
    (err) => { console.error('subscribeBabies error:', err); onError?.(err); }
  );
}

export function subscribeFoods(
  userId: string,
  callback: (foods: FoodEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(userCol(userId, 'foods')),
    (snap) => {
      const foods = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FoodEntry));
      foods.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(foods);
    },
    (err) => { console.error('subscribeFoods error:', err); onError?.(err); }
  );
}

export function subscribeExposures(
  userId: string,
  callback: (exposures: AllergenExposure[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(userCol(userId, 'exposures')),
    (snap) => {
      const exposures = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AllergenExposure));
      exposures.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(exposures);
    },
    (err) => { console.error('subscribeExposures error:', err); onError?.(err); }
  );
}

// ── CRUD operations ──

export async function saveBaby(userId: string, baby: Baby): Promise<void> {
  const { id, ...data } = baby;
  await setDoc(userDoc(userId, 'babies', id), data);
}

export async function deleteBaby(userId: string, babyId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'babies', babyId));
}

export async function saveFood(userId: string, food: FoodEntry): Promise<void> {
  const { id, ...data } = food;
  await setDoc(userDoc(userId, 'foods', id), data);
}

export async function deleteFood(userId: string, foodId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'foods', foodId));
}

export async function saveExposure(userId: string, exposure: AllergenExposure): Promise<void> {
  const { id, ...data } = exposure;
  await setDoc(userDoc(userId, 'exposures', id), data);
}

export async function deleteExposure(userId: string, exposureId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'exposures', exposureId));
}

// ── Batch: delete all baby data ──

export async function deleteBabyAndData(userId: string, babyId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(userDoc(userId, 'babies', babyId));

  const foodsSnap = await getDocs(query(userCol(userId, 'foods')));
  foodsSnap.docs.filter((d) => d.data().babyId === babyId).forEach((d) => batch.delete(d.ref));

  const exposuresSnap = await getDocs(query(userCol(userId, 'exposures')));
  exposuresSnap.docs.filter((d) => d.data().babyId === babyId).forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

// ── Migration: upload localStorage data to Firestore ──

export async function migrateLocalToFirestore(userId: string): Promise<void> {
  const { migrateToMultiBaby } = await import(/* @vite-ignore */ '../storage');
  const data = migrateToMultiBaby();

  if (data.babies.length === 0 && data.foods.length === 0 && data.exposures.length === 0) return;

  const batch = writeBatch(db);

  for (const baby of data.babies) {
    const { id, ...rest } = baby;
    batch.set(userDoc(userId, 'babies', id), rest);
  }
  for (const food of data.foods) {
    const { id, ...rest } = food;
    batch.set(userDoc(userId, 'foods', id), rest);
  }
  for (const exposure of data.exposures) {
    const { id, ...rest } = exposure;
    batch.set(userDoc(userId, 'exposures', id), rest);
  }

  await batch.commit();

  localStorage.removeItem('lavilog-babies');
  localStorage.removeItem('lavilog-foods');
  localStorage.removeItem('lavilog-exposures');
  localStorage.removeItem('lavilog-trials');
  localStorage.removeItem('lavilog-active-baby');
  localStorage.removeItem('lavilog-migrated-v2');
}

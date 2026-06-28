import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export function onAuth(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? toAuthUser(user) : null);
  });
}

export async function signInEmail(email: string, password: string): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(cred.user);
}

export async function signUpEmail(email: string, password: string, name: string): Promise<AuthUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return toAuthUser(cred.user);
}

export async function signInGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return toAuthUser(cred.user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

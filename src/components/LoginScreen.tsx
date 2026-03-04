import { useState, useMemo, FormEvent } from 'react';
import { signInEmail, signUpEmail, signInGoogle } from '../services/authService';

interface LoginScreenProps {
  onError: (msg: string) => void;
}

interface PasswordCheck {
  label: string;
  ok: boolean;
}

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'לפחות 8 תווים', ok: password.length >= 8 },
    { label: 'אות גדולה (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'אות קטנה (a-z)', ok: /[a-z]/.test(password) },
    { label: 'מספר (0-9)', ok: /\d/.test(password) },
  ];
}

function getPasswordStrength(checks: PasswordCheck[]): { level: number; label: string; color: string } {
  const passed = checks.filter((c) => c.ok).length;
  if (passed <= 1) return { level: 1, label: 'חלשה', color: '#e05252' };
  if (passed === 2) return { level: 2, label: 'בינונית', color: '#f59e0b' };
  if (passed === 3) return { level: 3, label: 'טובה', color: '#3b82f6' };
  return { level: 4, label: 'חזקה', color: '#10b981' };
}

export function LoginScreen({ onError }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const strength = useMemo(() => getPasswordStrength(checks), [checks]);
  const allChecksPass = checks.every((c) => c.ok);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isSignUp && !name.trim()) return;

    if (isSignUp && !allChecksPass) {
      onError('הסיסמה לא עומדת בכל הדרישות');
      return;
    }

    setBusy(true);
    try {
      if (isSignUp) {
        await signUpEmail(email.trim(), password, name.trim());
      } else {
        await signInEmail(email.trim(), password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בהתחברות';
      onError(translateFirebaseError(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signInGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בהתחברות';
      onError(translateFirebaseError(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="login-logo">🍼</span>
        <h1>LaviLog</h1>
        <p>מעקב אוכל וחשיפות לתינוק</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>שם</label>
              <input type="text" placeholder="השם שלך" value={name}
                onChange={(e) => setName(e.target.value)} required={isSignUp} />
            </div>
          )}
          <div className="form-group">
            <label>אימייל</label>
            <input type="email" placeholder="email@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
          </div>
          <div className="form-group">
            <label>סיסמה</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={isSignUp ? 8 : 6} dir="ltr" />
          </div>

          {isSignUp && password.length > 0 && (
            <div className="password-strength">
              <div className="password-meter">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="password-meter-bar" style={{
                    background: i <= strength.level ? strength.color : 'var(--color-border)',
                  }} />
                ))}
              </div>
              <span className="password-strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
              <div className="password-checks">
                {checks.map((c) => (
                  <span key={c.label} className={`password-check ${c.ok ? 'ok' : ''}`}>
                    {c.ok ? '✓' : '○'} {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary login-btn" disabled={busy || (isSignUp && !allChecksPass && password.length > 0)}>
            {busy ? '...' : isSignUp ? 'הרשמה' : 'התחברות'}
          </button>
        </form>

        <div className="login-divider">
          <span>או</span>
        </div>

        <button className="btn login-google-btn" onClick={handleGoogle} disabled={busy}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          התחברות עם Google
        </button>

        <p className="login-toggle">
          {isSignUp ? 'כבר יש לך חשבון?' : 'אין לך חשבון?'}
          <button type="button" className="login-toggle-btn" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'התחברות' : 'הרשמה'}
          </button>
        </p>
      </div>
    </div>
  );
}

function translateFirebaseError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return 'אימייל או סיסמה שגויים';
  if (msg.includes('email-already-in-use'))
    return 'האימייל כבר רשום במערכת';
  if (msg.includes('weak-password'))
    return 'הסיסמה חלשה מדי';
  if (msg.includes('invalid-email'))
    return 'כתובת אימייל לא תקינה';
  if (msg.includes('too-many-requests'))
    return 'יותר מדי ניסיונות. נסו שוב מאוחר יותר';
  if (msg.includes('popup-closed'))
    return 'חלון ההתחברות נסגר';
  return msg;
}

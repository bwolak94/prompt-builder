import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AccountTabProps {
  email: string;
}

export const AccountTab: React.FC<AccountTabProps> = ({ email }) => {
  // ── Change password ────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [pwError, setPwError] = useState<string | null>(null);

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      setPwError('Hasła nie są identyczne.');
      setPwStatus('error');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Hasło musi mieć co najmniej 8 znaków.');
      setPwStatus('error');
      return;
    }

    setPwSaving(true);
    setPwStatus('idle');
    setPwError(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Błąd zmiany hasła');
      }
      setPwStatus('ok');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwStatus('idle'), 3000);
    } catch (err) {
      setPwStatus('error');
      setPwError(err instanceof Error ? err.message : 'Błąd zmiany hasła');
    } finally {
      setPwSaving(false);
    }
  }, [newPassword, confirmPassword]);

  // ── Delete account ─────────────────────────────────────────────────────────
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/';
      }
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Change password */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Zmiana hasła</h3>
        <div className="flex flex-col gap-4 max-w-sm">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password" className="text-xs">Nowe hasło</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 znaków"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
                aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              >
                {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password" className="text-xs">Potwierdź hasło</Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Powtórz nowe hasło"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleChangePassword}
              disabled={pwSaving || !newPassword}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {pwSaving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              Zmień hasło
            </button>
            {pwStatus === 'ok' && <span className="text-xs text-emerald-400">Hasło zmienione!</span>}
            {pwStatus === 'error' && <span className="text-xs text-red-400">{pwError}</span>}
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <h3 className="mb-2 text-sm font-semibold text-red-400">Strefa niebezpieczna</h3>
        <p className="mb-4 text-xs text-text-muted">
          Usunięcie konta jest nieodwracalne. Wszystkie Twoje prompty i dane zostaną trwale usunięte.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
              Usuń konto
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć konto?</AlertDialogTitle>
              <AlertDialogDescription>
                Tej akcji nie można cofnąć. Aby potwierdzić, wpisz swój adres email:{' '}
                <strong>{email}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={email}
              className="mt-2"
              aria-label="Potwierdź email"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmEmail('')}>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirmEmail !== email || isDeleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Usuwanie…' : 'Usuń konto na zawsze'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
};

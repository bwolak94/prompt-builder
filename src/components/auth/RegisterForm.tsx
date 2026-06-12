import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Nazwa musi mieć co najmniej 2 znaki')
      .max(50, 'Nazwa może mieć maksymalnie 50 znaków'),
    email: z.email('Podaj prawidłowy adres email'),
    password: z
      .string()
      .min(8, 'Hasło musi mieć co najmniej 8 znaków')
      .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
      .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę'),
    confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text-primary block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-error text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-md border bg-surface-sunken px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
    hasError ? 'border-error' : 'border-border focus:border-brand-500'
  }`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          displayName: values.displayName,
        }),
      });

      const body = (await res.json()) as { error?: string; code?: string };

      if (!res.ok) {
        if (body.code === 'EMAIL_CONFIRMATION_REQUIRED') {
          toast.success('Sprawdź skrzynkę email — wysłaliśmy link potwierdzający.');
          return;
        }
        toast.error(body.error ?? 'Błąd rejestracji. Spróbuj ponownie.');
        return;
      }

      toast.success('Witaj w PromptBase! Przekierowuję…');
      window.location.href = '/dashboard';
    } catch {
      toast.error('Błąd sieci. Sprawdź połączenie i spróbuj ponownie.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Display name */}
      <Field id="reg-name" label="Nazwa wyświetlana" error={errors.displayName?.message}>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          {...register('displayName')}
          className={inputClass(!!errors.displayName)}
          placeholder="Jan Kowalski"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? 'reg-name-error' : undefined}
        />
      </Field>

      {/* Email */}
      <Field id="reg-email" label="Email" error={errors.email?.message}>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={inputClass(!!errors.email)}
          placeholder="ty@przykład.pl"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'reg-email-error' : undefined}
        />
      </Field>

      {/* Password */}
      <Field id="reg-password" label="Hasło" error={errors.password?.message}>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password')}
            className={inputClass(!!errors.password) + ' pr-10'}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={
              [errors.password ? 'reg-password-error' : '', 'password-strength']
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-text-muted hover:text-text-secondary absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
            aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div id="password-strength">
          <PasswordStrengthIndicator password={passwordValue} />
        </div>
      </Field>

      {/* Confirm password */}
      <Field id="reg-confirm" label="Potwierdź hasło" error={errors.confirmPassword?.message}>
        <div className="relative">
          <input
            id="reg-confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={inputClass(!!errors.confirmPassword) + ' pr-10'}
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="text-text-muted hover:text-text-secondary absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
            aria-label={showConfirm ? 'Ukryj potwierdzenie hasła' : 'Pokaż potwierdzenie hasła'}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-500 hover:bg-brand-600 focus-visible:outline-brand-500 mt-2 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? 'Rejestracja…' : 'Utwórz konto'}
      </button>

      <p className="text-text-muted text-center text-xs">
        Rejestrując się, akceptujesz{' '}
        <a href="/terms" className="text-brand-400 hover:text-brand-300 transition-colors">
          Regulamin
        </a>{' '}
        i{' '}
        <a href="/privacy" className="text-brand-400 hover:text-brand-300 transition-colors">
          Politykę prywatności
        </a>
        .
      </p>
    </form>
  );
}

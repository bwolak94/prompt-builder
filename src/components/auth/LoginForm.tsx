import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.email('Podaj prawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  redirectTo?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginForm({ redirectTo = '/dashboard' }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = (await res.json()) as { error?: string; data?: unknown };

      if (!res.ok) {
        toast.error(body.error ?? 'Błąd logowania. Spróbuj ponownie.');
        return;
      }

      window.location.href = redirectTo;
    } catch {
      toast.error('Błąd sieci. Sprawdź połączenie i spróbuj ponownie.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="text-text-primary block text-sm font-medium">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={`bg-surface-sunken text-text-primary placeholder:text-text-muted focus:ring-brand-500 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none ${
            errors.email ? 'border-error' : 'border-border focus:border-brand-500'
          }`}
          placeholder="ty@przykład.pl"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
        />
        {errors.email && (
          <p id="login-email-error" className="text-error text-xs" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="login-password" className="text-text-primary block text-sm font-medium">
          Hasło
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            className={`bg-surface-sunken text-text-primary placeholder:text-text-muted focus:ring-brand-500 w-full rounded-md border px-3 py-2 pr-10 text-sm transition-colors focus:ring-2 focus:outline-none ${
              errors.password ? 'border-error' : 'border-border focus:border-brand-500'
            }`}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
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
        {errors.password && (
          <p id="login-password-error" className="text-error text-xs" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Forgot password link */}
      <div className="flex justify-end">
        <a
          href="/forgot-password"
          className="text-text-muted hover:text-text-secondary text-xs transition-colors"
        >
          Zapomniałeś hasła?
        </a>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-500 hover:bg-brand-600 focus-visible:outline-brand-500 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
      </button>
    </form>
  );
}

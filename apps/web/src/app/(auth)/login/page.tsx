'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { WEB_ROUTES } from '@edu-platform/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    try {
      await login(String(form.get('email')), String(form.get('password')));
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === 'Failed to fetch'
          ? 'Cannot reach API. Start backend: pnpm --filter @edu-platform/api dev (port 3001)'
          : err instanceof Error
            ? err.message
            : 'Login failed';
      setError(message);
    }
  }

  return (
    <section className="w-full max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          {searchParams.get('from')
            ? 'Sign in to continue to your lesson'
            : 'Welcome back to Kids Edu'}
        </p>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue="student@test.com"
          />
        </section>
        <section className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            defaultValue="Test1234!"
          />
        </section>
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-xs">
        API: {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}
      </p>

      <p className="text-muted-foreground text-center text-sm">
        No account?{' '}
        <Link href={WEB_ROUTES.REGISTER} className="text-primary font-medium hover:underline">
          Register
        </Link>
      </p>
    </section>
  );
}

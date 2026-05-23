import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

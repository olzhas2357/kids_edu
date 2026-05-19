'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <ErrorState title="Application error" message={error.message} onRetry={reset} />
    </main>
  );
}

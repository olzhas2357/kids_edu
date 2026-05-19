'use client';

import { ErrorState } from '@/components/feedback';

export default function StudentError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorState title="Student area error" message={error.message} onRetry={reset} />;
}

'use client';

import { ErrorState } from '@/components/feedback';

export default function TeacherError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorState title="Teacher area error" message={error.message} onRetry={reset} />;
}

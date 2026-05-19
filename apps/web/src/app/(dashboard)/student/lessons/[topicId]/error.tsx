'use client';

import { ErrorState } from '@/components/feedback';

export default function LessonError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Lesson error" message={error.message} onRetry={reset} />;
}

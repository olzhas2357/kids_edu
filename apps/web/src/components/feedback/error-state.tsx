'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-7 w-7 text-red-600" />
      </span>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </section>
  );
}

'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-7 w-7" />
      </span>
      <div className="max-w-sm space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </section>
  );
}

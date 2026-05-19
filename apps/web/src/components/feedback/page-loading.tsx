import { Skeleton } from '@/components/ui/skeleton';

export function PageLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <section className="space-y-6" aria-busy="true" aria-label={label}>
      <Skeleton className="h-8 w-48" />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </section>
    </section>
  );
}

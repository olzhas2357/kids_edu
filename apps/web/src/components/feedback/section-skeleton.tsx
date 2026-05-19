import { Skeleton } from '@/components/ui/skeleton';

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </section>
  );
}

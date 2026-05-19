import { cn } from '@/lib/utils';

export function Avatar({
  className,
  name,
  src,
  size = 'md',
}: {
  className?: string;
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12' }[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-primary text-primary-foreground flex items-center justify-center rounded-full font-medium',
        sizeClass,
        className,
      )}
    >
      {initials}
    </div>
  );
}

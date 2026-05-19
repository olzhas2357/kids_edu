import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WEB_ROUTES } from '@edu-platform/shared';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Button asChild>
        <Link href={WEB_ROUTES.HOME}>Go home</Link>
      </Button>
    </main>
  );
}

import Link from 'next/link';
import { WEB_ROUTES } from '@edu-platform/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <section className="max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight">Kids Edu Platform</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Learning platform for children 8–10 years — simple, safe, and fun.
        </p>
      </section>

      <section className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teacher</CardTitle>
            <CardDescription>Manage topics, students, and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={WEB_ROUTES.TEACHER.DASHBOARD}>Teacher area</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student</CardTitle>
            <CardDescription>Learn, practice, and get AI hints</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={WEB_ROUTES.STUDENT.TOPICS}>Student area</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <p className="text-muted-foreground text-sm">
        <Link href={WEB_ROUTES.LOGIN} className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}

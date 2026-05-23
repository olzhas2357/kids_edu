import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { getSessionProfile } from '@/lib/auth';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'teacher') redirect('/student');

  return (
    <>
      <Navbar
        role="teacher"
        email={profile.email}
        links={[
          { href: '/teacher', label: 'Панель' },
          { href: '/teacher/topics', label: 'Темы' },
          { href: '/teacher/analytics', label: 'Аналитика' },
          { href: '/teacher/final-test', label: 'Финальный тест' },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </>
  );
}

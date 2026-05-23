import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { getSessionProfile } from '@/lib/auth';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'student') redirect('/teacher');

  return (
    <>
      <Navbar
        role="student"
        email={profile.email}
        links={[
          { href: '/student/course', label: 'Курс' },
          { href: '/student/final', label: 'Финальный тест' },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </>
  );
}

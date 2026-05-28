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
          { href: '/teacher', label: 'Мұғалім панелі' },
          { href: '/teacher/students', label: 'Оқушылар' },
          { href: '/teacher/topics', label: 'Тақырыптар' },
          { href: '/teacher/analytics', label: 'Талдау' },
          { href: '/teacher/final-test', label: 'Соңғы тест' },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </>
  );
}

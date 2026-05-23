'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function Navbar({
  role,
  email,
  links,
}: {
  role: 'teacher' | 'student';
  email: string;
  links: { href: string; label: string }[];
}) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={role === 'teacher' ? '/teacher' : '/student'} className="font-semibold text-indigo-600">
          Kids Edu
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-600 hover:text-indigo-600">
              {l.label}
            </Link>
          ))}
          <span className="hidden text-slate-400 sm:inline">{email}</span>
          <Button variant="outline" type="button" onClick={logout}>
            Log out
          </Button>
        </nav>
      </div>
    </header>
  );
}

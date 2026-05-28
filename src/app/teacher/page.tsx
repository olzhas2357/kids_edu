'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<{
    studentCount: number;
    topicStats: { title: string; avgScore: number; completedCount: number }[];
    weakStudents: { name: string; avgScore: number }[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/teacher/analytics')
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Мұғалім панелі</h1>
      <p className="mb-8 text-slate-500">Информатика · 3 сынып · 3 тоқсан</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Оқушылар</p>
          <p className="text-3xl font-bold">{stats?.studentCount ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Тақырыптар</p>
          <p className="text-3xl font-bold">{stats?.topicStats?.length ?? 8}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Әлсіз оқушылар</p>
          <p className="text-3xl font-bold">{stats?.weakStudents?.length ?? '—'}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Қиын тақырыптар</h2>
          {stats?.topicStats
            .filter((t) => t.avgScore > 0 && t.avgScore < 70)
            .map((t) => (
              <p key={t.title} className="text-sm text-slate-600">
                {t.title}: ср. {t.avgScore}%
              </p>
            )) ?? <p className="text-sm text-slate-400">Деректер жоқ</p>}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Жедел әрекеттер</h2>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/teacher/students" className="text-indigo-600 hover:underline">
              Оқушыларды басқару →
            </Link>
            <Link href="/teacher/topics" className="text-indigo-600 hover:underline">
              Тақырыптарды басқару →
            </Link>
            <Link href="/teacher/analytics" className="text-indigo-600 hover:underline">
              Толық талдау →
            </Link>
            <Link href="/teacher/final-test" className="text-indigo-600 hover:underline">
              Соңғы тест (10 сұрақ) →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<{
    studentStats: { name: string; completedTopics: number; avgScore: number; isWeak: boolean }[];
    difficultTopics: { title: string; avgScore: number; completedCount: number }[];
    topicStats: { title: string; avgScore: number; completedCount: number }[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/teacher/analytics')
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Сынып аналитикасы</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Оқушылардың прогресі</h2>
          <div className="space-y-2">
            {data?.studentStats?.map((s) => (
              <div key={s.name} className="flex justify-between text-sm">
                <span className={s.isWeak ? 'text-red-600' : ''}>{s.name}</span>
                <span>
                  {s.completedTopics}/8 тақырып · ср. {s.avgScore}%
                </span>
              </div>
            )) ?? <p className="text-slate-400">Оқушылар жоқ</p>}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Әлсіз тақырыптар (&lt;70%)</h2>
          {data?.difficultTopics?.length ? (
            data.difficultTopics.map((t) => (
              <p key={t.title} className="text-sm text-slate-600">
                {t.title}: ср. {t.avgScore}% ({t.completedCount} аяқтаған)
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-400">Қиын тақырыптар әлі жоқ</p>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Барлық тақырыптар</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2">Тақырып</th>
                <th className="py-2">Орташа ұпай</th>
                <th className="py-2">Аяқтағандар</th>
              </tr>
            </thead>
            <tbody>
              {data?.topicStats?.map((t) => (
                <tr key={t.title} className="border-b border-slate-50">
                  <td className="py-2">{t.title}</td>
                  <td className="py-2">{t.avgScore}%</td>
                  <td className="py-2">{t.completedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

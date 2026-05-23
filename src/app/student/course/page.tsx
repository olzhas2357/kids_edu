'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { CoursePath, Progress } from '@/lib/types';

interface TopicRow {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  locked: boolean;
  statusLabel: string;
  progress: Progress | null;
}

export default function StudentCoursePage() {
  const [coursePath, setCoursePath] = useState<CoursePath | null>(null);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [allTopicsDone, setAllTopicsDone] = useState(false);
  const [finalDone, setFinalDone] = useState(false);

  useEffect(() => {
    fetch('/api/course')
      .then((r) => r.json())
      .then((d) => {
        setCoursePath(d.coursePath);
        setTopics(d.topics ?? []);
        setAllTopicsDone(d.allTopicsDone ?? false);
        setFinalDone(d.finalProgress?.final_completed ?? false);
      });
  }, []);

  return (
    <div>
      <p className="text-sm text-indigo-600">{coursePath?.subject}</p>
      <h1 className="mb-1 text-2xl font-bold">{coursePath?.title ?? 'Курс'}</h1>
      <p className="mb-8 text-slate-500">{topics.length} тем · линейное прохождение</p>

      {finalDone ? (
        <Card className="mb-8 border-green-200 bg-green-50">
          <p className="text-lg font-semibold text-green-800">Курсты сәтті аяқтадың! 🎉</p>
          <Link href="/student/success" className="mt-2 inline-block text-sm text-green-700 underline">
            Открыть поздравление
          </Link>
        </Card>
      ) : null}

      {allTopicsDone && !finalDone ? (
        <Card className="mb-8 border-indigo-200 bg-indigo-50">
          <p className="font-medium">Все 8 тем пройдены!</p>
          <Link
            href="/student/final"
            className="mt-2 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
          >
            Финальный тест (10 вопросов) →
          </Link>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <Card key={t.id} className={t.locked ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400">Тема {t.order_index + 1}</span>
                <h3 className="font-semibold">{t.title}</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t.statusLabel}</span>
            </div>
            {t.description && <p className="mt-1 text-sm text-slate-500">{t.description}</p>}
            {t.locked ? (
              <p className="mt-3 text-sm text-slate-400">Завершите предыдущую тему (≥70%)</p>
            ) : (
              <Link
                href={`/student/course/topics/${t.id}`}
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
              >
                Открыть урок →
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

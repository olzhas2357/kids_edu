'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseOptions } from '@/lib/test-utils';
import type { GradedQuestion } from '@/lib/test-utils';

interface Question {
  id: string;
  question_text: string;
  options: unknown;
}

const RESULT_KEY = (topicId: string) => `test-result-${topicId}`;

export default function TopicTestPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/topics/${topicId}`)
      .then((r) => r.json())
      .then((d) => {
        setTitle(d.topic?.title ?? '');
        setQuestions(
          (d.questions ?? []).map((q: Question) => ({
            ...q,
            options: parseOptions(q.options),
          })),
        );
      });
  }, [topicId]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const collected: Record<string, string> = {};
    for (const q of questions) {
      const val = formData.get(q.id);
      if (typeof val === 'string') collected[q.id] = val;
    }

    if (Object.keys(collected).length < questions.length) {
      setError('Барлық сұрақтарға жауап беріңіз.');
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/tests/topic/${topicId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: collected }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Жіберу қатесі');
      return;
    }

    sessionStorage.setItem(
      RESULT_KEY(topicId),
      JSON.stringify({
        scorePercent: data.scorePercent,
        score: data.score,
        total: data.total,
        passed: data.passed,
        ai: data.ai,
        breakdown: data.breakdown,
      }),
    );

    router.push(`/student/course/topics/${topicId}/feedback`);
  }

  return (
    <div>
      <Link href={`/student/course/topics/${topicId}`} className="text-sm text-indigo-600 hover:underline">
        ← Сабақ
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{title} — тест</h1>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {questions.length < 5 ? (
        <p className="text-amber-700">Мұғалім осы тақырыпқа әлі 5 сұрақ қоспады.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {questions.map((q, i) => {
            const opts = parseOptions(q.options);
            return (
              <Card key={q.id}>
                <p className="mb-3 font-medium">
                  {i + 1}. {q.question_text}
                </p>
                {opts.length === 0 ? (
                  <p className="text-sm text-red-600">Жауап нұсқалары жоқ — мұғалімге хабарлаңыз.</p>
                ) : (
                  opts.map((opt) => (
                    <label key={`${q.id}-${opt}`} className="mb-1 flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name={q.id} value={opt} required />
                      {opt}
                    </label>
                  ))
                )}
              </Card>
            );
          })}
          <Button type="submit" disabled={loading}>
            {loading ? 'Тексеру…' : 'Тесті жіберу'}
          </Button>
        </form>
      )}
    </div>
  );
}

export type { GradedQuestion };

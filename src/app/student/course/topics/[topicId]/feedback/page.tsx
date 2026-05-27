'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AiResult } from '@/lib/types';
import type { GradedQuestion } from '@/lib/test-utils';

const LEVEL_KK: Record<string, string> = {
  weak: 'әлсіз деңгей',
  medium: 'орташа деңгей',
  good: 'жақсы деңгей',
  excellent: 'тамаша деңгей',
};

const RESULT_KEY = (topicId: string) => `test-result-${topicId}`;

interface StoredResult {
  scorePercent: number;
  score: number;
  total: number;
  passed: boolean;
  ai: AiResult;
  breakdown: GradedQuestion[];
}

export default function FeedbackPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_KEY(topicId));
    if (raw) {
      setResult(JSON.parse(raw) as StoredResult);
      return;
    }

    fetch(`/api/topics/${topicId}`)
      .then((r) => r.json())
      .then((d) => {
        const log = d.lastAi;
        const progress = d.progress;
        if (log && progress) {
          setResult({
            scorePercent: log.score_percent,
            score: Math.round((log.score_percent / 100) * 5),
            total: 5,
            passed: progress.test_passed,
            ai: {
              level: log.level,
              scorePercent: log.score_percent,
              feedback: log.feedback,
              recommendation: log.recommendation,
              action: log.action,
              canProceed: log.score_percent >= 70,
            },
            breakdown: [],
          });
        }
      });
  }, [topicId]);

  async function continueLearning() {
    await fetch('/api/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic_id: topicId,
        ai_feedback_seen: true,
        topic_completed: result?.ai.canProceed ?? false,
      }),
    });
    sessionStorage.removeItem(RESULT_KEY(topicId));
    setDone(true);
  }

  if (!result) {
    return <p className="text-slate-500">Нәтиже жүктелуде… Егер бос болса, тестті қайта тапсырыңыз.</p>;
  }

  const { scorePercent, score, total, ai, breakdown } = result;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Тест нәтижесі</h1>
      <p className="mb-2 text-lg font-semibold text-indigo-700">
        {score}/{total} ({scorePercent}%) · {LEVEL_KK[ai.level]}
      </p>
      <p className="mb-6 text-sm text-slate-500">
        {scorePercent < 50 && 'Тақырып меңгерілмеді — қайталау керек.'}
        {scorePercent >= 50 && scorePercent < 70 && '70%-ге дейін жеткізу керек — келесі тақырып құлыпта.'}
        {scorePercent >= 70 && scorePercent < 85 && 'Келесі тақырыпқа өтуге болады.'}
        {scorePercent >= 85 && 'Керемет! Келесі тақырып ашылады.'}
      </p>

      {breakdown.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold">Жауаптарды тексеру</h2>
          <div className="space-y-4">
            {breakdown.map((item, i) => (
              <div
                key={item.id}
                className={`rounded-lg border p-3 ${item.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
              >
                <p className="font-medium">
                  {i + 1}. {item.question_text}
                </p>
                <p className="mt-2 text-sm">
                  <span className="text-slate-500">Сіздің жауабыңыз: </span>
                  <span className={item.is_correct ? 'text-green-700' : 'text-red-700'}>
                    {item.user_answer ?? '—'} {item.is_correct ? '✓' : '✗'}
                  </span>
                </p>
                {!item.is_correct && (
                  <p className="mt-1 text-sm">
                    <span className="text-slate-500">Дұрыс жауап: </span>
                    <span className="font-medium text-green-800">{item.correct_answer}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-4 border-indigo-100 bg-indigo-50">
        <h2 className="mb-2 font-semibold">AI кері байланыс</h2>
        <p className="text-sm leading-relaxed">{ai.feedback}</p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-2 font-semibold">Ұсыныс</h2>
        <p className="text-sm leading-relaxed text-slate-700">{ai.recommendation}</p>
      </Card>

      {!done ? (
        <Button onClick={continueLearning}>
          {ai.canProceed ? 'Оқуды жалғастыру' : 'Сабаққа қайту'}
        </Button>
      ) : (
        <Link href="/student/course" className="text-indigo-600 hover:underline">
          ← Тақырыптар тізіміне
        </Link>
      )}

      {!ai.canProceed && !done && (
        <Link
          href={`/student/course/topics/${topicId}`}
          className="ml-4 text-sm text-slate-500 hover:underline"
        >
          Сабақты қайталау
        </Link>
      )}
    </div>
  );
}

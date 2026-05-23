'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AiResult } from '@/lib/types';

const LEVEL_RU: Record<string, string> = {
  weak: 'слабый уровень',
  medium: 'средний уровень',
  good: 'хороший уровень',
  excellent: 'отличный уровень',
};

export default function FeedbackPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [ai, setAi] = useState<AiResult | null>(null);
  const [scorePercent, setScorePercent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/topics/${topicId}`)
      .then((r) => r.json())
      .then((d) => {
        const log = d.lastAi;
        if (log) {
          setScorePercent(log.score_percent);
          setAi({
            level: log.level,
            scorePercent: log.score_percent,
            feedback: log.feedback,
            recommendation: log.recommendation,
            action: log.action,
            canProceed: log.score_percent >= 70,
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
        topic_completed: ai?.canProceed ?? false,
      }),
    });
    setDone(true);
  }

  if (!ai) return <p className="text-slate-500">Загрузка обратной связи…</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">AI-обратная связь</h1>
      <p className="mb-6 text-slate-500">Результат теста: {scorePercent}% · {LEVEL_RU[ai.level]}</p>

      <Card className="mb-4 border-indigo-100 bg-indigo-50">
        <h2 className="mb-2 font-semibold">Комментарий</h2>
        <p className="text-sm leading-relaxed">{ai.feedback}</p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-2 font-semibold">Рекомендация</h2>
        <p className="text-sm leading-relaxed text-slate-700">{ai.recommendation}</p>
      </Card>

      {scorePercent < 50 && (
        <p className="mb-4 text-sm text-red-600">Тема не усвоена. Повторите урок и пересдайте тест.</p>
      )}
      {scorePercent >= 50 && scorePercent < 70 && (
        <p className="mb-4 text-sm text-amber-600">Нужен повтор. Следующая тема заблокирована.</p>
      )}
      {scorePercent >= 70 && scorePercent < 85 && (
        <p className="mb-4 text-sm text-blue-600">Можете идти дальше, но лучше повторить материал.</p>
      )}
      {scorePercent >= 85 && (
        <p className="mb-4 text-sm text-green-600">Отлично! Следующая тема открыта.</p>
      )}

      {!done ? (
        <Button onClick={continueLearning}>
          {ai.canProceed ? 'Продолжить обучение' : 'Вернуться к уроку'}
        </Button>
      ) : (
        <Link href="/student/course" className="text-indigo-600 hover:underline">
          ← К списку тем
        </Link>
      )}

      {!ai.canProceed && !done && (
        <Link
          href={`/student/course/topics/${topicId}`}
          className="ml-4 text-sm text-slate-500 hover:underline"
        >
          Повторить урок
        </Link>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AiResult } from '@/lib/types';

const LEVEL_KK: Record<string, string> = {
  weak: 'әлсіз деңгей',
  medium: 'орташа деңгей',
  good: 'жақсы деңгей',
  excellent: 'тамаша деңгей',
};

const TEXT_KK = {
  loading: 'Кері байланыс жүктелуде…',
  title: 'AI кері байланыс',
  testResult: (scorePercent: number, level: string) => `Тест нәтижесі: ${scorePercent}% · ${level}`,
  comment: 'Пікір',
  recommendation: 'Ұсыныс',
  notLearned: 'Тақырып толық меңгерілмеді. Сабақты қайталап, тесті қайта тапсырыңыз.',
  repeatNeeded: 'Қайталау қажет. Келесі тақырып құлыпталған.',
  proceedButRepeat: 'Алға жүруге болады, бірақ материалды қайта қараған дұрыс.',
  excellent: 'Керемет! Келесі тақырып ашылды.',
  continue: 'Оқуды жалғастыру',
  backToLesson: 'Сабаққа қайту',
  repeatLesson: 'Сабақты қайталау',
  listLink: '← Тақырыптар тізіміне',
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

  if (!ai) return <p className="text-slate-500">{TEXT_KK.loading}</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">{TEXT_KK.title}</h1>
      <p className="mb-6 text-slate-500">{TEXT_KK.testResult(scorePercent, LEVEL_KK[ai.level])}</p>

      <Card className="mb-4 border-indigo-100 bg-indigo-50">
        <h2 className="mb-2 font-semibold">{TEXT_KK.comment}</h2>
        <p className="text-sm leading-relaxed">{ai.feedback}</p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-2 font-semibold">{TEXT_KK.recommendation}</h2>
        <p className="text-sm leading-relaxed text-slate-700">{ai.recommendation}</p>
      </Card>

      {scorePercent < 50 && (
        <p className="mb-4 text-sm text-red-600">{TEXT_KK.notLearned}</p>
      )}
      {scorePercent >= 50 && scorePercent < 70 && (
        <p className="mb-4 text-sm text-amber-600">{TEXT_KK.repeatNeeded}</p>
      )}
      {scorePercent >= 70 && scorePercent < 85 && (
        <p className="mb-4 text-sm text-blue-600">{TEXT_KK.proceedButRepeat}</p>
      )}
      {scorePercent >= 85 && (
        <p className="mb-4 text-sm text-green-600">{TEXT_KK.excellent}</p>
      )}

      {!done ? (
        <Button onClick={continueLearning}>
          {ai.canProceed ? TEXT_KK.continue : TEXT_KK.backToLesson}
        </Button>
      ) : (
        <Link href="/student/course" className="text-indigo-600 hover:underline">
          {TEXT_KK.listLink}
        </Link>
      )}

      {!ai.canProceed && !done && (
        <Link
          href={`/student/course/topics/${topicId}`}
          className="ml-4 text-sm text-slate-500 hover:underline"
        >
          {TEXT_KK.repeatLesson}
        </Link>
      )}
    </div>
  );
}

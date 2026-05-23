'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  question_text: string;
  options: string[];
}

export default function TopicTestPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/topics/${topicId}`)
      .then((r) => r.json())
      .then((d) => {
        setTitle(d.topic?.title ?? '');
        setQuestions(d.questions ?? []);
      });
  }, [topicId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/tests/topic/${topicId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    setLoading(false);
    if (res.ok) router.push(`/student/course/topics/${topicId}/feedback`);
  }

  return (
    <div>
      <Link href={`/student/course/topics/${topicId}`} className="text-sm text-indigo-600 hover:underline">
        ← Урок
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{title} — тест</h1>

      {questions.length < 5 ? (
        <p className="text-amber-700">Учитель ещё не добавил 5 вопросов к этой теме.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <p className="mb-3 font-medium">
                {i + 1}. {q.question_text}
              </p>
              {q.options.map((opt) => (
                <label key={opt} className="mb-1 flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    required
                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                  />
                  {opt}
                </label>
              ))}
            </Card>
          ))}
          <Button type="submit" disabled={loading}>
            {loading ? 'Проверка…' : 'Отправить тест'}
          </Button>
        </form>
      )}
    </div>
  );
}

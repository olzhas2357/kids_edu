'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  question_text: string;
  options: string[];
}

export default function FinalTestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tests/final')
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/tests/final/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.coursePassed) router.push('/student/success');
    else alert(`Результат: ${data.score}/${data.total}. Нужно 9 или 10 правильных ответов.`);
  }

  return (
    <div>
      <Link href="/student/course" className="text-sm text-indigo-600 hover:underline">
        ← К курсу
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Финальный тест</h1>
      <p className="mb-6 text-slate-500">10 вопросов. Для успеха нужно 9/10 или 10/10.</p>

      {questions.length < 10 ? (
        <p className="text-amber-700">Учитель ещё не добавил 10 вопросов финального теста.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <p className="mb-3 font-medium">
                {i + 1}. {q.question_text}
              </p>
              {q.options.map((opt) => (
                <label key={opt} className="mb-1 flex gap-2 text-sm">
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
            {loading ? 'Отправка…' : 'Завершить курс'}
          </Button>
        </form>
      )}
    </div>
  );
}

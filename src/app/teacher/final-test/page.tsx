'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const emptyQ = () => ({ question_text: '', options: ['', '', '', ''], correct_answer: '' });

export default function TeacherFinalTestPage() {
  const [questions, setQuestions] = useState(Array.from({ length: 10 }, emptyQ));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/tests/final')
      .then((r) => r.json())
      .then((d) => {
        if (d.questions?.length >= 10) {
          setQuestions(
            d.questions.map((q: { question_text: string; options: string[]; correct_answer: string }) => ({
              question_text: q.question_text,
              options: q.options,
              correct_answer: q.correct_answer ?? '',
            })),
          );
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const withAnswers = await fetch('/api/tests/final');
    const fd = await withAnswers.json();
    const fullQuestions = questions.map((q, i) => ({
      ...q,
      correct_answer: q.correct_answer || fd.questions?.[i]?.correct_answer || q.options[0],
    }));

    await fetch('/api/tests/final', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: fullQuestions }),
    });
    setSaved(true);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Финальный тест</h1>
      <p className="mb-6 text-slate-500">10 вопросов. Успех курса: 9/10 или 10/10.</p>

      <form onSubmit={save} className="space-y-4">
        {questions.map((q, i) => (
          <Card key={i}>
            <p className="mb-2 text-sm font-medium">Вопрос {i + 1}</p>
            <Input
              value={q.question_text}
              onChange={(e) => {
                const next = [...questions];
                next[i] = { ...next[i], question_text: e.target.value };
                setQuestions(next);
              }}
            />
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {q.options.map((opt, oi) => (
                <Input
                  key={oi}
                  placeholder={`Вариант ${oi + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...questions];
                    const opts = [...next[i].options];
                    opts[oi] = e.target.value;
                    next[i] = { ...next[i], options: opts };
                    setQuestions(next);
                  }}
                />
              ))}
            </div>
            <Input
              className="mt-2"
              placeholder="Правильный ответ"
              value={q.correct_answer}
              onChange={(e) => {
                const next = [...questions];
                next[i] = { ...next[i], correct_answer: e.target.value };
                setQuestions(next);
              }}
            />
          </Card>
        ))}
        <Button type="submit">{saved ? 'Сохранено ✓' : 'Сохранить финальный тест'}</Button>
      </form>
    </div>
  );
}

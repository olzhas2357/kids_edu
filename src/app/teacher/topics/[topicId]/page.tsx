'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const emptyQ = () => ({ question_text: '', options: ['', '', '', ''], correct_answer: '' });

export default function EditTopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [form, setForm] = useState({
    title: '',
    description: '',
    theory_title: 'Теория',
    theory_text: '',
    video_url: '',
    task_a_title: 'Уровень A',
    task_a_link: '',
    task_b_title: 'Уровень B',
    task_b_link: '',
    task_c_title: 'Уровень C',
    task_c_link: '',
    is_published: true,
    questions: Array.from({ length: 5 }, emptyQ),
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/topics/${topicId}`)
      .then((r) => r.json())
      .then((d) => {
        const tasks = d.tasks ?? [];
        const ta = tasks.find((t: { level: string }) => t.level === 'A');
        const tb = tasks.find((t: { level: string }) => t.level === 'B');
        const tc = tasks.find((t: { level: string }) => t.level === 'C');
        const qs =
          d.questions?.length >= 5
            ? d.questions.map((q: { question_text: string; options: string[]; correct_answer: string }) => ({
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
              }))
            : form.questions;

        setForm({
          title: d.topic?.title ?? '',
          description: d.topic?.description ?? '',
          theory_title: d.content?.theory_title ?? 'Теория',
          theory_text: d.content?.theory_text ?? '',
          video_url: d.content?.video_url ?? '',
          task_a_title: ta?.title ?? 'Уровень A',
          task_a_link: ta?.link_url ?? '',
          task_b_title: tb?.title ?? 'Уровень B',
          task_b_link: tb?.link_url ?? '',
          task_c_title: tc?.title ?? 'Уровень C',
          task_c_link: tc?.link_url ?? '',
          is_published: d.topic?.is_published ?? true,
          questions: qs,
        });
      });
  }, [topicId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/topics/${topicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateQuestion(i: number, field: 'question_text' | 'correct_answer', value: string) {
    const questions = [...form.questions];
    questions[i] = { ...questions[i], [field]: value };
    setForm({ ...form, questions });
  }

  function updateOption(qi: number, oi: number, value: string) {
    const questions = [...form.questions];
    const opts = [...questions[qi].options];
    opts[oi] = value;
    questions[qi] = { ...questions[qi], options: opts };
    setForm({ ...form, questions });
  }

  return (
    <div>
      <Link href="/teacher/topics" className="text-sm text-indigo-600 hover:underline">
        ← К списку тем
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Редактирование темы</h1>

      <form onSubmit={save} className="space-y-6">
        <Card className="space-y-3">
          <h2 className="font-semibold">Основное</h2>
          <Input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Опубликована
          </label>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Теория и видео</h2>
          <Input value={form.theory_title} onChange={(e) => setForm({ ...form, theory_title: e.target.value })} />
          <textarea
            className="min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm"
            value={form.theory_text}
            onChange={(e) => setForm({ ...form, theory_text: e.target.value })}
            placeholder="Текст теории"
          />
          <Input placeholder="YouTube URL" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Практика (внешние ссылки)</h2>
          <Input
            placeholder="Название A"
            value={form.task_a_title}
            onChange={(e) => setForm({ ...form, task_a_title: e.target.value })}
          />
          <Input
            placeholder="Ссылка A (Wordwall / LearningApps)"
            value={form.task_a_link}
            onChange={(e) => setForm({ ...form, task_a_link: e.target.value })}
          />
          <Input
            placeholder="Название B"
            value={form.task_b_title}
            onChange={(e) => setForm({ ...form, task_b_title: e.target.value })}
          />
          <Input
            placeholder="Ссылка B"
            value={form.task_b_link}
            onChange={(e) => setForm({ ...form, task_b_link: e.target.value })}
          />
          <Input
            placeholder="Название C"
            value={form.task_c_title}
            onChange={(e) => setForm({ ...form, task_c_title: e.target.value })}
          />
          <Input
            placeholder="Ссылка C"
            value={form.task_c_link}
            onChange={(e) => setForm({ ...form, task_c_link: e.target.value })}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Тест — 5 вопросов</h2>
          {form.questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-slate-100 p-3">
              <Input
                placeholder={`Вопрос ${i + 1}`}
                value={q.question_text}
                onChange={(e) => updateQuestion(i, 'question_text', e.target.value)}
              />
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <Input
                    key={oi}
                    placeholder={`Вариант ${oi + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, oi, e.target.value)}
                  />
                ))}
              </div>
              <Input
                className="mt-2"
                placeholder="Правильный ответ (точное совпадение)"
                value={q.correct_answer}
                onChange={(e) => updateQuestion(i, 'correct_answer', e.target.value)}
              />
            </div>
          ))}
        </Card>

        <Button type="submit">{saved ? 'Сохранено ✓' : 'Сохранить'}</Button>
      </form>
    </div>
  );
}

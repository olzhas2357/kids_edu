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
    task_a_title: 'A деңгей',
    task_a_link: '',
    task_b_title: 'B деңгей',
    task_b_link: '',
    task_c_title: 'C деңгей',
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
          task_a_title: ta?.title ?? 'A деңгей',
          task_a_link: ta?.link_url ?? '',
          task_b_title: tb?.title ?? 'B деңгей',
          task_b_link: tb?.link_url ?? '',
          task_c_title: tc?.title ?? 'C деңгей',
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
        ← Тақырыптар тізіміне
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Тақырыпты өңдеу</h1>

      <form onSubmit={save} className="space-y-6">
        <Card className="space-y-3">
          <h2 className="font-semibold">Негізгі</h2>
          <Input placeholder="Атауы" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input placeholder="Сипаттамасы" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Жарияланған
          </label>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Теория және видео</h2>
          <Input value={form.theory_title} onChange={(e) => setForm({ ...form, theory_title: e.target.value })} />
          <textarea
            className="min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm"
            value={form.theory_text}
            onChange={(e) => setForm({ ...form, theory_text: e.target.value })}
            placeholder="Теория мәтіні"
          />
          <Input placeholder="YouTube URL" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Практика (сыртқы сілтемелер)</h2>
          <Input
            placeholder="A атауы"
            value={form.task_a_title}
            onChange={(e) => setForm({ ...form, task_a_title: e.target.value })}
          />
          <Input
            placeholder="A сілтемесі (Wordwall / LearningApps)"
            value={form.task_a_link}
            onChange={(e) => setForm({ ...form, task_a_link: e.target.value })}
          />
          <Input
            placeholder="B атауы"
            value={form.task_b_title}
            onChange={(e) => setForm({ ...form, task_b_title: e.target.value })}
          />
          <Input
            placeholder="B сілтемесі"
            value={form.task_b_link}
            onChange={(e) => setForm({ ...form, task_b_link: e.target.value })}
          />
          <Input
            placeholder="C атауы"
            value={form.task_c_title}
            onChange={(e) => setForm({ ...form, task_c_title: e.target.value })}
          />
          <Input
            placeholder="C сілтемесі"
            value={form.task_c_link}
            onChange={(e) => setForm({ ...form, task_c_link: e.target.value })}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Тест — 5 сұрақ</h2>
          {form.questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-slate-100 p-3">
              <Input
                placeholder={`Сұрақ ${i + 1}`}
                value={q.question_text}
                onChange={(e) => updateQuestion(i, 'question_text', e.target.value)}
              />
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <Input
                    key={oi}
                    placeholder={`Жауап ${oi + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, oi, e.target.value)}
                  />
                ))}
              </div>
              <label className="mt-2 block text-xs text-slate-500">Дұрыс жауап (тізімнен таңдаңыз)</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={q.correct_answer}
                onChange={(e) => updateQuestion(i, 'correct_answer', e.target.value)}
              >
                <option value="">— таңдаңыз —</option>
                {q.options.filter(Boolean).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-amber-600">
                Маңызды: дұрыс жауап жауап нұсқаларының біреуімен дәл сәйкес болуы керек.
              </p>
            </div>
          ))}
        </Card>

        <Button type="submit">{saved ? 'Сақталды ✓' : 'Сақтау'}</Button>
      </form>
    </div>
  );
}

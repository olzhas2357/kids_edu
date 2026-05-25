'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Topic } from '@/lib/types';

export default function TeacherTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch('/api/course');
    const data = await res.json();
    setTopics(data.topics ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, order_index: topics.length }),
    });
    setTitle('');
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Тақырыпты жою керек пе?')) return;
    await fetch(`/api/topics/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Курс тақырыптары</h1>
        <Button type="button" onClick={() => setShowForm(!showForm)}>
          + Жаңа тақырып
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={create} className="flex gap-2">
            <Input
              placeholder="Тақырып атауы"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Button type="submit">Құру</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {topics.map((t) => (
          <Card key={t.id} className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">#{t.order_index + 1}</span>
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-xs text-slate-400">{t.is_published ? 'Жарияланған' : 'Тұжырым'}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/teacher/topics/${t.id}`}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Өңдеу
              </Link>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Жою
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

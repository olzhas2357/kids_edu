'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isStepUnlocked } from '@/lib/progress-rules';
import type { Progress, Task, Topic, TopicContent } from '@/lib/types';

export default function LessonPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [content, setContent] = useState<TopicContent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  async function load() {
    const res = await fetch(`/api/topics/${topicId}`);
    const data = await res.json();
    setTopic(data.topic);
    setContent(data.content);
    setTasks(data.tasks ?? []);
    setProgress(data.progress);
  }

  useEffect(() => {
    load();
  }, [topicId]);

  async function markDone(step: string) {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, step }),
    });
    load();
  }

  if (!topic) return <p className="text-slate-500">Жүктелуде…</p>;

  const canTest = isStepUnlocked(progress, 'test');

  return (
    <div>
      <Link href="/student/course" className="text-sm text-indigo-600 hover:underline">
        ← Тақырыптар тізіміне
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">{topic.title}</h1>

      <Card className="mb-4">
        <h2 className="mb-2 font-semibold">{content?.theory_title ?? 'Теория'}</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {content?.theory_text || 'Теория әлі оқытушы тарапынан қосылмады.'}
        </p>
        {!progress?.theory_done && content?.theory_text && (
          <Button className="mt-4" onClick={() => markDone('theory')}>
            ✓ Теория оқылды
          </Button>
        )}
        {progress?.theory_done && <p className="mt-2 text-sm text-green-600">Аяқталды ✓</p>}
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 font-semibold">Видео (YouTube)</h2>
        {content?.video_url ? (
          <>
            <a
              href={content.video_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-600 hover:underline"
            >
              Видеоны көру →
            </a>
            {isStepUnlocked(progress, 'video') && !progress?.video_done && (
              <Button className="mt-4 block" variant="outline" onClick={() => markDone('video')}>
                ✓ Видео қаралды
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400">Видео қосылмаған</p>
        )}
        {progress?.video_done && <p className="mt-2 text-sm text-green-600">Выполнено ✓</p>}
      </Card>

      {(['A', 'B', 'C'] as const).map((level) => {
        const task = tasks.find((t) => t.level === level);
        const field = level === 'A' ? 'task_a_done' : level === 'B' ? 'task_b_done' : 'task_c_done';
        const done = progress?.[field];
        const unlocked = isStepUnlocked(progress, level);

        return (
          <Card key={level} className="mb-3">
            <h3 className="font-medium">
              Тапсырма {level}: {task?.title ?? `${level} деңгей`}
            </h3>
            {task?.link_url ? (
              <a
                href={task.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-indigo-600 hover:underline"
              >
                Тапсырманы ашу (Wordwall / LearningApps / Genially) →
              </a>
            ) : (
              <p className="text-sm text-slate-400">Сілтеме қосылмаған</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Платформа тапсырманы тексермейді — жұмыстан кейін «орындалды» түймесін басыңыз.
            </p>
            {unlocked && !done && task?.link_url && (
              <Button className="mt-3" variant="outline" onClick={() => markDone(level)}>
                ✓ Аяқталды
              </Button>
            )}
            {done && <p className="mt-2 text-sm text-green-600">Аяқталды ✓</p>}
            {!unlocked && <p className="mt-2 text-sm text-slate-400">Алдынағы қадамды бірінші аяқтаңыз</p>}
          </Card>
        );
      })}

      {canTest ? (
        <Link
          href={`/student/course/topics/${topicId}/test`}
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          Қорытынды тест (5 сұрақ) →
        </Link>
      ) : (
        <p className="mt-6 text-sm text-slate-500">Тесті ашу үшін барлық қадамдарды орындаңыз.</p>
      )}
    </div>
  );
}

import type { Progress, Task, TopicContent } from '@/lib/types';

export type StepKey = 'theory' | 'video' | 'A' | 'B' | 'C' | 'test';

export function isStepUnlocked(progress: Progress | null, step: StepKey): boolean {
  if (!progress && step !== 'theory') return false;
  const p = progress ?? {
    theory_done: false,
    video_done: false,
    task_a_done: false,
    task_b_done: false,
    task_c_done: false,
  } as Progress;

  switch (step) {
    case 'theory':
      return true;
    case 'video':
      return p.theory_done;
    case 'A':
      return p.video_done;
    case 'B':
      return p.task_a_done;
    case 'C':
      return p.task_b_done;
    case 'test':
      return p.task_a_done && p.task_b_done && p.task_c_done;
    default:
      return false;
  }
}

export function allStepsBeforeTestDone(progress: Progress | null): boolean {
  return isStepUnlocked(progress, 'test');
}

export function isTopicLocked(
  orderIndex: number,
  topics: { id: string; order_index: number }[],
  progressList: Progress[],
): boolean {
  if (orderIndex === 0) return false;
  const prev = topics.find((t) => t.order_index === orderIndex - 1);
  if (!prev) return true;
  const prevProgress = progressList.find((p) => p.topic_id === prev.id);
  return !prevProgress?.topic_completed;
}

export function hasMinimalContent(content: TopicContent | null, tasks: Task[]): boolean {
  const hasTheory = !!content?.theory_text;
  const hasVideo = !!content?.video_url;
  const levels = new Set(tasks.map((t) => t.level));
  return hasTheory && hasVideo && levels.has('A') && levels.has('B') && levels.has('C');
}

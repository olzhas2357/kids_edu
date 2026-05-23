import type { AiAction, AiLevel } from '@/lib/types';

/** 0–50: не усвоено | 50–70: повтор | 70–85: переход с рекомендацией | 85+: отлично */
export function getAiLevel(percent: number): AiLevel {
  if (percent < 50) return 'weak';
  if (percent < 70) return 'medium';
  if (percent < 85) return 'good';
  return 'excellent';
}

export function getAiAction(percent: number): AiAction {
  if (percent < 50) return 'retry';
  if (percent < 70) return 'retry';
  if (percent < 85) return 'review';
  return 'continue';
}

export function canUnlockNextTopic(percent: number): boolean {
  return percent >= 70;
}

export function getStatusLabel(percent: number | null, completed: boolean): string {
  if (completed) return 'Завершено';
  if (percent === null) return 'Не начато';
  if (percent < 50) return 'Не усвоено';
  if (percent < 70) return 'Нужен повтор';
  if (percent < 85) return 'Допущен';
  return 'Отлично';
}

export function calcPercent(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}

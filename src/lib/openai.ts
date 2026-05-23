import OpenAI from 'openai';
import { getAiAction, getAiLevel } from '@/lib/scoring';
import type { AiResult } from '@/lib/types';

const LEVEL_LABELS = {
  weak: 'слабый',
  medium: 'средний',
  good: 'хороший',
  excellent: 'отличный',
};

export async function analyzeTestResult(
  topicTitle: string,
  score: number,
  total: number,
): Promise<AiResult> {
  const scorePercent = Math.round((score / total) * 100);
  const level = getAiLevel(scorePercent);
  const action = getAiAction(scorePercent);
  const canProceed = scorePercent >= 70;

  if (!process.env.OPENAI_API_KEY) {
    return mockFeedback(topicTitle, scorePercent, level, action, canProceed);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 280,
      messages: [
        {
          role: 'system',
          content: `Ты добрый репетитор для детей 8–10 лет. Пиши просто, коротко, на русском или казахском (1–2 предложения каждый блок). 
НЕ давай правильные ответы на вопросы теста. Только поддержка и совет.
Ответь JSON: {"feedback":"...","recommendation":"..."}`,
        },
        {
          role: 'user',
          content: `Тема: ${topicTitle}. Результат: ${score}/${total} (${scorePercent}%). Уровень: ${LEVEL_LABELS[level]}.`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { feedback?: string; recommendation?: string };
    return {
      level,
      scorePercent,
      feedback: parsed.feedback ?? defaultFeedback(scorePercent),
      recommendation: parsed.recommendation ?? defaultRecommendation(action),
      action,
      canProceed,
    };
  } catch {
    return mockFeedback(topicTitle, scorePercent, level, action, canProceed);
  }
}

function mockFeedback(
  topicTitle: string,
  scorePercent: number,
  level: AiResult['level'],
  action: AiResult['action'],
  canProceed: boolean,
): AiResult {
  return {
    level,
    scorePercent,
    feedback: defaultFeedback(scorePercent).replace('тему', `«${topicTitle}»`),
    recommendation: defaultRecommendation(action),
    action,
    canProceed,
  };
}

function defaultFeedback(percent: number): string {
  if (percent < 50) return 'Тема пока не усвоена. Не расстраивайся — попробуй ещё раз!';
  if (percent < 70) return 'Уже лучше! Повтори видео и задания, потом пересдай тест.';
  if (percent < 85) return 'Хорошая работа! Можешь идти дальше, но лучше немного повторить.';
  return 'Отлично! Ты хорошо усвоил тему.';
}

function defaultRecommendation(action: AiResult['action']): string {
  if (action === 'retry') return 'Повтори видео и задания A, B, C, затем пересдай тест.';
  if (action === 'review') return 'Пересмотри видео или слабые задания, потом переходи к следующей теме.';
  return 'Можешь переходить к следующей теме!';
}

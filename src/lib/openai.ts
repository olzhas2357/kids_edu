import OpenAI from 'openai';
import { getAiAction, getAiLevel } from '@/lib/scoring';
import type { AiResult } from '@/lib/types';

const LEVEL_LABELS = {
  weak: 'нашар',
  medium: 'орташа',
  good: 'жақсы',
  excellent: 'өте жақсы',
};

export async function analyzeTestResult(
  topicTitle: string,
  score: number,
  total: number,
  questions: {
    id: string;
    question_text: string;
    correct_answer: string;
    user_answer?: string | null;
    is_correct?: boolean;
  }[],
): Promise<AiResult> {
  const scorePercent = Math.round((score / total) * 100);
  const level = getAiLevel(scorePercent);
  const action = getAiAction(scorePercent);
  const canProceed = scorePercent >= 70;

  const questionDetails = questions
    .map((q, index) => {
      const answer = q.user_answer ?? '—';
      const ok = q.is_correct ?? false;
      return `${index + 1}. ${q.question_text}\nСіздің жауабыңыз: ${answer}\nДұрыс жауап: ${q.correct_answer}\n${ok ? '✓ Дұрыс' : '✗ Қате'}`;
    })
    .join('\n\n');

  if (!process.env.OPENAI_API_KEY) {
    return mockFeedback(scorePercent, level, action, canProceed);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 360,
      messages: [
        {
          role: 'system',
          content:
            'Сен 8–10 жастағы балаларға арналған мейірімді репетиторсың. Қысқа, қарапайым қазақша. JSON: {"feedback":"...","recommendation":"..."}',
        },
        {
          role: 'user',
          content: `Тақырып: ${topicTitle}. ${score}/${total} (${scorePercent}%).\n\n${questionDetails}`,
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
    return mockFeedback(scorePercent, level, action, canProceed);
  }
}

function mockFeedback(
  scorePercent: number,
  level: AiResult['level'],
  action: AiResult['action'],
  canProceed: boolean,
): AiResult {
  return {
    level,
    scorePercent,
    feedback: defaultFeedback(scorePercent),
    recommendation: defaultRecommendation(action),
    action,
    canProceed,
  };
}

function defaultFeedback(percent: number): string {
  if (percent < 50) return 'Тақырып әлі толық меңгерілмеді. Қайталау керек!';
  if (percent < 70) return 'Жақсы бастама! Бейнебаян мен тапсырмаларды қайтала.';
  if (percent < 85) return 'Жақсы жұмыс! Алға жүруге болады.';
  return 'Керемет! Тақырыпты өте жақсы меңгердің.';
}

function defaultRecommendation(action: AiResult['action']): string {
  if (action === 'retry') return 'Сабақты қайтала, тестті қайта тапсыр.';
  if (action === 'review') return 'Бейнебаянды қайта қара, содан кейін келесі тақырыпқа өт.';
  return 'Келесі тақырыпқа көше бер!';
}

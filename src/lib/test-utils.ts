/** Нормализация для сравнения ответов */
export function normalizeAnswer(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
}

/** options из Supabase jsonb иногда приходит строкой */
export function parseOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options.map((o) => String(o).trim()).filter(Boolean);
  }
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((o) => String(o).trim()).filter(Boolean);
      }
    } catch {
      return options.trim() ? [options.trim()] : [];
    }
  }
  return [];
}

export interface GradedQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  user_answer: string | null;
  is_correct: boolean;
}

export function gradeQuestion(
  q: { id: string; question_text: string; options: unknown; correct_answer: string },
  userAnswer: string | undefined,
): GradedQuestion {
  const options = parseOptions(q.options);
  const user = userAnswer?.trim() ?? '';
  const correctRaw = q.correct_answer?.trim() ?? '';

  return {
    id: q.id,
    question_text: q.question_text,
    options,
    correct_answer: resolveCorrectText(correctRaw, options),
    user_answer: user || null,
    is_correct: isAnswerCorrect(user, correctRaw, options),
  };
}

/** Текст правильного варианта для показа ученику */
export function resolveCorrectText(correctAnswer: string, options: string[]): string {
  if (!correctAnswer) return '—';

  const byText = options.find((o) => normalizeAnswer(o) === normalizeAnswer(correctAnswer));
  if (byText) return byText;

  const idx = parseInt(correctAnswer, 10);
  if (!Number.isNaN(idx) && idx >= 1 && idx <= options.length) {
    return options[idx - 1];
  }

  const letter = correctAnswer.toUpperCase();
  const letterIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  if (letter in letterIndex && options[letterIndex[letter]]) {
    return options[letterIndex[letter]];
  }

  return correctAnswer;
}

export function isAnswerCorrect(
  userAnswer: string,
  correctAnswer: string,
  options: string[],
): boolean {
  if (!userAnswer.trim() || !correctAnswer.trim()) return false;

  const userNorm = normalizeAnswer(userAnswer);
  const correctNorm = normalizeAnswer(correctAnswer);

  // Direct match (both are text or both are letters/numbers)
  if (userNorm === correctNorm) return true;

  // If correctAnswer is a letter/index, resolve it to option text and compare
  const correctText = resolveCorrectText(correctAnswer, options);
  if (normalizeAnswer(correctText) === userNorm) return true;

  // If userAnswer is a letter/index, resolve it to option text and compare to correct
  const userResolved = resolveCorrectText(userAnswer, options);
  if (normalizeAnswer(userResolved) === normalizeAnswer(correctText)) return true;

  return false;
}

export function gradeAllQuestions(
  questions: { id: string; question_text: string; options: unknown; correct_answer: string }[],
  answers: Record<string, string>,
): { score: number; total: number; breakdown: GradedQuestion[] } {
  const breakdown = questions.map((q) => gradeQuestion(q, answers[q.id]));
  const score = breakdown.filter((b) => b.is_correct).length;
  return { score, total: breakdown.length, breakdown };
}

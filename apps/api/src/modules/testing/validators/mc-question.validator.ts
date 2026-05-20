import { QuestionType } from '@prisma/client';
import { TestingException } from '../exceptions/testing.exception';
import { MC_QUESTION_TYPES } from '../constants/testing.constants';

export interface McTestConfig {
  questionCount: number;
  choicesPerQuestion: number;
}

export interface QuestionLike {
  id: string;
  questionText: string;
  type: QuestionType;
  options: unknown;
  correctAnswer: unknown;
  points: number;
  orderIndex: number;
}

export function validateMcTestQuestions(
  questions: QuestionLike[],
  config: McTestConfig,
): void {
  if (questions.length !== config.questionCount) {
    throw new TestingException(
      'TEST_INVALID_FORMAT',
      `Test must have exactly ${config.questionCount} questions (found ${questions.length})`,
    );
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!MC_QUESTION_TYPES.includes(q.type)) {
      throw new TestingException(
        'TEST_INVALID_FORMAT',
        `Question ${i + 1} must be multiple choice (single or multi select)`,
      );
    }

    const options = normalizeOptions(q.options);
    if (options.length !== config.choicesPerQuestion) {
      throw new TestingException(
        'TEST_INVALID_FORMAT',
        `Question ${i + 1} must have exactly ${config.choicesPerQuestion} answer options`,
      );
    }

    validateCorrectAnswerInOptions(q.correctAnswer, options, q.type, i + 1);
  }
}

export function normalizeOptions(options: unknown): string[] {
  if (!Array.isArray(options)) {
    return [];
  }
  return options.map((o) => String(o).trim());
}

export function validateAnswerAgainstOptions(
  answer: unknown,
  options: string[],
  type: QuestionType,
): void {
  if (type === QuestionType.MULTIPLE_CHOICE) {
    const selected = Array.isArray(answer) ? answer.map(String) : [String(answer)];
    for (const s of selected) {
      if (!options.includes(s)) {
        throw new TestingException('INVALID_ANSWER_OPTION', `Invalid option: ${s}`);
      }
    }
    return;
  }

  const value = Array.isArray(answer) ? answer[0] : answer;
  if (!options.includes(String(value))) {
    throw new TestingException('INVALID_ANSWER_OPTION', 'Selected answer is not a valid option');
  }
}

function validateCorrectAnswerInOptions(
  correct: unknown,
  options: string[],
  type: QuestionType,
  questionNum: number,
): void {
  try {
    validateAnswerAgainstOptions(correct, options, type);
  } catch {
    throw new TestingException(
      'TEST_INVALID_FORMAT',
      `Question ${questionNum} correct answer must match one of the ${options.length} options`,
    );
  }
}

/** Public view — options without correct answer */
export function mapQuestionForStudent(q: QuestionLike) {
  return {
    id: q.id,
    questionText: q.questionText,
    type: q.type,
    options: normalizeOptions(q.options),
    points: q.points,
    orderIndex: q.orderIndex,
  };
}

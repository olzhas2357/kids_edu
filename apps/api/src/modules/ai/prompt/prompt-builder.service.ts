import { Injectable } from '@nestjs/common';
import type { AnalyzeTestInput, PracticeHintInput } from '../types';

const CHILD_AUDIENCE_RULES = `
You help children aged 8–10 learn on an educational platform.

STRICT RULES:
- Use simple, kind, short sentences (2–4 sentences per field when possible).
- Never give the direct/correct answer to a test or practice question.
- Use the Socratic method: ask guiding questions and give small hints only.
- No scary, violent, adult, or inappropriate content.
- Be encouraging; celebrate effort, not only results.
- Write in the same language as the student's message (Russian or English).
`.trim();

@Injectable()
export class PromptBuilderService {
  buildSystemPrompt(): string {
    return `${CHILD_AUDIENCE_RULES}

You must respond with valid JSON only (no markdown).`;
  }

  buildTestAnalysisUserPrompt(input: AnalyzeTestInput): string {
    const questionSummary = input.questions
      .map(
        (q, i) =>
          `Q${i + 1} (${q.type}, ${q.points} pts): "${q.text}"
Student answer: ${JSON.stringify(q.studentAnswer)}
Result: ${q.isCorrect ? 'correct' : 'incorrect'} (${q.pointsEarned}/${q.points} pts)`,
      )
      .join('\n');

    return `Analyze this student's test for topic "${input.topicTitle}".

Test score: ${input.scorePercent}% (pass threshold: ${input.unlockThreshold}%)
Passed: ${input.passed}

Questions:
${questionSummary}

Return JSON with exactly these fields:
{
  "score": <number 0-100, use the test score ${input.scorePercent}>,
  "level": "<weak|medium|good|excellent>",
  "feedback": "<friendly summary for the child, no direct answers>",
  "recommendation": "<what to do next: repeat or move on>",
  "allowNextTopic": <boolean, true only if score >= ${input.unlockThreshold}>,
  "socraticHint": "<one guiding question to think deeper, not the answer>"
}

Level guide: weak <50, medium 50-69, good 70-84, excellent >=85.`;
  }

  buildPracticeHintUserPrompt(input: PracticeHintInput): string {
    const studentPart = input.studentMessage
      ? `Student says: "${input.studentMessage}"`
      : 'Student asked for a hint on this practice task.';

    return `Practice task (level ${input.level}) in topic "${input.topicTitle}":
Title: ${input.taskTitle}
Task: ${input.taskPrompt}

${studentPart}

Return JSON:
{
  "socraticHint": "<one short guiding question, never the answer>",
  "encouragement": "<one short encouraging sentence>"
}`;
  }

  buildChatUserPrompt(message: string, topicTitle?: string): string {
    const context = topicTitle ? `Topic: "${topicTitle}".\n` : '';
    return `${context}Student message: "${message}"

Reply with JSON:
{
  "socraticHint": "<guiding question only>",
  "encouragement": "<short encouragement>"
}

Do NOT solve the problem for the student.`;
  }

  buildFallbackTestResponse(
    score: number,
    threshold: number,
    passed: boolean,
  ): string {
    const level =
      score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'medium' : 'weak';

    const feedback = passed
      ? `Great job! You scored ${score}%. You understood this topic well.`
      : `You scored ${score}%. Keep learning — you can try again!`;

    const recommendation = passed
      ? 'You can open the next topic and keep exploring.'
      : `Review the theory and practice, then try the test again. You need ${threshold}% to continue.`;

    const socraticHint = passed
      ? 'What was the most interesting thing you learned in this topic?'
      : 'Which question felt hardest — can you remember what the topic taught about it?';

    return JSON.stringify({
      score,
      level,
      feedback,
      recommendation,
      allowNextTopic: passed,
      socraticHint,
    });
  }
}

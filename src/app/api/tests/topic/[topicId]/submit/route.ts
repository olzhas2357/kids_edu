import { NextResponse } from 'next/server';
import { TOPIC_QUESTION_COUNT } from '@/lib/constants';
import { getSessionProfile } from '@/lib/auth';
import { analyzeTestResult } from '@/lib/openai';
import { allStepsBeforeTestDone } from '@/lib/progress-rules';
import { calcPercent, canUnlockNextTopic } from '@/lib/scoring';
import { gradeAllQuestions } from '@/lib/test-utils';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const { topicId } = await params;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { answers } = (await request.json()) as { answers: Record<string, string> };
  const supabase = await createClient();

  const { data: progress } = await supabase
    .from('progress')
    .select('*')
    .eq('student_id', profile.id)
    .eq('topic_id', topicId)
    .maybeSingle();

  if (!allStepsBeforeTestDone(progress)) {
    return NextResponse.json({ error: 'Complete all steps before the test' }, { status: 400 });
  }

  const { data: topic } = await supabase.from('topics').select('title').eq('id', topicId).single();
  const { data: test } = await supabase.from('tests').select('id').eq('topic_id', topicId).single();
  if (!test) return NextResponse.json({ error: 'Test not configured' }, { status: 400 });

  const { data: questions } = await supabase
    .from('test_questions')
    .select('*')
    .eq('test_id', test.id)
    .order('order_index');

  if (!questions?.length || questions.length < TOPIC_QUESTION_COUNT) {
    return NextResponse.json({ error: 'Teacher must add 5 test questions' }, { status: 400 });
  }

  const { score, total, breakdown } = gradeAllQuestions(questions, answers);
  const scorePercent = calcPercent(score, total);
  const passed = canUnlockNextTopic(scorePercent);

  await supabase.from('attempts').insert({
    student_id: profile.id,
    test_id: test.id,
    topic_id: topicId,
    score,
    total,
    score_percent: scorePercent,
    answers,
  });

  const ai = await analyzeTestResult(
    topic!.title,
    score,
    total,
    breakdown.map((b) => ({
      id: b.id,
      question_text: b.question_text,
      correct_answer: b.correct_answer,
      user_answer: b.user_answer,
      is_correct: b.is_correct,
    })),
  );

  await supabase.from('ai_logs').insert({
    student_id: profile.id,
    topic_id: topicId,
    score_percent: scorePercent,
    level: ai.level,
    feedback: ai.feedback,
    recommendation: ai.recommendation,
    action: ai.action,
  });

  const progressUpdate = {
    test_score_percent: scorePercent,
    test_passed: passed,
    updated_at: new Date().toISOString(),
  };

  if (progress) {
    await supabase.from('progress').update(progressUpdate).eq('id', progress.id);
  } else {
    await supabase.from('progress').insert({
      student_id: profile.id,
      topic_id: topicId,
      ...progressUpdate,
    });
  }

  return NextResponse.json({
    score,
    total,
    scorePercent,
    passed,
    ai,
    breakdown,
  });
}

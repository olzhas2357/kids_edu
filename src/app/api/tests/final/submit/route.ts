import { NextResponse } from 'next/server';
import { DEFAULT_COURSE_PATH_ID, FINAL_QUESTION_COUNT } from '@/lib/constants';
import { getSessionProfile } from '@/lib/auth';
import { calcPercent } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { answers } = (await request.json()) as { answers: Record<string, string> };
  const supabase = await createClient();

  const { count: completed } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', profile.id)
    .eq('topic_completed', true);

  const { count: topicCount } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('course_path_id', DEFAULT_COURSE_PATH_ID)
    .eq('is_published', true);

  if ((completed ?? 0) < (topicCount ?? 8)) {
    return NextResponse.json({ error: 'Complete all 8 topics first' }, { status: 400 });
  }

  const { data: test } = await supabase
    .from('tests')
    .select('id')
    .eq('course_path_id', DEFAULT_COURSE_PATH_ID)
    .eq('test_type', 'final')
    .single();

  if (!test) return NextResponse.json({ error: 'Final test not configured' }, { status: 400 });

  const { data: questions } = await supabase
    .from('test_questions')
    .select('*')
    .eq('test_id', test.id)
    .order('order_index');

  if (!questions?.length || questions.length < FINAL_QUESTION_COUNT) {
    return NextResponse.json({ error: 'Teacher must add 10 final test questions' }, { status: 400 });
  }

  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct_answer) score += 1;
  }
  const total = questions.length;
  const coursePassed = score >= 9;

  await supabase.from('attempts').insert({
    student_id: profile.id,
    test_id: test.id,
    topic_id: null,
    score,
    total,
    score_percent: calcPercent(score, total),
    answers,
  });

  await supabase.from('final_progress').upsert(
    {
      student_id: profile.id,
      course_path_id: DEFAULT_COURSE_PATH_ID,
      final_completed: coursePassed,
      final_score: score,
      final_total: total,
    },
    { onConflict: 'student_id,course_path_id' },
  );

  return NextResponse.json({ score, total, coursePassed });
}

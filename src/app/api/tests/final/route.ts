import { NextResponse } from 'next/server';
import { DEFAULT_COURSE_PATH_ID } from '@/lib/constants';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const { data: test } = await supabase
    .from('tests')
    .select('id, title')
    .eq('course_path_id', DEFAULT_COURSE_PATH_ID)
    .eq('test_type', 'final')
    .single();

  if (!test) return NextResponse.json({ questions: [] });

  const selectFields =
    profile.role === 'teacher'
      ? 'id, question_text, options, correct_answer, order_index'
      : 'id, question_text, options, order_index';

  const { data: questions } = await supabase
    .from('test_questions')
    .select(selectFields)
    .eq('test_id', test.id)
    .order('order_index');

  return NextResponse.json({ test, questions: questions ?? [] });
}

export async function PUT(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { questions } = await request.json();
  const supabase = await createClient();

  let { data: test } = await supabase
    .from('tests')
    .select('id')
    .eq('course_path_id', DEFAULT_COURSE_PATH_ID)
    .eq('test_type', 'final')
    .maybeSingle();

  if (!test) {
    const { data } = await supabase
      .from('tests')
      .insert({
        course_path_id: DEFAULT_COURSE_PATH_ID,
        test_type: 'final',
        title: 'Соңғы тест',
      })
      .select('id')
      .single();
    test = data;
  }

  if (test && questions?.length) {
    await supabase.from('test_questions').delete().eq('test_id', test.id);
    await supabase.from('test_questions').insert(
      questions.map(
        (q: { question_text: string; options: string[]; correct_answer: string }, i: number) => ({
          test_id: test!.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          order_index: i,
        }),
      ),
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { DEFAULT_COURSE_PATH_ID, TOPIC_QUESTION_COUNT } from '@/lib/constants';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const { count } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('course_path_id', DEFAULT_COURSE_PATH_ID);

  const orderIndex = body.order_index ?? (count ?? 0);

  const { data: topic, error } = await supabase
    .from('topics')
    .insert({
      course_path_id: DEFAULT_COURSE_PATH_ID,
      title: body.title,
      description: body.description ?? null,
      order_index: orderIndex,
      is_published: body.is_published ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.theory_text || body.video_url) {
    await supabase.from('topic_content').insert({
      topic_id: topic.id,
      theory_title: body.theory_title ?? 'Теория',
      theory_text: body.theory_text ?? '',
      video_url: body.video_url ?? null,
    });
  }

  for (const level of ['A', 'B', 'C'] as const) {
    const link = body[`task_${level.toLowerCase()}_link`];
    if (link) {
      await supabase.from('tasks').insert({
        topic_id: topic.id,
        level,
        title: body[`task_${level.toLowerCase()}_title`] ?? `${level} деңгей`,
        link_url: link,
      });
    }
  }

  const { data: test } = await supabase
    .from('tests')
    .insert({
      course_path_id: DEFAULT_COURSE_PATH_ID,
      topic_id: topic.id,
      test_type: 'topic',
      title: `Тест: ${topic.title}`,
    })
    .select()
    .single();

  const questions = body.questions as
    | { question_text: string; options: string[]; correct_answer: string }[]
    | undefined;

  if (test && questions?.length) {
    await supabase.from('test_questions').insert(
      questions.slice(0, TOPIC_QUESTION_COUNT).map((q, i) => ({
        test_id: test.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        order_index: i,
      })),
    );
  }

  return NextResponse.json({ topic }, { status: 201 });
}

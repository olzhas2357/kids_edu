import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth';
import { parseOptions } from '@/lib/test-utils';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const { topicId } = await params;
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const { data: topic, error } = await supabase.from('topics').select('*').eq('id', topicId).single();
  if (error || !topic) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: content } = await supabase.from('topic_content').select('*').eq('topic_id', topicId).maybeSingle();
  const { data: tasks } = await supabase.from('tasks').select('*').eq('topic_id', topicId).order('level');
  const { data: test } = await supabase.from('tests').select('*').eq('topic_id', topicId).maybeSingle();

  let questions: unknown[] = [];
  if (test) {
    const { data: q } = await supabase
      .from('test_questions')
      .select('id, question_text, options, correct_answer, order_index')
      .eq('test_id', test.id)
      .order('order_index');

    questions = (q ?? []).map((row) => {
      const options = parseOptions(row.options);
      if (profile.role === 'student') {
        return {
          id: row.id,
          question_text: row.question_text,
          options,
          order_index: row.order_index,
        };
      }
      return { ...row, options };
    });
  }

  let progress = null;
  let lastAi = null;
  if (profile.role === 'student') {
    const { data: p } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', profile.id)
      .eq('topic_id', topicId)
      .maybeSingle();
    progress = p;

    const { data: ai } = await supabase
      .from('ai_logs')
      .select('*')
      .eq('student_id', profile.id)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    lastAi = ai;
  }

  return NextResponse.json({ topic, content, tasks: tasks ?? [], test, questions, progress, lastAi });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const { topicId } = await params;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  await supabase
    .from('topics')
    .update({
      title: body.title,
      description: body.description,
      order_index: body.order_index,
      is_published: body.is_published,
    })
    .eq('id', topicId);

  await supabase.from('topic_content').upsert({
    topic_id: topicId,
    theory_title: body.theory_title ?? 'Теория',
    theory_text: body.theory_text ?? '',
    video_url: body.video_url ?? null,
    updated_at: new Date().toISOString(),
  });

  for (const level of ['A', 'B', 'C'] as const) {
    const link = body[`task_${level.toLowerCase()}_link`];
    const title = body[`task_${level.toLowerCase()}_title`] ?? `${level} деңгей`;
    if (link) {
      await supabase.from('tasks').upsert(
        { topic_id: topicId, level, title, link_url: link },
        { onConflict: 'topic_id,level' },
      );
    }
  }

  let { data: test } = await supabase.from('tests').select('id').eq('topic_id', topicId).maybeSingle();
  if (!test) {
    const { data: topic } = await supabase.from('topics').select('course_path_id, title').eq('id', topicId).single();
    const inserted = await supabase
      .from('tests')
      .insert({
        course_path_id: topic!.course_path_id,
        topic_id: topicId,
        test_type: 'topic',
        title: `Тест: ${topic!.title}`,
      })
      .select('id')
      .single();
    test = inserted.data;
  }

  if (test && body.questions?.length) {
    await supabase.from('test_questions').delete().eq('test_id', test.id);
    await supabase.from('test_questions').insert(
      body.questions.map(
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const { topicId } = await params;
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  await supabase.from('topics').delete().eq('id', topicId);
  return NextResponse.json({ ok: true });
}

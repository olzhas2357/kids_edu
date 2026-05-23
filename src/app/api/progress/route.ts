import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth';
import { isStepUnlocked } from '@/lib/progress-rules';
import { createClient } from '@/lib/supabase/server';
import type { Progress } from '@/lib/types';

const FIELD_MAP: Record<string, keyof Progress> = {
  theory: 'theory_done',
  video: 'video_done',
  A: 'task_a_done',
  B: 'task_b_done',
  C: 'task_c_done',
};

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { topic_id, step } = await request.json();
  const field = FIELD_MAP[step];
  if (!topic_id || !field) {
    return NextResponse.json({ error: 'Invalid topic_id or step' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('progress')
    .select('*')
    .eq('student_id', profile.id)
    .eq('topic_id', topic_id)
    .maybeSingle();

  if (!isStepUnlocked(existing, step)) {
    return NextResponse.json({ error: 'Complete previous step first' }, { status: 400 });
  }

  const update = { [field]: true, updated_at: new Date().toISOString() };

  if (existing) {
    const { data, error } = await supabase
      .from('progress')
      .update(update)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ progress: data });
  }

  const { data, error } = await supabase
    .from('progress')
    .insert({ student_id: profile.id, topic_id, ...update })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}

export async function PATCH(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { topic_id, ai_feedback_seen, topic_completed } = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('progress')
    .update({
      ai_feedback_seen: ai_feedback_seen ?? undefined,
      topic_completed: topic_completed ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', profile.id)
    .eq('topic_id', topic_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}

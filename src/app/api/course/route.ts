import { NextResponse } from 'next/server';
import { DEFAULT_COURSE_PATH_ID } from '@/lib/constants';
import { getSessionProfile } from '@/lib/auth';
import { isTopicLocked } from '@/lib/progress-rules';
import { getStatusLabel } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();

  const { data: coursePath } = await supabase
    .from('course_paths')
    .select('*')
    .eq('id', DEFAULT_COURSE_PATH_ID)
    .single();

  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('course_path_id', DEFAULT_COURSE_PATH_ID)
    .order('order_index');

  let progress: unknown[] = [];
  let finalProgress = null;

  if (profile.role === 'student') {
    const { data: p } = await supabase.from('progress').select('*').eq('student_id', profile.id);
    progress = p ?? [];

    const { data: fp } = await supabase
      .from('final_progress')
      .select('*')
      .eq('student_id', profile.id)
      .eq('course_path_id', DEFAULT_COURSE_PATH_ID)
      .maybeSingle();
    finalProgress = fp;
  }

  const publishedTopics = (topics ?? []).filter((t) => t.is_published || profile.role === 'teacher');

  const studentTopics =
    profile.role === 'student'
      ? publishedTopics.map((t) => {
          const prog = (progress as { topic_id: string; test_score_percent: number | null; topic_completed: boolean }[]).find(
            (p) => p.topic_id === t.id,
          );
          return {
            ...t,
            locked: isTopicLocked(t.order_index, publishedTopics, progress as never[]),
            progress: prog ?? null,
            statusLabel: getStatusLabel(prog?.test_score_percent ?? null, !!prog?.topic_completed),
          };
        })
      : publishedTopics;

  const completedCount = (progress as { topic_completed: boolean }[]).filter((p) => p.topic_completed).length;
  const allTopicsDone = completedCount >= publishedTopics.length && publishedTopics.length >= 8;

  return NextResponse.json({
    coursePath,
    topics: studentTopics,
    progress,
    finalProgress,
    allTopicsDone,
    completedCount,
  });
}

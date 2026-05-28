import { NextResponse } from 'next/server';
import { DEFAULT_COURSE_PATH_ID } from '@/lib/constants';
import { getSessionProfile } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = await createAdminClient();
  const supabase = await createClient();

  const { data: students } = await admin
    .from('profiles')
    .select('id, email, display_name')
    .eq('role', 'student')
    .eq('teacher_id', profile.id);

  const { data: topics } = await admin
    .from('topics')
    .select('id, title, order_index')
    .eq('course_path_id', DEFAULT_COURSE_PATH_ID)
    .order('order_index');

  const studentIds = (students ?? []).map((s) => s.id);
  const { data: allProgress } = studentIds.length
    ? await admin.from('progress').select('*').in('student_id', studentIds)
    : { data: [] };
  const { data: attempts } = studentIds.length
    ? await admin.from('attempts').select('*').in('student_id', studentIds).order('created_at', { ascending: false })
    : { data: [] };

  const topicStats = (topics ?? []).map((t) => {
    const rows = (allProgress ?? []).filter((p) => p.topic_id === t.id);
    const scores = rows.filter((p) => p.test_score_percent != null).map((p) => p.test_score_percent as number);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const completed = rows.filter((p) => p.topic_completed).length;
    return {
      topicId: t.id,
      title: t.title,
      orderIndex: t.order_index,
      avgScore: avg,
      completedCount: completed,
      attemptCount: scores.length,
      isDifficult: avg > 0 && avg < 70,
    };
  });

  const difficultTopics = topicStats.filter((t) => t.isDifficult).sort((a, b) => a.avgScore - b.avgScore);

  const studentStats = (students ?? []).map((s) => {
    const rows = (allProgress ?? []).filter((p) => p.student_id === s.id);
    const completed = rows.filter((p) => p.topic_completed).length;
    const scores = rows.filter((p) => p.test_score_percent != null).map((p) => p.test_score_percent as number);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      studentId: s.id,
      name: s.display_name ?? s.email,
      completedTopics: completed,
      avgScore: avg,
      isWeak: avg > 0 && avg < 70,
    };
  });

  const weakStudents = studentStats.filter((s) => s.isWeak || s.completedTopics < 4);

  return NextResponse.json({
    studentCount: students?.length ?? 0,
    topicStats,
    difficultTopics,
    studentStats,
    weakStudents,
    recentAttempts: (attempts ?? []).slice(0, 20),
  });
}

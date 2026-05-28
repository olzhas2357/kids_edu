import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = await createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, email, display_name, teacher_id')
    .eq('role', 'student');

  const students = (data ?? []).filter(
    (student) => student.teacher_id === profile.id || student.teacher_id === null,
  );

  return NextResponse.json({
    students,
    debug: {
      profileId: profile.id,
      totalFound: (data ?? []).length,
      filteredCount: (students ?? []).length,
    },
  });
}

export async function PUT(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { studentId, assign } = (await request.json()) as {
    studentId: string;
    assign: boolean;
  };

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from('profiles')
    .select('teacher_id')
    .eq('id', studentId)
    .single();

  if (error || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  if (assign) {
    if (student.teacher_id && student.teacher_id !== profile.id) {
      return NextResponse.json({ error: 'Student is already assigned to another teacher' }, { status: 403 });
    }
  } else {
    if (student.teacher_id !== profile.id) {
      return NextResponse.json({ error: 'Cannot unassign student not assigned to you' }, { status: 403 });
    }
  }

  await supabase.from('profiles').update({ teacher_id: assign ? profile.id : null }).eq('id', studentId);
  return NextResponse.json({ ok: true });
}

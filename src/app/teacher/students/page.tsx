'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Student {
  id: string;
  email: string;
  display_name: string | null;
  teacher_id: string | null;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStudents() {
    setError(null);
    const res = await fetch('/api/teacher/students');
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error ?? 'Ошибка загрузки');
      return;
    }

    setStudents(data.students ?? []);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function toggleAssign(studentId: string, assign: boolean) {
    setLoadingId(studentId);
    setError(null);

    const res = await fetch('/api/teacher/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, assign }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error ?? 'Ошибка сохранения');
      setLoadingId(null);
      return;
    }

    await loadStudents();
    setLoadingId(null);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Оқушыларды басқару</h1>
      <p className="mb-6 text-slate-500">Мұнда өз оқушыларыңызды тағайындай аласыз.</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {students.map((student) => (
          <Card key={student.id} className="p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold">{student.display_name ?? student.email}</p>
                <p className="text-sm text-slate-500">{student.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {student.teacher_id ? 'Назначен' : 'Свободен'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {student.teacher_id ? (
                <Button
                  variant="outline"
                  disabled={loadingId === student.id}
                  onClick={() => toggleAssign(student.id, false)}
                >
                  Снять
                </Button>
              ) : (
                <Button
                  disabled={loadingId === student.id}
                  onClick={() => toggleAssign(student.id, true)}
                >
                  Назначить себе
                </Button>
              )}
            </div>
          </Card>
        ))}

        {students.length === 0 && (
          <Card>
            <p className="text-slate-500">Оқушылар табылмады.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

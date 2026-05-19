'use client';

import { Award, BookOpen, Target, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STAT_ICONS = {
  book: BookOpen,
  users: Users,
  trend: TrendingUp,
  target: Target,
  award: Award,
} as const;

export type StatIconName = keyof typeof STAT_ICONS;

export function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: StatIconName;
}) {
  const Icon: LucideIcon = STAT_ICONS[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

'use client';

import {
  BarChart3,
  BookOpen,
  Bot,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Users,
} from 'lucide-react';
import type { NavIconName } from '@/config/navigation';

const ICONS = {
  'layout-dashboard': LayoutDashboard,
  'book-open': BookOpen,
  'bar-chart': BarChart3,
  users: Users,
  'line-chart': LineChart,
  bot: Bot,
  'graduation-cap': GraduationCap,
} as const;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} />;
}

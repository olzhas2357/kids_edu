import { WEB_ROUTES } from '@edu-platform/shared';

export type NavIconName =
  | 'layout-dashboard'
  | 'book-open'
  | 'bar-chart'
  | 'users'
  | 'line-chart'
  | 'bot'
  | 'graduation-cap';

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  description?: string;
}

export const TEACHER_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: WEB_ROUTES.TEACHER.DASHBOARD,
    icon: 'layout-dashboard',
    description: 'Overview and quick actions',
  },
  {
    label: 'Topics',
    href: WEB_ROUTES.TEACHER.TOPICS,
    icon: 'book-open',
    description: 'Manage course topics',
  },
  {
    label: 'Analytics',
    href: WEB_ROUTES.TEACHER.ANALYTICS,
    icon: 'bar-chart',
    description: 'Class performance',
  },
  {
    label: 'Students',
    href: WEB_ROUTES.TEACHER.STUDENTS,
    icon: 'users',
    description: 'Student roster',
  },
];

export const STUDENT_NAV: NavItem[] = [
  {
    label: 'Topics',
    href: WEB_ROUTES.STUDENT.TOPICS,
    icon: 'book-open',
    description: 'Your learning path',
  },
  {
    label: 'Progress',
    href: WEB_ROUTES.STUDENT.PROGRESS,
    icon: 'line-chart',
    description: 'Scores and achievements',
  },
  {
    label: 'AI Assistant',
    href: WEB_ROUTES.STUDENT.ASSISTANT,
    icon: 'bot',
    description: 'Hints and guidance',
  },
];

export const BRAND = {
  name: 'Kids Edu',
  icon: 'graduation-cap' as const,
};

import { redirect } from 'next/navigation';
import { WEB_ROUTES } from '@edu-platform/shared';

export default function StudentIndexPage() {
  redirect(WEB_ROUTES.STUDENT.TOPICS);
}

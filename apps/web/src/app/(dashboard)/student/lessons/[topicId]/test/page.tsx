import Link from 'next/link';
import { WEB_ROUTES } from '@edu-platform/shared';
import { PageHeader } from '@/components/layouts/page-header';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';
import { Button } from '@/components/ui/button';

export default async function StudentTestPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  return (
    <>
      <PageHeader
        title="Topic test"
        description="Answer all questions. You need 85% to unlock the next topic."
        actions={
          <Button variant="outline" asChild>
            <Link href={WEB_ROUTES.STUDENT.LESSON(topicId)}>Back to lesson</Link>
          </Button>
        }
      />

      <FeaturePlaceholder
        title="Test runner"
        description="studentApi.startTest() → submit answers → studentApi.submitTest() → show AI feedback."
      />
    </>
  );
}

import Link from 'next/link';
import { WEB_ROUTES } from '@edu-platform/shared';
import { PageHeader } from '@/components/layouts/page-header';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STEPS = [
  { key: 'theory', label: 'Theory', done: true },
  { key: 'video', label: 'Video', done: true },
  { key: 'practice-a', label: 'Practice A', done: false },
  { key: 'practice-b', label: 'Practice B', done: false },
  { key: 'practice-c', label: 'Practice C', done: false },
  { key: 'test', label: 'Final test', done: false },
];

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  return (
    <>
      <PageHeader
        title="Lesson"
        description="Theory → video → practice A/B/C → test. Complete each step in order."
        actions={
          <Button asChild>
            <Link href={WEB_ROUTES.STUDENT.TEST(topicId)}>Go to test</Link>
          </Button>
        }
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{step.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">
                {step.done ? 'Completed' : 'Not started'}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <FeaturePlaceholder
        title={`Topic ${topicId}`}
        description="Load content via studentApi.getTopic(). Wire step completion actions to API."
      />
    </>
  );
}

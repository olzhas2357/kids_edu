import Link from 'next/link';
import { Lock, PlayCircle } from 'lucide-react';
import { WEB_ROUTES } from '@edu-platform/shared';
import { PageHeader } from '@/components/layouts/page-header';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MOCK_TOPICS = [
  { id: '1', title: 'Introduction', locked: false, progress: 'In progress' },
  { id: '2', title: 'Numbers & shapes', locked: true, progress: 'Locked' },
];

export default function StudentTopicsPage() {
  return (
    <>
      <PageHeader
        title="My topics"
        description="Pick a topic to read theory, watch videos, practice, and take the test."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        {MOCK_TOPICS.map((topic) => (
          <Card key={topic.id} className={topic.locked ? 'opacity-70' : ''}>
            <CardHeader>
              <section className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{topic.title}</CardTitle>
                <Badge variant={topic.locked ? 'secondary' : 'success'}>
                  {topic.progress}
                </Badge>
              </section>
              <CardDescription>
                {topic.locked ? 'Complete the previous topic first' : 'Ready to learn'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topic.locked ? (
                <Button variant="outline" disabled className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Locked
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={WEB_ROUTES.STUDENT.LESSON(topic.id)}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start lesson
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <FeaturePlaceholder
        title="Topics from API"
        description="Replace mock data with studentApi.listTopics(courseId)."
      />
    </>
  );
}

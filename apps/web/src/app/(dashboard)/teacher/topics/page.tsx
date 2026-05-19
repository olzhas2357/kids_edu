import { PageHeader } from '@/components/layouts/page-header';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';
import { Button } from '@/components/ui/button';

export default function TeacherTopicsPage() {
  return (
    <>
      <PageHeader
        title="Topics"
        description="Create and manage theory, videos, practice tasks, and tests."
        actions={<Button>Add topic</Button>}
      />
      <FeaturePlaceholder
        title="Topic manager"
        description="List courses, reorder topics, edit content. Uses teacherApi.listTopics()."
      />
    </>
  );
}

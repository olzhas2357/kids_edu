import { PageHeader } from '@/components/layouts/page-header';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';

export default function TeacherStudentsPage() {
  return (
    <>
      <PageHeader
        title="Students"
        description="View enrolled students, progress, and retry recommendations."
      />
      <FeaturePlaceholder
        title="Student roster"
        description="Search students, filter by course, open individual progress."
      />
    </>
  );
}

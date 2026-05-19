import { PageHeader } from '@/components/layouts/page-header';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';

export default function TeacherAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Track class progress, test scores, and topic completion rates."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <FeaturePlaceholder
          title="Score distribution"
          description="Charts by topic and student level (weak / medium / good / excellent)."
        />
        <FeaturePlaceholder
          title="Completion funnel"
          description="Theory → video → practice → test conversion."
        />
      </section>
    </>
  );
}

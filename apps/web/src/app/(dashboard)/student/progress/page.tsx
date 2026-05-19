import { PageHeader } from '@/components/layouts/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';
export default function StudentProgressPage() {
  return (
    <>
      <PageHeader
        title="My progress"
        description="Scores, completed topics, and recommendations from your teacher and AI."
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Completed topics" value="—" icon="target" />
        <StatCard title="Best score" value="—" icon="trend" />
        <StatCard title="Achievements" value="—" icon="award" />
      </section>

      <FeaturePlaceholder
        title="Progress timeline"
        description="studentApi.getTopicResult() per topic, levels: weak / medium / good / excellent."
      />
    </>
  );
}

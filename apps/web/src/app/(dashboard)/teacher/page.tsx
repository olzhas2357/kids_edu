import { PageHeader } from '@/components/layouts/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';

export default function TeacherDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your classes, topics, and student activity."
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Topics" value="—" hint="Published topics" icon="book" />
        <StatCard title="Students" value="—" hint="Active learners" icon="users" />
        <StatCard title="Avg. score" value="—" hint="Last 30 days" icon="trend" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <FeaturePlaceholder
          title="Recent activity"
          description="Latest student submissions and test results."
        />
        <FeaturePlaceholder
          title="Quick actions"
          description="Create topic, publish course, review analytics."
        />
      </section>
    </>
  );
}

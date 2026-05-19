import { PageHeader } from '@/components/layouts/page-header';
import { FeaturePlaceholder } from '@/components/shared/feature-placeholder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentAssistantPage() {
  return (
    <>
      <PageHeader
        title="AI Assistant"
        description="Friendly hints using the Socratic method — no direct answers, only guidance."
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="bg-muted/50 mb-4 min-h-[200px] rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              AI messages will appear here. Connect to aiApi.chat().
            </p>
          </section>
          <FeaturePlaceholder
            title="Socratic tutor"
            description="aiApi.practiceHint() and aiApi.chat() with sessionId for continuity."
          />
        </CardContent>
      </Card>
    </>
  );
}

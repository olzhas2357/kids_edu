import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function FeaturePlaceholder({
  title,
  description,
  status = 'Architecture ready',
}: {
  title: string;
  description: string;
  status?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <section className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary">{status}</Badge>
        </section>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Connect this view to the API layer in <code className="text-xs">src/lib/api</code>.
        </p>
      </CardContent>
    </Card>
  );
}

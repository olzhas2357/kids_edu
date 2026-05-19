export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="text-muted-foreground max-w-2xl text-sm">{description}</p> : null}
      </section>
      {actions ? <section className="flex shrink-0 items-center gap-2">{actions}</section> : null}
    </header>
  );
}

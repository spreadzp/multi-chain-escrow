import { Container } from "@/components/Container";
import { LearnSidebar } from "@/components/LearnSidebar";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container>
      <div className="flex flex-col gap-8 py-6 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="sticky top-6 rounded-lg border border-border bg-surface-1 p-4 shadow-1">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Learn
            </h2>
            <LearnSidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </Container>
  );
}

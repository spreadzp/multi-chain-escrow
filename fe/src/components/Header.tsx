import Link from "next/link";
import { EnvIndicator } from "@/components/ui/env-indicator";
import { LearnNav } from "@/components/LearnNav";

export function Header() {
  return (
    <header className="border-b border-border bg-surface-1">
      <nav className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
            Multi-Chain Escrow
          </Link>
          <EnvIndicator />
        </div>
        <div className="flex gap-4 sm:gap-6">
          <Link
            href="/"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            App
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            How it works
          </Link>
          <LearnNav />
        </div>
      </nav>
    </header>
  );
}

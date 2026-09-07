interface RepoEntry {
  path: string;
  description: string;
}

const repoStructure: { section: string; entries: RepoEntry[] }[] = [
  {
    section: "Smart Contracts",
    entries: [
      { path: "blockchains/solana/programs/escrow/", description: "Solana Anchor escrow program" },
      { path: "blockchains/solana/tests/", description: "Solana program tests" },
      { path: "blockchains/stellar/contracts/escrow/", description: "Stellar Soroban escrow contract" },
      { path: "blockchains/stellar/test/", description: "Stellar contract tests" },
    ],
  },
  {
    section: "Frontend — Adapters",
    entries: [
      { path: "fe/src/adapters/escrow-adapter.ts", description: "EscrowAdapter interface (shared)" },
      { path: "fe/src/adapters/solana/", description: "SolanaEscrowAdapter (Anchor client)" },
      { path: "fe/src/adapters/stellar/", description: "StellarEscrowAdapter (Soroban client)" },
      { path: "fe/src/features/escrow/adapter/MockEscrowAdapter.ts", description: "Mock adapter (no blockchain)" },
      { path: "fe/src/features/escrow/adapter/registry.ts", description: "Adapter registry (chain → adapter)" },
    ],
  },
  {
    section: "Frontend — Wallets",
    entries: [
      { path: "fe/src/features/wallet/phantom-adapter.ts", description: "Phantom wallet (Solana)" },
      { path: "fe/src/features/wallet/freighter-adapter.ts", description: "Freighter wallet (Stellar)" },
      { path: "fe/src/features/wallet/mock-wallet.ts", description: "Mock wallet (in-memory)" },
    ],
  },
  {
    section: "Frontend — State & UI",
    entries: [
      { path: "fe/src/features/escrow/escrow-store.ts", description: "Zustand store (escrows, loading, error)" },
      { path: "fe/src/features/wallet/wallet-store.ts", description: "Zustand store (wallet session)" },
      { path: "fe/src/sync/", description: "Event sync (contract events → store)" },
      { path: "fe/src/app/page.tsx", description: "Main page (form + list + activity)" },
      { path: "fe/src/app/how-it-works/", description: "This page" },
    ],
  },
  {
    section: "Config",
    entries: [
      { path: "fe/src/config/chains.ts", description: "Chain configs (RPC, explorer, isLocal)" },
      { path: "fe/src/config/contracts.ts", description: "Contract addresses per chain" },
      { path: "fe/src/config/env.ts", description: "Env parsing (mock mode, RPC URLs)" },
    ],
  },
];

export function RepoMap() {
  return (
    <div data-testid="repo-map">
      <h2 className="mb-5 text-lg font-semibold text-text-primary">Repo Structure</h2>
      <div className="space-y-6">
        {repoStructure.map((group) => (
          <div key={group.section}>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full" style={{ background: "var(--accent)" }} />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {group.section}
              </h3>
            </div>
            <div className="space-y-1.5">
              {group.entries.map((entry) => (
                <div
                  key={entry.path}
                  className="flex flex-col gap-1 rounded-md border border-border bg-surface-1 px-4 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-4"
                >
                  <code className="font-mono text-xs text-accent sm:min-w-[280px]">{entry.path}</code>
                  <span className="text-xs text-text-tertiary">{entry.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonTable() {
  const rows = [
    { aspect: "Call type", solana: "Instruction program", stellar: "InvokeHostFunction" },
    { aspect: "Token handling", solana: "ATA, owner = PDA escrow", stellar: "Balance in escrow contract (token contract)" },
    { aspect: "Transfer", solana: "CPI → SPL Token", stellar: "TokenClient.transfer" },
    { aspect: "State", solana: "Account (Escrow PDA)", stellar: "Persistent contract storage" },
    { aspect: "Events", solana: "Anchor event / program log", stellar: "Soroban event" },
    { aspect: "Auth on release", solana: "Signer in accounts + pubkey check", stellar: "require_auth() + Address comparison" },
    { aspect: "Auth on refund", solana: "Signer = depositor", stellar: "require_auth() = depositor Address" },
    { aspect: "Local network", solana: "solana-test-validator (localhost:8899)", stellar: "soroban standalone (localhost:8000)" },
    { aspect: "Testnet faucet", solana: "solana airdrop", stellar: "Friendbot" },
  ];

  return (
    <div data-testid="comparison-table">
      <h2 className="mb-5 text-lg font-semibold text-text-primary">Solana vs Stellar</h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-1 shadow-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">Aspect</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">Solana</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">Stellar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.aspect} className="transition-colors hover:bg-surface-2">
                <td className="px-4 py-3 font-medium text-text-primary">{row.aspect}</td>
                <td className="px-4 py-3 text-text-secondary">{row.solana}</td>
                <td className="px-4 py-3 text-text-secondary">{row.stellar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LocalToTestnetBlock() {
  return (
    <div data-testid="local-to-testnet" className="rounded-lg border border-info/20 bg-info/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-info" />
        <h2 className="text-base font-semibold text-info">
          Local → Testnet Transition
        </h2>
      </div>
      <div className="space-y-2 text-sm text-text-secondary">
        <p>
          The same adapter interface works on both local networks and testnets.
          The only difference is the RPC URL and contract addresses configured via environment variables.
        </p>
        <ul className="space-y-2 pl-0">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-info" />
            <span>
              <strong className="text-text-primary">Solana:</strong> <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">solana-local</code> (localhost:8899) →{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">solana-devnet</code> (api.devnet.solana.com). Program ID stays the same
              if deployed with the same keypair.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-info" />
            <span>
              <strong className="text-text-primary">Stellar:</strong> <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">stellar-local</code> (localhost:8000) →{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">stellar-testnet</code> (soroban-testnet.stellar.org). Contract ID changes
              per deployment; update <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">STELLAR_CONTRACT_ID</code> in config.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-info" />
            <span>
              <strong className="text-text-primary">Mock mode:</strong> When <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">NEXT_PUBLIC_MOCK_MODE=true</code>, all
              adapters use <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">MockEscrowAdapter</code> — no wallet or blockchain needed.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

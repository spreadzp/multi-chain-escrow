"use client";

import { useEffect } from "react";
import { Container } from "@/components/Container";
import { WalletBar } from "@/features/wallet";
import { CreateEscrowForm, EscrowList } from "@/features/escrow/components";
import { ActivityFeed } from "@/features/activity";
import { useEscrowEvents } from "@/features/escrow/hooks/useEscrowEvents";
import { useAddressSync } from "@/features/escrow/hooks/useAddressSync";
import { useEscrowAdapter } from "@/features/escrow/hooks/useEscrowAdapter";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { registerDefaults } from "@/features/escrow/adapter/registry";

registerDefaults();

export default function Home() {
  useEscrowEvents();
  useAddressSync();

  const adapter = useEscrowAdapter();
  const address = useWalletStore((s) => s.session?.address);
  const loading = useEscrowStore((s) => s.loading);
  const error = useEscrowStore((s) => s.error);
  const hasEscrows = Object.keys(useEscrowStore((s) => s.byId)).length > 0;

  useEffect(() => {
    if (!adapter) return;
    const store = useEscrowStore.getState();
    store.setLoading(true);
    store.setError(null);
    adapter
      .listEscrowsByUser(address ?? "")
      .then((escrows) => store.setEscrows(escrows))
      .catch((e) => store.setError(e instanceof Error ? e.message : String(e)))
      .finally(() => store.setLoading(false));
  }, [adapter, address]);

  return (
    <Container>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
            Multi-Chain Escrow
          </h1>
          <p className="text-sm text-text-tertiary">
            Solana &amp; Stellar escrow demo
          </p>
        </div>

        <WalletBar />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-2.5 text-sm text-danger">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
            <span>{error}</span>
          </div>
        )}

        {loading && !hasEscrows ? (
          <div className="rounded-lg border border-border bg-surface-1 p-6 text-center shadow-1">
            <p className="text-sm text-text-tertiary">Loading...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <CreateEscrowForm />
            </div>
            <div className="space-y-6">
              <EscrowList />
              <ActivityFeed />
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}

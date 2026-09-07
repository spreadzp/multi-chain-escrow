"use client";

import { useEscrowStore } from "../escrow-store";
import { EscrowCard } from "./EscrowCard";
import { EscrowListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function EscrowList() {
  const byId = useEscrowStore((s) => s.byId);
  const loading = useEscrowStore((s) => s.loading);
  const escrows = Object.values(byId).sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  if (loading && escrows.length === 0) {
    return <EscrowListSkeleton />;
  }

  if (escrows.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No escrows yet"
        description="Create one to get started"
      />
    );
  }

  return (
    <div className="space-y-3">
      {escrows.map((escrow) => (
        <EscrowCard key={`${escrow.chainId}:${escrow.id}`} escrow={escrow} />
      ))}
    </div>
  );
}

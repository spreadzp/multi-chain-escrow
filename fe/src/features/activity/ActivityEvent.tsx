"use client";

import { shortenAddress } from "@/features/wallet/utils";
import type { EscrowEvent } from "@/shared/types";

const typeConfig: Record<string, { badge: string; label: string }> = {
  Deposited: {
    badge: "bg-info/10 text-info border border-info/20",
    label: "Deposited",
  },
  Released: {
    badge: "bg-success/10 text-success border border-success/20",
    label: "Released",
  },
  Refunded: {
    badge: "bg-text-tertiary/10 text-text-secondary border border-border",
    label: "Refunded",
  },
};

export function ActivityEvent({ event }: { event: EscrowEvent }) {
  const typeInfo = typeConfig[event.type] ?? { badge: "bg-surface-2 text-text-secondary border border-border", label: event.type };

  return (
    <div
      data-testid="activity-event"
      className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-3 transition-colors hover:border-border-strong"
    >
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeInfo.badge}`}
      >
        {typeInfo.label}
      </span>
      <span className="text-xs text-text-tertiary">
        {event.chainId}
      </span>
      <span className="font-mono text-xs text-text-secondary">
        {shortenAddress(event.escrowId)}
      </span>
      <span className="font-mono text-xs text-text-tertiary">
        {shortenAddress(event.txHash)}
      </span>
      <span className="ml-auto text-xs text-text-tertiary">
        {new Date(event.timestamp).toLocaleString()}
      </span>
    </div>
  );
}

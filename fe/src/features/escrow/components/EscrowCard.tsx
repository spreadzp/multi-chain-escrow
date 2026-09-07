"use client";

import { useEscrowActions } from "../hooks/useEscrowActions";
import { useEscrowStore } from "../escrow-store";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { canRelease, canRefund } from "../domain/roles";
import { shortenAddress } from "@/features/wallet/utils";
import { useToast } from "@/components/ui/toast";
import type { Escrow } from "@/shared/types";

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  created: {
    dot: "bg-info",
    badge: "bg-info/10 text-info border border-info/20",
    label: "Created",
  },
  released: {
    dot: "bg-success",
    badge: "bg-success/10 text-success border border-success/20",
    label: "Released",
  },
  refunded: {
    dot: "bg-text-tertiary",
    badge: "bg-text-tertiary/10 text-text-secondary border border-border",
    label: "Refunded",
  },
};

export function EscrowCard({ escrow }: { escrow: Escrow }) {
  const { releaseEscrow, refundEscrow } = useEscrowActions();
  const loading = useEscrowStore((s) => s.loading);
  const walletAddress = useWalletStore((s) => s.session?.address);
  const { addToast } = useToast();

  const showRelease =
    walletAddress &&
    escrow.status === "created" &&
    canRelease(escrow, walletAddress);

  const showRefund =
    walletAddress &&
    escrow.status === "created" &&
    canRefund(escrow, walletAddress);

  async function handleRelease() {
    try {
      await releaseEscrow(escrow.id);
      addToast({ type: "success", title: "Escrow released", message: `Funds sent to beneficiary` });
    } catch (e) {
      addToast({ type: "error", title: "Release failed", message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  async function handleRefund() {
    try {
      await refundEscrow(escrow.id);
      addToast({ type: "success", title: "Escrow refunded", message: `Funds returned to depositor` });
    } catch (e) {
      addToast({ type: "error", title: "Refund failed", message: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  const status = statusConfig[escrow.status] ?? statusConfig.created;

  return (
    <div
      data-testid="escrow-card"
      className="group rounded-lg border border-border bg-surface-1 p-4 shadow-1 transition-all duration-200 hover:border-border-strong hover:shadow-2"
    >
      {/* Header: ID + Status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="font-mono text-xs text-text-secondary">
            {shortenAddress(escrow.id)}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${status.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Amount — primary visual hierarchy */}
      <div className="mb-4">
        <p className="mb-0.5 text-xs text-text-tertiary">Amount</p>
        <p className="font-mono text-xl font-semibold tracking-tight text-text-primary">
          {escrow.amount}
        </p>
      </div>

      {/* Parties — secondary info */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Depositor</span>
          <span className="font-mono text-text-secondary">{shortenAddress(escrow.depositor)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Beneficiary</span>
          <span className="font-mono text-text-secondary">{shortenAddress(escrow.beneficiary)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Resolver</span>
          <span className="font-mono text-text-secondary">{shortenAddress(escrow.resolver)}</span>
        </div>
      </div>

      {/* Actions */}
      {(showRelease || showRefund) && (
        <div className="mt-4 flex gap-2">
          {showRelease && (
            <button
              type="button"
              onClick={handleRelease}
              disabled={loading}
              className="flex-1 rounded-md bg-success px-3 py-2 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Releasing..." : "Release"}
            </button>
          )}
          {showRefund && (
            <button
              type="button"
              onClick={handleRefund}
              disabled={loading}
              className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary disabled:opacity-40"
            >
              {loading ? "Refunding..." : "Refund"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

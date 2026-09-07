"use client";

import { useState, type FormEvent } from "react";
import { useEscrowActions } from "../hooks/useEscrowActions";
import { useEscrowAdapter } from "../hooks/useEscrowAdapter";
import { useEscrowStore } from "../escrow-store";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { useToast } from "@/components/ui/toast";

function validateBeneficiary(value: string): string | null {
  if (!value.trim()) return "Beneficiary is required";
  if (value.trim().length < 3) return "Beneficiary must be at least 3 characters";
  return null;
}

function validateAmount(value: string): string | null {
  if (!value.trim()) return "Amount is required";
  const num = Number(value);
  if (isNaN(num) || num <= 0) return "Amount must be a positive number";
  return null;
}

function CreateEscrowFormInner() {
  const { createEscrow, clearError } = useEscrowActions();
  const loading = useEscrowStore((s) => s.loading);
  const error = useEscrowStore((s) => s.error);
  const { addToast } = useToast();

  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [resolver, setResolver] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    beneficiary?: string;
    amount?: string;
  }>({});
  const [success, setSuccess] = useState<{
    escrowId: string;
    txHash: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);

    const benErr = validateBeneficiary(beneficiary);
    const amtErr = validateAmount(amount);
    setValidationErrors({
      beneficiary: benErr ?? undefined,
      amount: amtErr ?? undefined,
    });
    if (benErr || amtErr) return;

    try {
      const result = await createEscrow({
        beneficiary: beneficiary.trim(),
        amount: amount.trim(),
        resolver: resolver.trim() || beneficiary.trim(),
      });
      setSuccess({ escrowId: result.escrowId, txHash: result.txHash });
      addToast({
        type: "success",
        title: "Escrow created",
        message: `TX: ${result.txHash.slice(0, 8)}...`,
      });
      setBeneficiary("");
      setAmount("");
      setResolver("");
    } catch (e) {
      addToast({
        type: "error",
        title: "Failed to create escrow",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-1 p-6 shadow-1">
      <h2 className="mb-5 text-base font-semibold text-text-primary">Create Escrow</h2>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="ml-2 text-xs text-danger/70 underline hover:no-underline"
            aria-label="Clear error"
          >
            Clear
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
          <p className="font-mono text-xs">Escrow ID: {success.escrowId}</p>
          <p className="font-mono text-xs">TX Hash: {success.txHash}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="beneficiary"
            className="mb-1.5 block text-xs font-medium text-text-secondary"
          >
            Beneficiary
          </label>
          <input
            id="beneficiary"
            type="text"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent disabled:opacity-40"
            placeholder="0x..."
          />
          {validationErrors.beneficiary && (
            <p className="mt-1 text-xs text-danger">
              {validationErrors.beneficiary}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-xs font-medium text-text-secondary">
            Amount
          </label>
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent disabled:opacity-40"
            placeholder="100"
          />
          {validationErrors.amount && (
            <p className="mt-1 text-xs text-danger">
              {validationErrors.amount}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="resolver"
            className="mb-1.5 block text-xs font-medium text-text-secondary"
          >
            Resolver (optional)
          </label>
          <input
            id="resolver"
            type="text"
            value={resolver}
            onChange={(e) => setResolver(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent disabled:opacity-40"
            placeholder="0x... (defaults to beneficiary)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
          )}
          {loading ? "Creating..." : "Create Escrow"}
        </button>
      </form>
    </div>
  );
}

export function CreateEscrowForm() {
  const adapter = useEscrowAdapter();
  const walletStatus = useWalletStore((s) => s.status);
  const walletConnected = walletStatus === "connected" && adapter !== null;

  if (!walletConnected) {
    return (
      <div className="rounded-lg border border-border bg-surface-1 p-6 shadow-1">
        <h2 className="mb-5 text-base font-semibold text-text-primary">Create Escrow</h2>
        <p className="text-sm text-text-tertiary">
          Connect your wallet to create an escrow.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 w-full rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-tertiary disabled:opacity-60"
        >
          Create Escrow
        </button>
      </div>
    );
  }

  return <CreateEscrowFormInner />;
}

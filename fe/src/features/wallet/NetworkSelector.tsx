"use client";

import { useWalletStore } from "./wallet-store";
import { chains } from "@/config";
import type { ChainId } from "@/shared/types";

const chainOrder: ChainId[] = [
  "solana-local",
  "solana-devnet",
  "stellar-local",
  "stellar-testnet",
];

export function NetworkSelector() {
  const activeChainId = useWalletStore((s) => s.activeChainId);
  const status = useWalletStore((s) => s.status);
  const setChain = useWalletStore((s) => s.setChain);

  const disabled = status === "connecting";

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-tertiary">
        Network
      </span>
      <select
        aria-label="Select network"
        className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-primary transition-colors focus:border-accent disabled:opacity-40"
        value={activeChainId ?? ""}
        disabled={disabled}
        onChange={(e) => setChain(e.target.value as ChainId)}
      >
        <option value="" disabled>
          Select a network
        </option>
        {chainOrder.map((id) => {
          const config = chains[id];
          return (
            <option key={id} value={id}>
              {config.name}
            </option>
          );
        })}
      </select>
    </label>
  );
}

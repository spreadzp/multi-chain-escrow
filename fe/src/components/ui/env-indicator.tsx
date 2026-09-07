"use client";

import { useWalletStore } from "@/features/wallet/wallet-store";
import { chains } from "@/config";
import { env } from "@/config/env";
import type { ChainId } from "@/shared/types";

const envStyles: Record<string, string> = {
  mock: "bg-warning/10 text-warning border border-warning/20",
  local: "bg-info/10 text-info border border-info/20",
  testnet: "bg-accent/10 text-accent border border-accent/20",
  devnet: "bg-success/10 text-success border border-success/20",
};

function getEnvType(chainId: ChainId | null, isMockMode: boolean): "mock" | "local" | "testnet" | "devnet" {
  if (!chainId) return isMockMode ? "mock" : "local";
  if (isMockMode) return "mock";
  const config = chains[chainId];
  if (config.isLocal) return "local";
  if (chainId.includes("devnet")) return "devnet";
  return "testnet";
}

function getEnvLabel(envType: string, chainId: ChainId | null): string {
  if (!chainId) {
    return envType === "mock" ? "Mock" : "Not connected";
  }
  const config = chains[chainId];
  if (envType === "mock") return `Mock · ${config.name}`;
  return config.name;
}

export function EnvIndicator() {
  const activeChainId = useWalletStore((s) => s.activeChainId);
  const envType = getEnvType(activeChainId, env.isMockMode);
  const label = getEnvLabel(envType, activeChainId);

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${envStyles[envType]}`}
      data-testid="env-indicator"
      data-env={envType}
    >
      {label}
    </span>
  );
}

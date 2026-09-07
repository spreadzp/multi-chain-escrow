"use client";

import { useState, useCallback } from "react";
import { useWalletStore } from "./wallet-store";
import { NetworkSelector } from "./NetworkSelector";
import { PhantomWalletProvider, connectPhantom } from "./phantom-adapter";
import { FreighterWalletProvider, connectFreighter } from "./freighter-adapter";
import { MockWalletProvider, connectMock } from "./mock-wallet";
import { chains } from "@/config";
import type { ChainFamily, ChainId } from "@/shared/types";
import type { WalletProvider } from "./wallet-provider";
import { shortenAddress, copyToClipboard } from "./utils";

interface ProviderSelection {
  provider: WalletProvider;
  isMock: boolean;
}

function selectProvider(chainId: ChainId): ProviderSelection {
  const config = chains[chainId];
  const family: ChainFamily = config.family;

  if (family === "solana") {
    const phantom = new PhantomWalletProvider(chainId);
    if (phantom.isAvailable()) {
      return { provider: phantom, isMock: false };
    }
    return { provider: new MockWalletProvider(family, chainId), isMock: true };
  }

  const freighter = new FreighterWalletProvider(chainId);
  if (freighter.isAvailable()) {
    return { provider: freighter, isMock: false };
  }
  return { provider: new MockWalletProvider(family, chainId), isMock: true };
}

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  disconnected: {
    dot: "bg-text-tertiary",
    badge: "bg-text-tertiary/10 text-text-secondary border border-border",
    label: "Disconnected",
  },
  connecting: {
    dot: "bg-warning animate-pulse",
    badge: "bg-warning/10 text-warning border border-warning/20",
    label: "Connecting",
  },
  connected: {
    dot: "bg-success",
    badge: "bg-success/10 text-success border border-success/20",
    label: "Connected",
  },
  error: {
    dot: "bg-danger",
    badge: "bg-danger/10 text-danger border border-danger/20",
    label: "Error",
  },
};

export function WalletBar() {
  const activeChainId = useWalletStore((s) => s.activeChainId);
  const session = useWalletStore((s) => s.session);
  const status = useWalletStore((s) => s.status);
  const error = useWalletStore((s) => s.error);
  const setConnecting = useWalletStore((s) => s.setConnecting);
  const setConnected = useWalletStore((s) => s.setConnected);
  const setError = useWalletStore((s) => s.setError);
  const disconnect = useWalletStore((s) => s.disconnect);

  const [isMock, setIsMock] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnect = useCallback(() => {
    if (!activeChainId) return;
    const selection = selectProvider(activeChainId);
    setIsMock(selection.isMock);
    const store = { setConnecting, setConnected, setError };

    if (selection.provider instanceof PhantomWalletProvider) {
      connectPhantom(selection.provider, store);
    } else if (selection.provider instanceof FreighterWalletProvider) {
      connectFreighter(selection.provider, store);
    } else if (selection.provider instanceof MockWalletProvider) {
      connectMock(selection.provider, store);
    }
  }, [activeChainId, setConnecting, setConnected, setError]);

  const handleAddressClick = useCallback(async () => {
    if (!session?.address) return;
    const ok = await copyToClipboard(session.address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [session]);

  const connectDisabled = !activeChainId || status === "connecting";

  const statusInfo = statusConfig[status] ?? statusConfig.disconnected;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <NetworkSelector />

        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${statusInfo.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
          {statusInfo.label}
        </span>

        {session && (
          <button
            type="button"
            onClick={handleAddressClick}
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
            title={copied ? "Copied!" : "Click to copy"}
          >
            {shortenAddress(session.address)}
          </button>
        )}

        {isMock && session && (
          <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning border border-warning/20">
            Mock
          </span>
        )}

        {status === "connected" ? (
          <button
            type="button"
            onClick={disconnect}
            className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connectDisabled}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Connect
          </button>
        )}
      </div>

      {status === "error" && error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      {status === "disconnected" && !activeChainId && (
        <p className="text-xs text-text-tertiary">
          Select a network to connect your wallet
        </p>
      )}

      {status === "connecting" && (
        <p className="text-xs text-warning">
          Confirm connection in your wallet...
        </p>
      )}
    </div>
  );
}

import type { ChainFamily, ChainId, WalletSession } from "@/shared/types";
import { WalletError, type WalletProvider } from "./wallet-provider";

interface FreighterWindow {
  getAddress(): Promise<string>;
  isConnected(): boolean;
  setAllowed(): Promise<boolean>;
}

function getFreighter(): FreighterWindow | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const freighter = w.freighter as FreighterWindow | undefined;
  return freighter ?? null;
}

export class FreighterWalletProvider implements WalletProvider {
  readonly chainFamily: ChainFamily = "stellar";
  private readonly chainId: ChainId;
  private address: string | null = null;

  constructor(chainId: ChainId) {
    this.chainId = chainId;
  }

  isAvailable(): boolean {
    return getFreighter() !== null;
  }

  async connect(): Promise<WalletSession> {
    const freighter = getFreighter();
    if (!freighter) {
      throw new WalletError("not_installed", "Freighter wallet extension not found");
    }

    let allowed: boolean;
    try {
      allowed = await freighter.setAllowed();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/reject/i.test(message)) {
        throw new WalletError("rejected", "User rejected connection request");
      }
      throw new WalletError("unknown", `Freighter setAllowed failed: ${message}`);
    }

    if (!allowed) {
      throw new WalletError("rejected", "User rejected connection request");
    }

    let address: string;
    try {
      address = await freighter.getAddress();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/reject/i.test(message)) {
        throw new WalletError("rejected", "User rejected address request");
      }
      throw new WalletError("unknown", `Freighter getAddress failed: ${message}`);
    }

    if (!address) {
      throw new WalletError("unknown", "Freighter returned empty address");
    }

    this.address = address;

    return {
      address: this.address,
      chainId: this.chainId,
      connectedAt: Date.now(),
    };
  }

  async disconnect(): Promise<void> {
    this.address = null;
  }

  getAddress(): string | null {
    return this.address;
  }
}

export function connectFreighter(
  provider: FreighterWalletProvider,
  store: {
    setConnecting: () => void;
    setConnected: (session: WalletSession) => void;
    setError: (message: string) => void;
  },
): Promise<void> {
  store.setConnecting();
  return provider
    .connect()
    .then((session) => store.setConnected(session))
    .catch((err) => {
      const message = err instanceof WalletError ? err.message : err instanceof Error ? err.message : String(err);
      store.setError(message);
    });
}

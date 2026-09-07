import type { ChainFamily, ChainId, WalletSession } from "@/shared/types";
import { WalletError, type WalletProvider } from "./wallet-provider";

interface PhantomPublicKey {
  toBase58(): string;
}

interface PhantomConnectionResult {
  publicKey: PhantomPublicKey;
}

interface PhantomWindow {
  connect(): Promise<PhantomConnectionResult>;
  disconnect(): Promise<void>;
  on(event: string, handler: () => void): void;
  off?(event: string, handler: () => void): void;
  isPhantom?: boolean;
}

function getPhantom(): PhantomWindow | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const solana = w.solana as PhantomWindow | undefined;
  if (solana) return solana;
  const phantom = w.phantom as Record<string, unknown> | undefined;
  if (phantom?.solana) return phantom.solana as PhantomWindow;
  return null;
}

export class PhantomWalletProvider implements WalletProvider {
  readonly chainFamily: ChainFamily = "solana";
  private readonly chainId: ChainId;
  private address: string | null = null;
  private disconnectHandler: (() => void) | null = null;

  constructor(chainId: ChainId) {
    this.chainId = chainId;
  }

  isAvailable(): boolean {
    return getPhantom() !== null;
  }

  async connect(): Promise<WalletSession> {
    const phantom = getPhantom();
    if (!phantom) {
      throw new WalletError("not_installed", "Phantom wallet extension not found");
    }

    let result: PhantomConnectionResult;
    try {
      result = await phantom.connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/reject/i.test(message)) {
        throw new WalletError("rejected", "User rejected connection request");
      }
      throw new WalletError("unknown", `Phantom connect failed: ${message}`);
    }

    this.address = result.publicKey.toBase58();

    this.disconnectHandler = () => {
      this.address = null;
    };
    phantom.on("disconnect", this.disconnectHandler);

    return {
      address: this.address,
      chainId: this.chainId,
      connectedAt: Date.now(),
    };
  }

  async disconnect(): Promise<void> {
    const phantom = getPhantom();
    if (phantom && this.disconnectHandler) {
      phantom.off?.("disconnect", this.disconnectHandler);
    }
    this.disconnectHandler = null;

    if (phantom) {
      await phantom.disconnect();
    }
    this.address = null;
  }

  getAddress(): string | null {
    return this.address;
  }
}

export function connectPhantom(
  provider: PhantomWalletProvider,
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

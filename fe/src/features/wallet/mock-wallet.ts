import type { ChainFamily, ChainId, WalletSession } from "@/shared/types";
import type { WalletProvider } from "./wallet-provider";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededChars(seed: string, count: number, alphabet: string): string {
  let result = "";
  let h = hashSeed(seed);
  for (let i = 0; i < count; i++) {
    h = (h * 31 + i * 7) | 0;
    result += alphabet[Math.abs(h) % alphabet.length];
  }
  return result;
}

export function generateMockAddress(family: ChainFamily, seed: string): string {
  if (family === "solana") {
    const suffix = seededChars(seed, 8, "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
    return `MockSolana${suffix}`;
  }
  const body = seededChars(seed, 55, BASE32_ALPHABET);
  return `G${body}`;
}

export class MockWalletProvider implements WalletProvider {
  readonly chainFamily: ChainFamily;
  private readonly chainId: ChainId;
  private readonly seed: string;
  private address: string | null = null;

  constructor(chainFamily: ChainFamily, chainId: ChainId, seed?: string) {
    this.chainFamily = chainFamily;
    this.chainId = chainId;
    this.seed = seed ?? `${chainId}-${Date.now()}-${Math.random()}`;
  }

  isAvailable(): boolean {
    return true;
  }

  async connect(): Promise<WalletSession> {
    this.address = generateMockAddress(this.chainFamily, this.seed);
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

export function connectMock(
  provider: MockWalletProvider,
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
    .catch((err) => store.setError(err instanceof Error ? err.message : String(err)));
}

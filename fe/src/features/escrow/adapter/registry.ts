import type { ChainId, EscrowAdapter } from "@/shared/types";
import { chains } from "@/config/chains";
import { MockEscrowAdapter } from "./MockEscrowAdapter";

interface AdapterRegistry {
  register(chainId: ChainId, adapter: EscrowAdapter): void;
  getAdapter(chainId: ChainId): EscrowAdapter | null;
  hasAdapter(chainId: ChainId): boolean;
  clear(): void;
}

function createRegistry(): AdapterRegistry {
  const map = new Map<ChainId, EscrowAdapter>();

  return {
    register(chainId, adapter) {
      map.set(chainId, adapter);
    },
    getAdapter(chainId) {
      return map.get(chainId) ?? null;
    },
    hasAdapter(chainId) {
      return map.has(chainId);
    },
    clear() {
      map.clear();
    },
  };
}

export const adapterRegistry = createRegistry();

export function registerDefaults(): void {
  for (const chainId of Object.keys(chains) as ChainId[]) {
    adapterRegistry.register(chainId, new MockEscrowAdapter(chainId));
  }
}

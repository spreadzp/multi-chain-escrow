import { create } from "zustand";
import type { Escrow, EscrowEvent, EscrowStatus, ChainId } from "@/shared/types";

export function escrowKey(chainId: ChainId, id: string): string {
  return `${chainId}:${id}`;
}

interface EscrowState {
  byId: Record<string, Escrow>;
  events: EscrowEvent[];
  loading: boolean;
  error: string | null;

  upsertEscrow: (escrow: Escrow) => void;
  setEscrows: (escrows: Escrow[]) => void;
  patchStatus: (escrowId: string, chainId: ChainId, status: EscrowStatus) => void;
  addEvent: (event: EscrowEvent) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

const initialState = {
  byId: {} as Record<string, Escrow>,
  events: [] as EscrowEvent[],
  loading: false,
  error: null as string | null,
};

export const useEscrowStore = create<EscrowState>((set) => ({
  ...initialState,

  upsertEscrow: (escrow) =>
    set((state) => ({
      byId: {
        ...state.byId,
        [escrowKey(escrow.chainId, escrow.id)]: escrow,
      },
    })),

  setEscrows: (escrows) =>
    set({
      byId: Object.fromEntries(
        escrows.map((e) => [escrowKey(e.chainId, e.id), e]),
      ),
    }),

  patchStatus: (escrowId, chainId, status) =>
    set((state) => {
      const key = escrowKey(chainId, escrowId);
      const existing = state.byId[key];
      if (!existing) return state;
      return {
        byId: {
          ...state.byId,
          [key]: { ...existing, status },
        },
      };
    }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clear: () => set({ ...initialState }),
}));

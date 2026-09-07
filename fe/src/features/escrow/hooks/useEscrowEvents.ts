"use client";

import { useEffect } from "react";
import { useEscrowAdapter } from "./useEscrowAdapter";
import { useEscrowStore } from "../escrow-store";
import type { EscrowEvent } from "@/shared/types";

export function useEscrowEvents(): { subscribed: boolean } {
  const adapter = useEscrowAdapter();

  useEffect(() => {
    if (!adapter) {
      return;
    }

    const onEvent = (event: EscrowEvent) => {
      const store = useEscrowStore.getState();
      store.addEvent(event);

      if (event.type === "Released") {
        store.patchStatus(event.escrowId, event.chainId, "released");
      } else if (event.type === "Refunded") {
        store.patchStatus(event.escrowId, event.chainId, "refunded");
      }
    };

    const cleanup = adapter.subscribeEvents(onEvent);

    return () => {
      cleanup();
    };
  }, [adapter]);

  return { subscribed: adapter !== null };
}

import { scValToNative, xdr, rpc as StellarRpc } from "@stellar/stellar-sdk";
import type { EscrowEvent, EscrowEventType, ChainId } from "@/shared/types";

export interface EventsContext {
  server: StellarRpc.Server;
  contractId: string;
  chainId: ChainId;
}

const POLL_INTERVAL_MS = 2000;
const EVENT_LIMIT = 50;

function parseEventType(topic: xdr.ScVal[]): EscrowEventType | null {
  if (topic.length === 0) return null;
  const first = scValToNative(topic[0]);
  if (first === "Deposited") return "Deposited";
  if (first === "Released") return "Released";
  if (first === "Refunded") return "Refunded";
  return null;
}

function parseEscrowId(topic: xdr.ScVal[]): string {
  if (topic.length < 2) return "";
  const nonce = scValToNative(topic[1]);
  return String(nonce);
}

function parsePayload(
  type: EscrowEventType,
  value: xdr.ScVal,
): Record<string, string> {
  const native = scValToNative(value);
  if (type === "Deposited") {
    // (depositor, beneficiary, amount)
    const arr = native as [string, string, bigint];
    return {
      depositor: arr[0],
      beneficiary: arr[1],
      amount: String(arr[2]),
    };
  }
  if (type === "Released") {
    // (beneficiary, amount)
    const arr = native as [string, bigint];
    return {
      beneficiary: arr[0],
      amount: String(arr[1]),
    };
  }
  // Refunded: (depositor, amount)
  const arr = native as [string, bigint];
  return {
    depositor: arr[0],
    amount: String(arr[1]),
  };
}

export function parseEventFromResponse(
  event: StellarRpc.Api.EventResponse,
  chainId: ChainId,
): EscrowEvent | null {
  const type = parseEventType(event.topic);
  if (!type) return null;

  const escrowId = parseEscrowId(event.topic);
  const payload = parsePayload(type, event.value);

  return {
    id: event.id,
    chainId,
    type,
    escrowId,
    txHash: event.txHash,
    blockOrLedger: String(event.ledger),
    timestamp: new Date(event.ledgerClosedAt).getTime() / 1000,
    payload,
  };
}

export function subscribeToEscrowEvents(
  ctx: EventsContext,
  onEvent: (e: EscrowEvent) => void,
): () => void {
  let lastLedger: number | null = null;
  let stopped = false;

  async function poll() {
    if (stopped) return;

    try {
      const latestLedger = await ctx.server.getLatestLedger();
      const currentLedger = latestLedger.sequence;

      if (lastLedger === null) {
        // First poll — just record the ledger, don't fetch historical events
        lastLedger = currentLedger;
        return;
      }

      if (currentLedger <= lastLedger) return;

      const response = await ctx.server.getEvents({
        filters: [
          {
            type: "contract",
            contractIds: [ctx.contractId],
          },
        ],
        startLedger: lastLedger + 1,
        endLedger: currentLedger,
        limit: EVENT_LIMIT,
      });

      for (const event of response.events) {
        const parsed = parseEventFromResponse(event, ctx.chainId);
        if (parsed) {
          onEvent(parsed);
        }
      }

      lastLedger = currentLedger;
    } catch {
      // Silently ignore polling errors — will retry next interval
    }
  }

  const interval = setInterval(poll, POLL_INTERVAL_MS);

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

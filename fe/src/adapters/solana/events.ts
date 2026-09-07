import { Connection, PublicKey, type Logs, type Context } from "@solana/web3.js";
import type { EscrowEvent, EscrowEventType, ChainId } from "@/shared/types";

const EVENT_DISCRIMINATOR_LENGTH = 8;

const EVENT_DISCRIMINATORS: Record<string, EscrowEventType> = {
  // Anchor event discriminators are first 8 bytes of sha256("event:<EventName>")
  // DepositedEvent: sha256("event:DepositedEvent")[0:8]
  // ReleasedEvent:  sha256("event:ReleasedEvent")[0:8]
  // RefundedEvent:  sha256("event:RefundedEvent")[0:8]
  // We match by trying to decode and checking the discriminator
};

// Compute discriminators at module load
function computeDiscriminator(eventName: string): Uint8Array {
  const { createHash } = require("crypto");
  const hash = createHash("sha256");
  hash.update(`event:${eventName}`);
  const digest = hash.digest();
  return new Uint8Array(digest.subarray(0, 8));
}

const DEPOSITED_DISCRIMINATOR = computeDiscriminator("DepositedEvent");
const RELEASED_DISCRIMINATOR = computeDiscriminator("ReleasedEvent");
const REFUNDED_DISCRIMINATOR = computeDiscriminator("RefundedEvent");

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

interface ParsedEvent {
  type: EscrowEventType;
  escrowPda: string;
  fields: Record<string, string>;
}

function parseEventFromBase64(base64Data: string): ParsedEvent | null {
  const buf = Buffer.from(base64Data, "base64");
  if (buf.length < EVENT_DISCRIMINATOR_LENGTH) return null;

  const discriminator = new Uint8Array(buf.subarray(0, 8));
  const data = buf.subarray(8);

  let type: EscrowEventType | null = null;
  if (arraysEqual(discriminator, DEPOSITED_DISCRIMINATOR)) {
    type = "Deposited";
  } else if (arraysEqual(discriminator, RELEASED_DISCRIMINATOR)) {
    type = "Released";
  } else if (arraysEqual(discriminator, REFUNDED_DISCRIMINATOR)) {
    type = "Refunded";
  }

  if (!type) return null;

  // All events have: escrow_pda (32) + amount (8) at minimum
  // DepositedEvent: escrow_pda(32) + depositor(32) + beneficiary(32) + amount(8)
  // ReleasedEvent:  escrow_pda(32) + beneficiary(32) + amount(8)
  // RefundedEvent:  escrow_pda(32) + depositor(32) + amount(8)
  let offset = 0;
  const escrowPda = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const fields: Record<string, string> = {};

  if (type === "Deposited") {
    const depositor = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const beneficiary = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const amount = data.readBigUInt64LE(offset);
    fields.depositor = depositor.toBase58();
    fields.beneficiary = beneficiary.toBase58();
    fields.amount = amount.toString();
  } else if (type === "Released") {
    const beneficiary = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const amount = data.readBigUInt64LE(offset);
    fields.beneficiary = beneficiary.toBase58();
    fields.amount = amount.toString();
  } else if (type === "Refunded") {
    const depositor = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    const amount = data.readBigUInt64LE(offset);
    fields.depositor = depositor.toBase58();
    fields.amount = amount.toString();
  }

  return { type, escrowPda: escrowPda.toBase58(), fields };
}

function extractEventsFromLogs(logs: string[]): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  for (const log of logs) {
    if (!log.startsWith("Program data: ")) continue;
    const base64Data = log.slice("Program data: ".length);
    const parsed = parseEventFromBase64(base64Data);
    if (parsed) events.push(parsed);
  }
  return events;
}

export function parseEventsFromLogMessages(logMessages: string[]): ParsedEvent[] {
  return extractEventsFromLogs(logMessages);
}

export function subscribeToEscrowEvents(
  connection: Connection,
  programId: PublicKey,
  chainId: ChainId,
  onEvent: (e: EscrowEvent) => void,
): () => void {
  const subscriptionId = connection.onLogs(
    programId,
    (logs: Logs, ctx: Context) => {
      const parsed = extractEventsFromLogs(logs.logs);
      for (const p of parsed) {
        onEvent({
          id: `${p.escrowPda}-${p.type}-${logs.signature}`,
          chainId,
          type: p.type,
          escrowId: p.escrowPda,
          txHash: logs.signature,
          blockOrLedger: ctx.slot?.toString() ?? "",
          timestamp: Math.floor(Date.now() / 1000),
          payload: p.fields,
        });
      }
    },
    "confirmed",
  );

  return () => {
    connection.removeOnLogsListener(subscriptionId);
  };
}

export {
  DEPOSITED_DISCRIMINATOR,
  RELEASED_DISCRIMINATOR,
  REFUNDED_DISCRIMINATOR,
  parseEventFromBase64,
};

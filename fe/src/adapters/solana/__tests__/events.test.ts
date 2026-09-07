// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  parseEventFromBase64,
  parseEventsFromLogMessages,
  DEPOSITED_DISCRIMINATOR,
  RELEASED_DISCRIMINATOR,
  REFUNDED_DISCRIMINATOR,
} from "../events";
import { SolanaEscrowAdapter } from "../index";

const ESCROW_PDA = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const DEPOSITOR = new PublicKey("8Drae1LC1vvdxoi6ofH1TEnDdovHQUfM44X3rT6KmsJM");
const BENEFICIARY = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");

function encodeDepositedEvent(): string {
  const buf = Buffer.alloc(8 + 32 + 32 + 32 + 8);
  Buffer.from(DEPOSITED_DISCRIMINATOR).copy(buf, 0);
  ESCROW_PDA.toBuffer().copy(buf, 8);
  DEPOSITOR.toBuffer().copy(buf, 40);
  BENEFICIARY.toBuffer().copy(buf, 72);
  buf.writeBigUInt64LE(BigInt(500_000_000), 104);
  return buf.toString("base64");
}

function encodeReleasedEvent(): string {
  const buf = Buffer.alloc(8 + 32 + 32 + 8);
  Buffer.from(RELEASED_DISCRIMINATOR).copy(buf, 0);
  ESCROW_PDA.toBuffer().copy(buf, 8);
  BENEFICIARY.toBuffer().copy(buf, 40);
  buf.writeBigUInt64LE(BigInt(500_000_000), 72);
  return buf.toString("base64");
}

function encodeRefundedEvent(): string {
  const buf = Buffer.alloc(8 + 32 + 32 + 8);
  Buffer.from(REFUNDED_DISCRIMINATOR).copy(buf, 0);
  ESCROW_PDA.toBuffer().copy(buf, 8);
  DEPOSITOR.toBuffer().copy(buf, 40);
  buf.writeBigUInt64LE(BigInt(500_000_000), 72);
  return buf.toString("base64");
}

describe("SolanaEscrowAdapter — events (SLICE-08-5)", () => {
  it("DEPOSITED_DISCRIMINATOR is 8 bytes", () => {
    expect(DEPOSITED_DISCRIMINATOR.length).toBe(8);
  });

  it("RELEASED_DISCRIMINATOR is 8 bytes", () => {
    expect(RELEASED_DISCRIMINATOR.length).toBe(8);
  });

  it("REFUNDED_DISCRIMINATOR is 8 bytes", () => {
    expect(REFUNDED_DISCRIMINATOR.length).toBe(8);
  });

  it("all three discriminators are distinct", () => {
    const d1 = Buffer.from(DEPOSITED_DISCRIMINATOR).toString("hex");
    const d2 = Buffer.from(RELEASED_DISCRIMINATOR).toString("hex");
    const d3 = Buffer.from(REFUNDED_DISCRIMINATOR).toString("hex");
    expect(d1).not.toBe(d2);
    expect(d1).not.toBe(d3);
    expect(d2).not.toBe(d3);
  });

  it("parseEventFromBase64 parses DepositedEvent", () => {
    const base64 = encodeDepositedEvent();
    const parsed = parseEventFromBase64(base64);
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe("Deposited");
    expect(parsed!.escrowPda).toBe(ESCROW_PDA.toBase58());
    expect(parsed!.fields.depositor).toBe(DEPOSITOR.toBase58());
    expect(parsed!.fields.beneficiary).toBe(BENEFICIARY.toBase58());
    expect(parsed!.fields.amount).toBe("500000000");
  });

  it("parseEventFromBase64 parses ReleasedEvent", () => {
    const base64 = encodeReleasedEvent();
    const parsed = parseEventFromBase64(base64);
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe("Released");
    expect(parsed!.escrowPda).toBe(ESCROW_PDA.toBase58());
    expect(parsed!.fields.beneficiary).toBe(BENEFICIARY.toBase58());
    expect(parsed!.fields.amount).toBe("500000000");
  });

  it("parseEventFromBase64 parses RefundedEvent", () => {
    const base64 = encodeRefundedEvent();
    const parsed = parseEventFromBase64(base64);
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe("Refunded");
    expect(parsed!.escrowPda).toBe(ESCROW_PDA.toBase58());
    expect(parsed!.fields.depositor).toBe(DEPOSITOR.toBase58());
    expect(parsed!.fields.amount).toBe("500000000");
  });

  it("parseEventFromBase64 returns null for unknown discriminator", () => {
    const buf = Buffer.alloc(16, 0);
    const parsed = parseEventFromBase64(buf.toString("base64"));
    expect(parsed).toBeNull();
  });

  it("parseEventFromBase64 returns null for too-short data", () => {
    const buf = Buffer.alloc(4, 0);
    const parsed = parseEventFromBase64(buf.toString("base64"));
    expect(parsed).toBeNull();
  });

  it("parseEventsFromLogMessages extracts events from Program data logs", () => {
    const logs = [
      "Program BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj invoke [1]",
      `Program data: ${encodeDepositedEvent()}`,
      "Program BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj success",
    ];
    const events = parseEventsFromLogMessages(logs);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("Deposited");
  });

  it("parseEventsFromLogMessages ignores non-Program-data logs", () => {
    const logs = [
      "Program log: some message",
      "Program BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj success",
    ];
    const events = parseEventsFromLogMessages(logs);
    expect(events).toHaveLength(0);
  });

  it("subscribeEvents returns a cleanup function", () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    const unsub = adapter.subscribeEvents(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });
});

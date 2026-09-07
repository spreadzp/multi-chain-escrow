// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { findEscrowPda, deriveEscrowAta, createEscrowInstruction } from "../create";
import { SolanaEscrowAdapter } from "../index";

const PROGRAM_ID = new PublicKey("BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj");
const MINT = new PublicKey("So11111111111111111111111111111111111111112");
const DEPOSITOR = new PublicKey("8Drae1LC1vvdxoi6ofH1TEnDdovHQUfM44X3rT6KmsJM");
const BENEFICIARY = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

describe("SolanaEscrowAdapter — createEscrow (SLICE-08-2)", () => {
  it("findEscrowPda returns deterministic PDA", () => {
    const nonce = BigInt(1);
    const result1 = findEscrowPda(DEPOSITOR, BENEFICIARY, nonce, PROGRAM_ID);
    const result2 = findEscrowPda(DEPOSITOR, BENEFICIARY, nonce, PROGRAM_ID);
    expect(result1.pda.toBase58()).toBe(result2.pda.toBase58());
    expect(result1.bump).toBe(result2.bump);
    expect(result1.pda).toBeInstanceOf(PublicKey);
  });

  it("findEscrowPda returns different PDAs for different nonces", () => {
    const r1 = findEscrowPda(DEPOSITOR, BENEFICIARY, BigInt(1), PROGRAM_ID);
    const r2 = findEscrowPda(DEPOSITOR, BENEFICIARY, BigInt(2), PROGRAM_ID);
    expect(r1.pda.toBase58()).not.toBe(r2.pda.toBase58());
  });

  it("findEscrowPda returns different PDAs for different depositors", () => {
    const otherDepositor = new PublicKey("So11111111111111111111111111111111111111112");
    const r1 = findEscrowPda(DEPOSITOR, BENEFICIARY, BigInt(1), PROGRAM_ID);
    const r2 = findEscrowPda(otherDepositor, BENEFICIARY, BigInt(1), PROGRAM_ID);
    expect(r1.pda.toBase58()).not.toBe(r2.pda.toBase58());
  });

  it("deriveEscrowAta returns valid ATA address", () => {
    const escrowPda = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const ata = deriveEscrowAta(MINT, escrowPda);
    expect(ata).toBeInstanceOf(PublicKey);
    expect(ata.toBase58()).toBeTruthy();
  });

  it("deriveEscrowAta is deterministic", () => {
    const escrowPda = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const ata1 = deriveEscrowAta(MINT, escrowPda);
    const ata2 = deriveEscrowAta(MINT, escrowPda);
    expect(ata1.toBase58()).toBe(ata2.toBase58());
  });

  it("createEscrow throws if wallet not set", async () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    await expect(
      adapter.createEscrow({
        beneficiary: BENEFICIARY.toBase58(),
        amount: "1000",
        tokenAddress: MINT.toBase58(),
      }),
    ).rejects.toThrow("Wallet address not set");
  });

  it("createEscrowInstruction is a function", () => {
    expect(typeof createEscrowInstruction).toBe("function");
  });

  it("PDA seed prefix matches on-chain SEED_PREFIX", () => {
    const nonce = BigInt(0);
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64LE(nonce);
    const [expectedPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), DEPOSITOR.toBuffer(), BENEFICIARY.toBuffer(), nonceBuf],
      PROGRAM_ID,
    );
    const { pda } = findEscrowPda(DEPOSITOR, BENEFICIARY, nonce, PROGRAM_ID);
    expect(pda.toBase58()).toBe(expectedPda.toBase58());
  });
});

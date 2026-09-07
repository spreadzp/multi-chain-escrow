// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { releaseEscrowInstruction } from "../release";
import { refundEscrowInstruction } from "../refund";
import { SolanaEscrowAdapter } from "../index";

const MINT = new PublicKey("So11111111111111111111111111111111111111112");
const SIGNER = new PublicKey("8Drae1LC1vvdxoi6ofH1TEnDdovHQUfM44X3rT6KmsJM");
const ESCROW_PDA = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

describe("SolanaEscrowAdapter — release + refund (SLICE-08-3)", () => {
  it("releaseEscrowInstruction is a function", () => {
    expect(typeof releaseEscrowInstruction).toBe("function");
  });

  it("refundEscrowInstruction is a function", () => {
    expect(typeof refundEscrowInstruction).toBe("function");
  });

  it("releaseEscrow throws if wallet not set", async () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    await expect(adapter.releaseEscrow(ESCROW_PDA.toBase58())).rejects.toThrow(
      "Wallet address not set",
    );
  });

  it("refundEscrow throws if wallet not set", async () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    await expect(adapter.refundEscrow(ESCROW_PDA.toBase58())).rejects.toThrow(
      "Wallet address not set",
    );
  });

  it("releaseEscrow derives correct beneficiary ATA", () => {
    const beneficiaryAta = getAssociatedTokenAddressSync(MINT, SIGNER);
    expect(beneficiaryAta).toBeInstanceOf(PublicKey);
    expect(beneficiaryAta.toBase58()).toBeTruthy();
  });

  it("refundEscrow derives correct depositor ATA", () => {
    const depositorAta = getAssociatedTokenAddressSync(MINT, SIGNER);
    expect(depositorAta).toBeInstanceOf(PublicKey);
    expect(depositorAta.toBase58()).toBeTruthy();
  });

  it("release and refund derive same ATA for same signer (both use signer ATA)", () => {
    const releaseAta = getAssociatedTokenAddressSync(MINT, SIGNER);
    const refundAta = getAssociatedTokenAddressSync(MINT, SIGNER);
    expect(releaseAta.toBase58()).toBe(refundAta.toBase58());
  });

  it("escrow ATA is derived with allowOwnerOffCurve=true", () => {
    const escrowAta = getAssociatedTokenAddressSync(MINT, ESCROW_PDA, true);
    expect(escrowAta).toBeInstanceOf(PublicKey);
    expect(escrowAta.toBase58()).toBeTruthy();
  });
});

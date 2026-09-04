import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { Escrow } from "../target/types/escrow";

const SEED_PREFIX = Buffer.from("escrow");

describe("escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  // Separate connection with confirmed commitment for getTransaction
  const confirmedConn = new anchor.web3.Connection(provider.connection.rpcEndpoint, "confirmed");
  const program = anchor.workspace.Escrow as Program<Escrow>;

  // Test wallets
  const depositor = Keypair.generate();
  const beneficiary = Keypair.generate();
  const resolver = Keypair.generate();
  const unauthorized = Keypair.generate();

  // SPL mint (created in before)
  let mint: PublicKey;

  // Token accounts
  let depositorAta: PublicKey;
  let beneficiaryAta: PublicKey;
  let resolverAta: PublicKey;
  let unauthorizedAta: PublicKey;

  const MINT_AMOUNT = 10_000_000_000;
  const ESCROW_AMOUNT = 500_000_000;
  const NONCE = 0;

  function findEscrowPda(dep: PublicKey, ben: PublicKey, nonce: number | bigint) {
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64LE(BigInt(nonce));
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [SEED_PREFIX, dep.toBuffer(), ben.toBuffer(), nonceBuf],
      program.programId
    );
    return { pda, bump };
  }

  async function getTokenBalance(ata: PublicKey): Promise<number> {
    const accountInfo = await connection.getAccountInfo(ata);
    if (!accountInfo) return 0;
    // SPL Token account: amount is at offset 64, 8 bytes little-endian
    const amount = accountInfo.data.readBigUInt64LE(64);
    return Number(amount);
  }

  // Derive escrow ATA address (without creating it — program's init creates it)
  function deriveEscrowAta(escrowPda: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(mint, escrowPda, true);
  }

  async function createEscrow(nonce: number, amount: number = ESCROW_AMOUNT) {
    const { pda: escrowPda } = findEscrowPda(depositor.publicKey, beneficiary.publicKey, nonce);
    const escrowAta = deriveEscrowAta(escrowPda);

    await program.methods
      .createEscrow(
        beneficiary.publicKey,
        resolver.publicKey,
        new anchor.BN(amount),
        new anchor.BN(nonce)
      )
      .accounts({
        depositor: depositor.publicKey,
        mint,
        depositorAta,
        escrowPda,
        escrowAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([depositor])
      .rpc();

    return { escrowPda, escrowAta };
  }

  before(async () => {
    const wallets = [depositor, beneficiary, resolver, unauthorized];
    for (const w of wallets) {
      const sig = await connection.requestAirdrop(w.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
    }

    mint = await createMint(connection, depositor, depositor.publicKey, null, 9);

    const depAta = await getOrCreateAssociatedTokenAccount(connection, depositor, mint, depositor.publicKey);
    depositorAta = depAta.address;

    const benAta = await getOrCreateAssociatedTokenAccount(connection, beneficiary, mint, beneficiary.publicKey);
    beneficiaryAta = benAta.address;

    const resAta = await getOrCreateAssociatedTokenAccount(connection, resolver, mint, resolver.publicKey);
    resolverAta = resAta.address;

    const unauthAta = await getOrCreateAssociatedTokenAccount(connection, unauthorized, mint, unauthorized.publicKey);
    unauthorizedAta = unauthAta.address;

    await mintTo(connection, depositor, mint, depositorAta, depositor, MINT_AMOUNT);
  });

  describe("create_escrow", () => {
    it("creates escrow PDA with tokens and status Created", async () => {
      const { escrowPda, escrowAta } = await createEscrow(NONCE);

      const escrowAccount = await program.account.escrowAccount.fetch(escrowPda);
      expect(escrowAccount.depositor.toBase58()).to.equal(depositor.publicKey.toBase58());
      expect(escrowAccount.beneficiary.toBase58()).to.equal(beneficiary.publicKey.toBase58());
      expect(escrowAccount.resolver.toBase58()).to.equal(resolver.publicKey.toBase58());
      expect(escrowAccount.mint.toBase58()).to.equal(mint.toBase58());
      expect(escrowAccount.amount.toNumber()).to.equal(ESCROW_AMOUNT);
      expect(escrowAccount.status).to.have.property("created");
      expect(escrowAccount.nonce.toNumber()).to.equal(NONCE);
      expect(escrowAccount.bump).to.be.a("number");

      const escrowBalance = await getTokenBalance(escrowAta);
      expect(escrowBalance).to.equal(ESCROW_AMOUNT);

      const depBalance = await getTokenBalance(depositorAta);
      expect(depBalance).to.equal(MINT_AMOUNT - ESCROW_AMOUNT);
    });

    it("rejects amount = 0", async () => {
      const nonce = 999;
      const { pda: escrowPda } = findEscrowPda(depositor.publicKey, beneficiary.publicKey, nonce);
      const escrowAta = deriveEscrowAta(escrowPda);

      try {
        await program.methods
          .createEscrow(beneficiary.publicKey, resolver.publicKey, new anchor.BN(0), new anchor.BN(nonce))
          .accounts({
            depositor: depositor.publicKey,
            mint,
            depositorAta,
            escrowPda,
            escrowAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([depositor])
          .rpc();
        expect.fail("Should have rejected amount = 0");
      } catch (err: any) {
        expect(err.message).to.match(/Amount must be greater than zero|InvalidAmount|6000/);
      }
    });
  });

  describe("release_escrow", () => {
    it("releases tokens to beneficiary as beneficiary", async () => {
      const nonce = 1;
      const { escrowPda, escrowAta } = await createEscrow(nonce);

      const benBalanceBefore = await getTokenBalance(beneficiaryAta);

      const tx = await program.methods
        .releaseEscrow()
        .accounts({
          signer: beneficiary.publicKey,
          escrowPda,
          mint,
          escrowAta,
          beneficiaryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([beneficiary])
        .rpc();

      const escrowAccount = await program.account.escrowAccount.fetch(escrowPda);
      expect(escrowAccount.status).to.have.property("released");

      const benBalanceAfter = await getTokenBalance(beneficiaryAta);
      expect(benBalanceAfter - benBalanceBefore).to.equal(ESCROW_AMOUNT);

      const escrowBalance = await getTokenBalance(escrowAta);
      expect(escrowBalance).to.equal(0);

      await new Promise((r) => setTimeout(r, 2000));
      const txInfo = await confirmedConn.getTransaction(tx, { maxSupportedTransactionVersion: 0 });
      const logs = txInfo?.meta?.logMessages ?? [];
      const hasEvent = logs.some((l) => l.includes("Program data:"));
      expect(hasEvent, `ReleasedEvent should be in logs: ${logs.join("\n")}`).to.be.true;
    });

    it("releases tokens to beneficiary as resolver", async () => {
      const nonce = 2;
      const { escrowPda, escrowAta } = await createEscrow(nonce);

      const benBalanceBefore = await getTokenBalance(beneficiaryAta);

      await program.methods
        .releaseEscrow()
        .accounts({
          signer: resolver.publicKey,
          escrowPda,
          mint,
          escrowAta,
          beneficiaryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([resolver])
        .rpc();

      const benBalanceAfter = await getTokenBalance(beneficiaryAta);
      expect(benBalanceAfter - benBalanceBefore).to.equal(ESCROW_AMOUNT);

      const escrowAccount = await program.account.escrowAccount.fetch(escrowPda);
      expect(escrowAccount.status).to.have.property("released");
    });

    it("rejects release by non-beneficiary/non-resolver", async () => {
      const nonce = 3;
      const { escrowPda, escrowAta } = await createEscrow(nonce);

      try {
        await program.methods
          .releaseEscrow()
          .accounts({
            signer: unauthorized.publicKey,
            escrowPda,
            mint,
            escrowAta,
            beneficiaryAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([unauthorized])
          .rpc();
        expect.fail("Should have rejected unauthorized release");
      } catch (err: any) {
        expect(err.message).to.match(/Only beneficiary or resolver can release|NotAuthorized|3011/);
      }
    });

    it("rejects double release", async () => {
      const { pda: escrowPda } = findEscrowPda(depositor.publicKey, beneficiary.publicKey, 1);
      const escrowAta = deriveEscrowAta(escrowPda);

      try {
        await program.methods
          .releaseEscrow()
          .accounts({
            signer: beneficiary.publicKey,
            escrowPda,
            mint,
            escrowAta,
            beneficiaryAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([beneficiary])
          .rpc();
        expect.fail("Should have rejected double release");
      } catch (err: any) {
        expect(err.message).to.match(/Escrow status must be Created to release|NotCreated|3010/);
      }
    });
  });

  describe("refund_escrow", () => {
    it("refunds tokens to depositor", async () => {
      const nonce = 4;
      const { escrowPda, escrowAta } = await createEscrow(nonce);

      const depBalanceBefore = await getTokenBalance(depositorAta);

      const tx = await program.methods
        .refundEscrow()
        .accounts({
          signer: depositor.publicKey,
          escrowPda,
          mint,
          escrowAta,
          depositorAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();

      const escrowAccount = await program.account.escrowAccount.fetch(escrowPda);
      expect(escrowAccount.status).to.have.property("refunded");

      const depBalanceAfter = await getTokenBalance(depositorAta);
      expect(depBalanceAfter - depBalanceBefore).to.equal(ESCROW_AMOUNT);

      const escrowBalance = await getTokenBalance(escrowAta);
      expect(escrowBalance).to.equal(0);

      await new Promise((r) => setTimeout(r, 2000));
      const txInfo = await confirmedConn.getTransaction(tx, { maxSupportedTransactionVersion: 0 });
      const logs = txInfo?.meta?.logMessages ?? [];
      const hasEvent = logs.some((l) => l.includes("Program data:"));
      expect(hasEvent, `RefundedEvent should be in logs: ${logs.join("\n")}`).to.be.true;
    });

    it("rejects refund by non-depositor", async () => {
      const nonce = 5;
      const { escrowPda, escrowAta } = await createEscrow(nonce);

      try {
        await program.methods
          .refundEscrow()
          .accounts({
            signer: unauthorized.publicKey,
            escrowPda,
            mint,
            escrowAta,
            depositorAta: unauthorizedAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([unauthorized])
          .rpc();
        expect.fail("Should have rejected refund by non-depositor");
      } catch (err: any) {
        expect(err.message).to.match(/Only the depositor can refund|NotDepositor|3012/);
      }
    });

    it("rejects refund on Released escrow", async () => {
      const { pda: escrowPda } = findEscrowPda(depositor.publicKey, beneficiary.publicKey, 1);
      const escrowAta = deriveEscrowAta(escrowPda);

      try {
        await program.methods
          .refundEscrow()
          .accounts({
            signer: depositor.publicKey,
            escrowPda,
            mint,
            escrowAta,
            depositorAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([depositor])
          .rpc();
        expect.fail("Should have rejected refund on Released escrow");
      } catch (err: any) {
        expect(err.message).to.match(/Escrow status must be Created to refund|NotCreated|3011/);
      }
    });

    it("rejects release on Refunded escrow", async () => {
      const { pda: escrowPda } = findEscrowPda(depositor.publicKey, beneficiary.publicKey, 4);
      const escrowAta = deriveEscrowAta(escrowPda);

      try {
        await program.methods
          .releaseEscrow()
          .accounts({
            signer: beneficiary.publicKey,
            escrowPda,
            mint,
            escrowAta,
            beneficiaryAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([beneficiary])
          .rpc();
        expect.fail("Should have rejected release on Refunded escrow");
      } catch (err: any) {
        expect(err.message).to.match(/Escrow status must be Created to release|NotCreated|3010/);
      }
    });
  });
});

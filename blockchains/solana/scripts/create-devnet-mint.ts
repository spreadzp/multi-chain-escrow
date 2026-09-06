/**
 * Create SPL Mint on Solana Devnet
 *
 * Creates a new SPL token mint for testing escrow on devnet.
 * The mint authority is set to the deployer keypair.
 *
 * Usage:
 *   npx tsx blockchains/solana/scripts/create-devnet-mint.ts
 *
 * Output:
 *   - Mint address printed to stdout
 *   - Mint address saved to blockchains/solana/.local-keys/devnet-mint.json
 */
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = join(__dirname, "..", ".local-keys");
const DEPLOYER_KEY_PATH = join(KEYS_DIR, "deployer-anchor.json");
const DEVNET_URL = "https://api.devnet.solana.com";
const DECIMALS = 6;

function loadKeypair(path: string): Keypair {
  if (!existsSync(path)) {
    console.error(`Error: Keypair not found at ${path}`);
    console.error("Run 'npm run chain:solana:faucet' first to generate keys.");
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(path, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main(): Promise<void> {
  console.log("=== Solana — Create SPL Mint on Devnet ===\n");

  const connection = new Connection(DEVNET_URL, "confirmed");
  const deployer = loadKeypair(DEPLOYER_KEY_PATH);

  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);

  // Check balance
  const balance = await connection.getBalance(deployer.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance === 0) {
    console.error("Error: Deployer has 0 SOL. Run airdrop first:");
    console.error(`  solana airdrop 5 ${deployer.publicKey.toBase58()} --url ${DEVNET_URL}`);
    process.exit(1);
  }

  // Generate mint keypair
  const mintKeypair = Keypair.generate();
  console.log(`Mint address: ${mintKeypair.publicKey.toBase58()}`);

  // Calculate lamports for rent exemption
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  // Build transaction: create account + initialize mint
  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: deployer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      DECIMALS,
      deployer.publicKey, // mint authority
      deployer.publicKey, // freeze authority (same as mint)
    ),
  );

  console.log("Sending transaction...");
  const sig = await sendAndConfirmTransaction(connection, tx, [deployer, mintKeypair]);
  console.log(`Transaction confirmed: ${sig}`);

  // Save mint keypair
  mkdirSync(KEYS_DIR, { recursive: true });
  const mintFile = {
    address: mintKeypair.publicKey.toBase58(),
    decimals: DECIMALS,
    mintAuthority: deployer.publicKey.toBase58(),
    secretKey: Array.from(mintKeypair.secretKey),
  };
  const mintPath = join(KEYS_DIR, "devnet-mint.json");
  writeFileSync(mintPath, JSON.stringify(mintFile, null, 2));

  console.log(`\n=== Mint Created ===`);
  console.log(`Address: ${mintKeypair.publicKey.toBase58()}`);
  console.log(`Decimals: ${DECIMALS}`);
  console.log(`Explorer: https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`);
  console.log(`Keypair saved: ${mintPath}`);
  console.log(`\nUpdate fe/src/config/contracts.ts:`);
  console.log(`  solanaDevnetContracts.tokenMint = "${mintKeypair.publicKey.toBase58()}"`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

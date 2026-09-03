import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = join(__dirname, "..", ".local-keys");
const RPC_URL = "http://localhost:8899";
const AIRDROP_AMOUNT = 10;

const ROLES = ["deployer", "depositor", "beneficiary", "resolver"] as const;
type Role = (typeof ROLES)[number];

interface KeyPairFile {
  role: string;
  publicKey: string;
  secretKey: number[];
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function runAllowError(cmd: string): string {
  try {
    return run(cmd);
  } catch {
    return "";
  }
}

function checkValidator(): boolean {
  try {
    const result = run(
      `solana cluster-version --url ${RPC_URL} 2>/dev/null`,
    );
    return result.length > 0;
  } catch {
    return false;
  }
}

function loadOrCreateKeypair(role: Role): KeyPairFile {
  const filePath = join(KEYS_DIR, `${role}.json`);

  if (existsSync(filePath)) {
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as KeyPairFile;
    console.log(`  ${role}: loaded existing keypair (${data.publicKey})`);
    return data;
  }

  // Generate keypair using solana-keygen
  run(`solana-keygen new --no-bip39-passphrase --force -o "${filePath}" 2>/dev/null`);

  // solana-keygen writes a JSON array of 64 bytes; read it and extract pubkey
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as number[];
  // Public key is first 32 bytes, secret key is all 64
  const keypairFile: KeyPairFile = {
    role,
    publicKey: run(`solana-keygen pubkey "${filePath}"`),
    secretKey: raw,
  };

  // Rewrite with our structured format alongside the raw keypair
  writeFileSync(filePath, JSON.stringify(keypairFile, null, 2));
  console.log(`  ${role}: generated new keypair (${keypairFile.publicKey})`);
  return keypairFile;
}

async function getBalance(publicKey: string): Promise<string> {
  try {
    const balance = run(`solana balance "${publicKey}" --url ${RPC_URL} 2>/dev/null`);
    return balance;
  } catch {
    return "0 SOL";
  }
}

function airdrop(publicKey: string): boolean {
  const result = runAllowError(
    `solana airdrop ${AIRDROP_AMOUNT} "${publicKey}" --url ${RPC_URL} 2>/dev/null`,
  );
  return result.length > 0 && !result.toLowerCase().includes("error");
}

async function main(): Promise<void> {
  console.log("Solana Faucet — keypair generation + airdrop\n");

  if (!checkValidator()) {
    console.error("Error: Solana validator is not running on localhost:8899.");
    console.error("Start it first: npm run chain:solana");
    process.exit(1);
  }

  mkdirSync(KEYS_DIR, { recursive: true });

  console.log("Generating/loading keypairs:");
  const keypairs: Record<Role, KeyPairFile> = {} as Record<Role, KeyPairFile>;
  for (const role of ROLES) {
    keypairs[role] = loadOrCreateKeypair(role);
  }

  console.log("\nAirdropping SOL:");
  for (const role of ROLES) {
    const kp = keypairs[role];
    const balance = await getBalance(kp.publicKey);
    if (balance !== "0 SOL" && !balance.startsWith("0 ")) {
      console.log(`  ${role}: already funded (${balance}), skipping`);
    } else {
      const ok = airdrop(kp.publicKey);
      if (ok) {
        console.log(`  ${role}: airdropped ${AIRDROP_AMOUNT} SOL to ${kp.publicKey}`);
      } else {
        console.log(`  ${role}: airdrop failed (may already have balance)`);
      }
    }
  }

  console.log("\nAccount summary:");
  console.log("─".repeat(80));
  console.log(`${"Role".padEnd(14)} ${"Address".padEnd(46)} Balance`);
  console.log("─".repeat(80));
  for (const role of ROLES) {
    const kp = keypairs[role];
    const balance = await getBalance(kp.publicKey);
    console.log(`${role.padEnd(14)} ${kp.publicKey.padEnd(46)} ${balance}`);
  }
  console.log("─".repeat(80));
  console.log(`\nKeypairs saved to: ${KEYS_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

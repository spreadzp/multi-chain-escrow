import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset } from "@stellar/stellar-sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = join(__dirname, "..", ".local-keys");
const HORIZON_URL = "http://localhost:8000";
const ROOT_SECRET = "SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L";
const NETWORK_PASSPHRASE = "Standalone Network ; February 2017";
const STARTING_BALANCE = "10000";

const ROLES = ["deployer", "depositor", "beneficiary", "resolver"] as const;
type Role = (typeof ROLES)[number];

interface KeyPairFile {
  role: string;
  publicKey: string;
  secretKey: string;
}

function loadOrCreateKeypair(role: Role): KeyPairFile {
  const filePath = join(KEYS_DIR, `${role}.json`);

  if (existsSync(filePath)) {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    console.log(`  ${role}: loaded existing keypair (${data.publicKey})`);
    return data;
  }

  const kp = Keypair.random();
  const keypairFile: KeyPairFile = {
    role,
    publicKey: kp.publicKey(),
    secretKey: kp.secret(),
  };

  writeFileSync(filePath, JSON.stringify(keypairFile, null, 2));
  console.log(`  ${role}: generated new keypair (${keypairFile.publicKey})`);
  return keypairFile;
}

async function checkNetwork(): Promise<boolean> {
  try {
    const resp = await fetch(`${HORIZON_URL}/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

async function accountExists(publicKey: string): Promise<boolean> {
  try {
    const resp = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    return resp.ok;
  } catch {
    return false;
  }
}

async function getBalance(publicKey: string): Promise<string> {
  try {
    const resp = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!resp.ok) return "0";
    const data = (await resp.json()) as { balances?: Array<{ balance: string; asset_type: string }> };
    const native = data.balances?.find((b) => b.asset_type === "native");
    return native?.balance ?? "0";
  } catch {
    return "0";
  }
}

async function fundAccounts(keypairs: Record<Role, KeyPairFile>): Promise<void> {
  const server = new Horizon.Server(HORIZON_URL, { allowHttp: true });
  const rootKeypair = Keypair.fromSecret(ROOT_SECRET);
  const rootAccount = await server.loadAccount(rootKeypair.publicKey());

  // Check which accounts need funding
  const toFund: KeyPairFile[] = [];
  for (const role of ROLES) {
    const kp = keypairs[role];
    if (await accountExists(kp.publicKey)) {
      console.log(`  ${role}: already funded, skipping`);
    } else {
      toFund.push(kp);
    }
  }

  if (toFund.length === 0) {
    console.log("  All accounts already funded.");
    return;
  }

  // Build transaction with createAccount ops
  const txBuilder = new TransactionBuilder(rootAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  for (const kp of toFund) {
    txBuilder.addOperation(
      Operation.createAccount({
        destination: kp.publicKey,
        startingBalance: STARTING_BALANCE,
      })
    );
  }

  const tx = txBuilder.setTimeout(30).build();
  tx.sign(rootKeypair);

  console.log(`  Submitting funding transaction for ${toFund.length} account(s)...`);
  const result = await server.submitTransaction(tx);
  console.log(`  Transaction submitted: ${result.hash}`);
}

async function main(): Promise<void> {
  console.log("Stellar Faucet — keypair generation + funding\n");

  if (!(await checkNetwork())) {
    console.error("Error: Stellar network is not running on localhost:8000.");
    console.error("Start it first: npm run chain:stellar");
    process.exit(1);
  }

  mkdirSync(KEYS_DIR, { recursive: true });

  console.log("Generating/loading keypairs:");
  const keypairs: Record<Role, KeyPairFile> = {} as Record<Role, KeyPairFile>;
  for (const role of ROLES) {
    keypairs[role] = loadOrCreateKeypair(role);
  }

  console.log("\nFunding accounts via root account:");
  await fundAccounts(keypairs);

  console.log("\nAccount summary:");
  console.log("─".repeat(80));
  console.log(`${"Role".padEnd(14)} ${"Address".padEnd(58)} Balance`);
  console.log("─".repeat(80));
  for (const role of ROLES) {
    const kp = keypairs[role];
    const balance = await getBalance(kp.publicKey);
    console.log(`${role.padEnd(14)} ${kp.publicKey.padEnd(58)} ${balance}`);
  }
  console.log("─".repeat(80));
  console.log(`\nKeypairs saved to: ${KEYS_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

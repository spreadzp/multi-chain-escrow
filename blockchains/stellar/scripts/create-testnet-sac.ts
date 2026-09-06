/**
 * Create SAC (Stellar Asset Contract) Token on Testnet
 *
 * Creates a classic Stellar asset (TEST token) issued by the deployer,
 * establishes a trustline, mints tokens, then wraps it as a SAC contract.
 *
 * Usage:
 *   npx tsx blockchains/stellar/scripts/create-testnet-sac.ts
 *
 * Output:
 *   - SAC contract ID printed to stdout
 *   - Saved to blockchains/stellar/.local-keys/testnet-sac.json
 */
import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset } from "@stellar/stellar-sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = join(__dirname, "..", ".local-keys");
const DEPLOYER_KEY_PATH = join(KEYS_DIR, "deployer.json");
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const ASSET_CODE = "TEST";
const TOKEN_SUPPLY = "1000000000";

interface KeyPairFile {
  role: string;
  publicKey: string;
  secretKey: string;
}

function loadKeypair(path: string): KeyPairFile {
  if (!existsSync(path)) {
    console.error(`Error: Keypair not found at ${path}`);
    console.error("Run 'npm run chain:stellar:faucet' first to generate keys.");
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as KeyPairFile;
}

async function main(): Promise<void> {
  console.log("=== Stellar — Create SAC Token on Testnet ===\n");

  const deployerFile = loadKeypair(DEPLOYER_KEY_PATH);
  const deployer = Keypair.fromSecret(deployerFile.secretKey);
  console.log(`Deployer/Issuer: ${deployer.publicKey()}`);

  const server = new Horizon.Server(HORIZON_URL);

  // Check account exists
  let account: any;
  try {
    account = await server.loadAccount(deployer.publicKey());
    console.log(`Account loaded, balance: ${account.balances[0]?.balance || "0"} XLM`);
  } catch {
    console.error("Error: Deployer account not found on testnet.");
    console.error(`Fund it via friendbot: curl "https://friendbot.stellar.org/?addr=${deployer.publicKey()}"`);
    process.exit(1);
  }

  // Create a distribution account for the asset
  const distributor = Keypair.random();
  console.log(`Distributor: ${distributor.publicKey()}`);

  // Step 1: Create distributor account (fund from deployer)
  console.log("\nCreating distributor account...");
  const tx1 = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createAccount({
        destination: distributor.publicKey(),
        startingBalance: "100",
      }),
    )
    .setTimeout(60)
    .build();

  tx1.sign(deployer);
  try {
    await server.submitTransaction(tx1);
    console.log("Distributor account created.");
  } catch (err: any) {
    console.error("Failed to create distributor:", err?.response?.data || err);
    process.exit(1);
  }

  // Step 2: Establish trustline on distributor for TEST asset
  console.log("Establishing trustline...");
  const distAccount = await server.loadAccount(distributor.publicKey());
  const tx2 = new TransactionBuilder(distAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: new Asset(ASSET_CODE, deployer.publicKey()),
      }),
    )
    .setTimeout(60)
    .build();

  tx2.sign(distributor);
  try {
    await server.submitTransaction(tx2);
    console.log("Trustline established.");
  } catch (err: any) {
    console.error("Failed to establish trustline:", err?.response?.data || err);
    process.exit(1);
  }

  // Step 3: Mint tokens to distributor
  console.log(`Minting ${TOKEN_SUPPLY} ${ASSET_CODE} tokens...`);
  const issuerAccount = await server.loadAccount(deployer.publicKey());
  const tx3 = new TransactionBuilder(issuerAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: distributor.publicKey(),
        asset: new Asset(ASSET_CODE, deployer.publicKey()),
        amount: TOKEN_SUPPLY,
      }),
    )
    .setTimeout(60)
    .build();

  tx3.sign(deployer);
  try {
    await server.submitTransaction(tx3);
    console.log("Tokens minted.");
  } catch (err: any) {
    console.error("Failed to mint tokens:", err?.response?.data || err);
    process.exit(1);
  }

  // Save distributor key
  const distFile = {
    role: "distributor",
    publicKey: distributor.publicKey(),
    secretKey: distributor.secret(),
    assetCode: ASSET_CODE,
    issuer: deployer.publicKey(),
  };
  writeFileSync(join(KEYS_DIR, "testnet-distributor.json"), JSON.stringify(distFile, null, 2));

  // Step 4: Get SAC contract ID using stellar CLI
  console.log("\nGetting SAC contract ID...");
  const { execSync } = await import("child_process");
  const sacId = execSync(
    `stellar contract id asset --asset ${ASSET_CODE}:${deployer.publicKey()} --network testnet`,
    { encoding: "utf-8" },
  ).trim();

  console.log(`SAC Contract ID: ${sacId}`);

  // Save SAC info
  const sacFile = {
    contractId: sacId,
    assetCode: ASSET_CODE,
    issuer: deployer.publicKey(),
    distributor: distributor.publicKey(),
    supply: TOKEN_SUPPLY,
    network: "testnet",
  };
  writeFileSync(join(KEYS_DIR, "testnet-sac.json"), JSON.stringify(sacFile, null, 2));

  console.log(`\n=== SAC Token Created ===`);
  console.log(`Contract ID: ${sacId}`);
  console.log(`Asset: ${ASSET_CODE}:${deployer.publicKey()}`);
  console.log(`Supply: ${TOKEN_SUPPLY} ${ASSET_CODE}`);
  console.log(`Explorer: https://stellar.expert/explorer/testnet/contract/${sacId}`);
  console.log(`\nUpdate fe/src/config/contracts.ts:`);
  console.log(`  stellarTestnetContracts.contractId = "${sacId}"`);
  console.log(`  stellarTestnetContracts.tokenMint = "${sacId}"`);
  console.log(`  stellarTestnetContracts.resolverId = "${deployer.publicKey()}"`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

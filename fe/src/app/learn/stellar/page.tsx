import { StellarAccountModel } from "@/components/diagrams/StellarAccountModel";
import { StellarTokenFlow } from "@/components/diagrams/StellarTokenFlow";
import { EvmStellarComparison } from "@/components/diagrams/EvmStellarComparison";

export const metadata = {
  title: "Stellar for EVM Developers",
  description: "Onboarding guide for EVM developers learning Stellar: Soroban, WASM contracts, assets, SAC, trustlines, ledger entries, fees.",
};

const comparisonTable = [
  { concept: "Smart Contract", evm: "Solidity → EVM bytecode", stellar: "Rust → WASM (Soroban)" },
  { concept: "Storage", evm: "Contract storage slots", stellar: "Ledger entries (key-value)" },
  { concept: "Tokens", evm: "ERC-20 contract", stellar: "Assets (SAC) or contract tokens" },
  { concept: "Token standard", evm: "ERC-20/721/1155", stellar: "SEP-41 / Token Interface" },
  { concept: "Account types", evm: "EOA + Contract", stellar: "G-address + C-address" },
  { concept: "Trustlines", evm: "Not needed", stellar: "Required for assets" },
  { concept: "Fee model", evm: "Gas (per opcode)", stellar: "Base fee + resource metering" },
  { concept: "Deployment", evm: "Bytecode in one tx", stellar: "WASM upload + contract creation (2 steps)" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 text-xs font-mono text-text-secondary">
      {children}
    </pre>
  );
}

function ComparisonRow({ concept, evm, stellar }: { concept: string; evm: string; stellar: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border py-3 last:border-0">
      <div className="text-sm font-medium text-text-primary">{concept}</div>
      <div className="text-sm text-text-secondary">{evm}</div>
      <div className="text-sm text-info">{stellar}</div>
    </div>
  );
}

export default function StellarOnboardingPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text-primary">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--info)" }} />
          Stellar for EVM Developers
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          A guide for developers who know Ethereum/Solidity and want to understand Stellar&apos;s Soroban smart contracts.
        </p>
      </div>

      {/* EVM vs Stellar Comparison Diagram */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">EVM vs Stellar at a Glance</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface-1 p-4 shadow-1">
          <EvmStellarComparison />
        </div>
      </section>

      {/* Comparison Table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Quick Reference</h2>
        <div className="rounded-lg border border-border bg-surface-1 p-5 shadow-1">
          <div className="grid grid-cols-3 gap-4 border-b border-border-strong pb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Concept</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">EVM</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-info">Stellar</div>
          </div>
          {comparisonTable.map((row) => (
            <ComparisonRow key={row.concept} {...row} />
          ))}
        </div>
      </section>

      {/* 1. Account Model */}
      <Section id="account-model" title="1. Account Model">
        <p className="mb-4 text-sm text-text-secondary">
          Stellar has two types of addresses: <strong>G-addresses</strong> (classic accounts, like EVM EOAs) and <strong>C-addresses</strong> (contract accounts, like EVM contract addresses). Classic accounts hold balances and submit transactions. Contract accounts hold smart contract code and state.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> Stellar accounts can have <strong>trustlines</strong> — explicit declarations that they trust a specific asset issuer. EVM has no equivalent.
        </p>
        <div className="mb-4">
          <StellarAccountModel />
        </div>
        <CodeBlock>{`// Stellar: two address types
// G-address: classic account (like EVM EOA)
//   GABCD...XYZ — signs transactions, holds balances
// C-address: contract account (like EVM contract)
//   CABCD...XYZ — holds WASM contract code + state

// EVM: two account types
// EOA: 0xABC... — externally owned, signs txs
// Contract: 0xDEF... — holds bytecode + storage`}</CodeBlock>
      </Section>

      {/* 2. Soroban */}
      <Section id="soroban" title="2. Soroban Smart Contracts (WASM)">
        <p className="mb-4 text-sm text-text-secondary">
          Stellar smart contracts are written in <strong>Rust</strong> and compiled to <strong>WebAssembly (WASM)</strong>. Deployment is a <strong>two-step process</strong>: first upload the WASM bytecode, then create a contract instance from that WASM hash.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> EVM deploys bytecode in a single transaction. Stellar separates code upload from contract instantiation, allowing multiple contracts from the same WASM.
        </p>
        <CodeBlock>{`// Stellar: 2-step deployment
// Step 1: Upload WASM
const uploadTx = TransactionBuilder
    .addOperation(Operation.uploadContractWasm({ wasm: bytecode }))
    .build();
const wasmHash = await submitTx(uploadTx);

// Step 2: Create contract from WASM
const createTx = TransactionBuilder
    .addOperation(Operation.createCustomContract({
        address: deployerAddress,
        wasmHash,
    }))
    .build();
const contractId = await submitTx(createTx);

// EVM: 1-step deployment
// const contract = await MyContract.deploy(bytecode);
// — single transaction, bytecode + constructor`}</CodeBlock>
      </Section>

      {/* 3. Assets vs Tokens */}
      <Section id="assets-tokens" title="3. Assets vs Contract Tokens">
        <p className="mb-4 text-sm text-text-secondary">
          Stellar has <strong>two token models</strong>: classic <strong>assets</strong> issued by accounts (using built-in operations + trustlines) and <strong>contract tokens</strong> issued by WASM smart contracts (SEP-41). The term &quot;custom token&quot; is deprecated in favor of &quot;contract token&quot;.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> EVM only has ERC-20 tokens (contract-based, no trustlines). Stellar assets require trustlines; contract tokens don&apos;t.
        </p>
        <div className="mb-4">
          <StellarTokenFlow />
        </div>
        <CodeBlock>{`// Stellar: two token types
// 1. Classic Asset (issuer → trustline → holder)
//    Issued by a G-address, requires trustline
//    Transfer: Operation.payment({ asset, amount })

// 2. Contract Token (SEP-41)
//    Deployed as WASM contract, no trustline
//    Transfer: contract.call("transfer", from, to, amount)

// EVM: single token model
// ERC-20: contract.transfer(to, amount)
// — no trustlines, no issuer control`}</CodeBlock>
      </Section>

      {/* 4. SAC */}
      <Section id="sac" title="4. Stellar Asset Contract (SAC)">
        <p className="mb-4 text-sm text-text-secondary">
          Every classic Stellar asset automatically gets a <strong>built-in smart contract</strong> called the Stellar Asset Contract (SAC). The SAC implements the SEP-41 token interface, allowing assets to be used in Soroban smart contracts without deploying custom code.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> In EVM, every ERC-20 is a custom contract. On Stellar, every asset gets a contract interface for free.
        </p>
        <CodeBlock>{`// Stellar: SAC wraps every asset
// Classic asset: USD issued by GABC...
// SAC address: C... (derived from asset code + issuer)
//   → contract.call("transfer", from, to, amount)
//   → contract.call("balance", address)

// EVM: each token is custom
// USDC: 0xA0b... → custom ERC-20 contract
// USDT: 0xF94... → different ERC-20 contract
// — no built-in wrapper`}</CodeBlock>
      </Section>

      {/* 5. Ledger Entries */}
      <Section id="ledger-entries" title="5. Ledger Entries (Storage)">
        <p className="mb-4 text-sm text-text-secondary">
          Soroban contracts store data in <strong>ledger entries</strong> — key-value pairs in the Stellar ledger. This is similar to EVM storage slots, but with different cost semantics (rent-based, not gas-per-access).
        </p>
        <CodeBlock>{`// Stellar: ledger entries (key-value)
// Contract data stored as:
//   ContractData(contract_id, key) → value
// Keys are ScVal types (bytes, symbols, maps, etc.)

// Rust SDK:
env.storage().set(
    &DataKey::Escrow(escrow_id),
    &EscrowData { beneficiary, amount },
);

// EVM: storage slots
// mapping(bytes32 => Escrow) escrows;
// — 32-byte keys, 32-byte values
// — gas per access (SLOAD/SSTORE)`}</CodeBlock>
      </Section>

      {/* 6. Fees */}
      <Section id="fees" title="6. Fee Model">
        <p className="mb-4 text-sm text-text-secondary">
          Stellar uses a <strong>base fee</strong> per operation plus <strong>resource metering</strong> for smart contracts (CPU instructions, memory). Fees are predictable and affordable. EVM uses gas, which fluctuates with network congestion.
        </p>
        <CodeBlock>{`// Stellar: predictable fees
// Base fee: ~0.00001 XLM per operation
// Contract metering: CPU + memory + storage
//   → set in transaction as "resource fee"
//   → predictable, not auction-based

// EVM: volatile gas
// Gas price: varies with network congestion
// Simple transfer: 21,000 gas
// Complex contract: 100,000+ gas
//   → fee = gas_used * gas_price (volatile)`}</CodeBlock>
      </Section>

      {/* 7. Trustlines */}
      <Section id="trustlines" title="7. Trustlines">
        <p className="mb-4 text-sm text-text-secondary">
          Trustlines are a unique Stellar concept. To receive a classic asset, an account must first create a <strong>trustline</strong> to the asset issuer. This is a protocol-level declaration of trust — the issuer can control who holds their asset. Contract tokens (SEP-41) do not require trustlines.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> EVM has no equivalent. Anyone can receive any ERC-20 token. Stellar adds a layer of issuer control.
        </p>
        <CodeBlock>{`// Stellar: trustline required for assets
// Create trustline before receiving asset
Operation.changeTrust({
    asset: new Asset("USD", issuerPublicKey),
    limit: "1000",  // max amount willing to hold
});

// Now can receive USD from issuer
Operation.payment({
    destination: myAccount,
    asset: new Asset("USD", issuerPublicKey),
    amount: "100",
});

// EVM: no trustline needed
// Anyone can receive any ERC-20
// token.transfer(recipient, amount);
// — no pre-approval required`}</CodeBlock>
      </Section>
    </div>
  );
}

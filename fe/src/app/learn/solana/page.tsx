import { SolanaAccountModel } from "@/components/diagrams/SolanaAccountModel";
import { SolanaTokenFlow } from "@/components/diagrams/SolanaTokenFlow";
import { EvmSolanaComparison } from "@/components/diagrams/EvmSolanaComparison";

export const metadata = {
  title: "Solana for EVM Developers",
  description: "Onboarding guide for EVM developers learning Solana: account model, programs, SPL tokens, PDAs, rent, transactions, CPI.",
};

const comparisonTable = [
  { concept: "Smart Contract", evm: "Solidity contract on address", solana: "Program (BPF bytecode)" },
  { concept: "Storage", evm: "Contract storage slots", solana: "Accounts (data field)" },
  { concept: "Tokens", evm: "ERC-20 contract", solana: "SPL Token program + mints" },
  { concept: "Address derivation", evm: "hash(sender, nonce)", solana: "PDAs (deterministic)" },
  { concept: "Execution", evm: "Sequential", solana: "Parallel (Sealevel)" },
  { concept: "Fees", evm: "Gas (per opcode)", solana: "Rent (per byte storage)" },
  { concept: "Account model", evm: "Contract has state", solana: "Account has owner + data" },
  { concept: "Calling contracts", evm: "CALL opcode", solana: "Cross-Program Invocation (CPI)" },
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

function ComparisonRow({ concept, evm, solana }: { concept: string; evm: string; solana: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border py-3 last:border-0">
      <div className="text-sm font-medium text-text-primary">{concept}</div>
      <div className="text-sm text-text-secondary">{evm}</div>
      <div className="text-sm text-accent">{solana}</div>
    </div>
  );
}

export default function SolanaOnboardingPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text-primary">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          Solana for EVM Developers
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          A guide for developers who know Ethereum/Solidity and want to understand Solana&apos;s architecture.
        </p>
      </div>

      {/* EVM vs Solana Comparison Diagram */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">EVM vs Solana at a Glance</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface-1 p-4 shadow-1">
          <EvmSolanaComparison />
        </div>
      </section>

      {/* Comparison Table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Quick Reference</h2>
        <div className="rounded-lg border border-border bg-surface-1 p-5 shadow-1">
          <div className="grid grid-cols-3 gap-4 border-b border-border-strong pb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Concept</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">EVM</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Solana</div>
          </div>
          {comparisonTable.map((row) => (
            <ComparisonRow key={row.concept} {...row} />
          ))}
        </div>
      </section>

      {/* 1. Account Model */}
      <Section id="account-model" title="1. Account Model">
        <p className="mb-4 text-sm text-text-secondary">
          In EVM, a smart contract has bytecode <strong>and</strong> state (storage slots). On Solana, <strong>everything is an account</strong>. An account is a record with <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">lamports</code> (SOL balance), <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">data</code> (arbitrary bytes), <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">owner</code> (program that controls it), and <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">executable</code> flag.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> Data lives in accounts, not in contracts. Programs are stateless — they process instructions and read/write data from accounts passed to them.
        </p>
        <div className="mb-4">
          <SolanaAccountModel />
        </div>
        <CodeBlock>{`// Solana Account structure
pub struct Account {
    pub lamports: u64,       // SOL balance
    pub data: Vec<u8>,       // arbitrary data (state)
    pub owner: Pubkey,       // program that owns this account
    pub executable: bool,    // is this a program?
    pub rent_epoch: Epoch,   // rent tracking
}

// EVM equivalent: contract storage slots
// mapping(address => uint256) balances;
// — state is bound to the contract address`}</CodeBlock>
      </Section>

      {/* 2. Programs */}
      <Section id="programs" title="2. Programs (Smart Contracts)">
        <p className="mb-4 text-sm text-text-secondary">
          Solana programs are compiled to <strong>BPF bytecode</strong> (not EVM bytecode). They are <strong>stateless</strong> — all state is stored in separate data accounts. A program reads and writes to accounts that are explicitly passed to it in each instruction.
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> In EVM, <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">msg.sender</code> and contract state are implicit. On Solana, you must explicitly pass all accounts the program will touch.
        </p>
        <CodeBlock>{`// Solana: explicit account passing
pub fn create_escrow(
    ctx: Context<CreateEscrow>,  // accounts passed explicitly
    beneficiary: Pubkey,
    amount: u64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    escrow.beneficiary = beneficiary;
    escrow.amount = amount;
    Ok(())
}

// EVM: implicit state access
// function createEscrow(address beneficiary, uint256 amount) {
//     escrows[nextId] = Escrow(msg.sender, beneficiary, amount);
//     — state is in contract storage`}</CodeBlock>
      </Section>

      {/* 3. SPL Tokens */}
      <Section id="spl-tokens" title="3. SPL Tokens">
        <p className="mb-4 text-sm text-text-secondary">
          On EVM, tokens are ERC-20 contracts with a <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">balances</code> mapping. On Solana, the <strong>SPL Token Program</strong> is a single program that manages all tokens. Each token has a <strong>Mint Account</strong> (metadata) and users hold balances in <strong>Token Accounts</strong> (or Associated Token Accounts — ATAs).
        </p>
        <p className="mb-4 text-sm text-text-secondary">
          <strong>Key difference:</strong> Token balances are stored in accounts owned by the Token Program, not in a per-token contract.
        </p>
        <div className="mb-4">
          <SolanaTokenFlow />
        </div>
        <CodeBlock>{`// Solana: SPL Token transfer
// 1. Find Associated Token Account (ATA)
const [buyerATA] = findAssociatedTokenPda({
    owner: buyer,
    mint: USDC_MINT,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
});

// 2. Transfer via Token Program instruction
getTransferCheckedInstruction({
    source: buyerATA,
    mint: USDC_MINT,
    destination: merchantATA,
    authority: buyer,
    amount: tokenAmount,
    decimals: 6,
});

// EVM: ERC-20 transfer
// token.transfer(to, amount);
// — single call, state in contract`}</CodeBlock>
      </Section>

      {/* 4. PDAs */}
      <Section id="pdas" title="4. Program Derived Addresses (PDAs)">
        <p className="mb-4 text-sm text-text-secondary">
          PDAs are addresses derived deterministically from a program ID and optional seeds. They have <strong>no private key</strong> — only the owning program can sign for them. This is similar to <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">CREATE2</code> in EVM, but more fundamental to Solana&apos;s architecture.
        </p>
        <CodeBlock>{`// Solana: PDA derivation
const [escrowPDA, bump] = PublicKey.findProgramAddressSync(
    [
        Buffer.from("escrow"),
        depositor.toBuffer(),
        beneficiary.toBuffer(),
    ],
    ESCROW_PROGRAM_ID,
);
// escrowPDA has no private key — only program can sign

// EVM: CREATE2
// address = keccak256(0xff, sender, salt, bytecodeHash)
// — deterministic, but still has no special signer`}</CodeBlock>
      </Section>

      {/* 5. Rent */}
      <Section id="rent" title="5. Rent & Storage Costs">
        <p className="mb-4 text-sm text-text-secondary">
          On EVM, you pay gas for every storage operation (<code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">SSTORE</code> = 20,000 gas). On Solana, you pay <strong>rent</strong> — a per-byte cost for storing data in accounts. Accounts must maintain a minimum balance (rent exemption) to not be garbage-collected.
        </p>
        <CodeBlock>{`// Solana: rent exemption
const rentExemption = await connection.getMinimumBalanceForRentExemption(
    EscrowAccount.byteLength,  // e.g. 200 bytes
);
// ~0.002 SOL per MB (rent-exempt minimum)

// EVM: gas per storage
// SSTORE (new slot): 20,000 gas
// SSTORE (update): 5,000 gas
// SLOAD: 800 gas
// — no ongoing cost, but high per-operation`}</CodeBlock>
      </Section>

      {/* 6. Transactions */}
      <Section id="transactions" title="6. Transactions & Parallel Execution">
        <p className="mb-4 text-sm text-text-secondary">
          Solana transactions can contain <strong>multiple instructions</strong>, and the runtime (Sealevel) executes non-overlapping transactions in <strong>parallel</strong>. EVM processes transactions sequentially — one at a time.
        </p>
        <CodeBlock>{`// Solana: multiple instructions in one transaction
const tx = new Transaction().add(
    SystemProgram.transfer({ from, to, lamports }),
    TokenProgram.transfer({ source, dest, amount }),
    EscrowProgram.create({ ... }),
);
// All execute atomically, in order within the tx

// EVM: one call per transaction
// token.approve(spender, amount);  // tx 1
// escrow.deposit(amount);          // tx 2
// — sequential, separate transactions`}</CodeBlock>
      </Section>

      {/* 7. CPI */}
      <Section id="cpi" title="7. Cross-Program Invocation (CPI)">
        <p className="mb-4 text-sm text-text-secondary">
          CPI is Solana&apos;s equivalent of EVM&apos;s <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">CALL</code>. A program can call another program, but must explicitly pass all required accounts. The called program verifies signatures and permissions.
        </p>
        <CodeBlock>{`// Solana: CPI
pub fn release(ctx: Context<Release>) -> Result<()> {
    // CPI call to Token Program
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token.to_account_info(),
                to: ctx.accounts.beneficiary_token.to_account_info(),
                authority: ctx.accounts.escrow_pda.to_account_info(),
            },
        ),
        amount,
    )?;
    Ok(())
}

// EVM: CALL
// (bool ok, ) = token.transfer(beneficiary, amount);
// require(ok);
// — implicit, no account passing needed`}</CodeBlock>
      </Section>
    </div>
  );
}

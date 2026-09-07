import { Container } from "@/components/Container";
import { CreateEscrowFlow } from "@/components/diagrams/CreateEscrowFlow";
import { ReleaseEscrowFlow } from "@/components/diagrams/ReleaseEscrowFlow";
import { RefundEscrowFlow } from "@/components/diagrams/RefundEscrowFlow";
import { ComponentArchitecture } from "@/components/diagrams/ComponentArchitecture";
import { ComparisonTable, LocalToTestnetBlock } from "./comparison-table";
import { RepoMap } from "./repo-map";

export default function HowItWorks() {
  return (
    <Container>
      <div className="flex flex-col gap-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            How it works
          </h1>
          <div className="mt-2 h-0.5 w-12 rounded-full" style={{ background: "var(--accent)" }} />
        </div>

        {/* Mock notice */}
        <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
          <div>
            <strong className="font-semibold">Mock mode:</strong> Currently running on mock — no real
            blockchain transactions are sent. All escrows and events are
            in-memory.
          </div>
        </div>

        {/* Roles */}
        <section>
          <h2 className="mb-5 text-lg font-semibold text-text-primary">Roles</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface-1 p-5 shadow-1 transition-all duration-200 hover:border-border-strong hover:shadow-2">
              <div className="mb-3 h-0.5 w-8 rounded-full" style={{ background: "var(--info)" }} />
              <h3 className="mb-2 text-sm font-semibold text-info">
                Depositor
              </h3>
              <p className="text-sm text-text-secondary">
                Creates the escrow by depositing tokens. Can request a refund
                if the escrow is still in <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">created</code> status.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-5 shadow-1 transition-all duration-200 hover:border-border-strong hover:shadow-2">
              <div className="mb-3 h-0.5 w-8 rounded-full" style={{ background: "var(--success)" }} />
              <h3 className="mb-2 text-sm font-semibold text-success">
                Beneficiary
              </h3>
              <p className="text-sm text-text-secondary">
                The intended recipient of the escrowed funds. Can release the
                escrow to themselves.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-5 shadow-1 transition-all duration-200 hover:border-border-strong hover:shadow-2">
              <div className="mb-3 h-0.5 w-8 rounded-full" style={{ background: "var(--accent)" }} />
              <h3 className="mb-2 text-sm font-semibold text-accent">
                Resolver
              </h3>
              <p className="text-sm text-text-secondary">
                An optional third party who can also release the escrow to the
                beneficiary. Set at creation time.
              </p>
            </div>
          </div>
        </section>

        {/* Flow */}
        <section>
          <h2 className="mb-5 text-lg font-semibold text-text-primary">Escrow Flow</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-1 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-xs font-semibold text-accent">1</span>
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Create (Deposit)</strong> — The depositor fills the
                form (beneficiary, amount, optional resolver) and submits. Tokens
                are locked in the escrow.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-1 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-success/10 text-xs font-semibold text-success">2</span>
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Release</strong> — The beneficiary or resolver calls
                release. Tokens are transferred to the beneficiary. Status
                changes to <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">released</code>.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-1 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-danger/10 text-xs font-semibold text-danger">3</span>
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Refund</strong> — If the escrow is still{" "}
                <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">created</code>, the depositor can call refund. Tokens are
                returned. Status changes to <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs text-text-primary">refunded</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Sequence Diagrams */}
        <section>
          <h2 className="mb-5 text-lg font-semibold text-text-primary">Sequence Diagrams</h2>
          <div className="flex flex-col gap-6">
            <CreateEscrowFlow />
            <ReleaseEscrowFlow />
            <RefundEscrowFlow />
          </div>
        </section>

        {/* Component Diagram */}
        <section>
          <h2 className="mb-5 text-lg font-semibold text-text-primary">Architecture</h2>
          <ComponentArchitecture />
        </section>

        {/* Status transitions */}
        <section>
          <h2 className="mb-5 text-lg font-semibold text-text-primary">Status Transitions</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-4">
              <span className="rounded-md bg-info/10 px-2.5 py-1 font-mono text-xs font-medium text-info border border-info/20">
                created
              </span>
              <span className="text-text-tertiary">→</span>
              <span className="rounded-md bg-success/10 px-2.5 py-1 font-mono text-xs font-medium text-success border border-success/20">
                released
              </span>
              <span className="text-sm text-text-tertiary">
                (beneficiary or resolver)
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-4">
              <span className="rounded-md bg-info/10 px-2.5 py-1 font-mono text-xs font-medium text-info border border-info/20">
                created
              </span>
              <span className="text-text-tertiary">→</span>
              <span className="rounded-md bg-text-tertiary/10 px-2.5 py-1 font-mono text-xs font-medium text-text-secondary border border-border">
                refunded
              </span>
              <span className="text-sm text-text-tertiary">(depositor only)</span>
            </div>
          </div>
        </section>

        {/* Solana vs Stellar */}
        <section>
          <ComparisonTable />
        </section>

        {/* Local → Testnet */}
        <section>
          <LocalToTestnetBlock />
        </section>

        {/* Repo Structure */}
        <section>
          <RepoMap />
        </section>
      </div>
    </Container>
  );
}

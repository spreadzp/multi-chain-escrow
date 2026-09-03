const SOLANA_RPC = "http://localhost:8899";
const STELLAR_RPC = "http://localhost:8000";
const TIMEOUT_MS = 5000;

interface CheckResult {
  name: string;
  endpoint: string;
  healthy: boolean;
  responseTime: number;
  detail: string;
}

function parseArgs(argv: string[]): { solana: boolean; stellar: boolean } {
  const args = argv.slice(2);
  if (args.includes("--solana")) return { solana: true, stellar: false };
  if (args.includes("--stellar")) return { solana: false, stellar: true };
  return { solana: true, stellar: true }; // --all default
}

async function checkSolana(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    if (resp.ok) {
      const data = await resp.json();
      if (data.result?.status === "ok") {
        return { name: "Solana", endpoint: SOLANA_RPC, healthy: true, responseTime: elapsed, detail: "ok" };
      }
      return { name: "Solana", endpoint: SOLANA_RPC, healthy: false, responseTime: elapsed, detail: `unexpected response: ${JSON.stringify(data)}` };
    }
    return { name: "Solana", endpoint: SOLANA_RPC, healthy: false, responseTime: elapsed, detail: `HTTP ${resp.status}` };
  } catch (err) {
    return { name: "Solana", endpoint: SOLANA_RPC, healthy: false, responseTime: Date.now() - start, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function checkStellar(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(`${STELLAR_RPC}/health`, { signal: controller.signal });
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    if (resp.ok) {
      return { name: "Stellar", endpoint: STELLAR_RPC, healthy: true, responseTime: elapsed, detail: "healthy" };
    }
    return { name: "Stellar", endpoint: STELLAR_RPC, healthy: false, responseTime: elapsed, detail: `HTTP ${resp.status}` };
  } catch (err) {
    return { name: "Stellar", endpoint: STELLAR_RPC, healthy: false, responseTime: Date.now() - start, detail: err instanceof Error ? err.message : String(err) };
  }
}

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function printResults(results: CheckResult[]): void {
  console.log("\nNetwork Health Check");
  console.log("─".repeat(70));
  for (const r of results) {
    const status = r.healthy ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const detail = r.healthy ? `${DIM}${r.detail}${RESET}` : `${RED}${r.detail}${RESET}`;
    console.log(`  ${status}  ${r.name.padEnd(10)} ${r.endpoint.padEnd(30)} ${r.responseTime}ms  ${detail}`);
  }
  console.log("─".repeat(70));
}

async function main(): Promise<void> {
  const { solana, stellar } = parseArgs(process.argv);
  const checks: Promise<CheckResult>[] = [];
  if (solana) checks.push(checkSolana());
  if (stellar) checks.push(checkStellar());

  const results = await Promise.all(checks);
  printResults(results);

  const allHealthy = results.every((r) => r.healthy);
  process.exit(allHealthy ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

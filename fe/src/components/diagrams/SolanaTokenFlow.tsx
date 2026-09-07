"use client";

import { type Node, type Edge } from "@xyflow/react";
import { ReactFlowDiagram } from "./ReactFlowDiagram";

const nodeStyle = (bg: string, border: string) => ({
  background: bg,
  color: "var(--text-primary)",
  border: `1px solid ${border}`,
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  width: 160,
});

const mintStyle = nodeStyle("var(--accent-muted)", "var(--accent)");
const tokenStyle = nodeStyle("var(--success-muted)", "var(--success)");
const programStyle = nodeStyle("rgba(37, 99, 235, 0.08)", "var(--info)");
const userStyle = nodeStyle("var(--surface-2)", "var(--border)");

const nodes: Node[] = [
  { id: "token-program", position: { x: 300, y: 0 }, data: { label: "SPL Token Program" }, style: programStyle },
  { id: "mint", position: { x: 100, y: 80 }, data: { label: "Mint Account\n(USDC)" }, style: mintStyle },
  { id: "ata-a", position: { x: 0, y: 200 }, data: { label: "ATA (Alice)" }, style: tokenStyle },
  { id: "ata-b", position: { x: 200, y: 200 }, data: { label: "ATA (Bob)" }, style: tokenStyle },
  { id: "alice", position: { x: 0, y: 320 }, data: { label: "Alice (wallet)" }, style: userStyle },
  { id: "bob", position: { x: 200, y: 320 }, data: { label: "Bob (wallet)" }, style: userStyle },
];

const edgeStyle = { stroke: "var(--accent)", strokeWidth: 2 };
const dashedStyle = { stroke: "var(--text-tertiary)", strokeWidth: 1, strokeDasharray: "4 3" };
const transferStyle = { stroke: "var(--success)", strokeWidth: 2 };

const edges: Edge[] = [
  { id: "e1", source: "token-program", target: "mint", style: dashedStyle, label: "manages" },
  { id: "e2", source: "token-program", target: "ata-a", style: dashedStyle, label: "owns" },
  { id: "e3", source: "token-program", target: "ata-b", style: dashedStyle, label: "owns" },
  { id: "e4", source: "mint", target: "ata-a", style: dashedStyle, label: "mint" },
  { id: "e5", source: "mint", target: "ata-b", style: dashedStyle, label: "mint" },
  { id: "e6", source: "alice", target: "ata-a", style: dashedStyle, label: "holds" },
  { id: "e7", source: "bob", target: "ata-b", style: dashedStyle, label: "holds" },
  { id: "e8", source: "ata-a", target: "ata-b", animated: true, style: transferStyle, label: "transfer(amount)" },
];

export function SolanaTokenFlow() {
  return (
    <div data-testid="diagram-solana-token-flow">
      <ReactFlowDiagram nodes={nodes} edges={edges} height={420} showMiniMap={false} />
    </div>
  );
}

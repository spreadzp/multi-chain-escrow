"use client";

import { type Node, type Edge } from "@xyflow/react";
import { ReactFlowDiagram } from "./ReactFlowDiagram";

const accountStyle = {
  background: "var(--accent-muted)",
  color: "var(--text-primary)",
  border: "1px solid var(--accent)",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  width: 140,
};

const fieldStyle = {
  background: "var(--surface-1)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 500,
  padding: "6px 10px",
  width: 180,
};

const programStyle = {
  ...accountStyle,
  background: "var(--success-muted)",
  border: "1px solid var(--success)",
};

const nodes: Node[] = [
  { id: "account", position: { x: 200, y: 0 }, data: { label: "Account" }, style: accountStyle },
  { id: "lamports", position: { x: 0, y: 80 }, data: { label: "lamports: u64" }, style: fieldStyle },
  { id: "data", position: { x: 200, y: 80 }, data: { label: "data: Vec<u8>" }, style: fieldStyle },
  { id: "owner", position: { x: 400, y: 80 }, data: { label: "owner: Pubkey" }, style: fieldStyle },
  { id: "executable", position: { x: 100, y: 160 }, data: { label: "executable: bool" }, style: fieldStyle },
  { id: "rent", position: { x: 300, y: 160 }, data: { label: "rent_epoch: Epoch" }, style: fieldStyle },

  { id: "program", position: { x: 400, y: 240 }, data: { label: "Program (owner)" }, style: programStyle },
  { id: "data-account", position: { x: 100, y: 240 }, data: { label: "Data Account" }, style: { ...fieldStyle, width: 140, fontWeight: 600, background: "var(--surface-2)" } },
];

const edgeStyle = { stroke: "var(--accent)", strokeWidth: 1.5 };
const dashedStyle = { stroke: "var(--text-tertiary)", strokeWidth: 1, strokeDasharray: "4 3" };

const edges: Edge[] = [
  { id: "e1", source: "account", target: "lamports", style: edgeStyle },
  { id: "e2", source: "account", target: "data", style: edgeStyle },
  { id: "e3", source: "account", target: "owner", style: edgeStyle },
  { id: "e4", source: "account", target: "executable", style: edgeStyle },
  { id: "e5", source: "account", target: "rent", style: edgeStyle },
  { id: "e6", source: "owner", target: "program", style: dashedStyle, label: "owns" },
  { id: "e7", source: "data-account", target: "account", style: dashedStyle, label: "stored in" },
  { id: "e8", source: "program", target: "data-account", style: dashedStyle, label: "reads/writes" },
];

export function SolanaAccountModel() {
  return (
    <div data-testid="diagram-solana-account-model">
      <ReactFlowDiagram nodes={nodes} edges={edges} height={340} showMiniMap={false} />
    </div>
  );
}

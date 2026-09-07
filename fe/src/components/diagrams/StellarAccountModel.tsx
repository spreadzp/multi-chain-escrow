"use client";

import { type Node, type Edge } from "@xyflow/react";
import { ReactFlowDiagram } from "./ReactFlowDiagram";

const gStyle = {
  background: "rgba(37, 99, 235, 0.08)",
  color: "var(--text-primary)",
  border: "1px solid var(--info)",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  width: 160,
};

const cStyle = {
  ...gStyle,
  background: "var(--accent-muted)",
  border: "1px solid var(--accent)",
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

const nodes: Node[] = [
  { id: "g-addr", position: { x: 100, y: 0 }, data: { label: "G-address (Account)" }, style: gStyle },
  { id: "c-addr", position: { x: 400, y: 0 }, data: { label: "C-address (Contract)" }, style: cStyle },

  { id: "g-balance", position: { x: 0, y: 80 }, data: { label: "balances + trustlines" }, style: fieldStyle },
  { id: "g-signer", position: { x: 200, y: 80 }, data: { label: "signs transactions" }, style: fieldStyle },

  { id: "c-wasm", position: { x: 300, y: 80 }, data: { label: "WASM bytecode" }, style: fieldStyle },
  { id: "c-ledger", position: { x: 500, y: 80 }, data: { label: "ledger entries (state)" }, style: fieldStyle },

  { id: "sac", position: { x: 400, y: 180 }, data: { label: "SAC (built-in)" }, style: { ...cStyle, background: "var(--success-muted)", border: "1px solid var(--success)" } },
];

const edgeStyle = { stroke: "var(--info)", strokeWidth: 1.5 };
const dashedStyle = { stroke: "var(--text-tertiary)", strokeWidth: 1, strokeDasharray: "4 3" };

const edges: Edge[] = [
  { id: "e1", source: "g-addr", target: "g-balance", style: edgeStyle },
  { id: "e2", source: "g-addr", target: "g-signer", style: edgeStyle },
  { id: "e3", source: "c-addr", target: "c-wasm", style: edgeStyle },
  { id: "e4", source: "c-addr", target: "c-ledger", style: edgeStyle },
  { id: "e5", source: "c-addr", target: "sac", style: dashedStyle, label: "auto-wrapped" },
  { id: "e6", source: "g-addr", target: "sac", style: dashedStyle, label: "trustline" },
];

export function StellarAccountModel() {
  return (
    <div data-testid="diagram-stellar-account-model">
      <ReactFlowDiagram nodes={nodes} edges={edges} height={300} showMiniMap={false} />
    </div>
  );
}

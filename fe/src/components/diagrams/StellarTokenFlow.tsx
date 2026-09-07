"use client";

import { type Node, type Edge } from "@xyflow/react";
import { ReactFlowDiagram } from "./ReactFlowDiagram";

const issuerStyle = {
  background: "rgba(37, 99, 235, 0.08)",
  color: "var(--text-primary)",
  border: "1px solid var(--info)",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  width: 140,
};

const holderStyle = {
  ...issuerStyle,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
};

const contractStyle = {
  ...issuerStyle,
  background: "var(--accent-muted)",
  border: "1px solid var(--accent)",
};

const sacStyle = {
  ...issuerStyle,
  background: "var(--success-muted)",
  border: "1px solid var(--success)",
};

const nodes: Node[] = [
  // Classic asset flow (left)
  { id: "issuer", position: { x: 0, y: 0 }, data: { label: "Issuer (G-addr)" }, style: issuerStyle },
  { id: "trustline", position: { x: 0, y: 100 }, data: { label: "Trustline" }, style: { ...holderStyle, width: 120, fontSize: "11px" } },
  { id: "holder", position: { x: 0, y: 200 }, data: { label: "Holder (G-addr)" }, style: holderStyle },

  // SAC bridge (center)
  { id: "sac", position: { x: 250, y: 100 }, data: { label: "SAC\n(built-in)" }, style: sacStyle },

  // Contract token flow (right)
  { id: "contract", position: { x: 500, y: 0 }, data: { label: "Contract Token\n(SEP-41)" }, style: contractStyle },
  { id: "ledger", position: { x: 500, y: 100 }, data: { label: "Ledger Entry\n(balance)" }, style: { ...holderStyle, width: 140, fontSize: "11px" } },
  { id: "c-holder", position: { x: 500, y: 200 }, data: { label: "Holder (C-addr)" }, style: holderStyle },
];

const assetEdge = { stroke: "var(--info)", strokeWidth: 2 };
const contractEdge = { stroke: "var(--accent)", strokeWidth: 2 };
const dashedStyle = { stroke: "var(--text-tertiary)", strokeWidth: 1, strokeDasharray: "4 3" };

const edges: Edge[] = [
  { id: "e1", source: "issuer", target: "trustline", animated: true, style: assetEdge, label: "issue" },
  { id: "e2", source: "trustline", target: "holder", animated: true, style: assetEdge, label: "payment" },
  { id: "e3", source: "issuer", target: "sac", style: dashedStyle, label: "wraps" },
  { id: "e4", source: "sac", target: "holder", style: dashedStyle, label: "SAC transfer" },
  { id: "e5", source: "contract", target: "ledger", animated: true, style: contractEdge, label: "mint" },
  { id: "e6", source: "ledger", target: "c-holder", animated: true, style: contractEdge, label: "transfer" },
  { id: "e7", source: "sac", target: "contract", style: dashedStyle, label: "interop" },
];

export function StellarTokenFlow() {
  return (
    <div data-testid="diagram-stellar-token-flow">
      <ReactFlowDiagram nodes={nodes} edges={edges} height={320} showMiniMap={false} />
    </div>
  );
}

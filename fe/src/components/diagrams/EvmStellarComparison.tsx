"use client";

import { type Node, type Edge } from "@xyflow/react";
import { ReactFlowDiagram } from "./ReactFlowDiagram";

const evmStyle = {
  background: "rgba(99, 102, 241, 0.08)",
  color: "var(--text-primary)",
  border: "1px solid var(--accent)",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  width: 160,
};

const stellarStyle = {
  background: "rgba(37, 99, 235, 0.08)",
  color: "var(--text-primary)",
  border: "1px solid var(--info)",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  width: 160,
};

const labelStyle = {
  background: "var(--surface-2)",
  color: "var(--text-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "10px",
  fontWeight: 500,
  padding: "4px 8px",
  width: 120,
};

const nodes: Node[] = [
  // EVM cluster
  { id: "evm-title", position: { x: 50, y: 0 }, data: { label: "EVM" }, style: { ...evmStyle, width: 80 } },
  { id: "evm-contract", position: { x: 0, y: 70 }, data: { label: "Solidity (EVM)" }, style: evmStyle },
  { id: "evm-storage", position: { x: 0, y: 150 }, data: { label: "Storage Slots" }, style: evmStyle },
  { id: "evm-erc20", position: { x: 0, y: 230 }, data: { label: "ERC-20 Token" }, style: evmStyle },
  { id: "evm-accounts", position: { x: 0, y: 310 }, data: { label: "EOA + Contract" }, style: evmStyle },
  { id: "evm-gas", position: { x: 0, y: 390 }, data: { label: "Gas" }, style: evmStyle },

  // Stellar cluster
  { id: "st-title", position: { x: 450, y: 0 }, data: { label: "Stellar" }, style: { ...stellarStyle, width: 80 } },
  { id: "st-soroban", position: { x: 400, y: 70 }, data: { label: "Soroban (WASM)" }, style: stellarStyle },
  { id: "st-ledger", position: { x: 400, y: 150 }, data: { label: "Ledger Entries" }, style: stellarStyle },
  { id: "st-asset", position: { x: 400, y: 230 }, data: { label: "Asset + SAC" }, style: stellarStyle },
  { id: "st-addr", position: { x: 400, y: 310 }, data: { label: "G-addr + C-addr" }, style: stellarStyle },
  { id: "st-fee", position: { x: 400, y: 390 }, data: { label: "Base Fee + Meter" }, style: stellarStyle },

  // Comparison labels
  { id: "l1", position: { x: 220, y: 70 }, data: { label: "≈" }, style: labelStyle },
  { id: "l2", position: { x: 220, y: 150 }, data: { label: "≈" }, style: labelStyle },
  { id: "l3", position: { x: 220, y: 230 }, data: { label: "≈" }, style: labelStyle },
  { id: "l4", position: { x: 220, y: 310 }, data: { label: "≈" }, style: labelStyle },
  { id: "l5", position: { x: 220, y: 390 }, data: { label: "≈" }, style: labelStyle },
];

const compareEdge = { stroke: "var(--text-tertiary)", strokeWidth: 1, strokeDasharray: "5 3" };

const edges: Edge[] = [
  { id: "c1", source: "evm-contract", target: "st-soroban", style: compareEdge },
  { id: "c2", source: "evm-storage", target: "st-ledger", style: compareEdge },
  { id: "c3", source: "evm-erc20", target: "st-asset", style: compareEdge },
  { id: "c4", source: "evm-accounts", target: "st-addr", style: compareEdge },
  { id: "c5", source: "evm-gas", target: "st-fee", style: compareEdge },
];

export function EvmStellarComparison() {
  return (
    <div data-testid="diagram-evm-stellar-comparison">
      <ReactFlowDiagram nodes={nodes} edges={edges} height={460} />
    </div>
  );
}

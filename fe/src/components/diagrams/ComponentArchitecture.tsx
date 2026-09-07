"use client";

import { type Node, type Edge } from "@xyflow/react";
import { ReactFlowDiagram } from "./ReactFlowDiagram";

const layerStyle = (color: string, bg: string) => ({
  background: bg,
  color: "var(--text-primary)",
  border: `1px solid ${color}`,
  borderRadius: "8px",
  fontSize: "11px",
  fontWeight: 600,
  padding: "6px 10px",
  width: 150,
});

const uiStyle = layerStyle("var(--accent)", "var(--accent-muted)");
const stateStyle = layerStyle("var(--info)", "rgba(37, 99, 235, 0.08)");
const adapterStyle = layerStyle("var(--warning)", "var(--warning-muted)");
const walletStyle = layerStyle("var(--success)", "var(--success-muted)");
const chainStyle = layerStyle("var(--text-tertiary)", "var(--surface-2)");

const nodes: Node[] = [
  // UI Layer
  { id: "page", position: { x: 50, y: 0 }, data: { label: "app/page.tsx" }, style: uiStyle },
  { id: "form", position: { x: 250, y: 0 }, data: { label: "CreateEscrowForm" }, style: uiStyle },
  { id: "card", position: { x: 450, y: 0 }, data: { label: "EscrowCard" }, style: uiStyle },
  { id: "list", position: { x: 650, y: 0 }, data: { label: "EscrowList" }, style: uiStyle },

  // State Layer
  { id: "es", position: { x: 150, y: 100 }, data: { label: "escrow-store" }, style: stateStyle },
  { id: "ws", position: { x: 350, y: 100 }, data: { label: "wallet-store" }, style: stateStyle },
  { id: "sync", position: { x: 550, y: 100 }, data: { label: "sync/events" }, style: stateStyle },

  // Adapter Layer
  { id: "iface", position: { x: 50, y: 200 }, data: { label: "EscrowAdapter" }, style: adapterStyle },
  { id: "mock", position: { x: 250, y: 200 }, data: { label: "MockAdapter" }, style: adapterStyle },
  { id: "sol", position: { x: 450, y: 200 }, data: { label: "SolanaAdapter" }, style: adapterStyle },
  { id: "stellar", position: { x: 650, y: 200 }, data: { label: "StellarAdapter" }, style: adapterStyle },

  // Wallet Layer
  { id: "phantom", position: { x: 350, y: 300 }, data: { label: "PhantomAdapter" }, style: walletStyle },
  { id: "freighter", position: { x: 550, y: 300 }, data: { label: "FreighterAdapter" }, style: walletStyle },
  { id: "mockw", position: { x: 150, y: 300 }, data: { label: "MockWallet" }, style: walletStyle },

  // Blockchain Layer
  { id: "solNode", position: { x: 350, y: 400 }, data: { label: "Solana Local/Devnet" }, style: chainStyle },
  { id: "stellarNode", position: { x: 550, y: 400 }, data: { label: "Stellar Local/Testnet" }, style: chainStyle },
];

const edgeStyle = { stroke: "var(--text-tertiary)", strokeWidth: 1.5 };
const animatedEdgeStyle = { stroke: "var(--accent)", strokeWidth: 2 };

const edges: Edge[] = [
  // UI → State
  { id: "e1", source: "page", target: "form", style: edgeStyle },
  { id: "e2", source: "page", target: "list", style: edgeStyle },
  { id: "e3", source: "form", target: "es", style: edgeStyle },
  { id: "e4", source: "list", target: "es", style: edgeStyle },
  { id: "e5", source: "card", target: "es", style: edgeStyle },

  // State → Adapters
  { id: "e6", source: "es", target: "iface", style: edgeStyle },
  { id: "e7", source: "iface", target: "mock", style: edgeStyle },
  { id: "e8", source: "iface", target: "sol", style: edgeStyle },
  { id: "e9", source: "iface", target: "stellar", style: edgeStyle },

  // Adapters → Wallets
  { id: "e10", source: "sol", target: "phantom", animated: true, style: animatedEdgeStyle },
  { id: "e11", source: "stellar", target: "freighter", animated: true, style: animatedEdgeStyle },
  { id: "e12", source: "mock", target: "mockw", style: edgeStyle },

  // Wallets → Chain
  { id: "e13", source: "phantom", target: "solNode", animated: true, style: animatedEdgeStyle },
  { id: "e14", source: "freighter", target: "stellarNode", animated: true, style: animatedEdgeStyle },
];

export function ComponentArchitecture() {
  return (
    <div data-testid="diagram-component-architecture">
      <h3 className="mb-2 text-sm font-semibold text-text-secondary">Component Architecture</h3>
      <div className="overflow-hidden rounded-lg border border-border bg-surface-1 p-4 shadow-1">
        <ReactFlowDiagram nodes={nodes} edges={edges} height={480} />
      </div>
    </div>
  );
}

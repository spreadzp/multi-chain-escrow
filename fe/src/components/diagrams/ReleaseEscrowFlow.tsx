"use client";

import { type Node, type Edge, Position } from "@xyflow/react";
import { ReactFlowDiagram } from "./ReactFlowDiagram";

const actorStyle = {
  background: "var(--success-muted)",
  color: "var(--text-primary)",
  border: "1px solid var(--success)",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  width: 160,
};

const stepStyle = {
  background: "var(--surface-1)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 500,
  padding: "8px 12px",
  width: 180,
};

const nodes: Node[] = [
  { id: "user", position: { x: 50, y: 0 }, data: { label: "User (UI)" }, style: actorStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "adapter", position: { x: 320, y: 0 }, data: { label: "Adapter" }, style: actorStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "wallet", position: { x: 590, y: 0 }, data: { label: "Wallet" }, style: actorStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "contract", position: { x: 320, y: 120 }, data: { label: "Contract" }, style: actorStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "token", position: { x: 590, y: 120 }, data: { label: "Token" }, style: actorStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "store", position: { x: 320, y: 240 }, data: { label: "Store" }, style: actorStyle, sourcePosition: Position.Top, targetPosition: Position.Top },

  { id: "s1", position: { x: 50, y: 60 }, data: { label: "releaseEscrow(escrowId)" }, style: stepStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "s2", position: { x: 320, y: 60 }, data: { label: "requestSignature(tx)" }, style: stepStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "s3", position: { x: 590, y: 60 }, data: { label: "signedTx" }, style: stepStyle, sourcePosition: Position.Left, targetPosition: Position.Right },
  { id: "s4", position: { x: 320, y: 180 }, data: { label: "transfer(escrow, beneficiary, amount)" }, style: stepStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: "s5", position: { x: 590, y: 180 }, data: { label: "ok" }, style: stepStyle, sourcePosition: Position.Left, targetPosition: Position.Right },
  { id: "s6", position: { x: 50, y: 240 }, data: { label: "upsertEscrow(result)" }, style: stepStyle, sourcePosition: Position.Right, targetPosition: Position.Left },
];

const edgeStyle = { stroke: "var(--success)", strokeWidth: 2 };
const dashedEdgeStyle = { stroke: "var(--text-tertiary)", strokeWidth: 1.5, strokeDasharray: "5 3" };

const edges: Edge[] = [
  { id: "e1", source: "user", target: "s1", animated: true, style: edgeStyle, label: "1" },
  { id: "e2", source: "s1", target: "adapter", animated: true, style: edgeStyle },
  { id: "e3", source: "adapter", target: "s2", animated: true, style: edgeStyle, label: "2" },
  { id: "e4", source: "s2", target: "wallet", animated: true, style: edgeStyle },
  { id: "e5", source: "wallet", target: "s3", style: dashedEdgeStyle, label: "3" },
  { id: "e6", source: "s3", target: "adapter", style: dashedEdgeStyle },
  { id: "e7", source: "adapter", target: "contract", animated: true, style: edgeStyle, label: "4" },
  { id: "e8", source: "contract", target: "s4", animated: true, style: edgeStyle, label: "5" },
  { id: "e9", source: "s4", target: "token", animated: true, style: edgeStyle },
  { id: "e10", source: "token", target: "s5", style: dashedEdgeStyle, label: "6" },
  { id: "e11", source: "s5", target: "contract", style: dashedEdgeStyle },
  { id: "e12", source: "contract", target: "store", animated: true, style: edgeStyle, label: "7" },
  { id: "e13", source: "contract", target: "adapter", style: dashedEdgeStyle, label: "txHash" },
  { id: "e14", source: "adapter", target: "user", style: dashedEdgeStyle, label: "result" },
  { id: "e15", source: "user", target: "s6", animated: true, style: edgeStyle, label: "8" },
  { id: "e16", source: "s6", target: "store", animated: true, style: edgeStyle },
];

export function ReleaseEscrowFlow() {
  return (
    <div data-testid="diagram-release-escrow-sequence">
      <h3 className="mb-2 text-sm font-semibold text-text-secondary">Release Escrow Sequence</h3>
      <div className="overflow-hidden rounded-lg border border-border bg-surface-1 p-4 shadow-1">
        <ReactFlowDiagram nodes={nodes} edges={edges} height={380} />
      </div>
    </div>
  );
}

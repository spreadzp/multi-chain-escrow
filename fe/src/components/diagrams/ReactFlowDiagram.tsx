"use client";

import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface ReactFlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
  height?: number;
  showMiniMap?: boolean;
}

export function ReactFlowDiagram({
  nodes,
  edges,
  height = 400,
  showMiniMap = true,
}: ReactFlowDiagramProps) {
  return (
    <div style={{ width: "100%", height, overflow: "hidden", position: "relative" }} className="reactflow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="var(--border)"
          gap={20}
          size={1.5}
        />
        <Controls
          showInteractive={false}
          className="reactflow-controls"
        />
        {showMiniMap && (
          <MiniMap
            pannable
            zoomable
            className="reactflow-minimap"
            maskColor="rgba(0,0,0,0.05)"
            nodeColor={(node) => {
              const bg = node.style?.background;
              return typeof bg === "string" ? bg : "var(--surface-2)";
            }}
          />
        )}
      </ReactFlow>
    </div>
  );
}

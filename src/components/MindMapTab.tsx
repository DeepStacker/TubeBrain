import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  MarkerType,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Map } from "lucide-react";

interface MindMapData {
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string; label?: string }[];
}

interface MindMapTabProps {
  mindMap?: MindMapData;
}

const nodeColors = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"
];

const MindMapTab = ({ mindMap }: MindMapTabProps) => {
  if (!mindMap?.nodes?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Map className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-semibold">Mind map not generated</p>
        <p className="text-xs mt-1">Try using "Educational Deep-Dive" mode for a visual mind map.</p>
      </div>
    );
  }

  // Build RF nodes positioned in a radial layout
  const total = mindMap.nodes.length;
  const centerX = 400;
  const centerY = 300;
  const radius = 220;

  const rfNodes: Node[] = mindMap.nodes.map((n, i) => {
    const isCentral = i === 0;
    const angle = ((i - 1) / (total - 1)) * 2 * Math.PI;
    const x = isCentral ? centerX : centerX + radius * Math.cos(angle);
    const y = isCentral ? centerY : centerY + radius * Math.sin(angle);
    const color = nodeColors[i % nodeColors.length];

    return {
      id: n.id,
      data: { label: n.label },
      position: { x, y },
      style: {
        background: isCentral ? `${color}33` : `${color}18`,
        border: `2px solid ${color}80`,
        borderRadius: isCentral ? "16px" : "12px",
        color: "#f8fafc",
        padding: isCentral ? "10px 18px" : "7px 14px",
        fontSize: isCentral ? "14px" : "12px",
        fontWeight: isCentral ? "800" : "500",
        boxShadow: `0 0 20px ${color}30`,
        backdropFilter: "blur(8px)",
        maxWidth: isCentral ? "200px" : "160px",
        textAlign: "center",
      },
      sourcePosition: "right" as any,
      targetPosition: "left" as any,
    };
  });

  const rfEdges: Edge[] = mindMap.edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    label: e.label || "",
    style: { stroke: "#6366f180", strokeWidth: 1.5 },
    labelStyle: { fill: "#94a3b8", fontSize: 9, fontWeight: 500 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f160" },
    type: "smoothstep",
  }));

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);
  const onConnect = useCallback((params: any) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ height: "550px", background: "rgba(15,15,25,0.7)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#ffffff08" />
        <Controls style={{ background: "rgba(20,20,35,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
        <MiniMap 
          style={{ background: "rgba(20,20,35,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
          nodeColor={() => "#6366f1"}
        />
      </ReactFlow>
    </div>
  );
};

export default MindMapTab;

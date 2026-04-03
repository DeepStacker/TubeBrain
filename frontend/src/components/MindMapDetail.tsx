import { useCallback, useMemo, useState, useRef, useEffect } from "react";
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
  Position,
  Connection,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  Handle,
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  Maximize2, 
  Download, 
  Layout, 
  Sparkles, 
  Info, 
  Play, 
  Plus, 
  PlusCircle,
  Undo2,
  ZoomIn,
  ZoomOut,
  Focus,
  X,
  Compass,
  Zap,
  Eye,
  Activity,
  Target,
  RefreshCw
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MindMapData {
  nodes: { id: string; label: string; details?: string; timestamp?: number }[];
  edges: { id?: string; source: string; target: string; label?: string }[];
}

interface MindMapDetailProps {
  mindMap?: MindMapData;
  onAIAction?: (toolId: string, value: string, context?: string) => void;
  onTimestampClick?: (seconds: number) => void;
  isGenerating?: boolean;
}

// Custom Node Component for a more premium look
const CustomNode = ({ data, selected }: any) => {
  const isPractitioner = data.label.toLowerCase().includes('how') || data.label.toLowerCase().includes('implement');
  const isTheory = data.label.toLowerCase().includes('what') || data.label.toLowerCase().includes('theory') || data.label.toLowerCase().includes('concept');
  
  return (
    <div className={cn(
      "group relative min-w-[220px] rounded-[2.5rem] border-2 bg-card px-6 py-4 shadow-xl transition-all duration-500",
      selected ? "border-indigo-600 ring-8 ring-indigo-500/15 shadow-indigo-500/20" : "border-border hover:border-indigo-300/50 shadow-black/5",
      data.isHighlighted && "ring-4 ring-yellow-400 border-yellow-400",
      data.isDimmed && "opacity-30 scale-95"
    )}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-indigo-400 !border-none" />
      
      <div className="flex flex-col gap-1 text-center">
        {data.timestamp !== undefined && (
          <div className="mx-auto mb-1 rounded-full border border-indigo-300/50 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-indigo-600">
            {Math.floor(data.timestamp / 60)}:{(data.timestamp % 60).toString().padStart(2, '0')}
          </div>
        )}
        <h3 className={cn(
          "text-sm font-semibold tracking-tight",
          isTheory ? "text-indigo-600" : isPractitioner ? "text-emerald-600" : "text-foreground"
        )}>{data.label}</h3>
        {data.details && (
          <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-normal text-muted-foreground">{data.details}</p>
        )}
      </div>

      {/* Type Badge */}
      <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm">
        {isTheory ? <Info className="h-3 w-3 text-indigo-400" /> : isPractitioner ? <Activity className="h-3 w-3 text-emerald-400" /> : <Zap className="h-3 w-3 text-amber-400" />}
      </div>

      {/* Hover/Selection Actions */}
      <div className={cn(
        "absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 transition-all duration-300 z-[100]",
        (selected || data.isHovered) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <button 
          onClick={(e) => { e.stopPropagation(); data.onAction('explain', data.label, data.id); }}
          className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all"
          title="Explain Concept"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        {data.timestamp !== undefined && (
          <button 
            onClick={(e) => { e.stopPropagation(); data.onTimestamp(data.timestamp); }}
            className="rounded-2xl bg-primary p-2.5 text-primary-foreground shadow-xl transition-all hover:scale-110 hover:bg-primary/90 active:scale-95"
            title="Jump to Video"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); data.onAction('expand', data.label, data.id); }}
          className="rounded-2xl border-2 border-indigo-300/40 bg-card p-2.5 text-indigo-600 shadow-xl transition-all hover:scale-110 hover:bg-indigo-500/10 active:scale-95"
          title="Expand Branch"
        >
          <PlusCircle className="h-4 w-4" />
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-indigo-400 !border-none" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const MindMapInner = ({ mindMap, onAIAction, onTimestampClick, isGenerating }: MindMapDetailProps) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [activeNode, setActiveNode] = useState<any>(null);
  const [explorationMode, setExplorationMode] = useState<'free' | 'focus' | 'trailblazer'>('free');
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  const initialNodes = useMemo((): Node[] => {
    if (!mindMap?.nodes?.length) return [];
    
    return mindMap.nodes.map((n, i) => {
        const isRoot = i === 0;
        const row = Math.floor((i + 1) / 3);
        const col = (i + 1) % 3;
        
        let isHighlighted = false;
        let isDimmed = false;

        if (explorationMode === 'focus' && activeNode) {
            const isDirectlyConnected = mindMap.edges.some(e => 
                (e.source === activeNode.id && e.target === n.id) || 
                (e.target === activeNode.id && e.source === n.id)
            );
            isHighlighted = n.id === activeNode.id || isDirectlyConnected;
            isDimmed = !isHighlighted;
        }

        if (explorationMode === 'trailblazer' && activeNode) {
            isHighlighted = highlightedPath.includes(n.id);
            isDimmed = !isHighlighted;
        }

        return {
            id: n.id,
            type: 'custom',
            data: { 
                id: n.id,
                label: n.label, 
                details: n.details,
                timestamp: n.timestamp,
                isHighlighted,
                isDimmed,
                onAction: (type: string, val: string, nodeId: string) => {
                    if (type === 'explain') onAIAction?.('mind_map', `Deeply explain the concept "${val}" and its implications.`, `Node Context: ${val} (ID: ${nodeId})`);
                    if (type === 'expand') onAIAction?.('mindmap_expand', `Expand the mind map branch for "${val}". Provide new granular sub-nodes and edges.`, `Expand Node ID: ${nodeId} | Label: ${val}`);
                },
                onTimestamp: (t: number) => onTimestampClick?.(t)
            },
            position: isRoot ? { x: 0, y: 0 } : { x: (col - 1) * 400, y: (row + 1) * 220 },
        };
    });
  }, [mindMap, onAIAction, onTimestampClick, explorationMode, activeNode, highlightedPath]);

  const initialEdges = useMemo((): Edge[] => {
    if (!mindMap?.edges?.length) return [];
    return mindMap.edges.map((e, i) => {
      const edgeId = e.id || `e-${i}`;
      let isPathHighlighted = false;
      if (explorationMode === 'trailblazer' && highlightedPath.includes(e.source) && highlightedPath.includes(e.target)) {
        isPathHighlighted = true;
      }

      return {
        id: edgeId,
        source: e.source,
        target: e.target,
        label: e.label || "",
        style: { 
          stroke: isPathHighlighted ? "#6366f1" : "#e2e8f0", 
          strokeWidth: isPathHighlighted ? 4 : 3,
          opacity: (explorationMode !== 'free' && !isPathHighlighted) ? 0.2 : 1
        },
        labelStyle: { fill: "#64748b", fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' },
        markerEnd: { type: MarkerType.ArrowClosed, color: isPathHighlighted ? "#6366f1" : "#cbd5e1", width: 20, height: 20 },
        type: "smoothstep",
        animated: isPathHighlighted || (explorationMode === 'free' && i % 3 === 0),
      };
    });
  }, [mindMap, explorationMode, highlightedPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Sync hovered state to nodes
  useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isHovered: n.id === hoveredNodeId }
    })));
  }, [hoveredNodeId, setNodes]);

  // Simple path finding for trailblazer
  useEffect(() => {
    if (explorationMode === 'trailblazer' && activeNode && mindMap) {
        const path: string[] = [];
        let curr = activeNode.id;
        path.push(curr);
        
        // Walk back to root
        let safety = 0;
        while (curr !== mindMap.nodes[0].id && safety < 10) {
            const parentEdge = mindMap.edges.find(e => e.target === curr);
            if (parentEdge) {
                curr = parentEdge.source;
                path.push(curr);
            } else break;
            safety++;
        }
        setHighlightedPath(path);
    } else {
        setHighlightedPath([]);
    }
  }, [activeNode, explorationMode, mindMap]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    if (!activeNode) {
        setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
    }
  }, [initialNodes, initialEdges, fitView, setNodes, setEdges, activeNode]);

  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  const handleExport = () => {
    // In a real app, use html-to-image or similar
    alert("Exporting logic would go here (PNG/SVG)");
  };

  return (
    <div className="relative h-full w-full bg-background">
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
                setActiveNode(node);
                // Force select in Focus mode
                if (explorationMode === 'focus') {
                    setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
                }
            }}
            onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-dot-pattern"
        >
            <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="hsl(var(--border))" />
            
            <Panel position="top-left" className="m-4 flex flex-col gap-3">
              <div className="max-w-[340px] rounded-[2.5rem] border border-border/70 bg-card/90 p-5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30">
                                <Compass className="h-6 w-6" />
                            </div>
                            <div>
                      <h3 className="text-base font-semibold leading-tight text-foreground">Mastery Map</h3>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500">Knowledge Graph</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onAIAction?.('mind_map', 'Regenerate this mind map.')}
                            disabled={isGenerating}
                            className="h-10 w-10 rounded-2xl text-muted-foreground transition-all hover:bg-indigo-500/10 hover:text-indigo-600"
                            title="Regenerate Mind Map"
                        >
                            <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                        </Button>
                    </div>
                    
                    <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-border bg-secondary p-1">
                        <button 
                            onClick={() => setExplorationMode('free')}
                            className={cn(
                                "flex flex-col items-center gap-1 py-3 rounded-xl transition-all",
                                explorationMode === 'free' ? "border border-border bg-card text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Eye className="h-4 w-4" />
                            <span className="text-[9px] font-semibold uppercase tracking-tighter">Free</span>
                        </button>
                        <button 
                            onClick={() => setExplorationMode('focus')}
                            className={cn(
                                "flex flex-col items-center gap-1 py-3 rounded-xl transition-all",
                                explorationMode === 'focus' ? "border border-border bg-card text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Target className="h-4 w-4" />
                            <span className="text-[9px] font-semibold uppercase tracking-tighter">Focus</span>
                        </button>
                        <button 
                            onClick={() => setExplorationMode('trailblazer')}
                            className={cn(
                                "flex flex-col items-center gap-1 py-3 rounded-xl transition-all",
                                explorationMode === 'trailblazer' ? "border border-border bg-card text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Activity className="h-4 w-4" />
                            <span className="text-[9px] font-semibold uppercase tracking-tighter">Path</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-amber-400" /> Mastery</span>
                          <span className="text-foreground">{nodes.length} Concepts</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-secondary">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(nodes.length * 5, 100)}%` }}
                                className="h-full bg-indigo-600 rounded-full" 
                            />
                        </div>
                    </div>
                </div>

                {isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex w-fit items-center gap-3 rounded-full bg-indigo-600 px-6 py-3 text-white shadow-2xl shadow-indigo-500/20"
                    >
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        <span className="text-xs font-semibold uppercase tracking-widest">AI Expanding Graph...</span>
                    </motion.div>
                )}
            </Panel>

            <Panel position="bottom-right" className="m-6 flex flex-col gap-3">
                    <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/90 p-2 backdrop-blur-xl shadow-2xl">
                      <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="h-10 w-10 text-muted-foreground hover:bg-secondary">
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                      <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="h-10 w-10 text-muted-foreground hover:bg-secondary">
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                      <Button variant="ghost" size="icon" onClick={() => fitView()} className="h-10 w-10 text-muted-foreground hover:bg-secondary">
                        <Focus className="h-4 w-4" />
                    </Button>
                </div>
                    <Button onClick={handleExport} className="h-12 rounded-2xl bg-primary px-6 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-xl hover:bg-primary/90">
                    <Download className="h-4 w-4 mr-2" /> Export Graph
                </Button>
            </Panel>

            <Panel position="top-right" className="m-4">
               <AnimatePresence>
                {activeNode && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-[320px] overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/95 backdrop-blur-2xl shadow-2xl"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                            <div className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-600">
                                    Node Insights
                                </div>
                                <div className="flex items-center gap-1">
                                    {explorationMode === 'focus' && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => setExplorationMode('free')}
                                            className="h-8 w-8 rounded-full text-amber-500 hover:bg-amber-500/10"
                                            title="Clear Focus"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => setActiveNode(null)} className="h-8 w-8 rounded-full">
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                                  <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground underline decoration-indigo-300/60 decoration-4 underline-offset-4">{activeNode.data.label}</h3>
                                  <p className="mb-6 text-sm font-medium leading-relaxed text-muted-foreground">
                                {activeNode.data.details || "This concept represents a core pillar of the video's architectural model. Expand to see sub-topics or ask for a cross-concept synthesis."}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    onClick={() => activeNode.data.onAction('explain', activeNode.data.label)}
                                    className="h-10 rounded-2xl bg-indigo-600 text-[10px] font-semibold uppercase tracking-widest hover:bg-indigo-700"
                                >
                                    Explain
                                </Button>
                                <Button 
                                    onClick={() => activeNode.data.onAction('expand', activeNode.data.label)}
                                    variant="outline"
                                    className="h-10 rounded-2xl border-indigo-300/40 text-[10px] font-semibold uppercase tracking-widest text-indigo-600"
                                >
                                    Expand
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
               </AnimatePresence>
            </Panel>
        </ReactFlow>
    </div>
  );
};

const MindMapDetail = (props: MindMapDetailProps) => {
  if (!props.mindMap?.nodes?.length) {
    return (
        <div className="flex h-full min-h-[600px] w-full flex-col items-center justify-center rounded-[3rem] border border-border bg-secondary/30 p-12 text-center">
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] border border-border bg-card shadow-2xl">
                <Compass className="h-10 w-10 text-indigo-600" />
            <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-card bg-indigo-600 shadow-lg">
                    <Sparkles className="h-3 w-3 text-white" />
                </div>
            </div>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground">Mastery Map Pending</h2>
          <p className="mb-10 max-w-md font-medium leading-relaxed text-muted-foreground">
                Visualize the conceptual DNA of this video. We'll build an interactive knowledge graph showing how every theory and practical step connects.
            </p>
            <Button 
                onClick={() => props.onAIAction?.('mind_map', 'Generate a comprehensive mind map of this video workflow.')}
                disabled={props.isGenerating}
            className="flex h-16 items-center gap-4 rounded-[2rem] bg-indigo-600 px-12 text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95"
            >
                {props.isGenerating ? (
                    <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Generating Map...
                    </>
                ) : (
                    <>
                        <Zap className="h-6 w-6" />
                        Generate Knowledge Graph
                    </>
                )}
            </Button>
        </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[600px] overflow-hidden rounded-[3rem] border border-border bg-card shadow-sm">
        <ReactFlowProvider>
            <MindMapInner {...props} />
        </ReactFlowProvider>
    </div>
  );
};

export default MindMapDetail;

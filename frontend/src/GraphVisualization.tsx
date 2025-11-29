import { useEffect, useState, useMemo, useRef, memo, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
    ConnectionLineType,
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphData } from '@costvela/types';
import dagre from 'dagre';

interface GraphVisualizationProps {
    graphData: GraphData | null;
}

// Custom Node Component
const CustomNode = memo(({ data, isConnectable }: any) => {
    const { label, type } = data;

    return (
        <div className="h-full w-full flex items-center justify-center relative group">
            <Handle
                type="source"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!bg-slate-400 !w-2 !h-2 !border-2 !border-white"
            />

            <div className="flex flex-col items-center">
                <div className="text-[10px] font-bold mb-1 opacity-60 uppercase tracking-wider text-slate-600">
                    {type}
                </div>
                <div className="font-mono font-medium text-sm whitespace-pre-wrap break-words max-w-[180px] text-center leading-tight">
                    {label}
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Right}
                isConnectable={false}
                className="!bg-slate-400 !w-2 !h-2 !border-2 !border-white"
            />
        </div>
    );
});

const nodeTypes = {
    custom: CustomNode,
};

// Static style map for stable references
const BASE_STYLE = {
    padding: '14px 28px',
    fontSize: '12px',
    fontWeight: 600,
    border: '2px solid',
    minWidth: '220px',
    textAlign: 'center' as const,
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    transition: 'all 0.2s ease',
};

const STYLE_MAP: Record<string, React.CSSProperties> = {
    param: { ...BASE_STYLE, background: '#ffffff', borderColor: '#0f766e', color: '#0f766e' },
    input: { ...BASE_STYLE, background: '#ffffff', borderColor: '#0052cc', color: '#0052cc' },
    constant: { ...BASE_STYLE, background: '#f8fafc', borderColor: '#64748b', color: '#475569' },
    formula: { ...BASE_STYLE, background: '#ffffff', borderColor: '#020617', color: '#020617' },
    range: { ...BASE_STYLE, background: '#ffffff', borderColor: '#b45309', color: '#b45309', fontWeight: 700 },
    range_item: { ...BASE_STYLE, background: '#fffbeb', borderColor: '#f59e0b', color: '#92400e' },
    default: { ...BASE_STYLE, background: '#ffffff', borderColor: '#cbd5e1', color: '#475569' },
};

const getNodeStyle = (type: string) => STYLE_MAP[type] || STYLE_MAP.default;

export function GraphVisualization({ graphData }: GraphVisualizationProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [expansionPath, setExpansionPath] = useState<string[]>([]);

    // Position cache - once a node has a position, we keep it stable
    const positionCache = useRef<Map<string, { x: number; y: number }>>(new Map());

    // Build graph structure maps
    const { parentsMap, leafNodeIds } = useMemo(() => {
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            return {
                childrenMap: new Map<string, string[]>(),
                parentsMap: new Map<string, string[]>(),
                leafNodeIds: new Set<string>()
            };
        }

        const childrenMap = new Map<string, string[]>();
        const parentsMap = new Map<string, string[]>();

        graphData.edges.forEach((edge) => {
            if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
            childrenMap.get(edge.source)!.push(edge.target);

            if (!parentsMap.has(edge.target)) parentsMap.set(edge.target, []);
            parentsMap.get(edge.target)!.push(edge.source);
        });

        // Find leaf nodes (no children = final outputs, but exclude input/param)
        // These are the starting points users see: total_12_month_revenue, etc.
        const leafNodeIds = new Set<string>();
        graphData.nodes.forEach(node => {
            const hasChildren = childrenMap.has(node.id) && childrenMap.get(node.id)!.length > 0;
            const isInputOrParam = node.type === 'input' || node.type === 'param';

            if (!hasChildren && !isInputOrParam) {
                leafNodeIds.add(node.id);
            }
        });

        return { childrenMap, parentsMap, leafNodeIds };
    }, [graphData]);

    // Determine visible nodes: leaves + expansion path + parents of deepest node
    const visibleNodeIds = useMemo(() => {
        const visible = new Set<string>();

        // Always show leaf nodes (final outputs)
        leafNodeIds.forEach(id => visible.add(id));

        // Show all nodes in the expansion path
        expansionPath.forEach(nodeId => visible.add(nodeId));

        // For the deepest expanded node, show its first-level parents
        if (expansionPath.length > 0) {
            const deepestNode = expansionPath[expansionPath.length - 1];
            const parents = parentsMap.get(deepestNode) || [];
            parents.forEach(parentId => visible.add(parentId));
        }

        return visible;
    }, [leafNodeIds, expansionPath, parentsMap]);

    // Update React Flow nodes and edges when visibility changes
    useEffect(() => {
        if (!graphData || !graphData.nodes) {
            setNodes([]);
            setEdges([]);
            return;
        }

        // Filter visible graph nodes
        const visibleGraphNodes = graphData.nodes.filter(n => visibleNodeIds.has(n.id));
        const visibleGraphEdges = graphData.edges.filter(edge =>
            visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
        );

        // Calculate layout using dagre
        const g = new dagre.graphlib.Graph();
        g.setGraph({
            rankdir: 'LR', // Left to right
            nodesep: 60,
            ranksep: 120,
            marginx: 50,
            marginy: 50
        });
        g.setDefaultEdgeLabel(() => ({}));

        // Identify which nodes need layout (new nodes without cached positions)
        const newNodeIds: string[] = [];
        visibleGraphNodes.forEach(node => {
            if (!positionCache.current.has(node.id)) {
                newNodeIds.push(node.id);
            }
            g.setNode(node.id, { width: 220, height: 100 });
        });

        // Add edges to graph
        visibleGraphEdges.forEach(edge => {
            g.setEdge(edge.source, edge.target);
        });

        // Run dagre layout
        dagre.layout(g);

        // Update position cache for new nodes only
        newNodeIds.forEach(nodeId => {
            const dagreNode = g.node(nodeId);
            if (dagreNode) {
                positionCache.current.set(nodeId, {
                    x: dagreNode.x,
                    y: dagreNode.y
                });
            }
        });

        // Build React Flow nodes with cached positions
        const flowNodes: Node[] = visibleGraphNodes.map(graphNode => {
            const cachedPos = positionCache.current.get(graphNode.id);
            const position = cachedPos || { x: 0, y: 0 };

            return {
                id: graphNode.id,
                type: 'custom',
                data: {
                    label: graphNode.displayName || graphNode.label || graphNode.id,
                    type: graphNode.type,
                },
                position,
                style: getNodeStyle(graphNode.type || 'default'),
            };
        });

        // Build React Flow edges
        const flowEdges: Edge[] = visibleGraphEdges.map((edge, idx) => ({
            id: `e-${edge.source}-${edge.target}-${idx}`,
            source: edge.source,
            target: edge.target,
            type: ConnectionLineType.Bezier,
            animated: true,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#94a3b8',
            },
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);

    }, [graphData, visibleNodeIds, setNodes, setEdges]);

    // Handle React Flow node/edge changes
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    // Handle node click - expand to show dependencies
    const onNodeClick = (_event: React.MouseEvent, node: Node) => {
        const hasParents = parentsMap.get(node.id)?.length || 0;

        if (hasParents > 0) {
            // Check if node is already in path
            const indexInPath = expansionPath.indexOf(node.id);

            if (indexInPath >= 0) {
                // Clicking a node in the path - truncate to that point
                setExpansionPath(expansionPath.slice(0, indexInPath + 1));
            } else {
                // Expand - add to path (replaces previous expansion)
                setExpansionPath([node.id]);
            }
        }
    };

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50 border rounded-lg border-slate-200">
                <div className="text-center text-slate-400">
                    <svg
                        className="w-16 h-16 mx-auto mb-4 text-slate-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    <p className="font-medium text-slate-500">No graph data available</p>
                    <p className="text-sm mt-1">Run a calculation to see the computation graph</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white border border-slate-900 flex flex-col relative overflow-hidden">
            {/* Controls Bar */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-700">Dependency Graph</h3>
                </div>

                <div className="text-sm text-slate-600">
                    <span className="font-medium">{nodes.length}</span> visible nodes
                    <span className="text-slate-400 ml-1">
                        ({graphData?.nodes.length || 0} total)
                    </span>
                </div>
            </div>

            {/* Graph */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}

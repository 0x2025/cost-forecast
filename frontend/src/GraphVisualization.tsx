import { useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
    useNodesState,
    useEdgesState,
    MarkerType,
    ConnectionLineType,
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphData } from './api';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled';

interface GraphVisualizationProps {
    graphData: GraphData | null;
}

// Custom Node Component
const CustomNode = ({ data }: { data: any }) => {
    return (
        <div className="h-full w-full flex items-center justify-center relative group">
            <Handle type="target" position={Position.Left} className="!bg-gray-400" />

            <div className="flex flex-col items-center">
                <div className="text-xs font-bold mb-1 opacity-50 uppercase tracking-wider">
                    {data.type}
                </div>
                <div className="font-mono font-medium text-sm whitespace-pre-wrap break-words max-w-[180px]">
                    {data.label}
                    {data.metadata?.expression && (
                        <div className="text-xs opacity-50">{data.metadata.expression}</div>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-gray-400" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// Node style based on type
const getNodeStyle = (type: string) => {
    const baseStyle = {
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 500,
        border: '2px solid',
        minWidth: '200px',
        textAlign: 'center' as const,
        fontFamily: 'monospace',
    };

    switch (type) {
        case 'param':
            return {
                ...baseStyle,
                background: '#dbeafe',
                borderColor: '#3b82f6',
                color: '#1e40af',
            };
        case 'input':
            return {
                ...baseStyle,
                background: '#dcfce7',
                borderColor: '#22c55e',
                color: '#166534',
            };
        case 'constant':
            return {
                ...baseStyle,
                background: '#e5e7eb',
                borderColor: '#6b7280',
                color: '#374151',
            };
        case 'formula':
            return {
                ...baseStyle,
                background: '#f3e8ff',
                borderColor: '#a855f7',
                color: '#6b21a8',
            };
        case 'range':
            return {
                ...baseStyle,
                background: '#fed7aa',
                borderColor: '#f97316',
                color: '#9a3412',
                fontWeight: 600,
            };
        case 'range_item':
            return {
                ...baseStyle,
                background: '#ffedd5',
                borderColor: '#fb923c',
                color: '#9a3412',
            };
        default:
            return {
                ...baseStyle,
                background: '#f3f4f6',
                borderColor: '#9ca3af',
                color: '#374151',
            };
    }
};

export function GraphVisualization({ graphData }: GraphVisualizationProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Transform graph data into React Flow format
    useEffect(() => {
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const elk = new ELK();

        const layoutOptions = {
            'elk.algorithm': 'layered',
            'elk.direction': 'RIGHT', // Changed to RIGHT for better flow
            'elk.spacing.nodeNode': '60',
            'elk.layered.spacing.nodeNodeBetweenLayers': '120',
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
            'elk.edgeRouting': 'ORTHOGONAL',
        };

        const graph: ElkNode = {
            id: 'root',
            layoutOptions: layoutOptions,
            children: graphData.nodes.map((node) => ({
                id: node.id,
                width: 220, // Increased width for custom node
                height: 80, // Increased height for custom node
                labels: [{ text: node.label }],
            })),
            edges: graphData.edges.map((edge, idx) => ({
                id: `e-${edge.source}-${edge.target}-${idx}`,
                sources: [edge.source],
                targets: [edge.target],
            })),
        };

        elk.layout(graph)
            .then((layoutedGraph) => {
                // Create nodes with layout positions
                const flowNodes: Node[] = (layoutedGraph.children || []).map((node) => {
                    const graphNode = graphData.nodes.find(n => n.id === node.id);
                    return {
                        id: node.id,
                        type: 'custom', // Use custom node type
                        data: {
                            label: graphNode?.displayName || graphNode?.label || node.id,
                            metadata: graphNode?.metadata,
                            type: graphNode?.type,
                        },
                        position: { x: node.x!, y: node.y! },
                        style: getNodeStyle(graphNode?.type || 'default'),
                    };
                });

                // Create edges
                const flowEdges: Edge[] = graphData.edges.map((edge, idx) => ({
                    id: `e-${edge.source}-${edge.target}-${idx}`,
                    source: edge.source,
                    target: edge.target,
                    type: ConnectionLineType.SmoothStep, // Changed to SmoothStep for cleaner look
                    animated: true,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: '#9ca3af',
                    },
                    style: { stroke: '#9ca3af', strokeWidth: 1.5 },
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);
            })
            .catch(console.error);

    }, [graphData, setNodes, setEdges]);

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 border rounded">
                <div className="text-center text-gray-500">
                    <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
                    <p className="font-medium">No graph data available</p>
                    <p className="text-sm mt-1">Run a calculation to see the computation graph</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white border rounded">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                connectionLineType={ConnectionLineType.SmoothStep}
            >
                <Background color="#e5e7eb" gap={16} />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        const style = node.style as any;
                        return style?.borderColor || '#9ca3af';
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
            </ReactFlow>
        </div>
    );
}

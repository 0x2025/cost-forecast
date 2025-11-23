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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphData } from './api';
import dagre from 'dagre';

interface GraphVisualizationProps {
    graphData: GraphData | null;
}

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 40;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

// Node style based on type
const getNodeStyle = (type: string) => {
    const baseStyle = {
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        border: '2px solid',
        minWidth: '180px',
        textAlign: 'center' as const,
    };

    switch (type) {
        case 'constant':
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
        case 'formula':
            return {
                ...baseStyle,
                background: '#fef3c7',
                borderColor: '#f59e0b',
                color: '#92400e',
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

        // Create nodes
        const flowNodes: Node[] = graphData.nodes.map((node) => ({
            id: node.id,
            type: 'default',
            data: {
                label: node.label,
                metadata: node.metadata
            },
            position: { x: 0, y: 0 }, // Will be set by layout
            style: getNodeStyle(node.type),
        }));

        // Create edges
        const flowEdges: Edge[] = graphData.edges.map((edge, idx) => ({
            id: `e-${edge.source}-${edge.target}-${idx}`,
            source: edge.source,
            target: edge.target,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
            },
            style: { stroke: '#6b7280', strokeWidth: 2 },
        }));

        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            flowNodes,
            flowEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
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
                fitView
                attributionPosition="bottom-left"
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

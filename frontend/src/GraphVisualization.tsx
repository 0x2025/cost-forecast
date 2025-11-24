import { useEffect, useState } from 'react';
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
    const hasChildren = data.hasChildren || false;
    const isCollapsed = data.isCollapsed || false;
    const childCount = data.childCount || 0;

    return (
        <div className="h-full w-full flex items-center justify-center relative group">
            {/* Source on LEFT (outputs flow left), Target on RIGHT (inputs from right) */}
            <Handle
                type="source"
                position={Position.Left}
                isConnectable={false}
                className="!bg-gray-400 !cursor-default"
            />

            <div className="flex flex-col items-center">
                <div className="text-xs font-bold mb-1 opacity-50 uppercase tracking-wider">
                    {data.type}
                </div>
                <div className="font-mono font-medium text-sm whitespace-pre-wrap break-words max-w-[180px] text-center">
                    {data.label}
                    {data.metadata?.expression && (
                        <div className="text-xs opacity-50">{data.metadata.expression}</div>
                    )}
                </div>

                {/* Collapse/Expand Indicator */}
                {hasChildren && (
                    <div className="mt-1 text-xs font-medium" style={{ color: 'inherit' }}>
                        {isCollapsed ? (
                            <span>▶ {childCount} hidden</span>
                        ) : (
                            <span>▼ {childCount} shown</span>
                        )}
                    </div>
                )}
            </div>

            <Handle
                type="target"
                position={Position.Right}
                isConnectable={false}
                className="!bg-gray-400 !cursor-default"
            />
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
    const [algorithm, setAlgorithm] = useState<string>('layered');
    const [edgeRouting, setEdgeRouting] = useState<string>('ORTHOGONAL');
    const [connectionType, setConnectionType] = useState<ConnectionLineType>(ConnectionLineType.Bezier);
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [nodeChildrenMap, setNodeChildrenMap] = useState<Map<string, string[]>>(new Map());
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
    const [fullLayoutNodes, setFullLayoutNodes] = useState<Node[]>([]); // Store complete layout

    // Build hierarchy from graph data
    const buildHierarchy = (graphData: GraphData) => {
        const childrenMap = new Map<string, string[]>();
        const parentMap = new Map<string, string>();

        // Build parent-child relationships from edges
        // In dependency graph: edge A→B means B depends on A
        // So B is the parent (dependent), A is the child (dependency)
        graphData.edges.forEach(edge => {
            const child = edge.source;  // dependency
            const parent = edge.target; // dependent

            if (!childrenMap.has(parent)) {
                childrenMap.set(parent, []);
            }
            childrenMap.get(parent)!.push(child);
            parentMap.set(child, parent);
        });

        setNodeChildrenMap(childrenMap);

        // Smart defaults: auto-collapse range nodes that have many range_item children
        const autoCollapse = new Set<string>();
        graphData.nodes.forEach(node => {
            // Collapse range nodes that have range_item children
            if (node.type === 'range') {
                const children = childrenMap.get(node.id) || [];
                const hasRangeItems = children.some(childId => {
                    const childNode = graphData.nodes.find(n => n.id === childId);
                    return childNode?.type === 'range_item';
                });
                if (hasRangeItems && children.length > 3) { // Only auto-collapse if >3 items
                    autoCollapse.add(node.id);
                }
            }
        });

        setCollapsedNodes(autoCollapse);
    };

    // Check if a node should be visible based on collapse state
    const isNodeVisible = (nodeId: string, graphData: GraphData): boolean => {
        // Find all parents (nodes that depend on this node)
        const parentEdges = graphData.edges.filter(e => e.source === nodeId);

        // If no parents, this is a leaf node (output) - always visible
        if (parentEdges.length === 0) {
            return true;
        }

        // Node is visible if AT LEAST ONE parent is expanded (not collapsed)
        // Only hide if ALL parents are collapsed
        const hasExpandedParent = parentEdges.some(edge => {
            const parent = edge.target;
            return !collapsedNodes.has(parent) && isNodeVisible(parent, graphData);
        });

        return hasExpandedParent;
    };

    // Build hierarchy only when graphData changes
    useEffect(() => {
        if (graphData && graphData.nodes && graphData.nodes.length > 0) {
            buildHierarchy(graphData);
        }
    }, [graphData]);


    // Calculate full layout only when graph data or layout settings change
    useEffect(() => {
        if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
            setFullLayoutNodes([]);
            return;
        }

        const elk = new ELK();

        const layoutOptions = {
            'elk.algorithm': algorithm,
            'elk.direction': 'LEFT', // Output on left, dependencies on right (drill-down pattern)
            'elk.spacing.nodeNode': '60',
            'elk.layered.spacing.nodeNodeBetweenLayers': '120',
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
            'elk.edgeRouting': edgeRouting,
        };

        // Layout ALL nodes (including those that will be hidden)
        const graph: ElkNode = {
            id: 'root',
            layoutOptions: layoutOptions,
            children: graphData.nodes.map((node) => ({
                id: node.id,
                width: 220,
                height: 100,
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
                // Create nodes with calculated positions
                const layoutedNodes: Node[] = (layoutedGraph.children || []).map((node) => {
                    const graphNode = graphData.nodes.find(n => n.id === node.id);
                    const children = nodeChildrenMap.get(node.id) || [];

                    return {
                        id: node.id,
                        type: 'custom',
                        data: {
                            label: graphNode?.displayName || graphNode?.label || node.id,
                            metadata: graphNode?.metadata,
                            type: graphNode?.type,
                            hasChildren: children.length > 0,
                            isCollapsed: false, // Will be updated by visibility filter
                            childCount: children.length,
                        },
                        position: { x: node.x!, y: node.y! },
                        style: getNodeStyle(graphNode?.type || 'default'),
                    };
                });

                setFullLayoutNodes(layoutedNodes);

                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }
            })
            .catch(console.error);

    }, [graphData, algorithm, edgeRouting, nodeChildrenMap, isInitialLoad]);

    // Filter visible nodes based on collapse state (no re-layout)
    useEffect(() => {
        if (!graphData || fullLayoutNodes.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        // Filter visible nodes
        const visibleNodeIds = graphData.nodes
            .filter(node => isNodeVisible(node.id, graphData))
            .map(n => n.id);

        // Update nodes with collapse state and filter hidden ones
        const visibleNodes = fullLayoutNodes
            .filter(node => visibleNodeIds.includes(node.id))
            .map(node => ({
                ...node,
                data: {
                    ...node.data,
                    isCollapsed: collapsedNodes.has(node.id),
                },
            }));

        // Filter visible edges
        const visibleEdges: Edge[] = graphData.edges
            .filter(edge => visibleNodeIds.includes(edge.source) && visibleNodeIds.includes(edge.target))
            .map((edge, idx) => ({
                id: `e-${edge.source}-${edge.target}-${idx}`,
                source: edge.source,
                target: edge.target,
                type: connectionType, // Use dynamic connection type from state
                animated: true,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#9ca3af',
                },
                style: { stroke: '#9ca3af', strokeWidth: 1.5 },
            }));

        setNodes(visibleNodes);
        setEdges(visibleEdges);

    }, [fullLayoutNodes, collapsedNodes, graphData, connectionType, setNodes, setEdges]);

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
        <div className="h-full bg-white border rounded flex flex-col">
            {/* Algorithm Selector */}
            <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <label htmlFor="algorithm" className="text-sm font-medium text-gray-700">
                        Layout:
                    </label>
                    <select
                        id="algorithm"
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="layered">Layered</option>
                        <option value="force">Force</option>
                        <option value="stress">Stress</option>
                        <option value="mrtree">Tree</option>
                        <option value="radial">Radial</option>
                        <option value="disco">DisCo</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <label htmlFor="edgeRouting" className="text-sm font-medium text-gray-700">
                        Edge Routing:
                    </label>
                    <select
                        id="edgeRouting"
                        value={edgeRouting}
                        onChange={(e) => setEdgeRouting(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="ORTHOGONAL">Orthogonal</option>
                        <option value="POLYLINE">Polyline</option>
                        <option value="SPLINES">Splines</option>
                        <option value="UNDEFINED">Undefined</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <label htmlFor="connectionType" className="text-sm font-medium text-gray-700">
                        Edge Style:
                    </label>
                    <select
                        id="connectionType"
                        value={connectionType}
                        onChange={(e) => setConnectionType(e.target.value as ConnectionLineType)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value={ConnectionLineType.Bezier}>Bezier</option>
                        <option value={ConnectionLineType.Straight}>Straight</option>
                        <option value={ConnectionLineType.Step}>Step</option>
                        <option value={ConnectionLineType.SmoothStep}>Smooth Step</option>
                        <option value={ConnectionLineType.SimpleBezier}>Simple Bezier</option>
                    </select>
                </div>

                <span className="text-xs text-gray-500 ml-auto">
                    Experiment with different layouts
                </span>
            </div>

            {/* Graph */}
            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={(_event, node) => {
                        const children = nodeChildrenMap.get(node.id) || [];
                        if (children.length > 0) {
                            const newCollapsed = new Set(collapsedNodes);
                            if (newCollapsed.has(node.id)) {
                                newCollapsed.delete(node.id);
                            } else {
                                newCollapsed.add(node.id);
                            }
                            setCollapsedNodes(newCollapsed);
                        }
                    }}
                    nodeTypes={nodeTypes}
                    // fitView={isInitialLoad} // Only fit view on initial load
                    fitViewOptions={{ duration: 200 }} // Smooth initial fit
                    attributionPosition="bottom-left"
                    connectionLineType={ConnectionLineType.SimpleBezier}
                    snapToGrid={true}
                    // Disable connection editing but allow node movement
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                >
                    <Background color="#e5e7eb" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}

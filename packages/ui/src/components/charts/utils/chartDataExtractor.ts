import type { GraphNode } from '@costvela/types';

export interface ChartDataPoint {
    name: string;
    value: number;
    [key: string]: any;
}

export interface ChartData {
    data: ChartDataPoint[];
    label: string;
}

/**
 * Extracts data for a "Compare Values" chart
 * @param nodeIds List of node IDs to compare
 * @param nodes List of all graph nodes
 * @param results Calculation results map (key = node label/id, value = result)
 */
export const extractCompareData = (
    nodeIds: string[],
    nodes: GraphNode[],
    results: Record<string, any>
): ChartData => {
    const data: ChartDataPoint[] = nodeIds.map(id => {
        const node = nodes.find(n => n.id === id);
        const label = node?.displayName || node?.label || id;

        // Try to find value by ID first, then by label
        let value = results[id];
        if (value === undefined && node?.label) {
            value = results[node.label];
        }

        return {
            name: label,
            value: typeof value === 'number' ? value : 0
        };
    }).filter(item => item.value !== undefined);

    return {
        data,
        label: 'Comparison'
    };
};

/**
 * Extracts data for a "Breakdown" chart (Range items)
 * @param rangeNodeId The parent range node ID (e.g., "employees")
 * @param nodes List of all graph nodes
 * @param results Calculation results map
 */
export const extractRangeData = (
    rangeNodeId: string,
    nodes: GraphNode[],
    results: Record<string, any>,
    labelSourceId?: string,
    labelKey?: string
): ChartData => {
    // Find all nodes that are items of this range
    // We assume range items have metadata linking them to parent, or we parse labels
    // Based on previous context, range items might be children in the graph or have specific naming

    // Strategy: Look for nodes that look like "rangeNodeId[index]" or have metadata
    const rangeItems = nodes.filter(node => {
        // Check metadata if available (best)
        if (node.metadata?.rangeParentId === rangeNodeId) return true;

        // Fallback: Check label pattern "rangeNodeId[x]"
        // This is a heuristic and might need adjustment based on actual backend output
        if (node.label.startsWith(`${rangeNodeId}[`) && node.label.endsWith(']')) return true;

        return false;
    });

    // Get source array if label config is present
    let sourceArray: any[] | null = null;
    if (labelSourceId && labelKey) {
        const val = results[labelSourceId];
        if (Array.isArray(val)) {
            sourceArray = val;
        }
    }

    const data: ChartDataPoint[] = rangeItems.map(node => {
        // For RangeItemNodes, the value is always stored in metadata.result
        const value = node.metadata?.result;

        let name = node.metadata?.rangeItemLabel || node.label; // e.g. "employee[1]"

        // Try to resolve custom label
        if (sourceArray && labelKey && typeof node.metadata?.index === 'number') {
            const index = node.metadata.index;
            if (index >= 0 && index < sourceArray.length) {
                const item = sourceArray[index];
                if (item && typeof item === 'object' && labelKey in item) {
                    name = String(item[labelKey]);
                }
            }
        }

        return {
            name,
            value: typeof value === 'number' ? value : 0
        };
    });

    return {
        data,
        label: rangeNodeId
    };
};

/**
 * Extracts single value for KPI
 */
export const extractKPIValue = (
    nodeId: string,
    nodes: GraphNode[],
    results: Record<string, any>
): { value: number; label: string } | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    let value = results[nodeId];
    if (value === undefined) {
        value = results[node.label];
    }

    if (typeof value !== 'number') return null;

    return {
        value,
        label: node.displayName || node.label
    };
};

import type { GraphNode } from '@costvela/types';

export interface RangeGroup {
    parentId: string;
    parentLabel: string;
    items: GraphNode[];
}

/**
 * Detects groups of range items in the graph
 * @param nodes List of all graph nodes
 */
export const detectRangeGroups = (nodes: GraphNode[]): RangeGroup[] => {
    const groups = new Map<string, RangeGroup>();

    nodes.forEach(node => {
        // Check if node is a range item
        // We rely on metadata or type 'range_item'
        if (node.type === 'range_item' || node.metadata?.rangeParentId) {
            const parentId = node.metadata?.rangeParentId;

            if (parentId) {
                if (!groups.has(parentId)) {
                    // Find parent node to get label
                    const parentNode = nodes.find(n => n.id === parentId);
                    groups.set(parentId, {
                        parentId,
                        parentLabel: parentNode?.displayName || parentNode?.label || parentId,
                        items: []
                    });
                }
                groups.get(parentId)!.items.push(node);
            }
        }
    });

    return Array.from(groups.values());
};

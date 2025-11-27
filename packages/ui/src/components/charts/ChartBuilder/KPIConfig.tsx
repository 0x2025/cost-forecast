import React, { useState } from 'react';
import type { GraphNode } from '@costvela/types';

interface KPIConfigProps {
    nodes: GraphNode[];
    results: Record<string, any>;
    onConfigure: (config: any) => void;
    onBack: () => void;
}

export const KPIConfig: React.FC<KPIConfigProps> = ({ nodes, results, onConfigure, onBack }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [format, setFormat] = useState<'number' | 'currency' | 'percent'>('number');

    const selectedNode = nodes.find(n => n.id === selectedId);
    const [title, setTitle] = useState(selectedNode ? (selectedNode.displayName || selectedNode.label) : 'Key Metric');

    const handleNodeChange = (id: string) => {
        setSelectedId(id);
        const node = nodes.find(n => n.id === id);
        if (node) {
            setTitle(node.displayName || node.label);

            // Auto-detect format
            const label = (node.displayName || node.label).toLowerCase();
            if (label.includes('cost') || label.includes('price') || label.includes('salary') || label.includes('revenue')) {
                setFormat('currency');
            } else if (label.includes('rate') || label.includes('percent') || label.includes('roi') || label.includes('margin')) {
                setFormat('percent');
            } else {
                setFormat('number');
            }
        }
    };

    const handleNext = () => {
        if (!selectedId) return;

        onConfigure({
            type: 'kpi',
            title,
            nodeId: selectedId,
            visualType: 'number', // Only number supported for now
            format
        });
    };

    // Filter out nodes that don't have numeric results
    const validNodes = nodes.filter(node => {
        const val = results[node.id] ?? results[node.label];
        return typeof val === 'number';
    });

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Configure Key Number</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto border rounded-md p-4 mb-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-2">Select a value to highlight:</p>
                <div className="space-y-2">
                    {validNodes.map(node => {
                        const val = results[node.id] ?? results[node.label];
                        return (
                            <label key={node.id} className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-all ${selectedId === node.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-white border-gray-200'}`}>
                                <input
                                    type="radio"
                                    name="kpiNode"
                                    checked={selectedId === node.id}
                                    onChange={() => handleNodeChange(node.id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1 flex justify-between">
                                    <span className="font-medium text-gray-700">{node.displayName || node.label}</span>
                                    <span className="text-gray-500 font-mono font-bold">{typeof val === 'number' ? val.toLocaleString() : '-'}</span>
                                </div>
                            </label>
                        );
                    })}
                    {validNodes.length === 0 && (
                        <p className="text-gray-400 italic text-center py-4">No calculated numeric values found.</p>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Format:</p>
                <div className="flex space-x-4">
                    <label className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer ${format === 'number' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="format" value="number" checked={format === 'number'} onChange={() => setFormat('number')} />
                        <span>1,234</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer ${format === 'currency' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="format" value="currency" checked={format === 'currency'} onChange={() => setFormat('currency')} />
                        <span>$1,234</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer ${format === 'percent' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                        <input type="radio" name="format" value="percent" checked={format === 'percent'} onChange={() => setFormat('percent')} />
                        <span>12.3%</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
                <button
                    onClick={onBack}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!selectedId}
                    className={`px-6 py-2 rounded-md font-medium text-white ${!selectedId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    Preview
                </button>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import type { GraphNode } from '../../../api';

interface CompareConfigProps {
    nodes: GraphNode[];
    results: Record<string, any>;
    onConfigure: (config: any) => void;
    onBack: () => void;
}

export const CompareConfig: React.FC<CompareConfigProps> = ({ nodes, results, onConfigure, onBack }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [visualType, setVisualType] = useState<'bar' | 'pie'>('bar');
    const [title, setTitle] = useState('Comparison');

    const toggleNode = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleNext = () => {
        onConfigure({
            type: 'compare',
            title,
            nodeIds: selectedIds,
            visualType
        });
    };

    // Filter out nodes that don't have numeric results
    const validNodes = nodes.filter(node => {
        const val = results[node.id] ?? results[node.label];
        return typeof val === 'number';
    });

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Configure Comparison</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Chart Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto border rounded-md p-4 mb-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-2">Select values to compare:</p>
                <div className="space-y-2">
                    {validNodes.map(node => {
                        const val = results[node.id] ?? results[node.label];
                        return (
                            <label key={node.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(node.id)}
                                    onChange={() => toggleNode(node.id)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1 flex justify-between">
                                    <span className="font-medium text-gray-700">{node.displayName || node.label}</span>
                                    <span className="text-gray-500 font-mono">{typeof val === 'number' ? val.toLocaleString() : '-'}</span>
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
                <p className="text-sm font-medium text-gray-700 mb-2">Chart Type:</p>
                <div className="flex space-x-4">
                    <label className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-all ${visualType === 'bar' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="visualType"
                            value="bar"
                            checked={visualType === 'bar'}
                            onChange={() => setVisualType('bar')}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>📊 Bar Chart</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-all ${visualType === 'pie' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="visualType"
                            value="pie"
                            checked={visualType === 'pie'}
                            onChange={() => setVisualType('pie')}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>🥧 Pie Chart</span>
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
                    disabled={selectedIds.length < 2}
                    className={`px-6 py-2 rounded-md font-medium text-white ${selectedIds.length < 2 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    Preview Chart
                </button>
            </div>
        </div>
    );
};

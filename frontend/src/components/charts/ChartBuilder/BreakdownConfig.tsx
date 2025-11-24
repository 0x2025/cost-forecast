import React, { useState } from 'react';
import type { RangeGroup } from '../utils/rangeDetector';

interface BreakdownConfigProps {
    rangeGroups: RangeGroup[];
    onConfigure: (config: any) => void;
    onBack: () => void;
}

export const BreakdownConfig: React.FC<BreakdownConfigProps> = ({ rangeGroups, onConfigure, onBack }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [visualType, setVisualType] = useState<'bar' | 'line'>('bar');

    const selectedGroup = rangeGroups.find(g => g.parentId === selectedGroupId);
    const [title, setTitle] = useState(selectedGroup ? `${selectedGroup.parentLabel} Breakdown` : 'Breakdown');

    // Update title when selection changes if user hasn't typed a custom title
    const handleGroupChange = (groupId: string) => {
        setSelectedGroupId(groupId);
        const group = rangeGroups.find(g => g.parentId === groupId);
        if (group) {
            setTitle(`${group.parentLabel} Breakdown`);
        }
    };

    const handleNext = () => {
        if (!selectedGroupId) return;

        onConfigure({
            type: 'breakdown',
            title,
            rangeNodeId: selectedGroupId,
            visualType
        });
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Configure Breakdown</h2>

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
                <p className="text-sm text-gray-500 mb-2">Select a collection to visualize:</p>
                <div className="space-y-2">
                    {rangeGroups.map(group => (
                        <label key={group.parentId} className={`flex items-start space-x-3 p-3 border rounded-md cursor-pointer transition-all ${selectedGroupId === group.parentId ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-white border-gray-200'}`}>
                            <input
                                type="radio"
                                name="rangeGroup"
                                checked={selectedGroupId === group.parentId}
                                onChange={() => handleGroupChange(group.parentId)}
                                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="font-bold text-gray-800 block">{group.parentLabel}</span>
                                <span className="text-xs text-gray-500 block mb-1">{group.items.length} items</span>
                                <div className="text-xs text-gray-600 pl-2 border-l-2 border-gray-300">
                                    {group.items.slice(0, 3).map(item => (
                                        <div key={item.id} className="truncate">{item.displayName || item.label}</div>
                                    ))}
                                    {group.items.length > 3 && <div className="italic">...and {group.items.length - 3} more</div>}
                                </div>
                            </div>
                        </label>
                    ))}
                    {rangeGroups.length === 0 && (
                        <p className="text-gray-400 italic text-center py-4">
                            No collections (range items) found in the graph.
                            <br />
                            <span className="text-xs">Try using the Range() function in your DSL.</span>
                        </p>
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
                    <label className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-all ${visualType === 'line' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}>
                        <input
                            type="radio"
                            name="visualType"
                            value="line"
                            checked={visualType === 'line'}
                            onChange={() => setVisualType('line')}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>📈 Line Chart</span>
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
                    disabled={!selectedGroupId}
                    className={`px-6 py-2 rounded-md font-medium text-white ${!selectedGroupId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    Preview Chart
                </button>
            </div>
        </div>
    );
};

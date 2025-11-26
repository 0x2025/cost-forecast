import React, { useState, useEffect } from 'react';
import type { RangeGroup } from '../utils/rangeDetector';

interface BreakdownConfigProps {
    rangeGroups: RangeGroup[];
    results: Record<string, any>;
    onConfigure: (config: any) => void;
    onBack: () => void;
}

export const BreakdownConfig: React.FC<BreakdownConfigProps> = ({ rangeGroups, results, onConfigure, onBack }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [visualType, setVisualType] = useState<'bar' | 'line'>('bar');
    const [labelSourceId, setLabelSourceId] = useState<string | null>(null);
    const [labelKey, setLabelKey] = useState<string | null>(null);
    const [availableLabelKeys, setAvailableLabelKeys] = useState<string[]>([]);
    const [potentialLabelSources, setPotentialLabelSources] = useState<{ id: string, label: string }[]>([]);

    const selectedGroup = rangeGroups.find(g => g.parentId === selectedGroupId);
    const [title, setTitle] = useState(selectedGroup ? `${selectedGroup.parentLabel} Breakdown` : 'Breakdown');

    // Update title when selection changes if user hasn't typed a custom title
    const handleGroupChange = (groupId: string) => {
        setSelectedGroupId(groupId);
        const group = rangeGroups.find(g => g.parentId === groupId);
        if (group) {
            setTitle(`${group.parentLabel} Breakdown`);
        }
        // Reset label selection
        setLabelSourceId(null);
        setLabelKey(null);
    };

    // Find potential label sources when group changes
    useEffect(() => {
        if (!selectedGroupId) {
            setPotentialLabelSources([]);
            return;
        }

        // Instead of relying on graph edges, directly examine all results
        // to find arrays of objects that could be label sources
        const validSources: { id: string, label: string }[] = [];

        Object.entries(results).forEach(([key, value]) => {
            // Check if it's an array of objects
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                validSources.push({ id: key, label: key });
            }
        });

        setPotentialLabelSources(validSources);

        // Auto-select first valid source if available
        if (validSources.length > 0) {
            setLabelSourceId(validSources[0].id);
        }
    }, [selectedGroupId, results]);

    // Update available keys when label source changes
    useEffect(() => {
        if (!labelSourceId) {
            setAvailableLabelKeys([]);
            return;
        }

        const value = results[labelSourceId];
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            setAvailableLabelKeys(Object.keys(value[0]));
            // Auto-select 'name' or 'label' or 'id' if present
            const keys = Object.keys(value[0]);
            const preferred = keys.find(k => ['name', 'label', 'title', 'id'].includes(k.toLowerCase()));
            if (preferred) {
                setLabelKey(preferred);
            } else if (keys.length > 0) {
                setLabelKey(keys[0]);
            }
        }
    }, [labelSourceId, results]);

    const handleNext = () => {
        if (!selectedGroupId) return;

        onConfigure({
            type: 'breakdown',
            title,
            rangeNodeId: selectedGroupId,
            visualType,
            labelSourceId,
            labelKey
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

            {selectedGroupId && potentialLabelSources.length > 0 && (
                <div className="mb-6 p-5 bg-slate-50 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Series Labels</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider">Label Source</label>
                            <select
                                value={labelSourceId || ''}
                                onChange={(e) => setLabelSourceId(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium hover:border-slate-400"
                            >
                                {potentialLabelSources.map(src => (
                                    <option key={src.id} value={src.id}>{src.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wider">Label Property</label>
                            <select
                                value={labelKey || ''}
                                onChange={(e) => setLabelKey(e.target.value)}
                                disabled={!labelSourceId}
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium hover:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                {availableLabelKeys.map(key => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

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

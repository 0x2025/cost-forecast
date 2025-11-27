import React from 'react';

export type ChartPattern = 'compare' | 'breakdown' | 'kpi';

interface PatternSelectorProps {
    onSelect: (pattern: ChartPattern) => void;
}

export const PatternSelector: React.FC<PatternSelectorProps> = ({ onSelect }) => {
    return (
        <div className="space-y-4 h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">What do you want to show?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => onSelect('compare')}
                    className="p-6 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                    <h3 className="font-bold text-lg mb-2">Compare Values</h3>
                    <p className="text-sm text-gray-600">
                        Compare multiple calculated values side-by-side (e.g., Labor vs Material).
                    </p>
                </button>

                <button
                    onClick={() => onSelect('breakdown')}
                    className="p-6 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📈</div>
                    <h3 className="font-bold text-lg mb-2">Show Breakdown</h3>
                    <p className="text-sm text-gray-600">
                        Visualize a collection of items (e.g., salaries of all employees).
                    </p>
                </button>

                <button
                    onClick={() => onSelect('kpi')}
                    className="p-6 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
                    <h3 className="font-bold text-lg mb-2">Show Key Number</h3>
                    <p className="text-sm text-gray-600">
                        Highlight a single important metric (e.g., Total Cost, ROI).
                    </p>
                </button>
            </div>
        </div>
    );
};

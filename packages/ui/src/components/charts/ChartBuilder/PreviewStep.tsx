import React from 'react';
import type { GraphNode } from '@costvela/types';
import { extractCompareData, extractRangeData, extractKPIValue } from '../utils/chartDataExtractor';
import { BarChart } from '../ChartDisplay/BarChart';
import { PieChart } from '../ChartDisplay/PieChart';
import { LineChart } from '../ChartDisplay/LineChart';
import { KPICard } from '../ChartDisplay/KPICard';

interface PreviewStepProps {
    config: any;
    nodes: GraphNode[];
    results: Record<string, any>;
    onSave: () => void;
    onBack: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ config, nodes, results, onSave, onBack }) => {

    const renderPreview = () => {
        if (config.type === 'compare') {
            const chartData = extractCompareData(config.nodeIds, nodes, results);
            if (config.visualType === 'bar') return <BarChart data={chartData.data} />;
            if (config.visualType === 'pie') return <PieChart data={chartData.data} />;
        }

        if (config.type === 'breakdown') {
            const chartData = extractRangeData(config.rangeNodeId, nodes, results, config.labelSourceId, config.labelKey);
            if (config.visualType === 'bar') return <BarChart data={chartData.data} />;
            if (config.visualType === 'line') return <LineChart data={chartData.data} />;
        }

        if (config.type === 'kpi') {
            const kpiData = extractKPIValue(config.nodeId, nodes, results);
            if (kpiData) {
                return <KPICard value={kpiData.value} label={config.title} format={config.format} />;
            }
        }

        return <div>Preview not available</div>;
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Preview Chart</h2>

            <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm mb-6 flex flex-col">
                <h3 className="text-center font-bold text-lg mb-4">{config.title}</h3>
                <div className="flex-1 min-h-[300px]">
                    {renderPreview()}
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
                    onClick={onSave}
                    className="px-6 py-2 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 shadow-sm"
                >
                    Save Chart
                </button>
            </div>
        </div>
    );
};

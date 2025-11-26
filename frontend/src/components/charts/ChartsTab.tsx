import React, { useState, useEffect } from 'react';
import type { GraphNode } from '../../api';
import { ChartBuilder } from './ChartBuilder/ChartBuilder';
import { ChartCard } from './ChartDisplay/ChartCard';
import { BarChart } from './ChartDisplay/BarChart';
import { PieChart } from './ChartDisplay/PieChart';
import { LineChart } from './ChartDisplay/LineChart';
import { KPICard } from './ChartDisplay/KPICard';
import { extractCompareData, extractRangeData, extractKPIValue } from './utils/chartDataExtractor';

interface ChartsTabProps {
    nodes: GraphNode[];
    results: Record<string, any>;
    onRefresh: () => void;
}

interface ChartConfig {
    id: string;
    type: 'compare' | 'breakdown' | 'kpi';
    title: string;
    [key: string]: any;
}

export const ChartsTab: React.FC<ChartsTabProps> = ({ nodes, results, onRefresh }) => {
    const [charts, setCharts] = useState<ChartConfig[]>(() => {
        const saved = localStorage.getItem('costForecast_charts');
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load charts', e);
            return [];
        }
    });
    const [showBuilder, setShowBuilder] = useState(false);

    // Save charts to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('costForecast_charts', JSON.stringify(charts));
    }, [charts]);

    const handleAddChart = (config: ChartConfig) => {
        setCharts([...charts, config]);
        setShowBuilder(false);
    };

    const handleDeleteChart = (id: string) => {
        setCharts(charts.filter(c => c.id !== id));
    };

    const handleTitleChange = (id: string, newTitle: string) => {
        setCharts(charts.map(c => c.id === id ? { ...c, title: newTitle } : c));
    };

    const renderChart = (config: ChartConfig) => {
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
            } else {
                return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Value not found</div>;
            }
        }

        return <div>Unknown chart type</div>;
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            <div className="p-4 border-b-2 border-slate-900 bg-white flex justify-between items-center z-10">
                <div>
                    <h2 className="font-serif text-xl font-semibold text-slate-900">Dashboard</h2>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {charts.length} chart{charts.length !== 1 ? 's' : ''} • Auto-saved
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={onRefresh}
                        className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-300 hover:border-slate-900 transition-colors flex items-center font-medium"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                    </button>
                    <button
                        onClick={() => setShowBuilder(true)}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-semibold flex items-center transition-colors text-sm uppercase tracking-wide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create Chart
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {charts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="bg-white p-6 rounded-2xl shadow-sm mb-4 border border-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">No charts yet</h3>
                        <p className="max-w-xs text-center mb-6 text-sm text-slate-500">
                            Create charts to visualize your cost model. Compare values, show breakdowns, or highlight key metrics.
                        </p>
                        <button
                            onClick={() => setShowBuilder(true)}
                            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-all font-semibold text-sm uppercase tracking-wide"
                        >
                            + Create Your First Chart
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {charts.map(config => (
                            <div key={config.id} className="h-[350px]">
                                <ChartCard
                                    title={config.title}
                                    onDelete={() => handleDeleteChart(config.id)}
                                    onTitleChange={(newTitle) => handleTitleChange(config.id, newTitle)}
                                >
                                    {renderChart(config)}
                                </ChartCard>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showBuilder && (
                <ChartBuilder
                    nodes={nodes}
                    results={results}
                    onSave={handleAddChart}
                    onCancel={() => setShowBuilder(false)}
                />
            )}
        </div>
    );
};

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import type { SensitivitySeries } from '../../../api';

import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';

interface SensitivityChartProps {
    data: SensitivitySeries[];
    height?: number;
}

interface ChartItemProps {
    outputName: string;
    seriesList: SensitivitySeries[];
    height: number;
    colors: string[];
}

const SensitivityChartItem: React.FC<ChartItemProps> = ({ outputName, seriesList, height, colors }) => {
    const [ref, isVisible] = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true,
        rootMargin: '200px' // Start loading before it comes into view
    });

    return (
        <div ref={ref as any} className="w-full bg-white p-4 rounded-lg border border-slate-200 shadow-sm min-h-[400px]">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 font-serif">
                Sensitivity: {outputName}
            </h3>
            <div style={{ height: height }}>
                {isVisible ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 25,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                type="number"
                                dataKey="inputPercentChange"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(value) => `${value}%`}
                                label={{ value: '% Change in Input', position: 'bottom', offset: 0 }}
                            />
                            <YAxis
                                label={{ value: '% Change in Output', angle: -90, position: 'insideLeft' }}
                                tickFormatter={(value) => `${value.toFixed(1)}%`}
                            />
                            <Tooltip
                                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Output Change']}
                                labelFormatter={(label) => `Input Change: ${label}%`}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.375rem',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

                            {seriesList.map((series, index) => (
                                <Line
                                    key={series.inputName}
                                    data={series.points}
                                    type="monotone"
                                    dataKey="outputPercentChange"
                                    name={series.inputName}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded animate-pulse">
                        <span className="text-slate-400 text-sm">Loading chart...</span>
                    </div>
                )}
            </div>
            <div className="mt-4 text-xs text-slate-500 text-center">
                * Steeper slopes indicate higher sensitivity. Horizontal lines indicate no sensitivity.
            </div>
        </div>
    );
};

export const SensitivityChart: React.FC<SensitivityChartProps> = ({ data, height = 400 }) => {
    // Group series by output name
    const seriesByOutput = useMemo(() => {
        const grouped: Record<string, SensitivitySeries[]> = {};
        data.forEach(series => {
            if (!grouped[series.outputName]) {
                grouped[series.outputName] = [];
            }
            grouped[series.outputName].push(series);
        });
        return grouped;
    }, [data]);

    // Generate colors for different inputs
    const colors = [
        '#0f172a', // slate-900
        '#3b82f6', // blue-500
        '#ef4444', // red-500
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#8b5cf6', // violet-500
        '#ec4899', // pink-500
        '#06b6d4', // cyan-500
    ];

    return (
        <div className="space-y-8">
            {Object.entries(seriesByOutput).map(([outputName, seriesList]) => (
                <SensitivityChartItem
                    key={outputName}
                    outputName={outputName}
                    seriesList={seriesList}
                    height={height}
                    colors={colors}
                />
            ))}
        </div>
    );
};

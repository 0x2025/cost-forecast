import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import type { CostDriver } from '@costvela/types';
import { formatNumber } from '../../../utils/formatting';

interface TornadoChartProps {
    data: CostDriver[];
    height?: number;
}

export const TornadoChart: React.FC<TornadoChartProps> = ({ data, height = 400 }) => {
    // Sort data by impact score descending for better visualization
    const sortedData = [...data].sort((a, b) => b.impactScore - a.impactScore);

    return (
        <div className="w-full bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 font-serif">Top Cost Drivers (Impact Score)</h3>
            <div style={{ height: height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={sortedData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 100, // Increase left margin for long labels
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                        <YAxis
                            type="category"
                            dataKey="inputName"
                            width={150}
                            tick={{ fontSize: 12, fill: '#475569' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.375rem',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value: number) => [formatNumber(value), 'Impact Score']}
                        />
                        <Bar dataKey="impactScore" fill="#0f172a" radius={[0, 4, 4, 0]}>
                            {sortedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#0f172a' : '#64748b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-xs text-slate-500 text-center">
                * Impact Score represents the elasticity of the output relative to the input. Higher score means greater sensitivity.
            </div>
        </div>
    );
};

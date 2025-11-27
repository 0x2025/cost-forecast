import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ChartDataPoint } from '../utils/chartDataExtractor';

interface BarChartProps {
    data: ChartDataPoint[];
}

// Executive Consulting Colors
const COLORS = ['#0f766e', '#0052cc', '#b45309', '#020617', '#475569', '#0891b2'];

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontFamily: 'var(--font-sans)' }}
                    stroke="#64748b"
                />
                <YAxis
                    tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)}
                    tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    stroke="#64748b"
                />
                <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px'
                    }}
                    formatter={(value: number) => [new Intl.NumberFormat('en-US').format(value), 'Value']}
                />
                <Bar dataKey="value" fill="#0f766e">
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

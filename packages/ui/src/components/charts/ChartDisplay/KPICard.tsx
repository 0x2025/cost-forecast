import React from 'react';

interface KPICardProps {
    value: number;
    label: string;
    format?: 'number' | 'currency' | 'percent';
}

export const KPICard: React.FC<KPICardProps> = ({ value, label, format = 'number' }) => {
    const formatValue = (val: number) => {
        if (format === 'currency') {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        }
        if (format === 'percent') {
            return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(val / 100); // Assuming value is 0-100 or 0-1
        }
        return new Intl.NumberFormat('en-US').format(val);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl font-bold text-teal-700 mb-3 font-mono tracking-tight">
                {formatValue(value)}
            </div>
            <div className="text-slate-600 font-serif font-semibold text-center text-base">
                {label}
            </div>
        </div>
    );
};

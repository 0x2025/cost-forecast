import { useState } from 'react';

interface SliderInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    options?: string[]; // For discrete sliders with labels
    onChange: (value: number) => void;
}

export const SliderInput = ({
    label,
    value,
    min,
    max,
    step,
    unit = '',
    options,
    onChange
}: SliderInputProps) => {
    const [isDragging, setIsDragging] = useState(false);

    const formatValue = (val: number) => {
        // Safety check for undefined or NaN
        if (val === undefined || val === null || isNaN(val)) {
            return '0';
        }

        if (options && options.length > 0) {
            const index = Math.round(val) - 1;
            return options[index] || val.toString();
        }

        // Format numbers with commas for large values
        if (val >= 1000 && !unit.startsWith('%')) {
            return val.toLocaleString('en-US');
        }

        return val.toString();
    };

    const percentage = value !== undefined && !isNaN(value)
        ? ((value - min) / (max - min)) * 100
        : 0;

    return (
        <div className="space-y-2">
            {/* Label and Value */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
                <div className={`text-sm font-bold transition-all ${isDragging ? 'text-executive-blue scale-110' : 'text-slate-900'
                    }`}>
                    {formatValue(value)}{unit}
                </div>
            </div>

            {/* Slider Track */}
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value || min}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="slider-input w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #1e40af 0%, #1e40af ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`
                    }}
                />
            </div>

            {/* Min/Max Labels */}
            {!options && (
                <div className="flex justify-between text-xs text-slate-400">
                    <span>{formatValue(min)}{unit}</span>
                    <span>{formatValue(max)}{unit}</span>
                </div>
            )}
        </div>
    );
};

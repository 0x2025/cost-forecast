import React, { useState } from 'react';
import type { GraphNode } from '@costvela/types';
import { PatternSelector, type ChartPattern } from './PatternSelector';
import { CompareConfig } from './CompareConfig';
import { BreakdownConfig } from './BreakdownConfig';
import { KPIConfig } from './KPIConfig';
import { PreviewStep } from './PreviewStep';
import { detectRangeGroups } from '../utils/rangeDetector';

interface ChartBuilderProps {
    nodes: GraphNode[];
    results: Record<string, any>;
    onSave: (config: any) => void;
    onCancel: () => void;
}

export const ChartBuilder: React.FC<ChartBuilderProps> = ({ nodes, results, onSave, onCancel }) => {
    const [step, setStep] = useState<'pattern' | 'config' | 'preview'>('pattern');
    const [pattern, setPattern] = useState<ChartPattern | null>(null);
    const [config, setConfig] = useState<any>(null);

    const handlePatternSelect = (p: ChartPattern) => {
        setPattern(p);
        setStep('config');
    };

    const handleConfig = (cfg: any) => {
        setConfig(cfg);
        setStep('preview');
    };

    const handleSave = () => {
        onSave({
            ...config,
            id: crypto.randomUUID()
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col relative z-10 overflow-hidden ring-1 ring-gray-200">
                <div className="p-4 border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Create New Chart</h1>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-hidden flex flex-col">
                    {step === 'pattern' && (
                        <PatternSelector onSelect={handlePatternSelect} />
                    )}

                    {step === 'config' && pattern === 'compare' && (
                        <CompareConfig
                            nodes={nodes}
                            results={results}
                            onConfigure={handleConfig}
                            onBack={() => setStep('pattern')}
                        />
                    )}

                    {step === 'config' && pattern === 'breakdown' && (
                        <BreakdownConfig
                            rangeGroups={detectRangeGroups(nodes)}
                            results={results}
                            onConfigure={handleConfig}
                            onBack={() => setStep('pattern')}
                        />
                    )}

                    {step === 'config' && pattern === 'kpi' && (
                        <KPIConfig
                            nodes={nodes}
                            results={results}
                            onConfigure={handleConfig}
                            onBack={() => setStep('pattern')}
                        />
                    )}

                    {step === 'preview' && config && (
                        <PreviewStep
                            config={config}
                            nodes={nodes}
                            results={results}
                            onSave={handleSave}
                            onBack={() => setStep('config')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

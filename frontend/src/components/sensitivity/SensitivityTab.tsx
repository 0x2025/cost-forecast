import React, { useState } from 'react';
import { api, type SensitivityResponse } from '../../api';
import type { InputRow } from '../../InputGrid';
import { TornadoChart } from '../charts/ChartDisplay/TornadoChart';

interface SensitivityTabProps {
    source: string;
    inputs: InputRow[];
}

export const SensitivityTab: React.FC<SensitivityTabProps> = ({ source, inputs }) => {
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [rangePercent, setRangePercent] = useState(40);
    const [steps, setSteps] = useState(5);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SensitivityResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Convert InputRow[] to Record<string, any>
    const inputRecord = inputs.reduce((acc, row) => {
        if (row.key.trim()) acc[row.key] = row.value;
        return acc;
    }, {} as Record<string, any>);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            // In auto mode, we send empty inputsToVary to let backend detect drivers
            // In manual mode, we would send selected inputs (future feature)
            const inputsToVary: string[] = [];

            // For now, we track all numeric outputs. In future, we can let user select.
            const outputMetrics: string[] = [];

            const response = await api.analyzeSensitivity(
                source,
                inputRecord,
                inputsToVary,
                outputMetrics,
                {
                    steps,
                    rangePercent
                }
            );

            setResults(response);

            if (response.errors && response.errors.length > 0) {
                setError(`Analysis failed: ${response.errors[0].message}`);
            }
        } catch (err: any) {
            console.error('Sensitivity analysis failed:', err);
            setError(err.message || 'Failed to perform sensitivity analysis');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* Header */}
            <div className="p-4 border-b-2 border-slate-900 bg-white flex justify-between items-center">
                <div>
                    <h2 className="font-serif text-xl font-semibold text-slate-900">Sensitivity Analysis</h2>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        Identify Key Cost Drivers
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm uppercase tracking-wide flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            'Run Analysis'
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Configuration Panel */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">Analysis Mode</label>
                                <div className="flex rounded-md shadow-sm">
                                    <button
                                        onClick={() => setMode('auto')}
                                        className={`flex-1 px-4 py-2 text-sm font-medium border rounded-l-md focus:z-10 focus:ring-1 focus:ring-slate-900 ${mode === 'auto'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        Auto-Detect Drivers
                                    </button>
                                    <button
                                        onClick={() => setMode('manual')}
                                        disabled
                                        title="Manual selection coming soon"
                                        className={`flex-1 px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-md focus:z-10 focus:ring-1 focus:ring-slate-900 ${mode === 'manual'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-slate-50 text-slate-400 border-slate-300 cursor-not-allowed'
                                            }`}
                                    >
                                        Manual Selection
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">
                                    Variation Range (±{rangePercent}%)
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="10"
                                    value={rangePercent}
                                    onChange={(e) => setRangePercent(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>10%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">
                                    Analysis Steps ({steps})
                                </label>
                                <input
                                    type="range"
                                    min="3"
                                    max="20"
                                    step="1"
                                    value={steps}
                                    onChange={(e) => setSteps(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>3</span>
                                    <span>20</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {results.keyDrivers.length > 0 ? (
                                <TornadoChart data={results.keyDrivers} />
                            ) : (
                                <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
                                    <p>No significant cost drivers found for the given range.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {!results && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p>Click "Run Analysis" to identify key cost drivers</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

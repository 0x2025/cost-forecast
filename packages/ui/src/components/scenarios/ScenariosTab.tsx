import React, { useState } from 'react';
import { api } from '@costvela/api-client';
import type { BatchCalculationResponse, InputRow } from '@costvela/types';
import { formatLabel } from '../../utils/formatting';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface ScenariosTabProps {
    source: string;
    baselineInputs: InputRow[];
    onRefresh?: () => void;
    translations?: Record<string, string>;
}

interface Scenario {
    id: string;
    name: string;
    inputs: Record<string, any>;
}

const COLORS = ['#0f172a', '#0f766e', '#b45309', '#0052cc', '#ef4444', '#8b5cf6'];

export const ScenariosTab: React.FC<ScenariosTabProps> = ({ source, baselineInputs, translations }) => {
    const [scenarios, setScenarios] = useState<Scenario[]>([
        {
            id: 'baseline',
            name: 'Baseline',
            inputs: baselineInputs.reduce((acc, row) => {
                if (row.key.trim()) acc[row.key] = row.value;
                return acc;
            }, {} as Record<string, any>)
        }
    ]);
    const [results, setResults] = useState<BatchCalculationResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddScenario = () => {
        const name = prompt('Enter scenario name:');
        if (name) {
            const newScenario: Scenario = {
                id: Date.now().toString(),
                name,
                inputs: { ...scenarios[0].inputs } // Copy baseline
            };
            setScenarios([...scenarios, newScenario]);
        }
    };

    const handleRemoveScenario = (id: string) => {
        if (id === 'baseline') {
            alert('Cannot remove baseline scenario');
            return;
        }
        setScenarios(scenarios.filter(s => s.id !== id));
        // Remove from results too
        if (results) {
            const newResults = { ...results };
            const scenarioName = scenarios.find(s => s.id === id)?.name;
            if (scenarioName) {
                delete newResults.results[scenarioName];
            }
            setResults(newResults);
        }
    };

    const handleRunAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const scenarioMap = scenarios.reduce((acc, scenario) => {
                acc[scenario.name] = scenario.inputs;
                return acc;
            }, {} as Record<string, Record<string, any>>);

            const response = await api.calculateBatch(source, scenarioMap);
            setResults(response);

            // Check for API level errors
            if (response.errors && response.errors.length > 0) {
                setError(`Calculation failed: ${response.errors[0].message}`);
            }
        } catch (err: any) {
            console.error('Failed to run scenarios:', err);
            setError(err.message || 'Failed to run scenarios');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (scenarioId: string, key: string, value: string) => {
        setScenarios(scenarios.map(s => {
            if (s.id === scenarioId) {
                return {
                    ...s,
                    inputs: { ...s.inputs, [key]: value }
                };
            }
            return s;
        }));
    };

    // Get all unique input keys
    const allInputKeys = Array.from(
        new Set(scenarios.flatMap(s => Object.keys(s.inputs)))
    );

    // Get all unique result keys from the first scenario's results
    const resultKeys = (results && results.results && scenarios[0] && results.results[scenarios[0].name]?.results)
        ? Object.keys(results.results[scenarios[0].name].results)
        : [];

    // Prepare chart data
    const chartData = scenarios.map(scenario => {
        const scenarioResults = results?.results[scenario.name]?.results || {};
        const dataPoint: any = { name: scenario.name };

        resultKeys.forEach(key => {
            const val = scenarioResults[key];
            if (typeof val === 'number') {
                dataPoint[key] = val;
            }
        });

        return dataPoint;
    });

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* Header */}
            <div className="p-4 border-b-2 border-slate-900 bg-white flex justify-between items-center">
                <div>
                    <h2 className="font-serif text-xl font-semibold text-slate-900">Scenario Comparison</h2>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleAddScenario}
                        className="px-4 py-2 text-sm border border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-colors font-medium"
                    >
                        + Add Scenario
                    </button>
                    <button
                        onClick={handleRunAll}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm uppercase tracking-wide flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running...
                            </>
                        ) : (
                            'Run All Scenarios'
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {scenarios.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>No scenarios defined</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Table */}
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">
                                                Variable
                                            </th>
                                            {scenarios.map(scenario => (
                                                <th key={scenario.id} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-bold">{scenario.name}</span>
                                                        {scenario.id !== 'baseline' && (
                                                            <button
                                                                onClick={() => handleRemoveScenario(scenario.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                                title="Remove scenario"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {/* Inputs Section */}
                                        <tr className="bg-slate-100">
                                            <td colSpan={scenarios.length + 1} className="px-4 py-2 text-xs font-semibold text-slate-700 uppercase">
                                                Inputs
                                            </td>
                                        </tr>
                                        {allInputKeys.map(key => (
                                            <tr key={key} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                                                    {formatLabel(key, translations)}
                                                </td>
                                                {scenarios.map(scenario => (
                                                    <td key={scenario.id} className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={scenario.inputs[key] || ''}
                                                            onChange={(e) => handleInputChange(scenario.id, key, e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 text-center"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}

                                        {/* Results Section */}
                                        {results && resultKeys.length > 0 && (
                                            <>
                                                <tr className="bg-slate-100">
                                                    <td colSpan={scenarios.length + 1} className="px-4 py-2 text-xs font-semibold text-slate-700 uppercase">
                                                        Results
                                                    </td>
                                                </tr>
                                                {resultKeys.map(key => {
                                                    const baselineValue = results.results[scenarios[0]?.name]?.results?.[key];
                                                    return (
                                                        <tr key={key} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                                                                {formatLabel(key, translations)}
                                                            </td>
                                                            {scenarios.map((scenario, idx) => {
                                                                const value = results.results[scenario.name]?.results?.[key];
                                                                const isBaseline = idx === 0;
                                                                let delta = '';
                                                                let deltaClass = '';

                                                                if (!isBaseline && typeof value === 'number' && typeof baselineValue === 'number' && baselineValue !== 0) {
                                                                    const percentChange = ((value - baselineValue) / baselineValue) * 100;
                                                                    delta = percentChange > 0 ? `▲${percentChange.toFixed(1)}%` : `▼${Math.abs(percentChange).toFixed(1)}%`;
                                                                    deltaClass = percentChange > 0 ? 'text-green-600' : percentChange < 0 ? 'text-red-600' : 'text-slate-500';
                                                                }

                                                                return (
                                                                    <td key={scenario.id} className="px-4 py-3 text-center">
                                                                        <div className="font-mono text-sm text-slate-900">
                                                                            {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                                                        </div>
                                                                        {delta && (
                                                                            <div className={`text-xs font-semibold mt-1 ${deltaClass}`}>
                                                                                {delta}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* TEST: Chart should appear below */}
                        {results && Object.keys(results.results).length > 0 ? (
                            <div className="bg-green-100 p-4 text-center">
                                ✅ Chart condition TRUE - Chart should render here
                                <div className="text-xs">chartData length: {chartData.length}, resultKeys: {resultKeys.length}</div>
                            </div>
                        ) : (
                            <div className="bg-red-100 p-4 text-center">
                                ❌ Chart condition FALSE - results: {results ? 'exists' : 'null'}
                            </div>
                        )}

                        {/* Charts Section - Show if we have results */}
                        {results && Object.keys(results.results).length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Visual Comparison</h3>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            {resultKeys.filter(key => typeof chartData[0]?.[key] === 'number').map((key, index) => (
                                                <Bar
                                                    key={key}
                                                    dataKey={key}
                                                    name={formatLabel(key, translations)}
                                                    fill={COLORS[index % COLORS.length]}
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

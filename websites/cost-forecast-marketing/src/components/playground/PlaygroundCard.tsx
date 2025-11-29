import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SliderInput } from './SliderInput';
import type { PlaygroundConfig } from '../../data/playgroundData';

interface PlaygroundCardProps {
    config: PlaygroundConfig;
}

export const PlaygroundCard = ({ config }: PlaygroundCardProps) => {
    const [inputs, setInputs] = useState<Record<string, number>>(() => {
        const initialInputs: Record<string, number> = {};
        config.inputs.forEach(input => {
            initialInputs[input.key] = input.default;
        });
        return initialInputs;
    });

    const [showModelCode, setShowModelCode] = useState(false);

    // Calculate results in real-time
    const results = config.calculations(inputs);

    const handleInputChange = (key: string, value: number) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const handleScenarioClick = (scenarioInputs: Record<string, number>) => {
        setInputs(scenarioInputs);
    };

    const formatNumber = (num: number) => {
        if (num === undefined || num === null || isNaN(num)) {
            return 'N/A';
        }
        if (Number.isInteger(num)) {
            return num.toLocaleString('en-US');
        }
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    return (
        <div className="space-y-8">
            {/* Problem Statement */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-executive-navy mb-2">{config.tagline}</h3>
                <p className="text-slate-600 leading-relaxed">{config.problem}</p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Inputs */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                            Adjust Parameters
                        </h4>
                        <div className="space-y-6">
                            {config.inputs.map(input => (
                                <SliderInput
                                    key={input.key}
                                    label={input.label}
                                    value={inputs[input.key]}
                                    min={input.min}
                                    max={input.max}
                                    step={input.step}
                                    unit={input.unit}
                                    options={input.options}
                                    onChange={(value) => handleInputChange(input.key, value)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Scenario Buttons */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                            Quick Scenarios
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {config.scenarios.map((scenario, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleScenarioClick(scenario.inputs)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-executive-blue hover:text-executive-blue transition-colors"
                                    title={scenario.description}
                                >
                                    {scenario.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                            Calculated Results
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {Object.entries(results).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between"
                                >
                                    <span className="text-sm text-slate-600 capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xl font-bold text-executive-navy">
                                        {typeof value === 'number' ? formatNumber(value) : value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-executive-blue uppercase tracking-wide mb-3">
                    💡 Why This Beats Excel
                </h4>
                <ul className="space-y-2">
                    {config.insights.map((insight, idx) => (
                        <li key={idx} className="text-slate-700 text-sm leading-relaxed flex items-start">
                            <span className="text-executive-blue mr-2">•</span>
                            <span>{insight}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Model Code Viewer */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowModelCode(!showModelCode)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                >
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-700">View Model Code</span>
                        <span className="text-xs text-slate-500">(See the formula logic)</span>
                    </div>
                    {showModelCode ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </button>
                {showModelCode && (
                    <div className="bg-slate-900 p-6">
                        <pre className="text-sm text-slate-300 overflow-x-auto">
                            <code>{config.dsl}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { ScenarioDemo } from '../components/demo/ScenarioDemo';
import { SensitivityDemo } from '../components/demo/SensitivityDemo';
import { CASE_STUDY_INPUTS, OPTIMISTIC_SCENARIO_INPUTS, PESSIMISTIC_SCENARIO_INPUTS } from '../data/caseStudyData';
import type { InputRow } from '@costvela/types';
import type { Scenario } from '@costvela/ui';

export const CaseStudy = () => {
    // Lift baseline state to share between scenario and sensitivity demos
    const [baselineInputs, setBaselineInputs] = useState<InputRow[]>(CASE_STUDY_INPUTS);

    const handleBaselineChange = (inputs: InputRow[]) => {
        setBaselineInputs(inputs);
    };

    // Helper to convert InputRow[] to inputs object
    const inputRowsToObject = (rows: InputRow[]): Record<string, any> => {
        return rows.reduce((acc, row) => {
            if (row.key.trim()) acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, any>);
    };

    // Create initial scenarios
    const initialScenarios: Scenario[] = useMemo(() => [
        {
            id: 'baseline',
            name: 'Baseline',
            inputs: inputRowsToObject(baselineInputs)
        },
        {
            id: 'optimistic',
            name: 'Optimistic',
            inputs: inputRowsToObject(OPTIMISTIC_SCENARIO_INPUTS)
        },
        {
            id: 'pessimistic',
            name: 'Pessimistic',
            inputs: inputRowsToObject(PESSIMISTIC_SCENARIO_INPUTS)
        }
    ], [baselineInputs]);

    return (
        <div className="bg-white pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-16 border-b border-slate-200 pb-12">
                    <div className="flex items-center space-x-2 text-executive-blue font-semibold uppercase tracking-wider text-sm mb-4">
                        <span>Case Study</span>
                        <span>•</span>
                        <span>Manufacturing</span>
                        <span>•</span>
                        <span>2025</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-executive-navy mb-6">
                        Navigating 2025 Supply Chain Volatility
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
                        How a global manufacturing consultancy used CostVela to model energy price shocks and identify $2.4M in potential savings for their client.
                    </p>
                </div>

                {/* Challenge & Solution Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                    <div className="lg:col-span-3 space-y-12">
                        <section>
                            <h2 className="text-2xl font-serif font-bold text-executive-navy mb-4">The Challenge: When Excel Hits the Wall</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                In early 2025, energy markets faced unprecedented volatility due to new carbon taxation policies and geopolitical shifts. Our client, a Tier-1 automotive supplier, needed to understand how these fluctuations would impact their unit economics across 12 different product lines.
                            </p>
                            <p className="text-slate-600 leading-relaxed">
                                Their existing Excel models were massive, fragile beasts. Running a single sensitivity analysis meant manually changing a cell, recording the result, and repeating the process hundreds of times. It was slow, prone to copy-paste errors, and impossible to audit. The C-suite needed answers in minutes, not days.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-executive-navy mb-4">The Solution: Dynamic Graph Modeling</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Using CostVela's <strong>Dynamic Graph Engine</strong>, the consultancy built a digital twin of the client's cost structure. Unlike Excel, where logic is hidden in cells, CostVela maps every cost driver as a visible node in a dependency graph.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-executive-navy mb-2">Instant Scenario Switching</h3>
                                    <p className="text-slate-600 text-sm">
                                        Instead of saving 50 different versions of a spreadsheet, they created one master model with infinite scenarios. Switching between "Optimistic" and "Doomsday" views became a single click.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-executive-navy mb-2">Automated Sensitivity</h3>
                                    <p className="text-slate-600 text-sm">
                                        The team used our Sensitivity Analysis tool to automatically stress-test 20+ variables simultaneously. They instantly identified that <strong>Logistics Surcharges</strong>—not raw material costs—were the biggest risk factor.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>


                {/* Interactive Demos - Inline as requested */}
                <div className="mt-20 pt-16 border-t-2 border-slate-200">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-serif font-bold text-executive-navy mb-4">
                            Experience CostVela in Action
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Try our interactive demos below to see how CostVela enables powerful scenario analysis and sensitivity testing.
                        </p>
                    </div>

                    {/* Scenario Demo */}
                    <ScenarioDemo
                        baselineInputs={baselineInputs}
                        onBaselineChange={handleBaselineChange}
                        initialScenarios={initialScenarios}
                    />

                    {/* Sensitivity Demo */}
                    <SensitivityDemo baselineInputs={baselineInputs} />
                </div>

            </div>
        </div>
    );
};

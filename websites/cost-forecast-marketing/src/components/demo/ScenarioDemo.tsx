import React from 'react';
import { ScenariosTab, type Scenario } from '@costvela/ui';
import type { InputRow } from '@costvela/types';

import { CASE_STUDY_DSL } from '../../data/caseStudyData';

interface ScenarioDemoProps {
    baselineInputs: InputRow[];
    onBaselineChange: (inputs: InputRow[]) => void;
    initialScenarios?: Scenario[];
}

export const ScenarioDemo: React.FC<ScenarioDemoProps> = ({ baselineInputs, onBaselineChange, initialScenarios }) => {
    return (
        <div className="my-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Try It Yourself: Scenario Analysis
                    </h2>
                    <p className="text-lg text-gray-600">
                        Create and compare different cost scenarios using our interactive tool.
                        Modify the baseline inputs or add new scenarios to see how different assumptions affect your total costs.
                    </p>
                </div>

                {/* Helpful guideline - McKinsey style */}
                <div className="mb-6 border-t-2 border-executive-navy bg-white px-6 py-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                        To view results and comparison charts, click <span className="font-semibold text-executive-navy">"Run All Scenarios"</span> in the top-right corner.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <ScenariosTab
                        source={CASE_STUDY_DSL}
                        baselineInputs={baselineInputs}
                        onBaselineChange={onBaselineChange}
                        initialScenarios={initialScenarios}
                    />
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                    <p><strong>Note:</strong> Use "Add Scenario" to create additional cost projections for comparative analysis.</p>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { ScenariosTab } from '@costvela/ui';


import { CASE_STUDY_DSL, CASE_STUDY_INPUTS } from '../../data/caseStudyData';


export const ScenarioDemo: React.FC = () => {
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

                <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <ScenariosTab
                        source={CASE_STUDY_DSL}
                        baselineInputs={CASE_STUDY_INPUTS}
                    />
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                    <p>💡 <strong>Tip:</strong> Click "Add Scenario" to create alternative cost projections and compare them side-by-side.</p>
                </div>
            </div>
        </div>
    );
};

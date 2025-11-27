import React from 'react';
import { SensitivityTab } from '@costvela/ui';


import { CASE_STUDY_DSL, CASE_STUDY_INPUTS } from '../../data/caseStudyData';


export const SensitivityDemo: React.FC = () => {
    return (
        <div className="my-12 bgslate-50 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Sensitivity Analysis: Identify Cost Drivers
                    </h2>
                    <p className="text-lg text-gray-600">
                        Understand which inputs have the greatest impact on your costs.
                        Select input variables and output metrics to analyze how changes ripple through your model.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <SensitivityTab
                        source={CASE_STUDY_DSL}
                        inputs={CASE_STUDY_INPUTS}
                    />
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                    <p>📊 <strong>Insight:</strong> The tornado chart shows which inputs have the most significant impact on your selected outputs.</p>
                </div>
            </div>
        </div>
    );
};

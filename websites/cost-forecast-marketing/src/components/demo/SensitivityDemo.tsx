import React from 'react';
import { SensitivityTab } from '@costvela/ui';
import type { InputRow } from '@costvela/types';

import { CASE_STUDY_DSL } from '../../data/caseStudyData';

import { marketingApi } from '../../utils/marketingApiClient';

interface SensitivityDemoProps {
    baselineInputs: InputRow[];
}

export const SensitivityDemo: React.FC<SensitivityDemoProps> = ({ baselineInputs }) => {
    return (
        <div className="my-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Try It Yourself: Sensitivity Analysis
                    </h2>
                    <p className="text-lg text-gray-600">
                        Identify which input variables have the biggest impact on your total cost.
                        CostVela automatically runs thousands of simulations to find your key cost drivers.
                    </p>
                </div>

                {/* Helpful guideline - McKinsey style */}
                <div className="mb-6 border-t-2 border-executive-navy bg-white px-6 py-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                        Click <span className="font-semibold text-executive-navy">"Run Analysis"</span> to see the Tornado Chart, which ranks your cost drivers from most impactful to least impactful.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden h-[600px]">
                    <SensitivityTab
                        source={CASE_STUDY_DSL}
                        inputs={baselineInputs}
                        apiClient={marketingApi}
                    />
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                    <p><strong>Note:</strong> The tornado chart shows which inputs have the most significant impact on your selected outputs.</p>
                </div>
            </div>
        </div>
    );
};

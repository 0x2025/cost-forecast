import React from 'react';
import { SensitivityTab } from '@costvela/ui';
import type { InputRow } from '@costvela/types';

// Same DSL as scenario demo for consistency
const DEMO_DSL = `
# Manufacturing Cost Model
units_produced: Input("units_produced")
material_cost_per_unit: Input("material_cost_per_unit")
labor_hours_per_unit: Input("labor_hours_per_unit")
labor_rate: Input("labor_rate")
overhead_rate: Input("overhead_rate")

# Calculations
total_material_cost = units_produced * material_cost_per_unit
total_labor_hours = units_produced * labor_hours_per_unit
total_labor_cost = total_labor_hours * labor_rate
overhead_cost = total_labor_cost * overhead_rate

total_cost = total_material_cost + total_labor_cost + overhead_cost
cost_per_unit = total_cost / units_produced
`;

const DEMO_INPUTS: InputRow[] = [
    { key: 'units_produced', value: '1000' },
    { key: 'material_cost_per_unit', value: '50' },
    { key: 'labor_hours_per_unit', value: '2' },
    { key: 'labor_rate', value: '25' },
    { key: 'overhead_rate', value: '0.3' }
];

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
                        source={DEMO_DSL}
                        inputs={DEMO_INPUTS}
                    />
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                    <p>📊 <strong>Insight:</strong> The tornado chart shows which inputs have the most significant impact on your selected outputs.</p>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { ScenariosTab } from '@costvela/ui';
import type { InputRow } from '@costvela/types';

// Sample DSL for manufacturing cost analysis case study
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
                        source={DEMO_DSL}
                        baselineInputs={DEMO_INPUTS}
                    />
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                    <p>💡 <strong>Tip:</strong> Click "Add Scenario" to create alternative cost projections and compare them side-by-side.</p>
                </div>
            </div>
        </div>
    );
};

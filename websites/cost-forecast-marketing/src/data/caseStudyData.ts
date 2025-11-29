import type { InputRow } from '@costvela/types';

export const CASE_STUDY_DSL = `
# Automotive Supplier Cost Model

# Inputs
energy_price_index: Input("Energy Price Index")
logistics_base_rate: Input("Logistics Base Rate")
raw_material_cost: Input("Raw Material Cost")
labor_cost: Input("Labor Cost")

# Parameters
energy_factor = 0.15

# Calculations
energy_surcharge = (energy_price_index - 100) * energy_factor
logistics_cost = logistics_base_rate * (1 + (energy_price_index - 100) * 0.005)
total_unit_cost = raw_material_cost + labor_cost + logistics_cost + energy_surcharge
`;

export const CASE_STUDY_INPUTS: InputRow[] = [
    { key: 'Energy Price Index', value: '100' },
    { key: 'Logistics Base Rate', value: '50' },
    { key: 'Raw Material Cost', value: '200' },
    { key: 'Labor Cost', value: '80' },
];

export const OPTIMISTIC_SCENARIO_INPUTS: InputRow[] = [
    { key: 'Energy Price Index', value: '85' },
    { key: 'Logistics Base Rate', value: '45' },
    { key: 'Raw Material Cost', value: '180' },
    { key: 'Labor Cost', value: '75' },
];

export const PESSIMISTIC_SCENARIO_INPUTS: InputRow[] = [
    { key: 'Energy Price Index', value: '130' },
    { key: 'Logistics Base Rate', value: '60' },
    { key: 'Raw Material Cost', value: '230' },
    { key: 'Labor Cost', value: '90' },
];

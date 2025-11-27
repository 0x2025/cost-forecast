// API Request/Response Types
export interface CalculationRequest {
    source: string;
    inputs: Record<string, any>;
}

export interface CalculationError {
    message: string;
    line?: number;
    column?: number;
}

export interface GraphNode {
    id: string;
    type: string;
    label: string;
    displayName?: string;
    metadata?: Record<string, any>;
}

export interface GraphEdge {
    source: string;
    target: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface CalculationResponse {
    results: Record<string, any>;
    graph: GraphData | null;
    errors: CalculationError[];
}

// Batch calculation types
export interface BatchCalculationResponse {
    results: Record<string, ScenarioResult>;
    errors: CalculationError[];
}

export interface ScenarioResult {
    results: Record<string, any>;
    graph?: GraphData | null;
}

// Sensitivity analysis types
export interface SensitivityResponse {
    series: SensitivitySeries[];
    keyDrivers: CostDriver[];
    errors: CalculationError[];
}

export interface SensitivitySeries {
    inputName: string;
    outputName: string;
    points: SensitivityPoint[];
}

export interface SensitivityPoint {
    inputValue: number;
    inputPercentChange: number;
    outputValue: number;
    outputPercentChange: number;
}

export interface CostDriver {
    inputName: string;
    impactScore: number;
    outputImpacts: Record<string, number>;
}

// Input Grid Types
export interface InputRow {
    key: string;
    value: string;
}

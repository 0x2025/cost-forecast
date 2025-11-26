import axios from 'axios';

const API_URL = 'http://localhost:5246/api/forecast';

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

export const api = {
    calculate: async (source: string, inputs: Record<string, any>): Promise<CalculationResponse> => {
        try {
            const response = await axios.post<CalculationResponse>(`${API_URL}/calculate`, {
                source,
                inputs
            });
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                return error.response.data as CalculationResponse;
            }
            return {
                results: {},
                graph: null,
                errors: [{ message: error.message || 'Unknown error occurred' }]
            };
        }
    },

    calculateBatch: async (
        source: string,
        scenarios: Record<string, Record<string, any>>
    ): Promise<BatchCalculationResponse> => {
        try {
            const response = await axios.post<BatchCalculationResponse>(
                `${API_URL}/calculate-batch`,
                { source, scenarios }
            );
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                return error.response.data as BatchCalculationResponse;
            }
            return {
                results: {},
                errors: [{ message: error.message || 'Unknown error occurred' }]
            };
        }
    },

    analyzeSensitivity: async (
        source: string,
        baselineInputs: Record<string, any>,
        inputsToVary: string[],
        outputMetrics: string[],
        options?: { steps?: number; rangePercent?: number }
    ): Promise<SensitivityResponse> => {
        try {
            const response = await axios.post<SensitivityResponse>(
                `${API_URL}/sensitivity`,
                {
                    source,
                    baselineInputs,
                    inputsToVary,
                    outputMetrics,
                    steps: options?.steps ?? 5,
                    rangePercent: options?.rangePercent ?? 40
                }
            );
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                return error.response.data as SensitivityResponse;
            }
            return {
                series: [],
                keyDrivers: [],
                errors: [{ message: error.message || 'Unknown error occurred' }]
            };
        }
    }
};

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

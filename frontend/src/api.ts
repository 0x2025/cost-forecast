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

export interface CalculationResponse {
    results: Record<string, any>;
    graph: any;
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
    }
};

import axios from 'axios';
import type {
    CalculationResponse,
    BatchCalculationResponse,
    SensitivityResponse
} from '@costvela/types';

export interface ApiClientConfig {
    baseUrl?: string;
}

/**
 * CostVela API Client
 * Provides methods to interact with the CostVela backend API
 */
export class CostVelaApiClient {
    private baseUrl: string;

    constructor(config?: ApiClientConfig) {
        // Default to localhost, can be overridden via config
        this.baseUrl = config?.baseUrl || 'http://localhost:5246/api/forecast';
    }

    /**
     * Update client configuration
     */
    setConfig(config: ApiClientConfig) {
        if (config.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
    }

    /**
     * Calculate forecast with given DSL source and inputs
     */
    async calculate(source: string, inputs: Record<string, any>): Promise<CalculationResponse> {
        try {
            const response = await axios.post<CalculationResponse>(`${this.baseUrl}/calculate`, {
                source,
                inputs
            });
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data as any;
                if (error.response.status === 400 && data.errors && !Array.isArray(data.errors)) {
                    const messages = Object.values(data.errors).flat().map(String);
                    return {
                        results: {},
                        graph: null,
                        errors: messages.map(m => ({ message: m }))
                    };
                }
                return data as CalculationResponse;
            }
            return {
                results: {},
                graph: null,
                errors: [{ message: error.message || 'Unknown error occurred' }]
            };
        }
    }

    /**
     * Calculate multiple scenarios in batch
     */
    async calculateBatch(
        source: string,
        scenarios: Record<string, Record<string, any>>
    ): Promise<BatchCalculationResponse> {
        try {
            const response = await axios.post<BatchCalculationResponse>(
                `${this.baseUrl}/calculate-batch`,
                { source, scenarios }
            );
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data as any;
                // Handle ASP.NET Core ValidationProblemDetails
                if (error.response.status === 400 && data.errors && !Array.isArray(data.errors)) {
                    const messages = Object.values(data.errors).flat().map(String);
                    return {
                        results: {},
                        errors: messages.map(m => ({ message: m }))
                    };
                }
                return data as BatchCalculationResponse;
            }
            return {
                results: {},
                errors: [{ message: error.message || 'Unknown error occurred' }]
            };
        }
    }

    /**
     * Perform sensitivity analysis
     */
    async analyzeSensitivity(
        source: string,
        baselineInputs: Record<string, any>,
        inputsToVary: string[],
        outputMetrics: string[],
        options?: { steps?: number; rangePercent?: number }
    ): Promise<SensitivityResponse> {
        try {
            const response = await axios.post<SensitivityResponse>(
                `${this.baseUrl}/sensitivity`,
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
                const data = error.response.data as any;
                if (error.response.status === 400 && data.errors && !Array.isArray(data.errors)) {
                    const messages = Object.values(data.errors).flat().map(String);
                    return {
                        series: [],
                        keyDrivers: [],
                        errors: messages.map(m => ({ message: m }))
                    };
                }
                return data as SensitivityResponse;
            }
            return {
                series: [],
                keyDrivers: [],
                errors: [{ message: error.message || 'Unknown error occurred' }]
            };
        }
    }
}

/**
 * Create API client instance with optional configuration
 */
export function createApiClient(config?: ApiClientConfig): CostVelaApiClient {
    return new CostVelaApiClient(config);
}

// Default instance for convenience
export const api = new CostVelaApiClient();

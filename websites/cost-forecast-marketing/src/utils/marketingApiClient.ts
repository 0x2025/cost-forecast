// API client wrapper for marketing website
// Falls back to mock data when backend is unavailable

import { api } from '@costvela/api-client';
import type { BatchCalculationResponse, SensitivityAnalysisResponse } from '@costvela/types';
import { MOCK_SCENARIO_RESPONSE, MOCK_SENSITIVITY_RESPONSE } from './mockApiData';

class MarketingApiClient {
    private useMockData = false;

    async calculateBatch(source: string, scenarios: Record<string, Record<string, any>>): Promise<BatchCalculationResponse> {
        if (this.useMockData) {
            console.log('[Marketing API] Using mock scenario data');
            return this.mockBatchResponse(scenarios);
        }

        try {
            const response = await api.calculateBatch(source, scenarios);
            return response;
        } catch (error) {
            console.warn('[Marketing API] Backend unavailable, using mock data:', error);
            this.useMockData = true;
            return this.mockBatchResponse(scenarios);
        }
    }

    async analyzeSensitivity(
        source: string,
        baseline: Record<string, any>,
        outputKey: string
    ): Promise<SensitivityAnalysisResponse> {
        if (this.useMockData) {
            console.log('[Marketing API] Using mock sensitivity data');
            return MOCK_SENSITIVITY_RESPONSE;
        }

        try {
            const response = await api.analyzeSensitivity(source, baseline, outputKey);
            return response;
        } catch (error) {
            console.warn('[Marketing API] Backend unavailable, using mock data:', error);
            this.useMockData = true;
            return MOCK_SENSITIVITY_RESPONSE;
        }
    }

    private mockBatchResponse(scenarios: Record<string, Record<string, any>>): BatchCalculationResponse {
        const results: Record<string, any> = {};

        // Map scenario names to mock responses
        Object.keys(scenarios).forEach((scenarioName) => {
            const mockResult = MOCK_SCENARIO_RESPONSE.results.find(r =>
                r.name.toLowerCase() === scenarioName.toLowerCase()
            );

            if (mockResult) {
                results[scenarioName] = {
                    results: mockResult.outputs,
                    evaluatedGraph: null
                };
            }
        });

        return {
            results,
            errors: []
        };
    }
}

export const marketingApi = new MarketingApiClient();

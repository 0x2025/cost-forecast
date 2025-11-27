import { api as defaultApi } from '@costvela/api-client';

// API configuration for the marketing website
// Uses the same backend as the frontend app
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5246/api/forecast';

// Export configured API client
export const api = defaultApi;

// Configure the client
if (API_BASE_URL) {
    api.setConfig({ baseUrl: API_BASE_URL });
}

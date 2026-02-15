/**
 * API Client for SHADOWNET
 * Handles all communication with the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private retryCount = 3;
  private retryDelay = 1000;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config;
        
        if (!config || !this.shouldRetry(error)) {
          return Promise.reject(error);
        }

        // Retry logic
        const retryAttempt = (config as any).__retryCount || 0;
        if (retryAttempt < this.retryCount) {
          (config as any).__retryCount = retryAttempt + 1;
          
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * Math.pow(2, retryAttempt))
          );
          
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  async getAgents() {
    const response = await this.client.get('/agents');
    return response.data.data;
  }

  async getActivity(limit: number = 50) {
    const response = await this.client.get('/activity', {
      params: { limit },
    });
    return response.data.data;
  }

  async getLeaderboards(limit: number = 10) {
    const response = await this.client.get('/leaderboards', {
      params: { limit },
    });
    return response.data.data;
  }

  async getLedger(limit: number = 10) {
    const response = await this.client.get('/ledger', {
      params: { limit },
    });
    return response.data.data;
  }

  async getStats() {
    const response = await this.client.get('/stats');
    return response.data.data;
  }

  async getDrama(limit: number = 20) {
    const response = await this.client.get('/drama', {
      params: { limit },
    });
    return response.data.data;
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();

// Export individual functions for easier imports
export const getAgents = () => apiClient.getAgents();
export const getActivity = (limit?: number) => apiClient.getActivity(limit);
export const getLeaderboards = (limit?: number) => apiClient.getLeaderboards(limit);
export const getLedger = (limit?: number) => apiClient.getLedger(limit);
export const getStats = () => apiClient.getStats();
export const getDrama = (limit?: number) => apiClient.getDrama(limit);
export const healthCheck = () => apiClient.healthCheck();

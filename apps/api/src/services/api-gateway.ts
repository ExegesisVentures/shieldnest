/**
 * API Gateway Service
 * Implements zero trust communication patterns
 * All external API calls go through this gateway for monitoring and security
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SecureLogger } from '@/utils/security';

interface ApiGatewayConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

interface ApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  headers?: Record<string, string>;
}

export class ApiGateway {
  private client: AxiosInstance;
  private config: ApiGatewayConfig;

  constructor(config: ApiGatewayConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Roll-NFT-API/1.0',
        ...config.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        SecureLogger.logSecure('info', 'External API Request', {
          url: config.url,
          method: config.method?.toUpperCase(),
          baseURL: config.baseURL
        });
        return config;
      },
      (error) => {
        SecureLogger.logSecure('error', 'API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        SecureLogger.logSecure('info', 'External API Response', {
          url: response.config.url,
          status: response.status,
          statusText: response.statusText
        });
        return response;
      },
      (error) => {
        SecureLogger.logSecure('error', 'API Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const { endpoint, method, data, headers, timeout } = request;

    try {
      const config: AxiosRequestConfig = {
        method,
        url: endpoint,
        data,
        headers,
        timeout: timeout || this.config.timeout
      };

      const response: AxiosResponse<T> = await this.client.request(config);

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: response.headers as Record<string, string>
      };

    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

      SecureLogger.logSecure('error', 'API Gateway Error', {
        endpoint,
        method,
        statusCode,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        statusCode
      };
    }
  }

  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'GET', headers });
  }

  async post<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'POST', data, headers });
  }

  async put<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'PUT', data, headers });
  }

  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'DELETE', headers });
  }
}

// Pre-configured gateways for different services
export const blockchainGateway = new ApiGateway({
  baseURL: process.env.REST_ENDPOINT || 'https://full-node.mainnet-1.coreum.dev:1317',
  timeout: 15000,
  headers: {
    'Accept': 'application/json'
  }
});

export const rpcGateway = new ApiGateway({
  baseURL: process.env.RPC_ENDPOINT || 'https://full-node.mainnet-1.coreum.dev:26657',
  timeout: 10000,
  headers: {
    'Accept': 'application/json'
  }
});

// Oracle service gateway (if needed)
export const oracleGateway = new ApiGateway({
  baseURL: process.env.ORACLE_ENDPOINT || 'https://api.coingecko.com/api/v3',
  timeout: 5000,
  headers: {
    'Accept': 'application/json'
  }
});

/**
 * Secure external service communication
 * All external API calls should go through these methods
 */
export class ExternalServiceClient {
  static async getBlockchainData(endpoint: string): Promise<ApiResponse> {
    return blockchainGateway.get(endpoint);
  }

  static async getRPCData(endpoint: string, data?: any): Promise<ApiResponse> {
    return rpcGateway.post(endpoint, data);
  }

  static async getPriceData(endpoint: string): Promise<ApiResponse> {
    return oracleGateway.get(endpoint);
  }

  static async validateTransaction(txHash: string): Promise<ApiResponse> {
    return blockchainGateway.get(`/cosmos/tx/v1beta1/txs/${txHash}`);
  }

  static async getAccountInfo(address: string): Promise<ApiResponse> {
    return blockchainGateway.get(`/cosmos/auth/v1beta1/accounts/${address}`);
  }

  static async getBalance(address: string): Promise<ApiResponse> {
    return blockchainGateway.get(`/cosmos/bank/v1beta1/balances/${address}`);
  }
}

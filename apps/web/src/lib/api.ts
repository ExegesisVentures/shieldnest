// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get the API base URL from environment variables
 * CRITICAL: Always use this function instead of hardcoding URLs
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

/**
 * Get the full API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Use environment variable for API URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}/${cleanEndpoint}`;
}

/**
 * Fetch wrapper with automatic API URL construction and error handling
 */
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 API Request:', {
      endpoint,
      url,
      method: options?.method || 'GET',
      hasBody: !!options?.body
    });
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    // Log API response status in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 API Response:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
    }
    
    return response;
  } catch (error) {
    console.error('🌐 API Request Failed:', {
      endpoint,
      url,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Re-throw with more context
    throw new Error(`API request to ${endpoint} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Authenticated API request with auth token from localStorage
 */
export async function authenticatedApiRequest(endpoint: string, options?: RequestInit): Promise<Response> {
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  // Debug logging
  console.log('🔑 Auth Debug:', {
    endpoint,
    hasToken: !!authToken,
    tokenLength: authToken?.length || 0,
    tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'none'
  });
  
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
  });
}

/**
 * Generic API client with typed responses
 */
export const api = {
  get: async <T>(endpoint: string): Promise<Response> => {
    return await authenticatedApiRequest(endpoint);
  },

  post: async <T>(endpoint: string, body?: any): Promise<Response> => {
    return await authenticatedApiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put: async <T>(endpoint: string, body?: any): Promise<Response> => {
    return await authenticatedApiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete: async <T>(endpoint: string): Promise<Response> => {
    return await authenticatedApiRequest(endpoint, {
      method: 'DELETE',
    });
  }
};

/**
 * Mint API functions
 */
export const mintApi = {
  // Get current mint information
  async getInfo() {
    const response = await apiRequest('api/mint/info');
    if (!response.ok) {
      throw new Error('Failed to get mint info');
    }
    return response.json();
  },

  // Check mint eligibility for authenticated user
  async checkEligibility() {
    const response = await authenticatedApiRequest('api/mint/eligibility');
    if (!response.ok) {
      throw new Error('Failed to check mint eligibility');
    }
    return response.json();
  },

  // Initiate mint for authenticated user
  async mint() {
    const response = await authenticatedApiRequest('api/mint/mint', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to initiate mint');
    }
    return response.json();
  },

  // Get mint status by claim ID
  async getStatus(claimId: string) {
    const response = await authenticatedApiRequest(`api/mint/status/${claimId}`);
    if (!response.ok) {
      throw new Error('Failed to get mint status');
    }
    return response.json();
  }
};

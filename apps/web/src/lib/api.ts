// API configuration and utilities
// Since we migrated to serverless, API is now part of the same deployment
// ALWAYS use same domain for API calls (serverless functions are on same domain)

/**
 * Get the API base URL - ALWAYS returns same domain in production
 * This is safe to use in any component/page
 */
const getDefaultApiUrl = () => {
  // Server-side: use empty string (same domain)
  if (typeof window === 'undefined') {
    return '';
  }
  // Client-side: ALWAYS use window.location.origin
  // This works in both dev (localhost:3000) and production (vercel.app)
  return window.location.origin;
};

// NEVER use NEXT_PUBLIC_API_URL - it causes build-time issues
// Instead, always use same domain (serverless APIs are co-located)
const API_BASE_URL = getDefaultApiUrl();

/**
 * Get the API base URL - ALWAYS returns same domain
 * CRITICAL: Always use this function instead of hardcoding URLs
 * SAFE FOR PRODUCTION: No build-time environment variable checks
 */
export function getApiBaseUrl(): string {
  return getDefaultApiUrl();
}

/**
 * Get the full API URL for a given endpoint
 * SAFE FOR PRODUCTION: Always uses same domain
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // ALWAYS use same domain (serverless APIs are co-located)
  let baseUrl = getDefaultApiUrl();
  // Remove trailing slash from baseUrl to avoid double slashes
  baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
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

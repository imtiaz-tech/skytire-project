const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Custom fetch wrapper to replace axios and support Next.js 15/16 features like ISR.
 */
async function apiFetch(endpoint: string, options: RequestInit & { next?: NextFetchRequestConfig } = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send session cookies with every request
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'API request failed');
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return { data, status: response.status };
}

const apiClient = {
  get: (url: string, options?: RequestInit & { next?: NextFetchRequestConfig }) => 
    apiFetch(url, { ...options, method: 'GET' }),
  post: (url: string, body: any, options?: RequestInit & { next?: NextFetchRequestConfig }) => 
    apiFetch(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (url: string, body: any, options?: RequestInit & { next?: NextFetchRequestConfig }) => 
    apiFetch(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url: string, options?: RequestInit & { next?: NextFetchRequestConfig }) => 
    apiFetch(url, { ...options, method: 'DELETE' }),
};

export default apiClient;

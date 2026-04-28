const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Custom fetch wrapper to replace axios and support Next.js 15/16 features like ISR.
 */
async function apiFetch(endpoint: string, options: RequestInit & { next?: NextFetchRequestConfig } = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  const method = options.method?.toUpperCase() || 'GET';
  const hasBody = !!options.body;

  if (!headers.has('Content-Type') && !isFormData && hasBody && method !== 'GET' && method !== 'DELETE') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    body: isFormData ? options.body : (hasBody ? JSON.stringify(options.body) : undefined),
    headers,
    credentials: 'include',
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
    apiFetch(url, { ...options, method: 'POST', body }),
  patch: (url: string, body: any, options?: RequestInit & { next?: NextFetchRequestConfig }) => 
    apiFetch(url, { ...options, method: 'PATCH', body }),
  delete: (url: string, options?: RequestInit & { next?: NextFetchRequestConfig }) => 
    apiFetch(url, { ...options, method: 'DELETE' }),
};

export default apiClient;

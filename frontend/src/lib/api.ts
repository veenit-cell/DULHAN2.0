/**
 * Dulhan API Configuration
 * Centralizes the API base URL and auth helpers so they aren't hardcoded in every component.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Returns authorization headers with the JWT token from localStorage.
 * Returns empty object if no token is present.
 */
export function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('dulhan_token');
    if (!token) return {};
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Authenticated fetch wrapper — automatically includes JWT token.
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {}),
    };
    return fetch(`${API_URL}${path}`, { ...options, headers });
}

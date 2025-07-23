interface RequestOptions {
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
}

export class RequestError extends Error {
    public status: number;
    public response?: any;

    constructor(message: string, status: number, response?: any) {
        super(message);
        this.name = 'RequestError';
        this.status = status;
        this.response = response;
    }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthToken = (): string | null => localStorage.getItem('auth_token');
export const setAuthToken = (token: string): void => localStorage.setItem('auth_token', token);
export const removeAuthToken = (): void => localStorage.removeItem('auth_token');

const prepareHeaders = (customHeaders: Record<string, string> = {}): HeadersInit => {
    const headers: HeadersInit = {'Content-Type': 'application/json', ...customHeaders,};

    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    return headers;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let responseData: any;
    if (isJson) {
        responseData = await response.json();
    } else {
        responseData = await response.text();
    }

    if (!response.ok) {
        const message = responseData?.message || responseData || 'Request failed';
        throw new RequestError(message, response.status, responseData);
    }

    return responseData;
}

export const get = async <T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'body'> = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = prepareHeaders(options.headers);

    const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: options.signal,
    });

    return handleResponse<T>(response);
}

export const post = async <T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = prepareHeaders(options.headers);

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: options.signal,
    });

    return handleResponse<T>(response);
}

export const put = async <T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = prepareHeaders(options.headers);

    const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: options.signal,
    });

    return handleResponse<T>(response);
}

export const del = async <T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'body'> = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = prepareHeaders(options.headers);

    const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal: options.signal,
    });

    return handleResponse<T>(response);
}

export const uploadFiles = async <T = any>(
    endpoint: string,
    files: File[],
    additionalData: Record<string, any> = {},
    options: Omit<RequestOptions, 'body'> = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const formData = new FormData();
    files.forEach((file) => {
        formData.append(`files`, file);
    });

    Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
    });

    const headers: HeadersInit = {...options.headers,};

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {method: 'POST', headers, body: formData, signal: options.signal});

    return handleResponse<T>(response);
}

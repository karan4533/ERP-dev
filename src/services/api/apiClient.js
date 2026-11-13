/**
 * Central API Client Abstraction
 * Routes requests through live HTTP backend or Mock Service Adapter,
 * ensuring standardized response envelopes, loading delay simulation,
 * error handling, and file upload/download abstractions.
 */

import { mockAdapter } from './mockAdapter.js';
import {
  createSuccessResponse,
  createErrorResponse,
  isApiResponse,
} from './responseEnvelope.js';
import { generateUniqueId } from '../models/index.js';

class ApiClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || '';
    this.useMock = config.useMock ?? true;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(config.headers || {}),
    };
    this.timeoutMs = config.timeoutMs || 15000;
    this.defaultDelayMs = config.defaultDelayMs ?? 0;
  }

  /**
   * Configures runtime options.
   * @param {Record<string, any>} options
   */
  configure(options = {}) {
    if (options.baseUrl !== undefined) this.baseUrl = options.baseUrl;
    if (options.useMock !== undefined) this.useMock = Boolean(options.useMock);
    if (options.timeoutMs !== undefined) this.timeoutMs = Number(options.timeoutMs);
    if (options.defaultDelayMs !== undefined) this.defaultDelayMs = Number(options.defaultDelayMs);
    if (options.headers) {
      this.defaultHeaders = { ...this.defaultHeaders, ...options.headers };
    }
  }

  /**
   * Helper to simulate network latency in development with AbortSignal support.
   * @param {number} ms
   * @param {AbortSignal} [signal]
   */
  async delay(ms, signal) {
    if (signal?.aborted) {
      const err = new Error(typeof signal.reason === 'string' ? signal.reason : (signal.reason?.message || 'Request aborted'));
      err.name = 'AbortError';
      throw err;
    }
    if (!ms || ms <= 0) return;
    return new Promise((resolve, reject) => {
      let timeoutId;
      const onAbort = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', onAbort);
        const err = new Error(typeof signal?.reason === 'string' ? signal.reason : (signal?.reason?.message || 'Request aborted'));
        err.name = 'AbortError';
        reject(err);
      };
      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }
      timeoutId = setTimeout(() => {
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
    });
  }

  /**
   * Builds full URL with query parameters.
   * @param {string} endpoint
   * @param {Record<string, any>} [params={}]
   * @returns {string}
   */
  buildUrl(endpoint, params = {}) {
    let url = endpoint;
    if (this.baseUrl && !endpoint.startsWith('http')) {
      url = `${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    }

    const queryParts = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });

    if (queryParts.length > 0) {
      url += (url.includes('?') ? '&' : '?') + queryParts.join('&');
    }
    return url;
  }

  /**
   * Primary request dispatcher.
   * @param {string} method
   * @param {string} endpoint
   * @param {any} [data=null]
   * @param {Record<string, any>} [options={}]
   * @returns {Promise<{ success: boolean, data: any, meta: any, error: string | null }>}
   */
  async request(method, endpoint, data = null, options = {}) {
    const {
      params = {},
      headers = {},
      signal,
      timeout = this.timeoutMs,
      skipDelay = false,
      delayMs = this.defaultDelayMs,
      skipMock = false,
    } = options;

    if (signal?.aborted) {
      return createErrorResponse(typeof signal.reason === 'string' ? signal.reason : (signal.reason?.message || 'Request aborted'));
    }

    const fullUrl = this.buildUrl(endpoint, params);
    const shouldUseMock = !skipMock && (this.useMock || !this.baseUrl);

    // Optional delay simulation
    if (!skipDelay && delayMs > 0) {
      try {
        await this.delay(delayMs, signal);
      } catch (delayErr) {
        if (signal?.aborted || delayErr.name === 'AbortError') {
          return createErrorResponse(typeof signal?.reason === 'string' ? signal.reason : (signal?.reason?.message || 'Request aborted'));
        }
        throw delayErr;
      }
    }

    if (signal?.aborted) {
      return createErrorResponse(typeof signal.reason === 'string' ? signal.reason : (signal.reason?.message || 'Request aborted'));
    }

    // 1. Mock Adapter Execution Path
    if (shouldUseMock) {
      try {
        const response = await mockAdapter.handleRequest({
          method,
          url: fullUrl,
          data,
          params,
          headers: { ...this.defaultHeaders, ...headers },
          signal,
        });
        if (isApiResponse(response)) {
          return response;
        }
        return createSuccessResponse(response);
      } catch (mockErr) {
        return createErrorResponse(mockErr);
      }
    }

    // 2. Real Network Fetch Execution Path
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error(`Request timeout after ${timeout}ms`)), timeout);

    // Combine caller's signal with timeout controller
    let fetchSignal = controller.signal;
    if (signal) {
      if (typeof AbortSignal.any === 'function') {
        fetchSignal = AbortSignal.any([controller.signal, signal]);
      } else {
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
      }
    }

    try {
      const fetchOptions = {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        signal: fetchSignal,
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (data instanceof FormData) {
          delete fetchOptions.headers['Content-Type'];
          fetchOptions.body = data;
        } else {
          fetchOptions.body = JSON.stringify(data);
        }
      }

      const res = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      let parsedBody;
      if (contentType.includes('application/json')) {
        parsedBody = await res.json();
      } else {
        parsedBody = await res.text();
      }

      if (!res.ok) {
        const errMsg = parsedBody?.error || parsedBody?.message || `HTTP ${res.status}: ${res.statusText}`;
        return createErrorResponse(errMsg, parsedBody?.data || null);
      }

      if (isApiResponse(parsedBody)) {
        return parsedBody;
      }
      return createSuccessResponse(parsedBody);
    } catch (networkErr) {
      clearTimeout(timeoutId);
      if (networkErr.name === 'AbortError') {
        if (signal?.aborted) {
          return createErrorResponse(typeof signal.reason === 'string' ? signal.reason : (signal.reason?.message || 'Request aborted'));
        }
        return createErrorResponse(`Request timeout after ${timeout}ms`);
      }
      return createErrorResponse(networkErr);
    }
  }

  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  post(endpoint, data = {}, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  put(endpoint, data = {}, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  patch(endpoint, data = {}, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  /**
   * File upload abstraction with FormData wrapper.
   * @param {string} endpoint
   * @param {FormData | File | Blob} fileOrFormData
   * @param {Record<string, any>} [options={}]
   */
  async upload(endpoint, fileOrFormData, options = {}) {
    if (options.signal?.aborted) {
      return createErrorResponse(typeof options.signal.reason === 'string' ? options.signal.reason : (options.signal.reason?.message || 'Request aborted'));
    }

    let formData = fileOrFormData;
    if (!(fileOrFormData instanceof FormData)) {
      formData = new FormData();
      formData.append('file', fileOrFormData);
    }

    if (this.useMock || !this.baseUrl) {
      // Simulate file upload in mock environment
      const file = formData.get('file');
      const mockResult = {
        fileId: generateUniqueId('FILE-UPL'),
        fileName: file?.name || 'document.pdf',
        fileSize: file?.size || 1024 * 1024,
        fileUrl: `/uploads/${file?.name || 'document.pdf'}`,
        uploadedAt: new Date().toISOString(),
      };
      return createSuccessResponse(mockResult);
    }

    return this.request('POST', endpoint, formData, {
      ...options,
      headers: { ...(options.headers || {}) },
    });
  }

  /**
   * File download abstraction.
   * @param {string} endpoint
   * @param {Record<string, any>} [options={}]
   */
  async download(endpoint, options = {}) {
    if (this.useMock || !this.baseUrl) {
      return createSuccessResponse({
        downloadUrl: endpoint.startsWith('http') ? endpoint : `/mock-files${endpoint}`,
        status: 'Ready',
      });
    }
    return this.get(endpoint, options);
  }
}

export const apiClient = new ApiClient({
  baseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '',
  useMock: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK !== 'false') || true,
  defaultDelayMs: 0,
});

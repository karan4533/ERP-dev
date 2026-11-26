/**
 * Central API Response Envelope & Pagination Utilities
 * Standardizes all API responses across real backend and mock adapter layers.
 */

/**
 * Creates a standard successful API response envelope.
 * @template T
 * @param {T} data - Payload data
 * @param {{ total?: number, page?: number, pageSize?: number } | null} [meta=null] - Pagination / query metadata
 * @returns {{ success: true, data: T, meta: { total: number, page: number, pageSize: number } | null, error: null }}
 */
export function createSuccessResponse(data, meta = null) {
  return {
    success: true,
    data,
    meta: meta ? {
      total: meta.total ?? (Array.isArray(data) ? data.length : 1),
      page: meta.page ?? 1,
      pageSize: meta.pageSize ?? (Array.isArray(data) ? data.length : 1),
    } : null,
    error: null,
  };
}

/**
 * Creates a standard error API response envelope.
 * @param {string | Error | Record<string, any>} error - Error message or object
 * @param {any} [data=null] - Optional fallback or partial payload
 * @returns {{ success: false, data: any, meta: null, error: string }}
 */
export function createErrorResponse(error, data = null) {
  let message = 'An unexpected error occurred';
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === 'object') {
    message = error.message || error.error || JSON.stringify(error);
  }

  return {
    success: false,
    data,
    meta: null,
    error: message,
  };
}

/**
 * Checks whether an object complies with the standard API envelope.
 * @param {any} response
 * @returns {boolean}
 */
export function isApiResponse(response) {
  return (
    response !== null &&
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    'data' in response &&
    'error' in response
  );
}

/**
 * Helper to filter, sort, and paginate in-memory or mock data arrays.
 * @template T
 * @param {T[]} items
 * @param {{
 *   page?: number,
 *   pageSize?: number,
 *   filter?: (item: T) => boolean,
 *   search?: string,
 *   searchFields?: (keyof T)[],
 *   sortBy?: keyof T | ((item: T) => any),
 *   sortOrder?: 'asc' | 'desc'
 * }} [options={}]
 * @returns {{ items: T[], meta: { total: number, page: number, pageSize: number } }}
 */
export function paginateResults(items = [], options = {}) {
  const {
    page = 1,
    pageSize = 10,
    filter,
    search,
    searchFields = [],
    sortBy,
    sortOrder = 'asc',
  } = options;

  let filtered = [...items];

  // 1. Custom filter predicate
  if (typeof filter === 'function') {
    filtered = filtered.filter(filter);
  }

  // 2. Text search across designated fields
  if (search && search.trim() !== '') {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const val = item[field];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }
      return Object.values(item).some((val) =>
        val !== undefined && val !== null && String(val).toLowerCase().includes(term)
      );
    });
  }

  // 3. Sorting
  if (sortBy) {
    const isAsc = sortOrder.toLowerCase() !== 'desc';
    filtered.sort((a, b) => {
      let valA = typeof sortBy === 'function' ? sortBy(a) : a[sortBy];
      let valB = typeof sortBy === 'function' ? sortBy(b) : b[sortBy];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return isAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }

  const total = filtered.length;
  const currentPage = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 10);
  const startIndex = (currentPage - 1) * size;
  const paginatedItems = filtered.slice(startIndex, startIndex + size);

  return {
    items: paginatedItems,
    meta: {
      total,
      page: currentPage,
      pageSize: size,
    },
  };
}

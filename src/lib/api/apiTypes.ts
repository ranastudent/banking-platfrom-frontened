/** Standard response envelope returned by backend controllers. */
export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  requestId?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextCursor?: string | null;
  previousCursor?: string | null;
};

/**
 * Unwraps Axios responses using the backend's { success, data, requestId }
 * envelope. It also tolerates a raw payload for tests and isolated mocks.
 */
export function unwrapApiData<T>(response: unknown): T {
  if (typeof response !== "object" || response === null) {
    return response as T;
  }

  const outer = response as { data?: unknown };
  const body = outer.data;
  if (typeof body === "object" && body !== null && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

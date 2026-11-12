import axios from "axios";

export type ApiErrorDetails = {
  status: number | null;
  code: string | null;
  message: string;
  requestId: string | null;
  fieldErrors: Record<string, string>;
};

export class ApiError extends Error {
  status: number | null;
  code: string | null;
  requestId: string | null;
  fieldErrors: Record<string, string>;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = "ApiError";
    this.status = details.status;
    this.code = details.code;
    this.requestId = details.requestId;
    this.fieldErrors = details.fieldErrors;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError({
      status: null, code: null,
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
      requestId: null, fieldErrors: {},
    });
  }
  const body = error.response?.data as Record<string, any> | undefined;
  const details = body?.error ?? body;
  const rawFields = details?.errors ?? details?.fieldErrors;
  const fieldErrors: Record<string, string> = {};
  if (Array.isArray(rawFields)) {
    for (const item of rawFields) {
      const key = item?.path?.join?.(".") ?? item?.field ?? "form";
      fieldErrors[key] = item?.message ?? "Invalid value";
    }
  } else if (rawFields && typeof rawFields === "object") {
    for (const [key, value] of Object.entries(rawFields)) {
      fieldErrors[key] = typeof value === "string" ? value : "Invalid value";
    }
  }
  const status = error.response?.status ?? null;
  const fallback = !error.response ? "Unable to reach the server. Check your connection and try again."
    : status === 401 ? "Your session is invalid or has expired. Please sign in again."
    : status === 403 ? "You do not have permission to perform this action."
    : status === 404 ? "The requested resource was not found."
    : status === 409 ? "This request conflicts with the current resource state."
    : status === 429 ? "Too many requests. Please wait before trying again."
    : status !== null && status >= 500 ? "The server is temporarily unavailable. Please try again later."
    : "Please check the submitted information and try again.";
  return new ApiError({
    status,
    code: details?.code ?? null,
    message: details?.message ?? body?.message ?? fallback,
    requestId: body?.requestId ?? details?.requestId ?? null,
    fieldErrors,
  });
}

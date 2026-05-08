import type { ApiError } from "@/types/api";
import type { AuthenticatedUserResponse, LoginResponse } from "@/types/auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export const TOKEN_KEY = "pointclick_token";
export const REFRESH_TOKEN_KEY = "pointclick_refresh_token";
export const TOKEN_TYPE_KEY = "pointclick_token_type";
export const TOKEN_EXPIRES_IN_KEY = "pointclick_token_expires_in";
export const AUTH_USER_KEY = "pointclick_user";

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

export class ApiRequestError extends Error {
  status: number;
  title: string;
  detail: string;
  instance?: string;
  data?: unknown;

  constructor(error: ApiError, data?: unknown) {
    super(error.detail || error.title || "Erro ao comunicar com a API");
    this.name = "ApiRequestError";
    this.status = error.status;
    this.title = error.title;
    this.detail = error.detail;
    this.instance = error.instance;
    this.data = data;
  }
}

let refreshPromise: Promise<LoginResponse | null> | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthenticatedUserResponse | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthenticatedUserResponse;
  } catch {
    return null;
  }
}

export function saveAuthData(response: LoginResponse): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(TOKEN_TYPE_KEY, response.type);
  localStorage.setItem(TOKEN_EXPIRES_IN_KEY, String(response.expiresIn));
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));

  window.dispatchEvent(new Event("pointclick-auth-changed"));
}

export function clearAuthData(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_IN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);

  window.dispatchEvent(new Event("pointclick-auth-changed"));
}

export function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPublicFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return buildApiUrl(url);
}

export function buildQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    body,
    headers,
    auth = true,
    retry = true,
    ...fetchOptions
  } = options;

  const requestHeaders = new Headers(headers);

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData && body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (auth) {
    const token = getAccessToken();

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildApiUrl(path), {
    ...fetchOptions,
    headers: requestHeaders,
    body: normalizeBody(body),
  });

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return apiFetch<T>(path, {
        body,
        headers,
        auth,
        retry: false,
        ...fetchOptions,
      });
    }
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  return response.json() as Promise<T>;
}

async function refreshAccessToken(): Promise<LoginResponse | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthData();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          clearAuthData();
          return null;
        }

        const data = (await response.json()) as LoginResponse;
        saveAuthData(data);

        return data;
      })
      .catch(() => {
        clearAuthData();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function normalizeBody(body: unknown): BodyInit | null | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body;
  }

  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  ) {
    return body as BodyInit;
  }

  return JSON.stringify(body);
}

async function createApiError(response: Response): Promise<ApiRequestError> {
  const fallback: ApiError = {
    timestamp: new Date().toISOString(),
    status: response.status,
    title: "Erro na requisição",
    detail: "Erro ao comunicar com a API",
    instance: undefined,
  };

  try {
    const data = await response.json();

    const apiError: ApiError = {
      timestamp: data.timestamp ?? fallback.timestamp,
      status: data.status ?? response.status,
      title: data.title ?? fallback.title,
      detail: data.detail ?? fallback.detail,
      instance: data.instance,
    };

    return new ApiRequestError(apiError, data);
  } catch {
    return new ApiRequestError(fallback);
  }
}
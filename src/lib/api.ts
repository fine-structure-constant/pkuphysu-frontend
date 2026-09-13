import { getStoredToken } from "./session";

export const API_BASE = (import.meta.env.PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload: unknown = null) { super(message); this.name = "ApiError"; }
}

export const requestApi = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${API_BASE}${path}`, { ...options, headers });
};

export const readApiPayload = async <T>(response: Response) => {
  let payload: any = null;
  try { payload = await response.json(); } catch { /* Some successful mutations have no body. */ }
  if (!response.ok) throw new ApiError(response.status, payload?.message || payload?.error || `请求失败（${response.status}）`, payload);
  return payload as { status?: number; data: T; count?: number; message?: string; [key: string]: unknown };
};

export const apiJson = async <T>(path: string, options: RequestInit = {}) => readApiPayload<T>(await requestApi(path, options));
export const jsonBody = (value: unknown) => JSON.stringify(value);

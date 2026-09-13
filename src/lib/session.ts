export type Role = "general" | "member" | "admin";

export interface BackendUser {
  id: number;
  username: string;
  verified: boolean;
  stuname: string;
  stuid: string;
  role: number;
  disabled: boolean;
  bio: string;
  has_password?: boolean;
}

export interface AuthSession { token: string; user: BackendUser; }

const SESSION_KEY = "pkuphysu-session";
const TOKEN_KEY = "pkuphysu-token";
const isBrowser = () => typeof window !== "undefined";

const normalizeUser = (user: Partial<BackendUser>): BackendUser => ({
  id: Number(user.id ?? 0), username: String(user.username ?? "用户"), verified: Boolean(user.verified),
  stuname: String(user.stuname ?? ""), stuid: String(user.stuid ?? ""), role: Number(user.role ?? 0),
  disabled: Boolean(user.disabled), bio: String(user.bio ?? ""), has_password: user.has_password,
});

export const getStoredToken = () => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.localStorage.getItem("user_token");
};

export const getAuthSession = (): AuthSession | null => {
  if (!isBrowser()) return null;
  const token = getStoredToken();
  if (!token) return null;
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored) as Partial<AuthSession>;
      if (session.token && session.user) return { token: session.token, user: normalizeUser(session.user) };
    }
  } catch { /* Let the API validation decide for malformed browser state. */ }
  return { token, user: normalizeUser({ id: Number(window.localStorage.getItem("user_id") ?? 0), username: window.localStorage.getItem("user_name") ?? "用户" }) };
};

export const saveAuthSession = (token: string, user: Partial<BackendUser>) => {
  if (!isBrowser()) return;
  const normalized = normalizeUser(user);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: normalized } satisfies AuthSession));
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem("user_token", token);
  window.localStorage.setItem("user_id", String(normalized.id));
  window.localStorage.setItem("user_name", normalized.username);
  emitAuthChange();
};

export const updateStoredUser = (user: Partial<BackendUser>) => {
  const session = getAuthSession();
  if (session) saveAuthSession(session.token, { ...session.user, ...user });
};

export const clearAuthSession = () => {
  if (!isBrowser()) return;
  [SESSION_KEY, TOKEN_KEY, "user_token", "user_id", "user_name"].forEach((key) => window.localStorage.removeItem(key));
  emitAuthChange();
};

export const emitAuthChange = () => { if (isBrowser()) window.dispatchEvent(new CustomEvent("pkuphysu-auth-change")); };
export const roleFromNumber = (role: number | null | undefined): Role => role === 2 ? "admin" : role === 1 ? "member" : "general";
export const roleLabel = (role: number | Role | null | undefined) => {
  const normalized = typeof role === "number" ? roleFromNumber(role) : role;
  return normalized === "admin" ? "管理员" : normalized === "member" ? "注册成员" : "普通用户";
};
export const getInitials = (username: string) => Array.from(username.trim() || "U").slice(0, 2).join("").toUpperCase();

export const canAccessPath = (role: number | Role | null | undefined, path: string) => {
  if (path.startsWith("/console")) return role === 2 || role === "admin";
  if (path.startsWith("/archive")) return role === 1 || role === 2 || role === "member" || role === "admin";
  if (path.startsWith("/forum")) return role !== null && role !== undefined;
  return true;
};

import { setAuthTokenGetter } from "@workspace/api-client-react";
import type { AuthUser } from "@/contexts/auth-context";

export function initAuth() {
  setAuthTokenGetter(() => localStorage.getItem("wisma_token"));
}

export function getToken(): string | null {
  return localStorage.getItem("wisma_token");
}

export function setToken(token: string) {
  localStorage.setItem("wisma_token", token);
}

export function clearToken() {
  localStorage.removeItem("wisma_token");
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("wisma_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem("wisma_user", JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem("wisma_user");
}

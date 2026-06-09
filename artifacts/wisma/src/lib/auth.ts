import { setAuthTokenGetter } from "@workspace/api-client-react";

export function initAuth() {
  setAuthTokenGetter(() => localStorage.getItem("wisma_token"));
}

export function getToken() {
  return localStorage.getItem("wisma_token");
}

export function setToken(token: string) {
  localStorage.setItem("wisma_token", token);
}

export function clearToken() {
  localStorage.removeItem("wisma_token");
}

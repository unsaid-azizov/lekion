const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

export function getToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("access_token");
  }
  return accessToken;
}

async function refreshToken(): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  setToken(data.access_token);
  return data.access_token;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    if (token) {
      const newToken = await refreshToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
          credentials: "include",
        });
      }
    }
    if (res.status === 401) {
      setToken(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      throw new Error("unauthorized");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || error.message || "Request failed");
  }

  return res.json();
}

const API_BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body?: unknown) =>
    request(endpoint, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string, body?: unknown) =>
    request(endpoint, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),

  auth: {
    login: (data: { email: string; password: string }) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: { name: string; email: string; password: string }) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    me: () => request("/auth/me"),
    updateProfile: (data: unknown) => request("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
    changePassword: (data: unknown) => request("/auth/me/password", { method: "PUT", body: JSON.stringify(data) }),
    deleteAccount: (data: { password: string }) => request("/auth/me", { method: "DELETE", body: JSON.stringify(data) }),
    logout: () => request("/auth/logout", { method: "POST" }),
  },

  posts: {
    list: (params?: string) => request(`/posts${params ? `?${params}` : ""}`),
    get: (id: string) => request(`/posts/${id}`),
    create: (data: unknown) => request("/posts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/posts/${id}`, { method: "DELETE" }),
    react: (id: string, reaction: string) => request(`/posts/${id}/react`, { method: "POST", body: JSON.stringify({ reaction }) }),
    repost: (id: string, body?: string) => request(`/posts/${id}/repost`, { method: "POST", body: JSON.stringify({ body }) }),
    comment: (id: string, data: { body: string; parentId?: string }) => request(`/posts/${id}/comments`, { method: "POST", body: JSON.stringify(data) }),
    deleteComment: (postId: string, commentId: string) => request(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),
    reactions: (id: string) => request(`/posts/${id}/reactions`),
  },

  notifications: {
    list: (params?: string) => request(`/notifications${params ? `?${params}` : ""}`),
    unreadCount: () => request("/notifications/unread-count"),
    markRead: () => request("/notifications/mark-read", { method: "POST" }),
  },

  tags: {
    list: (search?: string) => request(`/tags${search ? `?search=${search}` : ""}`),
  },

  explore: {
    posts: (params?: string) => request(`/explore${params ? `?${params}` : ""}`),
    tags: () => request("/explore/tags"),
    stats: () => request("/explore/stats"),
  },

  upload: (file: File, type: string = "posts") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return request("/upload", { method: "POST", body: formData });
  },

  admin: {
    users: (params?: string) => request(`/admin/users${params ? `?${params}` : ""}`),
    createUser: (data: unknown) => request("/admin/users", { method: "POST", body: JSON.stringify(data) }),
    updateUser: (id: string, data: unknown) => request(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteUser: (id: string) => request(`/admin/users/${id}`, { method: "DELETE" }),
    logs: (params?: string) => request(`/admin/logs${params ? `?${params}` : ""}`),
  },
};

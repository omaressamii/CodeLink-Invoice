const API_URL = "";

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}/api${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Something went wrong");
    }
    return response.json();
  },

  login: (credentials: any) => api.fetch("/login", { method: "POST", body: JSON.stringify(credentials) }),
  
  getClients: () => api.fetch("/clients"),
  createClient: (data: any) => api.fetch("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id: number, data: any) => api.fetch(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getProducts: () => api.fetch("/products"),
  createProduct: (data: any) => api.fetch("/products", { method: "POST", body: JSON.stringify(data) }),

  getQuotations: () => api.fetch("/quotations"),
  createQuotation: (data: any) => api.fetch("/quotations", { method: "POST", body: JSON.stringify(data) }),

  getContracts: () => api.fetch("/contracts"),
  createContract: (data: any) => api.fetch("/contracts", { method: "POST", body: JSON.stringify(data) }),

  getPayments: () => api.fetch("/payments"),
  createPayment: (data: any) => api.fetch("/payments", { method: "POST", body: JSON.stringify(data) }),

  getLicenses: () => api.fetch("/licenses"),

  getStats: () => api.fetch("/stats"),
  
  getAuditLogs: () => api.fetch("/audit-logs"),
  
  getUsers: () => api.fetch("/users"),
  createUser: (data: any) => api.fetch("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => api.fetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: number) => api.fetch(`/users/${id}`, { method: "DELETE" }),
  getRoles: () => api.fetch("/roles"),

  getSettings: () => api.fetch("/settings"),
  updateSettings: (data: any) => api.fetch("/settings", { method: "POST", body: JSON.stringify(data) }),
};

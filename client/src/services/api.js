import axios from "axios";

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle Global Errors (like Expired Tokens or Locks)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url;

    // Session Expired (401 Unauthorized)
    if (
      error.response &&
      error.response.status === 401 &&
      requestUrl !== "/auth/login"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Security Ejections & Archive Kicks (403 Forbidden)
    if (error.response && error.response.status === 403) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "";

      // The Kill-Switch / Version Mismatch Catcher
      if (errorMessage.includes("Session revoked")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert(
          "SECURITY ALERT: Your session has been revoked by the Administrator. You have been securely logged out.",
        );
        window.location.href = "/login";
      }

      // Deactivated Account Catcher
      if (errorMessage.includes("Account has been deactivated")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert(
          "ACCOUNT DISABLED: Your account has been deactivated by an Administrator. You have been securely logged out.",
        );
        window.location.href = "/login";
      }

      // Maintenance Mode Catcher
      if (errorMessage.includes("MAINTENANCE_MODE")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert(
          "SYSTEM LOCKED: Your branch is currently under Maintenance Mode. You have been securely logged out.",
        );
        window.location.href = "/login";
      }

      // Archived Branch Catcher
      if (errorMessage.includes("BRANCH_ARCHIVED")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("ACCESS DENIED: Your assigned branch has been decommissioned.");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;

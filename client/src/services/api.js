import axios from "axios";

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach Token to EVERY request
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

// Response Interceptor: Handle Global Security Ejections
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

      // Clear local storage immediately to ensure absolute logout
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (errorMessage.includes("Session revoked")) {
        window.location.href = "/login?alert=session_revoked";
      } else if (errorMessage.includes("Account has been deactivated")) {
        window.location.href = "/login?alert=account_deactivated";
      } else if (errorMessage.includes("MAINTENANCE_MODE")) {
        window.location.href = "/login?alert=maintenance_mode";
      } else if (errorMessage.includes("BRANCH_ARCHIVED")) {
        window.location.href = "/login?alert=branch_archived";
      }
    }

    return Promise.reject(error);
  },
);

export default api;

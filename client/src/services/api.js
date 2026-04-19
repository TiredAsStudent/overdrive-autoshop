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
      // If token is invalid/expired on a normal page, clear storage and kick to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Maintenance Mode Ejection & Archive Kicks (403 Forbidden)
    if (error.response && error.response.status === 403) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "";

      if (errorMessage.includes("MAINTENANCE_MODE")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert(
          "SYSTEM LOCKED: Your branch is currently under Maintenance Mode. You have been securely logged out.",
        );
        window.location.href = "/login";
      }

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

import api from "./api";

const authService = {
  loginWithEmail: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      const { user, token } = response.data.data;

      return { user, token };
    } catch (error) {
      // Extract the error message
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Login failed.";
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

export default authService;

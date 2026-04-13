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

  // Verify the 2-Hour Activation Token
  verifyInvite: async (token) => {
    try {
      const response = await api.get(`/auth/verify-invite/${token}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Invalid or expired invite link.",
      );
    }
  },

  // Submit the Activation Payload
  activateAccount: async (token, newPassword, policyAgreed) => {
    try {
      const response = await api.post("/auth/activate", {
        token,
        newPassword,
        policyAgreed,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Activation failed.",
      );
    }
  },
};

export default authService;

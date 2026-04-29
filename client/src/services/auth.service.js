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

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to process request.";
      throw new Error(message);
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Password reset failed.";
      throw new Error(message);
    }
  },

  verifyResetToken: async (token) => {
    try {
      const response = await api.get(`/auth/verify-reset-token/${token}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || "Invalid link.");
    }
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

  // --- CUSTOMER ACTIVATION ENDPOINTS ---
  verifyCustomerInvite: async (token) => {
    try {
      const response = await api.get(`/auth/verify-customer-invite/${token}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Invalid or expired link.",
      );
    }
  },

  activateCustomerAccount: async (token, newPassword, profileData) => {
    try {
      const response = await api.post("/auth/activate-customer", {
        token,
        newPassword,
        ...profileData, // Spreads first_name, last_name, make, model, year
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

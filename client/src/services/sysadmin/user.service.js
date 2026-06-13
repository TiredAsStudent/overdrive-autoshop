import api from "../api";

export const userService = {
  getRoster: async (page = 1, limit = 5, search = "") => {
    try {
      const response = await api.get("/sysadmin/users", {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch roster.",
      );
    }
  },

  inviteUser: async (userData) => {
    try {
      const response = await api.post("/sysadmin/users/invite", userData);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to send invite.";
      throw new Error(message);
    }
  },

  updateUser: async (id, updates) => {
    try {
      const response = await api.put(`/sysadmin/users/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update user.",
      );
    }
  },

  resendInvite: async (id) => {
    try {
      const response = await api.post(`/sysadmin/users/${id}/resend-invite`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to resend invite.",
      );
    }
  },

  killSession: async (id) => {
    try {
      const response = await api.post(`/sysadmin/users/${id}/kill-session`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to execute Kill-Switch.",
      );
    }
  },
};

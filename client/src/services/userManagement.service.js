import api from "./api";

const userManagementService = {
  // Get the Live Roster
  getRoster: async () => {
    try {
      const response = await api.get("/control-center/users");
      return response.data.data; // Extracts the array of users
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch roster.",
      );
    }
  },

  // Issue a new Invite
  inviteUser: async (userData) => {
    try {
      const response = await api.post("/control-center/users/invite", userData);
      return response.data.data;
    } catch (error) {
      // Specifically catch the detailed Zod validation errors if they exist
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to send invite.";
      throw new Error(message);
    }
  },

  // Update a User (Change Branch or Deactivate)
  updateUser: async (id, updates) => {
    try {
      const response = await api.put(`/control-center/users/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update user.",
      );
    }
  },

  // Resend the 2-Hour Link
  resendInvite: async (id) => {
    try {
      const response = await api.post(
        `/control-center/users/${id}/resend-invite`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to resend invite.",
      );
    }
  },
};

export default userManagementService;

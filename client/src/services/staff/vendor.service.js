import api from "../api";

export const vendorService = {
  getActiveLookup: async () => {
    try {
      const response = await api.get("/staff/vendors/active-lookup");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load active vendors.",
      );
    }
  },
};

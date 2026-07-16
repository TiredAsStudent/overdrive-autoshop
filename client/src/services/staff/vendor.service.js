import api from "../api";

export const vendorService = {
  getVendors: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    vatStatus = "all",
    branch = "all",
  ) => {
    try {
      const response = await api.get("/staff/vendors", {
        params: { page, limit, search, status, vat_status: vatStatus, branch },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load vendors.",
      );
    }
  },

  registerVendor: async (vendorData) => {
    try {
      const response = await api.post("/staff/vendors", vendorData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to register vendor.",
      );
    }
  },

  updateVendor: async (id, vendorData) => {
    try {
      const response = await api.put(`/staff/vendors/${id}`, vendorData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update vendor profile.",
      );
    }
  },
};

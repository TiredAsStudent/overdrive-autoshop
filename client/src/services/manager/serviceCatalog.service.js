import api from "../api";

export const serviceCatalogService = {
  // Fetch paginated and filtered services
  getAllServices: async (
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    status = "all",
  ) => {
    try {
      const response = await api.get("/manager/services", {
        params: { page, limit, search, category, status },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load service catalog.";
      throw new Error(message);
    }
  },

  // Create a new master service
  createService: async (serviceData) => {
    try {
      // Ensure numerical conversions before sending
      const payload = {
        ...serviceData,
        price: parseFloat(serviceData.price),
        estimated_minutes: parseInt(serviceData.estimated_minutes, 10),
      };
      const response = await api.post("/manager/services", payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to create service.";
      throw new Error(message);
    }
  },

  // Toggle Service Status (Soft Delete / Reactivate)
  toggleServiceStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/manager/services/${id}/status`, {
        is_active: isActive,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to update service status.";
      throw new Error(message);
    }
  },
};

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
      const payload = {
        ...serviceData,
        price: parseFloat(serviceData.price),
        estimated_minutes: parseInt(serviceData.estimated_minutes, 10),
        income_account_id: parseInt(serviceData.income_account_id, 10),
      };
      const response = await api.post("/manager/services", payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to create service.";
      throw new Error(message);
    }
  },

  updateService: async (id, serviceData) => {
    try {
      const payload = {
        ...serviceData,
        price: parseFloat(serviceData.price),
        estimated_minutes: parseInt(serviceData.estimated_minutes, 10),
        income_account_id: parseInt(serviceData.income_account_id, 10),
      };

      delete payload.service_code;

      const response = await api.put(`/manager/services/${id}`, payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to update service.";
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

  getActiveInventoryItems: async () => {
    try {
      const response = await api.get("/manager/inventory", {
        params: { page: 1, limit: 500, status: "active" },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to load inventory mapping:", error);
      return { data: [] };
    }
  },

  getServiceUsage: async (id) => {
    try {
      const response = await api.get(`/manager/services/${id}/usage`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load service usage history.";
      throw new Error(message);
    }
  },
};

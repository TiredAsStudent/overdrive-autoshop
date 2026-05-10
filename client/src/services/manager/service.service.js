import api from "../api";

export const serviceCatalogService = {
  // Fetch the master catalog
  getAllServices: async () => {
    try {
      const response = await api.get("/manager/services");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load service catalog.";
      throw new Error(message);
    }
  },

  // Add a new service
  createService: async (serviceData) => {
    try {
      const response = await api.post("/manager/services", serviceData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to create service.";
      throw new Error(message);
    }
  },

  // Update a service (Price changes, Deactivation)
  updateService: async (id, serviceData) => {
    try {
      const response = await api.put(`/manager/services/${id}`, serviceData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to update service.";
      throw new Error(message);
    }
  },
};

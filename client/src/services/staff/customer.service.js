import api from "../api";

export const customerService = {
  getCustomers: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branch = "all",
  ) => {
    try {
      const response = await api.get("/staff/customers", {
        params: { page, limit, search, status, branch },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load customers.";
      throw new Error(message);
    }
  },

  getCustomerProfile: async (id) => {
    try {
      const response = await api.get(`/staff/customers/${id}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load customer profile.";
      throw new Error(message);
    }
  },

  registerCustomer: async (customerData) => {
    try {
      const response = await api.post("/staff/customers", customerData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to register customer.";
      throw new Error(message);
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await api.put(`/staff/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to update customer profile.";
      throw new Error(message);
    }
  },
};

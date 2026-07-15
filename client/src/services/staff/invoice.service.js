import api from "../api";

export const invoiceService = {
  getInvoices: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branch = "all",
  ) => {
    try {
      const response = await api.get("/staff/invoices", {
        params: { page, limit, search, status, branch },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load invoices.",
      );
    }
  },

  getInvoiceDetails: async (id) => {
    try {
      const response = await api.get(`/staff/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch invoice details.",
      );
    }
  },

  createInvoice: async (data) => {
    try {
      const response = await api.post("/staff/invoices", data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to generate invoice.",
      );
    }
  },

  updateInvoice: async (id, updateData) => {
    try {
      const response = await api.patch(`/staff/invoices/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update invoice metadata.",
      );
    }
  },
};

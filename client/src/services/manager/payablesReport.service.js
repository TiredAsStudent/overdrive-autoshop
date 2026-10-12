import api from "../api";

export const payablesReportService = {
  getPayablesReport: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await api.get("/manager/reports/payables", {
        params: {
          page,
          limit,
          search: filters.search || undefined,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          vendor_id:
            filters.vendor_id !== "all" ? filters.vendor_id : undefined,
          payment_status:
            filters.payment_status !== "all"
              ? filters.payment_status
              : undefined,
          aging_category:
            filters.aging_category !== "all"
              ? filters.aging_category
              : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Payables Report.";
      throw new Error(message);
    }
  },

  getVendorDetails: async (vendorId) => {
    try {
      const response = await api.get(
        `/manager/reports/payables/${vendorId}/details`,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load vendor payable details.";
      throw new Error(message);
    }
  },
};

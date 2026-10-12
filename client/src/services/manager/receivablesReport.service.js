import api from "../api";

export const receivablesReportService = {
  getReceivablesReport: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await api.get("/manager/reports/receivables", {
        params: {
          page,
          limit,
          search: filters.search || undefined,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          customer_id:
            filters.customer_id !== "all" ? filters.customer_id : undefined,
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
        "Failed to load Receivables Report.";
      throw new Error(message);
    }
  },

  getCustomerDetails: async (customerId) => {
    try {
      const response = await api.get(
        `/manager/reports/receivables/${customerId}/details`,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load customer receivable details.";
      throw new Error(message);
    }
  },
};

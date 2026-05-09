import api from "../api";

export const vatService = {
  // Fetch the dashboard summary and transactions
  getLedger: async (taxPeriod, branchId = "") => {
    try {
      let url = `/manager/vat-ledger?tax_period=${taxPeriod}`;
      if (branchId) url += `&branch_id=${branchId}`;

      const response = await api.get(url);
      return response.data; // { success, message, data: { summary, period, transactions } }
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load VAT Ledger.";
      throw new Error(message);
    }
  },

  // Lock the tax period (Immutable Audit Trigger)
  closePeriod: async (taxPeriod) => {
    try {
      const response = await api.post("/manager/vat-ledger/close-period", {
        tax_period: taxPeriod,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to close tax period.";
      throw new Error(message);
    }
  },

  // Fetch branches for the filter dropdown
  getActiveBranches: async () => {
    try {
      const response = await api.get("/manager/branches/active");
      return response.data;
    } catch (error) {
      throw new Error("Failed to load branches.");
    }
  },
};

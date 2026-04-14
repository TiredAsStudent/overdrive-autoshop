import api from "./api";

const systemSettingsService = {
  // --- FINANCIALS ---
  getFinancials: async () => {
    try {
      const response = await api.get("/control-center/settings/financials");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load financials.",
      );
    }
  },

  updateFinancials: async (markupPercentage, vatPercentage) => {
    try {
      const response = await api.put("/control-center/settings/financials", {
        markupPercentage: Number(markupPercentage),
        vatPercentage: Number(vatPercentage),
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update financials.",
      );
    }
  },

  // --- BRANCHES ---
  getBranches: async () => {
    try {
      const response = await api.get("/control-center/settings/branches");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load branches.",
      );
    }
  },

  updateBranch: async (branchId, address, contactNumber) => {
    try {
      const response = await api.put(
        `/control-center/settings/branches/${branchId}`,
        {
          address,
          contactNumber,
        },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update branch.",
      );
    }
  },
};

export default systemSettingsService;

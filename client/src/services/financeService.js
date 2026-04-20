import api from "./api";

const financeService = {
  //  Get the 5 Mother Categories (Assets, Liabilities, Equity, Revenue, Expenses)
  getBaseCategories: async () => {
    try {
      const response = await api.get("/manager/accounts/categories");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch base categories.",
      );
    }
  },

  // Create a new Chart of Account
  createAccount: async (accountData) => {
    try {
      const response = await api.post("/manager/accounts", accountData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create account.",
      );
    }
  },

  // Update an existing account (Edit Label, Deactivate)
  updateAccount: async (id, updates) => {
    try {
      const response = await api.put(`/manager/accounts/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update account.",
      );
    }
  },

  // Get Enterprise Real-Time Balances (All branches side-by-side)
  getMultiBranchBalances: async () => {
    try {
      const response = await api.get("/manager/accounts/balances");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch enterprise balances.",
      );
    }
  },
};

export default financeService;

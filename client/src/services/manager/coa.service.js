import api from "../api";

export const coaService = {
  // Fetch all accounts
  getAllAccounts: async () => {
    try {
      const response = await api.get("/manager/chart-of-accounts");
      return response.data; // { success, message, data: [...] }
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Chart of Accounts.";
      throw new Error(message);
    }
  },

  // Create a new account
  createAccount: async (accountData) => {
    try {
      const response = await api.post(
        "/manager/chart-of-accounts",
        accountData,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to create account.";
      throw new Error(message);
    }
  },

  // Update an existing account
  updateAccount: async (id, accountData) => {
    try {
      const response = await api.put(
        `/manager/chart-of-accounts/${id}`,
        accountData,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        "Failed to update account.";
      throw new Error(message);
    }
  },
};

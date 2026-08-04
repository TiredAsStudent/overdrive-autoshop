import api from "../api";

export const chartOfAccountsService = {
  getAccounts: async (
    page = 1,
    limit = 10,
    search = "",
    type = "all",
    status = "all",
  ) => {
    try {
      const response = await api.get("/manager/accounting/accounts", {
        params: { page, limit, search, type, status },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Chart of Accounts.";
      throw new Error(message);
    }
  },

  getAccountDetails: async (id) => {
    try {
      const response = await api.get(`/manager/accounting/accounts/${id}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load account details.";
      throw new Error(message);
    }
  },

  getAccountUsage: async (id, page = 1, limit = 10) => {
    try {
      const response = await api.get(
        `/manager/accounting/accounts/${id}/usage`,
        {
          params: { page, limit },
        },
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to load account usage.";
      throw new Error(message);
    }
  },

  createAccount: async (accountData) => {
    try {
      const payload = {
        ...accountData,
        parent_id: accountData.parent_id
          ? parseInt(accountData.parent_id, 10)
          : null,
      };
      const response = await api.post("/manager/accounting/accounts", payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to create account.";
      throw new Error(message);
    }
  },

  updateAccount: async (id, accountData) => {
    try {
      const payload = {
        account_name: accountData.account_name,
        description: accountData.description,
        is_vat_applicable: accountData.is_vat_applicable,
        parent_id: accountData.parent_id
          ? parseInt(accountData.parent_id, 10)
          : null,
      };
      const response = await api.put(
        `/manager/accounting/accounts/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to update account.";
      throw new Error(message);
    }
  },

  toggleAccountStatus: async (id, isActive) => {
    try {
      const response = await api.patch(
        `/manager/accounting/accounts/${id}/status`,
        {
          is_active: isActive,
        },
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to update account status.";
      throw new Error(message);
    }
  },
};

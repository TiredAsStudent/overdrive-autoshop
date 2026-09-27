import api from "../api";

export const generalLedgerService = {
  getAccountLedger: async (
    accountId,
    page = 1,
    limit = 20,
    search = "",
    branch = "all",
    startDate = "",
    endDate = "",
  ) => {
    try {
      const response = await api.get(
        `/manager/accounting/general-ledger/${accountId}`,
        {
          params: {
            page,
            limit,
            search,
            branch,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          },
        },
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load General Ledger data.";
      throw new Error(message);
    }
  },
};

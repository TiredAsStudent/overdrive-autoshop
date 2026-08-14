import api from "../api";

export const stockTransferService = {
  getTransfers: async (
    page = 1,
    limit = 10,
    search = "",
    sourceBranch = "all",
    destBranch = "all",
    category = "all",
    startDate = null,
    endDate = null,
  ) => {
    try {
      const response = await api.get("/manager/transfers", {
        params: {
          page,
          limit,
          search,
          source_branch: sourceBranch,
          dest_branch: destBranch,
          category: category !== "all" ? category : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load stock transfers.";
      throw new Error(message);
    }
  },

  executeTransfer: async (transferData) => {
    try {
      const payload = {
        item_id: parseInt(transferData.item_id, 10),
        source_branch_id: parseInt(transferData.source_branch_id, 10),
        destination_branch_id: parseInt(transferData.destination_branch_id, 10),
        quantity: parseInt(transferData.quantity, 10),
        reason: transferData.reason,
      };
      const response = await api.post("/manager/transfers", payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to execute transfer.";
      throw new Error(message);
    }
  },
};

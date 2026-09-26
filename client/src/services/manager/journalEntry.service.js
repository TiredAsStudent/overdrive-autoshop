import api from "../api";

export const journalEntryService = {
  getJournalEntries: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branch = "all",
    startDate = "",
    endDate = "",
  ) => {
    try {
      const response = await api.get("/manager/accounting/journal-entries", {
        params: {
          page,
          limit,
          search,
          status,
          branch,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load journal entries.",
      );
    }
  },

  getJournalDetails: async (id) => {
    try {
      const response = await api.get(
        `/manager/accounting/journal-entries/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load journal details.",
      );
    }
  },

  saveJournalEntry: async (data) => {
    try {
      let response;
      if (data.id) {
        response = await api.put(
          `/manager/accounting/journal-entries/${data.id}`,
          data,
        );
      } else {
        response = await api.post("/manager/accounting/journal-entries", data);
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to save journal entry.",
      );
    }
  },

  deleteDraft: async (id) => {
    try {
      const response = await api.delete(
        `/manager/accounting/journal-entries/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to discard draft.",
      );
    }
  },
};

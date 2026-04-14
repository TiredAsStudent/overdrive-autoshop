import api from "./api";

const financeService = {
  // Get all categories (Admin CRUD view - fetches both ACTIVE and INACTIVE)
  getCategories: async (typeFilter = "") => {
    try {
      const url = typeFilter
        ? `/finance/accounts?type=${typeFilter}`
        : `/finance/accounts`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch categories.",
      );
    }
  },

  // Create a new category
  createCategory: async (categoryData) => {
    try {
      const response = await api.post("/finance/accounts", categoryData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create category.",
      );
    }
  },

  // Update a category (Rename, update description, or Archive)
  updateCategory: async (id, updates) => {
    try {
      const response = await api.put(`/finance/accounts/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update category.",
      );
    }
  },

  // Get Real-Time Balances (With Branch Context Lens)
  getBalances: async (branchId = null) => {
    try {
      const url = branchId
        ? `/finance/accounts/balances?branch_id=${branchId}`
        : `/finance/accounts/balances`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch balances.",
      );
    }
  },
};

export default financeService;

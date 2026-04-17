import api from "./api";

// Helper to determine which portal the user belongs to
const getPortal = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "STAFF" ? "staff" : "manager";
};

const financeService = {
  // Get all categories (Dynamically routes to /staff/accounts or /manager/accounts)
  getCategories: async (typeFilter = "") => {
    try {
      const portal = getPortal();
      const url = typeFilter
        ? `/${portal}/accounts?type=${typeFilter}`
        : `/${portal}/accounts`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch categories.",
      );
    }
  },

  // Create a new category (Strictly Manager)
  createCategory: async (categoryData) => {
    try {
      const response = await api.post("/manager/accounts", categoryData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create category.",
      );
    }
  },

  // Update a category (Strictly Manager)
  updateCategory: async (id, updates) => {
    try {
      const response = await api.put(`/manager/accounts/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update category.",
      );
    }
  },

  // Get Real-Time Balances (Strictly Manager)
  getBalances: async (branchId = null) => {
    try {
      const url = branchId
        ? `/manager/accounts/balances?branch_id=${branchId}`
        : `/manager/accounts/balances`;
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

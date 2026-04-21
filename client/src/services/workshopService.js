import api from "./api";

const getPortal = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "STAFF" ? "staff" : "manager";
};

const workshopService = {
  // --- MECHANICS ---
  getMechanics: async () => {
    try {
      const response = await api.get(`/${getPortal()}/mechanics`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch mechanics.",
      );
    }
  },

  createMechanic: async (mechanicData) => {
    try {
      const response = await api.post("/manager/mechanics", mechanicData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to register mechanic.",
      );
    }
  },

  updateMechanic: async (id, updates) => {
    try {
      const response = await api.put(`/manager/mechanics/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update mechanic.",
      );
    }
  },

  // --- SYSTEM HELPER ---
  getBranches: async () => {
    try {
      const response = await api.get("/manager/branches");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch branches.",
      );
    }
  },

  // --- SERVICES / COMBO MEALS  ---
  getServices: async () => {
    try {
      const response = await api.get(`/${getPortal()}/services`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to fetch services.",
      );
    }
  },

  createService: async (serviceData) => {
    try {
      const response = await api.post("/manager/services", serviceData);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to create service package.",
      );
    }
  },

  updateService: async (id, updates) => {
    try {
      const response = await api.put(`/manager/services/${id}`, updates);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update service package.",
      );
    }
  },

  // --- DEPENDENCY HELPERS (Inventory & Accounts) ---
  getInventory: async () => {
    try {
      const portal = getPortal();
      const endpoint =
        portal === "staff" ? "/staff/inventory/master" : "/manager/inventory";
      const response = await api.get(endpoint);
      return response.data.data;
    } catch (error) {
      console.warn("Inventory API not ready yet or failed:", error);
      return [];
    }
  },

  getAccounts: async () => {
    try {
      const response = await api.get("/manager/accounts/balances");
      let data = response.data.data;

      // this flattens it into one list!
      if (data && !Array.isArray(data) && typeof data === "object") {
        data = Object.values(data).flat();
      }

      return data || [];
    } catch (error) {
      console.warn("Accounts API not ready yet or failed:", error);
      return [];
    }
  },

  getSystemSettings: async () => {
    try {
      const response = await api.get("/manager/settings");
      return response.data.data;
    } catch (error) {
      console.warn("Settings API failed, falling back to defaults.", error);
      return { markup_percentage: 25, vat_percentage: 12 };
    }
  },
};

export default workshopService;

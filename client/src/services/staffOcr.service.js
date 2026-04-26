import api from "./api";

const staffOcrService = {
  /**
   * ACTION 1: Upload and Analyze (The "Gather & Grease-Proof" Phase)
   */
  analyzeReceipt: async (file) => {
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const response = await api.post("/staff/ocr/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to analyze receipt image.",
      );
    }
  },

  /**
   * ACTION 2: Submit Verified Data (The "Human-in-the-Loop" Handshake)
   */
  submitReceipt: async (payload) => {
    try {
      const response = await api.post("/staff/ocr/submit", payload);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error?.details) {
        const zodErrors = error.response.data.error.details
          .map((d) => d.message)
          .join(", ");
        throw new Error(`Validation Error: ${zodErrors}`);
      }
      throw new Error(
        error.response?.data?.message || "Failed to submit receipt.",
      );
    }
  },

  /**
   * ACTION 3: Cancel and Delete Ghost File
   */
  cancelUpload: async (imagePath) => {
    try {
      const response = await api.post("/staff/ocr/cancel", { imagePath });
      return response.data;
    } catch (error) {
      console.warn("Failed to cleanup ghost file:", error);
    }
  },

  /**
   * Get Accounting Categories for the Dropdown Tagging
   */
  getAccountCategories: async () => {
    try {
      const response = await api.get("/staff/accounts/categories");
      return response.data.data || response.data;
    } catch (error) {
      throw new Error("Failed to load account categories.");
    }
  },

  /**
   * Get Dynamic VAT from System Settings
   */
  getSystemSettings: async () => {
    try {
      const response = await api.get("/staff/settings");
      return response.data.data || response.data;
    } catch (error) {
      console.warn("Failed to load settings, using 12% default");
      return { vat_percentage: 12 };
    }
  },
};

export default staffOcrService;

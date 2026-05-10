import api from "../api";

export const staffExpenseService = {
  // Step 1: Upload image for AI Extraction
  scanReceipt: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append("receipt_image", imageFile);

      const response = await api.post("/staff/expenses/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.data?.image_url) {
        return error.response.data;
      }
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to scan receipt image. Please try again.",
      );
    }
  },

  // Step 2: Submit verified data to the Manager's Queue
  submitExpense: async (expenseData) => {
    try {
      const response = await api.post("/staff/expenses/submit", expenseData);
      return response.data;
    } catch (error) {
      let extractedMessage = "Failed to submit expense.";
      const responseData = error.response?.data;

      if (responseData?.error?.details) {
        extractedMessage = Array.isArray(responseData.error.details)
          ? responseData.error.details.map((err) => err.message).join(" | ")
          : responseData.error.details;
      } else if (responseData?.error?.message) {
        extractedMessage = responseData.error.message;
      }
      throw new Error(extractedMessage);
    }
  },

  // Helper: Fetch suppliers for the dropdown mapping
  getSuppliers: async () => {
    try {
      const response = await api.get("/staff/suppliers/active");
      return response.data;
    } catch (error) {
      console.warn("Supplier fetch failed.", error);
      return { data: [] };
    }
  },

  // Helper: Fetch dynamic system VAT rate
  getSystemVat: async () => {
    try {
      const response = await api.get("/staff/settings/vat");
      return response.data.data.vat_percentage;
    } catch (error) {
      console.warn("VAT fetch failed. Defaulting to 12%.", error);
      return 12; // Safe standard fallback
    }
  },
};

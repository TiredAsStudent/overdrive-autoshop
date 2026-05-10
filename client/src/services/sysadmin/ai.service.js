import api from "../api";

export const aiService = {
  getSettings: async () => {
    try {
      const response = await api.get("/sysadmin/ai-settings");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Failed to load AI configuration.";
      throw new Error(message);
    }
  },

  updateSettings: async (formData) => {
    try {
      const response = await api.put("/sysadmin/ai-settings", formData);
      return response.data;
    } catch (error) {
      let extractedMessage = "Failed to update AI settings.";
      const responseData = error.response?.data;

      if (responseData) {
        if (
          responseData.error?.details &&
          Array.isArray(responseData.error.details)
        ) {
          extractedMessage = responseData.error.details
            .map((err) => err.message)
            .join(" | ");
        } else if (
          responseData.error?.details &&
          typeof responseData.error.details === "object"
        ) {
          extractedMessage = Object.values(responseData.error.details)
            .map((val) => (typeof val === "object" ? val.message : val))
            .join(" | ");
        } else if (typeof responseData.error?.message === "string") {
          extractedMessage = responseData.error.message;
        } else if (typeof responseData.message === "string") {
          extractedMessage = responseData.message;
        }
      }
      throw new Error(extractedMessage);
    }
  },

  testConnection: async (credentials) => {
    try {
      const response = await api.post(
        "/sysadmin/ai-settings/test-connection",
        credentials,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Connection to Google AI Failed.";
      throw new Error(message);
    }
  },
};

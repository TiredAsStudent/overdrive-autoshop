import api from "../api";

export const settingsService = {
  getSettings: async () => {
    try {
      const response = await api.get("/sysadmin/settings");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message || "Failed to load settings.";
      throw new Error(message);
    }
  },

  updateSettings: async (formData) => {
    try {
      const response = await api.put("/sysadmin/settings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      let extractedMessage = "Failed to update settings.";
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
        } else if (typeof responseData.error === "string") {
          extractedMessage = responseData.error;
        }
      }

      if (typeof extractedMessage !== "string") {
        extractedMessage =
          "Validation Error: Please check your numerical inputs.";
      }

      throw new Error(extractedMessage);
    }
  },
};

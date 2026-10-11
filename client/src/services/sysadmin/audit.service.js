import api from "../api";
import {
  downloadBlobAsFile,
  extractBlobError,
} from "../../utils/fileDownloader";

export const auditService = {
  getSeverities: async () => {
    try {
      const response = await api.get("/sysadmin/audit/severities");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load system severities.";
      throw new Error(message);
    }
  },

  // Fetch paginated logs with filters
  getLogs: async (params) => {
    try {
      const response = await api.get("/sysadmin/audit", { params });
      return response.data; // Returns { success, data: [], pagination: {} }
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to retrieve audit logs.";
      throw new Error(message);
    }
  },

  exportLogs: async (params) => {
    try {
      const response = await api.get("/sysadmin/audit/export", {
        params,
        responseType: "blob",
      });

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Overdrive_Audit_Report_${dateStr}.csv`;

      downloadBlobAsFile(response.data, filename);

      return true;
    } catch (error) {
      const message = await extractBlobError(error);
      throw new Error(message);
    }
  },
};

import api from "../api";

export const auditService = {
  // Fetch paginated logs with filters
  getLogs: async (params) => {
    try {
      const response = await api.get("/sysadmin/audit", { params });
      return response.data; // Returns { success, message, data: { logs: [], pagination: {} } }
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to retrieve audit logs.";
      throw new Error(message);
    }
  },

  // Trigger CSV Export Download
  exportLogs: async (params) => {
    try {
      const response = await api.get("/sysadmin/audit/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const dateStr = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `Overdrive_Audit_Report_${dateStr}.csv`);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      throw new Error(
        "Failed to export logs. Please ensure records exist for this filter.",
      );
    }
  },
};

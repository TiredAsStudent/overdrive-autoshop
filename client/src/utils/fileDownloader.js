/**
 * Universal File Downloader Utility
 * Safely handles Blob downloads, injects UTF-8 BOM for Excel compatibility,
 * and prevents browser memory leaks via URL revocation.
 *
 * @param {Blob|String} data - The raw data or blob from the API response
 * @param {String} filename - The target filename (e.g., 'Report.csv')
 */
export const downloadBlobAsFile = (data, filename) => {
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);

  const blob = new Blob([bom, data], {
    type: data.type || "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);

  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);

  window.URL.revokeObjectURL(url);
};

/**
 * Safely extracts backend JSON error messages from a rejected Blob response.
 * (When responseType="blob", Axios wraps standard JSON errors inside a binary Blob).
 *
 * @param {Object} error - The caught Axios error object
 * @returns {Promise<String>} The clean, readable error message
 */
export const extractBlobError = async (error) => {
  if (error.response && error.response.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const json = JSON.parse(text);
      return (
        json.error?.message || json.message || "Export failed to generate."
      );
    } catch (e) {
      return "An unexpected error occurred during the export process.";
    }
  }
  return (
    error.response?.data?.error?.message ||
    error.message ||
    "Failed to export file."
  );
};

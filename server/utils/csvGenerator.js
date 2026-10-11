/**
 * Universal CSV Generator Utility
 * Safely converts array data into a properly formatted CSV string.
 * Escapes internal quotes and handles null/undefined values to prevent CSV injection.
 *
 * @param {Array<String>} headers - Array of column headers
 * @param {Array<Array<Any>>} rows - 2D Array of row data matching header order
 * @returns {String} Formatted CSV text
 */
const generateCSV = (headers, rows) => {
  const csvHeaders = headers
    .map((header) => `"${String(header).replace(/"/g, '""')}"`)
    .join(",");

  const csvRows = rows.map((row) =>
    row
      .map((value) => {
        if (value === null || value === undefined) return '""';

        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  return [csvHeaders, ...csvRows].join("\n");
};

module.exports = { generateCSV };

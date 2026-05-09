const { query } = require("../config/db");

class Supplier {
  static async getActive() {
    // Fetching the basic info needed for the frontend dropdown
    const sql = `
      SELECT id, supplier_name, tin 
      FROM suppliers 
      ORDER BY supplier_name ASC
    `;
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = Supplier;

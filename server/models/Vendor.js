const { query } = require("../config/db");

class Vendor {
  static async generateVendorCode() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `VEND-${yearMonth}-`;

    const sql = `SELECT vendor_code FROM vendors WHERE vendor_code LIKE $1 ORDER BY id DESC LIMIT 1`;
    const result = await query(sql, [`${prefix}%`]);

    let sequence = 1;
    if (result.rows[0]) {
      const lastSequence = parseInt(
        result.rows[0].vendor_code.split("-")[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  static async checkDuplicate(businessName, branchId, excludeId = null) {
    let sql = `SELECT id, business_name FROM vendors WHERE branch_id = $1 AND LOWER(business_name) = LOWER($2)`;
    const params = [branchId, businessName];

    if (excludeId) {
      sql += ` AND id != $3`;
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async create(data) {
    const sql = `
      INSERT INTO vendors (
        vendor_code, business_name, contact_person, business_address, 
        contact_number, email, tin, is_vat_registered, branch_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `;
    const values = [
      data.vendor_code,
      data.business_name,
      data.contact_person,
      data.business_address,
      data.contact_number,
      data.email,
      data.tin,
      data.is_vat_registered,
      data.branch_id,
      data.notes,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async countFiltered(search, status, vatStatus, branchId) {
    let sql = `SELECT COUNT(*) FROM vendors`;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(business_name ILIKE $${paramIdx} OR vendor_code ILIKE $${paramIdx} OR contact_person ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status === "active") conditions.push(`is_active = TRUE`);
    else if (status === "inactive") conditions.push(`is_active = FALSE`);

    if (vatStatus === "vat") conditions.push(`is_vat_registered = TRUE`);
    else if (vatStatus === "non_vat")
      conditions.push(`is_vat_registered = FALSE`);

    if (branchId && branchId !== "all") {
      conditions.push(`branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    const result = await query(sql, values);
    return parseInt(result.rows[0].count, 10);
  }

  static async findPaginatedFiltered(
    limit,
    offset,
    search,
    status,
    vatStatus,
    branchId,
  ) {
    let sql = `
      SELECT v.*, b.branch_name 
      FROM vendors v
      LEFT JOIN branches b ON v.branch_id = b.id
    `;
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(v.business_name ILIKE $${paramIdx} OR v.vendor_code ILIKE $${paramIdx} OR v.contact_person ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (status === "active") conditions.push(`v.is_active = TRUE`);
    else if (status === "inactive") conditions.push(`v.is_active = FALSE`);

    if (vatStatus === "vat") conditions.push(`v.is_vat_registered = TRUE`);
    else if (vatStatus === "non_vat")
      conditions.push(`v.is_vat_registered = FALSE`);

    if (branchId && branchId !== "all") {
      conditions.push(`v.branch_id = $${paramIdx}`);
      values.push(branchId);
      paramIdx++;
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
    sql += ` ORDER BY v.is_active DESC, v.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  static async findById(id) {
    const sql = `
      SELECT v.*, b.branch_name 
      FROM vendors v 
      LEFT JOIN branches b ON v.branch_id = b.id 
      WHERE v.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    const updatableFields = [
      "business_name",
      "contact_person",
      "business_address",
      "contact_number",
      "email",
      "tin",
      "is_vat_registered",
      "is_active",
      "notes",
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${paramIdx}`);
        values.push(data[field]);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) {
      const res = await query(`SELECT * FROM vendors WHERE id = $1`, [id]);
      return res.rows[0];
    }

    setClauses.push(`updated_at = NOW()`);

    values.push(id);

    const sql = `
      UPDATE vendors 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIdx}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = Vendor;

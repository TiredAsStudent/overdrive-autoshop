const { query } = require("../config/db");

class PayablesReport {
  static buildFilterConditions(filters) {
    const conditions = ["b.status IN ('RECEIVED', 'CLOSED')"];
    const values = [];
    let paramIdx = 1;

    if (filters.branch && filters.branch !== "all") {
      conditions.push(`b.branch_id = $${paramIdx}`);
      values.push(parseInt(filters.branch, 10));
      paramIdx++;
    }

    if (filters.vendor_id && filters.vendor_id !== "all") {
      conditions.push(`b.vendor_id = $${paramIdx}`);
      values.push(parseInt(filters.vendor_id, 10));
      paramIdx++;
    }

    if (filters.start_date) {
      conditions.push(`b.bill_date >= $${paramIdx}::date`);
      values.push(filters.start_date);
      paramIdx++;
    }

    if (filters.end_date) {
      conditions.push(`b.bill_date <= $${paramIdx}::date`);
      values.push(filters.end_date);
      paramIdx++;
    }

    if (filters.payment_status && filters.payment_status !== "all") {
      if (filters.payment_status === "OVERDUE") {
        conditions.push(
          `b.payment_status IN ('UNPAID', 'PARTIALLY_PAID') AND b.due_date < CURRENT_DATE`,
        );
      } else {
        conditions.push(`b.payment_status = $${paramIdx}`);
        values.push(filters.payment_status.toUpperCase());
        paramIdx++;
      }
    } else {
      conditions.push(`b.payment_status IN ('UNPAID', 'PARTIALLY_PAID')`);
    }

    if (filters.aging_category && filters.aging_category !== "all") {
      const bucket = filters.aging_category;
      if (bucket === "CURRENT") {
        conditions.push(`b.due_date >= CURRENT_DATE`);
      } else if (bucket === "1_30_DAYS") {
        conditions.push(
          `(CURRENT_DATE - b.due_date::date)::int BETWEEN 1 AND 30`,
        );
      } else if (bucket === "31_60_DAYS") {
        conditions.push(
          `(CURRENT_DATE - b.due_date::date)::int BETWEEN 31 AND 60`,
        );
      } else if (bucket === "61_90_DAYS") {
        conditions.push(
          `(CURRENT_DATE - b.due_date::date)::int BETWEEN 61 AND 90`,
        );
      } else if (bucket === "OVER_90_DAYS") {
        conditions.push(`(CURRENT_DATE - b.due_date::date)::int > 90`);
      }
    }

    if (filters.search) {
      conditions.push(
        `(b.bill_number ILIKE $${paramIdx} OR v.business_name ILIKE $${paramIdx} OR b.vendor_invoice_number ILIKE $${paramIdx})`,
      );
      values.push(`%${filters.search}%`);
      paramIdx++;
    }

    return {
      whereClause: `WHERE ` + conditions.join(" AND "),
      values,
      paramIdx,
    };
  }

  static async getExecutiveKPIs(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        COUNT(DISTINCT b.id) as open_bills_count,
        COALESCE(SUM(b.grand_total - b.amount_paid), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN b.due_date < CURRENT_DATE THEN (b.grand_total - b.amount_paid) ELSE 0 END), 0) as total_overdue,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - b.due_date::date)::int > 90 THEN (b.grand_total - b.amount_paid) ELSE 0 END), 0) as high_risk_overdue
      FROM bills b
      JOIN vendors v ON b.vendor_id = v.id
      ${whereClause}
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getAgingDistribution(filters) {
    const { whereClause, values } = this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN b.due_date >= CURRENT_DATE THEN (b.grand_total - b.amount_paid) ELSE 0 END), 0) as current_balance,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - b.due_date::date)::int BETWEEN 1 AND 30 THEN (b.grand_total - b.amount_paid) ELSE 0 END), 0) as days_1_30,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - b.due_date::date)::int BETWEEN 31 AND 60 THEN (b.grand_total - b.amount_paid) ELSE 0 END), 0) as days_31_60,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - b.due_date::date)::int BETWEEN 61 AND 90 THEN (b.grand_total - b.amount_paid) ELSE 0 END), 0) as days_61_90,
        COALESCE(SUM(CASE WHEN (CURRENT_DATE - b.due_date::date)::int > 90 THEN (b.grand_total - b.amount_paid) ELSE 0 END), 0) as days_over_90
      FROM bills b
      JOIN vendors v ON b.vendor_id = v.id
      ${whereClause}
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async getPaginatedLedger(filters, limit, offset) {
    const { whereClause, values, paramIdx } =
      this.buildFilterConditions(filters);
    const sql = `
      SELECT 
        b.id as bill_id,
        b.bill_number,
        b.vendor_invoice_number,
        TO_CHAR(b.bill_date, 'YYYY-MM-DD') as bill_date,
        TO_CHAR(b.due_date, 'YYYY-MM-DD') as due_date,
        v.id as vendor_id,
        v.business_name as vendor_name,
        v.vendor_code,
        br.branch_name,
        b.grand_total as bill_amount,
        b.amount_paid,
        (b.grand_total - b.amount_paid) as outstanding_balance,
        GREATEST((CURRENT_DATE - b.due_date::date)::int, 0) as days_overdue,
        CASE 
          WHEN b.payment_status IN ('UNPAID', 'PARTIALLY_PAID') AND b.due_date < CURRENT_DATE THEN 'OVERDUE'
          ELSE b.payment_status::text 
        END as status,
        COUNT(*) OVER() as total_filtered_count
      FROM bills b
      JOIN vendors v ON b.vendor_id = v.id
      JOIN branches br ON b.branch_id = br.id
      ${whereClause}
      ORDER BY b.due_date ASC, b.created_at ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    values.push(limit, offset);
    const result = await query(sql, values);

    const totalCount =
      result.rows.length > 0
        ? parseInt(result.rows[0].total_filtered_count, 10)
        : 0;
    const ledger = result.rows.map((row) => {
      delete row.total_filtered_count;
      return row;
    });

    return { ledger, totalCount };
  }

  static async getVendorPayableDetails(vendorId) {
    // 1. Fetch Vendor Profile
    const vendRes = await query(
      `SELECT id, vendor_code, business_name, contact_person, contact_number, email, business_address, tin FROM vendors WHERE id = $1`,
      [vendorId],
    );
    if (vendRes.rows.length === 0) return null;

    // 2. Fetch Lifetime Spend
    const spendRes = await query(
      `SELECT COALESCE(SUM(grand_total), 0) as total_spend FROM bills WHERE vendor_id = $1 AND status IN ('RECEIVED', 'CLOSED')`,
      [vendorId],
    );

    // 3. Fetch Outstanding Bills (Strict AP Liability only)
    const billsSql = `
      SELECT 
        id, bill_number, vendor_invoice_number, TO_CHAR(bill_date, 'YYYY-MM-DD') as bill_date, 
        TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
        grand_total, amount_paid, (grand_total - amount_paid) as remaining_balance,
        CASE 
          WHEN payment_status IN ('UNPAID', 'PARTIALLY_PAID') AND due_date < CURRENT_DATE THEN 'OVERDUE'
          ELSE payment_status::text 
        END as status
      FROM bills 
      WHERE vendor_id = $1 AND status IN ('RECEIVED', 'CLOSED') AND payment_status IN ('UNPAID', 'PARTIALLY_PAID')
      ORDER BY due_date ASC
    `;
    const bills = (await query(billsSql, [vendorId])).rows;

    // 4. Fetch Payment History (Includes VOID for audit integrity)
    const paySql = `
      SELECT 
        vp.id, vp.payment_number, TO_CHAR(vp.payment_date, 'YYYY-MM-DD') as payment_date, 
        vp.amount_paid, vp.payment_method, vp.reference_number, vp.status,
        b.bill_number, b.vendor_invoice_number
      FROM vendor_payments vp
      JOIN bills b ON vp.bill_id = b.id
      WHERE vp.vendor_id = $1
      ORDER BY vp.payment_date DESC, vp.created_at DESC
    `;
    const payments = (await query(paySql, [vendorId])).rows;

    return {
      vendor: {
        ...vendRes.rows[0],
        lifetime_spend: parseFloat(spendRes.rows[0].total_spend),
      },
      outstanding_bills: bills,
      payment_history: payments,
    };
  }
}

module.exports = PayablesReport;

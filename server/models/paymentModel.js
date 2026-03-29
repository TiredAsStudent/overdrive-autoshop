const db = require("../config/db");

class PaymentModel {
  static async recordPayment(
    estimateId,
    branchId,
    staffId,
    amount,
    method,
    referenceNumber,
    client = db,
  ) {
    const query = `
      INSERT INTO payments (estimate_id, branch_id, processed_by, amount, method, reference_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      estimateId,
      branchId,
      staffId,
      amount,
      method,
      referenceNumber || null,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }

  static async getPaymentByEstimate(estimateId, client = db) {
    const query = `SELECT * FROM payments WHERE estimate_id = $1;`;
    const result = await client.query(query, [estimateId]);
    return result.rows[0];
  }
}

module.exports = PaymentModel;

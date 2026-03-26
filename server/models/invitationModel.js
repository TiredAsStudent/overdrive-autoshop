const db = require("../config/db");

class InvitationModel {
  static async create(
    email,
    role,
    branchId,
    tokenHash,
    expiresAt,
    adminId,
    client = db,
  ) {
    const query = `
      INSERT INTO user_invitations (email, role, branch_id, token_hash, expires_at, invited_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, expires_at;
    `;
    const result = await client.query(query, [
      email,
      role,
      branchId,
      tokenHash,
      expiresAt,
      adminId,
    ]);
    return result.rows[0];
  }

  static async createCustomerInvite(
    email,
    branchId,
    tokenHash,
    staffId,
    client = db,
  ) {
    const query = `
      INSERT INTO user_invitations (email, role, branch_id, token_hash, expires_at, invited_by)
      VALUES ($1, 'CUSTOMER', $2, $3, NULL, $4)
      RETURNING id, email;
    `;
    const result = await client.query(query, [
      email,
      branchId,
      tokenHash,
      staffId,
    ]);
    return result.rows[0];
  }

  static async findByTokenHash(tokenHash, client = db) {
    const query = `SELECT * FROM user_invitations WHERE token_hash = $1`;
    const result = await client.query(query, [tokenHash]);
    return result.rows[0];
  }

  static async markAsUsed(id, client = db) {
    const query = `UPDATE user_invitations SET is_used = TRUE WHERE id = $1`;
    await client.query(query, [id]);
  }
}

module.exports = InvitationModel;

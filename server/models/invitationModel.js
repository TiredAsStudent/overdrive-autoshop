const db = require("../config/db");

class InvitationModel {
  static async create(email, role, branchId, tokenHash, expiresAt, adminId) {
    const query = `
      INSERT INTO user_invitations (email, role, branch_id, token_hash, expires_at, invited_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, expires_at;
    `;
    const result = await db.query(query, [
      email,
      role,
      branchId,
      tokenHash,
      expiresAt,
      adminId,
    ]);
    return result.rows[0];
  }

  static async findByTokenHash(tokenHash) {
    const query = `SELECT * FROM user_invitations WHERE token_hash = $1`;
    const result = await db.query(query, [tokenHash]);
    return result.rows[0];
  }

  static async markAsUsed(id) {
    const query = `UPDATE user_invitations SET is_used = TRUE WHERE id = $1`;
    await db.query(query, [id]);
  }
}

module.exports = InvitationModel;

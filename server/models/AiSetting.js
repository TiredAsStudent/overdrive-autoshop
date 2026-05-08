const { query } = require("../config/db");

class AiSetting {
  static async getSettings() {
    const sql = `
      SELECT 
        gemini_api_key, ai_confidence_threshold, ai_model, 
        ai_htr_enabled, ai_omr_enabled, ai_system_instruction, 
        ai_total_scans, ai_successful_scans, ai_flagged_scans 
      FROM system_settings WHERE id = 1
    `;
    const result = await query(sql);
    return result.rows[0];
  }

  static async update(data) {
    const sql = `
      UPDATE system_settings 
      SET 
        gemini_api_key = COALESCE($1, gemini_api_key),
        ai_confidence_threshold = COALESCE($2, ai_confidence_threshold),
        ai_model = COALESCE($3, ai_model),
        ai_htr_enabled = COALESCE($4, ai_htr_enabled),
        ai_omr_enabled = COALESCE($5, ai_omr_enabled),
        ai_system_instruction = COALESCE($6, ai_system_instruction),
        updated_at = NOW()
      WHERE id = 1
      RETURNING ai_confidence_threshold, ai_model, ai_htr_enabled, ai_omr_enabled, ai_system_instruction;
    `;

    const values = [
      data.gemini_api_key !== undefined ? data.gemini_api_key : null,
      data.ai_confidence_threshold !== undefined
        ? data.ai_confidence_threshold
        : null,
      data.ai_model !== undefined ? data.ai_model : null,
      data.ai_htr_enabled !== undefined ? data.ai_htr_enabled : null,
      data.ai_omr_enabled !== undefined ? data.ai_omr_enabled : null,
      data.ai_system_instruction !== undefined
        ? data.ai_system_instruction
        : null,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }
}

module.exports = AiSetting;

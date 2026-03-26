const db = require("../config/db");

class ServiceTemplateModel {
  static async createTemplate(name, description, laborCost, client = db) {
    const query = `
      INSERT INTO service_templates (template_name, description, labor_cost)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await client.query(query, [name, description, laborCost]);
    return result.rows[0];
  }

  static async createTemplateItem(
    templateId,
    masterPartId,
    quantity,
    client = db,
  ) {
    const query = `
      INSERT INTO service_template_items (template_id, master_part_id, quantity)
      VALUES ($1, $2, $3);
    `;
    await client.query(query, [templateId, masterPartId, quantity]);
  }

  static async getAll(onlyActive = false, client = db) {
    // Dynamic Pricing Engine: This query fetches the template AND calculates the live price
    // based on the current retail_price in the master_inventory table.
    const activeFilter = onlyActive ? "WHERE st.is_active = TRUE" : "";
    const query = `
      SELECT 
          st.id, st.template_name, st.description, st.labor_cost, st.is_active,
          COALESCE(
              json_agg(
                  json_build_object(
                      'item_id', sti.id,
                      'part_id', mi.id,
                      'part_name', mi.part_name,
                      'quantity', sti.quantity,
                      'current_retail_price', mi.retail_price,
                      'subtotal', (sti.quantity * mi.retail_price)
                  )
              ) FILTER (WHERE sti.id IS NOT NULL), '[]'
          ) as parts,
          (st.labor_cost + COALESCE(SUM(sti.quantity * mi.retail_price), 0)) AS dynamic_total_price
      FROM service_templates st
      LEFT JOIN service_template_items sti ON st.id = sti.template_id
      LEFT JOIN master_inventory mi ON sti.master_part_id = mi.id
      ${activeFilter}
      GROUP BY st.id
      ORDER BY st.template_name ASC;
    `;
    const result = await client.query(query);
    return result.rows;
  }

  static async updateTemplate(id, name, description, laborCost, client = db) {
    const query = `
      UPDATE service_templates 
      SET template_name = $1, description = $2, labor_cost = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const result = await client.query(query, [
      name,
      description,
      laborCost,
      id,
    ]);
    return result.rows[0];
  }

  static async clearTemplateItems(templateId, client = db) {
    // Used during updates: Wipe the old ingredients before inserting the new ones
    const query = `DELETE FROM service_template_items WHERE template_id = $1;`;
    await client.query(query, [templateId]);
  }

  static async updateStatus(id, isActive, client = db) {
    const query = `
      UPDATE service_templates SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *;
    `;
    const result = await client.query(query, [isActive, id]);
    return result.rows[0];
  }
}

module.exports = ServiceTemplateModel;

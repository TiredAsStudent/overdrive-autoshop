const { query, pool } = require("../config/db");

class ServiceModel {
  static async findServiceByName(name) {
    const sql = `SELECT id FROM services WHERE LOWER(name) = LOWER($1)`;
    const result = await query(sql, [name]);
    return result.rows[0];
  }

  static async findServiceById(id) {
    const sql = `
      SELECT 
        s.id, s.name, s.category, s.labor_fee, s.description, s.is_active, s.revenue_account_id,
        COALESCE(
          json_agg(
            json_build_object('inventory_id', sp.inventory_id, 'quantity_required', sp.quantity_required)
          ) FILTER (WHERE sp.inventory_id IS NOT NULL), '[]'
        ) AS parts
      FROM services s
      LEFT JOIN service_parts sp ON s.id = sp.service_id
      WHERE s.id = $1
      GROUP BY s.id
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getAllServices(onlyActive = false) {
    let sql = `
      SELECT 
        s.id, s.name, s.category, s.labor_fee, s.description, s.is_active,
        s.revenue_account_id, a.account_code, a.account_name,
        COALESCE(SUM(i.unit_cost * sp.quantity_required), 0) AS total_parts_base_cost,
        COALESCE(
          json_agg(
            json_build_object(
              'inventory_id', sp.inventory_id, 
              'part_name', i.item_name, 
              'quantity', sp.quantity_required, 
              'unit_cost', i.unit_cost
            )
          ) FILTER (WHERE sp.inventory_id IS NOT NULL), '[]'
        ) AS parts
      FROM services s
      LEFT JOIN service_parts sp ON s.id = sp.service_id
      LEFT JOIN inventory i ON sp.inventory_id = i.id
      LEFT JOIN chart_of_accounts a ON s.revenue_account_id = a.id
      ${onlyActive ? `WHERE s.is_active = TRUE` : ``}
      GROUP BY s.id, a.id
      ORDER BY s.category ASC, s.name ASC;
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async createService(serviceData, partsArray) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertServiceSql = `
        INSERT INTO services (name, category, labor_fee, revenue_account_id, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const sResult = await client.query(insertServiceSql, [
        serviceData.name,
        serviceData.category,
        serviceData.labor_fee,
        serviceData.revenue_account_id,
        serviceData.description,
      ]);
      const newService = sResult.rows[0];

      if (partsArray && partsArray.length > 0) {
        const partInsertValues = partsArray
          .map((_, index) => `($1, $${index * 2 + 2}, $${index * 2 + 3})`)
          .join(", ");

        const partParams = [newService.id];
        partsArray.forEach((p) => {
          partParams.push(p.inventory_id, p.quantity_required);
        });

        const insertPartsSql = `INSERT INTO service_parts (service_id, inventory_id, quantity_required) VALUES ${partInsertValues}`;
        await client.query(insertPartsSql, partParams);
      }

      await client.query("COMMIT");
      return newService;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateService(id, updates, partsArray) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const fields = [];
      const params = [id];
      let paramIndex = 2;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        const updateSql = `UPDATE services SET ${fields.join(", ")} WHERE id = $1`;
        await client.query(updateSql, params);
      }

      if (partsArray !== undefined) {
        await client.query(`DELETE FROM service_parts WHERE service_id = $1`, [
          id,
        ]);

        if (partsArray.length > 0) {
          const partInsertValues = partsArray
            .map((_, index) => `($1, $${index * 2 + 2}, $${index * 2 + 3})`)
            .join(", ");
          const partParams = [id];
          partsArray.forEach((p) => {
            partParams.push(p.inventory_id, p.quantity_required);
          });
          await client.query(
            `INSERT INTO service_parts (service_id, inventory_id, quantity_required) VALUES ${partInsertValues}`,
            partParams,
          );
        }
      }

      await client.query("COMMIT");

      // Fetch full updated entity to return
      const finalState = await client.query(
        `SELECT * FROM services WHERE id = $1`,
        [id],
      );
      return finalState.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ServiceModel;

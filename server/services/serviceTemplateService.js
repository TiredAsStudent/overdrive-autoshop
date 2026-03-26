const db = require("../config/db");
const ServiceTemplateModel = require("../models/serviceTemplateModel");
const AuditModel = require("../models/auditModel");

class ServiceTemplateService {
  static async createComboMeal(adminId, adminBranchId, data, ipAddress) {
    const { templateName, description, laborCost, parts } = data;
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      //Create the Parent (Template)
      const newTemplate = await ServiceTemplateModel.createTemplate(
        templateName,
        description,
        laborCost,
        client,
      );

      // Create the Children (Ingredients)
      if (parts && parts.length > 0) {
        for (const part of parts) {
          await ServiceTemplateModel.createTemplateItem(
            newTemplate.id,
            part.masterPartId,
            part.quantity,
            client,
          );
        }
      }

      // Log to Audit Trail
      await AuditModel.log(
        adminId,
        adminBranchId,
        "CREATED_SERVICE_TEMPLATE",
        "service_templates",
        newTemplate.id,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return newTemplate;
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23505")
        throw new Error("A template with this name already exists.");
      throw new Error("Failed to create Service Template.");
    } finally {
      client.release();
    }
  }

  static async updateComboMeal(
    adminId,
    adminBranchId,
    templateId,
    data,
    ipAddress,
  ) {
    const { templateName, description, laborCost, parts } = data;
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      //Update Parent
      const updatedTemplate = await ServiceTemplateModel.updateTemplate(
        templateId,
        templateName,
        description,
        laborCost,
        client,
      );
      if (!updatedTemplate) throw new Error("Template not found.");

      // Replace Children (Wipe old, insert new)
      await ServiceTemplateModel.clearTemplateItems(templateId, client);
      if (parts && parts.length > 0) {
        for (const part of parts) {
          await ServiceTemplateModel.createTemplateItem(
            templateId,
            part.masterPartId,
            part.quantity,
            client,
          );
        }
      }

      await AuditModel.log(
        adminId,
        adminBranchId,
        "UPDATED_SERVICE_TEMPLATE",
        "service_templates",
        templateId,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedTemplate;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to update Service Template.");
    } finally {
      client.release();
    }
  }

  static async getTemplates(userRole) {
    // Admin sees all (including deactivated ones). Staff only sees active ones for their dashboard.
    const onlyActive = userRole === "STAFF";
    return await ServiceTemplateModel.getAll(onlyActive);
  }

  static async toggleStatus(
    adminId,
    adminBranchId,
    templateId,
    isActive,
    ipAddress,
  ) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const template = await ServiceTemplateModel.updateStatus(
        templateId,
        isActive,
        client,
      );
      if (!template) throw new Error("Template not found.");

      const action = isActive ? "REACTIVATED_TEMPLATE" : "DEACTIVATED_TEMPLATE";
      await AuditModel.log(
        adminId,
        adminBranchId,
        action,
        "service_templates",
        templateId,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return template;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error("Failed to change template status.");
    } finally {
      client.release();
    }
  }
}

module.exports = ServiceTemplateService;

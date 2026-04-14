const ServiceModel = require("../../models/workshop/serviceModel");
const { query } = require("../../config/db");

class WorkshopServiceLogic {
  static async getServicesWithDynamicPricing(onlyActive) {
    const rawServices = await ServiceModel.getAllServices(onlyActive);

    // Fetch the LIVE Enterprise Standards from system_settings
    const settingsSql = `SELECT markup_percentage, vat_percentage FROM system_settings WHERE id = 1`;
    const settingsResult = await query(settingsSql);

    // Default to your SQL baseline if the table is empty
    let GLOBAL_MARKUP_PERCENT = 0.25; // 25% Markup
    let GLOBAL_TAX_RATE = 0.12; // 12% VAT

    if (settingsResult.rows.length > 0) {
      const settings = settingsResult.rows[0];
      // Convert SQL percentages (e.g., 25.00) to math decimals (0.25)
      GLOBAL_MARKUP_PERCENT = parseFloat(settings.markup_percentage) / 100;
      GLOBAL_TAX_RATE = parseFloat(settings.vat_percentage) / 100;
    }

    // Apply the Formula: Total = ((Parts Cost * Markup) + Labor Fee) + Tax
    const calculatedServices = rawServices.map((service) => {
      const partsBaseCost = parseFloat(service.total_parts_base_cost);
      const laborFee = parseFloat(service.labor_fee);

      const partsRetailPrice =
        partsBaseCost + partsBaseCost * GLOBAL_MARKUP_PERCENT;
      const subtotal = partsRetailPrice + laborFee;
      const taxAmount = subtotal * GLOBAL_TAX_RATE;
      const grandTotal = subtotal + taxAmount;

      return {
        ...service,
        labor_fee: laborFee,
        pricing_breakdown: {
          parts_base_cost: partsBaseCost,
          parts_retail_price: partsRetailPrice,
          labor_fee: laborFee,
          subtotal: subtotal,
          tax: taxAmount,
          grand_total: grandTotal,
        },
      };
    });

    return calculatedServices;
  }

  static async createService(data, userId, ipAddress) {
    const existing = await ServiceModel.findServiceByName(data.name);
    if (existing) {
      throw new Error("A service package with this name already exists.");
    }

    // Extract parts array out of the main data object
    const { parts, ...serviceData } = data;
    return await ServiceModel.createServiceAndLogAudit(
      serviceData,
      parts,
      userId,
      ipAddress,
    );
  }

  static async updateService(id, data, userId, ipAddress) {
    const existing = await ServiceModel.findServiceById(id);
    if (!existing) {
      throw new Error("Service package not found.");
    }

    // Duplicate name check
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await ServiceModel.findServiceByName(data.name);
      if (duplicate)
        throw new Error("A service package with this name already exists.");
    }

    // Extract safe fields
    const safeUpdates = {};
    if (data.name !== undefined) safeUpdates.name = data.name;
    if (data.category !== undefined) safeUpdates.category = data.category;
    if (data.labor_fee !== undefined) safeUpdates.labor_fee = data.labor_fee;
    if (data.description !== undefined)
      safeUpdates.description = data.description;
    if (data.is_active !== undefined) safeUpdates.is_active = data.is_active;

    const partsArray = data.parts; // Undefined if not updating parts

    return await ServiceModel.updateServiceAndLogAudit(
      id,
      safeUpdates,
      partsArray,
      userId,
      ipAddress,
    );
  }
}

module.exports = WorkshopServiceLogic;

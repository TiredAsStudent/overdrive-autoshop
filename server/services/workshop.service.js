const MechanicModel = require("../models/Mechanic");
const ServiceModel = require("../models/Service");
const { query } = require("../config/db");

class WorkshopService {
  // --- MECHANIC LOGIC ---
  static async createMechanic(data, userId, ipAddress) {
    return await MechanicModel.createMechanicAndLogAudit(
      data,
      userId,
      ipAddress,
    );
  }

  static async getMechanics(branchId) {
    return await MechanicModel.getAllMechanics(branchId);
  }

  static async updateMechanic(id, updates, userId, ipAddress) {
    const existing = await MechanicModel.findMechanicById(id);
    if (!existing) {
      throw new Error("Mechanic not found.");
    }

    const safeUpdates = {};
    if (updates.first_name !== undefined)
      safeUpdates.first_name = updates.first_name;
    if (updates.last_name !== undefined)
      safeUpdates.last_name = updates.last_name;
    if (updates.specialization !== undefined)
      safeUpdates.specialization = updates.specialization;
    if (updates.contact_number !== undefined)
      safeUpdates.contact_number = updates.contact_number;
    if (updates.is_active !== undefined)
      safeUpdates.is_active = updates.is_active;

    if (updates.branch_id !== undefined)
      safeUpdates.branch_id = updates.branch_id;

    if (Object.keys(safeUpdates).length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    const targetBranchId = safeUpdates.branch_id || existing.branch_id;

    return await MechanicModel.updateMechanicAndLogAudit(
      id,
      safeUpdates,
      targetBranchId,
      userId,
      ipAddress,
    );
  }

  // --- SERVICE PACKAGES LOGIC ---
  static async getServicesWithDynamicPricing(onlyActive) {
    const rawServices = await ServiceModel.getAllServices(onlyActive);

    const settingsSql = `SELECT markup_percentage, vat_percentage FROM system_settings WHERE id = 1`;
    const settingsResult = await query(settingsSql);

    let GLOBAL_MARKUP_PERCENT = 0.25; // 25% Markup
    let GLOBAL_TAX_RATE = 0.12; // 12% VAT

    if (settingsResult.rows.length > 0) {
      const settings = settingsResult.rows[0];
      GLOBAL_MARKUP_PERCENT = parseFloat(settings.markup_percentage) / 100;
      GLOBAL_TAX_RATE = parseFloat(settings.vat_percentage) / 100;
    }

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

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await ServiceModel.findServiceByName(data.name);
      if (duplicate)
        throw new Error("A service package with this name already exists.");
    }

    const safeUpdates = {};
    if (data.name !== undefined) safeUpdates.name = data.name;
    if (data.category !== undefined) safeUpdates.category = data.category;
    if (data.labor_fee !== undefined) safeUpdates.labor_fee = data.labor_fee;
    if (data.description !== undefined)
      safeUpdates.description = data.description;
    if (data.is_active !== undefined) safeUpdates.is_active = data.is_active;

    const partsArray = data.parts;

    return await ServiceModel.updateServiceAndLogAudit(
      id,
      safeUpdates,
      partsArray,
      userId,
      ipAddress,
    );
  }
}

module.exports = WorkshopService;

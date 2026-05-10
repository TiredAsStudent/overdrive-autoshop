const Supplier = require("../../models/Supplier");
const { logSecureAction } = require("../../utils/auditLogger");

class SupplierService {
  static async createSupplier(data, managerId, ipAddress) {
    const newSupplier = await Supplier.create(data);

    await logSecureAction(
      managerId,
      null,
      "SUPPLIER_CREATED",
      "INFO",
      ipAddress,
      "suppliers",
      newSupplier.id,
      null,
      newSupplier,
    );
    return newSupplier;
  }

  static async getLedger(showArchived) {
    return await Supplier.getLedgerSummary(showArchived);
  }

  static async getSupplierTimeline(supplierId) {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) throw new Error("Supplier not found.");

    const timeline = await Supplier.getTransactionTimeline(supplierId);
    return { supplier, timeline };
  }

  static async updateSupplier(id, data, managerId, ipAddress) {
    const oldSupplier = await Supplier.findById(id);
    if (!oldSupplier) throw new Error("Supplier not found.");

    const updatedSupplier = await Supplier.update(id, data);

    let actionType = "SUPPLIER_UPDATED";
    let severity = "INFO";

    if (data.is_active === false && oldSupplier.is_active === true) {
      actionType = "SUPPLIER_ARCHIVED";
      severity = "WARNING";
    }

    await logSecureAction(
      managerId,
      null,
      actionType,
      severity,
      ipAddress,
      "suppliers",
      id,
      oldSupplier,
      updatedSupplier,
    );

    return updatedSupplier;
  }
}

module.exports = SupplierService;

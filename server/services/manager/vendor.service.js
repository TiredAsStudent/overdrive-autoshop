const VendorModel = require("../../models/Vendor");
const { logSecureAction } = require("../../utils/auditLogger");

class ManagerVendorService {
  static async registerVendor(data, activeUser, ipAddress) {
    const targetBranchId = data.branch_id || null;

    const duplicate = await VendorModel.checkDuplicate(data.business_name);
    if (duplicate) {
      throw new Error(
        `A supplier named '${data.business_name}' already exists in the system.`,
      );
    }

    let retries = 3;
    let newVendor = null;

    while (retries > 0) {
      try {
        data.vendor_code = await VendorModel.generateVendorCode();
        data.branch_id = targetBranchId;
        newVendor = await VendorModel.create(data);
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "vendors_vendor_code_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High system traffic. Failed to generate a unique vendor code.",
            );
        } else {
          throw error;
        }
      }
    }

    await logSecureAction(
      activeUser.id,
      targetBranchId,
      "VENDOR_REGISTERED",
      "INFO",
      ipAddress,
      "vendors",
      newVendor.id,
      null,
      newVendor,
    );

    return newVendor;
  }

  static async updateVendor(id, data, activeUser, ipAddress) {
    const oldVendor = await VendorModel.findById(id);
    if (!oldVendor) throw new Error("Vendor record not found.");

    // Strict evaluation of final VAT & TIN state
    const finalIsVatRegistered =
      data.is_vat_registered !== undefined
        ? data.is_vat_registered
        : oldVendor.is_vat_registered;
    const finalTin = data.tin !== undefined ? data.tin : oldVendor.tin;

    if (
      finalIsVatRegistered === true &&
      (finalTin === null || finalTin === "")
    ) {
      throw new Error(
        "Update rejected: A valid TIN is strictly required when a vendor is VAT Registered.",
      );
    }

    if (
      data.business_name &&
      data.business_name.toLowerCase() !== oldVendor.business_name.toLowerCase()
    ) {
      const duplicate = await VendorModel.checkDuplicate(
        data.business_name,
        id,
      );
      if (duplicate) {
        throw new Error(
          `Update rejected: Another supplier is already named '${data.business_name}'.`,
        );
      }
    }

    const updatedVendor = await VendorModel.update(id, data);

    let severity = "INFO";
    if (
      data.is_active !== undefined &&
      data.is_active !== oldVendor.is_active
    ) {
      severity = data.is_active ? "INFO" : "WARNING";
    }

    await logSecureAction(
      activeUser.id,
      updatedVendor.branch_id,
      "VENDOR_PROFILE_UPDATED",
      severity,
      ipAddress,
      "vendors",
      id,
      oldVendor,
      updatedVendor,
    );

    return updatedVendor;
  }

  static async getVendors(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    vatStatus = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, vendors] = await Promise.all([
      VendorModel.countFiltered(search, status, vatStatus, branchId),
      VendorModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        vatStatus,
        branchId,
      ),
    ]);

    return {
      vendors,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getVendorLedger(id, page = 1, limit = 10) {
    const vendor = await VendorModel.findById(id);
    if (!vendor) throw new Error("Vendor record not found.");

    const offset = (page - 1) * limit;
    const history = await VendorModel.getTransactionLedger(id, limit, offset);

    return { history };
  }
}

module.exports = ManagerVendorService;

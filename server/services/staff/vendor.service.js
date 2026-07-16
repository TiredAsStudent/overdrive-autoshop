const VendorModel = require("../../models/Vendor");
const { logSecureAction } = require("../../utils/auditLogger");

class VendorService {
  static async registerVendor(data, activeUser, ipAddress) {
    let targetBranchId = activeUser.branchId;
    if (activeUser.role !== "STAFF" && data.branch_id) {
      targetBranchId = data.branch_id;
    }

    if (!targetBranchId)
      throw new Error("System Error: Branch context missing.");
    data.branch_id = targetBranchId;

    const duplicate = await VendorModel.checkDuplicate(
      data.business_name,
      targetBranchId,
    );
    if (duplicate) {
      throw new Error(
        `A supplier named '${data.business_name}' already exists in this branch's registry.`,
      );
    }

    let retries = 3;
    let newVendor = null;

    while (retries > 0) {
      try {
        data.vendor_code = await VendorModel.generateVendorCode();
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

    if (
      activeUser.role === "STAFF" &&
      oldVendor.branch_id !== activeUser.branchId
    ) {
      throw new Error(
        "Unauthorized: You cannot modify a vendor registered to another branch.",
      );
    }

    if (
      data.business_name &&
      data.business_name.toLowerCase() !== oldVendor.business_name.toLowerCase()
    ) {
      const duplicate = await VendorModel.checkDuplicate(
        data.business_name,
        oldVendor.branch_id,
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
      severity = data.is_active ? "INFO" : "WARNING"; // Deactivation is a warning level event
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
}

module.exports = VendorService;

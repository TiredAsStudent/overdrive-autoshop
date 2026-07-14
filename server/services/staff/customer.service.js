const CustomerModel = require("../../models/Customer");
const { logSecureAction } = require("../../utils/auditLogger");

class CustomerService {
  static async registerCustomer(data, activeUser, ipAddress) {
    // 1. Verify Duplicates (VR-06)
    const duplicate = await CustomerModel.checkDuplicate(
      data.full_name,
      data.contact_number,
    );
    if (duplicate) {
      const matchField =
        duplicate.contact_number === data.contact_number
          ? "contact number"
          : "name";
      throw new Error(
        `A customer with this ${matchField} already exists in the system.`,
      );
    }

    // 2. Resolve Context: STAFF auto-assigns to their branch. ADMIN/MANAGER requires an explicit target branch or defaults to global (null).
    let targetBranchId = activeUser.branchId;
    if (activeUser.role !== "STAFF" && data.branch_id) {
      targetBranchId = data.branch_id;
    }

    if (!targetBranchId && activeUser.role === "STAFF") {
      throw new Error("System Error: Staff member has no branch context.");
    }

    // 3. Generate Code & Save
    data.customer_code = await CustomerModel.generateCustomerCode();
    data.branch_id = targetBranchId;

    const newCustomer = await CustomerModel.create(data);

    // 4. Secure Logging
    await logSecureAction(
      activeUser.id,
      targetBranchId,
      "CUSTOMER_REGISTERED",
      "INFO",
      ipAddress,
      "customers",
      newCustomer.id,
      null,
      newCustomer,
    );

    return newCustomer;
  }

  static async updateCustomer(id, data, activeUser, ipAddress) {
    const oldCustomer = await CustomerModel.findById(id);
    if (!oldCustomer) throw new Error("Customer record not found.");

    if (data.full_name || data.contact_number) {
      const checkName = data.full_name || oldCustomer.full_name;
      const checkContact = data.contact_number || oldCustomer.contact_number;

      const duplicate = await CustomerModel.checkDuplicate(
        checkName,
        checkContact,
        id,
      );
      if (duplicate)
        throw new Error(
          "Update rejected: This would conflict with an existing customer's name or contact number.",
        );
    }

    const updatedCustomer = await CustomerModel.update(id, data);

    await logSecureAction(
      activeUser.id,
      updatedCustomer.branch_id,
      "CUSTOMER_UPDATED",
      "INFO",
      ipAddress,
      "customers",
      id,
      oldCustomer,
      updatedCustomer,
    );

    return updatedCustomer;
  }

  static async getCustomers(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branchId = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, customers] = await Promise.all([
      CustomerModel.countFiltered(search, status, branchId),
      CustomerModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        branchId,
      ),
    ]);

    return {
      customers,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = CustomerService;

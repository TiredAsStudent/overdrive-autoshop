const Service = require("../../models/Service");
const { logSecureAction } = require("../../utils/auditLogger");

class ServiceService {
  static async createService(data, managerId, ipAddress) {
    // 1. Force uppercase and trim for clean data
    const cleanCode = data.service_code.toUpperCase().trim();

    // 2. Check for duplicates
    const existing = await Service.findByCode(cleanCode);
    if (existing) {
      throw new Error(`Service Code '${cleanCode}' is already in use.`);
    }

    const newService = await Service.create({
      ...data,
      service_code: cleanCode,
    });

    // 3. Log creation
    await logSecureAction(
      managerId,
      null,
      "SERVICE_CREATED",
      "INFO",
      ipAddress,
      "services",
      newService.id,
      null,
      newService,
    );

    return newService;
  }

  static async getAllServices() {
    return await Service.findAll();
  }

  static async updateService(id, data, managerId, ipAddress) {
    const oldService = await Service.findById(id);
    if (!oldService) throw new Error("Service not found.");

    const updatedService = await Service.update(id, data);

    // Dynamic Audit Logging: Detect Price Changes
    let actionType = "SERVICE_UPDATED";
    let severity = "INFO";

    // If the price was changed, escalate the audit log severity
    if (
      data.price !== undefined &&
      parseFloat(data.price) !== parseFloat(oldService.price)
    ) {
      actionType = "SERVICE_PRICE_CHANGED";
      severity = "WARNING";
    }

    // If a service is deactivated, log it critically
    if (data.is_active === false && oldService.is_active === true) {
      actionType = "SERVICE_DEACTIVATED";
      severity = "WARNING";
    }

    await logSecureAction(
      managerId,
      null,
      actionType,
      severity,
      ipAddress,
      "services",
      id,
      oldService,
      updatedService,
    );

    return updatedService;
  }
}

module.exports = ServiceService;

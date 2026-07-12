const ServiceModel = require("../../models/Service");
const { logSecureAction } = require("../../utils/auditLogger");

class ServiceCatalogService {
  static async generateServiceCode(category) {
    const prefixMap = {
      Engine: "ENG",
      Transmission: "TRN",
      "Brake System": "BRK",
      Suspension: "SUS",
      "Cooling System": "COL",
      Electrical: "ELE",
      "Air Conditioning": "AIR",
      Steering: "STR",
      "Preventive Maintenance": "PMT",
      "Tire Services": "TIR",
      "General Repair": "GEN",
    };

    const prefix = prefixMap[category] || "SRV";
    const lastRecord = await ServiceModel.getLatestCodeByPrefix(`${prefix}-`);

    let sequence = 1;
    if (lastRecord) {
      const lastSequence = parseInt(lastRecord.service_code.split("-")[1], 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, "0")}`;
  }

  static async createService(data, userId, ipAddress) {
    if (data.service_name) data.service_name = data.service_name.trim();

    const existing = await ServiceModel.findByCategoryAndName(
      data.category,
      data.service_name,
    );
    if (existing) {
      throw new Error(
        `A service named '${data.service_name}' already exists under the ${data.category} category.`,
      );
    }

    let retries = 3;
    let newService = null;

    while (retries > 0) {
      try {
        data.service_code = await this.generateServiceCode(data.category);
        newService = await ServiceModel.create(data);
        break;
      } catch (error) {
        if (
          error.code === "23505" &&
          error.constraint === "services_service_code_key"
        ) {
          retries--;
          if (retries === 0)
            throw new Error(
              "High system traffic. Failed to generate a unique service code. Please try again.",
            );
        } else {
          throw error;
        }
      }
    }

    await logSecureAction(
      userId,
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

  static async updateService(id, data, userId, ipAddress) {
    if (data.service_name) data.service_name = data.service_name.trim();

    const oldService = await ServiceModel.findById(id);
    if (!oldService) throw new Error("Service not found.");

    if (data.service_name || data.category) {
      const checkCategory = data.category || oldService.category;
      const checkName = data.service_name || oldService.service_name;

      const existing = await ServiceModel.findByCategoryAndName(
        checkCategory,
        checkName,
        id,
      );
      if (existing) {
        throw new Error(
          `A service named '${checkName}' already exists under the ${checkCategory} category.`,
        );
      }
    }

    const updatedService = await ServiceModel.update(id, data);

    let severity = "INFO";
    if (parseFloat(oldService.price) !== parseFloat(updatedService.price)) {
      severity = "WARNING";
    }

    await logSecureAction(
      userId,
      null,
      "SERVICE_UPDATED",
      severity,
      ipAddress,
      "services",
      id,
      oldService,
      updatedService,
    );
    return updatedService;
  }

  static async getServices(
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    status = "all",
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, services] = await Promise.all([
      ServiceModel.countFiltered(search, category, status),
      ServiceModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        category,
        status,
      ),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      services,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async toggleServiceStatus(id, isActive, userId, ipAddress) {
    const oldService = await ServiceModel.findById(id);
    if (!oldService) throw new Error("Service not found.");

    const updatedService = await ServiceModel.toggleStatus(id, isActive);

    const action = isActive ? "SERVICE_ACTIVATED" : "SERVICE_DEACTIVATED";
    await logSecureAction(
      userId,
      null,
      action,
      isActive ? "INFO" : "WARNING",
      ipAddress,
      "services",
      id,
      { is_active: oldService.is_active },
      { is_active: updatedService.is_active },
    );

    return updatedService;
  }
}

module.exports = ServiceCatalogService;

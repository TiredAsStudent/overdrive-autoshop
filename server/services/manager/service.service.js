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
    // VR-07: Duplicate Name Check
    const existing = await ServiceModel.findByCategoryAndName(
      data.category,
      data.service_name,
    );
    if (existing) {
      throw new Error(
        `A service named '${data.service_name}' already exists under the ${data.category} category.`,
      );
    }

    let retries = 3; // Maximum retry attempts for race conditions
    let newService = null;

    while (retries > 0) {
      try {
        // BR-01: Auto-Generate Code
        data.service_code = await this.generateServiceCode(data.category);
        newService = await ServiceModel.create(data);
        break; // Success! Break out of the retry loop.
      } catch (error) {
        // PostgreSQL Error 23505 is 'unique_violation'
        if (
          error.code === "23505" &&
          error.constraint === "services_service_code_key"
        ) {
          retries--;
          if (retries === 0) {
            throw new Error(
              "High system traffic. Failed to generate a unique service code. Please try again.",
            );
          }
          // Loop repeats, fetching the newly incremented latest code safely.
        } else {
          // If it's a different error, throw immediately
          throw error;
        }
      }
    }

    // Immutable Audit Logging
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
    const severity = isActive ? "INFO" : "WARNING";

    await logSecureAction(
      userId,
      null,
      action,
      severity,
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

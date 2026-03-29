const db = require("../config/db");
const KanbanModel = require("../models/kanbanModel");
const AuditModel = require("../models/auditModel");

class KanbanService {
  static async getBoardData(branchId) {
    const rawCards = await KanbanModel.getActiveBoard(branchId);

    // Format the data perfectly for a frontend Kanban Board (Drag and Drop)
    const board = {
      PENDING: rawCards.filter((card) => card.garage_status === "PENDING"),
      ONGOING: rawCards.filter((card) => card.garage_status === "ONGOING"),
      DONE: rawCards.filter((card) => card.garage_status === "DONE"),
    };

    return board;
  }

  static async moveCard(staffId, branchId, estimateId, updateData, ipAddress) {
    const { garageStatus, mechanicId } = updateData;

    // Strict Validation
    if (
      garageStatus &&
      !["PENDING", "ONGOING", "DONE"].includes(garageStatus)
    ) {
      throw new Error(
        "Invalid garage status. Must be PENDING, ONGOING, or DONE.",
      );
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const updatedCard = await KanbanModel.updateCardParams(
        estimateId,
        branchId,
        garageStatus,
        mechanicId,
        client,
      );

      if (!updatedCard) {
        throw new Error(
          "Job card not found or is no longer a Work-In-Progress.",
        );
      }

      // Log the movement for accountability
      const auditAction = mechanicId
        ? `ASSIGNED_MECHANIC_AND_MOVED_TO_${garageStatus || updatedCard.garage_status}`
        : `MOVED_KANBAN_CARD_TO_${garageStatus}`;

      await AuditModel.log(
        staffId,
        branchId,
        auditAction,
        "estimates",
        estimateId,
        ipAddress,
        client,
      );

      await client.query("COMMIT");
      return updatedCard;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(error.message);
    } finally {
      client.release();
    }
  }
}

module.exports = KanbanService;

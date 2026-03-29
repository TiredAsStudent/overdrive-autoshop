const KanbanService = require("../services/kanbanService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class KanbanController {
  static async getBoard(req, res) {
    try {
      const boardData = await KanbanService.getBoardData(req.user.branchId);
      return sendSuccess(
        res,
        200,
        boardData,
        "Kanban board fetched successfully.",
      );
    } catch (error) {
      return sendError(res, 500, "Failed to load Kanban board.");
    }
  }

  static async updateCard(req, res) {
    try {
      const { garageStatus, mechanicId } = req.body;

      if (!garageStatus && !mechanicId) {
        return sendError(
          res,
          400,
          "Must provide a new garage status or a mechanic ID to update.",
        );
      }

      const updatedCard = await KanbanService.moveCard(
        req.user.id,
        req.user.branchId,
        req.params.id,
        req.body,
        req.ip,
      );

      return sendSuccess(
        res,
        200,
        updatedCard,
        "Job card updated successfully.",
      );
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }
}

module.exports = KanbanController;

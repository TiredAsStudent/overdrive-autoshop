const JournalEntryService = require("../../services/manager/journalEntry.service");
const { sendSuccess, sendError } = require("../../utils/responseHandler");
const { STATUS_CODES } = require("../../constants/statusCodes");

class JournalEntryController {
  static async saveEntry(req, res) {
    try {
      // Include optional ID for PUT requests
      const payload = { ...req.body };
      if (req.params.id) payload.id = req.params.id;

      const result = await JournalEntryService.saveJournalEntry(
        payload,
        req.user,
        req.ip,
      );

      const isPosted = result.status === "POSTED";
      const message = isPosted
        ? "Journal Entry finalized and posted to the General Ledger."
        : "Journal Entry saved as Draft.";

      return sendSuccess(
        res,
        isPosted ? STATUS_CODES.CREATED : STATUS_CODES.SUCCESS,
        result,
        message,
      );
    } catch (error) {
      const code =
        error.message.includes("Accounting Rule Violation") ||
        error.message.includes("Security Violation")
          ? STATUS_CODES.CONFLICT
          : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }

  static async getEntries(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { search, status, branch, start_date, end_date } = req.query;

      const result = await JournalEntryService.getJournalEntries(
        page,
        limit,
        search,
        status,
        branch,
        start_date,
        end_date,
      );

      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        result,
        "Journal Entries retrieved successfully.",
      );
    } catch (error) {
      return sendError(
        res,
        STATUS_CODES.INTERNAL_ERROR,
        "Failed to fetch journal entries.",
        error.message,
      );
    }
  }

  static async getEntryDetails(req, res) {
    try {
      const entry = await JournalEntryService.getJournalDetails(req.params.id);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        entry,
        "Journal Entry details retrieved.",
      );
    } catch (error) {
      return sendError(res, STATUS_CODES.NOT_FOUND, error.message);
    }
  }

  static async deleteDraft(req, res) {
    try {
      await JournalEntryService.deleteDraft(req.params.id, req.user, req.ip);
      return sendSuccess(
        res,
        STATUS_CODES.SUCCESS,
        null,
        "Draft Journal Entry discarded successfully.",
      );
    } catch (error) {
      const code = error.message.includes("Security Violation")
        ? STATUS_CODES.FORBIDDEN
        : STATUS_CODES.BAD_REQUEST;
      return sendError(res, code, error.message);
    }
  }
}

module.exports = JournalEntryController;

const JournalEntryModel = require("../../models/JournalEntry");
const COAModel = require("../../models/ChartOfAccounts");
const { logSecureAction } = require("../../utils/auditLogger");

class JournalEntryService {
  /**
   * Helper: Validates double-entry accounting integrity constraints.
   */
  static async validateDoubleEntry(items) {
    let totalDebit = 0;
    let totalCredit = 0;

    // Check minimum 2 lines
    if (items.length < 2) {
      throw new Error(
        "Journal entry must contain at least one debit and one credit line.",
      );
    }

    for (const item of items) {
      const account = await COAModel.findById(item.account_id);
      if (!account) {
        throw new Error(
          `Chart of Account ID ${item.account_id} does not exist.`,
        );
      }
      if (!account.is_active) {
        throw new Error(
          `Account '${account.account_code} - ${account.account_name}' is archived. You must select active accounts.`,
        );
      }

      const amount = parseFloat(item.amount);
      if (item.entry_type === "DEBIT") totalDebit += amount;
      if (item.entry_type === "CREDIT") totalCredit += amount;
    }

    // Mathematical Tolerance Check (Solves JS floating point precision issues)
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      throw new Error(
        `Accounting Rule Violation: Total Debits (₱${totalDebit.toFixed(2)}) must exactly equal Total Credits (₱${totalCredit.toFixed(2)}).`,
      );
    }

    if (totalDebit <= 0) {
      throw new Error("Total balanced amount must be greater than zero.");
    }

    return totalDebit;
  }

  static async saveJournalEntry(data, activeUser, ipAddress) {
    // 1. Double-Entry Validation
    const computedTotal = await this.validateDoubleEntry(data.items);
    data.total_amount = computedTotal;

    let journalEntry;
    let actionLog = "";

    // 2. Determine Create vs Update
    if (data.id) {
      const existing = await JournalEntryModel.findById(data.id);
      if (!existing) throw new Error("Journal entry not found.");
      if (existing.status === "POSTED") {
        throw new Error(
          "Security Violation: Finalized POSTED journal entries are immutable and cannot be modified.",
        );
      }
      journalEntry = await JournalEntryModel.updateTransaction(
        data.id,
        data,
        data.items,
      );
      actionLog =
        data.status === "POSTED"
          ? "JOURNAL_ENTRY_POSTED"
          : "JOURNAL_ENTRY_DRAFT_UPDATED";
    } else {
      journalEntry = await JournalEntryModel.createTransaction(
        data,
        data.items,
        activeUser.id,
      );
      actionLog =
        data.status === "POSTED"
          ? "JOURNAL_ENTRY_POSTED"
          : "JOURNAL_ENTRY_DRAFT_CREATED";
    }

    // 3. Immutable Audit Logging
    await logSecureAction(
      activeUser.id,
      data.branch_id || null,
      actionLog,
      data.status === "POSTED" ? "CRITICAL" : "INFO", // CRITICAL because POSTED alters General Ledger
      ipAddress,
      "journal_entries",
      journalEntry.id,
      null,
      {
        journal_number: journalEntry.journal_number,
        total_amount: journalEntry.total_amount,
        lines: data.items.length,
      },
    );

    return journalEntry;
  }

  static async deleteDraft(id, activeUser, ipAddress) {
    const entry = await JournalEntryModel.findById(id);
    if (!entry) throw new Error("Journal entry not found.");
    if (entry.status === "POSTED") {
      throw new Error(
        "Security Violation: Finalized POSTED journal entries cannot be deleted.",
      );
    }

    const deleted = await JournalEntryModel.deleteDraft(id);
    if (!deleted) throw new Error("Failed to delete draft.");

    await logSecureAction(
      activeUser.id,
      entry.branch_id,
      "JOURNAL_ENTRY_DRAFT_DELETED",
      "WARNING",
      ipAddress,
      "journal_entries",
      id,
      entry,
      null,
    );

    return true;
  }

  static async getJournalEntries(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branch = "all",
    startDate,
    endDate,
  ) {
    const offset = (page - 1) * limit;

    const [totalItems, entries] = await Promise.all([
      JournalEntryModel.countFiltered(
        search,
        status,
        branch,
        startDate,
        endDate,
      ),
      JournalEntryModel.findPaginatedFiltered(
        limit,
        offset,
        search,
        status,
        branch,
        startDate,
        endDate,
      ),
    ]);

    return {
      entries,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  static async getJournalDetails(id) {
    const entry = await JournalEntryModel.findById(id);
    if (!entry) throw new Error("Journal entry not found.");
    return entry;
  }
}

module.exports = JournalEntryService;

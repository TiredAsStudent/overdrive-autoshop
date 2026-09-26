import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  AlertCircle,
  Loader2,
  Send,
  Calendar,
  Building2,
  Hash,
  FileText,
  Plus,
  Trash2,
  Scale,
} from "lucide-react";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";
import { inventoryService } from "../../../services/manager/inventory.service";

const formatToLocalDateInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const generateRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const JournalEntryModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [header, setHeader] = useState({
    entry_date: formatToLocalDateInput(),
    reference_number: "",
    description: "",
    branch_id: "",
  });

  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLoadingLookups(true);
      Promise.all([
        chartOfAccountsService.getAccounts(1, 500, "", "all", "active"),
        inventoryService.getActiveBranches(),
      ])
        .then(([accRes, brRes]) => {
          setAccounts(accRes.data?.accounts || []);
          setBranches(brRes.data || []);
        })
        .catch(() => setValidationError("Failed to load dependency lookups."))
        .finally(() => setLoadingLookups(false));

      if (initialData) {
        setHeader({
          entry_date: initialData.entry_date,
          reference_number: initialData.reference_number || "",
          description: initialData.description || "",
          branch_id: initialData.branch_id?.toString() || "",
        });

        const mappedLines = initialData.items.map((item) => ({
          rowId: generateRowId(),
          account_id: item.account_id.toString(),
          debit: item.entry_type === "DEBIT" ? item.amount : "",
          credit: item.entry_type === "CREDIT" ? item.amount : "",
          line_description: item.line_description || "",
        }));
        setLines(mappedLines);
      } else {
        setHeader({
          entry_date: formatToLocalDateInput(),
          reference_number: "",
          description: "",
          branch_id: "",
        });
        setLines([
          {
            rowId: generateRowId(),
            account_id: "",
            debit: "",
            credit: "",
            line_description: "",
          },
          {
            rowId: generateRowId(),
            account_id: "",
            debit: "",
            credit: "",
            line_description: "",
          },
        ]);
      }
      setValidationError("");
    }
  }, [isOpen, initialData]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        rowId: generateRowId(),
        account_id: "",
        debit: "",
        credit: "",
        line_description: "",
      },
    ]);
  };

  const removeLine = (rowId) => {
    if (lines.length <= 2) {
      setValidationError("A journal entry requires at least two lines.");
      return;
    }
    setLines(lines.filter((line) => line.rowId !== rowId));
    setValidationError("");
  };

  const handleLineChange = (rowId, field, value) => {
    setLines(
      lines.map((line) => {
        if (line.rowId === rowId) {
          const updated = { ...line, [field]: value };
          // Accounting Rule: If typing in Debit, clear Credit. Vice Versa.
          if (field === "debit" && value !== "") updated.credit = "";
          if (field === "credit" && value !== "") updated.debit = "";
          return updated;
        }
        return line;
      }),
    );
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    lines.forEach((line) => {
      if (line.debit) totalDebit += parseFloat(line.debit) || 0;
      if (line.credit) totalCredit += parseFloat(line.credit) || 0;
    });
    return {
      debit: totalDebit,
      credit: totalCredit,
      difference: Math.abs(totalDebit - totalCredit),
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0,
    };
  };

  const totals = calculateTotals();

  const processPayload = (status) => {
    setValidationError("");

    if (!header.entry_date)
      return setValidationError("Entry Date is required.");
    if (header.description.trim().length < 5)
      return setValidationError(
        "A descriptive memo (min 5 chars) is required.",
      );

    const formattedItems = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.account_id)
        return setValidationError(`Row ${i + 1}: Please select an Account.`);

      const debitVal = parseFloat(line.debit);
      const creditVal = parseFloat(line.credit);
      const hasDebit = !isNaN(debitVal) && debitVal > 0;
      const hasCredit = !isNaN(creditVal) && creditVal > 0;

      if (!hasDebit && !hasCredit)
        return setValidationError(
          `Row ${i + 1}: Must contain a valid Debit or Credit amount.`,
        );
      if (hasDebit && hasCredit)
        return setValidationError(
          `Row ${i + 1}: Cannot contain both Debit and Credit.`,
        );

      formattedItems.push({
        account_id: parseInt(line.account_id, 10),
        entry_type: hasDebit ? "DEBIT" : "CREDIT",
        amount: hasDebit ? debitVal : creditVal,
        line_description: line.line_description.trim() || null,
      });
    }

    if (status === "POSTED" && !totals.isBalanced) {
      return setValidationError(
        "Cannot post: Debits and Credits must exactly balance.",
      );
    }

    const payload = {
      id: initialData?.id,
      entry_date: header.entry_date,
      reference_number: header.reference_number.trim() || null,
      description: header.description.trim(),
      branch_id: header.branch_id ? parseInt(header.branch_id, 10) : null,
      status: status,
      items: formattedItems,
    };

    setIsSubmitting(true);
    onSubmit(payload).catch((err) => {
      setValidationError(err.message || "Failed to process entry.");
      setIsSubmitting(false);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {initialData ? "Update Journal Draft" : "New Journal Entry"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Manual Accounting Adjustments
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* BODY */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Header Info */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <Calendar size={12} /> Journal Date{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={header.entry_date}
                      onChange={(e) =>
                        setHeader({ ...header, entry_date: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <Hash size={12} /> Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ADJ-2026-001"
                      value={header.reference_number}
                      onChange={(e) =>
                        setHeader({
                          ...header,
                          reference_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <Building2 size={12} /> Branch Allocation
                    </label>
                    <select
                      value={header.branch_id}
                      onChange={(e) =>
                        setHeader({ ...header, branch_id: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">Enterprise Global (No Branch)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                    <FileText size={12} /> Description{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Provide a clear business reason for this adjustment..."
                    value={header.description}
                    onChange={(e) =>
                      setHeader({ ...header, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Line Items Matrix */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Scale size={14} className="text-amber-500" /> Accounting
                    Distribution Matrix
                  </h3>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                        <th className="px-5 py-4 w-1/3">Account *</th>
                        <th className="px-5 py-4 w-1/4">Line Description</th>
                        <th className="px-5 py-4 w-1/6 text-right">
                          Debit (₱) *
                        </th>
                        <th className="px-5 py-4 w-1/6 text-right">
                          Credit (₱) *
                        </th>
                        <th className="px-5 py-4 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {lines.map((line) => (
                        <tr
                          key={line.rowId}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3">
                            <select
                              value={line.account_id}
                              onChange={(e) =>
                                handleLineChange(
                                  line.rowId,
                                  "account_id",
                                  e.target.value,
                                )
                              }
                              disabled={loadingLookups}
                              className="w-full px-3 py-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:border-amber-500 cursor-pointer"
                            >
                              <option value="" disabled>
                                -- Select Account --
                              </option>
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  [{acc.account_code}] {acc.account_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="text"
                              placeholder="Memo"
                              value={line.line_description}
                              onChange={(e) =>
                                handleLineChange(
                                  line.rowId,
                                  "line_description",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:border-amber-500"
                            />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={line.debit}
                              onChange={(e) =>
                                handleLineChange(
                                  line.rowId,
                                  "debit",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-black text-right focus:border-amber-500 text-slate-800 dark:text-slate-200 placeholder:font-sans"
                            />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={line.credit}
                              onChange={(e) =>
                                handleLineChange(
                                  line.rowId,
                                  "credit",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-black text-right focus:border-amber-500 text-slate-800 dark:text-slate-200 placeholder:font-sans"
                            />
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeLine(line.rowId)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remove Line"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 cursor-pointer px-2 transition-colors"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>
              </div>
            </div>

            {/* BALANCE FOOTER & ACTIONS */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Mathematics Engine */}
              <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Total Debits
                  </span>
                  <span className="text-base font-black font-mono text-slate-800 dark:text-slate-200">
                    ₱
                    {totals.debit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Total Credits
                  </span>
                  <span className="text-base font-black font-mono text-slate-800 dark:text-slate-200">
                    ₱
                    {totals.credit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Difference
                  </span>
                  <span
                    className={`text-lg font-black font-mono ${totals.isBalanced ? "text-emerald-500" : "text-red-500"}`}
                  >
                    ₱
                    {totals.difference.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => processPayload("DRAFT")}
                  disabled={isSubmitting}
                  className="flex-1 md:flex-none py-3.5 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => processPayload("POSTED")}
                  disabled={isSubmitting || !totals.isBalanced}
                  className="flex-1 md:flex-none py-3.5 px-8 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none cursor-pointer flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Post Journal
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JournalEntryModal;

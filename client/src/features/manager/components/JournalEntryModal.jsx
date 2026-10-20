import React, { useState, useEffect, useId } from "react";
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
  ChevronDown,
  Save,
} from "lucide-react";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";
import { inventoryService } from "../../../services/manager/inventory.service";

const formatToLocalDateInput = (value) => {
  if (value && typeof value === "string") {
    const datePart = value.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const generateRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const JournalEntryModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(null);
  const [validationError, setValidationError] = useState("");

  // Accessible Form IDs
  const modalTitleId = useId();
  const entryDateInputId = useId();
  const referenceNumberInputId = useId();
  const branchAllocationSelectId = useId();
  const descriptionInputId = useId();

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

  // Close modal on Escape key when not submitting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setValidationError("");
      setSubmittingStatus(null);
      setLoadingLookups(true);

      Promise.all([
        chartOfAccountsService.getAccounts(1, 500, "", "all", "active", true),
        inventoryService.getActiveBranches(),
      ])
        .then(([accRes, brRes]) => {
          if (isMounted) {
            setAccounts(accRes.data?.accounts || []);
            setBranches(brRes.data || []);
          }
        })
        .catch(() => {
          if (isMounted) {
            setValidationError("Failed to load dependency lookups.");
          }
        })
        .finally(() => {
          if (isMounted) setLoadingLookups(false);
        });

      if (initialData) {
        setHeader({
          entry_date: formatToLocalDateInput(initialData.entry_date),
          reference_number: initialData.reference_number || "",
          description: initialData.description || "",
          branch_id: initialData.branch_id?.toString() || "",
        });

        const mappedLines = (initialData.items || []).map((item) => ({
          rowId: generateRowId(),
          account_id: item.account_id ? item.account_id.toString() : "",
          debit: item.entry_type === "DEBIT" ? item.amount : "",
          credit: item.entry_type === "CREDIT" ? item.amount : "",
          line_description: item.line_description || "",
        }));

        setLines(
          mappedLines.length >= 2
            ? mappedLines
            : [
                ...mappedLines,
                ...Array.from({ length: 2 - mappedLines.length }, () => ({
                  rowId: generateRowId(),
                  account_id: "",
                  debit: "",
                  credit: "",
                  line_description: "",
                })),
              ],
        );
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
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData]);

  const addLine = () => {
    setValidationError("");
    setLines((prev) => [
      ...prev,
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
    setLines((prev) => prev.filter((line) => line.rowId !== rowId));
    setValidationError("");
  };

  const handleLineChange = (rowId, field, value) => {
    setValidationError("");
    setLines((prev) =>
      prev.map((line) => {
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

  const processPayload = async (status) => {
    if (isSubmitting) return;
    setValidationError("");

    if (!header.entry_date) {
      return setValidationError("Entry Date is required.");
    }
    if (header.description.trim().length < 5) {
      return setValidationError(
        "A descriptive memo (min 5 chars) is required.",
      );
    }

    const formattedItems = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.account_id) {
        return setValidationError(`Row ${i + 1}: Please select an Account.`);
      }

      const debitVal = parseFloat(line.debit);
      const creditVal = parseFloat(line.credit);
      const hasDebit = !isNaN(debitVal) && debitVal > 0;
      const hasCredit = !isNaN(creditVal) && creditVal > 0;

      if (!hasDebit && !hasCredit) {
        return setValidationError(
          `Row ${i + 1}: Must contain a valid Debit or Credit amount.`,
        );
      }
      if (hasDebit && hasCredit) {
        return setValidationError(
          `Row ${i + 1}: Cannot contain both Debit and Credit.`,
        );
      }

      formattedItems.push({
        account_id: parseInt(line.account_id, 10),
        entry_type: hasDebit ? "DEBIT" : "CREDIT",
        amount: hasDebit ? debitVal : creditVal,
        line_description: line.line_description.trim() || null,
      });
    }

    if (!totals.isBalanced) {
      return setValidationError(
        "Cannot save: Debits and Credits must balance and total must be greater than zero.",
      );
    }

    const payload = {
      id: initialData?.id,
      entry_date: header.entry_date,
      reference_number: header.reference_number.trim() || null,
      description: header.description.trim(),
      branch_id: header.branch_id ? parseInt(header.branch_id, 10) : null,
      status,
      items: formattedItems,
    };

    setIsSubmitting(true);
    setSubmittingStatus(status);
    try {
      await onSubmit(payload);
    } catch (err) {
      setValidationError(err.message || "Failed to process journal entry.");
    } finally {
      setIsSubmitting(false);
      setSubmittingStatus(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={() => !isSubmitting && onClose?.()}
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[92vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData ? "Update Journal Draft" : "New Journal Entry"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Manual Accounting Adjustments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close journal entry modal"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* BODY */}
            <div className="px-5 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 sm:space-y-8 bg-white dark:bg-slate-800">
              {validationError && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-6 sm:space-y-8"
              >
                {/* Header Info Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <FileText size={14} aria-hidden="true" />
                    <span>Journal Particulars</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor={entryDateInputId}
                        className="form-label flex items-center gap-1.5"
                      >
                        <Calendar size={12} aria-hidden="true" />
                        <span>Journal Date</span>
                        <span className="form-required">*</span>
                      </label>
                      <input
                        id={entryDateInputId}
                        type="date"
                        disabled={isSubmitting}
                        value={header.entry_date}
                        onChange={(e) => {
                          setValidationError("");
                          setHeader((prev) => ({
                            ...prev,
                            entry_date: e.target.value,
                          }));
                        }}
                        className="form-input font-mono tabular-nums cursor-pointer"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={referenceNumberInputId}
                        className="form-label flex items-center gap-1.5"
                      >
                        <Hash size={12} aria-hidden="true" />
                        <span>Reference Number</span>
                      </label>
                      <input
                        id={referenceNumberInputId}
                        type="text"
                        disabled={isSubmitting}
                        placeholder="e.g., ADJ-2026-001"
                        value={header.reference_number}
                        onChange={(e) => {
                          setValidationError("");
                          setHeader((prev) => ({
                            ...prev,
                            reference_number: e.target.value,
                          }));
                        }}
                        className="form-input font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={branchAllocationSelectId}
                        className="form-label flex items-center gap-1.5"
                      >
                        <Building2 size={12} aria-hidden="true" />
                        <span>Branch Allocation</span>
                      </label>
                      <div className="relative">
                        <select
                          id={branchAllocationSelectId}
                          disabled={loadingLookups || isSubmitting}
                          value={header.branch_id}
                          onChange={(e) => {
                            setValidationError("");
                            setHeader((prev) => ({
                              ...prev,
                              branch_id: e.target.value,
                            }));
                          }}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">
                            Enterprise Global (No Branch)
                          </option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.branch_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          aria-hidden="true"
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor={descriptionInputId} className="form-label">
                      Description <span className="form-required">*</span>
                    </label>
                    <input
                      id={descriptionInputId}
                      type="text"
                      disabled={isSubmitting}
                      placeholder="Provide a clear business reason for this adjustment..."
                      value={header.description}
                      onChange={(e) => {
                        setValidationError("");
                        setHeader((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                      }}
                      className="form-input font-medium"
                    />
                  </div>
                </section>

                {/* Line Items Matrix Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center gap-2">
                      <Scale size={14} aria-hidden="true" />
                      <span>Accounting Distribution Matrix</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs">
                    <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                      <caption className="sr-only">
                        Journal entry debit and credit distribution lines
                      </caption>
                      <thead>
                        <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                          <th scope="col" className="px-4 py-3.5 w-1/3">
                            Account <span className="form-required">*</span>
                          </th>
                          <th scope="col" className="px-4 py-3.5 w-1/4">
                            Line Description
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3.5 w-1/6 text-right"
                          >
                            Debit (₱) <span className="form-required">*</span>
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3.5 w-1/6 text-right"
                          >
                            Credit (₱) <span className="form-required">*</span>
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3.5 w-12 text-center"
                          >
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {lines.map((line, index) => (
                          <tr key={line.rowId} className="table-row-hover">
                            <td className="px-4 py-3">
                              <div className="relative">
                                <select
                                  aria-label={`Account for row ${index + 1}`}
                                  value={line.account_id}
                                  onChange={(e) =>
                                    handleLineChange(
                                      line.rowId,
                                      "account_id",
                                      e.target.value,
                                    )
                                  }
                                  disabled={loadingLookups || isSubmitting}
                                  className="form-select py-2.5 appearance-none pr-9 cursor-pointer"
                                >
                                  <option value="" disabled>
                                    -- Select Account --
                                  </option>
                                  {!accounts.some(
                                    (acc) =>
                                      acc.id.toString() === line.account_id,
                                  ) &&
                                    line.account_id && (
                                      <option value={line.account_id}>
                                        [Archived Account - Must Change]
                                      </option>
                                    )}
                                  {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                      [{acc.account_code}] {acc.account_name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={14}
                                  aria-hidden="true"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                disabled={isSubmitting}
                                aria-label={`Line description for row ${index + 1}`}
                                placeholder="Memo"
                                value={line.line_description}
                                onChange={(e) =>
                                  handleLineChange(
                                    line.rowId,
                                    "line_description",
                                    e.target.value,
                                  )
                                }
                                className="form-input py-2.5 font-medium"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={isSubmitting}
                                aria-label={`Debit amount for row ${index + 1}`}
                                placeholder="0.00"
                                value={line.debit}
                                onChange={(e) =>
                                  handleLineChange(
                                    line.rowId,
                                    "debit",
                                    e.target.value,
                                  )
                                }
                                className="form-input py-2.5 font-mono tabular-nums font-black text-right"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={isSubmitting}
                                aria-label={`Credit amount for row ${index + 1}`}
                                placeholder="0.00"
                                value={line.credit}
                                onChange={(e) =>
                                  handleLineChange(
                                    line.rowId,
                                    "credit",
                                    e.target.value,
                                  )
                                }
                                className="form-input py-2.5 font-mono tabular-nums font-black text-right"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                disabled={isSubmitting || lines.length <= 2}
                                onClick={() => removeLine(line.rowId)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  lines.length <= 2
                                    ? "Minimum 2 lines required"
                                    : `Remove row ${index + 1}`
                                }
                                aria-label={`Remove journal line ${index + 1}`}
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700/50 flex justify-start">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={addLine}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 dark:text-overdrive-yellow dark:hover:text-amber-400 cursor-pointer px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Add Line Item</span>
                    </button>
                  </div>
                </section>
              </form>
            </div>

            {/* BALANCE FOOTER & ACTIONS */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col lg:flex-row justify-between items-center gap-5">
              {/* Mathematics Engine */}
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 w-full lg:w-auto px-2 sm:px-0">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Total Debits
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    ₱
                    {totals.debit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-8 w-px bg-slate-300 dark:bg-slate-700"
                />
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Total Credits
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    ₱
                    {totals.credit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-8 w-px bg-slate-300 dark:bg-slate-700"
                />
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Difference
                  </span>
                  <span
                    className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                      totals.isBalanced
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    ₱
                    {totals.difference.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => processPayload("DRAFT")}
                  disabled={isSubmitting || !totals.isBalanced}
                  className="w-full sm:w-auto py-3.5 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer flex justify-center items-center gap-2"
                >
                  {submittingStatus === "DRAFT" ? (
                    <Loader2
                      size={15}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={15} aria-hidden="true" />
                  )}
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => processPayload("POSTED")}
                  disabled={isSubmitting || !totals.isBalanced}
                  className="w-full sm:w-auto py-3.5 px-8 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 disabled:shadow-none cursor-pointer flex justify-center items-center gap-2"
                >
                  {submittingStatus === "POSTED" ? (
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={16} aria-hidden="true" />
                  )}
                  <span>Post Journal</span>
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

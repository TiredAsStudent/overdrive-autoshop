import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ReceiptText, AlertCircle, Loader2, Calendar } from "lucide-react";
import { vendorService } from "../../../services/staff/vendor.service";
import { catalogService } from "../../../services/staff/catalog.service";
import { expenseService } from "../../../services/staff/expense.service";

const formatToLocalDateInput = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Shop Supplies",
  "Rent",
  "Repairs & Maintenance",
  "Gasoline & Transport",
  "Meals & Entertainment",
  "Office Supplies",
  "Miscellaneous",
];

const ExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = "CREATE",
  initialData = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [vendors, setVendors] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vatRate, setVatRate] = useState(12);

  const [formData, setFormData] = useState({
    expense_date: formatToLocalDateInput(),
    category: "",
    description: "",
    total_amount: "",
    is_vatable: true,
    payment_method: "CASH",
    vendor_id: "",
    reference_number: "",
    notes: "",
    is_submitting: false,
  });

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      setIsLoadingVendors(true);

      catalogService
        .getSettings()
        .then((res) => {
          const fetchedVat = parseFloat(res.data?.vat_percentage);
          if (!isNaN(fetchedVat)) setVatRate(fetchedVat);
        })
        .catch((err) => console.error("Failed to load settings:", err));

      vendorService
        .getVendors(1, 1000, "", "active", "all", "all")
        .then((res) => setVendors(res.data?.vendors || []))
        .catch(() => setValidationError("Could not load vendor registry."))
        .finally(() => setIsLoadingVendors(false));

      if (mode === "CREATE") {
        setFormData({
          expense_date: formatToLocalDateInput(),
          category: "",
          description: "",
          total_amount: "",
          is_vatable: true,
          payment_method: "CASH",
          vendor_id: "",
          reference_number: "",
          notes: "",
          is_submitting: false,
        });
      } else if (mode === "EDIT" && initialData?.id) {
        setFormData({
          expense_date: formatToLocalDateInput(initialData.expense_date),
          category: initialData.category || "",
          description: initialData.description || "",
          total_amount: initialData.total_amount || "",
          is_vatable: initialData.is_vatable ?? true,
          payment_method: "CASH",
          vendor_id: "",
          reference_number: "",
          notes: "",
          is_submitting: false,
        });

        expenseService
          .getExpenseDetails(initialData.id)
          .then((res) => {
            const fullData = res.data;

            setFormData({
              expense_date: formatToLocalDateInput(fullData.expense_date),
              category: fullData.category || "",
              description: fullData.description || "",
              total_amount: fullData.total_amount || "",
              is_vatable: fullData.is_vatable ?? true,
              payment_method: fullData.payment_method || "CASH",
              vendor_id: fullData.vendor_id || "",
              reference_number: fullData.reference_number || "",
              notes: fullData.notes || "",
              is_submitting: false,
            });
          })
          .catch(() =>
            setValidationError("Could not fetch full expense details."),
          );
      }
    }
  }, [isOpen, mode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e, submitForApproval = false) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.category)
      return setValidationError("Expense category is required.");
    if (!formData.description.trim())
      return setValidationError("Expense description is required.");
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      return setValidationError(
        "A valid total amount greater than zero is required.",
      );
    }

    const payload = {
      ...formData,
      total_amount: parseFloat(formData.total_amount),
      vendor_id: formData.vendor_id ? parseInt(formData.vendor_id, 10) : null,
      is_submitting: submitForApproval,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message || "Failed to process expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic VAT Multiplier Formula
  const vatMultiplier = 1 + vatRate / 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {mode === "CREATE" ? "Record Expense" : "Edit Expense"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Operational Expenditure
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form id="expenseForm" className="space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Expense Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        type="date"
                        name="expense_date"
                        value={formData.expense_date}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Select Category --</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2 */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Shop floor cleaning supplies"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Row 3 - Financials */}
                <div className="p-5 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                        Total Amount (₱) <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        name="total_amount"
                        value={formData.total_amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-amber-500 focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                        Payment Method
                      </label>
                      <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                      >
                        <option value="CASH">Cash</option>
                        <option value="PETTY_CASH">Petty Cash</option>
                        <option value="GCASH">GCash</option>
                        <option value="MAYA">Maya</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHECK">Check</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_vatable"
                      checked={formData.is_vatable}
                      onChange={handleChange}
                      className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-0 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                        Input VAT Applicable
                      </span>
                      <span className="text-[10px] text-slate-500">
                        System will automatically extract {vatRate}% for Tax
                        Ledger.
                      </span>
                    </div>
                  </label>

                  {/* Real-time Math Preview */}
                  {formData.total_amount && !isNaN(formData.total_amount) && (
                    <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-500/10 rounded-xl flex justify-between items-center border border-amber-200 dark:border-amber-500/20">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                          Live VAT Breakdown
                        </span>
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          {formData.is_vatable
                            ? `${vatRate}% Input VAT Extracted`
                            : "VAT Exempt"}
                        </span>
                      </div>
                      <div className="text-right font-mono text-xs font-black text-amber-700 dark:text-amber-400">
                        <p>
                          Subtotal: ₱
                          {formData.is_vatable
                            ? (
                                parseFloat(formData.total_amount) /
                                vatMultiplier
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : parseFloat(formData.total_amount).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                        </p>
                        {formData.is_vatable && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                            VAT: ₱
                            {(
                              parseFloat(formData.total_amount) -
                              parseFloat(formData.total_amount) / vatMultiplier
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 4 - Optional Support Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Vendor / Payee{" "}
                      <span className="lowercase font-medium text-slate-400">
                        (Optional)
                      </span>
                    </label>
                    <select
                      name="vendor_id"
                      value={formData.vendor_id}
                      onChange={handleChange}
                      disabled={isLoadingVendors}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      <option value="">-- No Vendor Linked --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.business_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Reference / Receipt #{" "}
                      <span className="lowercase font-medium text-slate-400">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleChange}
                      placeholder="e.g., OR-10293"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Row 5 */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Internal Notes{" "}
                    <span className="lowercase font-medium text-slate-400">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Any justification for this expense..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer with Dual Submission */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Processing..." : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ReceiptText size={16} />
                )}
                Submit for Approval
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseModal;

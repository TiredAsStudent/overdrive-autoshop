import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";

const REASON_CODES = {
  ADD: ["STOCK_COUNT_RECONCILIATION", "CLERICAL_ERROR"],
  DEDUCT: [
    "DAMAGED",
    "STOLEN_OR_LOST",
    "STOCK_COUNT_RECONCILIATION",
    "CLERICAL_ERROR",
    "PROMOTIONAL_GIVEAWAY",
  ],
};

const formatReason = (reason) => {
  return reason
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
};

const AdjustmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedItem,
  branches,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({
    item_id: "",
    branch_id: "",
    adjustment_type: "ADD",
    quantity: "",
    reason: "STOCK_COUNT_RECONCILIATION",
    remarks: "",
  });

  useEffect(() => {
    if (isOpen && selectedItem) {
      setFormData({
        item_id: selectedItem.id,
        branch_id: branches.length > 0 ? branches[0].id : "",
        adjustment_type: "ADD",
        quantity: "",
        reason: "STOCK_COUNT_RECONCILIATION",
        remarks: "",
      });
      setValidationError("");
    }
  }, [isOpen, selectedItem, branches]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      reason: REASON_CODES[prev.adjustment_type][0],
    }));
  }, [formData.adjustment_type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.branch_id) {
      setValidationError("Please select a target branch.");
      return;
    }

    if (parseInt(formData.quantity, 10) <= 0 || isNaN(formData.quantity)) {
      setValidationError("Quantity must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(error.message || "Failed to process adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedItem) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Stock Adjustment
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Manual Ledger Override
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

            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1">
              {validationError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Target Item Snapshot */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
                    {selectedItem.sku}
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase mt-0.5 truncate max-w-[250px] sm:max-w-xs">
                    {selectedItem.item_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Aggregated Company Stock:{" "}
                    {selectedItem.total_company_quantity} {selectedItem.uom}
                  </p>
                </div>
              </div>

              <form
                id="adjustmentForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Target Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      {branches.length === 0 && (
                        <option value="">No active branches available</option>
                      )}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Adjustment Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, adjustment_type: "ADD" })
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.adjustment_type === "ADD" ? "bg-emerald-500 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                      >
                        <ArrowUpRight size={14} /> Add
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            adjustment_type: "DEDUCT",
                          })
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${formData.adjustment_type === "DEDUCT" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                      >
                        <ArrowDownRight size={14} /> Deduct
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Variance Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Accounting Reason Code{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      {REASON_CODES[formData.adjustment_type].map((code) => (
                        <option key={code} value={code}>
                          {formatReason(code)}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-2 font-medium">
                      This reason determines how the financial variance is
                      mapped to the General Ledger.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Detailed Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Explain the context of this adjustment..."
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg ${formData.adjustment_type === "ADD" ? "bg-emerald-500 hover:bg-emerald-600 text-slate-900 shadow-emerald-500/20" : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    Confirm{" "}
                    {formData.adjustment_type === "ADD"
                      ? "Addition"
                      : "Deduction"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdjustmentModal;

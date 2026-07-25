import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  AlertCircle,
  Loader2,
  Package,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { inventoryService } from "../../../services/staff/inventory.service";

const REASON_CODES = [
  { id: "DAMAGED", label: "Damaged Goods" },
  { id: "STOLEN_OR_LOST", label: "Lost / Missing" },
  { id: "STOCK_COUNT_RECONCILIATION", label: "Inventory Count Error" },
  { id: "CLERICAL_ERROR", label: "Clerical Error" },
  { id: "PROMOTIONAL_GIVEAWAY", label: "Promotional Use" },
];

const StockAdjustmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [catalogItems, setCatalogItems] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const [formData, setFormData] = useState({
    item_id: "",
    physical_count: "",
    reason: "",
    staff_remarks: "",
  });

  // Fetch branch catalog on open
  useEffect(() => {
    if (isOpen) {
      setFormData({
        item_id: "",
        physical_count: "",
        reason: "",
        staff_remarks: "",
      });
      setValidationError("");

      setIsLoadingCatalog(true);
      inventoryService
        .getInventory(1, 1000, "", "all", "all")
        .then((res) => setCatalogItems(res.data || []))
        .catch((err) => setValidationError("Failed to load inventory catalog."))
        .finally(() => setIsLoadingCatalog(false));
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.item_id) return setValidationError("Please select an item.");

    const physicalCount = parseInt(formData.physical_count, 10);
    if (isNaN(physicalCount) || physicalCount < 0) {
      return setValidationError("Physical count must be 0 or greater.");
    }

    if (!formData.reason) return setValidationError("Reason code is required.");
    if (formData.staff_remarks.trim().length < 5)
      return setValidationError("Please provide a clearer explanation.");

    const selectedItem = catalogItems.find(
      (i) => i.id.toString() === formData.item_id,
    );
    if (parseInt(selectedItem.total_company_quantity) === physicalCount) {
      return setValidationError(
        "Physical count exactly matches system stock. No adjustment needed.",
      );
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = formData.item_id
    ? catalogItems.find((i) => i.id.toString() === formData.item_id)
    : null;

  const currentSystemQty = selectedItem
    ? parseInt(selectedItem.total_company_quantity, 10)
    : 0;
  const physicalCountVal = parseInt(formData.physical_count, 10);
  const isCountValid = !isNaN(physicalCountVal);
  const variance = isCountValid ? physicalCountVal - currentSystemQty : 0;
  const financialImpact =
    selectedItem && isCountValid
      ? Math.abs(variance) * parseFloat(selectedItem.unit_cost)
      : 0;

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
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Report Discrepancy
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Official Stock Adjustment Intake
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {isLoadingCatalog ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Loading Branch Inventory...
                  </p>
                </div>
              ) : (
                <form
                  id="adjustmentForm"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Item Selection */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                      <Package size={14} /> Inventory Item{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="item_id"
                      value={formData.item_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                    >
                      <option value="">
                        -- Select Item with Discrepancy --
                      </option>
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          [{item.sku}] {item.item_name} (Current:{" "}
                          {item.total_company_quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Math Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
                    <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-400">
                      <ArrowRight size={14} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        System Snapshot
                      </label>
                      <div className="w-full px-4 py-3 bg-slate-200/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-black text-slate-500 dark:text-slate-400 cursor-not-allowed">
                        {selectedItem ? currentSystemQty : "..."}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                        Actual Physical Count{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        name="physical_count"
                        value={formData.physical_count}
                        onChange={handleChange}
                        disabled={!selectedItem}
                        placeholder="e.g., 8"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Live Variance Preview */}
                  {selectedItem && isCountValid && variance !== 0 && (
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${variance < 0 ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${variance < 0 ? "bg-red-100 dark:bg-red-500/20 text-red-600" : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"}`}
                        >
                          <Calculator size={18} />
                        </div>
                        <div>
                          <span
                            className={`block text-[10px] font-black uppercase tracking-widest ${variance < 0 ? "text-red-800 dark:text-red-400" : "text-emerald-800 dark:text-emerald-400"}`}
                          >
                            Calculated Variance
                          </span>
                          <span className="block text-[10px] font-medium opacity-70">
                            {variance < 0
                              ? "DEDUCTION (Write-Off)"
                              : "ADDITION (Gain)"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`block text-lg font-black tracking-tight ${variance < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                        >
                          {variance > 0 ? "+" : ""}
                          {variance}
                        </span>
                        <span className="block text-[10px] font-bold opacity-70">
                          Impact: ₱{financialImpact.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Accounting Reason Code{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                      >
                        <option value="">-- Select Classification --</option>
                        {REASON_CODES.map((code) => (
                          <option key={code.id} value={code.id}>
                            {code.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Staff Explanation{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        name="staff_remarks"
                        value={formData.staff_remarks}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Provide specific details about how/why this discrepancy occurred..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="submit"
                form="adjustmentForm"
                disabled={
                  isSubmitting ||
                  isLoadingCatalog ||
                  !selectedItem ||
                  variance === 0
                }
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Scale size={16} />
                )}
                Submit for Manager Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockAdjustmentModal;

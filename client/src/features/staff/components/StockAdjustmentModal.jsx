import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  AlertCircle,
  Loader2,
  Package,
  Calculator,
  ArrowRight,
  Search,
} from "lucide-react";
import { inventoryService } from "../../../services/staff/inventory.service";
import { useDebounce } from "../../../hooks/useDebounce";

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

  // Custom Async Dropdown State
  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);

  const [formData, setFormData] = useState({
    item_id: "",
    physical_count: "",
    reason: "",
    staff_remarks: "",
  });

  // Reset state entirely when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        item_id: "",
        physical_count: "",
        reason: "",
        staff_remarks: "",
      });
      setValidationError("");
      setSearchTerm("");
      setSearchResults([]);
      setSelectedItemData(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Handle clicking outside the custom dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Async Search Execution
  useEffect(() => {
    if (isOpen && isDropdownOpen) {
      setIsSearching(true);
      inventoryService
        .getInventory(1, 10, debouncedSearchTerm, "all", "all")
        .then((res) => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }
  }, [isOpen, debouncedSearchTerm, isDropdownOpen]);

  const handleSelectItem = (item) => {
    setSelectedItemData(item);
    setFormData((prev) => ({ ...prev, item_id: item.id.toString() }));
    setSearchTerm(`[${item.sku}] ${item.item_name}`);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    // If they start typing again, wipe out the currently selected item mathematically
    if (selectedItemData) {
      setSelectedItemData(null);
      setFormData((prev) => ({ ...prev, item_id: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.item_id || !selectedItemData) {
      return setValidationError(
        "Please search and select a valid inventory item.",
      );
    }

    const physicalCount = parseInt(formData.physical_count, 10);
    if (isNaN(physicalCount) || physicalCount < 0) {
      return setValidationError("Physical count must be 0 or greater.");
    }

    if (!formData.reason) return setValidationError("Reason code is required.");
    if (formData.staff_remarks.trim().length < 5)
      return setValidationError("Please provide a clearer explanation.");

    if (parseInt(selectedItemData.total_company_quantity) === physicalCount) {
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

  const currentSystemQty = selectedItemData
    ? parseInt(selectedItemData.total_company_quantity, 10)
    : 0;
  const physicalCountVal = parseInt(formData.physical_count, 10);
  const isCountValid = !isNaN(physicalCountVal);
  const variance = isCountValid ? physicalCountVal - currentSystemQty : 0;
  const financialImpact =
    selectedItemData && isCountValid
      ? Math.abs(variance) * parseFloat(selectedItemData.unit_cost)
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

              <form
                id="adjustmentForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Async Searchable Item Selection */}
                <div ref={dropdownRef} className="relative z-20">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    <Package size={14} /> Inventory Item Search{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {isSearching ? (
                        <Loader2
                          size={16}
                          className="text-amber-500 animate-spin"
                        />
                      ) : (
                        <Search size={16} className="text-slate-400" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Type SKU or Item Name to search..."
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all"
                    />

                    {/* Custom Dropdown Results */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto custom-scrollbar z-30"
                        >
                          {searchResults.length > 0 ? (
                            searchResults.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleSelectItem(item)}
                                className="p-3 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                              >
                                <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                  {item.sku}
                                </p>
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                  {item.item_name}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                                  System Stock:{" "}
                                  <span className="font-black text-slate-700 dark:text-slate-300">
                                    {item.total_company_quantity} {item.uom}
                                  </span>
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-xs font-medium text-slate-500">
                                {isSearching
                                  ? "Searching catalog..."
                                  : "No matching items found."}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Math Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative z-10">
                  <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-400">
                    <ArrowRight size={14} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      System Snapshot
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-200/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-black text-slate-500 dark:text-slate-400 cursor-not-allowed">
                      {selectedItemData ? currentSystemQty : "..."}
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
                      disabled={!selectedItemData}
                      placeholder="e.g., 8"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Live Variance Preview */}
                {selectedItemData && isCountValid && variance !== 0 && (
                  <div
                    className={`relative z-10 p-4 rounded-xl border flex items-center justify-between ${variance < 0 ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"}`}
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
                <div className="grid grid-cols-1 gap-5 relative z-10">
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
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
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
                      Staff Explanation <span className="text-red-500">*</span>
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
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="submit"
                form="adjustmentForm"
                disabled={isSubmitting || !selectedItemData || variance === 0}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
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

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
  UploadCloud,
  ImageIcon,
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

const REQUIRES_EVIDENCE = ["DAMAGED", "STOLEN_OR_LOST"];

const StockAdjustmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);

  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);

  const [formData, setFormData] = useState({
    item_id: "",
    physical_count: "",
    reason: "",
    staff_remarks: "",
  });

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
      setEvidenceFile(null);
      setEvidencePreview(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (selectedItemData) {
      setSelectedItemData(null);
      setFormData((prev) => ({ ...prev, item_id: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        setValidationError(
          "Invalid file format. Only JPEG, PNG, and WEBP images are allowed.",
        );
        removeFile();
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setValidationError("Image exceeds the maximum 5MB size limit.");
        removeFile();
        return;
      }

      setEvidenceFile(file);
      const objectUrl = URL.createObjectURL(file);
      setEvidencePreview(objectUrl);
      setValidationError("");
    }
  };

  const removeFile = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

    if (REQUIRES_EVIDENCE.includes(formData.reason) && !evidenceFile) {
      return setValidationError(
        `Photo evidence is mandatory for "${formData.reason.replace(/_/g, " ")}" adjustments.`,
      );
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData, evidenceFile);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
                  <Scale size={24} />
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
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
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
                {/* Item Selection Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <div ref={dropdownRef} className="relative z-20">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                      <Package size={16} /> Target Inventory Item{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {isSearching ? (
                          <Loader2
                            size={18}
                            className="text-amber-500 animate-spin"
                          />
                        ) : (
                          <Search size={18} className="text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Type SKU or Item Name to search..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm"
                      />

                      {/* Custom Dropdown Results */}
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectItem(item)}
                                  className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                >
                                  <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                    {item.sku}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                    {item.item_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium tracking-widest uppercase">
                                    System Stock Snapshot:{" "}
                                    <span className="font-black text-slate-700 dark:text-slate-300">
                                      {item.total_company_quantity} {item.uom}
                                    </span>
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
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
                </section>

                {/* Math & Quantities Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <div className="hidden sm:flex absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-400">
                    <ArrowRight size={14} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      System Snapshot
                    </label>
                    <div className="w-full px-5 py-4 bg-slate-200/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl text-base font-black text-slate-500 dark:text-slate-400 cursor-not-allowed">
                      {selectedItemData ? currentSystemQty : "---"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-3">
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
                      className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl text-base font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 disabled:opacity-50 transition-all shadow-sm"
                    />
                  </div>
                </section>

                {/* Live Variance Preview  */}
                <AnimatePresence>
                  {selectedItemData && isCountValid && variance !== 0 && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`relative z-10 p-5 sm:p-6 rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden shadow-sm ${
                        variance < 0
                          ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                          : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3.5 rounded-2xl shadow-inner ${
                            variance < 0
                              ? "bg-red-100 dark:bg-red-500/20 text-red-600"
                              : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"
                          }`}
                        >
                          <Calculator size={22} />
                        </div>
                        <div>
                          <span
                            className={`block text-[10px] font-black uppercase tracking-widest ${
                              variance < 0
                                ? "text-red-800 dark:text-red-400"
                                : "text-emerald-800 dark:text-emerald-400"
                            }`}
                          >
                            Calculated Variance
                          </span>
                          <span className="block text-[10px] font-medium opacity-70 mt-0.5">
                            {variance < 0
                              ? "DEDUCTION (Write-Off)"
                              : "ADDITION (Gain)"}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span
                          className={`block text-3xl font-black tracking-tight ${
                            variance < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {variance > 0 ? "+" : ""}
                          {variance}
                        </span>
                        <span className="block text-[10px] font-bold opacity-70 tracking-widest uppercase mt-0.5">
                          Impact: ₱{financialImpact.toLocaleString()}
                        </span>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Reasoning Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-6 relative z-10">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      Accounting Reason Code{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 cursor-pointer shadow-sm"
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
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      Staff Explanation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      name="staff_remarks"
                      value={formData.staff_remarks}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Provide specific details about how/why this discrepancy occurred..."
                      className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed shadow-sm"
                    />
                  </div>

                  {/* EVIDENCE UPLOAD */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <label className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      <ImageIcon size={14} /> Photo Evidence
                      {REQUIRES_EVIDENCE.includes(formData.reason) && (
                        <span className="text-red-500">
                          *(Required for {formData.reason.replace(/_/g, " ")})
                        </span>
                      )}
                    </label>

                    {!evidencePreview ? (
                      <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg, image/png, image/webp"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <UploadCloud
                          size={32}
                          className="text-slate-400 mb-3"
                        />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Click or drag image to upload
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          JPEG, PNG up to 5MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                        <img
                          src={evidencePreview}
                          alt="Evidence"
                          className="w-full h-48 sm:h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={removeFile}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            <X size={14} /> Remove Photo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="adjustmentForm"
                disabled={isSubmitting || !selectedItemData || variance === 0}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Scale size={18} />
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

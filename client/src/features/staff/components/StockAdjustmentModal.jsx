import React, { useState, useEffect, useRef, useId } from "react";
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
  ImageOff,
  ChevronDown,
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

  // Accessible IDs
  const modalTitleId = useId();
  const itemSearchInputId = useId();
  const itemListboxId = useId();
  const physicalCountInputId = useId();
  const reasonSelectId = useId();
  const remarksInputId = useId();
  const evidenceInputId = useId();

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
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    item_id: "",
    physical_count: "",
    reason: "",
    staff_remarks: "",
  });

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (evidencePreview && !evidencePreview.startsWith("http")) {
        URL.revokeObjectURL(evidencePreview);
      }
    };
  }, [evidencePreview]);

  // Close dropdown or modal on Escape key when not submitting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else {
          onClose?.();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, isDropdownOpen, onClose]);

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
      if (evidencePreview && !evidencePreview.startsWith("http")) {
        URL.revokeObjectURL(evidencePreview);
      }
      setEvidenceFile(null);
      setEvidencePreview(null);
      setImageError(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let isMounted = true;
    if (isOpen && isDropdownOpen) {
      setIsSearching(true);
      inventoryService
        .getInventory(1, 10, debouncedSearchTerm, "all", "all")
        .then((res) => {
          if (isMounted) setSearchResults(res.data || []);
        })
        .catch(() => {
          if (isMounted) setSearchResults([]);
        })
        .finally(() => {
          if (isMounted) setIsSearching(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, debouncedSearchTerm, isDropdownOpen]);

  const handleSelectItem = (item) => {
    setValidationError("");
    setSelectedItemData(item);
    setFormData((prev) => ({ ...prev, item_id: item.id.toString() }));
    setSearchTerm(`[${item.sku}] ${item.item_name}`);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e) => {
    setValidationError("");
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (selectedItemData) {
      setSelectedItemData(null);
      setFormData((prev) => ({ ...prev, item_id: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const removeFile = () => {
    if (evidencePreview && !evidencePreview.startsWith("http")) {
      URL.revokeObjectURL(evidencePreview);
    }
    setEvidenceFile(null);
    setEvidencePreview(null);
    setImageError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFile = (file) => {
    if (!file) return;
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

    if (evidencePreview && !evidencePreview.startsWith("http")) {
      URL.revokeObjectURL(evidencePreview);
    }

    setEvidenceFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEvidencePreview(objectUrl);
    setImageError(false);
    setValidationError("");
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
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

    if (
      parseInt(selectedItemData.total_company_quantity, 10) === physicalCount
    ) {
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
      await onSubmit(
        {
          ...formData,
          staff_remarks: formData.staff_remarks.trim(),
        },
        evidenceFile,
      );
    } catch (error) {
      setValidationError(
        error.message || "Failed to submit stock adjustment request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSystemQty = selectedItemData
    ? parseInt(selectedItemData.total_company_quantity, 10) || 0
    : 0;
  const physicalCountVal = parseInt(formData.physical_count, 10);
  const isCountValid =
    formData.physical_count !== "" && !isNaN(physicalCountVal);
  const variance = isCountValid ? physicalCountVal - currentSystemQty : 0;
  const financialImpact =
    selectedItemData && isCountValid
      ? Math.abs(variance) * (parseFloat(selectedItemData.unit_cost) || 0)
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={() => !isSubmitting && onClose?.()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Scale size={22} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    Report Discrepancy
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Official Stock Adjustment Intake
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close stock adjustment modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
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
                id="adjustmentForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Item Selection Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                  <div ref={dropdownRef} className="relative z-20">
                    <label
                      htmlFor={itemSearchInputId}
                      className="form-label flex items-center gap-2 text-amber-600 dark:text-overdrive-yellow mb-3"
                    >
                      <Package size={15} aria-hidden="true" />
                      <span>Target Inventory Item</span>
                      <span className="form-required">*</span>
                    </label>
                    <div className="relative">
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      >
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
                        id={itemSearchInputId}
                        type="text"
                        role="combobox"
                        aria-expanded={isDropdownOpen}
                        aria-controls={itemListboxId}
                        aria-autocomplete="list"
                        disabled={isSubmitting}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Type SKU or Item Name to search..."
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs disabled:opacity-50"
                      />

                      {/* Custom Dropdown Results */}
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            id={itemListboxId}
                            role="listbox"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  role="option"
                                  aria-selected={
                                    formData.item_id === item.id.toString()
                                  }
                                  onClick={() => handleSelectItem(item)}
                                  className="w-full text-left p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                >
                                  <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                                    {item.sku}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                    {item.item_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-medium tracking-widest uppercase">
                                    <span>System Stock Snapshot:</span>
                                    <span className="font-mono tabular-nums font-black text-slate-800 dark:text-slate-200">
                                      {item.total_company_quantity} {item.uom}
                                    </span>
                                  </p>
                                </button>
                              ))
                            ) : (
                              <div className="p-8 text-center">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <div
                    aria-hidden="true"
                    className="hidden sm:flex absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-400 shadow-2xs"
                  >
                    <ArrowRight size={14} />
                  </div>

                  <div>
                    <span className="form-label">System Snapshot</span>
                    <div
                      aria-live="polite"
                      className="w-full px-5 py-3.5 bg-slate-200/60 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-base font-mono tabular-nums font-black text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    >
                      {selectedItemData
                        ? `${currentSystemQty} ${selectedItemData.uom || ""}`
                        : "---"}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={physicalCountInputId}
                      className="form-label text-amber-600 dark:text-overdrive-yellow"
                    >
                      Actual Physical Count{" "}
                      <span className="form-required">*</span>
                    </label>
                    <input
                      id={physicalCountInputId}
                      required
                      type="number"
                      min="0"
                      step="1"
                      name="physical_count"
                      value={formData.physical_count}
                      onChange={handleChange}
                      disabled={!selectedItemData || isSubmitting}
                      placeholder="e.g., 8"
                      className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-xl text-base font-mono tabular-nums font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 transition-all shadow-2xs"
                    />
                  </div>
                </section>

                {/* Live Variance Preview */}
                <AnimatePresence>
                  {selectedItemData && isCountValid && variance !== 0 && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`relative z-10 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden shadow-xs ${
                        variance < 0
                          ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
                          : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          aria-hidden="true"
                          className={`p-3.5 rounded-2xl shadow-inner shrink-0 ${
                            variance < 0
                              ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          <Calculator size={22} />
                        </div>
                        <div>
                          <span
                            className={`block text-[10px] font-black uppercase tracking-widest ${
                              variance < 0
                                ? "text-rose-800 dark:text-rose-400"
                                : "text-emerald-800 dark:text-emerald-400"
                            }`}
                          >
                            Calculated Variance
                          </span>
                          <span className="block text-[10px] font-bold opacity-75 mt-0.5 uppercase tracking-wider">
                            {variance < 0
                              ? "DEDUCTION (Write-Off)"
                              : "ADDITION (Gain)"}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span
                          className={`block text-2xl sm:text-3xl font-mono tabular-nums font-black tracking-tight ${
                            variance < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                        <span className="block text-[10px] font-mono tabular-nums font-bold opacity-80 tracking-widest uppercase mt-0.5">
                          Impact: ₱
                          {financialImpact.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Reasoning Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-6 relative z-10">
                  <div>
                    <label htmlFor={reasonSelectId} className="form-label">
                      Accounting Reason Code{" "}
                      <span className="form-required">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id={reasonSelectId}
                        required
                        disabled={isSubmitting}
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        className="form-select appearance-none pr-10 cursor-pointer"
                      >
                        <option value="">-- Select Classification --</option>
                        {REASON_CODES.map((code) => (
                          <option key={code.id} value={code.id}>
                            {code.label}
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

                  <div>
                    <label htmlFor={remarksInputId} className="form-label">
                      Staff Explanation <span className="form-required">*</span>
                    </label>
                    <textarea
                      id={remarksInputId}
                      required
                      disabled={isSubmitting}
                      name="staff_remarks"
                      value={formData.staff_remarks}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Provide specific details about how/why this discrepancy occurred..."
                      className="form-textarea resize-none font-medium leading-relaxed"
                    />
                  </div>

                  {/* EVIDENCE UPLOAD */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <label
                      htmlFor={evidenceInputId}
                      className="form-label flex flex-wrap items-center gap-1.5 mb-3"
                    >
                      <ImageIcon
                        size={14}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow"
                      />
                      <span>Photo Evidence</span>
                      {REQUIRES_EVIDENCE.includes(formData.reason) ? (
                        <span className="text-red-500">
                          * (Required for {formData.reason.replace(/_/g, " ")})
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional)
                        </span>
                      )}
                    </label>

                    {!evidencePreview ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() =>
                          !isSubmitting && fileInputRef.current?.click()
                        }
                        onKeyDown={(e) => {
                          if (
                            !isSubmitting &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                        className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                          isDragging
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                        }`}
                      >
                        <input
                          id={evidenceInputId}
                          type="file"
                          ref={fileInputRef}
                          disabled={isSubmitting}
                          onChange={handleFileChange}
                          accept="image/jpeg, image/png, image/webp"
                          className="sr-only"
                        />
                        <UploadCloud
                          size={32}
                          aria-hidden="true"
                          className={`mb-3 transition-colors ${
                            isDragging ? "text-amber-500" : "text-slate-400"
                          }`}
                        />
                        <p
                          className={`text-xs font-bold text-center ${
                            isDragging
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {isDragging
                            ? "Drop image here"
                            : "Click or drag image to upload"}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center">
                          JPEG, PNG, WEBP up to 5MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-white dark:bg-slate-800 p-2">
                        {imageError ? (
                          <div className="w-full h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                            <ImageOff
                              size={32}
                              aria-hidden="true"
                              className="text-slate-400 mb-2 opacity-50"
                            />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              Image Preview Unavailable
                            </span>
                          </div>
                        ) : (
                          <img
                            src={evidencePreview}
                            alt="Discrepancy evidence preview"
                            onError={() => setImageError(true)}
                            className="w-full h-48 sm:h-64 object-contain bg-slate-50 dark:bg-slate-900 rounded-lg"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 sm:bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity flex items-end sm:items-center justify-end sm:justify-center p-3 rounded-xl">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={removeFile}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                          >
                            <X size={14} aria-hidden="true" />
                            <span>Remove Photo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="adjustmentForm"
                disabled={isSubmitting || !selectedItemData || variance === 0}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Scale size={16} aria-hidden="true" />
                )}
                <span>Submit for Manager Review</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockAdjustmentModal;

import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ClipboardList,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  Edit,
  FileText,
  Lock,
  Calendar,
  Search,
} from "lucide-react";
import { estimateService } from "../../../services/staff/estimate.service";
import { useDebounce } from "../../../hooks/useDebounce";

const SalesOrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = "CREATE",
  initialData = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible IDs
  const modalTitleId = useId();
  const estimateSearchInputId = useId();
  const estimateListboxId = useId();
  const completionDateInputId = useId();
  const notesInputId = useId();

  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEstimatePreview, setSelectedEstimatePreview] = useState(null);

  const [formData, setFormData] = useState({
    estimate_id: "",
    estimated_completion_date: "",
    notes: "",
  });

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setValidationError("");
      if (mode === "CREATE") {
        if (initialData && initialData.estimate_id) {
          setFormData({
            estimate_id: initialData.estimate_id.toString(),
            estimated_completion_date: "",
            notes: "",
          });

          setIsSearching(true);
          estimateService
            .getEstimateDetails(initialData.estimate_id)
            .then((res) => {
              if (!isMounted) return;
              const est = res.data;
              setSelectedEstimatePreview(est);
              setSearchTerm(`[${est.estimate_number}] ${est.customer_name}`);
              setIsDropdownOpen(false);
            })
            .catch(() => {
              if (isMounted) {
                setValidationError(
                  "Failed to auto-load the selected Estimate.",
                );
              }
            })
            .finally(() => {
              if (isMounted) setIsSearching(false);
            });
        } else {
          setFormData({
            estimate_id: "",
            estimated_completion_date: "",
            notes: "",
          });
          setSelectedEstimatePreview(null);
          setSearchTerm("");
          setSearchResults([]);
          setIsDropdownOpen(false);
        }
      } else if (mode === "EDIT" && initialData) {
        setFormData({
          estimated_completion_date: initialData.estimated_completion_date
            ? initialData.estimated_completion_date.split("T")[0]
            : "",
          notes: initialData.notes || "",
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, mode, initialData]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close modal on Escape key when not submitting
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

  // Server-side search for APPROVED estimates when dropdown is open in CREATE mode
  useEffect(() => {
    let isMounted = true;
    if (isOpen && isDropdownOpen && mode === "CREATE") {
      setIsSearching(true);
      estimateService
        .getEstimates(1, 10, debouncedSearchTerm, "APPROVED", "all")
        .then((res) => {
          if (isMounted) setSearchResults(res.data?.estimates || []);
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
  }, [isOpen, debouncedSearchTerm, isDropdownOpen, mode]);

  const handleSearchChange = (e) => {
    setValidationError("");
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);

    if (selectedEstimatePreview) {
      setSelectedEstimatePreview(null);
      setFormData((prev) => ({ ...prev, estimate_id: "" }));
    }
  };

  const handleSelectEstimate = (est) => {
    setValidationError("");
    setSelectedEstimatePreview(est);
    setFormData((prev) => ({ ...prev, estimate_id: est.id.toString() }));
    setSearchTerm(`[${est.estimate_number}] ${est.customer_name}`);
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    let payload = {};
    if (mode === "CREATE") {
      if (!formData.estimate_id || !selectedEstimatePreview) {
        return setValidationError(
          "You must search and select an approved estimate to convert.",
        );
      }
      payload = {
        estimate_id: parseInt(formData.estimate_id, 10),
        estimated_completion_date: formData.estimated_completion_date || null,
        notes: formData.notes.trim(),
      };
    } else {
      payload = {
        estimated_completion_date: formData.estimated_completion_date || null,
        notes: formData.notes.trim(),
      };
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message || "Failed to process sales order.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  {mode === "CREATE" ? (
                    <ArrowRightLeft size={20} />
                  ) : (
                    <Edit size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {mode === "CREATE"
                      ? "Convert to Sales Order"
                      : `Update ${initialData?.sales_order_number || "Order"}`}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {mode === "CREATE"
                      ? "Official Work Authorization"
                      : "Adjust Operational Details"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close sales order modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
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
                id="salesOrderForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {mode === "CREATE" && (
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                      <FileText size={14} aria-hidden="true" /> Source Document
                    </h3>

                    <div ref={dropdownRef} className="relative z-20">
                      <label
                        htmlFor={estimateSearchInputId}
                        className="form-label"
                      >
                        Approved Estimate Reference{" "}
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
                          id={estimateSearchInputId}
                          type="text"
                          role="combobox"
                          aria-expanded={isDropdownOpen}
                          aria-controls={estimateListboxId}
                          aria-autocomplete="list"
                          disabled={isSubmitting}
                          value={searchTerm}
                          onChange={handleSearchChange}
                          onFocus={() => setIsDropdownOpen(true)}
                          placeholder="Type Estimate Number or Customer Name..."
                          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs transition-all disabled:opacity-50"
                        />

                        {/* Dropdown Menu Container */}
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              id={estimateListboxId}
                              role="listbox"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                            >
                              {searchResults.length > 0 ? (
                                searchResults.map((est) => (
                                  <button
                                    key={est.id}
                                    type="button"
                                    role="option"
                                    aria-selected={
                                      formData.estimate_id === est.id.toString()
                                    }
                                    onClick={() => handleSelectEstimate(est)}
                                    className="w-full text-left p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                  >
                                    <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                                      {est.estimate_number}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                      {est.customer_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-medium tracking-widest uppercase">
                                      <span>Grand Total:</span>
                                      <span className="font-mono tabular-nums font-black text-slate-800 dark:text-slate-200">
                                        ₱{formatCurrency(est.grand_total)}
                                      </span>
                                    </p>
                                  </button>
                                ))
                              ) : (
                                <div className="p-8 text-center">
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    {isSearching
                                      ? "Searching approved estimates..."
                                      : "No matching estimates found."}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Financial Lock Preview */}
                    <AnimatePresence>
                      {selectedEstimatePreview && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="mt-5 p-4 sm:p-5 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl flex items-center justify-between gap-3 overflow-hidden shadow-xs relative z-10"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              aria-hidden="true"
                              className="p-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0"
                            >
                              <Lock size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">
                                Financial Lock Active
                              </p>
                              <p
                                className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase truncate max-w-[150px] sm:max-w-[220px]"
                                title={selectedEstimatePreview.customer_name}
                              >
                                {selectedEstimatePreview.customer_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">
                              Grand Total
                            </p>
                            <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
                              ₱
                              {formatCurrency(
                                selectedEstimatePreview.grand_total,
                              )}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )}

                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <Calendar size={14} aria-hidden="true" /> Scheduling &
                    Logistics
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label
                        htmlFor={completionDateInputId}
                        className="form-label"
                      >
                        Estimated Completion Date{" "}
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id={completionDateInputId}
                        type="date"
                        name="estimated_completion_date"
                        disabled={isSubmitting}
                        value={formData.estimated_completion_date}
                        onChange={handleChange}
                        className="form-input font-mono tabular-nums cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor={notesInputId} className="form-label">
                        Operational / Logistics Notes{" "}
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        id={notesInputId}
                        name="notes"
                        disabled={isSubmitting}
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="form-textarea resize-none font-medium"
                        placeholder="e.g., Prioritize engine bay work; customer needs car by weekend."
                      />
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* MODAL FOOTER */}
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
                form="salesOrderForm"
                disabled={
                  isSubmitting ||
                  (mode === "CREATE" && !selectedEstimatePreview)
                }
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <ClipboardList size={16} aria-hidden="true" />
                )}
                <span>
                  {mode === "CREATE"
                    ? "Confirm & Initialize Work Order"
                    : "Save Operational Updates"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SalesOrderModal;

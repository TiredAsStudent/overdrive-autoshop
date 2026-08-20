import React, { useState, useEffect, useRef } from "react";
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
    if (isOpen) {
      if (mode === "CREATE") {
        setFormData({
          estimate_id: "",
          estimated_completion_date: "",
          notes: "",
        });
        setSelectedEstimatePreview(null);
        setSearchTerm("");
        setSearchResults([]);
        setIsDropdownOpen(false);
      } else if (mode === "EDIT" && initialData) {
        setFormData({
          estimated_completion_date:
            initialData.estimated_completion_date || "",
          notes: initialData.notes || "",
        });
      }
      setValidationError("");
    }
  }, [isOpen, mode, initialData]);

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
    if (isOpen && isDropdownOpen && mode === "CREATE") {
      setIsSearching(true);
      estimateService
        .getEstimates(1, 10, debouncedSearchTerm, "APPROVED", "all")
        .then((res) => setSearchResults(res.data?.estimates || []))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }
  }, [isOpen, debouncedSearchTerm, isDropdownOpen, mode]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);

    if (selectedEstimatePreview) {
      setSelectedEstimatePreview(null);
      setFormData((prev) => ({ ...prev, estimate_id: "" }));
    }
  };

  const handleSelectEstimate = (est) => {
    setSelectedEstimatePreview(est);
    setFormData((prev) => ({ ...prev, estimate_id: est.id.toString() }));
    setSearchTerm(`[${est.estimate_number}] ${est.customer_name}`);
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    let payload = {};
    if (mode === "CREATE") {
      if (!formData.estimate_id || !selectedEstimatePreview)
        return setValidationError(
          "You must search and select an approved estimate to convert.",
        );
      payload = {
        estimate_id: parseInt(formData.estimate_id, 10),
        estimated_completion_date: formData.estimated_completion_date || null,
        notes: formData.notes,
      };
    } else {
      payload = {
        estimated_completion_date: formData.estimated_completion_date || null,
        notes: formData.notes,
      };
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  {mode === "CREATE" ? (
                    <ArrowRightLeft size={20} />
                  ) : (
                    <Edit size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {mode === "CREATE"
                      ? "Convert to Sales Order"
                      : `Update ${initialData?.sales_order_number}`}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {mode === "CREATE"
                      ? "Official Work Authorization"
                      : "Adjust Operational Details"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="salesOrderForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {mode === "CREATE" && (
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                      <FileText size={14} /> Source Document
                    </h3>

                    <div ref={dropdownRef} className="relative z-20">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Approved Estimate Reference{" "}
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
                          placeholder="Type Estimate Number or Customer Name..."
                          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 shadow-sm transition-all"
                        />

                        {/* Dropdown Menu Container */}
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                            >
                              {searchResults.length > 0 ? (
                                searchResults.map((est) => (
                                  <div
                                    key={est.id}
                                    onClick={() => handleSelectEstimate(est)}
                                    className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                  >
                                    <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                      {est.estimate_number}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                      {est.customer_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium tracking-widest uppercase">
                                      Grand Total:{" "}
                                      <span className="font-black text-slate-700 dark:text-slate-300">
                                        ₱
                                        {parseFloat(
                                          est.grand_total,
                                        ).toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                        })}
                                      </span>
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center">
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
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
                          className="mt-5 p-4 sm:p-5 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl flex items-center justify-between overflow-hidden shadow-sm relative z-10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                              <Lock size={16} />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400/80 mb-0.5">
                                Financial Lock Active
                              </p>
                              <p className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase truncate max-w-[150px] sm:max-w-[200px]">
                                {selectedEstimatePreview.customer_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400/80 mb-0.5">
                              Grand Total
                            </p>
                            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                              ₱
                              {parseFloat(
                                selectedEstimatePreview.grand_total,
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )}

                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                    <Calendar size={14} /> Scheduling & Logistics
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Estimated Completion Date{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="date"
                        name="estimated_completion_date"
                        value={formData.estimated_completion_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Operational / Logistics Notes{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none shadow-sm transition-all"
                        placeholder="e.g., Prioritize engine bay work; customer needs car by weekend."
                      />
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="salesOrderForm"
                disabled={
                  isSubmitting ||
                  (mode === "CREATE" && !selectedEstimatePreview)
                }
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ClipboardList size={16} />
                )}
                {mode === "CREATE"
                  ? "Confirm & Initialize Work Order"
                  : "Save Operational Updates"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SalesOrderModal;

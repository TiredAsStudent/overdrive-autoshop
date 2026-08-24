import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  AlertCircle,
  Loader2,
  FileCheck2,
  Edit,
  Search,
  FileText,
  Calendar,
} from "lucide-react";
import { salesOrderService } from "../../../services/staff/salesOrder.service";
import { useDebounce } from "../../../hooks/useDebounce";

const InvoiceModal = ({
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

  const [selectedOrderPreview, setSelectedOrderPreview] = useState(null);

  const [formData, setFormData] = useState({
    sales_order_id: "",
    due_date: "",
    notes: "",
  });

  // Timezone-Safe Defaults
  const getLocalDateString = (daysOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === "CREATE") {
        setFormData({
          sales_order_id: "",
          due_date: getLocalDateString(30),
          notes:
            "Thank you for choosing Overdrive Auto Shop. Please pay within 30 days.",
        });
        setSearchTerm("");
        setSearchResults([]);
        setSelectedOrderPreview(null);
        setIsDropdownOpen(false);

        if (initialData && initialData.sales_order_id) {
          const targetId = initialData.sales_order_id.toString();
          setFormData((prev) => ({ ...prev, sales_order_id: targetId }));

          setIsSearching(true);
          salesOrderService
            .getSalesOrderDetails(targetId)
            .then((res) => {
              const so = res.data;
              if (so) {
                setSelectedOrderPreview(so);
                setSearchTerm(`[${so.sales_order_number}] ${so.customer_name}`);
              }
            })
            .catch(() => {
              setValidationError(
                "Failed to auto-load the selected Work Order.",
              );
            })
            .finally(() => setIsSearching(false));
        }
      } else if (mode === "EDIT" && initialData) {
        setFormData({
          due_date: initialData.due_date
            ? initialData.due_date.split("T")[0]
            : "",
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
      salesOrderService
        .getSalesOrders(1, 10, debouncedSearchTerm, "COMPLETED", "all")
        .then((res) => setSearchResults(res.data?.salesOrders || []))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }
  }, [isOpen, debouncedSearchTerm, isDropdownOpen, mode]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);

    if (selectedOrderPreview) {
      setSelectedOrderPreview(null);
      setFormData((prev) => ({ ...prev, sales_order_id: "" }));
    }
  };

  const handleSelectOrder = (so) => {
    setSelectedOrderPreview(so);
    setFormData((prev) => ({ ...prev, sales_order_id: so.id.toString() }));
    setSearchTerm(`[${so.sales_order_number}] ${so.customer_name}`);
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
      if (!formData.sales_order_id || !selectedOrderPreview)
        return setValidationError(
          "You must search and select a completed work order to bill.",
        );
      payload = {
        sales_order_id: parseInt(formData.sales_order_id, 10),
        due_date: formData.due_date,
        notes: formData.notes,
      };
    } else {
      payload = {
        due_date: formData.due_date,
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
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
                    <Receipt size={20} />
                  ) : (
                    <Edit size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {mode === "CREATE"
                      ? "Generate Invoice"
                      : `Update ${initialData?.invoice_number}`}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {mode === "CREATE"
                      ? "Official Financial Billing"
                      : "Adjust Billing Metadata"}
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

            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="invoiceForm"
                onSubmit={handleSubmit}
                className="space-y-6 sm:space-y-8"
              >
                {/* SECTION 1: SOURCE DOCUMENT */}
                {mode === "CREATE" && (
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                      <FileText size={14} /> Source Document
                    </h3>

                    <div ref={dropdownRef} className="relative z-20">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Completed Sales Order Reference{" "}
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
                          placeholder="Type SO Number or Customer Name to search..."
                          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm"
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
                                searchResults.map((so) => (
                                  <div
                                    key={so.id}
                                    onClick={() => handleSelectOrder(so)}
                                    className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                  >
                                    <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                      {so.sales_order_number}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                      {so.customer_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium tracking-widest uppercase">
                                      Receivable:{" "}
                                      <span className="font-black text-slate-700 dark:text-slate-300">
                                        ₱
                                        {parseFloat(
                                          so.grand_total,
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
                                      ? "Searching orders..."
                                      : "No matching orders found."}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {selectedOrderPreview && (
                      <div className="mt-5 p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-sm relative z-10">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            Billing Customer
                          </p>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                            {selectedOrderPreview.customer_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            Receivable Amount
                          </p>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-500 font-mono">
                            ₱
                            {parseFloat(
                              selectedOrderPreview.grand_total,
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* SECTION 2: BILLING & LOGISTICS DETAILS */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Calendar size={14} /> Billing Details
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payment Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        min={getLocalDateString(0)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Customer Facing Notes{" "}
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
                      />
                    </div>
                  </div>
                </section>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="invoiceForm"
                disabled={
                  isSubmitting || (mode === "CREATE" && !selectedOrderPreview)
                }
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileCheck2 size={16} />
                )}
                {mode === "CREATE" ? "Issue Official Invoice" : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceModal;

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Wallet,
  Banknote,
  Landmark,
  Search,
  FileText,
  UploadCloud,
  ImageIcon,
} from "lucide-react";
import { invoiceService } from "../../../services/staff/invoice.service";
import { useDebounce } from "../../../hooks/useDebounce";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "GCASH", label: "GCash E-Wallet", icon: Wallet },
  { id: "MAYA", label: "Maya E-Wallet", icon: Wallet },
  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark },
];

const REQUIRES_EVIDENCE = ["GCASH", "MAYA", "BANK_TRANSFER"];

const PaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialInvoiceId = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  const [unresolvedInvoices, setUnresolvedInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState({
    invoice_id: "",
    amount_received: "",
    payment_method: "CASH",
    payment_date: "",
    reference_number: "",
    notes: "",
  });

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
    if (isOpen) {
      setFormData({
        invoice_id: "",
        amount_received: "",
        payment_method: "CASH",
        payment_date: getLocalDateString(),
        reference_number: "",
        notes: "",
      });
      setSelectedInvoice(null);
      setSearchTerm("");
      setSearchResults([]);
      setIsDropdownOpen(false);
      setValidationError("");

      setProofFile(null);
      setProofPreview(null);

      if (initialInvoiceId) {
        setIsSearching(true);
        invoiceService
          .getInvoiceDetails(initialInvoiceId)
          .then((res) => {
            const inv = res.data;
            if (inv) {
              setSelectedInvoice(inv);
              setFormData((prev) => ({
                ...prev,
                invoice_id: inv.id.toString(),
              }));
              setSearchTerm(`[${inv.invoice_number}] ${inv.customer_name}`);
            }
          })
          .catch(() => {
            setValidationError("Failed to auto-load the target invoice.");
          })
          .finally(() => setIsSearching(false));
      }
    }
  }, [isOpen, initialInvoiceId]);

  useEffect(() => {
    if (isOpen && isDropdownOpen) {
      setIsSearching(true);
      invoiceService
        .getInvoices(1, 20, debouncedSearchTerm, "all", "all")
        .then((res) => {
          const pending = (res.data?.invoices || []).filter(
            (inv) =>
              inv.status !== "PAID" &&
              inv.status !== "CANCELLED" &&
              inv.status !== "VOID",
          );
          setSearchResults(pending);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }
  }, [isOpen, debouncedSearchTerm, isDropdownOpen]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (selectedInvoice) {
      setSelectedInvoice(null);
      setFormData((prev) => ({ ...prev, invoice_id: "" }));
    }
  };

  const handleSelectInvoice = (inv) => {
    setSelectedInvoice(inv);
    setFormData((prev) => ({ ...prev, invoice_id: inv.id.toString() }));
    setSearchTerm(`[${inv.invoice_number}] ${inv.customer_name}`);
    setIsDropdownOpen(false);
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
          "Invalid format. Only JPEG, PNG, and WEBP images are allowed.",
        );
        removeFile();
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setValidationError("Image exceeds the maximum 5MB size limit.");
        removeFile();
        return;
      }

      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setValidationError("");
    }
  };

  const removeFile = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const { grandTotal, previouslyPaid, currentBalance } = useMemo(() => {
    const gt = selectedInvoice ? parseFloat(selectedInvoice.grand_total) : 0;
    const pp = selectedInvoice ? parseFloat(selectedInvoice.amount_paid) : 0;
    const cb = Math.round((gt - pp) * 100) / 100;
    return { grandTotal: gt, previouslyPaid: pp, currentBalance: cb };
  }, [selectedInvoice]);

  const amountToApply = parseFloat(formData.amount_received) || 0;
  const projectedBalance =
    Math.round((currentBalance - amountToApply) * 100) / 100;
  const requiresReference = REQUIRES_EVIDENCE.includes(formData.payment_method);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.invoice_id || !selectedInvoice)
      return setValidationError("You must search and select an invoice.");
    if (amountToApply <= 0)
      return setValidationError("Payment amount must be greater than zero.");

    if (amountToApply > currentBalance) {
      return setValidationError(
        `Payment exceeds the remaining balance of ₱${currentBalance.toFixed(2)}`,
      );
    }

    if (requiresReference) {
      if (!formData.reference_number || !formData.reference_number.trim()) {
        return setValidationError(
          `A Transaction Reference is required for ${formData.payment_method} payments.`,
        );
      }
      if (!proofFile) {
        return setValidationError(
          `Photo evidence (Screenshot/Slip) is mandatory for ${formData.payment_method} payments.`,
        );
      }
    }

    const payload = {
      invoice_id: parseInt(formData.invoice_id, 10),
      amount_received: amountToApply,
      payment_method: formData.payment_method,
      payment_date: formData.payment_date,
      reference_number: requiresReference
        ? formData.reference_number.trim()
        : null,
      notes: formData.notes,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload, proofFile);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Record Payment
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Accounts Receivable Liquidation
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

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="paymentForm"
                onSubmit={handleSubmit}
                className="space-y-6 sm:space-y-8"
              >
                {/* SECTION 1 - SOURCE DOCUMENT */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <FileText size={14} /> Source Document
                  </h3>

                  <div ref={dropdownRef} className="relative z-20 mb-5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Target Invoice <span className="text-red-500">*</span>
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
                        placeholder="Type Invoice Number or Customer Name..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm"
                      />

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((inv) => (
                                <div
                                  key={inv.id}
                                  onClick={() => handleSelectInvoice(inv)}
                                  className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                >
                                  <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                    {inv.invoice_number}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                    {inv.customer_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-2 font-medium tracking-widest uppercase">
                                    Current Balance:{" "}
                                    <span className="font-black text-slate-700 dark:text-slate-300">
                                      ₱
                                      {(
                                        parseFloat(inv.grand_total) -
                                        parseFloat(inv.amount_paid)
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
                                    ? "Searching unpaid invoices..."
                                    : "No matching unpaid invoices found."}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedInvoice && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="p-5 bg-slate-900 dark:bg-black rounded-2xl text-white shadow-xl overflow-hidden"
                      >
                        <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-2">
                          <span>Original Invoice Total</span>
                          <span>
                            ₱
                            {grandTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4 pb-4 border-b border-white/10">
                          <span>Previously Paid</span>
                          <span>
                            - ₱
                            {previouslyPaid.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                            Remaining Balance
                          </span>
                          <span className="text-xl font-black text-rose-500 font-mono">
                            ₱
                            {currentBalance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <AnimatePresence>
                          {amountToApply > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="flex justify-between items-center pt-4 mt-4 border-t border-white/10"
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                Projected Balance
                              </span>
                              <span
                                className={`text-lg font-black font-mono ${projectedBalance < 0 ? "text-red-500" : projectedBalance === 0 ? "text-emerald-500" : "text-amber-500"}`}
                              >
                                ₱
                                {projectedBalance.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* SECTION 2 - PAYMENT DETAILS */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                    <Wallet size={14} /> Collection Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Amount Received <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                          ₱
                        </span>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          name="amount_received"
                          value={formData.amount_received}
                          onChange={handleChange}
                          className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      {selectedInvoice && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              amount_received: currentBalance.toFixed(2),
                            })
                          }
                          className="mt-2 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          Apply Full Balance
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payment Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        name="payment_date"
                        max={getLocalDateString()}
                        value={formData.payment_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all cursor-pointer"
                      />
                    </div>

                    {requiresReference && (
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Transaction Reference Number{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="reference_number"
                          value={formData.reference_number || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                          placeholder="e.g., Bank Ref or GCash Ref No."
                        />
                      </div>
                    )}

                    <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-5">
                      <label className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                        <ImageIcon size={14} /> Proof of Payment
                        {requiresReference ? (
                          <span className="text-red-500">
                            *(Required for {formData.payment_method})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium lowercase">
                            (Optional)
                          </span>
                        )}
                      </label>

                      {!proofPreview ? (
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
                            Click or drag screenshot to upload
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            JPEG, PNG up to 5MB
                          </p>
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                          <img
                            src={proofPreview}
                            alt="Payment Proof"
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

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Collection Notes{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                        placeholder="e.g., Downpayment or Cash handed to cashier."
                      />
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="paymentForm"
                disabled={isSubmitting || !selectedInvoice}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm & Record Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;

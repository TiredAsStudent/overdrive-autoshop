import React, { useState, useEffect, useMemo, useRef, useId } from "react";
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
  ChevronDown,
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

const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialInvoiceId = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible IDs
  const modalTitleId = useId();
  const invoiceSearchInputId = useId();
  const invoiceListboxId = useId();
  const amountInputId = useId();
  const methodSelectId = useId();
  const paymentDateInputId = useId();
  const referenceInputId = useId();
  const proofUploadInputId = useId();
  const notesInputId = useId();

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  const [formData, setFormData] = useState({
    invoice_id: "",
    amount_received: "",
    payment_method: "CASH",
    payment_date: "",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
    };
  }, [proofPreview]);

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
    let isMounted = true;
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

      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofFile(null);
      setProofPreview(null);

      if (initialInvoiceId) {
        setIsSearching(true);
        invoiceService
          .getInvoiceDetails(initialInvoiceId)
          .then((res) => {
            if (!isMounted) return;
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
            if (isMounted) {
              setValidationError("Failed to auto-load the target invoice.");
            }
          })
          .finally(() => {
            if (isMounted) setIsSearching(false);
          });
      }
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialInvoiceId]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && isDropdownOpen) {
      setIsSearching(true);
      invoiceService
        .getInvoices(1, 20, debouncedSearchTerm, "all", "all")
        .then((res) => {
          if (!isMounted) return;
          const pending = (res.data?.invoices || []).filter(
            (inv) =>
              inv.status !== "PAID" &&
              inv.status !== "CANCELLED" &&
              inv.status !== "VOID",
          );
          setSearchResults(pending);
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

  const handleSearchChange = (e) => {
    setValidationError("");
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (selectedInvoice) {
      setSelectedInvoice(null);
      setFormData((prev) => ({ ...prev, invoice_id: "" }));
    }
  };

  const handleSelectInvoice = (inv) => {
    setValidationError("");
    setSelectedInvoice(inv);
    setFormData((prev) => ({ ...prev, invoice_id: inv.id.toString() }));
    setSearchTerm(`[${inv.invoice_number}] ${inv.customer_name}`);
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const removeFile = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
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

      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setValidationError("");
    }
  };

  const { grandTotal, previouslyPaid, currentBalance } = useMemo(() => {
    const gt = selectedInvoice
      ? parseFloat(selectedInvoice.grand_total) || 0
      : 0;
    const pp = selectedInvoice
      ? parseFloat(selectedInvoice.amount_paid) || 0
      : 0;
    const cb = Math.round((gt - pp) * 100) / 100;
    return { grandTotal: gt, previouslyPaid: pp, currentBalance: cb };
  }, [selectedInvoice]);

  const amountToApply = parseFloat(formData.amount_received) || 0;
  const projectedBalance =
    Math.round((currentBalance - amountToApply) * 100) / 100;
  const requiresReference = REQUIRES_EVIDENCE.includes(formData.payment_method);

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.invoice_id || !selectedInvoice) {
      return setValidationError("You must search and select an invoice.");
    }
    if (amountToApply <= 0) {
      return setValidationError("Payment amount must be greater than zero.");
    }

    if (amountToApply > currentBalance) {
      return setValidationError(
        `Payment exceeds the remaining balance of ₱${currentBalance.toFixed(2)}`,
      );
    }

    if (requiresReference) {
      if (!formData.reference_number || !formData.reference_number.trim()) {
        return setValidationError(
          `A Transaction Reference is required for ${formData.payment_method.replace(/_/g, " ")} payments.`,
        );
      }
      if (!proofFile) {
        return setValidationError(
          `Photo evidence (Screenshot/Slip) is mandatory for ${formData.payment_method.replace(/_/g, " ")} payments.`,
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
      notes: (formData.notes || "").trim(),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload, proofFile);
    } catch (error) {
      setValidationError(error.message || "Failed to record payment.");
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
                  <CreditCard size={20} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    Record Payment
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Accounts Receivable Liquidation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close payment modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
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
                id="paymentForm"
                onSubmit={handleSubmit}
                className="space-y-6 sm:space-y-8"
              >
                {/* SECTION 1 - SOURCE DOCUMENT */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <FileText size={14} aria-hidden="true" /> Source Document
                  </h3>

                  <div ref={dropdownRef} className="relative z-20 mb-5">
                    <label
                      htmlFor={invoiceSearchInputId}
                      className="form-label"
                    >
                      Target Invoice <span className="form-required">*</span>
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
                        id={invoiceSearchInputId}
                        type="text"
                        role="combobox"
                        aria-expanded={isDropdownOpen}
                        aria-controls={invoiceListboxId}
                        aria-autocomplete="list"
                        disabled={isSubmitting}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Type Invoice Number or Customer Name..."
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs disabled:opacity-50"
                      />

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            id={invoiceListboxId}
                            role="listbox"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((inv) => {
                                const invBalance = Math.max(
                                  0,
                                  (parseFloat(inv.grand_total) || 0) -
                                    (parseFloat(inv.amount_paid) || 0),
                                );
                                return (
                                  <button
                                    key={inv.id}
                                    type="button"
                                    role="option"
                                    aria-selected={
                                      formData.invoice_id === inv.id.toString()
                                    }
                                    onClick={() => handleSelectInvoice(inv)}
                                    className="w-full text-left p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                  >
                                    <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                                      {inv.invoice_number}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                      {inv.customer_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium tracking-widest uppercase flex items-center gap-1">
                                      <span>Current Balance:</span>
                                      <span className="font-mono tabular-nums font-black text-slate-800 dark:text-slate-200">
                                        ₱{formatCurrency(invBalance)}
                                      </span>
                                    </p>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-8 text-center">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                        className="p-5 bg-slate-900 dark:bg-black rounded-2xl text-white shadow-xl border border-slate-800 dark:border-white/10 overflow-hidden"
                      >
                        <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-slate-400 mb-2 gap-3">
                          <span>Original Invoice Total</span>
                          <span className="font-mono tabular-nums font-bold text-slate-200">
                            ₱{formatCurrency(grandTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-slate-400 mb-4 pb-4 border-b border-white/10 gap-3">
                          <span>Previously Paid</span>
                          <span className="font-mono tabular-nums font-bold text-slate-200">
                            - ₱{formatCurrency(previouslyPaid)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-3">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                            Remaining Balance
                          </span>
                          <span className="text-xl font-black text-rose-500 font-mono tabular-nums">
                            ₱{formatCurrency(currentBalance)}
                          </span>
                        </div>

                        <AnimatePresence>
                          {amountToApply > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="flex justify-between items-center pt-4 mt-4 border-t border-white/10 gap-3"
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                Projected Balance
                              </span>
                              <span
                                className={`text-lg font-black font-mono tabular-nums ${
                                  projectedBalance < 0
                                    ? "text-red-500"
                                    : projectedBalance === 0
                                      ? "text-emerald-400"
                                      : "text-amber-400"
                                }`}
                              >
                                ₱{formatCurrency(projectedBalance)}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* COLLECTION DETAILS SECTION */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <Wallet size={14} aria-hidden="true" /> Collection Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor={amountInputId} className="form-label">
                        Amount Received <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold pointer-events-none"
                        >
                          ₱
                        </span>
                        <input
                          id={amountInputId}
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          disabled={isSubmitting}
                          name="amount_received"
                          value={formData.amount_received}
                          onChange={handleChange}
                          className="form-input pl-8 text-sm font-mono tabular-nums font-black"
                          placeholder="0.00"
                        />
                      </div>
                      {selectedInvoice && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setValidationError("");
                            setFormData((prev) => ({
                              ...prev,
                              amount_received: currentBalance.toFixed(2),
                            }));
                          }}
                          className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          Apply Full Balance (₱{formatCurrency(currentBalance)})
                        </button>
                      )}
                    </div>

                    <div>
                      <label htmlFor={methodSelectId} className="form-label">
                        Payment Method <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={methodSelectId}
                          required
                          disabled={isSubmitting}
                          name="payment_method"
                          value={formData.payment_method}
                          onChange={handleChange}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.label}
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

                    <div className="md:col-span-2">
                      <label
                        htmlFor={paymentDateInputId}
                        className="form-label"
                      >
                        Payment Date <span className="form-required">*</span>
                      </label>
                      <input
                        id={paymentDateInputId}
                        required
                        type="date"
                        disabled={isSubmitting}
                        name="payment_date"
                        max={getLocalDateString()}
                        value={formData.payment_date}
                        onChange={handleChange}
                        className="form-input font-mono tabular-nums cursor-pointer"
                      />
                    </div>

                    {requiresReference && (
                      <div className="md:col-span-2">
                        <label
                          htmlFor={referenceInputId}
                          className="form-label"
                        >
                          Transaction Reference Number{" "}
                          <span className="form-required">*</span>
                        </label>
                        <input
                          id={referenceInputId}
                          required
                          type="text"
                          disabled={isSubmitting}
                          name="reference_number"
                          value={formData.reference_number || ""}
                          onChange={handleChange}
                          className="form-input font-mono tabular-nums"
                          placeholder="e.g., Bank Ref or GCash Ref No."
                        />
                      </div>
                    )}

                    {/* IMAGE UPLOAD UI */}
                    <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-5">
                      <label
                        htmlFor={proofUploadInputId}
                        className="form-label flex flex-wrap items-center gap-1.5 mb-3"
                      >
                        <ImageIcon
                          size={14}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow"
                        />
                        <span>Proof of Payment</span>
                        {requiresReference ? (
                          <span className="text-red-500">
                            * (Required for{" "}
                            {formData.payment_method.replace(/_/g, " ")})
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                            (Optional)
                          </span>
                        )}
                      </label>

                      {!proofPreview ? (
                        <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors relative cursor-pointer">
                          <input
                            id={proofUploadInputId}
                            type="file"
                            ref={fileInputRef}
                            disabled={isSubmitting}
                            onChange={handleFileChange}
                            accept="image/jpeg, image/png, image/webp"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <UploadCloud
                            size={32}
                            aria-hidden="true"
                            className="text-slate-400 mb-3"
                          />
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">
                            Click or drag screenshot to upload
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            JPEG, PNG, WEBP up to 5MB
                          </p>
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                          <img
                            src={proofPreview}
                            alt="Selected payment proof preview"
                            className="w-full h-48 sm:h-64 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 sm:bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity flex items-end sm:items-center justify-end sm:justify-center p-3">
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

                    <div className="md:col-span-2">
                      <label htmlFor={notesInputId} className="form-label">
                        Collection Notes{" "}
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        id={notesInputId}
                        disabled={isSubmitting}
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleChange}
                        rows={2}
                        className="form-textarea resize-none font-medium"
                        placeholder="e.g., Downpayment or Cash handed to cashier."
                      />
                    </div>
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
                form="paymentForm"
                disabled={isSubmitting || !selectedInvoice}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={16} aria-hidden="true" />
                )}
                <span>Confirm & Record Payment</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;

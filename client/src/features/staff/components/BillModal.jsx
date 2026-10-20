import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  CheckCircle2,
  PackageCheck,
  Search,
  UploadCloud,
  FileCode2,
  ChevronDown,
} from "lucide-react";
import { billService } from "../../../services/staff/bill.service";
import { purchaseOrderService } from "../../../services/staff/purchaseOrder.service";

const formatToLocalDateInput = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDaysToDateInput = (dateStr, days = 30) => {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  d.setDate(d.getDate() + days);
  return formatToLocalDateInput(d);
};

const BillModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible IDs
  const modalTitleId = useId();
  const poSearchInputId = useId();
  const poListboxId = useId();
  const vendorInvoiceInputId = useId();
  const billDateInputId = useId();
  const dueDateInputId = useId();
  const receivingStatusSelectId = useId();
  const attachmentInputId = useId();
  const notesInputId = useId();

  const [eligiblePOs, setEligiblePOs] = useState([]);
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [poDetails, setPoDetails] = useState(null);
  const [isLoadingPODetails, setIsLoadingPODetails] = useState(false);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // File Upload & Drag States
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const todayStr = formatToLocalDateInput();

  const [formData, setFormData] = useState({
    purchase_order_id: "",
    vendor_invoice_number: "",
    bill_date: todayStr,
    due_date: addDaysToDateInput(todayStr, 30),
    notes: "",
    status: "PENDING_RECEIPT",
  });

  useEffect(() => {
    return () => {
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    };
  }, [attachmentPreview]);

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
      const currentDayStr = formatToLocalDateInput();
      setValidationError("");
      setPoDetails(null);
      setSearchTerm("");
      setIsDropdownOpen(false);
      setFormData({
        purchase_order_id: "",
        vendor_invoice_number: "",
        bill_date: currentDayStr,
        due_date: addDaysToDateInput(currentDayStr, 30),
        notes: "",
        status: "PENDING_RECEIPT",
      });

      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
      setAttachmentFile(null);
      setAttachmentPreview(null);
      setIsDragging(false);

      setIsLoadingPOs(true);
      billService
        .getEligiblePOs()
        .then((res) => {
          if (isMounted) setEligiblePOs(res.data || []);
        })
        .catch(() => {
          if (isMounted) setValidationError("Could not fetch eligible POs.");
        })
        .finally(() => {
          if (isMounted) setIsLoadingPOs(false);
        });
    }

    return () => {
      isMounted = false;
    };
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
    if (formData.purchase_order_id) {
      setIsLoadingPODetails(true);
      purchaseOrderService
        .getPurchaseOrderDetails(formData.purchase_order_id)
        .then((res) => {
          if (isMounted) setPoDetails(res.data);
        })
        .catch(() => {
          if (isMounted) setValidationError("Failed to load PO line items.");
        })
        .finally(() => {
          if (isMounted) setIsLoadingPODetails(false);
        });
    } else {
      setPoDetails(null);
    }

    return () => {
      isMounted = false;
    };
  }, [formData.purchase_order_id]);

  const query = searchTerm.toLowerCase();
  const filteredPOs = eligiblePOs.filter(
    (po) =>
      (po.purchase_order_number || "").toLowerCase().includes(query) ||
      (po.vendor_name || "").toLowerCase().includes(query),
  );

  const handleSearchChange = (e) => {
    setValidationError("");
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (formData.purchase_order_id) {
      setFormData((prev) => ({ ...prev, purchase_order_id: "" }));
      setPoDetails(null);
    }
  };

  const handleSelectPO = (po) => {
    setValidationError("");
    setFormData((prev) => ({ ...prev, purchase_order_id: po.id.toString() }));
    setSearchTerm(`${po.purchase_order_number} — ${po.vendor_name}`);
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "bill_date" && value) {
        if (!prev.due_date || prev.due_date < value) {
          updated.due_date = addDaysToDateInput(value, 30);
        }
      }
      return updated;
    });
  };

  const removeFile = () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFile = (file) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setValidationError(
        "Invalid format. Only PDF, JPEG, PNG, and WEBP are allowed.",
      );
      removeFile();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError("Document exceeds the maximum 10MB size limit.");
      removeFile();
      return;
    }

    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
    setValidationError("");
  };

  const handleFileChange = (e) => processFile(e.target.files?.[0]);

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

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.purchase_order_id)
      return setValidationError(
        "You must search and select a source Purchase Order.",
      );
    if (!formData.vendor_invoice_number.trim())
      return setValidationError("Vendor Invoice / Receipt Number is required.");
    if (!formData.bill_date)
      return setValidationError("Billing Date is required.");
    if (!formData.due_date)
      return setValidationError("Payment Due Date is required.");
    if (formData.due_date < formData.bill_date)
      return setValidationError(
        "Payment Due Date cannot be earlier than the Billing Date.",
      );
    if (!poDetails || !poDetails.items)
      return setValidationError("PO line items failed to load.");

    const items = poDetails.items.map((item) => ({
      item_id: item.item_id,
      quantity_received: item.quantity,
      recorded_unit_cost: parseFloat(item.recorded_unit_cost) || 0,
      discount_amount: parseFloat(item.discount_amount) || 0,
    }));

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          purchase_order_id: parseInt(formData.purchase_order_id, 10),
          vendor_invoice_number: formData.vendor_invoice_number
            .toUpperCase()
            .trim(),
          bill_date: formData.bill_date,
          due_date: formData.due_date,
          status: formData.status,
          notes: (formData.notes || "").trim(),
          items,
        },
        attachmentFile,
      );
    } catch (error) {
      setValidationError(error.message || "Failed to process bill.");
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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Receipt size={20} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    Record Supplier Bill
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Accounts Payable Entry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close supplier bill modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
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

              <form id="billForm" onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION 1: SOURCE DOCUMENT */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <FileText size={14} aria-hidden="true" /> Source Document
                  </h3>
                  <div className="space-y-4">
                    <div ref={dropdownRef} className="relative z-20">
                      <label htmlFor={poSearchInputId} className="form-label">
                        Source Purchase Order{" "}
                        <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <div
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                        >
                          {isLoadingPOs ? (
                            <Loader2
                              size={18}
                              className="text-amber-500 animate-spin"
                            />
                          ) : (
                            <Search size={18} className="text-slate-400" />
                          )}
                        </div>
                        <input
                          id={poSearchInputId}
                          type="text"
                          role="combobox"
                          aria-expanded={isDropdownOpen}
                          aria-controls={poListboxId}
                          aria-autocomplete="list"
                          disabled={isSubmitting}
                          value={searchTerm}
                          onChange={handleSearchChange}
                          onFocus={() => setIsDropdownOpen(true)}
                          placeholder="Type PO Number or Vendor Name to search..."
                          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs disabled:opacity-50"
                        />

                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              id={poListboxId}
                              role="listbox"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                            >
                              {filteredPOs.length > 0 ? (
                                filteredPOs.map((po) => (
                                  <button
                                    key={po.id}
                                    type="button"
                                    role="option"
                                    aria-selected={
                                      formData.purchase_order_id ===
                                      po.id.toString()
                                    }
                                    onClick={() => handleSelectPO(po)}
                                    className="w-full text-left p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                  >
                                    <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                                      {po.purchase_order_number}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                      {po.vendor_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-medium tracking-widest uppercase">
                                      <span>Total Amount:</span>
                                      <span className="font-mono tabular-nums font-black text-slate-800 dark:text-slate-200">
                                        ₱{formatCurrency(po.grand_total)}
                                      </span>
                                    </p>
                                  </button>
                                ))
                              ) : (
                                <div className="p-8 text-center">
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    {isLoadingPOs
                                      ? "Loading POs..."
                                      : "No matching approved POs found."}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={vendorInvoiceInputId}
                        className="form-label"
                      >
                        Vendor Invoice / OR Number{" "}
                        <span className="form-required">*</span>
                      </label>
                      <input
                        id={vendorInvoiceInputId}
                        required
                        type="text"
                        disabled={isSubmitting}
                        name="vendor_invoice_number"
                        value={formData.vendor_invoice_number}
                        onChange={handleChange}
                        placeholder="e.g. INV-9942"
                        className="form-input font-mono tabular-nums uppercase"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 2: BILLING DETAILS & FILE UPLOAD */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <Calendar size={14} aria-hidden="true" /> Billing Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                    <div>
                      <label htmlFor={billDateInputId} className="form-label">
                        Billing Date <span className="form-required">*</span>
                      </label>
                      <input
                        id={billDateInputId}
                        required
                        type="date"
                        disabled={isSubmitting}
                        name="bill_date"
                        value={formData.bill_date}
                        onChange={handleChange}
                        className="form-input font-mono tabular-nums cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor={dueDateInputId} className="form-label">
                        Due Date <span className="form-required">*</span>
                      </label>
                      <input
                        id={dueDateInputId}
                        required
                        type="date"
                        disabled={isSubmitting}
                        name="due_date"
                        min={formData.bill_date}
                        value={formData.due_date}
                        onChange={handleChange}
                        className="form-input font-mono tabular-nums cursor-pointer"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={receivingStatusSelectId}
                        className="form-label"
                      >
                        Receiving Status{" "}
                        <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={receivingStatusSelectId}
                          required
                          disabled={isSubmitting}
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          <option value="PENDING_RECEIPT">
                            Draft / Pending Delivery
                          </option>
                          <option value="RECEIVED">
                            Goods Received (Post to Inventory)
                          </option>
                        </select>
                        <ChevronDown
                          size={15}
                          aria-hidden="true"
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  {formData.status === "RECEIVED" && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl mb-5">
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black tracking-wider flex items-center gap-1.5 uppercase">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        <span>Immediate Inventory Posting Active</span>
                      </p>
                    </div>
                  )}

                  {/* PREMIUM FILE DROPZONE */}
                  <div className="mb-5 border-t border-slate-200 dark:border-slate-700 pt-5">
                    <label
                      htmlFor={attachmentInputId}
                      className="form-label flex flex-wrap items-center gap-1.5 mb-3"
                    >
                      <FileCode2
                        size={14}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow"
                      />
                      <span>Documentary Proof</span>
                      <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                        (Optional)
                      </span>
                    </label>

                    {!attachmentPreview ? (
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
                          id={attachmentInputId}
                          type="file"
                          ref={fileInputRef}
                          disabled={isSubmitting}
                          onChange={handleFileChange}
                          accept="image/jpeg, image/png, image/webp, application/pdf"
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
                            ? "Drop document here"
                            : "Click or drag Receipt to attach"}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center">
                          PDF, JPEG, PNG, WEBP up to 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-white dark:bg-slate-800 p-2">
                        {attachmentFile?.type === "application/pdf" ? (
                          <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <FileText
                              size={40}
                              aria-hidden="true"
                              className="text-red-500 mb-2"
                            />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[85%]">
                              {attachmentFile.name}
                            </p>
                          </div>
                        ) : (
                          <img
                            src={attachmentPreview}
                            alt="Supplier bill attachment preview"
                            className="w-full h-48 sm:h-56 object-contain bg-slate-50 dark:bg-slate-900 rounded-lg"
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
                            <span>Remove Document</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor={notesInputId} className="form-label">
                      Remarks / Notes{" "}
                      <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id={notesInputId}
                      disabled={isSubmitting}
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Any discrepancies or notes from the courier..."
                      className="form-textarea resize-none font-medium"
                    />
                  </div>
                </section>

                {/* SECTION 3: VERIFIED PREVIEW */}
                {isLoadingPODetails && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex justify-center p-4"
                  >
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin text-amber-500"
                      size={24}
                    />
                  </div>
                )}

                {poDetails && (
                  <section className="mt-4 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <PackageCheck
                        size={14}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow"
                      />
                      <span>
                        Verified PO Line Items ({poDetails.items?.length || 0})
                      </span>
                    </h4>

                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {poDetails.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center gap-3 text-xs p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xs"
                        >
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate uppercase">
                            <span className="font-mono tabular-nums">
                              {item.quantity}x
                            </span>{" "}
                            {item.item_name}
                          </span>
                          <span className="font-mono tabular-nums font-black text-slate-800 dark:text-slate-200 shrink-0">
                            ₱{formatCurrency(item.recorded_unit_cost)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          ₱{formatCurrency(poDetails.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <span>VAT Amount</span>
                        <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          ₱{formatCurrency(poDetails.vat_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>Grand Total</span>
                        <span className="font-mono tabular-nums text-amber-600 dark:text-overdrive-yellow tracking-tight">
                          ₱{formatCurrency(poDetails.grand_total)}
                        </span>
                      </div>
                    </div>
                  </section>
                )}
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
                form="billForm"
                disabled={
                  isSubmitting ||
                  isLoadingPOs ||
                  isLoadingPODetails ||
                  !formData.purchase_order_id
                }
                className={`flex-1 py-3.5 sm:py-4 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer ${
                  formData.status === "RECEIVED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20"
                }`}
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : formData.status === "RECEIVED" ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <Receipt size={16} aria-hidden="true" />
                )}
                <span>
                  {formData.status === "RECEIVED"
                    ? "Post Bill & Receive Stock"
                    : "Save Draft Bill"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BillModal;

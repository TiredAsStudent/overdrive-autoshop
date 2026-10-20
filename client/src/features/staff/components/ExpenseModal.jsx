import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ReceiptText,
  AlertCircle,
  Loader2,
  Store,
  DollarSign,
  FileText,
  ClipboardList,
  Search,
  UploadCloud,
  FileCode2,
  ImageOff,
  ChevronDown,
} from "lucide-react";
import { vendorService } from "../../../services/staff/vendor.service";
import { catalogService } from "../../../services/staff/catalog.service";
import { expenseService } from "../../../services/staff/expense.service";
import api from "../../../services/api";

const formatToLocalDateInput = (date = new Date()) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const VendorSearchableSelect = ({ id, value, vendors, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const listboxId = useId();

  useEffect(() => {
    if (value) {
      const selected = vendors.find(
        (v) => v.id.toString() === value.toString(),
      );
      if (selected) setSearchTerm(selected.business_name);
    } else {
      setSearchTerm("");
    }
  }, [value, vendors]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        const selected = vendors.find(
          (v) => v.id.toString() === value?.toString(),
        );
        setSearchTerm(selected ? selected.business_name : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, vendors]);

  const filtered = vendors.filter(
    (v) =>
      v.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div ref={wrapperRef} className="relative z-50">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
        >
          <Search size={16} className="text-slate-400" />
        </div>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          value={isOpen ? searchTerm : value ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && isOpen) {
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
          placeholder="Search registered vendor..."
          className="form-input pl-10"
        />
      </div>
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar z-[100]"
          >
            {filtered.length > 0 ? (
              filtered.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="option"
                  aria-selected={value?.toString() === v.id.toString()}
                  onClick={() => {
                    onChange(v.id);
                    setSearchTerm(v.business_name);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3.5 sm:p-4 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                >
                  <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                    {v.vendor_code}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {v.business_name}
                  </p>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                No matching vendors found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = "CREATE",
  initialData = null,
  categories = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible IDs
  const modalTitleId = useId();
  const expenseDateInputId = useId();
  const coaCategorySelectId = useId();
  const descriptionInputId = useId();
  const vendorInputId = useId();
  const payeeNameInputId = useId();
  const referenceNumberInputId = useId();
  const totalAmountInputId = useId();
  const paymentMethodSelectId = useId();
  const vatableCheckboxId = useId();
  const attachmentInputId = useId();
  const notesInputId = useId();

  const [vendors, setVendors] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vatRate, setVatRate] = useState(12);

  // File Dropzone States
  const fileInputRef = useRef(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAttachmentRemoved, setIsAttachmentRemoved] = useState(false);

  const [formData, setFormData] = useState({
    expense_date: formatToLocalDateInput(),
    expense_account_id: "",
    description: "",
    total_amount: "",
    is_vatable: true,
    payment_method: "CASH",
    vendor_id: "",
    vendor_name: "",
    reference_number: "",
    notes: "",
    is_submitting: false,
  });

  const getAttachmentUrl = (filePath) => {
    if (!filePath) return null;
    const rawBaseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api/v1", "")
      : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:5000";

    const baseUrl = rawBaseUrl.replace(/\/$/, "");
    const normalized = filePath.replace(/\\/g, "/");
    const uploadsIdx = normalized.indexOf("uploads/");
    const cleanRelative =
      uploadsIdx !== -1
        ? normalized.slice(uploadsIdx)
        : normalized.replace(/^\//, "");

    return `${baseUrl}/${cleanRelative}`;
  };

  useEffect(() => {
    return () => {
      if (attachmentPreview && !attachmentPreview.startsWith("http")) {
        URL.revokeObjectURL(attachmentPreview);
      }
    };
  }, [attachmentPreview]);

  // Close modal on Escape key when not submitting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setValidationError("");
      setIsLoadingVendors(true);

      catalogService
        .getSettings()
        .then((res) => {
          if (!isMounted) return;
          const fetchedVat = parseFloat(res.data?.vat_percentage);
          if (!isNaN(fetchedVat)) setVatRate(fetchedVat);
        })
        .catch((err) => console.error("Failed to load settings:", err));

      vendorService
        .getActiveLookup()
        .then((res) => {
          if (isMounted) setVendors(res.data || []);
        })
        .catch(() => {
          if (isMounted) setValidationError("Could not load vendor registry.");
        })
        .finally(() => {
          if (isMounted) setIsLoadingVendors(false);
        });

      // Reset File States completely
      if (attachmentPreview && !attachmentPreview.startsWith("http"))
        URL.revokeObjectURL(attachmentPreview);
      setAttachmentFile(null);
      setAttachmentPreview(null);
      setImageError(false);
      setIsDragging(false);
      setIsAttachmentRemoved(false);

      if (mode === "CREATE") {
        setFormData({
          expense_date: formatToLocalDateInput(),
          expense_account_id: "",
          description: "",
          total_amount: "",
          is_vatable: true,
          payment_method: "CASH",
          vendor_id: "",
          vendor_name: "",
          reference_number: "",
          notes: "",
          is_submitting: false,
        });
      } else if (mode === "EDIT" && initialData?.id) {
        setFormData({
          expense_date: formatToLocalDateInput(initialData.expense_date),
          expense_account_id: initialData.expense_account_id || "",
          description: initialData.description || "",
          total_amount: initialData.total_amount || "",
          is_vatable: true,
          payment_method: "CASH",
          vendor_id: "",
          vendor_name: initialData.vendor_name || "",
          reference_number: "",
          notes: "",
          is_submitting: false,
        });

        if (initialData.receipt_url) {
          setAttachmentPreview(getAttachmentUrl(initialData.receipt_url));
        }

        expenseService
          .getExpenseDetails(initialData.id)
          .then((res) => {
            if (!isMounted) return;
            const fullData = res.data;
            setFormData({
              expense_date: formatToLocalDateInput(fullData.expense_date),
              expense_account_id: fullData.expense_account_id || "",
              description: fullData.description || "",
              total_amount: fullData.total_amount || "",
              is_vatable: fullData.is_vatable ?? true,
              payment_method: fullData.payment_method || "CASH",
              vendor_id: fullData.vendor_id || "",
              vendor_name: fullData.vendor_name || "",
              reference_number: fullData.reference_number || "",
              notes: fullData.notes || "",
              is_submitting: false,
            });

            if (fullData.receipt_url) {
              setAttachmentPreview(getAttachmentUrl(fullData.receipt_url));
            }
          })
          .catch((err) => {
            console.error("Fetch Details Error:", err);
            if (isMounted) {
              setValidationError("Could not fetch full expense details.");
            }
          });
      }
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValidationError("");
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const removeFile = () => {
    if (attachmentPreview && !attachmentPreview.startsWith("http"))
      URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setImageError(false);

    if (mode === "EDIT" && initialData?.receipt_url) {
      setIsAttachmentRemoved(true);
    }

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

    if (attachmentPreview && !attachmentPreview.startsWith("http"))
      URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
    setImageError(false);
    setIsAttachmentRemoved(false);
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

  const handleSubmit = async (e, submitForApproval = false) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.expense_account_id)
      return setValidationError("Expense COA Category is required.");
    if (!formData.description.trim())
      return setValidationError("Expense description is required.");
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      return setValidationError(
        "A valid total amount greater than zero is required.",
      );
    }

    const payload = {
      ...formData,
      description: formData.description.trim(),
      total_amount: parseFloat(formData.total_amount),
      expense_account_id: parseInt(formData.expense_account_id, 10),
      vendor_id: formData.vendor_id ? parseInt(formData.vendor_id, 10) : null,
      vendor_name:
        !formData.vendor_id && formData.vendor_name?.trim()
          ? formData.vendor_name.trim()
          : null,
      reference_number: formData.reference_number?.trim() || "",
      notes: formData.notes?.trim() || "",
      is_submitting: submitForApproval,
    };
    delete payload.category;

    if (isAttachmentRemoved && !attachmentFile) {
      payload.remove_attachment = true;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload, attachmentFile);
    } catch (error) {
      setValidationError(error.message || "Failed to process expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vatMultiplier = 1 + vatRate / 100;

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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ReceiptText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {mode === "CREATE" ? "Record Expense" : "Edit Expense"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {mode === "EDIT" && initialData?.expense_number
                      ? `Document: ${initialData.expense_number}`
                      : "Operational Expenditure"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close expense modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-5 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
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
                id="expenseForm"
                onSubmit={(e) => handleSubmit(e, true)}
                className="space-y-6"
              >
                {/* SECTION 1: EXPENSE PARTICULARS */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-50">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <FileText size={14} aria-hidden="true" /> Expense
                    Particulars
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div>
                      <label
                        htmlFor={expenseDateInputId}
                        className="form-label"
                      >
                        Expense Date <span className="form-required">*</span>
                      </label>
                      <input
                        id={expenseDateInputId}
                        required
                        type="date"
                        disabled={isSubmitting}
                        name="expense_date"
                        value={formData.expense_date}
                        onChange={handleChange}
                        className="form-input font-mono tabular-nums cursor-pointer"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={coaCategorySelectId}
                        className="form-label"
                      >
                        COA Category <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={coaCategorySelectId}
                          required
                          disabled={isSubmitting}
                          name="expense_account_id"
                          value={formData.expense_account_id}
                          onChange={handleChange}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.account_name}
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
                  </div>
                  <div>
                    <label htmlFor={descriptionInputId} className="form-label">
                      Description <span className="form-required">*</span>
                    </label>
                    <input
                      id={descriptionInputId}
                      required
                      type="text"
                      disabled={isSubmitting}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="e.g., Shop floor cleaning supplies"
                      className="form-input"
                    />
                  </div>
                </section>

                {/* SECTION 2: PAYEE & DOCUMENTATION */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-40">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <Store size={14} aria-hidden="true" /> Payee & Documentation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="relative z-50">
                      <label htmlFor={vendorInputId} className="form-label">
                        Registered Vendor{" "}
                        <span className="lowercase font-medium text-slate-400 dark:text-slate-500">
                          (Optional)
                        </span>
                      </label>
                      <VendorSearchableSelect
                        id={vendorInputId}
                        value={formData.vendor_id}
                        vendors={vendors}
                        disabled={isLoadingVendors || isSubmitting}
                        onChange={(val) => {
                          handleChange({
                            target: {
                              name: "vendor_id",
                              value: val,
                              type: "text",
                            },
                          });
                          if (val)
                            setFormData((prev) => ({
                              ...prev,
                              vendor_name: "",
                            }));
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor={payeeNameInputId} className="form-label">
                        Payee Name{" "}
                        <span className="lowercase font-medium text-slate-400 dark:text-slate-500">
                          (Unregistered)
                        </span>
                      </label>
                      <input
                        id={payeeNameInputId}
                        type="text"
                        name="vendor_name"
                        value={formData.vendor_name || ""}
                        onChange={handleChange}
                        disabled={Boolean(formData.vendor_id) || isSubmitting}
                        placeholder={
                          formData.vendor_id
                            ? "Using Registered Vendor"
                            : "e.g., Local Hardware Store"
                        }
                        className="form-input uppercase"
                      />
                    </div>
                    <div className="sm:col-span-2 relative">
                      <label
                        htmlFor={referenceNumberInputId}
                        className="form-label"
                      >
                        Reference / Receipt #{" "}
                        <span className="lowercase font-medium text-slate-400 dark:text-slate-500">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id={referenceNumberInputId}
                        type="text"
                        disabled={isSubmitting}
                        name="reference_number"
                        value={formData.reference_number || ""}
                        onChange={handleChange}
                        placeholder="e.g., OR-10293"
                        className="form-input font-mono tabular-nums uppercase"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 3: FINANCIAL DETAILS */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-30">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <DollarSign size={14} aria-hidden="true" /> Financial
                    Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div>
                      <label
                        htmlFor={totalAmountInputId}
                        className="form-label"
                      >
                        Total Amount (₱){" "}
                        <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold pointer-events-none"
                        >
                          ₱
                        </span>
                        <input
                          id={totalAmountInputId}
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          disabled={isSubmitting}
                          name="total_amount"
                          value={formData.total_amount}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="form-input pl-8 text-sm font-mono tabular-nums font-black"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor={paymentMethodSelectId}
                        className="form-label"
                      >
                        Payment Method
                      </label>
                      <div className="relative">
                        <select
                          id={paymentMethodSelectId}
                          disabled={isSubmitting}
                          name="payment_method"
                          value={formData.payment_method}
                          onChange={handleChange}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          <option value="CASH">Cash</option>
                          <option value="PETTY_CASH">Petty Cash</option>
                          <option value="GCASH">GCash</option>
                          <option value="MAYA">Maya</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CHECK">Check</option>
                        </select>
                        <ChevronDown
                          size={15}
                          aria-hidden="true"
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  <label
                    htmlFor={vatableCheckboxId}
                    className="flex items-start sm:items-center gap-3 cursor-pointer mb-4"
                  >
                    <input
                      id={vatableCheckboxId}
                      type="checkbox"
                      disabled={isSubmitting}
                      name="is_vatable"
                      checked={formData.is_vatable}
                      onChange={handleChange}
                      className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 sm:mt-0 rounded accent-amber-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shrink-0 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate">
                        Input VAT Applicable
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 break-words">
                        System will automatically extract {vatRate}% for Tax
                        Ledger.
                      </span>
                    </div>
                  </label>

                  {formData.total_amount && !isNaN(formData.total_amount) && (
                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-500/10 rounded-xl flex justify-between items-center border border-emerald-200 dark:border-emerald-500/20 gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 truncate">
                          Live VAT Breakdown
                        </span>
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                          {formData.is_vatable
                            ? `${vatRate}% Extracted`
                            : "VAT Exempt"}
                        </span>
                      </div>
                      <div className="text-right font-mono tabular-nums text-xs font-black text-emerald-800 dark:text-emerald-400 shrink-0">
                        <p>
                          Subtotal: ₱
                          {formData.is_vatable
                            ? (
                                parseFloat(formData.total_amount) /
                                vatMultiplier
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : parseFloat(formData.total_amount).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                        </p>
                        {formData.is_vatable && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                            VAT: ₱
                            {(
                              parseFloat(formData.total_amount) -
                              parseFloat(formData.total_amount) / vatMultiplier
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* SECTION 4: DOCUMENTARY PROOF / ATTACHMENT */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                  <label
                    htmlFor={attachmentInputId}
                    className="form-label flex flex-wrap items-center gap-1.5 mb-3"
                  >
                    <FileCode2
                      size={14}
                      aria-hidden="true"
                      className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                    />
                    <span>Documentary Proof</span>
                    <span className="lowercase text-slate-400 dark:text-slate-500 font-medium">
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
                      className={`w-full border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
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
                        size={30}
                        aria-hidden="true"
                        className={`mb-2.5 transition-colors ${
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
                      {attachmentFile?.type === "application/pdf" ||
                      attachmentPreview.toLowerCase().endsWith(".pdf") ? (
                        <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <FileText
                            size={36}
                            aria-hidden="true"
                            className="text-red-500 mb-2"
                          />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[85%]">
                            {attachmentFile?.name || "Attached PDF Document"}
                          </p>
                        </div>
                      ) : imageError ? (
                        <div className="w-full h-44 sm:h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                          <ImageOff
                            size={32}
                            aria-hidden="true"
                            className="text-slate-400 mb-2 opacity-50"
                          />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Image File Unavailable
                          </span>
                        </div>
                      ) : (
                        <img
                          src={attachmentPreview}
                          alt="Expense receipt preview"
                          onError={() => setImageError(true)}
                          className="w-full h-44 sm:h-52 object-contain bg-slate-50 dark:bg-slate-900 rounded-lg"
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
                </section>

                {/* SECTION 5: NOTES */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <label
                    htmlFor={notesInputId}
                    className="form-label flex items-center gap-2 mb-3"
                  >
                    <ClipboardList
                      size={14}
                      aria-hidden="true"
                      className="text-amber-500 dark:text-overdrive-yellow"
                    />
                    <span>Internal Notes</span>
                    <span className="lowercase text-slate-400 dark:text-slate-500 font-medium">
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
                    placeholder="Any justification for this expense..."
                    className="form-textarea resize-none font-medium"
                  />
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center"
              >
                {isSubmitting ? "Processing..." : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <ReceiptText size={16} aria-hidden="true" />
                )}
                <span>Submit for Approval</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseModal;

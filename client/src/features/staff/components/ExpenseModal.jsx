import React, { useState, useEffect, useRef } from "react";
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
  ImageIcon,
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

const EXPENSE_CATEGORIES = [
  "Utility Expense",
  "Parts & Supplies Expense",
  "Equipment Maintenance",
  "Uncategorized Expense",
  "Rent Expense",
  "Transportation Expense",
  "Meals & Entertainment",
  "Office Supplies",
];

const VendorSearchableSelect = ({ value, vendors, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

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
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : value ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search registered vendor..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm disabled:opacity-60"
        />
      </div>
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-[100]"
          >
            {filtered.length > 0 ? (
              filtered.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    onChange(v.id);
                    setSearchTerm(v.business_name);
                    setIsOpen(false);
                  }}
                  className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                >
                  <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                    {v.vendor_code}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {v.business_name}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                  No matching vendors found.
                </p>
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
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [vendors, setVendors] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vatRate, setVatRate] = useState(12);

  // File Dropzone States
  const fileInputRef = useRef(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isAttachmentRemoved, setIsAttachmentRemoved] = useState(false);

  const [formData, setFormData] = useState({
    expense_date: formatToLocalDateInput(),
    category: "",
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

  const getAttachmentUrl = (path) => {
    if (!path) return null;
    let baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api/v1", "")
      : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:5000";

    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const normalizedPath = cleanPath.replace(/\\/g, "/");

    return `${baseUrl}/${normalizedPath}`;
  };

  useEffect(() => {
    return () => {
      if (attachmentPreview && !attachmentPreview.startsWith("http")) {
        URL.revokeObjectURL(attachmentPreview);
      }
    };
  }, [attachmentPreview]);

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      setIsLoadingVendors(true);

      catalogService
        .getSettings()
        .then((res) => {
          const fetchedVat = parseFloat(res.data?.vat_percentage);
          if (!isNaN(fetchedVat)) setVatRate(fetchedVat);
        })
        .catch((err) => console.error("Failed to load settings:", err));

      vendorService
        .getActiveLookup()
        .then((res) => setVendors(res.data || []))
        .catch(() => setValidationError("Could not load vendor registry."))
        .finally(() => setIsLoadingVendors(false));

      // Reset File States completely
      if (attachmentPreview && !attachmentPreview.startsWith("http"))
        URL.revokeObjectURL(attachmentPreview);
      setAttachmentFile(null);
      setAttachmentPreview(null);
      setIsDragging(false);
      setIsAttachmentRemoved(false);

      if (mode === "CREATE") {
        setFormData({
          expense_date: formatToLocalDateInput(),
          category: "",
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
          category: initialData.category || "",
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
            const fullData = res.data;
            setFormData({
              expense_date: formatToLocalDateInput(fullData.expense_date),
              category: fullData.category || "",
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
            setValidationError("Could not fetch full expense details.");
          });
      }
    }
  }, [isOpen, mode, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- DROPZONE HANDLERS ---
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
    setValidationError("");
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
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

  const removeFile = () => {
    if (attachmentPreview && !attachmentPreview.startsWith("http"))
      URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(null);
    setAttachmentPreview(null);

    if (mode === "EDIT" && initialData?.receipt_url) {
      setIsAttachmentRemoved(true);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e, submitForApproval = false) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.category)
      return setValidationError("Expense category is required.");
    if (!formData.description.trim())
      return setValidationError("Expense description is required.");
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      return setValidationError(
        "A valid total amount greater than zero is required.",
      );
    }

    const payload = {
      ...formData,
      total_amount: parseFloat(formData.total_amount),
      vendor_id: formData.vendor_id ? parseInt(formData.vendor_id, 10) : null,
      vendor_name:
        !formData.vendor_id && formData.vendor_name?.trim()
          ? formData.vendor_name.trim()
          : null,
      is_submitting: submitForApproval,
    };

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {mode === "CREATE" ? "Record Expense" : "Edit Expense"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Operational Expenditure
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

            {/* Scrollable Body */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form id="expenseForm" className="space-y-6 pb-2">
                {/* SECTION 1: EXPENSE PARTICULARS */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <FileText size={14} /> Expense Particulars
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Expense Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        name="expense_date"
                        value={formData.expense_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm cursor-pointer"
                      >
                        <option value="">-- Select Category --</option>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="e.g., Shop floor cleaning supplies"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>
                </section>

                {/* SECTION 2: PAYEE & DOCUMENTATION */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Store size={14} /> Payee & Documentation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="relative z-[70]">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Registered Vendor{" "}
                        <span className="lowercase font-medium text-slate-400">
                          (Optional)
                        </span>
                      </label>
                      <VendorSearchableSelect
                        value={formData.vendor_id}
                        vendors={vendors}
                        disabled={isLoadingVendors}
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
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payee Name (Unregistered){" "}
                        <span className="lowercase font-medium text-slate-400">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="vendor_name"
                        value={formData.vendor_name || ""}
                        onChange={handleChange}
                        disabled={!!formData.vendor_id}
                        placeholder={
                          formData.vendor_id
                            ? "Using Registered Vendor"
                            : "e.g., Local Hardware Store"
                        }
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="sm:col-span-2 relative z-10">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Reference / Receipt #{" "}
                        <span className="lowercase font-medium text-slate-400">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="reference_number"
                        value={formData.reference_number || ""}
                        onChange={handleChange}
                        placeholder="e.g., OR-10293"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 3: FINANCIAL DETAILS */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                    <DollarSign size={14} /> Financial Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Total Amount (₱) <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        name="total_amount"
                        value={formData.total_amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-emerald-500 focus:outline-none focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payment Method
                      </label>
                      <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
                      >
                        <option value="CASH">Cash</option>
                        <option value="PETTY_CASH">Petty Cash</option>
                        <option value="GCASH">GCash</option>
                        <option value="MAYA">Maya</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHECK">Check</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      name="is_vatable"
                      checked={formData.is_vatable}
                      onChange={handleChange}
                      className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                        Input VAT Applicable
                      </span>
                      <span className="text-[10px] text-slate-500">
                        System will automatically extract {vatRate}% for Tax
                        Ledger.
                      </span>
                    </div>
                  </label>

                  {formData.total_amount && !isNaN(formData.total_amount) && (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-xl flex justify-between items-center border border-emerald-200 dark:border-emerald-500/20">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                          Live VAT Breakdown
                        </span>
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          {formData.is_vatable
                            ? `${vatRate}% Input VAT Extracted`
                            : "VAT Exempt"}
                        </span>
                      </div>
                      <div className="text-right font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
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
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <FileCode2 size={14} className="text-amber-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                      Documentary Proof{" "}
                      <span className="lowercase text-slate-400 font-medium">
                        (Optional)
                      </span>
                    </h3>
                  </div>

                  {!attachmentPreview ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                        isDragging
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg, image/png, image/webp, application/pdf"
                        className="hidden"
                      />
                      <UploadCloud
                        size={32}
                        className={`mb-3 transition-colors ${isDragging ? "text-amber-500" : "text-slate-400"}`}
                      />
                      <p
                        className={`text-xs font-bold ${isDragging ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        {isDragging
                          ? "Drop document here"
                          : "Click or drag Receipt to attach"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 text-center">
                        PDF, JPEG, PNG, WEBP up to 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-white dark:bg-slate-800 p-2">
                      {attachmentFile?.type === "application/pdf" ||
                      attachmentPreview.endsWith(".pdf") ? (
                        <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <FileText size={40} className="text-red-500 mb-2" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                            {attachmentFile?.name || "Attached PDF Document"}
                          </p>
                        </div>
                      ) : (
                        <img
                          src={attachmentPreview}
                          alt="Document Preview"
                          className="w-full h-48 sm:h-56 object-contain bg-slate-50 dark:bg-slate-900 rounded-lg"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <button
                          type="button"
                          onClick={removeFile}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <X size={14} /> Remove Document
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* SECTION 5: NOTES */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <ClipboardList size={14} /> Internal Notes
                  </h3>
                  <textarea
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Any justification for this expense..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none shadow-sm transition-all"
                  />
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ReceiptText size={16} />
                )}
                Submit for Approval
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseModal;

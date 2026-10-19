import React, { useState, useEffect, useId } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Plus,
  ArrowLeft,
  Calculator,
  Store,
  Calendar,
  Receipt as ReceiptIcon,
  CreditCard,
  Image as ImageIcon,
  ImageOff,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { receiptService } from "../../services/staff/receipt.service";
import { catalogService } from "../../services/staff/catalog.service";
import { expenseService } from "../../services/staff/expense.service";
import ConfirmModal from "../../components/shared/ConfirmModal";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import api from "../../services/api";

const formatToLocalDateInput = (dateVal) => {
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    return dateVal;
  }
  const parsed = dateVal ? new Date(dateVal) : new Date();
  const validDate = isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = validDate.getFullYear();
  const month = String(validDate.getMonth() + 1).padStart(2, "0");
  const day = String(validDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ReceiptVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  // Accessible Form IDs
  const baseFormId = useId();
  const vendorNameInputId = useId();
  const referenceInputId = useId();
  const expenseDateInputId = useId();
  const categorySelectId = useId();
  const paymentMethodSelectId = useId();
  const vatableCheckboxId = useId();
  const subtotalInputId = useId();
  const vatAmountInputId = useId();
  const grandTotalInputId = useId();

  // Core State
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [scanData, setScanData] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [vatRate, setVatRate] = useState(0.12);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    vendor_name: "",
    reference_number: "",
    expense_date: formatToLocalDateInput(),
    expense_account_id: "",
    payment_method: "CASH",
    is_vatable: true,
    subtotal: 0,
    vat_amount: 0,
    total_amount: 0,
  });
  const [lineItems, setLineItems] = useState([]);

  // Image Viewer State
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Modals
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  useEffect(() => {
    let isMounted = true;
    const handleResize = () => {
      if (isMounted) setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    expenseService
      .getActiveCategories()
      .then((res) => setExpenseCategories(res.data || []))
      .catch((err) => console.error("Failed to load COA categories", err));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      try {
        setLoading(true);

        const [res, settingsRes] = await Promise.all([
          receiptService.getScanDetails(id),
          catalogService
            .getSettings()
            .catch(() => ({ data: { data: { vat_percentage: 12 } } })),
        ]);

        if (!isMounted) return;

        const data = res.data;
        const systemVat =
          parseFloat(settingsRes.data?.data?.vat_percentage || 12) / 100;
        setVatRate(systemVat);

        if (data.status !== "PENDING_VERIFICATION") {
          showToast(`This receipt is already ${data.status}.`, "warning");
          navigate("/staff/receipts/receipt-scanner");
          return;
        }

        setScanData(data);
        setConfidenceScore(parseFloat(data.confidence_score) || 0);

        // Parse AI Extracted Data safely
        let parsed = {};
        if (data.extracted_data) {
          if (typeof data.extracted_data === "string") {
            try {
              parsed = JSON.parse(data.extracted_data);
            } catch (err) {
              console.error("Failed to parse OCR JSON:", err);
            }
          } else {
            parsed = data.extracted_data;
          }
        }

        // Auto-fill form
        setFormData({
          vendor_name: parsed.vendor_name || "",
          reference_number:
            parsed.receipt_number || parsed.reference_number || "",
          expense_date: formatToLocalDateInput(parsed.receipt_date),
          expense_account_id: "",
          payment_method: "CASH",
          is_vatable: true,
          subtotal: parsed.subtotal ?? 0,
          vat_amount: parsed.vat_amount ?? 0,
          total_amount: parsed.grand_total ?? 0,
        });

        setLineItems(Array.isArray(parsed.items) ? parsed.items : []);
      } catch (error) {
        if (isMounted) {
          showToast(
            error.message || "Unable to load OCR verification session.",
            "error",
          );
          navigate("/staff/receipts/receipt-scanner");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, showToast]);

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

  // Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValidationError("");

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Automatically recalculate VAT allocation if VAT Inclusive is toggled
      if (name === "is_vatable") {
        const total = parseFloat(prev.total_amount) || 0;
        if (total > 0) {
          if (checked) {
            const sub = total / (1 + vatRate);
            const vat = total - sub;
            next.subtotal = parseFloat(sub.toFixed(2));
            next.vat_amount = parseFloat(vat.toFixed(2));
          } else {
            next.subtotal = parseFloat(total.toFixed(2));
            next.vat_amount = 0;
          }
        }
      }

      return next;
    });
  };

  // Handle Line Items
  const handleLineItemChange = (index, field, value) => {
    setValidationError("");
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate row total if qty or price changes
    if (field === "quantity" || field === "unit_price") {
      const qty = parseFloat(newItems[index].quantity || 0);
      const price = parseFloat(newItems[index].unit_price || 0);
      newItems[index].total_price = parseFloat((qty * price).toFixed(2));
    }

    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unit_price: 0, total_price: 0 },
    ]);
  };

  const removeLineItem = (index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoCalculate = () => {
    if (lineItems.length === 0) {
      showToast("No line items to sum. Add line items first.", "warning");
      return;
    }

    const calculatedTotal = lineItems.reduce(
      (sum, item) => sum + (parseFloat(item.total_price) || 0),
      0,
    );

    let subtotal = calculatedTotal;
    let vat = 0;

    if (formData.is_vatable) {
      const vatDivisor = 1 + vatRate;
      subtotal = calculatedTotal / vatDivisor;
      vat = calculatedTotal - subtotal;
    }

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      vat_amount: parseFloat(vat.toFixed(2)),
      total_amount: parseFloat(calculatedTotal.toFixed(2)),
    }));

    showToast(
      `Financials recalculated using ${Math.round(vatRate * 100)}% VAT.`,
      "info",
    );
  };

  // Submission & Cancellation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.vendor_name?.trim()) {
      setValidationError("Vendor Name is required.");
      return showToast("Please provide the Vendor Name.", "warning");
    }
    if (!formData.expense_account_id) {
      setValidationError("Please assign a COA Expense Category.");
      return showToast("Please assign a COA Expense Category.", "warning");
    }
    if ((parseFloat(formData.total_amount) || 0) <= 0) {
      setValidationError("Grand Total must be greater than zero.");
      return showToast("Grand total must be greater than zero.", "warning");
    }

    setIsSubmitting(true);
    try {
      const validLineItems = lineItems.filter(
        (item) => item.description && item.description.trim() !== "",
      );

      const payload = {
        ...formData,
        vendor_name: formData.vendor_name.trim().toUpperCase(),
        reference_number:
          formData.reference_number?.trim().toUpperCase() || null,
        expense_account_id: parseInt(formData.expense_account_id, 10),
        subtotal: parseFloat(formData.subtotal) || 0,
        vat_amount: parseFloat(formData.vat_amount) || 0,
        total_amount: parseFloat(formData.total_amount) || 0,
        line_items: validLineItems.map((item) => ({
          ...item,
          description: item.description.trim(),
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: parseFloat(item.total_price) || 0,
        })),
      };

      await receiptService.verifyAndPostExpense(id, payload);
      showToast(
        "Receipt successfully verified and posted to Ledger.",
        "success",
      );
      navigate("/staff/purchases/expenses");
    } catch (error) {
      const msg = error.message || "Failed to post verified receipt.";
      setValidationError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Discard Verification",
      message:
        "Are you sure you want to discard this scanned document? The file and extracted data will be permanently deleted.",
      confirmText: "Yes, Discard Receipt",
      variant: "danger",
      onConfirm: async () => {
        try {
          await receiptService.cancelScan(id);
          showToast("Scan session discarded.", "info");
          navigate("/staff/receipts/receipt-scanner");
        } catch (error) {
          showToast(
            error.message || "Failed to discard scan session.",
            "error",
          );
        }
      },
    });
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center h-[60vh]"
      >
        <div
          aria-hidden="true"
          className="w-14 h-14 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-5"
        />
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Retrieving OCR Session...
        </h2>
      </div>
    );
  }

  const isPdfFile = scanData?.mime_type === "application/pdf";

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Receipt Verification"
        subtitle="Human-In-The-Loop Document Review"
        icon={FileText}
      >
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          title="Go Back / Discard Session"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Discard Session</span>
        </button>
      </PageHeader>

      {/* DUAL PANE WORKSPACE */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[600px] items-start"
      >
        {/* LEFT PANE: SOURCE DOCUMENT VIEWER (5 Columns) */}
        <section
          aria-label="Source Receipt Document Viewer"
          className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col overflow-hidden h-[55vh] min-h-[380px] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-6"
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ImageIcon
                size={16}
                aria-hidden="true"
                className="text-amber-500 dark:text-overdrive-yellow"
              />
              <span>Source Document</span>
            </h2>
          </div>

          <div
            className={`flex-1 relative bg-slate-100/60 dark:bg-slate-900/70 flex items-center justify-center overflow-auto custom-scrollbar ${
              isDesktop && !isPdfFile ? "cursor-move" : "cursor-auto"
            }`}
          >
            {/* Floating Viewer Controls */}
            {!isPdfFile && scanData?.file_path && (
              <div
                role="toolbar"
                aria-label="Document image viewer controls"
                className="absolute top-4 right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  aria-label="Zoom out"
                  title="Zoom Out"
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ZoomOut size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  aria-label="Reset zoom and rotation"
                  title="Click to Reset View"
                  className="text-[10px] font-mono tabular-nums font-black w-11 py-1 text-center text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-overdrive-yellow rounded-md transition-colors cursor-pointer"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  aria-label="Zoom in"
                  title="Zoom In"
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ZoomIn size={16} aria-hidden="true" />
                </button>
                <div
                  aria-hidden="true"
                  className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"
                />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  aria-label="Rotate image 90 degrees clockwise"
                  title="Rotate 90°"
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCw size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            {scanData?.file_path && (
              <motion.div
                drag={isDesktop && !isPdfFile}
                dragConstraints={{
                  left: -500,
                  right: 500,
                  top: -500,
                  bottom: 500,
                }}
                animate={{ scale: zoom, rotate: rotation }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`w-full h-full flex items-center justify-center p-4 ${
                  !isDesktop ? "touch-auto" : "touch-none"
                }`}
              >
                {isPdfFile ? (
                  <iframe
                    src={getAttachmentUrl(scanData.file_path)}
                    className="w-full h-[95%] rounded-xl shadow-2xl bg-white pointer-events-auto"
                    title="Scanned Receipt PDF Document"
                  />
                ) : imageError ? (
                  <div className="w-full h-48 sm:h-56 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 p-4 text-center">
                    <ImageOff
                      size={40}
                      aria-hidden="true"
                      className="mb-3 opacity-50"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Image Not Found
                    </span>
                  </div>
                ) : (
                  <img
                    src={getAttachmentUrl(scanData.file_path)}
                    alt="Scanned supplier receipt"
                    onError={() => setImageError(true)}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-xl pointer-events-none select-none"
                  />
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: VERIFICATION WORKSPACE (7 Columns) */}
        <section
          aria-label="OCR Data Validation Form"
          className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2
                  size={16}
                  aria-hidden="true"
                  className="text-blue-600 dark:text-blue-400"
                />
                <span>Data Validation</span>
              </h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                Correct AI outputs and assign accounting categories.
              </p>
            </div>

            {/* Premium Confidence Banner */}
            <div className="flex flex-wrap items-center gap-2.5">
              {confidenceScore < 60 && (
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>Low Accuracy Warning</span>
                </div>
              )}
              <StatusBadge
                label={`Confidence: ${confidenceScore}%`}
                variant={
                  confidenceScore >= 85
                    ? "success"
                    : confidenceScore >= 60
                      ? "warning"
                      : "danger"
                }
                className="font-mono tabular-nums px-3 py-1.5"
              />
            </div>
          </div>

          <div className="p-5 sm:p-6 lg:p-8 space-y-8 overflow-y-auto custom-scrollbar">
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

            {/* Section 1: Vendor & Document Identity */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2.5 flex items-center gap-2">
                <Store
                  size={14}
                  aria-hidden="true"
                  className="text-amber-500 dark:text-overdrive-yellow"
                />
                <span>Vendor & Document Identity</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor={vendorNameInputId} className="form-label">
                    Vendor Name <span className="form-required">*</span>
                  </label>
                  <input
                    id={vendorNameInputId}
                    required
                    disabled={isSubmitting}
                    type="text"
                    name="vendor_name"
                    placeholder="e.g., PETRON CORPORATION"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    className={`form-input uppercase ${
                      confidenceScore < 60 && !formData.vendor_name
                        ? "border-amber-400 dark:border-amber-500/60"
                        : ""
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor={referenceInputId} className="form-label">
                    Reference / Receipt No.
                  </label>
                  <div className="relative group">
                    <ReceiptIcon
                      size={16}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none"
                    />
                    <input
                      id={referenceInputId}
                      type="text"
                      disabled={isSubmitting}
                      name="reference_number"
                      placeholder="e.g., OR-10482"
                      value={formData.reference_number}
                      onChange={handleInputChange}
                      className="form-input pl-10 font-mono tabular-nums uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={expenseDateInputId} className="form-label">
                    Transaction Date <span className="form-required">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar
                      size={16}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none"
                    />
                    <input
                      id={expenseDateInputId}
                      required
                      disabled={isSubmitting}
                      type="date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleInputChange}
                      className="form-input pl-10 font-mono tabular-nums cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Accounting Classification */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2.5 flex items-center gap-2">
                <Calculator
                  size={14}
                  aria-hidden="true"
                  className="text-amber-500 dark:text-overdrive-yellow"
                />
                <span>Accounting Classification</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor={categorySelectId} className="form-label">
                    COA Expense Category{" "}
                    <span className="form-required">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id={categorySelectId}
                      required
                      disabled={isSubmitting}
                      name="expense_account_id"
                      value={formData.expense_account_id}
                      onChange={handleInputChange}
                      className="form-select appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">-- Select Expense Category --</option>
                      {expenseCategories.map((cat) => (
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
                <div>
                  <label htmlFor={paymentMethodSelectId} className="form-label">
                    Payment Method <span className="form-required">*</span>
                  </label>
                  <div className="relative group">
                    <CreditCard
                      size={16}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none"
                    />
                    <select
                      id={paymentMethodSelectId}
                      required
                      disabled={isSubmitting}
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className="form-select appearance-none pl-10 pr-10 cursor-pointer"
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
                <div className="flex items-center sm:pt-6">
                  <label
                    htmlFor={vatableCheckboxId}
                    className="flex items-center gap-3 cursor-pointer group select-none"
                  >
                    <input
                      id={vatableCheckboxId}
                      type="checkbox"
                      disabled={isSubmitting}
                      name="is_vatable"
                      checked={formData.is_vatable}
                      onChange={handleInputChange}
                      className="w-5 h-5 accent-amber-500 text-amber-500 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-600 transition-colors cursor-pointer"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      VAT Inclusive Receipt
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <FileText
                    size={14}
                    aria-hidden="true"
                    className="text-amber-500 dark:text-overdrive-yellow"
                  />
                  <span>Line Items Detail ({lineItems.length})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {lineItems.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-black">
                      No line items extracted
                    </p>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                      You can add them manually below.
                    </p>
                  </div>
                ) : (
                  lineItems.map((item, index) => {
                    const descId = `${baseFormId}-desc-${index}`;
                    const qtyId = `${baseFormId}-qty-${index}`;
                    const priceId = `${baseFormId}-price-${index}`;
                    const totalId = `${baseFormId}-total-${index}`;

                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-slate-50 dark:bg-slate-900/40 p-4 rounded-[20px] border border-slate-200 dark:border-slate-700/80 transition-all hover:border-amber-400 dark:hover:border-amber-500/40 shadow-2xs"
                      >
                        <div className="w-full sm:flex-[2]">
                          <label
                            htmlFor={descId}
                            className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5"
                          >
                            Description
                          </label>
                          <input
                            id={descId}
                            type="text"
                            disabled={isSubmitting}
                            placeholder="Item or service description"
                            value={item.description || ""}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          />
                        </div>
                        <div className="flex w-full sm:w-auto gap-2.5 sm:gap-3 items-end">
                          <div className="w-16 sm:w-16">
                            <label
                              htmlFor={qtyId}
                              className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5"
                            >
                              Qty
                            </label>
                            <input
                              id={qtyId}
                              type="number"
                              disabled={isSubmitting}
                              min="0.01"
                              step="any"
                              value={item.quantity ?? ""}
                              onChange={(e) =>
                                handleLineItemChange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />
                          </div>
                          <div className="flex-1 sm:w-28">
                            <label
                              htmlFor={priceId}
                              className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5"
                            >
                              Unit Price
                            </label>
                            <input
                              id={priceId}
                              type="number"
                              disabled={isSubmitting}
                              min="0"
                              step="any"
                              value={item.unit_price ?? ""}
                              onChange={(e) =>
                                handleLineItemChange(
                                  index,
                                  "unit_price",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums font-bold text-right text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />
                          </div>
                          <div className="flex-1 sm:w-32">
                            <label
                              htmlFor={totalId}
                              className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5"
                            >
                              Total
                            </label>
                            <input
                              id={totalId}
                              type="number"
                              disabled={isSubmitting}
                              min="0"
                              step="any"
                              value={item.total_price ?? ""}
                              onChange={(e) =>
                                handleLineItemChange(
                                  index,
                                  "total_price",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow text-right focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => removeLineItem(index)}
                            aria-label={`Remove line item ${index + 1}`}
                            title="Remove Line Item"
                            className="p-2.5 mb-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={addLineItem}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center justify-center w-full gap-1.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-4 py-3.5 rounded-xl transition-colors border-2 border-dashed border-amber-300 dark:border-amber-500/30 cursor-pointer disabled:opacity-50"
              >
                <Plus size={14} aria-hidden="true" />
                <span>Add Another Row</span>
              </button>
            </div>

            {/* Section 4: Financial Summary */}
            <div className="bg-slate-900 dark:bg-black rounded-[24px] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-amber-500/30">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-5 border-b border-white/10 pb-3 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow">
                  Calculated Financials
                </h3>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleAutoCalculate}
                  className="text-[10px] font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-colors cursor-pointer bg-sky-400/10 px-3 py-1.5 rounded-lg border border-sky-400/20 hover:bg-sky-400/20 disabled:opacity-50"
                >
                  Auto-Sum from Items
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm font-medium text-slate-300 relative z-10">
                <div className="flex justify-between items-center gap-4">
                  <label htmlFor={subtotalInputId} className="cursor-pointer">
                    Subtotal (Net of VAT)
                  </label>
                  <div className="w-36 sm:w-44 relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 pointer-events-none"
                    >
                      ₱
                    </span>
                    <input
                      id={subtotalInputId}
                      type="number"
                      disabled={isSubmitting}
                      step="any"
                      name="subtotal"
                      value={formData.subtotal}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-2 pr-3 pl-8 text-right font-mono tabular-nums font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <label htmlFor={vatAmountInputId} className="cursor-pointer">
                    VAT Amount ({Math.round(vatRate * 100)}%)
                  </label>
                  <div className="w-36 sm:w-44 relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 pointer-events-none"
                    >
                      ₱
                    </span>
                    <input
                      id={vatAmountInputId}
                      type="number"
                      disabled={isSubmitting}
                      step="any"
                      name="vat_amount"
                      value={formData.vat_amount}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-2 pr-3 pl-8 text-right font-mono tabular-nums font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-800 mt-2">
                  <label
                    htmlFor={grandTotalInputId}
                    className="text-xs font-black uppercase tracking-widest text-slate-200 cursor-pointer"
                  >
                    Grand Total <span className="text-red-500">*</span>
                  </label>
                  <div className="w-40 sm:w-56 relative group">
                    <span
                      aria-hidden="true"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg font-mono font-black text-amber-500 group-focus-within:text-amber-400 transition-colors pointer-events-none"
                    >
                      ₱
                    </span>
                    <input
                      id={grandTotalInputId}
                      required
                      disabled={isSubmitting}
                      type="number"
                      step="any"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      className="w-full bg-black border-2 border-amber-500/40 focus:border-amber-500 rounded-xl py-2.5 pr-4 pl-9 text-right text-lg sm:text-xl font-mono tabular-nums font-black text-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
              <Calculator
                size={160}
                aria-hidden="true"
                className="absolute -right-8 -bottom-8 text-amber-500 opacity-[0.03] pointer-events-none transform rotate-12"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-auto">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              Discard Session
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2
                  size={18}
                  aria-hidden="true"
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={18} aria-hidden="true" />
              )}
              <span>Confirm & Post Expense</span>
            </button>
          </div>
        </section>
      </form>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default ReceiptVerification;

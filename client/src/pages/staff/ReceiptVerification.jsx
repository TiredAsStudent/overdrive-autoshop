import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { receiptService } from "../../services/staff/receipt.service";
import { catalogService } from "../../services/staff/catalog.service";
import ConfirmModal from "../../components/shared/ConfirmModal";
import PageHeader from "../../components/shared/PageHeader";
import api from "../../services/api";

// Standard GL Expense Categories for the Staff
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

const ReceiptVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  // Core State
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [vatRate, setVatRate] = useState(0.12);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Form State
  const [formData, setFormData] = useState({
    vendor_name: "",
    reference_number: "",
    expense_date: "",
    category: "",
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
        setConfidenceScore(parseFloat(data.confidence_score));

        // Parse AI Extracted Data safely
        const parsed =
          typeof data.extracted_data === "string"
            ? JSON.parse(data.extracted_data)
            : data.extracted_data;

        // Auto-fill form
        setFormData({
          vendor_name: parsed.vendor_name || "",
          reference_number:
            parsed.receipt_number || parsed.reference_number || "",
          expense_date:
            parsed.receipt_date || new Date().toISOString().split("T")[0],
          category: "",
          payment_method: "CASH",
          is_vatable: true,
          subtotal: parsed.subtotal || 0,
          vat_amount: parsed.vat_amount || 0,
          total_amount: parsed.grand_total || 0,
        });

        setLineItems(parsed.items || []);
      } catch (error) {
        if (isMounted) {
          showToast(error.message, "error");
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

  // Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Line Items
  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;

    // Auto-calculate row total if qty or price changes
    if (field === "quantity" || field === "unit_price") {
      const qty = parseFloat(newItems[index].quantity || 0);
      const price = parseFloat(newItems[index].unit_price || 0);
      newItems[index].total_price = parseFloat((qty * price).toFixed(2));
    }

    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit_price: 0, total_price: 0 },
    ]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAutoCalculate = () => {
    const calculatedTotal = lineItems.reduce(
      (sum, item) => sum + parseFloat(item.total_price || 0),
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

    showToast(`Financials recalculated using ${vatRate * 100}% VAT.`, "info");
  };

  // Submission & Cancellation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category)
      return showToast("Please assign an Expense Category.", "warning");
    if (parseFloat(formData.total_amount) <= 0)
      return showToast("Grand total must be greater than zero.", "warning");

    setIsSubmitting(true);
    try {
      const validLineItems = lineItems.filter(
        (item) => item.description && item.description.trim() !== "",
      );

      const payload = {
        ...formData,
        vendor_name: formData.vendor_name?.trim() || null,
        reference_number: formData.reference_number?.trim() || null,
        subtotal: parseFloat(formData.subtotal),
        vat_amount: parseFloat(formData.vat_amount),
        total_amount: parseFloat(formData.total_amount),
        line_items: validLineItems.map((item) => ({
          ...item,
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
      showToast(error.message, "error");
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
          showToast(error.message, "error");
        }
      },
    });
  };

  // UI Helpers
  const getConfidenceBadge = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 85)
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/10";
    if (numScore >= 60)
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-sm shadow-amber-500/10";
    return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 shadow-sm shadow-rose-500/10";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full border-[5px] border-amber-500 border-t-transparent animate-spin mb-6"
        />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
          Retrieving OCR Session...
        </h2>
      </div>
    );
  }

  const isPdfFile = scanData?.mime_type === "application/pdf";

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full max-w-[1600px] mx-auto">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Receipt Verification"
        subtitle="Human-In-The-Loop Document Review"
        icon={FileText}
      >
        <button
          onClick={handleCancel}
          className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl transition-all text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-95"
          title="Go Back / Discard"
        >
          <ArrowLeft size={16} /> Discard Session
        </button>
      </PageHeader>

      {/* DUAL PANE WORKSPACE */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[600px] items-start"
      >
        {/* LEFT PANE: SOURCE DOCUMENT VIEWER (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden h-[60vh] lg:h-[850px] lg:sticky lg:top-6">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ImageIcon size={16} className="text-amber-500" /> Source Document
            </h2>
          </div>

          <div
            className={`flex-1 relative bg-slate-100/50 dark:bg-[#0B1120] overflow-hidden flex items-center justify-center overflow-auto custom-scrollbar ${isDesktop && !isPdfFile ? "cursor-move" : "cursor-auto"}`}
          >
            {/* Floating Viewer Controls */}
            {!isPdfFile && scanData?.file_path && (
              <div className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-all">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 text-slate-500 hover:text-amber-500 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[10px] font-black w-10 text-center text-slate-700 dark:text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 text-slate-500 hover:text-amber-500 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="p-1.5 text-slate-500 hover:text-amber-500 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCw size={16} />
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
                className={`w-full h-full flex items-center justify-center p-4 ${!isDesktop ? "touch-auto" : "touch-none"}`}
              >
                {isPdfFile ? (
                  <iframe
                    src={getAttachmentUrl(scanData.file_path)}
                    className="w-full h-[95%] rounded-xl shadow-2xl bg-white pointer-events-auto"
                    title="Document PDF"
                  />
                ) : (
                  <img
                    src={getAttachmentUrl(scanData.file_path)}
                    alt="Receipt"
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-xl pointer-events-none"
                  />
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: VERIFICATION WORKSPACE (7 Columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-500" /> Data
                Validation
              </h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Correct AI outputs and assign accounting categories.
              </p>
            </div>

            {/* Premium Confidence Banner */}
            <div
              className={`px-5 py-2.5 rounded-[16px] border flex items-center gap-4 shadow-sm transition-all ${getConfidenceBadge(confidenceScore)}`}
            >
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                  AI Confidence
                </p>
                <p className="text-base font-black tracking-tight leading-none">
                  {confidenceScore}%
                </p>
              </div>
              {confidenceScore < 60 && (
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-rose-500/10 px-2 py-1.5 rounded-lg border border-rose-500/20">
                  <AlertCircle size={14} /> Low Accuracy
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Section 1: Vendor & Document Identity */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2.5 flex items-center gap-2">
                <Store size={14} className="text-slate-400" /> Vendor & Document
                Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl text-xs font-bold text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-1 ${confidenceScore < 60 && !formData.vendor_name ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-amber-500 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Reference / Receipt No.
                  </label>
                  <div className="relative group">
                    <ReceiptIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"
                    />
                    <input
                      type="text"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Transaction Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"
                    />
                    <input
                      required
                      type="date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Accounting Classification */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2.5 flex items-center gap-2">
                <Calculator size={14} className="text-slate-400" /> Accounting
                Classification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Expense Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Select GL Category --</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <CreditCard
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none"
                    />
                    <select
                      required
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm cursor-pointer"
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
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="is_vatable"
                      checked={formData.is_vatable}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-amber-500 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-600 transition-colors"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      VAT Inclusive Receipt
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" /> Line Items
                  Detail
                </h3>
              </div>

              <div className="space-y-3">
                {lineItems.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                      No line items extracted
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      You can add them manually below.
                    </p>
                  </div>
                ) : (
                  lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap sm:flex-nowrap gap-3 items-end bg-slate-50 dark:bg-slate-900/30 p-4 rounded-[20px] border border-slate-200 dark:border-slate-700/80 transition-all hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm"
                    >
                      <div className="w-full sm:flex-1">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
                        />
                      </div>
                      <div className="w-[30%] sm:w-20">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              "quantity",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
                        />
                      </div>
                      <div className="w-[45%] sm:w-28">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              "unit_price",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-right text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
                        />
                      </div>
                      <div className="w-[45%] sm:w-32">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                          Total
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.total_price}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              "total_price",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2.5 bg-slate-100 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-amber-600 dark:text-amber-500 text-right focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-2.5 mb-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={addLineItem}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center justify-center w-full gap-1.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-4 py-3.5 rounded-xl transition-colors border-2 border-dashed border-amber-200 dark:border-amber-500/30 cursor-pointer"
              >
                <Plus size={14} /> Add Another Row
              </button>
            </div>

            {/* Section 4: Financial Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-amber-500/30">
              <div className="flex justify-between items-end mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-white/10 pb-2.5 w-full flex justify-between items-center relative z-10">
                  <span>Calculated Financials</span>
                  <button
                    type="button"
                    onClick={handleAutoCalculate}
                    className="text-sky-400 hover:text-sky-300 transition-colors cursor-pointer bg-sky-400/10 px-3 py-1.5 rounded-lg border border-sky-400/20 hover:bg-sky-400/20"
                  >
                    Auto-Sum from Items
                  </button>
                </p>
              </div>

              <div className="space-y-4 text-sm font-medium text-slate-400 relative z-10">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <div className="w-32 sm:w-40 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      name="subtotal"
                      value={formData.subtotal}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 pr-3 pl-8 text-right font-mono font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>VAT Amount</span>
                  <div className="w-32 sm:w-40 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      name="vat_amount"
                      value={formData.vat_amount}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 pr-3 pl-8 text-right font-mono font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                    Grand Total <span className="text-red-500">*</span>
                  </span>
                  <div className="w-40 sm:w-56 relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-amber-500 group-focus-within:text-amber-400 transition-colors">
                      ₱
                    </span>
                    <input
                      required
                      type="number"
                      step="any"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      className="w-full bg-black border-2 border-amber-500/30 focus:border-amber-500 rounded-xl py-2.5 pr-4 pl-10 text-right text-xl font-black text-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner shadow-black"
                    />
                  </div>
                </div>
              </div>
              <Calculator
                size={160}
                className="absolute -right-8 -bottom-8 text-amber-500 opacity-[0.03] pointer-events-none transform rotate-12"
              />
            </div>
          </div>

          {/* Footer Action Button */}
          <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex gap-3 sm:gap-4 mt-auto">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm hover:shadow"
            >
              Discard Session
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Confirm & Post Expense
            </button>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
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

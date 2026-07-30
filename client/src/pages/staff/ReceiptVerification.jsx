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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { receiptService } from "../../services/staff/receipt.service";
import { catalogService } from "../../services/staff/catalog.service";
import ConfirmModal from "../../components/shared/ConfirmModal";

// Standard GL Expense Categories for the Staff
const EXPENSE_CATEGORIES = [
  "Auto Parts Inventory",
  "Shop Supplies & Tools",
  "Utilities (Water, Elec, Internet)",
  "Marketing & Advertising",
  "Office Supplies",
  "Repairs & Maintenance",
  "Miscellaneous",
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
    receipt_number: "",
    expense_date: "",
    category: "",
    payment_method: "CASH",
    is_vatable: true,
    subtotal: 0,
    vat_amount: 0,
    total_amount: 0,
  });
  const [lineItems, setLineItems] = useState([]);

  // Image Viewer State (No HTML5 Canvas, strictly CSS Transforms)
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
          receipt_number: parsed.receipt_number || "",
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
      const payload = {
        ...formData,
        subtotal: parseFloat(formData.subtotal),
        vat_amount: parseFloat(formData.vat_amount),
        total_amount: parseFloat(formData.total_amount),
        line_items: lineItems.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.total_price),
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
    if (score >= 85)
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (score >= 60)
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
          Retrieving OCR Session...
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full max-w-[1600px] mx-auto">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleCancel}
            className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl sm:rounded-2xl transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Receipt Verification
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Human-In-The-Loop Document Review
            </p>
          </div>
        </div>
      </div>

      {/* DUAL PANE WORKSPACE */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[600px] items-start"
      >
        {/* LEFT PANE: SOURCE DOCUMENT VIEWER (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden h-[60vh] lg:h-[850px] lg:sticky lg:top-6">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText size={14} className="text-amber-500" /> Source View
            </h2>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[9px] font-black w-8 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
              >
                <ZoomIn size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => setRotation((r) => r + 90)}
                className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>

          <div
            className={`flex-1 relative bg-slate-100/50 dark:bg-[#0B1120] overflow-hidden flex items-center justify-center overflow-auto custom-scrollbar ${isDesktop ? "cursor-move" : "cursor-auto"}`}
          >
            {scanData?.file_path && (
              <motion.div
                drag={isDesktop}
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
                {scanData.mime_type === "application/pdf" ? (
                  <iframe
                    src={`${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000"}${scanData.file_path}`}
                    className="w-full h-[80%] rounded-xl shadow-lg bg-white pointer-events-none"
                    title="Document PDF"
                  />
                ) : (
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000"}${scanData.file_path}`}
                    alt="Receipt"
                    className="max-w-full max-h-full object-contain shadow-lg rounded-xl pointer-events-none"
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

            {/* Confidence Banner */}
            <div
              className={`px-4 py-2 rounded-xl border flex items-center gap-3 shadow-sm ${getConfidenceBadge(confidenceScore)}`}
            >
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-70">
                  AI Confidence
                </p>
                <p className="text-sm font-black tracking-widest">
                  {confidenceScore}%
                </p>
              </div>
              {confidenceScore < 80 && (
                <AlertCircle size={18} className="opacity-80" />
              )}
            </div>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto">
            {/* Section 1: Vendor & Document Identity */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                <Store size={14} /> Vendor & Document Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 ${confidenceScore < 80 && !formData.vendor_name ? "border-amber-400 focus:border-amber-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Receipt / Invoice No.
                  </label>
                  <div className="relative">
                    <ReceiptIcon
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      name="receipt_number"
                      value={formData.receipt_number}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Transaction Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      required
                      type="date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Accounting Classification */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                <Calculator size={14} /> Accounting Classification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Expense Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
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
                  <select
                    required
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="PETTY_CASH">Petty Cash</option>
                    <option value="GCASH">GCash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_vatable"
                      checked={formData.is_vatable}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-amber-500 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-600"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                      VAT Inclusive Receipt
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FileText size={14} /> Line Items Detail
                </h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:text-amber-700 transition-colors cursor-pointer"
                >
                  <Plus size={12} /> Add Row
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">
                      No line items extracted. You can add them manually.
                    </p>
                  </div>
                ) : (
                  lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap sm:flex-nowrap gap-3 items-end bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      <div className="w-full sm:flex-1">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
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
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="w-[30%] sm:w-20">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
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
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="w-[45%] sm:w-28">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
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
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-right focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="w-[45%] sm:w-32">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
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
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-amber-600 dark:text-amber-500 text-right focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-2 mb-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section 4: Financial Summary */}
            <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-end mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-white/10 pb-2 w-full flex justify-between">
                  <span>Calculated Financials</span>
                  <button
                    type="button"
                    onClick={handleAutoCalculate}
                    className="text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    Auto-Sum from Items
                  </button>
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 text-sm font-medium text-slate-400 relative z-10">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <div className="w-32 sm:w-40 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      name="subtotal"
                      value={formData.subtotal}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-1.5 pr-3 pl-8 text-right font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>VAT Amount</span>
                  <div className="w-32 sm:w-40 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      name="vat_amount"
                      value={formData.vat_amount}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-1.5 pr-3 pl-8 text-right font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                    Grand Total <span className="text-red-500">*</span>
                  </span>
                  <div className="w-36 sm:w-48 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-amber-500">
                      ₱
                    </span>
                    <input
                      required
                      type="number"
                      step="any"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      className="w-full bg-black border-2 border-amber-500/30 focus:border-amber-500 rounded-xl py-2 pr-3 pl-8 text-right text-lg font-black text-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <Calculator
                size={120}
                className="absolute -right-6 -bottom-6 text-amber-500 opacity-5 pointer-events-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800 flex gap-3 mt-auto">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              Discard
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

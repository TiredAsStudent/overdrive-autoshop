import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Database,
  Calculator,
  User,
  MapPin,
  Clock,
  Package,
  Loader2,
  FileText,
  Image as ImageIcon,
  X,
  Settings2,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import Image1 from "../../assets/example receipt 2.jpg";
import Image2 from "../../assets/example receipt 4.jpg";

// ==========================================
// MOCK DATA (Guaranteed zero-lag for Defense)
// ==========================================
const MOCK_CATEGORIES = [
  { id: "1130", name: "Inventory Parts", type: "Asset" },
  { id: "5100", name: "Utilities (Water/Elec)", type: "Expense" },
  { id: "5200", name: "Shop Supplies", type: "Expense" },
  { id: "1010", name: "Cash on Hand", type: "Asset" },
  { id: "1020", name: "BPI Checking Account", type: "Asset" },
];

const MOCK_INVENTORY = [
  { id: 1, item_name: "10W-40 Motor Oil (Drum)", unit_cost: 4500 }, // Notice the cost is 4500 here, but the receipt says 5000 (Triggers Inflation!)
  { id: 2, item_name: "Ceramic Brake Pads", unit_cost: 2100 },
];

const MOCK_QUEUE = [
  {
    id: "OCR-882",
    uploaded_by_name: "Staff - Ana",
    branch_name: "Main",
    created_at: "2026-04-22T08:15:00Z",
    ai_confidence_score: 94,
    image_url: Image1,
    extractedData: {
      vendor_name: "Petron Biñan",
      invoice_number: "INV-9921A",
      receipt_date: "2026-04-21",
      total_amount: 12500.0,
      coa_account_id: "1130",
      payment_account_id: "",
      items: [
        {
          id: 1,
          description: "10W-40 Motor Oil (Drum)",
          quantity: 2,
          unit_cost: 5000,
          total_price: 10000,
          inventory_id: "1",
        },
        {
          id: 2,
          description: "Oil Filters (Box)",
          quantity: 5,
          unit_cost: 500,
          total_price: 2500,
          inventory_id: "",
        },
      ],
    },
  },
  {
    id: "OCR-883",
    uploaded_by_name: "Staff - Mark",
    branch_name: "Second",
    created_at: "2026-04-22T09:30:00Z",
    ai_confidence_score: 68, // Low confidence
    image_url: Image2,
    extractedData: {
      vendor_name: "AutoParts Express",
      invoice_number: "APX-0012",
      receipt_date: "2026-04-22",
      total_amount: 8400.0,
      coa_account_id: "1130",
      payment_account_id: "",
      items: [
        {
          id: 3,
          description: "Brake Pads (Ceramic)",
          quantity: 4,
          unit_cost: 2100,
          total_price: 8400,
          inventory_id: "2",
        },
      ],
    },
  },
];

const formatMoney = (val) =>
  `₱${Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminOcrApprovals = () => {
  // --- STATE ---
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [activeReqId, setActiveReqId] = useState(null);
  const [formData, setFormData] = useState(null);

  // UI & UX States
  const [isBinarized, setIsBinarized] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const [inflationAlert, setInflationAlert] = useState({
    show: false,
    message: "",
  });

  // --- HANDLERS ---
  const handleReview = (id) => {
    const target = queue.find((q) => q.id === id);
    // Deep clone the extracted data so we don't mutate the original array directly
    setFormData(JSON.parse(JSON.stringify(target)));
    setActiveReqId(id);
    setEditedFields({});
    setIsBinarized(false);
    setError(null);
  };

  const handleBack = () => {
    setActiveReqId(null);
    setFormData(null);
  };

  const handleFieldChange = (field, value) => {
    setEditedFields((prev) => ({ ...prev, [field]: true }));
    setFormData((prev) => ({
      ...prev,
      extractedData: { ...prev.extractedData, [field]: value },
    }));
  };

  const handleItemChange = (index, field, value) => {
    setEditedFields((prev) => ({ ...prev, [`item_${index}_${field}`]: true }));
    const updatedItems = [...formData.extractedData.items];
    updatedItems[index][field] = value;

    if (field === "quantity" || field === "unit_cost") {
      updatedItems[index].total_price =
        Number(updatedItems[index].quantity) *
        Number(updatedItems[index].unit_cost);
    }

    setFormData((prev) => ({
      ...prev,
      extractedData: { ...prev.extractedData, items: updatedItems },
    }));
  };

  const handleApprove = () => {
    if (
      !formData.extractedData.coa_account_id ||
      !formData.extractedData.payment_account_id
    ) {
      setError(
        "Please select both the Expense Category and the Payment Source before approving.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate Backend Processing
    setTimeout(() => {
      // 1. Remove from Queue
      setQueue((prev) => prev.filter((q) => q.id !== activeReqId));

      // 2. Show Triple-Action Success
      setIsSubmitting(false);
      setActionStatus("success");

      // 3. Auto-close and trigger inflation logic if it was the Petron receipt
      setTimeout(() => {
        setActionStatus(null);
        setActiveReqId(null);
        setFormData(null);

        // Mock Inflation Logic: If they approved the 10W-40 Oil (which jumped from 4500 to 5000)
        if (formData.id === "OCR-882") {
          setTimeout(() => {
            setInflationAlert({
              show: true,
              message:
                "Price Increase Detected! '10W-40 Motor Oil' unit cost increased from ₱4,500.00 to ₱5,000.00 (+11%). Global Service Package prices have been flagged for Manager review.",
            });
          }, 500);
        }
      }, 2500);
    }, 1500);
  };

  const handleReject = () => {
    if (
      !window.confirm(
        "Are you sure you want to reject this receipt? It will be sent back to the staff.",
      )
    )
      return;
    setQueue((prev) => prev.filter((q) => q.id !== activeReqId));
    setActiveReqId(null);
    setFormData(null);
  };

  // ==========================================
  // VIEW 1: THE QUEUE (List)
  // ==========================================
  if (!activeReqId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
              OCR Approval Queue
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Verify branch expenses and parts before they hit the financial
              ledger.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          {queue.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <CheckCircle2
                size={48}
                className="mb-4 text-emerald-500 opacity-50"
              />
              <p className="font-bold uppercase tracking-widest text-sm">
                Inbox is empty. All caught up!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-black text-slate-400">
                    <th className="px-6 py-4 tracking-widest">Maker Info</th>
                    <th className="px-6 py-4 tracking-widest">Confidence</th>
                    <th className="px-6 py-4 tracking-widest text-right">
                      Total Amount
                    </th>
                    <th className="px-6 py-4 tracking-widest text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {queue.map((req) => (
                    <tr
                      key={req.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {req.uploaded_by_name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                              <MapPin size={10} /> {req.branch_name} •{" "}
                              <Clock size={10} />{" "}
                              {new Date(req.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-black mb-1">
                            <span
                              className={
                                req.ai_confidence_score > 80
                                  ? "text-emerald-500"
                                  : "text-amber-500"
                              }
                            >
                              {req.ai_confidence_score}% Match
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${req.ai_confidence_score > 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                              style={{ width: `${req.ai_confidence_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-sm font-black font-mono text-slate-900 dark:text-white">
                          {formatMoney(req.extractedData.total_amount)}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => handleReview(req.id)}
                          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 mx-auto hover:opacity-90 transition-opacity"
                        >
                          <Eye size={14} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* INFLATION ALERT MODAL (Placed outside the specific view so it persists) */}
        <AnimatePresence>
          {inflationAlert.show && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl text-center border border-amber-200 dark:border-amber-500/30"
              >
                <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-slate-800">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                  Inflation Detected
                </h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">
                  {inflationAlert.message}
                </p>
                <button
                  onClick={() =>
                    setInflationAlert({ show: false, message: "" })
                  }
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform"
                >
                  Acknowledge & Update Services
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: SIDE-BY-SIDE VERIFICATION
  // ==========================================
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex justify-between items-center border border-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUCCESS TOAST OVERLAY */}
      <AnimatePresence>
        {actionStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-bold"
          >
            <CheckCircle2 size={24} />
            <div>
              <p className="uppercase tracking-widest text-[10px] text-emerald-100">
                Triple-Action Complete
              </p>
              <p>Ledger Posted & Inventory Updated.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="flex flex-col h-auto lg:h-[calc(100vh-140px)]">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl hover:text-amber-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                Verify: {formData.id}
              </h2>
              <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest mt-1">
                <span className="text-amber-500">
                  {formData.branch_name} Branch
                </span>
                <span className="text-slate-400">
                  | Maker: {formData.uploaded_by_name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Thesis Edit Distance Metric */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 mr-2">
              <Calculator size={16} className="text-blue-500" />
              <div>
                <p className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">
                  Edit Distance
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {Object.keys(editedFields).length === 0
                    ? "0 (100% Match)"
                    : `${Object.keys(editedFields).length} Corrections`}
                </p>
              </div>
            </div>

            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
            >
              <XCircle size={16} />{" "}
              <span className="hidden sm:inline">Reject</span>
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-500 text-white font-black rounded-xl text-xs uppercase flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              Approve
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden">
          {/* LEFT PANE: GREASE-PROOF RECEIPT */}
          <div className="w-full lg:w-[45%] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ImageIcon size={16} /> Source Evidence
              </h3>
              {/* Image Pre-processing Toggle (Thesis Evidence) */}
              <button
                onClick={() => setIsBinarized(!isBinarized)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all border ${
                  isBinarized
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-white/10"
                }`}
              >
                <Settings2 size={14} />{" "}
                {isBinarized ? "Binarization On" : "Apply Filters"}
              </button>
            </div>

            <div className="flex-1 bg-slate-200 dark:bg-black/40 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-white/5 flex items-center justify-center">
              <img
                src={formData.image_url}
                className={`max-w-full max-h-full object-contain transition-all duration-700 ${isBinarized ? "grayscale contrast-150 brightness-110" : ""}`}
                alt="Receipt"
              />
              {isBinarized && (
                <div className="absolute bottom-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold">
                  Visual Noise Removed for OCR
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: EXTRACTED DATA REVIEW */}
          <div className="w-full lg:w-[55%] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 overflow-y-auto shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> Receipt Data
              </h3>
              <div
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  formData.ai_confidence_score > 80
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                }`}
              >
                Match: {formData.ai_confidence_score}%
              </div>
            </div>

            <section className="space-y-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                    Vendor Name{" "}
                    {editedFields.vendor_name && (
                      <span className="text-blue-500">Edited</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.extractedData.vendor_name}
                    onChange={(e) =>
                      handleFieldChange("vendor_name", e.target.value)
                    }
                    className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500 ${editedFields.vendor_name ? "border-blue-400" : "border-slate-200 dark:border-white/10"}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Invoice #
                  </label>
                  <input
                    type="text"
                    value={formData.extractedData.invoice_number}
                    onChange={(e) =>
                      handleFieldChange("invoice_number", e.target.value)
                    }
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    value={formData.extractedData.receipt_date}
                    onChange={(e) =>
                      handleFieldChange("receipt_date", e.target.value)
                    }
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-500 uppercase">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.extractedData.total_amount}
                    onChange={(e) =>
                      handleFieldChange("total_amount", e.target.value)
                    }
                    className="w-full bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 font-black text-sm text-slate-900 dark:text-amber-500 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </section>

            {/* Accounting Routing */}
            <section className="space-y-4 mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database size={14} /> Accounting Ledger Routing
              </h3>
              <div className="grid grid-cols-1 gap-4 p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <span className="text-emerald-500 font-black">DEBIT:</span>{" "}
                    Select Expense Category
                  </label>
                  <select
                    value={formData.extractedData.coa_account_id}
                    onChange={(e) =>
                      handleFieldChange("coa_account_id", e.target.value)
                    }
                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="" disabled>
                      Select Expense Account...
                    </option>
                    {MOCK_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <span className="text-red-500 font-black">CREDIT:</span>{" "}
                    Select Payment Source
                  </label>
                  <select
                    value={formData.extractedData.payment_account_id}
                    onChange={(e) =>
                      handleFieldChange("payment_account_id", e.target.value)
                    }
                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-red-500"
                  >
                    <option value="" disabled>
                      Paid Using...
                    </option>
                    {MOCK_CATEGORIES.filter((c) => c.type === "Asset").map(
                      (cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* Line Items */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Package size={14} /> Line Items & Inventory Link
              </h3>
              <div className="space-y-3">
                {formData.extractedData.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(idx, "description", e.target.value)
                          }
                          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none focus:border-blue-400"
                        />
                      </div>
                      <div className="w-full sm:w-20 space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">
                          Qty
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, "quantity", e.target.value)
                          }
                          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-center dark:text-white outline-none focus:border-blue-400"
                        />
                      </div>
                      <div className="w-full sm:w-24 space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">
                          Unit Cost
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(e) =>
                            handleItemChange(idx, "unit_cost", e.target.value)
                          }
                          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-center dark:text-white outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-white/5">
                      <label className="text-[9px] font-black uppercase text-amber-500">
                        Link to Inventory (Optional)
                      </label>
                      <select
                        value={item.inventory_id}
                        onChange={(e) =>
                          handleItemChange(idx, "inventory_id", e.target.value)
                        }
                        className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none focus:border-amber-500"
                      >
                        <option value="">Do not track (e.g. Supplies)</option>
                        {MOCK_INVENTORY.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.item_name} (Current: ₱{inv.unit_cost})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOcrApprovals;

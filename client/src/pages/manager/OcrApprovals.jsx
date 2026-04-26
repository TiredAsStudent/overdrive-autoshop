import React, { useState, useEffect, useMemo } from "react";
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
  AlertTriangle,
  TrendingUp,
  Wallet,
  ShieldCheck,
  MessageSquareWarning,
  Info,
} from "lucide-react";

// Services (Adjust paths based on your actual structure)
import managerOcrService from "../../services/managerOcr.service";
import api from "../../services/api"; // Fallback for raw calls if needed

const OcrApprovals = () => {
  const baseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace("/api/v1", "");

  // --- STATE MANAGEMENT ---
  const [queue, setQueue] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeReqId, setActiveReqId] = useState(null);
  const [formData, setFormData] = useState(null);

  // UI States
  const [isBinarized, setIsBinarized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [inflationAlert, setInflationAlert] = useState({
    show: false,
    message: "",
  });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, reason: "" });

  // --- DATA LOADING ---
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Parallel fetching for performance
      const queueData = await managerOcrService.getPendingQueue();

      // Fetch dropdown dependencies directly or via your existing services
      const catRes = await api.get("/manager/accounts/balances");
      const invRes = await api.get("/manager/inventory");

      setQueue(queueData);
      setCategories(catRes.data.data || []);
      setInventory(invRes.data.data || []);
    } catch (err) {
      setError("Failed to load approval dependencies: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // --- LOGIC CALCULATIONS ---
  const isVatable = useMemo(() => {
    if (!formData) return false;
    return parseFloat(formData.tax_amount || 0) > 0;
  }, [formData?.tax_amount]);

  const isTotalMismatched = useMemo(() => {
    if (!formData) return false;
    const sum = formData.items.reduce(
      (acc, item) => acc + (parseFloat(item.total_price) || 0),
      0,
    );
    return Math.abs(sum - parseFloat(formData.total_amount || 0)) > 0.01;
  }, [formData?.items, formData?.total_amount]);

  // --- HANDLERS ---
  const handleReview = async (id) => {
    setIsLoading(true);
    try {
      const details = await managerOcrService.getScanDetails(id);
      setFormData({
        ...details,
        receipt_date: details.receipt_date
          ? details.receipt_date.split("T")[0]
          : "",
        payment_account_id: "", // Manager MUST fill this
        branch_name: queue.find((q) => q.id === id)?.branch_name,
        uploaded_by_name: queue.find((q) => q.id === id)?.uploaded_by_name,
      });
      setActiveReqId(id);
      setIsBinarized(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setActiveReqId(null);
    setFormData(null);
    setRejectModal({ isOpen: false, reason: "" });
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    if (field === "quantity" || field === "unit_cost") {
      updatedItems[index].total_price = (
        Number(updatedItems[index].quantity || 0) *
        Number(updatedItems[index].unit_cost || 0)
      ).toFixed(2);
    }
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  // --- TRIPLE-ACTION APPROVE ---
  const handleApprove = async () => {
    if (!formData.account_category_id || !formData.payment_account_id) {
      setError(
        "Compliance Error: Both DEBIT (Expense) and CREDIT (Payment) accounts must be selected to balance the ledger.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        tax_amount: parseFloat(formData.tax_amount),
        account_category_id: parseInt(formData.account_category_id),
        payment_account_id: parseInt(formData.payment_account_id),
        items: formData.items.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
          total_price: parseFloat(item.total_price),
          inventory_id: item.inventory_id ? parseInt(item.inventory_id) : null,
        })),
      };

      const result = await managerOcrService.approveScan(formData.id, payload);

      setActionStatus("success");
      setTimeout(() => {
        setActionStatus(null);
        handleBack();
        loadInitialData(); // Refresh the queue

        // Trigger Inflation Alert if Backend caught a price hike
        if (result.inflationDetected) {
          setInflationAlert({
            show: true,
            message:
              "Supplier unit cost was higher than your Master Inventory record. Review associated Service Packages to ensure profit margins are maintained.",
          });
        }
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FEEDBACK LOOP REJECT ---
  const submitReject = async () => {
    if (rejectModal.reason.trim().length < 5) {
      setError(
        "Please provide a detailed reason for the Maker to correct this entry.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await managerOcrService.rejectScan(formData.id, rejectModal.reason);
      handleBack();
      loadInitialData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // VIEW 1: THE INBOX / QUEUE
  // ==========================================
  if (!activeReqId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto py-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between items-start sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
              OCR Verifications
            </h2>
            <p className="text-sm text-slate-500 font-bold mt-1">
              Checker Gate: Finalize Maker entries before Ledger & Inventory
              posting.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={16} /> {queue.length} Pending
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-20 flex justify-center">
              <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
          ) : queue.length === 0 ? (
            <div className="p-24 flex flex-col items-center justify-center text-slate-400">
              <ShieldCheck
                size={64}
                className="mb-4 text-emerald-500 opacity-50"
              />
              <p className="font-black uppercase tracking-widest text-sm text-slate-500">
                All caught up! Zero pending verifications.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-black text-slate-400">
                    <th className="px-6 py-4 tracking-widest">
                      Maker Identity
                    </th>
                    <th className="px-6 py-4 tracking-widest">Vendor</th>
                    <th className="px-6 py-4 tracking-widest">AI Confidence</th>
                    <th className="px-6 py-4 tracking-widest text-right">
                      Amount
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {req.uploaded_by_name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase mt-0.5 tracking-wider">
                              <MapPin size={10} className="text-amber-500" />{" "}
                              {req.branch_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-xs text-slate-700 dark:text-slate-300">
                        {req.vendor_name || "Unknown"}
                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 flex items-center gap-1">
                          <Clock size={10} />{" "}
                          {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-black mb-1">
                            <span
                              className={
                                req.ai_confidence_score > 85
                                  ? "text-emerald-500"
                                  : "text-amber-500"
                              }
                            >
                              {req.ai_confidence_score || 0}% Match
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${req.ai_confidence_score > 85 ? "bg-emerald-500" : "bg-amber-500"}`}
                              style={{ width: `${req.ai_confidence_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black font-mono text-slate-900 dark:text-white">
                        ₱
                        {Number(req.total_amount).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleReview(req.id)}
                          className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest text-[10px] uppercase rounded-xl mx-auto hover:opacity-90 transition-all flex items-center gap-2"
                        >
                          <Eye size={14} /> Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* INFLATION ALERT MODAL */}
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
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[32px] shadow-2xl text-center border border-amber-200 dark:border-amber-500/30"
              >
                <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-slate-900 shadow-inner">
                  <TrendingUp size={36} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                  Inflation Detected
                </h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                  {inflationAlert.message}
                </p>
                <button
                  onClick={() =>
                    setInflationAlert({ show: false, message: "" })
                  }
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest rounded-2xl uppercase text-xs hover:scale-[1.02] transition-transform"
                >
                  Acknowledge & Close
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
    <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-500 pb-10">
      {/* Dynamic Error Bar */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-black uppercase tracking-widest flex justify-between items-center border border-red-200 dark:border-red-500/30"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="hover:bg-red-100 dark:hover:bg-red-500/20 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* SUCCESS TOAST OVERLAY */}
      <AnimatePresence>
        {actionStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-5 font-bold border border-emerald-400"
          >
            <CheckCircle2 size={32} />
            <div>
              <p className="uppercase tracking-widest text-[10px] text-emerald-100 font-black">
                Triple-Action Complete
              </p>
              <p className="text-sm">Ledger, Balances & Inventory Updated.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-auto lg:h-[88vh]">
        {/* HEADER TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-white dark:bg-slate-800 p-4 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:text-amber-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                Audit: #{formData.id}
              </h2>
              <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest mt-0.5">
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
            <button
              onClick={() => setRejectModal({ isOpen: true, reason: "" })}
              disabled={isSubmitting}
              className="px-5 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 font-black tracking-widest uppercase rounded-xl text-[10px] flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
            >
              <XCircle size={16} /> Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting || isTotalMismatched}
              className="px-6 py-3 bg-emerald-500 text-white font-black tracking-widest rounded-xl text-[10px] uppercase flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              Approve & Post
            </button>
          </div>
        </div>

        {/* SPLIT VIEW MODULAR PANELS */}
        <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden">
          {/* LEFT PANE: GREASE-PROOF RECEIPT */}
          <div className="w-full lg:w-5/12 bg-slate-900 rounded-[32px] overflow-hidden flex flex-col relative border border-slate-800 shadow-xl min-h-[400px]">
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <ImageIcon size={14} /> Source Evidence
              </h3>
              <button
                onClick={() => setIsBinarized(!isBinarized)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${isBinarized ? "bg-white text-slate-900 border-transparent shadow-lg" : "bg-transparent text-white border-white/20 hover:bg-white/10"}`}
              >
                <Settings2 size={12} />{" "}
                {isBinarized ? "Filter Active" : "Apply Filter"}
              </button>
            </div>
            <div className="w-full h-full p-4 flex items-center justify-center bg-slate-950/80">
              <img
                src={`${baseUrl}${formData.image_url}`}
                alt="Receipt Evidence"
                className={`max-w-full max-h-full object-contain filter transition-all duration-700 rounded-lg ${isBinarized ? "grayscale contrast-150 brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "drop-shadow-2xl"}`}
              />
            </div>
          </div>

          {/* RIGHT PANE: DATA REVIEW FORM */}
          <div className="w-full lg:w-7/12 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-6 sm:p-8 overflow-y-auto shadow-xl custom-scrollbar flex flex-col gap-6">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} /> Extracted Data Audit
              </h3>
              <div className="flex gap-2">
                {/* VAT Indicator */}
                {!isVatable && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Info size={12} /> VAT Exempt Vendor
                  </div>
                )}
                <div
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${formData.ai_confidence_score > 85 ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20"}`}
                >
                  AI Match: {formData.ai_confidence_score || 0}%
                </div>
              </div>
            </div>

            {/* Receipt Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) =>
                    handleFieldChange("vendor_name", e.target.value)
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Invoice / SI #
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) =>
                    handleFieldChange("invoice_number", e.target.value)
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Receipt Date
                </label>
                <input
                  type="date"
                  value={formData.receipt_date}
                  onChange={(e) =>
                    handleFieldChange("receipt_date", e.target.value)
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Input VAT
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_amount}
                      onChange={(e) =>
                        handleFieldChange("tax_amount", e.target.value)
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-7 pr-3 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                    Total Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) =>
                        handleFieldChange("total_amount", e.target.value)
                      }
                      className={`w-full bg-amber-50 dark:bg-amber-500/10 border-2 rounded-xl pl-7 pr-3 py-3 font-black text-sm text-slate-900 dark:text-amber-500 outline-none focus:border-amber-500 ${isTotalMismatched ? "border-red-500 text-red-500" : "border-amber-200 dark:border-amber-500/30"}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mismatch Warning UI */}
            {isTotalMismatched && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest shrink-0">
                <AlertTriangle size={16} /> Total Mismatch: Line items sum does
                not equal the Total Amount.
              </div>
            )}

            {/* The Accounting Brain (Routing) */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4 shrink-0">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Database size={14} /> Double-Entry Ledger Routing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                    DEBIT: Expense / Asset
                  </label>
                  <select
                    value={formData.account_category_id}
                    onChange={(e) =>
                      handleFieldChange("account_category_id", e.target.value)
                    }
                    className="w-full bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 font-bold text-xs dark:text-white outline-none focus:border-emerald-500 appearance-none"
                  >
                    <option value="" disabled>
                      Select the bucket...
                    </option>
                    {categories
                      .filter(
                        (c) =>
                          c.category === "Expenses" || c.category === "Assets",
                      )
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.category} - {cat.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest">
                    CREDIT: Payment Source
                  </label>
                  <select
                    value={formData.payment_account_id}
                    onChange={(e) =>
                      handleFieldChange("payment_account_id", e.target.value)
                    }
                    className="w-full bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 font-bold text-xs dark:text-white outline-none focus:border-red-500 appearance-none"
                  >
                    <option value="" disabled>
                      Where did the money come from?
                    </option>
                    {categories
                      .filter((c) => c.category === "Assets")
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.category} - {cat.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items Array */}
            <div className="flex-1 space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 sticky top-0 bg-white dark:bg-slate-800 py-2 z-10">
                <Package size={14} /> Line Items & Inventory Linking
              </h3>
              {formData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 p-4 space-y-3"
                >
                  <div className="flex flex-wrap sm:flex-nowrap gap-3">
                    <div className="w-full sm:flex-1 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(idx, "description", e.target.value)
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="w-20 space-y-1">
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-center dark:text-white outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="w-24 space-y-1">
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono dark:text-white outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">
                        Line Total
                      </label>
                      <input
                        readOnly
                        type="number"
                        value={item.total_price}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 font-bold outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                    <select
                      value={item.inventory_id || ""}
                      onChange={(e) =>
                        handleItemChange(idx, "inventory_id", e.target.value)
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 outline-none focus:border-amber-500"
                    >
                      <option value="">
                        -- Non-Inventory / Supplies (Do not track) --
                      </option>
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          Link to: {inv.item_name} (Database SKU:{" "}
                          {inv.item_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK LOOP MODAL (REJECTION) */}
      <AnimatePresence>
        {rejectModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[32px] shadow-2xl border border-red-200 dark:border-red-500/30 flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-500/20">
                  <MessageSquareWarning size={20} />
                </div>
                <button
                  onClick={() => setRejectModal({ isOpen: false, reason: "" })}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                Maker Feedback
              </h3>
              <p className="text-xs font-bold text-slate-500 mb-6">
                Explain why this receipt is being rejected. This note will be
                sent back to the Staff dashboard for correction.
              </p>

              <textarea
                rows="4"
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal({ ...rejectModal, reason: e.target.value })
                }
                placeholder="e.g., The photo is too blurry, or the Vendor name is incorrect."
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold dark:text-white outline-none focus:border-red-500 resize-none mb-6"
              />

              <button
                onClick={submitReject}
                disabled={isSubmitting || rejectModal.reason.length < 5}
                className="w-full py-4 bg-red-600 text-white font-black tracking-widest rounded-2xl uppercase text-xs hover:scale-[1.02] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Send Feedback & Reject"
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OcrApprovals;

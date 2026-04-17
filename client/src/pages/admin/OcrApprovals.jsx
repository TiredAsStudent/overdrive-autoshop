import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  TrendingUp,
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
} from "lucide-react";
import ocrService from "../../services/ocrService";
import inventoryService from "../../services/inventoryService";
import financeService from "../../services/financeService";

// --- UTILITY ---
const formatMoney = (val) =>
  `₱${Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// --- SUB-COMPONENT: The Summary Inbox ---
const VerificationList = ({ queue, onReview, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-4"
  >
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
          OCR Approval Queue
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Verify branch expenses and parts before they hit the financial ledger.
        </p>
      </div>
    </div>

    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
      {isLoading ? (
        <div className="p-20 flex justify-center">
          <Loader2 className="animate-spin text-amber-500" size={40} />
        </div>
      ) : queue.length === 0 ? (
        <div className="p-20 flex flex-col items-center justify-center text-slate-400">
          <CheckCircle2 size={48} className="mb-4 opacity-20" />
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
                <th className="px-6 py-4 tracking-widest">AI Confidence</th>
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
                            Number(req.ai_confidence_score) > 80
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }
                        >
                          {req.ai_confidence_score}% Match
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${Number(req.ai_confidence_score) > 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${req.ai_confidence_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {formatMoney(req.total_amount)}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => onReview(req.id)}
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 mx-auto hover:opacity-90 transition-opacity"
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
  </motion.div>
);

// --- MAIN COMPONENT ---
const OcrApprovals = () => {
  const [queue, setQueue] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [accountCategories, setAccountCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [activeReqId, setActiveReqId] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [formData, setFormData] = useState(null);

  const [inflationAlert, setInflationAlert] = useState({
    show: false,
    message: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [queueData, invData, catData] = await Promise.all([
        ocrService.getPendingQueue(),
        inventoryService.getInventory(),
        financeService.getCategories(),
      ]);
      setQueue(queueData);
      setInventoryList(invData.filter((i) => i.is_active)); // Only active inventory
      setAccountCategories(catData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open the Workbench
  const loadScanDetails = async (id) => {
    setIsFetchingDetails(true);
    setError(null);
    try {
      const data = await ocrService.getScanDetails(id);
      setActiveReqId(data.id);
      setActiveImage(data.image_url);

      // Map AI data to our editable form state
      setFormData({
        vendor_name: data.vendor_name || "",
        invoice_number: data.invoice_number || "",
        receipt_date: data.receipt_date
          ? new Date(data.receipt_date).toISOString().split("T")[0]
          : "",
        total_amount: data.total_amount || 0,
        coa_account_id: data.coa_account_id || "",
        payment_account_id: "", // Admin must actively select where the money came from
        items: data.items.map((item) => ({
          id: item.id,
          inventory_id: item.inventory_id || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          unit_cost: item.unit_cost || 0,
          total_price: item.total_price || 0,
        })),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Workbench Form Handlers
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    // Auto-calculate row total if qty or unit cost changes
    if (field === "quantity" || field === "unit_cost") {
      updatedItems[index].total_price =
        Number(updatedItems[index].quantity) *
        Number(updatedItems[index].unit_cost);
    }
    setFormData({ ...formData, items: updatedItems });
  };

  // Submit Handlers
  const handleApprove = async () => {
    if (!formData.coa_account_id || !formData.payment_account_id) {
      setError(
        "Please select both the Expense Category and the Payment Source before approving.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Ensure numeric formatting for safety
      const payload = {
        ...formData,
        total_amount: Number(formData.total_amount),
        coa_account_id: Number(formData.coa_account_id),
        payment_account_id: Number(formData.payment_account_id),
        items: formData.items.map((item) => ({
          ...item,
          inventory_id: item.inventory_id ? Number(item.inventory_id) : null,
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
          total_price: Number(item.total_price),
        })),
      };

      const response = await ocrService.approveScan(activeReqId, payload);

      setActiveReqId(null);
      setFormData(null);
      await fetchData(); // Refresh Queue

      // Trigger Inflation Alert if Backend flags it
      if (response.data.inflationDetected) {
        setInflationAlert({ show: true, message: response.message });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reject this receipt? It will be deleted from the queue.",
      )
    )
      return;

    setIsSubmitting(true);
    try {
      await ocrService.rejectScan(activeReqId);
      setActiveReqId(null);
      setFormData(null);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex justify-between items-center border border-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!activeReqId ? (
          <VerificationList
            queue={queue}
            onReview={loadScanDetails}
            isLoading={isLoading || isFetchingDetails}
          />
        ) : (
          /* 2. SIDE-BY-SIDE REVIEW UI (THE WORKBENCH) */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-auto lg:h-[calc(100vh-140px)]"
          >
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <button
                onClick={() => {
                  setActiveReqId(null);
                  setFormData(null);
                }}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
              >
                <ArrowLeft size={16} /> Back to Queue
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-6 py-3 sm:py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 font-bold rounded-xl text-xs flex justify-center items-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                >
                  <XCircle size={16} /> Reject Scan
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-8 py-3 sm:py-2.5 bg-emerald-500 text-white font-black rounded-xl text-xs flex justify-center items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve & Post Ledger
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden">
              {/* LEFT PANE: GREASE-PROOF RECEIPT */}
              <div className="w-full lg:w-1/2 min-h-[300px] lg:min-h-0 bg-slate-200 dark:bg-black/40 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden relative group shrink-0 flex items-center justify-center">
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                  <ImageIcon size={12} /> Enhanced Audit Evidence
                </div>
                {/* CSS Filter for high contrast reading */}
                <img
                  src={activeImage}
                  className="max-w-full max-h-full object-contain grayscale contrast-150 brightness-75 transition-all duration-700 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100"
                  alt="Receipt Audit Trail"
                />
                <div className="absolute bottom-4 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/80 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                    Showing Original Image
                  </span>
                </div>
              </div>

              {/* RIGHT PANE: EXTRACTED DATA REVIEW */}
              <div className="w-full lg:w-1/2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 overflow-y-auto shadow-sm">
                {/* Section: Core Info */}
                <section className="space-y-4 mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Receipt Header
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Vendor Name
                      </label>
                      <input
                        type="text"
                        value={formData.vendor_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vendor_name: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Invoice # (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            invoice_number: e.target.value,
                          })
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
                        value={formData.receipt_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            receipt_date: e.target.value,
                          })
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
                        value={formData.total_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_amount: e.target.value,
                          })
                        }
                        className="w-full bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 font-black text-sm text-slate-900 dark:text-amber-500 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </section>

                {/* Section: Accounting Routing */}
                <section className="space-y-4 mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} /> Accounting Ledger Routing
                  </h3>
                  <div className="grid grid-cols-1 gap-4 p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <span className="text-emerald-500 font-black">
                          DEBIT:
                        </span>{" "}
                        Select Expense Category
                      </label>
                      <select
                        value={formData.coa_account_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            coa_account_id: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="" disabled>
                          Select Expense Account...
                        </option>
                        {accountCategories.map((cat) => (
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
                        value={formData.payment_account_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_account_id: e.target.value,
                          })
                        }
                        className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="" disabled>
                          Paid Using...
                        </option>
                        {accountCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Section: Line Items & Inventory Linking */}
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Package size={14} /> AI Line Items & Inventory Linking
                  </h3>
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">
                              AI Description
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none"
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
                                handleItemChange(
                                  idx,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-center dark:text-white outline-none"
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
                                handleItemChange(
                                  idx,
                                  "unit_cost",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-center dark:text-white outline-none"
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
                              handleItemChange(
                                idx,
                                "inventory_id",
                                e.target.value,
                              )
                            }
                            className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="">
                              Do not track in inventory (e.g. Utility Bill)
                            </option>
                            {inventoryList.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.item_name} (Current Cost: ₱{inv.unit_cost})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    {formData.items.length === 0 && (
                      <p className="text-xs text-slate-500 italic py-4 text-center">
                        No line items extracted.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. INFLATION ALERT MODAL */}
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
              className="relative bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                Inflation Detected
              </h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">
                {inflationAlert.message}
              </p>
              <button
                onClick={() => setInflationAlert({ show: false, message: "" })}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform"
              >
                Acknowledge & Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OcrApprovals;

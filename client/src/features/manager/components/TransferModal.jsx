import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  Package,
  MapPin,
  Calculator,
  FileText,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";

const TransferModal = ({ isOpen, onClose, onSubmit, branches }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [catalogItems, setCatalogItems] = useState([]);
  const [branchStock, setBranchStock] = useState({});
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const [formData, setFormData] = useState({
    item_id: "",
    source_branch_id: "",
    destination_branch_id: "",
    quantity: "",
    reason: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        item_id: "",
        source_branch_id: "",
        destination_branch_id: "",
        quantity: "",
        reason: "",
      });
      setValidationError("");
      setBranchStock({});

      inventoryService
        .getInventoryCatalog(1, 1000, "", "all", "all", "active")
        .then((res) => setCatalogItems(res.data || []))
        .catch((err) => console.error("Failed to load catalog", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.item_id) {
      setIsLoadingStock(true);
      inventoryService
        .getBranchBreakdown(formData.item_id)
        .then((res) => {
          const stockMap = {};
          res.data.forEach((b) => (stockMap[b.branch_id] = b.quantity));
          setBranchStock(stockMap);
        })
        .catch(() => setBranchStock({}))
        .finally(() => setIsLoadingStock(false));
    } else {
      setBranchStock({});
    }
  }, [formData.item_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (
      parseInt(formData.source_branch_id, 10) ===
      parseInt(formData.destination_branch_id, 10)
    ) {
      setValidationError("Source and Destination branches must be different.");
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    const availableSourceStock = branchStock[formData.source_branch_id] || 0;

    if (qty <= 0) {
      setValidationError("Transfer quantity must be greater than zero.");
      return;
    }

    if (qty > availableSourceStock) {
      setValidationError(
        `Insufficient stock. You are trying to transfer ${qty}, but the source branch only has ${availableSourceStock} available.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitting(false);
    } catch (error) {
      setValidationError(error.message || "Failed to execute transfer.");
      setIsSubmitting(false);
    }
  };

  // Pre-calculated values for UI
  const selectedItemData = catalogItems.find(
    (i) => i.id === parseInt(formData.item_id),
  );

  const transferQty = parseInt(formData.quantity, 10) || 0;

  const availableSourceStock = formData.source_branch_id
    ? branchStock[formData.source_branch_id] || 0
    : "...";

  const availableDestStock = formData.destination_branch_id
    ? branchStock[formData.destination_branch_id] || 0
    : "...";

  const financialImpact =
    selectedItemData && formData.quantity
      ? (
          parseInt(formData.quantity) * parseFloat(selectedItemData.unit_cost)
        ).toLocaleString(undefined, { minimumFractionDigits: 2 })
      : "0.00";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Execute Stock Transfer
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Inter-Branch Logistics Engine
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

            {/* MODAL BODY */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="transferForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* SECTION 1: ASSET SELECTION */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Package size={14} /> Asset Identification
                  </h3>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Master Inventory Item{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="item_id"
                      value={formData.item_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-shadow shadow-sm"
                    >
                      <option value="">-- Select an Item to Transfer --</option>
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          [{item.sku}] {item.item_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* SECTION 2: LOGISTICS ROUTING */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                    <MapPin size={14} /> Logistics Routing
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative">
                    {/* Visual Connector Arrow (Desktop only) */}
                    <div className="hidden sm:flex absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-emerald-500 shadow-sm">
                      <ArrowRightLeft size={14} />
                    </div>

                    {/* SOURCE BRANCH AREA */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          Extract From <span className="text-red-500">*</span>
                        </span>
                        {!isLoadingStock &&
                          formData.item_id &&
                          formData.source_branch_id && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400">
                                Stock:
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                  availableSourceStock > 0
                                    ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                }`}
                              >
                                {availableSourceStock}
                              </span>
                              {transferQty > 0 &&
                                availableSourceStock !== "..." && (
                                  <>
                                    <span className="text-[9px] text-slate-400">
                                      →
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                        availableSourceStock - transferQty < 0
                                          ? "bg-red-50 text-red-600"
                                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                      }`}
                                    >
                                      {availableSourceStock - transferQty}
                                    </span>
                                  </>
                                )}
                            </div>
                          )}
                      </label>
                      <select
                        required
                        name="source_branch_id"
                        value={formData.source_branch_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Origin Location --</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DESTINATION BRANCH AREA */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          Deposit To <span className="text-red-500">*</span>
                        </span>
                        {!isLoadingStock &&
                          formData.item_id &&
                          formData.destination_branch_id && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400">
                                Stock:
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                {availableDestStock}
                              </span>
                              {transferQty > 0 &&
                                availableDestStock !== "..." && (
                                  <>
                                    <span className="text-[9px] text-slate-400">
                                      →
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                      {availableDestStock + transferQty}
                                    </span>
                                  </>
                                )}
                            </div>
                          )}
                      </label>
                      <select
                        required
                        name="destination_branch_id"
                        value={formData.destination_branch_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Target Location --</option>
                        {branches.map((b) => (
                          <option
                            key={b.id}
                            value={b.id}
                            disabled={
                              b.id.toString() === formData.source_branch_id
                            }
                          >
                            {b.branch_name}{" "}
                            {b.id.toString() === formData.source_branch_id
                              ? "(Source)"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* SECTION 3: DETAILS & VALUATION */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
                    <FileText size={14} /> Transfer Details & Valuation
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Transfer Quantity{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="e.g., 50"
                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="p-4 rounded-xl border bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-400 flex items-center justify-between h-[46px] sm:h-[48px] shadow-sm">
                        <div className="flex items-center gap-2">
                          <Calculator size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
                            Asset Value Transferred
                          </span>
                        </div>
                        <span className="text-sm font-black font-mono">
                          ₱{financialImpact}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Logistics Notes / Reason{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows="2"
                      placeholder="e.g., Redistributing excess brake pads to cover expected weekend shortage."
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none shadow-sm"
                    />
                  </div>
                </section>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="transferForm"
                disabled={isSubmitting}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRightLeft size={16} />
                )}
                Execute Transfer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;

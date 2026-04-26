import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  ArrowLeft,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  Wrench,
  Package,
  Printer,
  RefreshCw,
  Box,
  Calculator,
} from "lucide-react";

import staffEstimateService from "../../services/staffEstimate.service";
import staffJobCardService from "../../services/staffJobCard.service";
import workshopService from "../../services/workshopService";
import { generateEstimatePDF } from "../../utils/generateEstimatePDF";

// --- REUSABLE BADGE ---
const StatusBadge = ({ status }) => {
  const styles = {
    DRAFT:
      "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300 border-slate-200 dark:border-white/10",
    APPROVED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    CANCELLED:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };
  return (
    <span
      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${styles[status] || styles.DRAFT}`}
    >
      {status === "APPROVED" ? "SALES ORDER (ACTIVE)" : status}
    </span>
  );
};

const Estimates = () => {
  // View States
  const [view, setView] = useState("LIST"); // 'LIST' | 'BUILDER'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [estimates, setEstimates] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({
    vat_percentage: 12,
    markup_percentage: 25,
  });

  // Modal & Action States
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Builder States
  const [selectedJobId, setSelectedJobId] = useState("");
  const [lineItems, setLineItems] = useState([]);

  // --- 1. DATA INITIALIZATION ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [estData, jobsData, invData, srvData, sysSettings] =
        await Promise.all([
          staffEstimateService.getEstimates(),
          staffJobCardService.getBoard(),
          workshopService.getInventory(),
          workshopService.getServices(),
          workshopService.getSystemSettings(),
        ]);
      setEstimates(estData);
      setActiveJobs(
        jobsData.filter((j) => j.status !== "DONE" && j.status !== "CANCELLED"),
      );
      setInventory(invData);
      setServices(srvData);
      setSettings(sysSettings);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- 2. BUILDER MATH ENGINE ---
  const markupMultiplier = 1 + parseFloat(settings.markup_percentage) / 100;
  const taxRate = parseFloat(settings.vat_percentage) / 100;

  const handleAddServicePackage = (serviceName) => {
    const service = services.find((s) => s.name === serviceName);
    if (!service) return;

    const newRows = [
      {
        id: crypto.randomUUID(),
        type: "LABOR",
        description: `LABOR: ${service.name}`,
        quantity: 1,
        base_cost: 0,
        unit_cost: parseFloat(service.labor_fee).toFixed(2),
        is_labor: true,
      },
    ];

    if (service.parts && service.parts.length > 0) {
      service.parts.forEach((partLink) => {
        const invItem = inventory.find((i) => i.id === partLink.inventory_id);
        if (invItem) {
          newRows.push({
            id: crypto.randomUUID(),
            type: "PART",
            inventory_id: invItem.id,
            description: invItem.item_name,
            quantity: partLink.quantity_required || 1, // Enforces integer
            base_cost: parseFloat(invItem.unit_cost), // COGS Tracking
            unit_cost: (
              parseFloat(invItem.unit_cost) * markupMultiplier
            ).toFixed(2),
            available_stock: invItem.available_quantity,
            is_labor: false,
          });
        }
      });
    }
    setLineItems([...lineItems, ...newRows]);
  };

  const handleItemChange = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item };

        if (field === "quantity") {
          // STRICT INTEGER ENFORCEMENT for Inventory DB
          updated.quantity = Math.max(1, parseInt(value, 10) || 1);
        } else {
          updated[field] = value;
        }

        // Auto-fill Part details if dropdown changes
        if (field === "inventory_id") {
          const part = inventory.find((i) => i.id === parseInt(value));
          if (part) {
            updated.description = part.item_name;
            updated.base_cost = parseFloat(part.unit_cost);
            updated.unit_cost = (
              parseFloat(part.unit_cost) * markupMultiplier
            ).toFixed(2);
            updated.available_stock = part.available_quantity;
          }
        }
        return updated;
      }),
    );
  };

  const handleAddBlankPart = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        type: "PART",
        inventory_id: "",
        description: "",
        quantity: 1,
        base_cost: 0,
        unit_cost: 0,
        available_stock: null,
        is_labor: false,
      },
    ]);
  };

  const { subtotal, taxAmount, grandTotal } = useMemo(() => {
    const sub = lineItems.reduce(
      (sum, item) =>
        sum + parseFloat(item.unit_cost || 0) * parseFloat(item.quantity || 0),
      0,
    );
    const tax = sub * taxRate;
    return { subtotal: sub, taxAmount: tax, grandTotal: sub + tax };
  }, [lineItems, taxRate]);

  // --- 3. SUBMISSION TRIGGERS ---
  const handleSubmitEstimate = async () => {
    if (!selectedJobId)
      return setError("Please link this estimate to an active Job Card.");

    const job = activeJobs.find((j) => j.id === parseInt(selectedJobId));
    const payload = {
      job_card_id: job.id,
      customer_id: job.customer_id,
      items: lineItems.map((item) => ({
        inventory_id: item.inventory_id || null,
        description: item.description,
        quantity: parseInt(item.quantity, 10), // Final DB safeguard
        base_cost: parseFloat(item.base_cost || 0),
        unit_cost: parseFloat(item.unit_cost),
        is_labor: item.is_labor,
      })),
    };

    setIsSubmitting(true);
    try {
      await staffEstimateService.createEstimate(payload);
      await loadData();
      setView("LIST");
      setLineItems([]);
      setSelectedJobId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchDetails = async (id) => {
    try {
      const data = await staffEstimateService.getEstimateDetails(id);
      setSelectedEstimate(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleConvertToSalesOrder = async (id) => {
    setIsConverting(true);
    try {
      await staffEstimateService.convertEstimate(id);
      await loadData();
      setSelectedEstimate(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  if (isLoading && estimates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
          Syncing Financials...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto py-6 px-4 animate-in fade-in duration-500 relative">
      {/* ERROR ALERTS */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase flex items-center gap-3 border border-red-200 shadow-sm sticky top-0 z-50"
          >
            <AlertCircle size={18} className="shrink-0" /> {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto underline hover:text-red-800"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================
          VIEW 1: LIST OF QUOTES 
          ================================== */}
      {view === "LIST" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                Estimates & Quotes
              </h1>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Manage non-posting proposals for customer negotiation.
              </p>
            </div>
            <button
              onClick={() => setView("BUILDER")}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105"
            >
              <Plus size={18} /> Draft New Quote
            </button>
          </div>

          {estimates.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px]">
              <FileText
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
              />
              <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                No Active Quotes
              </p>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Draft an estimate to prepare a vehicle for the bay.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estimates.map((est) => (
                <div
                  key={est.id}
                  className="p-6 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-black dark:text-white tracking-tight">
                        {est.reference_number}
                      </h3>
                      <StatusBadge status={est.status} />
                    </div>
                    <div className="py-4 border-y border-slate-100 dark:border-white/5 mb-4">
                      <p className="text-sm font-black text-slate-700 dark:text-gray-300">
                        {est.customer_name}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">
                        Plate:{" "}
                        <span className="text-amber-500">
                          {est.plate_number}
                        </span>
                      </p>
                      <div className="mt-4 flex items-end justify-between">
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                          ₱{parseFloat(est.total_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFetchDetails(est.id)}
                    className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 group-hover:bg-amber-500 group-hover:text-slate-900 group-hover:border-amber-500 transition-colors shadow-sm"
                  >
                    <FileText size={16} /> View & Process
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================
          VIEW 2: THE QUOTE BUILDER 
          ================================== */}
      {view === "BUILDER" && (
        <div className="space-y-6">
          <button
            onClick={() => setView("LIST")}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Discard Draft & Return
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic flex items-center gap-3">
                <Calculator className="text-amber-500" size={32} /> Estimate
                Builder
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">
                Prices locked to current Inventory & Admin Settings
              </p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-3">
                    1. Target Vehicle (From Kanban)
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full p-4 text-sm font-bold bg-white dark:bg-slate-900 border rounded-xl dark:text-white outline-none focus:border-amber-500 shadow-sm cursor-pointer"
                  >
                    <option value="">-- Link to an active job --</option>
                    {activeJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.plate_number} • {job.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-6 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                  <label className="text-[10px] uppercase font-black tracking-widest text-amber-600 dark:text-amber-500 block mb-3">
                    2. Quick-Add Service Package
                  </label>
                  <select
                    onChange={(e) => handleAddServicePackage(e.target.value)}
                    className="w-full p-4 text-sm font-bold bg-white dark:bg-slate-900 border border-amber-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:border-amber-500 shadow-sm cursor-pointer text-amber-900 dark:text-amber-100"
                  >
                    <option value="">-- Explode Combo Meal --</option>
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.name}>
                        {srv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-10">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/10 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <Box size={16} className="text-amber-500" /> Line Items
                  </h3>
                  <button
                    onClick={handleAddBlankPart}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-all shadow-md"
                  >
                    + Add Single Part
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.length === 0 && (
                    <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                      Select a package or add a part to begin quoting.
                    </div>
                  )}
                  <AnimatePresence>
                    {lineItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-12 gap-4 items-end p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5"
                      >
                        <div className="col-span-12 md:col-span-5">
                          <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-2">
                            {item.is_labor
                              ? "Labor Description"
                              : "Inventory Part"}
                          </label>
                          {item.is_labor ? (
                            <div className="flex items-center gap-2 w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                              <Wrench
                                size={16}
                                className="text-blue-500 shrink-0"
                              />
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                                {item.description}
                              </span>
                            </div>
                          ) : (
                            <select
                              value={item.inventory_id}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "inventory_id",
                                  e.target.value,
                                )
                              }
                              className="w-full p-3 text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:border-amber-500"
                            >
                              <option value="">-- Select DB Item --</option>
                              {inventory.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.item_name} (Avail:{" "}
                                  {inv.available_quantity})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-2">
                            Qty (Int)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="w-full p-3 text-sm font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3">
                          <label className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-2">
                            Retail Price (₱)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "unit_cost",
                                e.target.value,
                              )
                            }
                            className="w-full p-3 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end pb-1">
                          <button
                            onClick={() =>
                              setLineItems(
                                lineItems.filter((i) => i.id !== item.id),
                              )
                            }
                            className="p-3 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* Line Total Readout */}
                        <div className="col-span-12 flex justify-end">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            Line Total:{" "}
                            <span className="text-sm font-mono text-slate-900 dark:text-white">
                              ₱
                              {(
                                item.quantity * item.unit_cost
                              ).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Pricing Footer */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Calculator size={150} />
                </div>

                <div className="w-full md:w-auto space-y-2 z-10">
                  <div className="flex justify-between items-center gap-8 text-sm font-bold text-slate-400">
                    <span className="uppercase tracking-widest text-[10px]">
                      Subtotal
                    </span>
                    <span className="font-mono">
                      ₱{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-8 text-sm font-bold text-slate-400">
                    <span className="uppercase tracking-widest text-[10px]">
                      VAT ({settings.vat_percentage}%)
                    </span>
                    <span className="font-mono text-blue-400">
                      +₱{taxAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 mt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                      Grand Total Quote
                    </p>
                    <p className="text-5xl font-black italic tracking-tighter">
                      ₱{grandTotal.toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSubmitEstimate}
                  disabled={
                    isSubmitting || lineItems.length === 0 || !selectedJobId
                  }
                  className="w-full md:w-auto px-10 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 transition-all z-10"
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}{" "}
                  Post Final Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          VIEW 3: THE READ-ONLY DETAIL MODAL 
          ================================== */}
      <AnimatePresence>
        {selectedEstimate && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-white/10"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-start bg-slate-50 dark:bg-black/20">
                <div>
                  <h3 className="text-3xl font-black dark:text-white tracking-tight italic uppercase">
                    {selectedEstimate.reference_number}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
                    {selectedEstimate.plate_number} •{" "}
                    {selectedEstimate.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEstimate(null)}
                  className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 rounded-full dark:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="p-4">Type</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-center">Qty</th>
                        <th className="p-4 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y divide-slate-100 dark:divide-white/5">
                      {selectedEstimate.items.map((item, i) => (
                        <tr
                          key={i}
                          className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            {item.is_labor ? (
                              <span className="inline-flex p-2 bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">
                                <Wrench size={16} />
                              </span>
                            ) : (
                              <span className="inline-flex p-2 bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
                                <Package size={16} />
                              </span>
                            )}
                          </td>
                          <td className="p-4 dark:text-white">
                            {item.description}
                          </td>
                          <td className="p-4 text-center dark:text-white font-mono">
                            {item.quantity}
                          </td>
                          <td className="p-4 text-right dark:text-white font-mono">
                            ₱{parseFloat(item.total_price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">
                    Quote Valuation (VAT Inc.)
                  </p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    ₱
                    {parseFloat(selectedEstimate.total_amount).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button
                    onClick={() => generateEstimatePDF(selectedEstimate)}
                    className="flex-1 md:flex-none px-6 py-4 bg-slate-800 text-white border border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-lg"
                  >
                    <Printer size={18} /> Print PDF
                  </button>
                  {selectedEstimate.status === "DRAFT" && (
                    <button
                      onClick={() =>
                        handleConvertToSalesOrder(selectedEstimate.id)
                      }
                      disabled={isConverting}
                      className="flex-1 md:flex-none px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                    >
                      {isConverting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <RefreshCw size={18} />
                      )}{" "}
                      Convert to Sales Order
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Estimates;

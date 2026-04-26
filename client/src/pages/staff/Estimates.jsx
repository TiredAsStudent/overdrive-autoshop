import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  ArrowLeft,
  Trash2,
  Calculator,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  Wrench,
  Package,
  Printer,
  RefreshCw,
} from "lucide-react";

import staffEstimateService from "../../services/staffEstimate.service";
import staffJobCardService from "../../services/staffJobCard.service";
import workshopService from "../../services/workshopService";
import { generateEstimatePDF } from "../../utils/generateEstimatePDF";

// ==========================================
// 1. DYNAMIC STATUS BADGE
// ==========================================
const StatusBadge = ({ status }) => {
  const styles = {
    DRAFT:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-gray-300",
    APPROVED:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
    CANCELLED:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400",
  };
  return (
    <span
      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${styles[status] || styles.DRAFT}`}
    >
      {status === "APPROVED" ? "CONVERTED (SALES ORDER)" : status}
    </span>
  );
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
const Estimates = () => {
  const [view, setView] = useState("LIST");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  // Data Stores
  const [estimates, setEstimates] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({
    vat_percentage: 12,
    markup_percentage: 25,
  });

  // Builder State
  const [selectedJobId, setSelectedJobId] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. INITIAL DATA LOAD ---
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
      setActiveJobs(jobsData.filter((j) => j.status !== "DONE"));
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

  // --- 2. BUILDER & MATH LOGIC ---
  const markupMultiplier = 1 + parseFloat(settings.markup_percentage) / 100;
  const taxRate = parseFloat(settings.vat_percentage) / 100;

  const handleAddServicePackage = (serviceName) => {
    const service = services.find((s) => s.name === serviceName);
    if (!service) return;

    const newRows = [];
    newRows.push({
      id: crypto.randomUUID(),
      type: "LABOR",
      description: `LABOR: ${service.name}`,
      quantity: 1,
      unit_cost: parseFloat(service.labor_fee).toFixed(2),
      is_labor: true,
    });

    if (service.parts && service.parts.length > 0) {
      service.parts.forEach((partLink) => {
        const invItem = inventory.find((i) => i.id === partLink.inventory_id);
        if (invItem) {
          newRows.push({
            id: crypto.randomUUID(),
            type: "PART",
            inventory_id: invItem.id,
            description: invItem.item_name,
            quantity: partLink.quantity,
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

  const handleAddItem = (type) => {
    if (type === "LABOR") return;
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        type: "PART",
        inventory_id: "",
        description: "",
        quantity: 1,
        unit_cost: 0,
        available_stock: null,
        is_labor: false,
      },
    ]);
  };

  const handleRemoveItem = (id) =>
    setLineItems(lineItems.filter((item) => item.id !== id));

  const handleItemChange = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "inventory_id") {
          const part = inventory.find((i) => i.id === parseInt(value));
          if (part) {
            updated.description = part.item_name;
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

  const { subtotal, taxAmount, grandTotal } = useMemo(() => {
    const sub = lineItems.reduce(
      (sum, item) =>
        sum + parseFloat(item.unit_cost || 0) * parseFloat(item.quantity || 0),
      0,
    );
    const tax = sub * taxRate;
    return { subtotal: sub, taxAmount: tax, grandTotal: sub + tax };
  }, [lineItems, taxRate]);

  // --- 3. API SUBMISSIONS ---
  const handleSubmitEstimate = async () => {
    if (!selectedJobId) return setError("Select a Job Card.");
    const job = activeJobs.find((j) => j.id === parseInt(selectedJobId));

    const payload = {
      job_card_id: job.id,
      customer_id: job.customer_id,
      items: lineItems.map((item) => ({
        inventory_id: item.inventory_id || null,
        description: item.description,
        quantity: parseFloat(item.quantity || 1),
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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchEstimateDetails = async (id) => {
    try {
      const data = await staffEstimateService.getEstimateDetails(id);
      setSelectedEstimate(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConvertToSalesOrder = async (id) => {
    setIsConverting(true);
    try {
      await staffEstimateService.convertEstimate(id);
      await loadData(); // Refresh list to show new status
      setSelectedEstimate(null); // Close modal
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  if (isLoading && view === "LIST" && estimates.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
          Synchronizing Financials...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto py-6 px-4 animate-in fade-in duration-500">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase flex items-center gap-2 border border-red-200"
          >
            <AlertCircle size={16} /> {error}{" "}
            <button
              onClick={() => setError(null)}
              className="ml-auto underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW 1: ESTIMATE LIST */}
      {view === "LIST" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Estimates & Quotes
              </h1>
              <p className="text-sm text-slate-500">
                Manage non-posting proposals.
              </p>
            </div>
            <button
              onClick={() => setView("BUILDER")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all hover:scale-105"
            >
              <Plus size={16} /> Create New Quote
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estimates.map((est) => (
              <div
                key={est.id}
                className="p-6 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm hover:border-amber-400 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-black dark:text-white">
                    {est.reference_number}
                  </h3>
                  <StatusBadge status={est.status} />
                </div>
                <div className="py-4 border-y border-slate-100 dark:border-white/5 mb-4">
                  <p className="text-sm font-medium dark:text-gray-300">
                    {est.customer_name}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                    {est.plate_number}
                  </p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black dark:text-white">
                      ₱{parseFloat(est.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => fetchEstimateDetails(est.id)}
                  className="w-full py-3 bg-slate-100 dark:bg-white/5 dark:text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-200"
                >
                  <FileText size={14} /> View Record & Process
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: ESTIMATE BUILDER */}
      {view === "BUILDER" && (
        <div className="space-y-6">
          <button
            onClick={() => setView("LIST")}
            className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to List
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 lg:p-8 border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-xl font-black dark:text-white uppercase tracking-tight mb-8">
              Draft New Estimate
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-2">
                  Target Vehicle (Kanban)
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full p-3 text-sm font-bold bg-white dark:bg-slate-900 border rounded-xl dark:text-white outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose active job --</option>
                  {activeJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.plate_number} - {job.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-2">
                  Add Service Package
                </label>
                <select
                  onChange={(e) => handleAddServicePackage(e.target.value)}
                  className="w-full p-3 text-sm font-bold bg-white dark:bg-slate-900 border rounded-xl dark:text-white outline-none focus:border-amber-500"
                >
                  <option value="">-- Add Labor + Linked Parts --</option>
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.name}>
                      {srv.name} (₱{parseFloat(srv.labor_fee).toLocaleString()}{" "}
                      Labor)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase text-slate-700 dark:text-gray-300">
                  Line Items
                </h3>
                <button
                  onClick={() => handleAddItem("PART")}
                  className="text-[10px] font-black uppercase px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  + Add Custom Part
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5"
                  >
                    <div className="col-span-12 md:col-span-5">
                      <label className="text-[9px] uppercase font-black text-slate-400 block mb-1.5">
                        {item.is_labor ? "Labor Description" : "Inventory Part"}
                      </label>
                      {item.is_labor ? (
                        <input
                          type="text"
                          value={item.description}
                          readOnly
                          className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-lg dark:text-slate-400"
                        />
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
                          className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-lg dark:text-white outline-none focus:border-amber-500"
                        >
                          <option value="">-- Select --</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.item_name} (Stock: {inv.available_quantity})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="text-[9px] uppercase font-black text-slate-400 block mb-1.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(item.id, "quantity", e.target.value)
                        }
                        className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-lg dark:text-white outline-none"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="text-[9px] uppercase font-black text-slate-400 block mb-1.5">
                        Unit Price (₱)
                      </label>
                      <input
                        type="number"
                        value={item.unit_cost}
                        onChange={(e) =>
                          handleItemChange(item.id, "unit_cost", e.target.value)
                        }
                        className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border rounded-lg dark:text-white outline-none"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-2 flex justify-end pb-1">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-white/5 pt-6 flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="text-[10px] text-slate-500 space-y-1">
                <p>
                  System VAT:{" "}
                  <strong className="dark:text-white">
                    {settings.vat_percentage}%
                  </strong>
                </p>
                <p>
                  OCR Markup:{" "}
                  <strong className="dark:text-white">
                    {settings.markup_percentage}%
                  </strong>
                </p>
              </div>
              <div className="w-full md:w-72 space-y-2 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="flex justify-between text-sm font-bold dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold dark:text-gray-400">
                  <span>VAT</span>
                  <span>₱{taxAmount.toLocaleString()}</span>
                </div>
                <div className="border-t dark:border-white/10 pt-2 flex justify-between items-center">
                  <span className="text-sm font-black uppercase dark:text-white">
                    Total
                  </span>
                  <span className="text-2xl font-black text-amber-500">
                    ₱{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmitEstimate}
                disabled={
                  isSubmitting || lineItems.length === 0 || !selectedJobId
                }
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}{" "}
                Save Final Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL WITH PDF & CONVERSION */}
      <AnimatePresence>
        {selectedEstimate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 dark:bg-white/5 p-6 flex justify-between items-center border-b dark:border-white/10">
                <div>
                  <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">
                    {selectedEstimate.reference_number}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {selectedEstimate.customer_name} |{" "}
                    {selectedEstimate.plate_number}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEstimate(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full dark:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th>Type</th>
                      <th>Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold">
                    {selectedEstimate.items.map((item, i) => (
                      <tr
                        key={i}
                        className="bg-slate-50 dark:bg-white/5 rounded-xl"
                      >
                        <td className="p-3 first:rounded-l-xl">
                          {item.is_labor ? (
                            <Wrench size={14} className="text-blue-400" />
                          ) : (
                            <Package size={14} className="text-amber-400" />
                          )}
                        </td>
                        <td className="p-3 dark:text-white">
                          {item.description}
                        </td>
                        <td className="p-3 text-center dark:text-white">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right dark:text-white">
                          ₱{parseFloat(item.unit_cost).toLocaleString()}
                        </td>
                        <td className="p-3 text-right last:rounded-r-xl dark:text-white">
                          ₱{parseFloat(item.total_price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ACTION FOOTER */}
              <div className="p-6 bg-slate-900 dark:bg-black/60 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-white text-center md:text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Total Quote Amount
                  </p>
                  <p className="text-3xl font-black">
                    ₱
                    {parseFloat(selectedEstimate.total_amount).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => generateEstimatePDF(selectedEstimate)}
                    className="px-6 py-3 bg-slate-800 text-white border border-slate-700 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-colors"
                  >
                    <Printer size={16} /> Print PDF
                  </button>

                  {selectedEstimate.status === "DRAFT" && (
                    <button
                      onClick={() =>
                        handleConvertToSalesOrder(selectedEstimate.id)
                      }
                      disabled={isConverting}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {isConverting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
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

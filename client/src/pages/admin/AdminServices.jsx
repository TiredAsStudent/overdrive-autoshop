import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Calculator,
  ShieldCheck,
  Wrench,
  Search,
  X,
  Loader2,
  Save,
} from "lucide-react";
import workshopService from "../../services/workshopService";

const AdminServices = () => {
  // --- UI & DATA STATE ---
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]); // Needed for the dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: "",
    category: "Maintenance",
    labor_fee: 0,
    description: "",
    is_active: true,
    parts: [], // Array of { inventory_id, quantity_required }
  });

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both Services and Inventory simultaneously
      const [servicesData, inventoryData] = await Promise.all([
        workshopService.getServices(),
        workshopService.getInventory(),
      ]);
      setServices(servicesData);
      setInventory(inventoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setModalMode("CREATE");
    setFormData({
      name: "",
      category: "Maintenance",
      labor_fee: 0,
      description: "",
      is_active: true,
      parts: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setModalMode("EDIT");
    setEditingId(service.id);
    setFormData({
      name: service.name,
      category: service.category,
      labor_fee: service.labor_fee,
      description: service.description || "",
      is_active: service.is_active,
      parts: service.parts.map((p) => ({
        inventory_id: p.inventory_id,
        quantity_required: p.quantity,
      })),
    });
    setIsModalOpen(true);
  };

  // --- PARTS ARRAY MANAGEMENT ---
  const addPart = () => {
    setFormData({
      ...formData,
      parts: [...formData.parts, { inventory_id: "", quantity_required: 1 }],
    });
  };

  const updatePart = (index, field, value) => {
    const newParts = [...formData.parts];
    newParts[index][field] = value;
    setFormData({ ...formData, parts: newParts });
  };

  const removePart = (index) => {
    const newParts = formData.parts.filter((_, i) => i !== index);
    setFormData({ ...formData, parts: newParts });
  };

  // --- LIVE PREVIEW CALCULATOR (Mimics Backend Settings) ---
  const calculatePreview = () => {
    const GLOBAL_MARKUP = 0.25; // 25%
    const GLOBAL_TAX = 0.12; // 12%

    // Sum up the unit costs of selected inventory items
    const partsBaseCost = formData.parts.reduce((sum, p) => {
      const item = inventory.find((i) => i.id === parseInt(p.inventory_id));
      const cost = item ? parseFloat(item.unit_cost) : 0;
      const qty = parseFloat(p.quantity_required) || 0;
      return sum + cost * qty;
    }, 0);

    const partsRetail = partsBaseCost + partsBaseCost * GLOBAL_MARKUP;
    const labor = parseFloat(formData.labor_fee) || 0;
    const subtotal = partsRetail + labor;
    const tax = subtotal * GLOBAL_TAX;

    return {
      partsBaseCost,
      partsRetail,
      labor,
      subtotal,
      tax,
      grandTotal: subtotal + tax,
    };
  };

  const preview = calculatePreview();

  // --- SUBMIT HANDLER ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Ensure data types are correct before sending
      const payload = {
        ...formData,
        labor_fee: parseFloat(formData.labor_fee),
        parts: formData.parts
          .filter((p) => p.inventory_id !== "")
          .map((p) => ({
            inventory_id: parseInt(p.inventory_id),
            quantity_required: parseFloat(p.quantity_required),
          })),
      };

      if (modalMode === "CREATE") {
        await workshopService.createService(payload);
      } else {
        await workshopService.updateService(editingId, payload);
      }
      setIsModalOpen(false);
      await fetchData(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount) =>
    `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative min-h-screen">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex justify-between items-center border border-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. HEADER & FORMULA VISUAL */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
            The Recipe Book
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2">
            Configure standardized service packages. Prices update automatically
            when supplier costs change in the Approval Queue.
          </p>

          <div className="mt-6 p-4 bg-slate-900 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 p-4">
              <Calculator size={64} />
            </div>
            <p className="text-[10px] font-black uppercase text-amber-500 mb-2 flex items-center gap-2">
              <ShieldCheck size={12} /> Global Pricing Formula (Protected)
            </p>
            <div className="text-white font-mono text-xs overflow-x-auto pb-2 relative z-10">
              Total = ((∑ Parts Cost × Global Markup) + Labor Fee) + Tax
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 uppercase text-sm whitespace-nowrap"
        >
          <Plus size={20} /> New Combo Meal
        </button>
      </div>

      {/* 2. SERVICES GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center py-20">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ y: -4 }}
              className={`bg-white dark:bg-slate-800 rounded-3xl border ${service.is_active ? "border-slate-200 dark:border-white/10" : "border-red-200 opacity-75 grayscale-[30%]"} overflow-hidden shadow-sm flex flex-col`}
            >
              <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-start">
                <div>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {service.category} {service.is_active ? "" : " (INACTIVE)"}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                    {service.name}
                  </h3>
                </div>
                <button
                  onClick={() => openEditModal(service)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                >
                  <Edit size={18} />
                </button>
              </div>

              <div className="p-6 flex-1 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                    Recipe Ingredients
                  </p>
                  {service.parts && service.parts.length > 0 ? (
                    service.parts.map((p, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-gray-300"
                      >
                        <span className="flex items-center gap-2">
                          <Package size={14} className="text-amber-500" />{" "}
                          {p.part_name} (x{p.quantity})
                        </span>
                        <span className="font-mono text-xs opacity-60">
                          ₱{p.unit_cost} ea
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Labor only (No parts required)
                    </p>
                  )}

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-sm font-bold text-amber-600 dark:text-overdrive-yellow">
                    <span className="flex items-center gap-2">
                      <Wrench size={14} /> Fixed Labor Fee
                    </span>
                    <span>{formatMoney(service.labor_fee)}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase">
                      <ShieldCheck size={12} /> Inflation Guard Active
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Standard Retail Price
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatMoney(service.pricing_breakdown?.grand_total || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {services.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-20 text-slate-500">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">No combo meals found.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. COMBO MEAL BUILDER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
                  {modalMode === "CREATE"
                    ? "New Combo Meal Builder"
                    : "Edit Recipe"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleFormSubmit}
                className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {/* LEFT: Inputs */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                        Service Title
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Engine Overhaul"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none"
                      >
                        <option value="Maintenance">Maintenance</option>
                        <option value="Engine">Engine</option>
                        <option value="Brakes">Brakes</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Electrical">Electrical</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Parts Array */}
                  <div className="space-y-3 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                        Linked Inventory Parts
                      </label>
                      <button
                        type="button"
                        onClick={addPart}
                        className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-2 py-1 rounded transition-colors"
                      >
                        <Plus size={12} /> Add Part
                      </button>
                    </div>

                    {formData.parts.map((part, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          required
                          value={part.inventory_id}
                          onChange={(e) =>
                            updatePart(index, "inventory_id", e.target.value)
                          }
                          className="flex-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm dark:text-white focus:border-amber-500 outline-none"
                        >
                          <option value="" disabled>
                            Select Part from Inventory...
                          </option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.item_code} - {inv.item_name} (₱
                              {inv.unit_cost})
                            </option>
                          ))}
                        </select>
                        <input
                          required
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={part.quantity_required}
                          onChange={(e) =>
                            updatePart(
                              index,
                              "quantity_required",
                              e.target.value,
                            )
                          }
                          className="w-24 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-center dark:text-white focus:border-amber-500 outline-none"
                          placeholder="Qty"
                        />
                        <button
                          type="button"
                          onClick={() => removePart(index)}
                          className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {formData.parts.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-2">
                        No parts linked. This will be a Labor-Only service.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Fixed Labor Fee (Mandatory)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₱
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.labor_fee}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            labor_fee: e.target.value,
                          })
                        }
                        className="w-full bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl pl-8 pr-4 py-3 font-bold dark:text-amber-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {modalMode === "EDIT" && (
                    <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Service is Active (Visible to Staff)
                      </span>
                    </label>
                  )}
                </div>

                {/* RIGHT: Live Preview */}
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col">
                  <div className="absolute right-0 top-0 p-4 opacity-5">
                    <Calculator size={150} />
                  </div>
                  <h4 className="text-xs font-black uppercase text-amber-500 mb-6 tracking-widest relative z-10 flex items-center gap-2">
                    Live Math Preview
                  </h4>

                  <div className="space-y-4 relative z-10 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold">
                        Raw Parts Cost
                      </span>
                      <span className="font-mono">
                        {formatMoney(preview.partsBaseCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold">
                        Global Markup (25%)
                      </span>
                      <span className="text-emerald-400 font-mono">
                        +
                        {formatMoney(
                          preview.partsRetail - preview.partsBaseCost,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold text-amber-500">
                        Fixed Labor Fee
                      </span>
                      <span className="font-mono">
                        {formatMoney(preview.labor)}
                      </span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold">
                          Subtotal
                        </span>
                        <span className="font-mono">
                          {formatMoney(preview.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold">
                          VAT (12%)
                        </span>
                        <span className="text-red-400 font-mono">
                          +{formatMoney(preview.tax)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/20">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">
                        Total Customer Price
                      </p>
                      <p className="text-4xl font-black text-white italic">
                        {formatMoney(preview.grandTotal)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 py-4 bg-white text-slate-900 font-black rounded-xl uppercase text-sm hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-xl flex items-center justify-center gap-2 relative z-10"
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {modalMode === "CREATE"
                      ? "Save to Recipe Book"
                      : "Update Combo"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminServices;

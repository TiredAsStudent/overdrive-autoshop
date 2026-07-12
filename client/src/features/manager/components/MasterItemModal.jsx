import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  DollarSign,
  Loader2,
  AlertCircle,
  Percent,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";

const ITEM_CATEGORIES = [
  "Fluids",
  "Filters",
  "Brakes",
  "Engine Parts",
  "Transmission",
  "Suspension",
  "Electrical",
  "Air Conditioning",
  "Tires",
  "Consumables",
];

const MasterItemModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [systemMarkup, setSystemMarkup] = useState(0);

  const [formData, setFormData] = useState({
    sku: "",
    item_name: "",
    category: "Fluids",
    uom: "pcs",
    description: "",
    unit_cost: "",
    selling_price: "",
    default_reorder_level: 5,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (isOpen) {
        const markup = await inventoryService.getSystemMarkup();
        setSystemMarkup(markup);
      }
    };
    fetchSettings();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        sku: initialData.sku || "",
        item_name: initialData.item_name || "",
        category: initialData.category || "Fluids",
        uom: initialData.uom || "pcs",
        description: initialData.description || "",
        unit_cost: initialData.unit_cost || "",
        selling_price: initialData.selling_price || "",
        default_reorder_level: initialData.default_reorder_level ?? 5,
      });
    } else {
      setFormData({
        sku: "",
        item_name: "",
        category: "Fluids",
        uom: "pcs",
        description: "",
        unit_cost: "",
        selling_price: "",
        default_reorder_level: 5,
      });
    }
    setValidationError("");
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "sku") {
      setFormData({
        ...formData,
        [name]: value.toUpperCase().replace(/\s+/g, "-"),
      });
      return;
    }

    // Profit Markup Auto-Calculation Logic
    if (name === "unit_cost" && value !== "") {
      const cost = parseFloat(value);
      if (!isNaN(cost) && systemMarkup > 0) {
        const autoSellingPrice = cost + cost * (systemMarkup / 100);
        setFormData({
          ...formData,
          unit_cost: value,
          selling_price: autoSellingPrice.toFixed(2),
        });
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (
      parseFloat(formData.unit_cost) < 0 ||
      parseFloat(formData.selling_price) < 0
    ) {
      setValidationError("Financial values cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(error.message || "Failed to process item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4">
              <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                {initialData ? "Update Master Item" : "Register Master Item"}
              </h2>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-6 sm:px-8 pb-6 sm:pb-8 overflow-y-auto custom-scrollbar">
              {validationError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Identification */}
                <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                    <Package size={16} /> Item Identification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleChange}
                        placeholder="e.g., Premium DOT 4 Brake Fluid (1L)"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Stock Keeping Unit (SKU){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        disabled={!!initialData}
                        placeholder="e.g., BRK-FLUID-DOT4"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black tracking-widest uppercase disabled:opacity-50 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
                      >
                        {ITEM_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Unit of Measure (UOM){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="uom"
                        value={formData.uom}
                        onChange={handleChange}
                        placeholder="pcs, liters, sets"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Default Reorder Level{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        name="default_reorder_level"
                        value={formData.default_reorder_level}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Financials with Markup */}
                <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                    <Percent size={12} /> System Markup: {systemMarkup}%
                  </div>
                  <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                    <DollarSign size={16} /> Base Financials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Base Unit Cost (PHP){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        name="unit_cost"
                        value={formData.unit_cost}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Default Selling Price (PHP){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        name="selling_price"
                        value={formData.selling_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {initialData ? "Update Item Profile" : "Register Master Item"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MasterItemModal;

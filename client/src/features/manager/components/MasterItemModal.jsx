import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, DollarSign, Loader2, AlertCircle } from "lucide-react";

// Standard auto shop categories
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

const MasterItemModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({
    sku: "",
    item_name: "",
    category: "Fluids",
    unit_cost: "",
    selling_price: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-format SKU to uppercase without spaces
    if (name === "sku") {
      setFormData({
        ...formData,
        [name]: value.toUpperCase().replace(/\s+/g, "-"),
      });
      return;
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
      // Reset form on success
      setFormData({
        sku: "",
        item_name: "",
        category: "Fluids",
        unit_cost: "",
        selling_price: "",
      });
    } catch (error) {
      setValidationError(error.message || "Failed to register item.");
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
                Register Master Item
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
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
                        placeholder="e.g., BRK-FLUID-DOT4"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black tracking-widest text-slate-900 dark:text-white uppercase focus:outline-none focus:border-amber-500 focus:ring-1"
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
                      >
                        {ITEM_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                    <DollarSign size={16} /> Base Financials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  Register Master Item
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

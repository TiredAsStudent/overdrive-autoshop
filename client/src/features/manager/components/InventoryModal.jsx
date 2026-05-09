import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Loader2,
  PackageSearch,
  Tag,
  TrendingUp,
  AlertTriangle,
  Calculator,
} from "lucide-react";

const CATEGORIES = [
  "Fluids",
  "Filters",
  "Brakes",
  "Underchassis",
  "Electrical",
  "Engine",
  "Accessories",
];

const InventoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  systemMarkup = 20,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    item_name: "",
    category: "Fluids",
    unit_cost: "",
    selling_price: "",
    initial_reorder_point: 5,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        sku: editData.sku,
        item_name: editData.item_name,
        category: editData.category,
        unit_cost: editData.unit_cost,
        selling_price: editData.selling_price,
        initial_reorder_point: editData.reorder_point || 5,
      });
    } else {
      setFormData({
        sku: "",
        item_name: "",
        category: "Fluids",
        unit_cost: "",
        selling_price: "",
        initial_reorder_point: 5,
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-Markup Dynamic Calculation
    if (name === "unit_cost" && !editData) {
      const cost = parseFloat(value) || 0;
      const markupMultiplier = 1 + systemMarkup / 100;
      const suggestedPrice = (cost * markupMultiplier).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        unit_cost: value,
        selling_price: suggestedPrice,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        unit_cost: parseFloat(formData.unit_cost),
        selling_price: parseFloat(formData.selling_price),
        initial_reorder_point: parseInt(formData.initial_reorder_point, 10),
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                  <PackageSearch className="text-blue-500" size={24} />
                  {editData ? "Edit Master Part" : "Add Master Part"}
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Global Inventory Registration
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form
                id="inventoryForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      SKU / Barcode
                    </label>
                    <input
                      type="text"
                      name="sku"
                      required
                      disabled={!!editData}
                      placeholder="OIL-SYN-4L"
                      value={formData.sku}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white uppercase outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      name="item_name"
                      required
                      value={formData.item_name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                      <Tag size={12} /> Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none cursor-pointer appearance-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} /> Global Reorder Point
                    </label>

                    <input
                      type="number"
                      name="initial_reorder_point"
                      required
                      min="0"
                      value={formData.initial_reorder_point}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Unit Cost (Capital ₱)
                    </label>
                    <input
                      type="number"
                      name="unit_cost"
                      required
                      min="0"
                      step="0.01"
                      value={formData.unit_cost}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} /> Selling Price (₱)
                      </span>
                      {!editData && (
                        <span className="flex items-center gap-1 text-[8px] text-blue-500">
                          <Calculator size={10} /> {systemMarkup}% Auto-Markup
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      name="selling_price"
                      required
                      min="0"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/30 rounded-xl px-4 py-3 text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inventoryForm"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}{" "}
                Save Part
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InventoryModal;

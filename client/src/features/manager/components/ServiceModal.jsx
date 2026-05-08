import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Wrench, Receipt, Clock } from "lucide-react";

const ServiceModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    service_code: "",
    service_name: "",
    description: "",
    price: "",
    estimated_minutes: 60,
    is_vatable: true,
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          service_code: initialData.service_code,
          service_name: initialData.service_name,
          description: initialData.description || "",
          price: initialData.price,
          estimated_minutes: initialData.estimated_minutes || 60,
          is_vatable: initialData.is_vatable,
          is_active: initialData.is_active,
        });
      } else {
        setFormData({
          service_code: "",
          service_name: "",
          description: "",
          price: "",
          estimated_minutes: 60,
          is_vatable: true,
          is_active: true,
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        estimated_minutes: parseInt(formData.estimated_minutes, 10),
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
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                  <Wrench className="text-amber-500" size={24} />
                  {isEditing ? "Edit Labor Service" : "Add New Service"}
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Master Catalog & Pricing
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto p-6">
              <form
                id="serviceForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Code & Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Service Code
                    </label>
                    <input
                      type="text"
                      name="service_code"
                      required
                      disabled={isEditing}
                      placeholder="e.g. LBR-OIL-01"
                      value={formData.service_code}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none uppercase disabled:opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Service Name
                    </label>
                    <input
                      type="text"
                      name="service_name"
                      required
                      placeholder="e.g. Change Oil & Filter"
                      value={formData.service_name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    placeholder="Describe the inclusions of this labor service..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  ></textarea>
                </div>

                {/* Pricing & Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-100 dark:border-amber-500/20">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500 mb-2 flex items-center gap-1">
                      <Receipt size={12} /> Standard Labor Price (₱)
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-500 mb-2 flex items-center gap-1">
                      <Clock size={12} /> Estimated Duration (Mins)
                    </label>
                    <input
                      type="number"
                      name="estimated_minutes"
                      required
                      min="1"
                      placeholder="60"
                      value={formData.estimated_minutes}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_vatable"
                      checked={formData.is_vatable}
                      onChange={handleChange}
                      className="w-5 h-5 accent-amber-500 rounded bg-slate-100 border-slate-300"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Subject to VAT
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Calculates output tax on invoices automatically.
                      </p>
                    </div>
                  </label>

                  {isEditing && (
                    <label className="flex items-center gap-3 cursor-pointer mt-2 pt-4 border-t border-slate-200 dark:border-white/10">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="w-5 h-5 accent-emerald-500 rounded bg-slate-100 border-slate-300"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Service is Active
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                          Uncheck to remove from staff catalog without deleting
                          history.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="serviceForm"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isEditing ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ServiceModal;

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wrench, DollarSign, Loader2, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "Engine",
  "Transmission",
  "Brake System",
  "Suspension",
  "Cooling System",
  "Electrical",
  "Air Conditioning",
  "Steering",
  "Preventive Maintenance",
  "Tire Services",
  "General Repair",
];

const ServiceModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({
    service_name: "",
    category: "Preventive Maintenance",
    description: "",
    price: "",
    estimated_minutes: 60,
    is_vatable: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        service_name: initialData.service_name || "",
        category: initialData.category || "Preventive Maintenance",
        description: initialData.description || "",
        price: initialData.price || "",
        estimated_minutes: initialData.estimated_minutes || 60,
        is_vatable: initialData.is_vatable ?? true,
      });
    } else {
      setFormData({
        service_name: "",
        category: "Preventive Maintenance",
        description: "",
        price: "",
        estimated_minutes: 60,
        is_vatable: true,
      });
    }
    setValidationError("");
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (parseFloat(formData.price) < 0) {
      setValidationError("Price cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(error.message || "Failed to save service.");
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
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4">
              <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                {initialData ? "View Service Profile" : "Register Service"}
              </h2>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 overflow-y-auto custom-scrollbar">
              {validationError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="serviceForm"
                onSubmit={handleSubmit}
                className="space-y-6 sm:space-y-8"
              >
                {/* Definition Section */}
                <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                    <Wrench size={16} /> Operational Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Service Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="service_name"
                        value={formData.service_name}
                        onChange={handleChange}
                        disabled={!!initialData} // Lock name if editing (immutable BR)
                        placeholder="e.g., Standard Engine Tune-up"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Category Classification{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        disabled={!!initialData} // Lock category if editing
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={!!initialData}
                        rows="2"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial & Time Rules */}
                <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                    <DollarSign size={16} /> Base Financial Requirements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Default Labor Price (PHP){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        disabled={!!initialData}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Estimated Duration (Mins){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        name="estimated_minutes"
                        value={formData.estimated_minutes}
                        onChange={handleChange}
                        disabled={!!initialData}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="md:col-span-2 pt-2 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_vatable"
                        name="is_vatable"
                        checked={formData.is_vatable}
                        onChange={handleChange}
                        disabled={!!initialData}
                        className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
                      />
                      <label
                        htmlFor="is_vatable"
                        className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Subject to VAT (Value Added Tax)
                      </label>
                    </div>
                  </div>
                </div>

                {!initialData && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    {isSubmitting && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    Register Master Service
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ServiceModal;

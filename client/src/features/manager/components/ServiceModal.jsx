import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wrench,
  DollarSign,
  Loader2,
  AlertCircle,
  PackagePlus,
  Search,
  Activity,
} from "lucide-react";
import { serviceCatalogService } from "../../../services/manager/serviceCatalog.service";

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

  // Inventory Linkage States
  const [inventoryList, setInventoryList] = useState([]);
  const [isFetchingParts, setIsFetchingParts] = useState(false);
  const [partSearchTerm, setPartSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    service_name: "",
    category: "Preventive Maintenance",
    description: "",
    price: "",
    estimated_minutes: 60,
    commonly_used_parts: [],
    is_vatable: true,
  });

  useEffect(() => {
    if (isOpen) {
      setIsFetchingParts(true);
      serviceCatalogService
        .getActiveInventoryItems()
        .then((res) => setInventoryList(res.data || []))
        .catch(() => setInventoryList([]))
        .finally(() => setIsFetchingParts(false));
    } else {
      // Reset search when modal closes
      setPartSearchTerm("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        service_name: initialData.service_name || "",
        category: initialData.category || "Preventive Maintenance",
        description: initialData.description || "",
        price: initialData.price || "",
        estimated_minutes: initialData.estimated_minutes || 60,
        commonly_used_parts: initialData.commonly_used_parts || [],
        is_vatable: initialData.is_vatable ?? true,
      });
    } else {
      setFormData({
        service_name: "",
        category: "Preventive Maintenance",
        description: "",
        price: "",
        estimated_minutes: 60,
        commonly_used_parts: [],
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

  const handlePartToggle = (partId) => {
    const currentParts = [...formData.commonly_used_parts];
    if (currentParts.includes(partId)) {
      setFormData({
        ...formData,
        commonly_used_parts: currentParts.filter((id) => id !== partId),
      });
    } else {
      setFormData({
        ...formData,
        commonly_used_parts: [...currentParts, partId],
      });
    }
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

  const filteredParts = inventoryList.filter(
    (item) =>
      item.item_name.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(partSearchTerm.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                  {initialData ? "Update Service Profile" : "Register Service"}
                </h2>
                {initialData && (
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">
                    Code: {initialData.service_code}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1">
              {validationError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* View Service Usage Summary */}
              {initialData && (
                <div className="mb-6 p-4 bg-slate-50/50 dark:bg-black/10 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Service Usage
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {parseInt(initialData.usage_count, 10) || 0}{" "}
                        <span className="text-xs font-medium text-slate-500">
                          Transactions
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Last Transaction
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {initialData.last_used_date
                        ? new Date(
                            initialData.last_used_date,
                          ).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Never Used"}
                    </p>
                  </div>
                </div>
              )}

              <form
                id="serviceForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Operational & Financial */}
                  <div className="space-y-6">
                    <div className="bg-slate-50/50 dark:bg-black/10 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                      <h3 className="text-xs font-black uppercase text-amber-500 mb-4 tracking-widest flex items-center gap-2">
                        <Wrench size={14} /> Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                            Service Name <span className="text-red-500">*</span>
                          </label>

                          <input
                            required
                            type="text"
                            name="service_name"
                            value={formData.service_name}
                            onChange={handleChange}
                            placeholder="e.g., Standard Engine Tune-up"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                            Category <span className="text-red-500">*</span>
                          </label>

                          <select
                            required
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-black/10 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                      <h3 className="text-xs font-black uppercase text-amber-500 mb-4 tracking-widest flex items-center gap-2">
                        <DollarSign size={14} /> Financials
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                            Labor Price (PHP){" "}
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
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                            Duration (Mins){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            type="number"
                            min="1"
                            name="estimated_minutes"
                            value={formData.estimated_minutes}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
                          />
                        </div>
                        <div className="col-span-2 pt-2 flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="is_vatable"
                            name="is_vatable"
                            checked={formData.is_vatable}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <label
                            htmlFor="is_vatable"
                            className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Subject to VAT (Value Added Tax)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Inventory Linkage */}
                  <div className="bg-slate-50/50 dark:bg-black/10 p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col h-full max-h-[440px]">
                    <h3 className="text-xs font-black uppercase text-amber-500 mb-2 tracking-widest flex items-center gap-2">
                      <PackagePlus size={14} /> Commonly Used Parts
                    </h3>

                    {/* Local Quick Search Bar */}
                    <div className="relative mb-3 shrink-0">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search parts by name or SKU..."
                        value={partSearchTerm}
                        onChange={(e) => setPartSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 space-y-2">
                      {isFetchingParts ? (
                        <div className="flex flex-col items-center justify-center py-10 text-amber-500">
                          <Loader2 size={24} className="animate-spin mb-2" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Loading Catalog...
                          </p>
                        </div>
                      ) : filteredParts.length === 0 ? (
                        <p className="text-center text-[10px] text-slate-400 py-8 font-bold uppercase tracking-widest">
                          {partSearchTerm
                            ? "No matching parts found."
                            : "No active master items available."}
                        </p>
                      ) : (
                        filteredParts.map((item) => (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.commonly_used_parts.includes(item.id) ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-300"}`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.commonly_used_parts.includes(
                                item.id,
                              )}
                              onChange={() => handlePartToggle(item.id)}
                              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-bold truncate uppercase ${formData.commonly_used_parts.includes(item.id) ? "text-amber-900 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}
                              >
                                {item.item_name}
                              </p>
                              <p className="text-[9px] font-black text-slate-400 tracking-widest">
                                {item.sku}
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    {isSubmitting && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {initialData
                      ? "Update Service Profile"
                      : "Register Master Service"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ServiceModal;

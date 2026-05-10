import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Loader2,
  Building2,
  ShieldCheck,
  Mail,
  MapPin,
} from "lucide-react";

const SupplierModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplier_name: "",
    tin: "",
    contact_person: "",
    contact_info: "",
    email: "",
    address: "",
    is_vat_registered: true,
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          supplier_name: initialData.supplier_name,
          tin: initialData.tin || "",
          contact_person: initialData.contact_person || "",
          contact_info: initialData.contact_info || "",
          email: initialData.email || "",
          address: initialData.address || "",
          is_vat_registered: initialData.is_vat_registered,
          is_active: initialData.is_active,
        });
      } else {
        setFormData({
          supplier_name: "",
          tin: "",
          contact_person: "",
          contact_info: "",
          email: "",
          address: "",
          is_vat_registered: true,
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
      await onSubmit(formData);
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
                  <Building2 className="text-indigo-500" size={24} />
                  {isEditing ? "Edit Supplier Record" : "Enroll New Supplier"}
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Global Vendor Directory
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar">
              <form
                id="supplierForm"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Registered Business Name
                    </label>
                    <input
                      type="text"
                      name="supplier_name"
                      required
                      placeholder="e.g. Toyota Auto Parts Corp."
                      value={formData.supplier_name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      TIN (Tax Identification)
                    </label>
                    <input
                      type="text"
                      name="tin"
                      placeholder="XXX-XXX-XXX-000"
                      value={formData.tin}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer w-full">
                      <input
                        type="checkbox"
                        name="is_vat_registered"
                        checked={formData.is_vat_registered}
                        onChange={handleChange}
                        className="w-5 h-5 accent-indigo-500 rounded bg-slate-100 border-slate-300"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-indigo-500" />{" "}
                          VAT Registered
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                          Allows Input Tax Claims
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-5 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Representative Name
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        placeholder="e.g. Juan Dela Cruz"
                        value={formData.contact_person}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="contact_info"
                        placeholder="09XX-XXX-XXXX"
                        value={formData.contact_info}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2 relative">
                      <Mail
                        size={16}
                        className="absolute left-4 text-slate-400"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="sales@supplier.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-start gap-2 relative">
                      <MapPin
                        size={16}
                        className="absolute left-4 top-3.5 text-slate-400"
                      />
                      <textarea
                        name="address"
                        rows="2"
                        placeholder="Main Warehouse Address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="w-5 h-5 accent-emerald-500 rounded bg-slate-100 border-slate-300"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Active Supplier
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                          Uncheck to hide from Staff scanners. Historical data
                          will be preserved.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
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
                form="supplierForm"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isEditing ? "Save Changes" : "Save to Directory"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SupplierModal;

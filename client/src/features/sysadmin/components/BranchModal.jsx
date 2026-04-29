import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, FileText, Phone, Loader2 } from "lucide-react";

const BranchModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    branch_name: "",
    branch_code: "",
    address: "",
    tin: "",
    contact_number: "",
    contact_email: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        branch_name: initialData.branch_name || "",
        branch_code: initialData.branch_code || "",
        address: initialData.address || "",
        tin: initialData.tin || "",
        contact_number: initialData.contact_number || "",
        contact_email: initialData.contact_email || "",
      });
    } else {
      setFormData({
        branch_name: "",
        branch_code: "",
        address: "",
        tin: "",
        contact_number: "",
        contact_email: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-8 pb-4">
              <h2 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                {initialData ? "Edit Legal Identity" : "Register Branch"}
              </h2>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="px-8 pb-8 overflow-y-auto custom-scrollbar">
              <form
                id="branchForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* --- BASIC INFO --- */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-amber-500 mb-4 tracking-widest flex items-center gap-2">
                    <Building2 size={14} /> Basic Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Branch Name *
                      </label>
                      <input
                        required
                        type="text"
                        name="branch_name"
                        value={formData.branch_name}
                        onChange={handleChange}
                        placeholder="e.g., Overdrive Biñan"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Branch Code (Prefix) *
                      </label>
                      <input
                        required
                        type="text"
                        name="branch_code"
                        value={formData.branch_code}
                        onChange={handleChange}
                        placeholder="e.g., BIN"
                        maxLength="10"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* --- CONTACT INFO --- */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-amber-500 mb-4 tracking-widest flex items-center gap-2">
                    <Phone size={14} /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Official Email
                      </label>
                      <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* --- LEGAL & ACCOUNTING --- */}
                <div>
                  <h3 className="text-[10px] font-black uppercase text-amber-500 mb-4 tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Legal Identity
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Tax Identification Number (TIN)
                      </label>
                      <input
                        type="text"
                        name="tin"
                        value={formData.tin}
                        onChange={handleChange}
                        placeholder="xxx-xxx-xxx-xxx"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Official Legal Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none transition-colors"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {initialData ? "Update Legal Profile" : "Save New Branch"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BranchModal;

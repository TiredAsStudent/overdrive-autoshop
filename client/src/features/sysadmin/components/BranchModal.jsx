import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, MapPin, Loader2, AlertCircle } from "lucide-react";

const BranchModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({
    branch_name: "",
    branch_code: "",
    address: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        branch_name: initialData.branch_name || "",
        branch_code: initialData.branch_code || "",
        address: initialData.address || "",
      });
    } else {
      setFormData({
        branch_name: "",
        branch_code: "",
        address: "",
      });
    }
    setValidationError("");
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict constraint: Branch Code must be letters only, max 3, auto-uppercase
    if (name === "branch_code") {
      const cleanValue = value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);
      setFormData({ ...formData, [name]: cleanValue });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (formData.branch_code.length !== 3) {
      setValidationError(
        "Branch Code must be exactly 3 letters (e.g., CAB, BIN).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(
        error.message || "Failed to save branch. Please check your inputs.",
      );
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
                {initialData ? "Edit Branch Profile" : "Register Branch"}
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
                id="branchForm"
                onSubmit={handleSubmit}
                className="space-y-6 sm:space-y-8"
              >
                {/* Basic Details Section */}
                <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                    <Building2 size={16} /> Basic Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Branch Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="branch_name"
                        value={formData.branch_name}
                        onChange={handleChange}
                        placeholder="e.g., Overdrive Biñan"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Branch Code (Prefix){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="branch_code"
                        value={formData.branch_code}
                        onChange={handleChange}
                        placeholder="e.g., BIN"
                        maxLength="3"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all uppercase placeholder:font-normal placeholder:tracking-normal"
                      />
                      <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                        Must be exactly 3 letters.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                    <MapPin size={16} /> Location Profile
                  </h3>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                      Official Geographical Address{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Complete physical address used for printed documents"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none transition-all"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {initialData ? "Update Branch Profile" : "Save New Branch"}
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

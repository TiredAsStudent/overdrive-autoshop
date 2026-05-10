import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Lock, Loader2, GitMerge } from "lucide-react";

const CoaModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  accounts = [],
}) => {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "Expense",
    description: "",
    status: "Active",
    parent_id: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          account_code: initialData.account_code,
          account_name: initialData.account_name,
          account_type: initialData.account_type,
          description: initialData.description || "",
          status: initialData.status || "Active",
          parent_id: initialData.parent_id || "",
        });
      } else {
        setFormData({
          account_code: "",
          account_name: "",
          account_type: "Expense",
          description: "",
          status: "Active",
          parent_id: "",
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // SMART LOGIC: If they change the Account Type, clear the Parent ID so there isn't a mismatch
      if (name === "account_type" && prev.account_type !== value) {
        newData.parent_id = "";
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        // Convert string to number, or send empty string for backend to nullify
        parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : "",
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SMART LOGIC: Filter accounts to only show valid parents
  const validParents = accounts.filter(
    (acc) =>
      acc.account_type === formData.account_type && // Must be same type
      acc.id !== initialData?.id && // Cannot be its own parent
      !acc.parent_id, // Keep it to 1 level deep (Parent -> Child only)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                  {isEditing ? "Edit Account" : "New Account"}
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  General Ledger Configuration
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Account Code
                  </label>
                  <input
                    type="text"
                    name="account_code"
                    required
                    disabled={isEditing}
                    placeholder="e.g. 5000"
                    value={formData.account_code}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Account Type
                  </label>
                  <select
                    name="account_type"
                    disabled={isEditing}
                    value={formData.account_type}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>

              {/* NEW: Hierarchy Setup */}
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                  <GitMerge size={12} className="text-amber-500" /> Parent
                  Account (Optional)
                </label>
                <select
                  name="parent_id"
                  disabled={initialData?.is_system_protected} // Don't let them move core accounts
                  value={formData.parent_id}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="">-- No Parent (Top-Level Account) --</option>
                  {validParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.account_code} - {parent.account_name}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-500 mt-2 uppercase tracking-wider">
                  Nesting an account will make it a sub-ledger of the selected
                  parent.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  name="account_name"
                  required
                  placeholder="e.g. Electricity Bill"
                  value={formData.account_name}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="2"
                  placeholder="Brief explanation..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    Operational Status
                    {initialData?.is_system_protected && (
                      <span className="flex items-center gap-1 text-amber-500 normal-case tracking-normal">
                        <Lock size={12} /> System Protected
                      </span>
                    )}
                  </label>
                  <select
                    name="status"
                    disabled={initialData?.is_system_protected}
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isEditing ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CoaModal;

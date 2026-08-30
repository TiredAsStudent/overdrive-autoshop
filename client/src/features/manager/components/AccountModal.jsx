import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  AlertCircle,
  Loader2,
  Save,
  Hash,
  Network,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const AccountModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [loadingParents, setLoadingParents] = useState(false);
  const [parentCandidates, setParentCandidates] = useState([]);

  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "EXPENSE",
    parent_id: "",
    description: "",
    is_vat_applicable: false,
  });

  useEffect(() => {
    if (isOpen) {
      setValidationError("");

      // Fetch active accounts for the parent dropdown
      const fetchParents = async () => {
        setLoadingParents(true);
        try {
          const res = await chartOfAccountsService.getAccounts(
            1,
            500,
            "",
            "all",
            "active",
          );
          setParentCandidates(res.data?.accounts || []);
        } catch (error) {
          console.error("Failed to load parent candidates", error);
        } finally {
          setLoadingParents(false);
        }
      };

      fetchParents();

      if (initialData) {
        setFormData({
          account_code: initialData.account_code || "",
          account_name: initialData.account_name || "",
          account_type: initialData.account_type || "EXPENSE",
          parent_id: initialData.parent_id
            ? initialData.parent_id.toString()
            : "",
          description: initialData.description || "",
          is_vat_applicable: initialData.is_vat_applicable || false,
        });
      } else {
        setFormData({
          account_code: "",
          account_name: "",
          account_type: "EXPENSE",
          parent_id: "",
          description: "",
          is_vat_applicable: false,
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

    // If account type changes, clear the parent_id to prevent category mismatch
    if (name === "account_type") {
      setFormData((prev) => ({ ...prev, parent_id: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter parent candidates to match selected account_type and exclude self
  const filteredParents = parentCandidates.filter(
    (p) => p.account_type === formData.account_type && p.id !== initialData?.id,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {initialData ? "Update Account" : "Register Account"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Financial Ledger Directory
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {initialData?.is_system && (
                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl flex items-start gap-3 text-xs font-bold">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>
                    This is a core system account. The Account Code, Name, and
                    Type are locked to ensure automated workflows operate
                    correctly.
                  </span>
                </div>
              )}

              <form
                id="accountForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* SECTION 1: IDENTIFICATION */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Hash size={14} /> Ledger Identification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Account Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="account_code"
                        value={formData.account_code}
                        onChange={handleChange}
                        disabled={!!initialData}
                        placeholder="e.g. 5040"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="account_type"
                        value={formData.account_type}
                        onChange={handleChange}
                        disabled={!!initialData}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                      >
                        {ACCOUNT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Account Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="account_name"
                        value={formData.account_name}
                        onChange={handleChange}
                        disabled={initialData?.is_system}
                        placeholder="e.g. Digital Marketing Expense"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: HIERARCHY & PURPOSE */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Network size={14} /> Hierarchy & Purpose
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Parent Account{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional sub-account mapping)
                        </span>
                      </label>
                      <select
                        name="parent_id"
                        value={formData.parent_id}
                        onChange={handleChange}
                        disabled={loadingParents}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                      >
                        <option value="">-- No Parent (Root Account) --</option>
                        {filteredParents.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.account_code}] {p.account_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Description / Purpose{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Briefly describe what this account tracks..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: ACCOUNTING RULES */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Settings size={14} /> Accounting Rules
                  </h3>
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_vat_applicable"
                      name="is_vat_applicable"
                      checked={formData.is_vat_applicable}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <label
                      htmlFor="is_vat_applicable"
                      className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                    >
                      Subject to VAT (Automated Posting)
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="accountForm"
                disabled={isSubmitting}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {initialData ? "Save Changes" : "Register Account"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AccountModal;

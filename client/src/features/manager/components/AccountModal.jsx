import React, { useState, useEffect, useId } from "react";
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
  Lock,
  ChevronDown,
} from "lucide-react";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const AccountModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [loadingParents, setLoadingParents] = useState(false);
  const [parentCandidates, setParentCandidates] = useState([]);

  // Accessible Form IDs
  const modalTitleId = useId();
  const accountCodeInputId = useId();
  const accountTypeSelectId = useId();
  const accountNameInputId = useId();
  const parentAccountSelectId = useId();
  const descriptionTextareaId = useId();
  const vatCheckboxId = useId();

  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "EXPENSE",
    parent_id: "",
    description: "",
    is_vat_applicable: false,
  });

  // Close modal on Escape key when not submitting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    let isMounted = true;
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
          if (isMounted) setParentCandidates(res.data?.accounts || []);
        } catch (error) {
          console.error("Failed to load parent candidates", error);
        } finally {
          if (isMounted) setLoadingParents(false);
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
          is_vat_applicable: Boolean(initialData.is_vat_applicable),
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

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValidationError("");
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      // If account type changes, clear the parent_id to prevent category mismatch
      if (name === "account_type") {
        next.parent_id = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const trimmedCode = formData.account_code.trim();
    const trimmedName = formData.account_name.trim();

    if (!trimmedCode) {
      return setValidationError("Account Code is required.");
    }
    if (!trimmedName || trimmedName.length < 2) {
      return setValidationError(
        "Account Name must be at least 2 characters long.",
      );
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        account_code: trimmedCode,
        account_name: trimmedName,
        description: (formData.description || "").trim(),
      });
    } catch (error) {
      setValidationError(error.message || "Failed to save account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentParentOption =
    initialData?.parent_id &&
    !parentCandidates.some((p) => p.id === initialData.parent_id)
      ? {
          id: initialData.parent_id,
          account_code: "ARCHIVED",
          account_name: initialData.parent_account_name || "Unknown Parent",
          account_type: initialData.account_type,
        }
      : null;

  const allParentOptions = currentParentOption
    ? [...parentCandidates, currentParentOption]
    : parentCandidates;

  const filteredParents = allParentOptions.filter(
    (p) =>
      p.account_type === formData.account_type &&
      p.id !== initialData?.id &&
      p.parent_id !== initialData?.id,
  );

  const isSystem = initialData?.is_system === true;
  const usageCount = parseInt(initialData?.usage_count || 0, 10);
  const hasUsage = usageCount > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={() => !isSubmitting && onClose?.()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[90vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData ? "Update Account" : "Register Account"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Financial Ledger Directory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close account modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Dynamic Warning Banners */}
              {isSystem && (
                <div
                  role="status"
                  className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl flex items-start gap-3 text-xs font-bold"
                >
                  <ShieldAlert
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>
                    This is a core system account. The Account Code, Name, and
                    Type are locked to ensure automated workflows operate
                    correctly.
                  </span>
                </div>
              )}

              {!isSystem && hasUsage && (
                <div
                  role="status"
                  className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-start gap-3 text-xs font-bold"
                >
                  <Lock
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>
                    This account has{" "}
                    <span className="font-mono tabular-nums">{usageCount}</span>{" "}
                    historical transaction(s). Its Account Type is permanently
                    locked to preserve ledger integrity.
                  </span>
                </div>
              )}

              <form
                id="accountForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* SECTION 1: IDENTIFICATION */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <Hash size={14} aria-hidden="true" />
                    <span>Ledger Identification</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={accountCodeInputId}
                        className="form-label"
                      >
                        Account Code <span className="form-required">*</span>
                      </label>
                      <input
                        id={accountCodeInputId}
                        required
                        type="text"
                        name="account_code"
                        value={formData.account_code}
                        onChange={handleChange}
                        disabled={Boolean(initialData) || isSubmitting}
                        placeholder="e.g. 5040"
                        className="form-input font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={accountTypeSelectId}
                        className="form-label"
                      >
                        Account Type <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={accountTypeSelectId}
                          required
                          name="account_type"
                          value={formData.account_type}
                          onChange={handleChange}
                          disabled={isSystem || hasUsage || isSubmitting}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          {ACCOUNT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          aria-hidden="true"
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label
                        htmlFor={accountNameInputId}
                        className="form-label"
                      >
                        Account Name <span className="form-required">*</span>
                      </label>
                      <input
                        id={accountNameInputId}
                        required
                        type="text"
                        name="account_name"
                        value={formData.account_name}
                        onChange={handleChange}
                        disabled={isSystem || isSubmitting}
                        placeholder="e.g. Digital Marketing Expense"
                        className="form-input"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 2: HIERARCHY & PURPOSE */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <Network size={14} aria-hidden="true" />
                    <span>Hierarchy & Purpose</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor={parentAccountSelectId}
                        className="form-label"
                      >
                        Parent Account{" "}
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional sub-account mapping)
                        </span>
                      </label>
                      <div className="relative">
                        <select
                          id={parentAccountSelectId}
                          name="parent_id"
                          value={formData.parent_id}
                          onChange={handleChange}
                          disabled={loadingParents || isSubmitting}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">
                            -- No Parent (Root Account) --
                          </option>
                          {filteredParents.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.account_code}] {p.account_name}
                            </option>
                          ))}
                        </select>
                        {loadingParents ? (
                          <Loader2
                            size={15}
                            aria-hidden="true"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-500 animate-spin pointer-events-none"
                          />
                        ) : (
                          <ChevronDown
                            size={15}
                            aria-hidden="true"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={descriptionTextareaId}
                        className="form-label"
                      >
                        Description / Purpose{" "}
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        id={descriptionTextareaId}
                        disabled={isSubmitting}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Briefly describe what this account tracks..."
                        className="form-textarea resize-none font-medium"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 3: ACCOUNTING RULES */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <Settings size={14} aria-hidden="true" />
                    <span>Accounting Rules</span>
                  </h3>
                  <label
                    htmlFor={vatCheckboxId}
                    className={`flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors select-none ${
                      isSystem || isSubmitting
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={vatCheckboxId}
                      name="is_vat_applicable"
                      checked={formData.is_vat_applicable}
                      onChange={handleChange}
                      disabled={isSystem || isSubmitting}
                      className="w-4 h-4 rounded border-slate-300 accent-amber-500 text-amber-500 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed shrink-0"
                    />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                      Subject to VAT (Tax Reporting)
                    </span>
                  </label>
                </section>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="accountForm"
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                <span>{initialData ? "Save Changes" : "Register Account"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AccountModal;

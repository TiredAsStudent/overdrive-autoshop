import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Loader2,
  AlertCircle,
  Edit2,
  Plus,
} from "lucide-react";

const BranchModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const titleId = useId();
  const branchNameInputId = useId();
  const branchCodeInputId = useId();
  const branchCodeHintId = useId();
  const addressInputId = useId();

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

  // Close modal on Escape key when not actively submitting
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict constraint: Branch Code must be letters only, max 3, auto-uppercase
    if (name === "branch_code") {
      const cleanValue = value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const trimmedName = formData.branch_name.trim();
    const trimmedCode = formData.branch_code.trim().toUpperCase();
    const trimmedAddress = formData.address.trim();

    if (!trimmedName) {
      setValidationError("Branch Name is required.");
      return;
    }

    if (trimmedCode.length !== 3) {
      setValidationError(
        "Branch Code must be exactly 3 letters (e.g., CAB, BIN).",
      );
      return;
    }

    if (!trimmedAddress) {
      setValidationError("Official Geographical Address is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        branch_name: trimmedName,
        branch_code: trimmedCode,
        address: trimmedAddress,
      });
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
        <div
          onClick={() => !isSubmitting && onClose?.()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  {initialData ? <Edit2 size={20} /> : <Building2 size={20} />}
                </div>
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData ? "Edit Branch Profile" : "Register Branch"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {initialData
                      ? `Branch Code: ${initialData.branch_code}`
                      : "Branch Intake Form"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close branch modal"
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

              <form
                id="branchForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Basic Details Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-4 tracking-widest flex items-center gap-2">
                    <Building2 size={14} aria-hidden="true" /> Basic Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor={branchNameInputId} className="form-label">
                        Branch Name <span className="form-required">*</span>
                      </label>
                      <input
                        id={branchNameInputId}
                        required
                        type="text"
                        name="branch_name"
                        value={formData.branch_name}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        placeholder="e.g., Overdrive Biñan"
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label htmlFor={branchCodeInputId} className="form-label">
                        Branch Code (Prefix){" "}
                        <span className="form-required">*</span>
                      </label>
                      <input
                        id={branchCodeInputId}
                        required
                        type="text"
                        name="branch_code"
                        value={formData.branch_code}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        aria-describedby={branchCodeHintId}
                        placeholder="e.g., BIN"
                        maxLength={3}
                        className="form-input font-mono tabular-nums font-black tracking-widest uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
                      />
                      <p
                        id={branchCodeHintId}
                        className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1.5"
                      >
                        Must be exactly 3 letters ({formData.branch_code.length}
                        /3).
                      </p>
                    </div>
                  </div>
                </section>

                {/* Location Section */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-4 tracking-widest flex items-center gap-2">
                    <MapPin size={14} aria-hidden="true" /> Location Profile
                  </h3>
                  <div>
                    <label htmlFor={addressInputId} className="form-label">
                      Official Geographical Address{" "}
                      <span className="form-required">*</span>
                    </label>
                    <textarea
                      id={addressInputId}
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      rows={3}
                      placeholder="Complete physical address used for printed documents"
                      className="form-textarea resize-none leading-relaxed font-medium"
                    />
                  </div>
                </section>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="branchForm"
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : initialData ? (
                  <Edit2 size={16} aria-hidden="true" />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                <span>
                  {initialData
                    ? "Save Profile Changes"
                    : "Confirm Registration"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BranchModal;

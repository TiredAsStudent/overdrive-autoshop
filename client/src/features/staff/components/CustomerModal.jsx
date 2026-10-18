import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserPlus,
  AlertCircle,
  Loader2,
  Edit2,
  User,
  MapPin,
  FileText,
} from "lucide-react";

const CustomerModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible IDs
  const modalTitleId = useId();
  const fullNameInputId = useId();
  const contactNumberInputId = useId();
  const emailInputId = useId();
  const addressInputId = useId();
  const notesInputId = useId();

  const [formData, setFormData] = useState({
    full_name: "",
    contact_number: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      if (initialData) {
        setFormData({
          full_name: initialData.full_name || "",
          contact_number: initialData.contact_number || "",
          email: initialData.email || "",
          address: initialData.address || "",
          notes: initialData.notes || "",
        });
      } else {
        setFormData({
          full_name: "",
          contact_number: "",
          email: "",
          address: "",
          notes: "",
        });
      }
    }
  }, [isOpen, initialData]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");

    if (name === "contact_number") {
      const sanitizedPhone = value.replace(/[^0-9+\-\s()]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedPhone }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const trimmedName = formData.full_name.trim();
    const trimmedPhone = formData.contact_number.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedAddress = formData.address.trim();
    const trimmedNotes = formData.notes.trim();

    if (trimmedName.length < 2) {
      setValidationError("Full name must be at least 2 characters.");
      return;
    }
    if (trimmedPhone.length < 7) {
      setValidationError("A valid contact number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        full_name: trimmedName,
        contact_number: trimmedPhone,
        email: trimmedEmail,
        address: trimmedAddress,
        notes: trimmedNotes,
      });
    } catch (error) {
      setValidationError(error.message || "Failed to process customer.");
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
            aria-labelledby={modalTitleId}
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
                  {initialData ? <Edit2 size={20} /> : <UserPlus size={20} />}
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData
                      ? "Update Customer Profile"
                      : "Register Customer"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono tabular-nums uppercase tracking-widest mt-0.5 truncate">
                    {initialData
                      ? `Client Code: ${initialData.customer_code}`
                      : "Client Intake Form"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close customer modal"
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
                id="customerForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* SECTION 1: IDENTIFICATION & CONTACT */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <User size={14} aria-hidden="true" /> Personal & Contact
                    Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor={fullNameInputId} className="form-label">
                        Full Name <span className="form-required">*</span>
                      </label>
                      <input
                        id={fullNameInputId}
                        required
                        type="text"
                        name="full_name"
                        disabled={isSubmitting}
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="e.g., Juan Dela Cruz"
                        className="form-input"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={contactNumberInputId}
                          className="form-label"
                        >
                          Contact Number{" "}
                          <span className="form-required">*</span>
                        </label>
                        <input
                          id={contactNumberInputId}
                          required
                          type="tel"
                          name="contact_number"
                          disabled={isSubmitting}
                          value={formData.contact_number}
                          onChange={handleChange}
                          placeholder="e.g., 0917-123-4567"
                          className="form-input font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label htmlFor={emailInputId} className="form-label">
                          Email Address{" "}
                          <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                            (Optional)
                          </span>
                        </label>
                        <input
                          id={emailInputId}
                          type="email"
                          name="email"
                          disabled={isSubmitting}
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="juan@example.com"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 2: LOCATION & PREFERENCES */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <MapPin size={14} aria-hidden="true" /> Location &
                    Preferences
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor={addressInputId} className="form-label">
                        Complete Address{" "}
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        id={addressInputId}
                        name="address"
                        disabled={isSubmitting}
                        value={formData.address}
                        onChange={handleChange}
                        rows={2}
                        placeholder="e.g., 123 Mabuhay St, Calamba City"
                        className="form-textarea resize-none font-medium"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={notesInputId}
                        className="form-label flex items-center gap-1.5"
                      >
                        <FileText
                          size={12}
                          aria-hidden="true"
                          className="text-slate-400"
                        />
                        <span>Service Notes / Preferences</span>
                        <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        id={notesInputId}
                        name="notes"
                        disabled={isSubmitting}
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        placeholder="e.g., Prefers morning appointments."
                        className="form-textarea resize-none font-medium"
                      />
                    </div>
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
                form="customerForm"
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
                  <UserPlus size={16} aria-hidden="true" />
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

export default CustomerModal;

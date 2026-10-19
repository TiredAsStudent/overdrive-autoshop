import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building,
  AlertCircle,
  Loader2,
  Edit2,
  FileText,
  Phone,
  Store,
} from "lucide-react";

const VendorModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible Form IDs
  const modalTitleId = useId();
  const businessNameInputId = useId();
  const businessAddressInputId = useId();
  const contactPersonInputId = useId();
  const contactNumberInputId = useId();
  const emailInputId = useId();
  const tinInputId = useId();
  const vatCheckboxId = useId();
  const notesInputId = useId();

  const [formData, setFormData] = useState({
    business_name: "",
    contact_person: "",
    contact_number: "",
    email: "",
    business_address: "",
    tin: "",
    is_vat_registered: false,
    notes: "",
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
    if (isOpen) {
      setValidationError("");
      if (initialData) {
        setFormData({
          business_name: initialData.business_name || "",
          contact_person: initialData.contact_person || "",
          contact_number: initialData.contact_number || "",
          email: initialData.email || "",
          business_address: initialData.business_address || "",
          tin: initialData.tin || "",
          is_vat_registered: Boolean(initialData.is_vat_registered),
          notes: initialData.notes || "",
        });
      } else {
        setFormData({
          business_name: "",
          contact_person: "",
          contact_number: "",
          email: "",
          business_address: "",
          tin: "",
          is_vat_registered: false,
          notes: "",
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValidationError("");
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (formData.business_name.trim().length < 2)
      return setValidationError("Business name must be at least 2 characters.");
    if (formData.contact_person.trim().length < 2)
      return setValidationError("Contact person name is required.");
    if (formData.contact_number.trim().length < 7)
      return setValidationError("A valid contact number is required.");
    if (formData.business_address.trim().length < 5)
      return setValidationError("Business address is required.");

    if (formData.is_vat_registered && !formData.tin.trim()) {
      return setValidationError(
        "TIN is strictly required for VAT Registered entities.",
      );
    }

    if (formData.tin.trim()) {
      const tinRegex = /^(\d{3}-\d{3}-\d{3}(-\d{3,5})?|\d{9}|\d{12})$/;
      if (!tinRegex.test(formData.tin.trim())) {
        return setValidationError(
          "TIN must be 9 or 12 numeric digits (e.g., 123-456-789-000).",
        );
      }
    }

    const payload = {
      ...formData,
      business_name: formData.business_name.trim(),
      contact_person: formData.contact_person.trim(),
      contact_number: formData.contact_number.trim(),
      business_address: formData.business_address.trim(),
      tin: formData.tin.trim() === "" ? null : formData.tin.trim(),
      email: formData.email.trim() === "" ? null : formData.email.trim(),
      notes: formData.notes.trim() === "" ? null : formData.notes.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message || "Failed to process vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={() => !isSubmitting && onClose?.()}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
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
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  {initialData ? <Edit2 size={20} /> : <Store size={20} />}
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData ? "Update Vendor" : "Register Vendor"}
                  </h2>
                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {initialData
                      ? `Vendor Profile: ${initialData.vendor_code}`
                      : "Vendor Master Data Profile"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close vendor modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
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
                id="vendorForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                    <Building size={14} aria-hidden="true" />
                    <span>Corporate Identity</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor={businessNameInputId}
                        className="form-label"
                      >
                        Registered Business Name{" "}
                        <span className="form-required">*</span>
                      </label>
                      <input
                        id={businessNameInputId}
                        required
                        disabled={isSubmitting}
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        placeholder="e.g., NGK Spark Plugs Philippines"
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={businessAddressInputId}
                        className="form-label"
                      >
                        Primary Business Address{" "}
                        <span className="form-required">*</span>
                      </label>
                      <textarea
                        id={businessAddressInputId}
                        required
                        disabled={isSubmitting}
                        name="business_address"
                        value={formData.business_address}
                        onChange={handleChange}
                        rows={2}
                        placeholder="e.g., 123 Warehouse Row, Calamba"
                        className="form-textarea resize-none font-medium"
                      />
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                      <Phone size={14} aria-hidden="true" />
                      <span>Primary Contact</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={contactPersonInputId}
                          className="form-label"
                        >
                          Representative Name{" "}
                          <span className="form-required">*</span>
                        </label>
                        <input
                          id={contactPersonInputId}
                          required
                          disabled={isSubmitting}
                          type="text"
                          name="contact_person"
                          value={formData.contact_person}
                          onChange={handleChange}
                          placeholder="e.g., Maria Santos"
                          className="form-input"
                        />
                      </div>
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
                          disabled={isSubmitting}
                          type="tel"
                          name="contact_number"
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
                          disabled={isSubmitting}
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="sales@supplier.com"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                        <FileText size={14} aria-hidden="true" />
                        <span>Fiscal Data</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={tinInputId} className="form-label">
                            Tax Identification Number
                            {formData.is_vat_registered ? (
                              <span className="form-required">*</span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 font-medium lowercase ml-1">
                                (Optional)
                              </span>
                            )}
                          </label>
                          <input
                            id={tinInputId}
                            disabled={isSubmitting}
                            type="text"
                            name="tin"
                            value={formData.tin}
                            onChange={handleChange}
                            placeholder="9 or 12 digits"
                            className="form-input font-mono tabular-nums tracking-wider"
                          />
                        </div>

                        <div className="pt-2">
                          <label
                            htmlFor={vatCheckboxId}
                            className="flex items-center gap-3 cursor-pointer group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:border-amber-300 dark:hover:border-amber-500/40 select-none"
                          >
                            <input
                              id={vatCheckboxId}
                              disabled={isSubmitting}
                              type="checkbox"
                              name="is_vat_registered"
                              checked={formData.is_vat_registered}
                              onChange={handleChange}
                              className="w-5 h-5 rounded border-slate-300 accent-amber-500 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-slate-800 cursor-pointer shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow transition-colors">
                                VAT Registered Entity
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                Check this if the vendor issues valid VAT
                                invoices.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                  <label htmlFor={notesInputId} className="form-label">
                    Procurement Notes / Terms{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    id={notesInputId}
                    disabled={isSubmitting}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g., Deliveries only on Tuesdays. Offers 30-day credit term."
                    className="form-textarea resize-none font-medium"
                  />
                </section>
              </form>
            </div>

            {/* Footer */}
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
                form="vendorForm"
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 cursor-pointer"
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
                  <Store size={16} aria-hidden="true" />
                )}
                <span>{initialData ? "Update Vendor" : "Register Vendor"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorModal;

import React, { useState, useEffect } from "react";
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
          is_vat_registered: initialData.is_vat_registered || false,
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

    // Front-end TIN Catch
    if (formData.tin.trim()) {
      const tinRegex = /^(\d{9}|\d{12})$/;
      if (!tinRegex.test(formData.tin.trim())) {
        return setValidationError(
          "TIN must be exactly 9 or 12 numeric digits.",
        );
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(error.message || "Failed to process vendor.");
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
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  {initialData ? <Edit2 size={20} /> : <Store size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {initialData ? "Update Supplier" : "Register Supplier"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {initialData
                      ? initialData.vendor_code
                      : "Vendor Master Data Profile"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="vendorForm"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* Section 1: Business Identity */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                    <Building size={14} /> Corporate Identity
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Registered Business Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        placeholder="e.g., NGK Spark Plugs Philippines"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Primary Business Address{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        name="business_address"
                        value={formData.business_address}
                        onChange={handleChange}
                        rows="2"
                        placeholder="e.g., 123 Warehouse Row, Calamba"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Tax Information (Dual Column) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Col: Contact */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                      <Phone size={14} /> Primary Contact
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Representative Name{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="contact_person"
                          value={formData.contact_person}
                          onChange={handleChange}
                          placeholder="e.g., Maria Santos"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="contact_number"
                          value={formData.contact_number}
                          onChange={handleChange}
                          placeholder="e.g., 0917-123-4567"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Email{" "}
                          <span className="text-slate-400 font-medium lowercase">
                            (Optional)
                          </span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="sales@supplier.com"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Tax */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                      <FileText size={14} /> Fiscal Data
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Tax Identification Number{" "}
                          <span className="text-slate-400 font-medium lowercase">
                            (Optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          name="tin"
                          value={formData.tin}
                          onChange={handleChange}
                          placeholder="9 or 12 digits"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 tracking-wider"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              name="is_vat_registered"
                              checked={formData.is_vat_registered}
                              onChange={handleChange}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors"></div>
                            <svg
                              className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors">
                              VAT Registered Entity
                            </p>
                            <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                              Check this if the supplier issues valid VAT
                              invoices.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Notes */}
                <div className="pt-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Procurement Notes / Terms{" "}
                    <span className="text-slate-400 font-medium lowercase">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="e.g., Deliveries only on Tuesdays. Offers 30-day credit term."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="submit"
                form="vendorForm"
                disabled={isSubmitting}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : initialData ? (
                  <Edit2 size={16} />
                ) : (
                  <Store size={16} />
                )}
                {initialData ? "Save Master Data" : "Register Supplier"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorModal;

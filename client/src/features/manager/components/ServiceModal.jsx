import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wrench,
  DollarSign,
  Loader2,
  AlertCircle,
  PackagePlus,
  Search,
  Activity,
  Calendar,
  Save,
  BookOpen,
  Lock,
  ChevronDown,
} from "lucide-react";
import { serviceCatalogService } from "../../../services/manager/serviceCatalog.service";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";

const CATEGORIES = [
  "Engine",
  "Transmission",
  "Brake System",
  "Suspension",
  "Cooling System",
  "Electrical",
  "Air Conditioning",
  "Steering",
  "Preventive Maintenance",
  "Tire Services",
  "General Repair",
];

const ServiceModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible IDs
  const modalTitleId = useId();
  const serviceNameInputId = useId();
  const categorySelectId = useId();
  const descriptionInputId = useId();
  const priceInputId = useId();
  const durationInputId = useId();
  const incomeAccountSelectId = useId();
  const vatableCheckboxId = useId();
  const partSearchInputId = useId();

  // COA Linkage States
  const [incomeAccounts, setIncomeAccounts] = useState([]);
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);

  // Inventory Linkage States
  const [inventoryList, setInventoryList] = useState([]);
  const [isFetchingParts, setIsFetchingParts] = useState(false);
  const [partSearchTerm, setPartSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    service_name: "",
    category: "Preventive Maintenance",
    description: "",
    price: "",
    estimated_minutes: 60,
    commonly_used_parts: [],
    is_vatable: true,
    income_account_id: "",
  });

  const isAccountLocked = Boolean(
    initialData && parseInt(initialData.usage_count, 10) > 0,
  );

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
      setIsFetchingParts(true);
      serviceCatalogService
        .getActiveInventoryItems()
        .then((res) => {
          if (isMounted) setInventoryList(res.data || []);
        })
        .catch(() => {
          if (isMounted) setInventoryList([]);
        })
        .finally(() => {
          if (isMounted) setIsFetchingParts(false);
        });

      setIsFetchingAccounts(true);
      chartOfAccountsService
        .getAccounts(1, 100, "", "INCOME", "active")
        .then((res) => {
          if (!isMounted) return;
          const accounts = res.data?.accounts || res.accounts || [];
          setIncomeAccounts(accounts);

          if (!initialData && accounts.length > 0) {
            setFormData((prev) => ({
              ...prev,
              income_account_id:
                prev.income_account_id || accounts[0].id.toString(),
            }));
          }
        })
        .catch(() => {
          if (isMounted) setIncomeAccounts([]);
        })
        .finally(() => {
          if (isMounted) setIsFetchingAccounts(false);
        });
    } else {
      setPartSearchTerm("");
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        service_name: initialData.service_name || "",
        category: initialData.category || "Preventive Maintenance",
        description: initialData.description || "",
        price: initialData.price ?? "",
        estimated_minutes: initialData.estimated_minutes || 60,
        commonly_used_parts: Array.isArray(initialData.commonly_used_parts)
          ? initialData.commonly_used_parts.map((id) => Number(id))
          : [],
        is_vatable: initialData.is_vatable ?? true,
        income_account_id: initialData.income_account_id?.toString() || "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        service_name: "",
        category: "Preventive Maintenance",
        description: "",
        price: "",
        estimated_minutes: 60,
        commonly_used_parts: [],
        is_vatable: true,
        income_account_id:
          incomeAccounts.length > 0 ? incomeAccounts[0].id.toString() : "",
      }));
    }
    setValidationError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValidationError("");
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePartToggle = (partId) => {
    const normalizedId = Number(partId);
    setFormData((prev) => {
      const exists = prev.commonly_used_parts.some(
        (id) => Number(id) === normalizedId,
      );
      if (exists) {
        return {
          ...prev,
          commonly_used_parts: prev.commonly_used_parts.filter(
            (id) => Number(id) !== normalizedId,
          ),
        };
      }
      return {
        ...prev,
        commonly_used_parts: [...prev.commonly_used_parts, normalizedId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.service_name.trim()) {
      setValidationError("Service Name is required.");
      return;
    }
    if (formData.price === "" || parseFloat(formData.price) < 0) {
      setValidationError("Labor price cannot be negative.");
      return;
    }
    if (
      !formData.estimated_minutes ||
      parseInt(formData.estimated_minutes, 10) < 1
    ) {
      setValidationError("Estimated duration must be at least 1 minute.");
      return;
    }
    if (!formData.income_account_id) {
      setValidationError("Please select an Income Account for billing.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        service_name: formData.service_name.trim(),
        description: (formData.description || "").trim(),
      });
    } catch (error) {
      setValidationError(error.message || "Failed to save service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const query = partSearchTerm.toLowerCase();
  const filteredParts = inventoryList.filter(
    (item) =>
      (item.item_name || "").toLowerCase().includes(query) ||
      (item.sku || "").toLowerCase().includes(query),
  );

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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[90vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Wrench size={20} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData
                      ? "Update Service Profile"
                      : "Register Service"}
                  </h2>
                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {initialData
                      ? `Service Code: ${initialData.service_code}`
                      : "Service Catalog Management"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close service modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
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

              {/* View Service Usage Summary */}
              {initialData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        aria-hidden="true"
                        className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0"
                      >
                        <Activity size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 dark:text-blue-300 truncate">
                        Total Transactions
                      </span>
                    </div>
                    <span className="text-lg font-mono tabular-nums font-black text-blue-900 dark:text-blue-400 shrink-0">
                      {parseInt(initialData.usage_count, 10) || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        aria-hidden="true"
                        className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg shrink-0"
                      >
                        <Calendar size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 truncate">
                        Last Utilized
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white shrink-0">
                      {initialData.last_used_date
                        ? new Date(
                            initialData.last_used_date,
                          ).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })
                        : "Never"}
                    </span>
                  </div>
                </div>
              )}

              <form
                id="serviceForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT COLUMN: OPERATIONAL & FINANCIAL */}
                  <div className="space-y-6">
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                        <Wrench size={14} aria-hidden="true" />
                        <span>Operational Details</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor={serviceNameInputId}
                            className="form-label"
                          >
                            Service Name{" "}
                            <span className="form-required">*</span>
                          </label>
                          <input
                            id={serviceNameInputId}
                            required
                            disabled={isSubmitting}
                            type="text"
                            name="service_name"
                            value={formData.service_name}
                            onChange={handleChange}
                            placeholder="e.g., Standard Engine Tune-up"
                            className="form-input"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={categorySelectId}
                            className="form-label"
                          >
                            Category Classification{" "}
                            <span className="form-required">*</span>
                          </label>
                          <div className="relative">
                            <select
                              id={categorySelectId}
                              required
                              disabled={isSubmitting}
                              name="category"
                              value={formData.category}
                              onChange={handleChange}
                              className="form-select appearance-none pr-10 cursor-pointer"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
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

                        <div>
                          <label
                            htmlFor={descriptionInputId}
                            className="form-label"
                          >
                            Service Description{" "}
                            <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                              (Optional)
                            </span>
                          </label>
                          <textarea
                            id={descriptionInputId}
                            disabled={isSubmitting}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Brief scope of work or inspection checklist..."
                            className="form-textarea resize-none font-medium"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                        <DollarSign size={14} aria-hidden="true" />
                        <span>Financials & Accounting Link</span>
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor={priceInputId}
                              className="form-label"
                            >
                              Labor Price (PHP){" "}
                              <span className="form-required">*</span>
                            </label>
                            <input
                              id={priceInputId}
                              required
                              disabled={isSubmitting}
                              type="number"
                              step="0.01"
                              min="0"
                              name="price"
                              value={formData.price}
                              onChange={handleChange}
                              placeholder="0.00"
                              className="form-input font-mono tabular-nums"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={durationInputId}
                              className="form-label"
                            >
                              Duration (Mins){" "}
                              <span className="form-required">*</span>
                            </label>
                            <input
                              id={durationInputId}
                              required
                              disabled={isSubmitting}
                              type="number"
                              min="1"
                              name="estimated_minutes"
                              value={formData.estimated_minutes}
                              onChange={handleChange}
                              className="form-input font-mono tabular-nums"
                            />
                          </div>
                        </div>

                        {/* CHART OF ACCOUNTS DYNAMIC LINKAGE */}
                        <div>
                          <label
                            htmlFor={incomeAccountSelectId}
                            className="form-label flex items-center gap-1.5"
                          >
                            <BookOpen
                              size={12}
                              aria-hidden="true"
                              className="text-slate-400"
                            />
                            <span>Revenue Account Mapping</span>
                            <span className="form-required">*</span>
                          </label>
                          <div className="relative">
                            <select
                              id={incomeAccountSelectId}
                              required
                              name="income_account_id"
                              value={formData.income_account_id}
                              onChange={handleChange}
                              disabled={
                                isFetchingAccounts ||
                                isAccountLocked ||
                                isSubmitting
                              }
                              className="form-select appearance-none pr-10 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <option value="" disabled>
                                {isFetchingAccounts
                                  ? "Loading Income Accounts..."
                                  : "-- Select Income Account --"}
                              </option>
                              {!incomeAccounts.some(
                                (a) =>
                                  a.id.toString() ===
                                  formData.income_account_id,
                              ) &&
                                formData.income_account_id && (
                                  <option value={formData.income_account_id}>
                                    [Archived/Locked Account]
                                  </option>
                                )}
                              {incomeAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.account_code} - {acc.account_name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              aria-hidden="true"
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                          </div>
                          {isAccountLocked && (
                            <p className="text-[10px] text-amber-600 dark:text-overdrive-yellow mt-2 font-bold flex items-center gap-1.5">
                              <Lock size={12} aria-hidden="true" />
                              <span>
                                Mapping locked to preserve historical ledgers.
                              </span>
                            </p>
                          )}
                        </div>

                        <label
                          htmlFor={vatableCheckboxId}
                          className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            id={vatableCheckboxId}
                            disabled={isSubmitting}
                            name="is_vatable"
                            checked={formData.is_vatable}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-slate-300 accent-emerald-500 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            Subject to VAT
                          </span>
                        </label>
                      </div>
                    </section>
                  </div>

                  {/* RIGHT COLUMN: INVENTORY LINKAGE */}
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col h-full min-h-[380px]">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center gap-2">
                        <PackagePlus size={14} aria-hidden="true" />
                        <span>Commonly Used Parts Linkage</span>
                      </h3>
                      <span className="text-[10px] font-mono tabular-nums font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-overdrive-yellow border border-amber-500/20">
                        {formData.commonly_used_parts.length} Selected
                      </span>
                    </div>

                    <div className="relative mb-4 shrink-0">
                      <label htmlFor={partSearchInputId} className="sr-only">
                        Search parts by name or SKU
                      </label>
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                      >
                        <Search size={14} className="text-slate-400" />
                      </div>
                      <input
                        id={partSearchInputId}
                        type="text"
                        disabled={isSubmitting}
                        placeholder="Search parts by name or SKU..."
                        value={partSearchTerm}
                        onChange={(e) => setPartSearchTerm(e.target.value)}
                        className="form-input pl-9"
                      />
                    </div>

                    <div className="overflow-y-auto custom-scrollbar pr-1.5 flex-1 space-y-2 max-h-[380px]">
                      {isFetchingParts ? (
                        <div
                          role="status"
                          aria-live="polite"
                          className="flex flex-col items-center justify-center py-12 text-amber-500"
                        >
                          <Loader2
                            size={24}
                            aria-hidden="true"
                            className="animate-spin mb-3"
                          />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Loading Inventory Catalog...
                          </p>
                        </div>
                      ) : filteredParts.length === 0 ? (
                        <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {partSearchTerm
                              ? "No matching parts found."
                              : "No active master items available."}
                          </p>
                        </div>
                      ) : (
                        filteredParts.map((item) => {
                          const isSelected = formData.commonly_used_parts.some(
                            (id) => Number(id) === Number(item.id),
                          );

                          return (
                            <label
                              key={item.id}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                isSelected
                                  ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 shadow-2xs"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500/30"
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isSubmitting}
                                checked={isSelected}
                                onChange={() => handlePartToggle(item.id)}
                                className="w-4 h-4 rounded border-slate-300 accent-amber-500 text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs font-bold truncate uppercase ${
                                    isSelected
                                      ? "text-amber-900 dark:text-overdrive-yellow"
                                      : "text-slate-700 dark:text-slate-300"
                                  }`}
                                  title={item.item_name}
                                >
                                  {item.item_name}
                                </p>
                                <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 tracking-widest mt-0.5 uppercase">
                                  SKU: {item.sku}
                                </p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </section>
                </div>
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
                form="serviceForm"
                disabled={isSubmitting || isFetchingAccounts}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
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
                <span>
                  {initialData
                    ? "Update Service Profile"
                    : "Register Master Service"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ServiceModal;

import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  Loader2,
  User,
  Search,
  ClipboardList,
} from "lucide-react";
import { customerService } from "../../../services/staff/customer.service";
import api from "../../../services/api";

const SearchableSelect = ({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  size = "medium",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const listboxId = useId();

  const inputPadding =
    size === "large" ? "py-3.5 sm:py-4 pl-11" : "py-3 lg:py-2.5 pl-9";
  const iconLeft = size === "large" ? "left-4" : "left-3";
  const iconSize = size === "large" ? 16 : 14;
  const listPadding = size === "large" ? "p-3.5 sm:p-4" : "p-3 sm:p-3.5";
  const roundedBox = size === "large" ? "rounded-2xl" : "rounded-xl";

  useEffect(() => {
    if (value) {
      const selected = options.find(
        (o) => o.id.toString() === value.toString(),
      );
      if (selected) setSearchTerm(selected.label);
    } else {
      setSearchTerm("");
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        const selected = options.find(
          (o) => o.id.toString() === value?.toString(),
        );
        setSearchTerm(selected ? selected.label : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.sublabel &&
        o.sublabel.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 ${iconLeft} flex items-center pointer-events-none`}
        >
          <Search size={iconSize} className="text-slate-400" />
        </div>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label={ariaLabel || placeholder}
          className={`w-full pr-4 ${inputPadding} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs disabled:opacity-50`}
          placeholder={placeholder}
          value={isOpen ? searchTerm : value ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && isOpen) {
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
          disabled={disabled}
        />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${roundedBox} shadow-2xl max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar z-50`}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={value?.toString() === opt.id.toString()}
                  onClick={() => {
                    onChange(opt.id);
                    setSearchTerm(opt.label);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left ${listPadding} hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {opt.label}
                  </p>
                  {opt.sublabel && (
                    <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-wider uppercase mt-0.5 truncate">
                      {opt.sublabel}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 sm:p-5 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                No matching records found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getDefaultValidUntilDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
};

const EstimateModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

  // Accessible IDs
  const modalTitleId = useId();
  const customerInputId = useId();
  const validUntilInputId = useId();
  const notesInputId = useId();
  const termsInputId = useId();

  // Master Catalogs
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [vatRate, setVatRate] = useState(0.12);

  const [formData, setFormData] = useState({
    customer_id: "",
    valid_until: getDefaultValidUntilDate(),
    notes: "",
    terms_conditions:
      "Prices are valid for 30 days. Final invoice may vary based on unforeseen internal damages discovered during repair.",
    items: [
      {
        id: Date.now(),
        line_type: "SERVICE",
        service_id: "",
        item_id: "",
        quantity: 1,
        discount: 0,
      },
    ],
  });

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setValidationError("");
      const fetchCatalogs = async () => {
        setIsLoadingCatalogs(true);
        try {
          const [custRes, servRes, partRes, setRes] = await Promise.all([
            customerService.getCustomers(1, 1000, "", "active", "all"),
            api.get("/staff/services", {
              params: { page: 1, limit: 1000, status: "active" },
            }),
            api.get("/staff/inventory", {
              params: { page: 1, limit: 1000, status: "active" },
            }),
            api.get("/staff/settings"),
          ]);

          if (!isMounted) return;

          setCustomers(custRes.data?.customers || []);
          setServices(servRes.data?.data || []);
          setParts(partRes.data?.data || []);
          setVatRate(parseFloat(setRes.data?.data?.vat_percentage || 12) / 100);

          if (initialData) {
            setFormData({
              customer_id: initialData.customer_id
                ? initialData.customer_id.toString()
                : "",
              valid_until: initialData.valid_until
                ? initialData.valid_until.split("T")[0]
                : getDefaultValidUntilDate(),
              notes: initialData.notes || "",
              terms_conditions: initialData.terms_conditions || "",
              items: (initialData.items || []).map((i, idx) => ({
                id: Date.now() + idx,
                line_type: i.line_type,
                service_id: i.service_id ? i.service_id.toString() : "",
                item_id: i.item_id ? i.item_id.toString() : "",
                quantity: i.quantity,
                discount: parseFloat(i.discount_amount) || 0,
              })),
            });
          } else {
            setFormData({
              customer_id: "",
              valid_until: getDefaultValidUntilDate(),
              notes: "",
              terms_conditions:
                "Prices are valid for 30 days. Final invoice may vary based on unforeseen internal damages discovered during repair.",
              items: [
                {
                  id: Date.now(),
                  line_type: "SERVICE",
                  service_id: "",
                  item_id: "",
                  quantity: 1,
                  discount: 0,
                },
              ],
            });
          }
        } catch (error) {
          console.error(error);
          if (isMounted) {
            setValidationError(
              "Failed to load system catalogs. Please refresh.",
            );
          }
        } finally {
          if (isMounted) setIsLoadingCatalogs(false);
        }
      };

      fetchCatalogs();
    }

    return () => {
      isMounted = false;
    };
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

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now() + Math.random(),
          line_type: "SERVICE",
          service_id: "",
          item_id: "",
          quantity: 1,
          discount: 0,
        },
      ],
    }));
  };

  const removeLineItem = (id) => {
    if (formData.items.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleItemChange = (id, field, value) => {
    setValidationError("");
    setFormData((prev) => {
      let newItems = [...prev.items];
      const itemIndex = newItems.findIndex((i) => i.id === id);

      if (itemIndex === -1) return prev;

      const currentItem = newItems[itemIndex];

      if (field === "line_type") {
        newItems[itemIndex] = {
          ...currentItem,
          line_type: value,
          service_id: "",
          item_id: "",
        };
        return { ...prev, items: newItems };
      }

      if (field === "service_id" || field === "item_id") {
        const isService = field === "service_id";
        const lineType = isService ? "SERVICE" : "PART";

        const duplicateIndex = newItems.findIndex(
          (i) =>
            i.id !== id &&
            i.line_type === lineType &&
            i[field]?.toString() === value.toString(),
        );

        if (duplicateIndex > -1 && value) {
          const existingQty = Number(newItems[duplicateIndex].quantity) || 0;
          const addedQty = Number(currentItem.quantity) || 1;

          newItems[duplicateIndex] = {
            ...newItems[duplicateIndex],
            quantity: existingQty + addedQty,
          };

          if (itemIndex === newItems.length - 1) {
            newItems[itemIndex] = {
              id: currentItem.id,
              line_type: currentItem.line_type,
              service_id: "",
              item_id: "",
              quantity: 1,
              discount: 0,
            };
          } else {
            newItems.splice(itemIndex, 1);
          }

          return { ...prev, items: newItems };
        }

        newItems[itemIndex] = { ...currentItem, [field]: value };

        if (isService && value) {
          const selectedService = services.find(
            (s) => s.id.toString() === value.toString(),
          );

          if (
            selectedService &&
            selectedService.commonly_used_parts &&
            selectedService.commonly_used_parts.length > 0
          ) {
            const partsToAdd = selectedService.commonly_used_parts
              .map((partId) => parts.find((p) => p.id === partId))
              .filter(Boolean);

            const injectedParts = [];

            partsToAdd.forEach((p, idx) => {
              const existingPartIndex = newItems.findIndex(
                (i) =>
                  i.line_type === "PART" &&
                  i.item_id?.toString() === p.id.toString(),
              );

              if (existingPartIndex > -1) {
                newItems[existingPartIndex] = {
                  ...newItems[existingPartIndex],
                  quantity: Number(newItems[existingPartIndex].quantity) + 1,
                };
              } else {
                injectedParts.push({
                  id: Date.now() + Math.random() + idx,
                  line_type: "PART",
                  service_id: "",
                  item_id: p.id.toString(),
                  quantity: 1,
                  discount: 0,
                });
              }
            });

            if (injectedParts.length > 0) {
              const currentIndex = newItems.findIndex((i) => i.id === id);
              newItems.splice(currentIndex + 1, 0, ...injectedParts);
            }
          }
        }

        return { ...prev, items: newItems };
      }

      newItems[itemIndex] = { ...currentItem, [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const calculatePreview = () => {
    let subtotal = 0;
    let vatableSubtotal = 0;
    let discountTotal = 0;

    formData.items.forEach((item) => {
      let price = 0;
      let isVatable = true;

      if (item.line_type === "SERVICE" && item.service_id) {
        const s = services.find(
          (x) => x.id.toString() === item.service_id.toString(),
        );
        if (s) {
          price = parseFloat(s.price) || 0;
          isVatable = s.is_vatable;
        }
      } else if (item.line_type === "PART" && item.item_id) {
        const p = parts.find(
          (x) => x.id.toString() === item.item_id.toString(),
        );
        if (p) {
          price = parseFloat(p.selling_price) || 0;
          isVatable = true;
        }
      }

      const lineGross = price * (parseFloat(item.quantity) || 1);
      const lineDisc = parseFloat(item.discount) || 0;
      const lineNet = lineGross - lineDisc > 0 ? lineGross - lineDisc : 0;

      subtotal += lineGross;
      discountTotal += lineDisc;

      if (isVatable) vatableSubtotal += lineNet;
    });

    const vatAmount = vatableSubtotal * vatRate;
    return {
      subtotal,
      discountTotal,
      vatAmount,
      grandTotal: Math.max(0, subtotal - discountTotal) + vatAmount,
    };
  };

  const preview = calculatePreview();

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.customer_id)
      return setValidationError("Please select a valid customer.");
    if (!formData.valid_until)
      return setValidationError("Please specify a valid expiration date.");
    if (formData.items.length === 0)
      return setValidationError("At least one line item is required.");

    const invalidItems = formData.items.filter(
      (i) =>
        (i.line_type === "SERVICE" && !i.service_id) ||
        (i.line_type === "PART" && !i.item_id),
    );

    if (invalidItems.length > 0) {
      return setValidationError(
        "Please ensure all line items have a specific Service or Part selected.",
      );
    }

    for (const item of formData.items) {
      const qty = parseInt(item.quantity, 10);
      const disc = parseFloat(item.discount) || 0;

      if (!qty || qty < 1) {
        return setValidationError(
          "All line item quantities must be at least 1.",
        );
      }
      if (disc < 0) {
        return setValidationError("Line item discount cannot be negative.");
      }

      let unitPrice = 0;
      if (item.line_type === "SERVICE") {
        const s = services.find(
          (x) => x.id.toString() === item.service_id.toString(),
        );
        unitPrice = parseFloat(s?.price) || 0;
      } else {
        const p = parts.find(
          (x) => x.id.toString() === item.item_id.toString(),
        );
        unitPrice = parseFloat(p?.selling_price) || 0;
      }

      if (disc > unitPrice * qty) {
        return setValidationError(
          "Discount on a line item cannot exceed its gross total.",
        );
      }
    }

    const payload = {
      customer_id: parseInt(formData.customer_id, 10),
      valid_until: formData.valid_until,
      notes: formData.notes.trim(),
      terms_conditions: formData.terms_conditions.trim(),
      items: formData.items.map((i) => ({
        line_type: i.line_type,
        service_id:
          i.line_type === "SERVICE" ? parseInt(i.service_id, 10) : null,
        item_id: i.line_type === "PART" ? parseInt(i.item_id, 10) : null,
        quantity: parseInt(i.quantity, 10),
        discount: parseFloat(i.discount) || 0,
      })),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message || "Failed to process estimate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    id: c.id,
    label: c.full_name,
    sublabel: `Code: ${c.customer_code} | Contact: ${c.contact_number}`,
  }));

  const serviceOptions = services.map((s) => ({
    id: s.id,
    label: s.service_name,
    sublabel: `[${s.service_code}] ₱${formatCurrency(s.price)}`,
  }));

  const partOptions = parts.map((p) => ({
    id: p.id,
    label: p.item_name,
    sublabel: `[${p.sku}] ₱${formatCurrency(p.selling_price)} | Stock: ${p.total_company_quantity}`,
  }));

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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData ? "Edit Estimate" : "Build Estimate"}
                  </h2>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {initialData?.estimate_number
                      ? `Document: ${initialData.estimate_number}`
                      : "Pre-Sales Quotation Matrix"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close estimate modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
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

              {isLoadingCatalogs ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-14 opacity-70"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 text-amber-500 animate-spin mb-3"
                  />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Syncing Master Catalogs...
                  </p>
                </div>
              ) : (
                <form
                  id="estimateForm"
                  onSubmit={handleSubmit}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* SECTION 1: Document Header Metadata */}
                  <section className="relative z-[60] bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                      <User size={14} aria-hidden="true" /> Document Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative">
                      <div className="relative z-30">
                        <label htmlFor={customerInputId} className="form-label">
                          Target Customer{" "}
                          <span className="form-required">*</span>
                        </label>
                        <SearchableSelect
                          id={customerInputId}
                          ariaLabel="Target Customer"
                          size="large"
                          disabled={isSubmitting}
                          value={formData.customer_id}
                          options={customerOptions}
                          onChange={(val) => {
                            setValidationError("");
                            setFormData((prev) => ({
                              ...prev,
                              customer_id: val,
                            }));
                          }}
                          placeholder="Search customer by name or phone..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={validUntilInputId}
                          className="form-label"
                        >
                          Quotation Valid Until{" "}
                          <span className="form-required">*</span>
                        </label>
                        <input
                          id={validUntilInputId}
                          required
                          type="date"
                          name="valid_until"
                          disabled={isSubmitting}
                          value={formData.valid_until}
                          onChange={handleHeaderChange}
                          className="w-full px-4 py-3.5 sm:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: Line Items Matrix */}
                  <section className="relative z-[50] bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center gap-2">
                        <Calculator size={14} aria-hidden="true" /> Itemized
                        Breakdown
                      </h3>
                      <span className="text-[10px] font-mono tabular-nums font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {formData.items.length}{" "}
                        {formData.items.length === 1 ? "Line" : "Lines"}
                      </span>
                    </div>

                    <div className="space-y-4 sm:space-y-3">
                      {formData.items.map((item, index) => (
                        <div
                          key={item.id}
                          style={{ zIndex: Math.max(1, 50 - index) }}
                          className="flex flex-col lg:flex-row gap-3 p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-[20px] relative group shadow-2xs"
                        >
                          {/* Item Type Selector */}
                          <div className="w-full lg:w-36 shrink-0">
                            <select
                              aria-label={`Line ${index + 1} item type`}
                              disabled={isSubmitting}
                              value={item.line_type}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "line_type",
                                  e.target.value,
                                )
                              }
                              className="w-full py-3 lg:py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="SERVICE">Labor / Service</option>
                              <option value="PART">Physical Part</option>
                            </select>
                          </div>

                          {/* Dynamic Catalog Search/Select */}
                          <div className="flex-1 min-w-0 relative">
                            {item.line_type === "SERVICE" ? (
                              <SearchableSelect
                                ariaLabel={`Line ${index + 1} service selection`}
                                size="medium"
                                disabled={isSubmitting}
                                value={item.service_id}
                                options={serviceOptions}
                                onChange={(val) =>
                                  handleItemChange(item.id, "service_id", val)
                                }
                                placeholder="Search labor or service..."
                              />
                            ) : (
                              <SearchableSelect
                                ariaLabel={`Line ${index + 1} part selection`}
                                size="medium"
                                disabled={isSubmitting}
                                value={item.item_id}
                                options={partOptions}
                                onChange={(val) =>
                                  handleItemChange(item.id, "item_id", val)
                                }
                                placeholder="Search inventory parts..."
                              />
                            )}
                          </div>

                          {/* Quantity & Discount */}
                          <div className="flex items-center justify-between gap-2 sm:gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t border-slate-100 dark:border-slate-700/50 lg:border-none mt-1 lg:mt-0">
                            <div className="flex-1 lg:flex-none lg:w-20">
                              <input
                                type="number"
                                min="1"
                                required
                                disabled={isSubmitting}
                                aria-label={`Line ${index + 1} quantity`}
                                title="Quantity"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-full py-3 lg:py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-mono tabular-nums font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div className="flex-1 lg:flex-none lg:w-32 relative">
                              <span
                                aria-hidden="true"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold pointer-events-none"
                              >
                                ₱
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={isSubmitting}
                                aria-label={`Line ${index + 1} discount amount`}
                                title="Discount Amount (₱)"
                                placeholder="Disc."
                                value={item.discount}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "discount",
                                    e.target.value,
                                  )
                                }
                                className="w-full pl-7 pr-3 py-3 lg:py-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              disabled={
                                formData.items.length === 1 || isSubmitting
                              }
                              title="Remove Line Item"
                              aria-label={`Remove line item ${index + 1}`}
                              className="p-3 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={addLineItem}
                      className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-center w-full sm:w-auto gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-4 py-3 sm:py-2.5 rounded-xl transition-colors border border-dashed border-blue-200 dark:border-blue-500/30 cursor-pointer"
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Add Another Row</span>
                    </button>
                  </section>

                  {/* SECTION 3: Document Footer (Notes & Summary) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 relative z-[40]">
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-2 flex items-center gap-2">
                        <ClipboardList size={14} aria-hidden="true" /> Terms &
                        Notes
                      </h3>
                      <div>
                        <label htmlFor={notesInputId} className="form-label">
                          Internal Notes
                        </label>
                        <textarea
                          id={notesInputId}
                          name="notes"
                          disabled={isSubmitting}
                          value={formData.notes}
                          onChange={handleHeaderChange}
                          rows={3}
                          className="form-textarea resize-none font-medium"
                          placeholder="Hidden from customer..."
                        />
                      </div>
                      <div>
                        <label htmlFor={termsInputId} className="form-label">
                          Terms & Conditions
                        </label>
                        <textarea
                          id={termsInputId}
                          name="terms_conditions"
                          disabled={isSubmitting}
                          value={formData.terms_conditions}
                          onChange={handleHeaderChange}
                          rows={3}
                          className="form-textarea resize-none font-medium"
                        />
                      </div>
                    </section>

                    {/* Financial Summary Preview */}
                    <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10 flex flex-col justify-center">
                      <div className="space-y-2 mb-4 text-xs sm:text-sm font-medium text-slate-400">
                        <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span>Subtotal (Gross)</span>
                          <span className="font-bold text-slate-200 font-mono tabular-nums">
                            ₱{formatCurrency(preview.subtotal)}
                          </span>
                        </div>

                        {preview.discountTotal > 0 && (
                          <div className="flex justify-between items-center bg-amber-500/10 p-3 sm:p-4 rounded-xl text-amber-400 border border-amber-500/20">
                            <span className="font-bold">Total Discounts</span>
                            <span className="font-black font-mono tabular-nums">
                              - ₱{formatCurrency(preview.discountTotal)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span className="flex items-center gap-1.5">
                            <span>VAT Amount</span>
                            <span className="text-[10px] font-mono tabular-nums font-black bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                              {(vatRate * 100).toFixed(0)}%
                            </span>
                          </span>
                          <span className="font-bold text-slate-200 font-mono tabular-nums">
                            ₱{formatCurrency(preview.vatAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 sm:pt-5 mt-2 border-t border-slate-700/60 gap-3">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                          ₱{formatCurrency(preview.grandTotal)}
                        </span>
                      </div>
                    </section>
                  </div>
                </form>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
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
                form="estimateForm"
                disabled={isSubmitting || isLoadingCatalogs}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Calculator size={16} aria-hidden="true" />
                )}
                <span>
                  {initialData
                    ? "Update Quotation"
                    : "Generate Official Estimate"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EstimateModal;

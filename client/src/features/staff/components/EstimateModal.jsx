import React, { useState, useEffect, useRef } from "react";
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

  const inputPadding =
    size === "large" ? "py-3.5 sm:py-4 pl-11" : "py-2.5 pl-9";
  const iconLeft = size === "large" ? "left-4" : "left-3";
  const iconSize = size === "large" ? 16 : 14;
  const listPadding = size === "large" ? "p-4" : "p-3";
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
          className={`absolute inset-y-0 ${iconLeft} flex items-center pointer-events-none`}
        >
          <Search size={iconSize} className="text-slate-400" />
        </div>
        <input
          type="text"
          className={`w-full pr-4 ${inputPadding} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm disabled:opacity-50`}
          placeholder={placeholder}
          value={isOpen ? searchTerm : value ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
        />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={`absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${roundedBox} shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-50`}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setSearchTerm(opt.label);
                    setIsOpen(false);
                  }}
                  className={`${listPadding} hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {opt.label}
                  </p>
                  {opt.sublabel && (
                    <p className="text-[9px] font-black text-amber-500 tracking-widest uppercase mt-0.5 truncate">
                      {opt.sublabel}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-5 text-center text-xs font-medium text-slate-500 uppercase tracking-widest">
                No matching records found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EstimateModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

  // Master Catalogs
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [vatRate, setVatRate] = useState(0.12);

  const defaultValidUntil = new Date();
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

  const [formData, setFormData] = useState({
    customer_id: "",
    valid_until: defaultValidUntil.toISOString().split("T")[0],
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
    if (isOpen) {
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
          setCustomers(custRes.data?.customers || []);
          setServices(servRes.data?.data || []);
          setParts(partRes.data?.data || []);
          setVatRate(parseFloat(setRes.data?.data?.vat_percentage || 12) / 100);

          if (initialData) {
            setFormData({
              customer_id: initialData.customer_id.toString(),
              valid_until: initialData.valid_until.split("T")[0],
              notes: initialData.notes || "",
              terms_conditions: initialData.terms_conditions || "",
              items: initialData.items.map((i, idx) => ({
                id: Date.now() + idx,
                line_type: i.line_type,
                service_id: i.service_id ? i.service_id.toString() : "",
                item_id: i.item_id ? i.item_id.toString() : "",
                quantity: i.quantity,
                discount: parseFloat(i.discount_amount),
              })),
            });
          } else {
            setFormData({
              customer_id: "",
              valid_until: defaultValidUntil.toISOString().split("T")[0],
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
          setValidationError("Failed to load system catalogs. Please refresh.");
        } finally {
          setIsLoadingCatalogs(false);
        }
      };
      fetchCatalogs();
      setValidationError("");
    }
  }, [isOpen, initialData]);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
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
    setFormData((prev) => {
      let newItems = [...prev.items];
      const itemIndex = newItems.findIndex((i) => i.id === id);

      if (itemIndex > -1) {
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };

        if (field === "line_type") {
          newItems[itemIndex].service_id = "";
          newItems[itemIndex].item_id = "";
        }

        if (field === "service_id" && value) {
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

            const newRows = partsToAdd.map((p, idx) => ({
              id: Date.now() + idx + 1,
              line_type: "PART",
              service_id: "",
              item_id: p.id.toString(),
              quantity: 1,
              discount: 0,
            }));

            newItems.splice(itemIndex + 1, 0, ...newRows);
          }
        }
      }

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
          price = parseFloat(s.price);
          isVatable = s.is_vatable;
        }
      } else if (item.line_type === "PART" && item.item_id) {
        const p = parts.find(
          (x) => x.id.toString() === item.item_id.toString(),
        );
        if (p) {
          price = parseFloat(p.selling_price);
          isVatable = true;
        }
      }

      const lineGross = price * (parseFloat(item.quantity) || 1);
      const lineDisc = parseFloat(item.discount) || 0;
      const lineNet = lineGross - lineDisc > 0 ? lineGross - lineDisc : 0;

      subtotal += lineNet;
      discountTotal += lineDisc;
      if (isVatable) vatableSubtotal += lineNet;
    });

    const vatAmount = vatableSubtotal * vatRate;
    return {
      subtotal,
      discountTotal,
      vatAmount,
      grandTotal: subtotal + vatAmount,
    };
  };

  const preview = calculatePreview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.customer_id)
      return setValidationError("Please select a valid customer.");
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

    const payload = {
      customer_id: parseInt(formData.customer_id, 10),
      valid_until: formData.valid_until,
      notes: formData.notes,
      terms_conditions: formData.terms_conditions,
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
      setValidationError(error.message);
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
    sublabel: `[${s.service_code}] ₱${s.price}`,
  }));

  const partOptions = parts.map((p) => ({
    id: p.id,
    label: p.item_name,
    sublabel: `[${p.sku}] ₱${p.selling_price} | Stock: ${p.total_company_quantity}`,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {initialData ? `Edit Estimate` : "Build Estimate"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Pre-Sales Quotation Matrix
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
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

              {isLoadingCatalogs ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Syncing Master Catalogs...
                  </p>
                </div>
              ) : (
                <form
                  id="estimateForm"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* SECTION 1: Document Header Metadata */}
                  <section className="relative z-[60] bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                      <User size={14} /> Document Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Target Customer{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                          size="large"
                          value={formData.customer_id}
                          options={customerOptions}
                          onChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              customer_id: val,
                            }))
                          }
                          placeholder="Search customer by name or phone..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Quotation Valid Until{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="date"
                          name="valid_until"
                          value={formData.valid_until}
                          onChange={handleHeaderChange}
                          className="w-full px-4 py-3.5 sm:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 shadow-sm transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: Line Items Matrix */}
                  <section className="relative z-[50] bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <Calculator size={14} /> Itemized Breakdown
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div
                          key={item.id}
                          style={{ zIndex: 50 - index }}
                          className="flex flex-col lg:flex-row gap-3 p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] sm:rounded-[20px] relative group shadow-sm"
                        >
                          <div className="w-full lg:w-36 shrink-0">
                            <select
                              value={item.line_type}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "line_type",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500"
                            >
                              <option value="SERVICE">Labor / Service</option>
                              <option value="PART">Physical Part</option>
                            </select>
                          </div>

                          <div className="flex-1 min-w-0 relative">
                            {item.line_type === "SERVICE" ? (
                              <SearchableSelect
                                size="medium"
                                value={item.service_id}
                                options={serviceOptions}
                                onChange={(val) =>
                                  handleItemChange(item.id, "service_id", val)
                                }
                                placeholder="Search labor or service..."
                              />
                            ) : (
                              <SearchableSelect
                                size="medium"
                                value={item.item_id}
                                options={partOptions}
                                onChange={(val) =>
                                  handleItemChange(item.id, "item_id", val)
                                }
                                placeholder="Search inventory parts..."
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
                            <div className="w-24">
                              <input
                                type="number"
                                min="1"
                                required
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div className="w-28 relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                ₱
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Disc."
                                value={item.discount}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "discount",
                                    e.target.value,
                                  )
                                }
                                className="w-full pl-6 p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg sm:rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              disabled={formData.items.length === 1}
                              className="p-2.5 sm:p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-colors disabled:opacity-30"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addLineItem}
                      className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-center w-full sm:w-auto gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-4 py-2.5 rounded-xl transition-colors border border-dashed border-blue-200 dark:border-blue-500/30"
                    >
                      <Plus size={14} /> Add Another Row
                    </button>
                  </section>

                  {/* SECTION 3: Document Footer (Notes & Summary) */}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-[40]">
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                        <ClipboardList size={14} /> Terms & Notes
                      </h3>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Internal Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleHeaderChange}
                          rows="2"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none focus:outline-none focus:border-amber-500"
                          placeholder="Hidden from customer..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Terms & Conditions
                        </label>
                        <textarea
                          name="terms_conditions"
                          value={formData.terms_conditions}
                          onChange={handleHeaderChange}
                          rows="2"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </section>

                    {/* Financial Summary Preview */}
                    <section className="bg-slate-900 dark:bg-black rounded-[24px] p-5 sm:p-6 text-white shadow-xl flex flex-col justify-center">
                      <div className="space-y-2 mb-4 text-sm font-medium text-slate-400">
                        <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 rounded-lg">
                          <span>Subtotal</span>
                          <span className="font-bold text-slate-200">
                            ₱
                            {preview.subtotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {preview.discountTotal > 0 && (
                          <div className="flex justify-between items-center bg-amber-500/10 p-3 rounded-lg text-amber-500">
                            <span className="font-bold">Total Discounts</span>
                            <span className="font-black">
                              - ₱
                              {preview.discountTotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 rounded-lg">
                          <span className="flex items-center gap-1.5">
                            VAT Segment{" "}
                            <span className="text-[10px] font-black bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                              {(vatRate * 100).toFixed(0)}%
                            </span>
                          </span>
                          <span className="font-bold text-slate-200">
                            ₱
                            {preview.vatAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-700/50">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight">
                          ₱
                          {preview.grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </section>
                  </div>
                </form>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="estimateForm"
                disabled={isSubmitting || isLoadingCatalogs}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Calculator size={16} />
                )}
                {initialData
                  ? "Update Quotation"
                  : "Generate Official Estimate"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EstimateModal;

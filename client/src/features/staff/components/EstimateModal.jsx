import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { customerService } from "../../../services/staff/customer.service";
import api from "../../../services/api";

const EstimateModal = ({ isOpen, onClose, onSubmit }) => {
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
            customerService.getCustomers(1, 200, "", "active", "all"),
            api.get("/staff/services", {
              params: { page: 1, limit: 200, status: "active" },
            }),
            api.get("/staff/inventory", {
              params: { page: 1, limit: 200, status: "active" },
            }),
            api.get("/staff/settings"),
          ]);

          setCustomers(custRes.data?.customers || []);
          setServices(servRes.data?.data || []);
          setParts(partRes.data?.data || []);
          setVatRate(parseFloat(setRes.data?.data?.vat_percentage || 12) / 100);
        } catch (error) {
          console.error(error);
          setValidationError("Failed to load system catalogs. Please refresh.");
        } finally {
          setIsLoadingCatalogs(false);
        }
      };
      fetchCatalogs();

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
      setValidationError("");
    }
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Build Estimate
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
                  className="space-y-8"
                >
                  {/* Document Header Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 dark:bg-black/10 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Target Customer <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="customer_id"
                        value={formData.customer_id}
                        onChange={handleHeaderChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                      >
                        <option value="">-- Select Active Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name} ({c.contact_number})
                          </option>
                        ))}
                      </select>
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Line Items Matrix */}
                  <div>
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <Calculator size={16} /> Itemized Breakdown
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {formData.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col lg:flex-row gap-3 p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative group"
                        >
                          {/* Item Type Selector */}
                          <div className="w-full lg:w-32 shrink-0">
                            <select
                              value={item.line_type}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "line_type",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
                            >
                              <option value="SERVICE">Labor / Service</option>
                              <option value="PART">Physical Part</option>
                            </select>
                          </div>

                          {/* Dynamic Catalog Search/Select */}
                          <div className="flex-1 min-w-0">
                            {item.line_type === "SERVICE" ? (
                              <select
                                required
                                value={item.service_id}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "service_id",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                              >
                                <option value="">-- Select Service --</option>
                                {services.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    [{s.service_code}] {s.service_name} - ₱
                                    {s.price}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                required
                                value={item.item_id}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "item_id",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                              >
                                <option value="">
                                  -- Select Inventory Part --
                                </option>
                                {parts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    [{p.sku}] {p.item_name} - ₱{p.selling_price}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Quantity & Discount */}
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
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-center text-slate-900 dark:text-white"
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
                                className="w-full pl-6 p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              disabled={formData.items.length === 1}
                              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30"
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
                      className="mt-3 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Plus size={14} /> Add Another Row
                    </button>
                  </div>

                  {/* Document Footer (Notes & Math) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Internal Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleHeaderChange}
                          rows="2"
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none"
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
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none"
                        />
                      </div>
                    </div>

                    {/* Financial Summary Preview */}
                    <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 sm:p-6 text-white shadow-xl">
                      <div className="flex justify-between items-center mb-1 text-sm font-medium text-slate-400">
                        <span>Subtotal</span>
                        <span>
                          ₱
                          {preview.subtotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {preview.discountTotal > 0 && (
                        <div className="flex justify-between items-center mb-1 text-sm font-bold text-amber-500">
                          <span>Discounts</span>
                          <span>
                            - ₱
                            {preview.discountTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-4 text-sm font-medium text-slate-400">
                        <span className="flex items-center gap-1.5">
                          VAT{" "}
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                            {(vatRate * 100).toFixed(0)}%
                          </span>
                        </span>
                        <span>
                          ₱
                          {preview.vatAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-white">
                          ₱
                          {preview.grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="submit"
                form="estimateForm"
                disabled={isSubmitting || isLoadingCatalogs}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Calculator size={16} />
                )}
                Generate Official Estimate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EstimateModal;

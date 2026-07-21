import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Send,
  Save,
  Calculator,
} from "lucide-react";
import { vendorService } from "../../../services/staff/vendor.service";
import { catalogService } from "../../../services/staff/catalog.service";

const PurchaseOrderModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Master Lookup Arrays
  const [vendors, setVendors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [systemVatRate, setSystemVatRate] = useState(0.12);

  const [formData, setFormData] = useState({
    vendor_id: "",
    expected_delivery_date: "",
    notes: "",
    items: [],
  });

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      const fetchDependencies = async () => {
        setLoadingLookups(true);
        try {
          const [venRes, invRes, setRes] = await Promise.all([
            vendorService.getVendors(1, 500, "", "active", "all", "all"),
            catalogService.getInventoryCatalog(
              1,
              1000,
              "",
              "all",
              "all",
              "active",
            ),
            catalogService.getSettings(),
          ]);
          setVendors(venRes.data?.vendors || []);
          setInventory(invRes.data || []);
          setSystemVatRate(parseFloat(setRes.data?.vat_percentage || 12) / 100);
        } catch (error) {
          setValidationError(
            "Failed to load required system data. Please refresh.",
          );
        } finally {
          setLoadingLookups(false);
        }
      };

      fetchDependencies();

      if (initialData) {
        setFormData({
          vendor_id: initialData.vendor_id || "",

          expected_delivery_date: initialData.expected_delivery_date
            ? (() => {
                const d = new Date(initialData.expected_delivery_date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
              })()
            : "",
          notes: initialData.notes || "",
          items: initialData.items.map((i) => ({
            id: Math.random().toString(36).substr(2, 9),
            item_id: i.item_id || "",
            quantity: i.quantity,
            recorded_unit_cost: parseFloat(i.recorded_unit_cost),
            discount_amount: parseFloat(i.discount_amount),
          })),
        });
      } else {
        setFormData({
          vendor_id: "",
          expected_delivery_date: "",
          notes: "",
          items: [
            {
              id: "init-1",
              item_id: "",
              quantity: 1,
              recorded_unit_cost: 0,
              discount_amount: 0,
            },
          ],
        });
      }
    }
  }, [isOpen, initialData]);

  // Handle generic inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Matrix Row Modifiers
  const addPartRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Math.random().toString(36).substr(2, 9),
          item_id: "",
          quantity: 1,
          recorded_unit_cost: 0,
          discount_amount: 0,
        },
      ],
    }));
  };

  const removeRow = (id) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  const handleRowChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Auto-populate cost if a master part is selected
          if (field === "item_id" && value !== "") {
            const selectedPart = inventory.find(
              (i) => i.id.toString() === value.toString(),
            );
            if (selectedPart)
              updatedItem.recorded_unit_cost = parseFloat(
                selectedPart.unit_cost,
              );
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  // Real-Time Financial Preview Engine
  const calculatePreview = () => {
    const selectedVendor = vendors.find(
      (v) => v.id.toString() === formData.vendor_id.toString(),
    );
    const isVatRegistered = selectedVendor
      ? selectedVendor.is_vat_registered
      : false;

    let grossSubtotal = 0;
    let discountTotal = 0;

    formData.items.forEach((item) => {
      const cost = parseFloat(item.recorded_unit_cost) || 0;
      const qty = parseInt(item.quantity) || 0;
      const disc = parseFloat(item.discount_amount) || 0;

      grossSubtotal += cost * qty;
      discountTotal += disc;
    });

    const netSubtotal = Math.max(0, grossSubtotal - discountTotal);
    const vatAmount = isVatRegistered ? netSubtotal * systemVatRate : 0;

    return {
      grossSubtotal,
      discountTotal,
      netSubtotal,
      vatAmount,
      grandTotal: netSubtotal + vatAmount,
      isVatRegistered,
    };
  };

  const preview = calculatePreview();

  const handleFormSubmit = async (e, isSubmittingForApproval) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.vendor_id)
      return setValidationError("A vendor must be selected.");
    if (formData.items.length === 0)
      return setValidationError("At least one item must be added.");

    for (const item of formData.items) {
      if (!item.item_id)
        return setValidationError(
          "All rows must have an inventory item selected.",
        );
      if (item.quantity <= 0)
        return setValidationError("Quantity must be greater than zero.");
      if (item.recorded_unit_cost < 0)
        return setValidationError("Unit cost cannot be negative.");
      if (item.discount_amount > item.quantity * item.recorded_unit_cost)
        return setValidationError("Discount cannot exceed line item total.");
    }

    const payload = {
      vendor_id: parseInt(formData.vendor_id, 10),
      expected_delivery_date: formData.expected_delivery_date,
      notes: formData.notes,
      is_submitting: isSubmittingForApproval,
      items: formData.items.map((i) => ({
        item_id: parseInt(i.item_id, 10),
        quantity: parseInt(i.quantity, 10),
        recorded_unit_cost: parseFloat(i.recorded_unit_cost),
        discount_amount: parseFloat(i.discount_amount),
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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  {initialData ? (
                    <Edit2 size={20} />
                  ) : (
                    <ShoppingCart size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {initialData ? "Update Document" : "Draft Purchase Order"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Physical Parts Procurement
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

              {loadingLookups ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Loading Catalog & Suppliers...
                  </p>
                </div>
              ) : (
                <form id="poForm" className="space-y-8">
                  {/* Top Meta Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 dark:bg-black/10 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Target Vendor <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="vendor_id"
                        value={formData.vendor_id}
                        onChange={handleChange}
                        disabled={!!initialData}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                      >
                        <option value="">-- Select Active Vendor --</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            [{v.vendor_code}] {v.business_name}
                          </option>
                        ))}
                      </select>
                      {formData.vendor_id && (
                        <p
                          className={`text-[9px] font-bold tracking-widest uppercase mt-2 ${preview.isVatRegistered ? "text-emerald-500" : "text-slate-400"}`}
                        >
                          {preview.isVatRegistered
                            ? `VAT Registered (System Rate: ${(systemVatRate * 100).toFixed(0)}%)`
                            : "Non-VAT Entity"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Expected Delivery Date{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        name="expected_delivery_date"
                        value={formData.expected_delivery_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Procurement Line Items */}
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <Calculator size={16} /> Itemized Parts Breakdown
                      </h3>
                      <button
                        type="button"
                        onClick={addPartRow}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      >
                        <Plus size={12} /> Add Part
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col lg:flex-row gap-3 p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl relative group"
                        >
                          {/* Item/Description Input */}
                          <div className="w-full lg:w-[45%] shrink-0">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                              Master Inventory Item
                            </label>
                            <select
                              required
                              value={item.item_id}
                              onChange={(e) =>
                                handleRowChange(
                                  item.id,
                                  "item_id",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- Select Master Part --</option>
                              {inventory.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  [{inv.sku}] {inv.item_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 flex-1 min-w-0">
                            {/* Cost Input */}
                            <div className="flex-1 min-w-[100px]">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                Unit Cost
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                  ₱
                                </span>
                                <input
                                  required
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.recorded_unit_cost}
                                  onChange={(e) =>
                                    handleRowChange(
                                      item.id,
                                      "recorded_unit_cost",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full pl-6 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Qty Input */}
                            <div className="w-20 shrink-0">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 text-center">
                                Qty
                              </label>
                              <input
                                required
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleRowChange(
                                    item.id,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            {/* Discount Input */}
                            <div className="w-28 shrink-0">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                Discount
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                  ₱
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Disc."
                                  value={item.discount_amount}
                                  onChange={(e) =>
                                    handleRowChange(
                                      item.id,
                                      "discount_amount",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full pl-6 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs font-mono text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => removeRow(item.id)}
                              disabled={formData.items.length === 1}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 mb-0.5"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Footer (Notes & Math) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Shipping Notes / Instructions{" "}
                          <span className="text-slate-400 font-medium lowercase">
                            (Optional)
                          </span>
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          rows="3"
                          placeholder="e.g., Urgent delivery required for weekend repair job."
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>

                    {/* Financial Summary Preview */}
                    <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 sm:p-6 text-white shadow-xl">
                      <div className="flex justify-between items-center mb-1 text-sm font-medium text-slate-400">
                        <span>Subtotal</span>
                        <span>
                          ₱
                          {preview.grossSubtotal.toLocaleString(undefined, {
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
                            {preview.isVatRegistered
                              ? `${(systemVatRate * 100).toFixed(0)}%`
                              : "Exempt"}
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
                        <span className="text-2xl sm:text-3xl font-black text-amber-500">
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

            {/* Footer with Dual Submission Paths */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, false)}
                disabled={isSubmitting || loadingLookups}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}{" "}
                Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, true)}
                disabled={isSubmitting || loadingLookups}
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}{" "}
                Submit for Approval
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseOrderModal;

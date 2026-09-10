import React, { useState, useEffect, useRef } from "react";
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
  User,
  ClipboardList,
  Search,
} from "lucide-react";
import { vendorService } from "../../../services/staff/vendor.service";
import { catalogService } from "../../../services/staff/catalog.service";

// ==========================================
// REUSABLE SUB-COMPONENT: Vendor Searchable Dropdown
// ==========================================
const VendorSearchableSelect = ({ value, vendors, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const selected = vendors.find(
        (v) => v.id.toString() === value.toString(),
      );
      if (selected) setSearchTerm(selected.business_name);
    } else {
      setSearchTerm("");
    }
  }, [value, vendors]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        const selected = vendors.find(
          (v) => v.id.toString() === value?.toString(),
        );
        setSearchTerm(selected ? selected.business_name : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, vendors]);

  const filtered = vendors.filter(
    (v) =>
      v.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div ref={wrapperRef} className="relative z-50">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : value ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Type Vendor Name or ID to search..."
          className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm disabled:opacity-60"
        />
      </div>
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-[100]"
          >
            {filtered.length > 0 ? (
              filtered.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    onChange(v.id);
                    setSearchTerm(v.business_name);
                    setIsOpen(false);
                  }}
                  className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                >
                  <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                    {v.vendor_code}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {v.business_name}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                  No matching vendors found.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// REUSABLE SUB-COMPONENT: Item Searchable Dropdown
// ==========================================
const ItemSearchableSelect = ({ value, inventory, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const selected = inventory.find(
        (i) => i.id.toString() === value.toString(),
      );
      if (selected) setSearchTerm(`[${selected.sku}] ${selected.item_name}`);
    } else {
      setSearchTerm("");
    }
  }, [value, inventory]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        const selected = inventory.find(
          (i) => i.id.toString() === value?.toString(),
        );
        setSearchTerm(
          selected ? `[${selected.sku}] ${selected.item_name}` : "",
        );
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, inventory]);

  const filtered = inventory.filter(
    (i) =>
      i.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div ref={wrapperRef} className="relative z-50 w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={14} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={isOpen ? searchTerm : value ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search parts by name or SKU..."
          className="w-full pl-9 pr-3 py-3 lg:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl lg:rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm"
        />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-60 sm:max-h-64 overflow-y-auto custom-scrollbar z-[100]"
          >
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setSearchTerm(`[${item.sku}] ${item.item_name}`);
                    setIsOpen(false);
                  }}
                  className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                >
                  <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase truncate">
                    {item.sku}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {item.item_name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium tracking-widest uppercase truncate">
                    Stock Snapshot:{" "}
                    <span className="font-black text-slate-700 dark:text-slate-300">
                      {item.total_company_quantity} {item.uom}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 sm:p-6 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  No matching parts found.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MAIN MODAL COMPONENT
// ==========================================
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
            vendorService.getActiveLookup(),
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
          setVendors(venRes.data || []);
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  {initialData ? (
                    <Edit2 size={20} />
                  ) : (
                    <ShoppingCart size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-none">
                    {initialData ? "Update Document" : "Draft Purchase Order"}
                  </h2>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Physical Parts Procurement
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
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
                <form id="poForm" className="space-y-6 sm:space-y-8 pb-4">
                  {/* Top Meta Data */}
                  <section className="relative z-[60] bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                      <User size={14} /> Document Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative">
                      <div className="relative z-30">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Target Vendor <span className="text-red-500">*</span>
                        </label>

                        {/* 1. Custom Vendor Searchable Select */}
                        <VendorSearchableSelect
                          value={formData.vendor_id}
                          vendors={vendors}
                          onChange={(val) =>
                            handleChange({
                              target: { name: "vendor_id", value: val },
                            })
                          }
                          disabled={!!initialData}
                        />

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
                          min={(() => {
                            const d = new Date();
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${year}-${month}-${day}`;
                          })()}
                          onChange={handleChange}
                          className="w-full px-4 py-3 sm:py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Procurement Line Items */}
                  <section className="relative z-[50] bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <Calculator size={14} /> Itemized Parts Breakdown
                      </h3>
                    </div>

                    <div className="space-y-4 sm:space-y-3">
                      {formData.items.map((item, index) => (
                        <div
                          key={item.id}
                          style={{ zIndex: 50 - index }}
                          className="flex flex-col lg:flex-row gap-4 p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] sm:rounded-[20px] relative group shadow-sm"
                        >
                          {/* 2. Custom Item Searchable Select */}
                          <div className="flex-1 min-w-0 relative">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                              Master Inventory Item
                            </label>
                            <ItemSearchableSelect
                              value={item.item_id}
                              inventory={inventory}
                              onChange={(val) =>
                                handleRowChange(item.id, "item_id", val)
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:flex sm:items-end gap-3 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t border-slate-100 dark:border-slate-700/50 lg:border-none mt-2 lg:mt-0">
                            {/* Cost Input */}
                            <div className="col-span-1 sm:w-28 relative">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                Unit Cost
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 lg:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
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
                                  className="w-full pl-7 px-3 py-3 lg:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl lg:rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Qty Input */}
                            <div className="col-span-1 sm:w-20">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 text-center sm:text-left">
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
                                className="w-full py-3 lg:py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl lg:rounded-lg text-xs font-mono text-center sm:text-left text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            {/* Discount Input */}
                            <div className="col-span-1 sm:w-28 relative">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                                Discount
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 lg:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
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
                                  className="w-full pl-7 py-3 lg:py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl lg:rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Delete Action */}
                            <div className="col-span-1 sm:w-auto flex justify-end sm:pt-[18px]">
                              <button
                                type="button"
                                onClick={() => removeRow(item.id)}
                                disabled={formData.items.length === 1}
                                className="w-full sm:w-auto p-3 flex items-center justify-center bg-slate-50 dark:bg-slate-900 sm:bg-transparent border border-slate-200 dark:border-slate-600 sm:border-none text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-500/10 rounded-xl lg:rounded-lg transition-colors disabled:opacity-30 lg:mb-0.5"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addPartRow}
                      className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center justify-center w-full sm:w-auto gap-1.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-4 py-3 sm:py-2.5 rounded-xl transition-colors border border-dashed border-amber-200 dark:border-amber-500/30"
                    >
                      <Plus size={14} /> Add Another Row
                    </button>
                  </section>

                  {/* Document Footer (Notes & Math) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700 relative z-[40]">
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                        <ClipboardList size={14} /> Shipping Notes
                      </h3>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Internal Notes{" "}
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
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none shadow-sm transition-all"
                        />
                      </div>
                    </section>

                    {/* Financial Summary Preview */}
                    <div className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl flex flex-col justify-center">
                      <div className="space-y-2 mb-5 text-sm font-medium text-slate-400">
                        <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span>Subtotal (Gross)</span>
                          <span className="font-bold text-slate-200 font-mono">
                            ₱
                            {preview.grossSubtotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        {preview.discountTotal > 0 && (
                          <div className="flex justify-between items-center bg-amber-500/10 p-3 sm:p-4 rounded-xl text-amber-500">
                            <span className="font-bold">Total Discounts</span>
                            <span className="font-black font-mono">
                              - ₱
                              {preview.discountTotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span className="flex items-center gap-1.5">
                            VAT Allocation{" "}
                            <span className="text-[10px] font-black bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                              {preview.isVatRegistered
                                ? `${(systemVatRate * 100).toFixed(0)}%`
                                : "Exempt"}
                            </span>
                          </span>
                          <span className="font-bold text-slate-200 font-mono">
                            ₱
                            {preview.vatAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/50 mt-auto">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
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
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, false)}
                disabled={isSubmitting || loadingLookups}
                className="flex-1 py-3.5 sm:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
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
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
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

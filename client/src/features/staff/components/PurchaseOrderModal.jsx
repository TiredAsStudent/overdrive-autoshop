import React, { useState, useEffect, useRef, useId } from "react";
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

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ==========================================
// REUSABLE SUB-COMPONENT: Vendor Searchable Dropdown
// ==========================================
const VendorSearchableSelect = ({ id, value, vendors, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const listboxId = useId();

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

  const query = searchTerm.toLowerCase();
  const filtered = vendors.filter(
    (v) =>
      (v.business_name || "").toLowerCase().includes(query) ||
      (v.vendor_code || "").toLowerCase().includes(query),
  );

  return (
    <div ref={wrapperRef} className="relative z-50">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
        >
          <Search size={16} className="text-slate-400" />
        </div>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
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
          placeholder="Type Vendor Name or ID to search..."
          className="form-input pl-10"
        />
      </div>
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-[100]"
          >
            {filtered.length > 0 ? (
              filtered.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="option"
                  aria-selected={value?.toString() === v.id.toString()}
                  onClick={() => {
                    onChange(v.id);
                    setSearchTerm(v.business_name);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                >
                  <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                    {v.vendor_code}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {v.business_name}
                  </p>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
const ItemSearchableSelect = ({
  id,
  value,
  inventory,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const listboxId = useId();

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

  const query = searchTerm.toLowerCase();
  const filtered = inventory.filter(
    (i) =>
      (i.item_name || "").toLowerCase().includes(query) ||
      (i.sku || "").toLowerCase().includes(query),
  );

  return (
    <div ref={wrapperRef} className="relative z-50 w-full">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
        >
          <Search size={14} className="text-slate-400" />
        </div>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
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
          placeholder="Search parts by name or SKU..."
          className="form-input pl-9 py-2.5 bg-slate-50 dark:bg-slate-900"
        />
      </div>
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-60 sm:max-h-64 overflow-y-auto custom-scrollbar z-[100]"
          >
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={value?.toString() === item.id.toString()}
                  onClick={() => {
                    onChange(item.id);
                    setSearchTerm(`[${item.sku}] ${item.item_name}`);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                >
                  <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase truncate">
                    {item.sku}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {item.item_name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-medium tracking-widest uppercase truncate">
                    <span>Stock Snapshot:</span>
                    <span className="font-mono tabular-nums font-black text-slate-800 dark:text-slate-200">
                      {item.total_company_quantity} {item.uom}
                    </span>
                  </p>
                </button>
              ))
            ) : (
              <div className="p-5 sm:p-6 text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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

  // Accessible IDs
  const modalTitleId = useId();
  const vendorInputId = useId();
  const deliveryDateInputId = useId();
  const notesInputId = useId();

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
          if (!isMounted) return;
          setVendors(venRes.data || []);
          setInventory(invRes.data || []);
          setSystemVatRate(parseFloat(setRes.data?.vat_percentage || 12) / 100);
        } catch {
          if (isMounted) {
            setValidationError(
              "Failed to load required system data. Please refresh.",
            );
          }
        } finally {
          if (isMounted) setLoadingLookups(false);
        }
      };

      fetchDependencies();

      if (initialData) {
        setFormData({
          vendor_id: initialData.vendor_id || "",
          expected_delivery_date: initialData.expected_delivery_date
            ? (() => {
                const datePart = String(
                  initialData.expected_delivery_date,
                ).split("T")[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
                const d = new Date(initialData.expected_delivery_date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
              })()
            : "",
          notes: initialData.notes || "",
          items: (initialData.items || []).map((i) => ({
            id: Math.random().toString(36).slice(2, 11),
            item_id: i.item_id || "",
            quantity: i.quantity,
            recorded_unit_cost: parseFloat(i.recorded_unit_cost) || 0,
            discount_amount: parseFloat(i.discount_amount) || 0,
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

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData]);

  // Handle generic inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Matrix Row Modifiers
  const addPartRow = () => {
    setValidationError("");
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Math.random().toString(36).slice(2, 11),
          item_id: "",
          quantity: 1,
          recorded_unit_cost: 0,
          discount_amount: 0,
        },
      ],
    }));
  };

  const removeRow = (id) => {
    setValidationError("");
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  const handleRowChange = (id, field, value) => {
    setValidationError("");
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
            if (selectedPart) {
              updatedItem.recorded_unit_cost =
                parseFloat(selectedPart.unit_cost) || 0;
            }
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
      const qty = parseInt(item.quantity, 10) || 0;
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

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleFormSubmit = async (e, isSubmittingForApproval) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.vendor_id)
      return setValidationError("A target vendor must be selected.");
    if (!formData.expected_delivery_date)
      return setValidationError("Expected delivery date is required.");
    if (formData.items.length === 0)
      return setValidationError("At least one item must be added.");

    for (const item of formData.items) {
      if (!item.item_id)
        return setValidationError(
          "All rows must have an inventory item selected.",
        );
      if ((parseInt(item.quantity, 10) || 0) <= 0)
        return setValidationError("Quantity must be greater than zero.");
      if ((parseFloat(item.recorded_unit_cost) || 0) < 0)
        return setValidationError("Unit cost cannot be negative.");
      if (
        (parseFloat(item.discount_amount) || 0) >
        (parseInt(item.quantity, 10) || 0) *
          (parseFloat(item.recorded_unit_cost) || 0)
      )
        return setValidationError("Discount cannot exceed line item total.");
    }

    const payload = {
      vendor_id: parseInt(formData.vendor_id, 10),
      expected_delivery_date: formData.expected_delivery_date,
      notes: (formData.notes || "").trim(),
      is_submitting: isSubmittingForApproval,
      items: formData.items.map((i) => ({
        item_id: parseInt(i.item_id, 10),
        quantity: parseInt(i.quantity, 10),
        recorded_unit_cost: parseFloat(i.recorded_unit_cost) || 0,
        discount_amount: parseFloat(i.discount_amount) || 0,
      })),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message || "Failed to save purchase order.");
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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  {initialData ? (
                    <Edit2 size={20} />
                  ) : (
                    <ShoppingCart size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {initialData
                      ? `Update ${initialData.purchase_order_number || "Document"}`
                      : "Draft Purchase Order"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Physical Parts Procurement
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close purchase order modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
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

              {loadingLookups ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 opacity-80 text-slate-500 dark:text-slate-400"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-3 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Loading Catalog & Suppliers...
                  </p>
                </div>
              ) : (
                <form
                  id="poForm"
                  onSubmit={(e) => handleFormSubmit(e, true)}
                  className="space-y-6 sm:space-y-8 pb-2"
                >
                  {/* Top Meta Data */}
                  <section className="relative z-[60] bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                      <User size={14} aria-hidden="true" /> Document Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative">
                      <div className="relative z-30">
                        <label htmlFor={vendorInputId} className="form-label">
                          Target Vendor <span className="form-required">*</span>
                        </label>

                        {/* 1. Custom Vendor Searchable Select */}
                        <VendorSearchableSelect
                          id={vendorInputId}
                          value={formData.vendor_id}
                          vendors={vendors}
                          onChange={(val) =>
                            handleChange({
                              target: { name: "vendor_id", value: val },
                            })
                          }
                          disabled={Boolean(initialData) || isSubmitting}
                        />

                        {formData.vendor_id && (
                          <p
                            className={`text-[10px] font-bold tracking-widest uppercase mt-2 ${
                              preview.isVatRegistered
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {preview.isVatRegistered
                              ? `VAT Registered (System Rate: ${(systemVatRate * 100).toFixed(0)}%)`
                              : "Non-VAT Entity"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={deliveryDateInputId}
                          className="form-label"
                        >
                          Expected Delivery Date{" "}
                          <span className="form-required">*</span>
                        </label>
                        <input
                          id={deliveryDateInputId}
                          required
                          type="date"
                          disabled={isSubmitting}
                          name="expected_delivery_date"
                          value={formData.expected_delivery_date}
                          min={initialData ? undefined : getLocalDateString()}
                          onChange={handleChange}
                          className="form-input font-mono tabular-nums cursor-pointer"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Procurement Line Items */}
                  <section className="relative z-[50] bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center gap-2">
                        <Calculator size={14} aria-hidden="true" /> Itemized
                        Parts Breakdown
                      </h3>
                    </div>

                    <div className="space-y-4 sm:space-y-3">
                      {formData.items.map((item, index) => {
                        const partInputId = `po-part-${item.id}`;
                        const costInputId = `po-cost-${item.id}`;
                        const qtyInputId = `po-qty-${item.id}`;
                        const discInputId = `po-disc-${item.id}`;

                        return (
                          <div
                            key={item.id}
                            style={{ zIndex: Math.max(1, 50 - index) }}
                            className="flex flex-col lg:flex-row gap-4 p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-[20px] relative group shadow-xs"
                          >
                            {/* 2. Custom Item Searchable Select */}
                            <div className="flex-1 min-w-0 relative">
                              <label
                                htmlFor={partInputId}
                                className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5"
                              >
                                Master Inventory Item{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <ItemSearchableSelect
                                id={partInputId}
                                value={item.item_id}
                                inventory={inventory}
                                disabled={isSubmitting}
                                onChange={(val) =>
                                  handleRowChange(item.id, "item_id", val)
                                }
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:flex sm:items-end gap-3 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t border-slate-100 dark:border-slate-700/50 lg:border-none mt-2 lg:mt-0">
                              {/* Cost Input */}
                              <div className="col-span-1 sm:w-32 relative">
                                <label
                                  htmlFor={costInputId}
                                  className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5"
                                >
                                  Unit Cost
                                </label>
                                <div className="relative">
                                  <span
                                    aria-hidden="true"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold pointer-events-none"
                                  >
                                    ₱
                                  </span>
                                  <input
                                    id={costInputId}
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                    value={item.recorded_unit_cost}
                                    onChange={(e) =>
                                      handleRowChange(
                                        item.id,
                                        "recorded_unit_cost",
                                        e.target.value,
                                      )
                                    }
                                    className="form-input pl-7 py-2.5 bg-slate-50 dark:bg-slate-900 font-mono tabular-nums"
                                  />
                                </div>
                              </div>

                              {/* Qty Input */}
                              <div className="col-span-1 sm:w-20">
                                <label
                                  htmlFor={qtyInputId}
                                  className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 text-center sm:text-left"
                                >
                                  Qty
                                </label>
                                <input
                                  id={qtyInputId}
                                  required
                                  type="number"
                                  min="1"
                                  step="1"
                                  disabled={isSubmitting}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleRowChange(
                                      item.id,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  className="form-input py-2.5 px-3 bg-slate-50 dark:bg-slate-900 font-mono tabular-nums text-center sm:text-left"
                                />
                              </div>

                              {/* Discount Input */}
                              <div className="col-span-1 sm:w-28 relative">
                                <label
                                  htmlFor={discInputId}
                                  className="block text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5"
                                >
                                  Discount
                                </label>
                                <div className="relative">
                                  <span
                                    aria-hidden="true"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-xs font-mono font-bold pointer-events-none"
                                  >
                                    ₱
                                  </span>
                                  <input
                                    id={discInputId}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                    placeholder="0.00"
                                    value={item.discount_amount}
                                    onChange={(e) =>
                                      handleRowChange(
                                        item.id,
                                        "discount_amount",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full pl-7 py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-mono tabular-nums font-bold text-amber-700 dark:text-overdrive-yellow focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                                  />
                                </div>
                              </div>

                              {/* Delete Action */}
                              <div className="col-span-1 sm:w-auto flex justify-end sm:pt-[18px]">
                                <button
                                  type="button"
                                  onClick={() => removeRow(item.id)}
                                  disabled={
                                    formData.items.length === 1 || isSubmitting
                                  }
                                  title="Remove item row"
                                  aria-label={`Remove row ${index + 1}`}
                                  className="w-full sm:w-auto p-2.5 flex items-center justify-center bg-slate-50 dark:bg-slate-900 sm:bg-transparent border border-slate-200 dark:border-slate-700 sm:border-transparent text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-30"
                                >
                                  <Trash2 size={16} aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={addPartRow}
                      className="mt-4 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center justify-center w-full sm:w-auto gap-1.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-4 py-3 sm:py-2.5 rounded-xl transition-colors border border-dashed border-amber-300 dark:border-amber-500/30 cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Add Another Row</span>
                    </button>
                  </section>

                  {/* Document Footer (Notes & Math) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700 relative z-[40]">
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-2 flex items-center gap-2">
                        <ClipboardList size={14} aria-hidden="true" /> Shipping
                        Notes
                      </h3>
                      <div>
                        <label htmlFor={notesInputId} className="form-label">
                          Internal Notes{" "}
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
                          rows={3}
                          placeholder="e.g., Urgent delivery required for weekend repair job."
                          className="form-textarea resize-none font-medium"
                        />
                      </div>
                    </section>

                    {/* Financial Summary Preview */}
                    <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10 flex flex-col justify-center">
                      <div className="space-y-2 mb-5 text-xs sm:text-sm font-medium text-slate-400">
                        <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                          <span>Subtotal (Gross)</span>
                          <span className="font-bold text-slate-200 font-mono tabular-nums">
                            ₱{formatCurrency(preview.grossSubtotal)}
                          </span>
                        </div>
                        {preview.discountTotal > 0 && (
                          <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-xl text-amber-400 gap-3">
                            <span className="font-bold">Total Discounts</span>
                            <span className="font-black font-mono tabular-nums">
                              - ₱{formatCurrency(preview.discountTotal)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <span>VAT Allocation</span>
                            <span className="text-[10px] font-mono tabular-nums font-black bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                              {preview.isVatRegistered
                                ? `${(systemVatRate * 100).toFixed(0)}%`
                                : "Exempt"}
                            </span>
                          </span>
                          <span className="font-bold text-slate-200 font-mono tabular-nums">
                            ₱{formatCurrency(preview.vatAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/60 mt-auto gap-3">
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

            {/* Footer with Dual Submission Paths */}
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, false)}
                disabled={isSubmitting || loadingLookups}
                className="flex-1 py-3.5 sm:py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
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
                <span>Save as Draft</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, true)}
                disabled={isSubmitting || loadingLookups}
                className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Send size={16} aria-hidden="true" />
                )}
                <span>Submit for Approval</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseOrderModal;

import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  MapPin,
  Search,
  Trash2,
  Layers,
  FileText,
  ChevronDown,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";
import { useDebounce } from "../../../hooks/useDebounce";

const generateRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const TransferModal = ({ isOpen, onClose, onSubmit, branches = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Accessible Form IDs
  const modalTitleId = useId();
  const sourceBranchSelectId = useId();
  const destBranchSelectId = useId();
  const itemSearchInputId = useId();
  const reasonTextareaId = useId();

  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [stockCache, setStockCache] = useState({});

  const [header, setHeader] = useState({
    source_branch_id: "",
    destination_branch_id: "",
    reason: "",
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setHeader({
        source_branch_id: "",
        destination_branch_id: "",
        reason: "",
      });
      setItems([]);
      setValidationError("");
      setSearchTerm("");
      setSearchResults([]);
      setIsDropdownOpen(false);
      setStockCache({});
    }
  }, [isOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown or modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else if (!isSubmitting) {
          onClose?.();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDropdownOpen, isSubmitting, onClose]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && isDropdownOpen) {
      setIsSearching(true);
      inventoryService
        .getInventoryCatalog(
          1,
          10,
          debouncedSearchTerm,
          "all",
          "all",
          "active",
          "all",
        )
        .then((res) => {
          if (isMounted) setSearchResults(res.data || []);
        })
        .catch(() => {
          if (isMounted) setSearchResults([]);
        })
        .finally(() => {
          if (isMounted) setIsSearching(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, debouncedSearchTerm, isDropdownOpen]);

  const fetchBranchStock = async (itemId) => {
    if (stockCache[itemId]) return stockCache[itemId];
    try {
      const res = await inventoryService.getBranchBreakdown(itemId);
      const stockMap = {};
      (res.data || []).forEach(
        (b) => (stockMap[b.branch_id.toString()] = b.quantity),
      );
      setStockCache((prev) => ({ ...prev, [itemId]: stockMap }));
      return stockMap;
    } catch {
      return {};
    }
  };

  const handleSelectItem = async (masterItem) => {
    setIsDropdownOpen(false);
    setSearchTerm("");

    if (items.some((i) => i.item_id === masterItem.id)) {
      setValidationError(
        `Item "${masterItem.sku}" is already in the manifest.`,
      );
      return;
    }

    setValidationError("");
    const stockMap = await fetchBranchStock(masterItem.id);

    setItems((prev) => [
      ...prev,
      {
        rowId: generateRowId(),
        item_id: masterItem.id,
        sku: masterItem.sku,
        item_name: masterItem.item_name,
        uom: masterItem.uom,
        unit_cost: parseFloat(masterItem.unit_cost) || 0,
        quantity: "",
        stockMap,
      },
    ]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setHeader((prev) => {
      const next = { ...prev, [name]: value };
      if (
        name === "source_branch_id" &&
        value &&
        value === prev.destination_branch_id
      ) {
        next.destination_branch_id = "";
      }
      return next;
    });
  };

  const handleLineChange = (rowId, field, value) => {
    setValidationError("");
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeLine = (rowId) => {
    setValidationError("");
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const getAvailableStock = (item) => {
    if (!header.source_branch_id) return "...";
    return item.stockMap[header.source_branch_id] || 0;
  };

  const calculateTotals = () => {
    let totalQty = 0;
    let totalValuation = 0;
    items.forEach((item) => {
      const qty = parseInt(item.quantity, 10) || 0;
      totalQty += qty;
      totalValuation += qty * item.unit_cost;
    });
    return { totalQty, totalValuation };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!header.source_branch_id || !header.destination_branch_id) {
      return setValidationError("Origin and Target branches are required.");
    }
    if (header.source_branch_id === header.destination_branch_id) {
      return setValidationError(
        "Origin and Target branches must be different.",
      );
    }
    if (items.length === 0) {
      return setValidationError(
        "At least one item must be added to the manifest.",
      );
    }
    if (header.reason.trim().length < 3) {
      return setValidationError("A valid reason for the transfer is required.");
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const qty = parseInt(item.quantity, 10);
      const available = getAvailableStock(item);

      if (isNaN(qty) || qty <= 0) {
        return setValidationError(
          `Line ${i + 1}: Quantity must be greater than zero.`,
        );
      }
      if (qty > available) {
        return setValidationError(
          `Line ${i + 1}: Insufficient stock. Cannot transfer ${qty} ${item.uom} of ${item.sku}. Only ${available} available.`,
        );
      }
    }

    const payload = {
      source_branch_id: header.source_branch_id,
      destination_branch_id: header.destination_branch_id,
      reason: header.reason.trim(),
      items: items.map((item) => ({
        item_id: item.item_id,
        quantity: item.quantity,
      })),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message || "Failed to execute transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={() => !isSubmitting && onClose?.()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[92vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ArrowRightLeft size={20} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    Bulk Transfer Manifest
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Inter-Branch Logistics Engine
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close bulk transfer modal"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* BODY */}
            <div className="px-5 sm:px-8 py-5 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50/30 dark:bg-slate-900/20">
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
                id="bulkTransferForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* LOGISTICS ROUTING HEADER */}
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative shadow-xs">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <MapPin size={14} aria-hidden="true" />
                    <span>Logistics Routing</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative">
                    <div
                      aria-hidden="true"
                      className="hidden sm:flex absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-emerald-500 shadow-xs"
                    >
                      <ArrowRightLeft size={14} />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label
                        htmlFor={sourceBranchSelectId}
                        className="form-label"
                      >
                        Extract From <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={sourceBranchSelectId}
                          name="source_branch_id"
                          disabled={isSubmitting}
                          value={header.source_branch_id}
                          onChange={handleHeaderChange}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Origin Location --</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.branch_name}
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

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label
                        htmlFor={destBranchSelectId}
                        className="form-label"
                      >
                        Deposit To <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id={destBranchSelectId}
                          name="destination_branch_id"
                          disabled={isSubmitting}
                          value={header.destination_branch_id}
                          onChange={handleHeaderChange}
                          className="form-select appearance-none pr-10 cursor-pointer"
                        >
                          <option value="">-- Target Location --</option>
                          {branches.map((b) => (
                            <option
                              key={b.id}
                              value={b.id}
                              disabled={
                                b.id.toString() === header.source_branch_id
                              }
                            >
                              {b.branch_name}{" "}
                              {b.id.toString() === header.source_branch_id
                                ? "(Source)"
                                : ""}
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
                  </div>
                </section>

                {/* ITEM MATRIX */}
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center gap-2">
                      <Layers size={14} aria-hidden="true" />
                      <span>Itemized Manifest</span>
                    </h3>
                  </div>

                  {/* ASSET SEARCH */}
                  <div
                    ref={dropdownRef}
                    className="relative z-20 mb-4 shrink-0"
                  >
                    <label htmlFor={itemSearchInputId} className="sr-only">
                      Search SKU or Item Name to append to manifest
                    </label>
                    <div className="relative">
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                      >
                        {isSearching ? (
                          <Loader2
                            size={16}
                            className="text-amber-500 animate-spin"
                          />
                        ) : (
                          <Search size={16} className="text-slate-400" />
                        )}
                      </div>
                      <input
                        id={itemSearchInputId}
                        type="text"
                        disabled={isSubmitting}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search SKU or Item Name to append to manifest..."
                        className="form-input pl-10 bg-slate-50 dark:bg-slate-900/50"
                      />
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            role="listbox"
                            aria-label="Matching inventory items"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  role="option"
                                  onClick={() => handleSelectItem(item)}
                                  className="w-full text-left p-3 sm:p-4 hover:bg-amber-50 dark:hover:bg-amber-500/10 focus-visible:bg-amber-50 dark:focus-visible:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                >
                                  <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                                    {item.sku}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                    {item.item_name}
                                  </p>
                                </button>
                              ))
                            ) : (
                              <div className="p-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                {isSearching
                                  ? "Searching catalog..."
                                  : "No matching items found."}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* MATRIX TABLE */}
                  <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs">
                    <table className="w-full text-left whitespace-nowrap min-w-[680px]">
                      <caption className="sr-only">
                        Selected items for inter-branch stock transfer
                      </caption>
                      <thead>
                        <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                          <th scope="col" className="px-4 py-3.5 w-[45%]">
                            Master Item
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3.5 w-[20%] text-center"
                          >
                            Origin Stock
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3.5 w-[25%] text-right"
                          >
                            Transfer Qty
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3.5 w-[10%] text-center"
                          >
                            Act
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {items.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-10 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                            >
                              Manifest is empty. Search above to add items.
                            </td>
                          </tr>
                        ) : (
                          items.map((line) => {
                            const avail = getAvailableStock(line);
                            const parsedQty = parseInt(line.quantity, 10);
                            const isExceeding =
                              typeof avail === "number" &&
                              !isNaN(parsedQty) &&
                              parsedQty > avail;

                            return (
                              <tr key={line.rowId} className="table-row-hover">
                                <td className="px-4 py-3.5">
                                  <p className="text-[10px] font-mono tabular-nums font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-0.5">
                                    {line.sku}
                                  </p>
                                  <p
                                    className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[250px]"
                                    title={line.item_name}
                                  >
                                    {line.item_name}
                                  </p>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <span
                                    className={`text-[10px] px-2.5 py-1 rounded-md font-black font-mono tabular-nums tracking-widest ${
                                      avail === "..."
                                        ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                        : avail === 0
                                          ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    }`}
                                  >
                                    {avail} {avail !== "..." && line.uom}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max={
                                        typeof avail === "number" && avail > 0
                                          ? avail
                                          : undefined
                                      }
                                      step="1"
                                      disabled={isSubmitting}
                                      aria-label={`Transfer quantity for ${line.item_name}`}
                                      placeholder="0"
                                      value={line.quantity}
                                      onChange={(e) =>
                                        handleLineChange(
                                          line.rowId,
                                          "quantity",
                                          e.target.value,
                                        )
                                      }
                                      className={`w-24 px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-xs font-mono tabular-nums font-black text-right shadow-2xs focus:outline-none focus:ring-2 ${
                                        isExceeding
                                          ? "border-rose-300 focus:border-rose-500 text-rose-600 dark:border-rose-500/50 dark:text-rose-400 focus:ring-rose-500/20"
                                          : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-amber-500/20"
                                      }`}
                                    />
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase w-8 text-left">
                                      {line.uom}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => removeLine(line.rowId)}
                                    title={`Remove ${line.item_name}`}
                                    aria-label={`Remove ${line.item_name} from transfer manifest`}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 size={16} aria-hidden="true" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* LOGISTICS NOTES */}
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs">
                  <label
                    htmlFor={reasonTextareaId}
                    className="form-label flex items-center gap-2"
                  >
                    <FileText
                      size={14}
                      aria-hidden="true"
                      className="text-slate-400"
                    />
                    <span>Logistics Notes / Reason</span>
                    <span className="form-required">*</span>
                  </label>
                  <textarea
                    id={reasonTextareaId}
                    required
                    disabled={isSubmitting}
                    name="reason"
                    value={header.reason}
                    onChange={handleHeaderChange}
                    rows={2}
                    placeholder="e.g., Redistributing excess brake pads to Mayapa branch to cover expected weekend shortage."
                    className="form-textarea resize-none font-medium bg-slate-50 dark:bg-slate-900/50"
                  />
                </section>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 w-full sm:w-auto px-2 sm:px-0">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Total Items
                  </span>
                  <span className="text-sm font-black font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {items.length}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-6 w-px bg-slate-300 dark:bg-slate-700"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Total Units
                  </span>
                  <span className="text-sm font-black font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {totals.totalQty.toLocaleString()}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-6 w-px bg-slate-300 dark:bg-slate-700"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Asset Value
                  </span>
                  <span className="text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    ₱
                    {totals.totalValuation.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse xs:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full xs:w-auto px-5 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="bulkTransferForm"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full xs:w-auto px-7 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowRightLeft size={16} aria-hidden="true" />
                  )}
                  <span>Execute Transfer</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;

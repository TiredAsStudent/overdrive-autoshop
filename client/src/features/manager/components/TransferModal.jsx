import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  Package,
  MapPin,
  Calculator,
  Search,
  Plus,
  Trash2,
  Layers,
  FileText,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";
import { useDebounce } from "../../../hooks/useDebounce";

const generateRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const TransferModal = ({ isOpen, onClose, onSubmit, branches }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
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
        .then((res) => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }
  }, [isOpen, debouncedSearchTerm, isDropdownOpen]);

  const fetchBranchStock = async (itemId) => {
    if (stockCache[itemId]) return stockCache[itemId];
    try {
      const res = await inventoryService.getBranchBreakdown(itemId);
      const stockMap = {};
      res.data.forEach((b) => (stockMap[b.branch_id.toString()] = b.quantity));
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
        unit_cost: parseFloat(masterItem.unit_cost),
        quantity: "",
        stockMap: stockMap,
      },
    ]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (rowId, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeLine = (rowId) => {
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Bulk Transfer Manifest
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Inter-Branch Logistics Engine
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* BODY */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50/30 dark:bg-slate-900/20">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold shadow-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="bulkTransferForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* LOGISTICS ROUTING HEADER */}
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                    <MapPin size={14} /> Logistics Routing
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative">
                    <div className="hidden sm:flex absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-emerald-500 shadow-sm">
                      <ArrowRightLeft size={14} />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          Extract From <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <select
                        name="source_branch_id"
                        value={header.source_branch_id}
                        onChange={handleHeaderChange}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                      >
                        <option value="">-- Origin Location --</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          Deposit To <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <select
                        name="destination_branch_id"
                        value={header.destination_branch_id}
                        onChange={handleHeaderChange}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
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
                    </div>
                  </div>
                </section>

                {/* ITEM MATRIX */}
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                      <Layers size={14} /> Itemized Manifest
                    </h3>
                  </div>

                  {/* ASSET SEARCH */}
                  <div
                    ref={dropdownRef}
                    className="relative z-20 mb-4 shrink-0"
                  >
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search SKU or Item Name to append to manifest..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                      />
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleSelectItem(item)}
                                  className="p-3 sm:p-4 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                >
                                  <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                    {item.sku}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                    {item.item_name}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-xs font-medium text-slate-500 uppercase tracking-widest">
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
                  <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                          <th className="px-4 py-3 w-[45%]">Master Item</th>
                          <th className="px-4 py-3 w-[20%] text-center">
                            Origin Stock
                          </th>
                          <th className="px-4 py-3 w-[25%] text-right">
                            Transfer Qty
                          </th>
                          <th className="px-4 py-3 w-[10%] text-center">Act</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {items.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                            >
                              Manifest is empty. Search above to add items.
                            </td>
                          </tr>
                        ) : (
                          items.map((line, index) => {
                            const avail = getAvailableStock(line);
                            const parsedQty = parseInt(line.quantity, 10);
                            const isExceeding =
                              !isNaN(parsedQty) && parsedQty > avail;

                            return (
                              <tr
                                key={line.rowId}
                                className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-0.5">
                                    {line.sku}
                                  </p>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[250px]">
                                    {line.item_name}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`text-[10px] px-2 py-1 rounded font-black font-mono tracking-widest ${
                                      avail === "..."
                                        ? "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                        : avail === 0
                                          ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
                                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                                    }`}
                                  >
                                    {avail} {avail !== "..." && line.uom}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      placeholder="0"
                                      value={line.quantity}
                                      onChange={(e) =>
                                        handleLineChange(
                                          line.rowId,
                                          "quantity",
                                          e.target.value,
                                        )
                                      }
                                      className={`w-24 px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-xs font-mono font-black text-right shadow-sm focus:outline-none focus:ring-1 ${
                                        isExceeding
                                          ? "border-rose-300 focus:border-rose-500 text-rose-600 dark:border-rose-500/50 dark:text-rose-400 focus:ring-rose-500"
                                          : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-amber-500"
                                      }`}
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase w-8 text-left">
                                      {line.uom}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeLine(line.rowId)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={16} />
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
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    <FileText size={14} /> Logistics Notes / Reason{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    name="reason"
                    value={header.reason}
                    onChange={handleHeaderChange}
                    rows="2"
                    placeholder="e.g., Redistributing excess brake pads to Mayapa branch to cover expected weekend shortage."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none shadow-inner"
                  />
                </section>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto px-2 sm:px-0">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Total Items
                  </span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                    {items.length}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Total Units
                  </span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                    {totals.totalQty.toLocaleString()}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                    Asset Value
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ₱
                    {totals.totalValuation.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="bulkTransferForm"
                disabled={isSubmitting || items.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRightLeft size={16} />
                )}
                Execute Transfer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;

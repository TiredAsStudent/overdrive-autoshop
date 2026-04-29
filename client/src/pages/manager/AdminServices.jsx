import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Calculator,
  ShieldCheck,
  Wrench,
  Search,
  X,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from "lucide-react";
import workshopService from "../../services/workshopService";

const AdminServices = () => {
  // --- UI & DATA STATE ---
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [pricingSettings, setPricingSettings] = useState({
    markup: 25,
    tax: 12,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FORM STATE ---
  const initialFormState = {
    name: "",
    category: "Maintenance",
    labor_fee: 0,
    revenue_account_id: "",
    description: "",
    is_active: true,
    parts: [],
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [servicesData, inventoryData, accountsData, settingsData] =
        await Promise.all([
          workshopService.getServices(),
          workshopService.getInventory(),
          workshopService.getAccounts(),
          workshopService.getSystemSettings(),
        ]);
      setServices(servicesData);
      setInventory(inventoryData);
      setAccounts(accountsData);

      setPricingSettings({
        markup: parseFloat(settingsData?.markup_percentage) || 25,
        tax: parseFloat(settingsData?.vat_percentage) || 12,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- FILTERING & PAGINATION LOGIC ---
  const filteredServices = useMemo(() => {
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [services, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const totalItems = filteredServices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      if (currentPage <= 3) end = maxVisiblePages;
      else if (currentPage >= totalPages - 2)
        start = totalPages - maxVisiblePages + 1;
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setModalMode("CREATE");
    setFormData(initialFormState);
    setError(null); // Clear errors when opening modal
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setModalMode("EDIT");
    setEditingId(service.id);
    setFormData({
      name: service.name,
      category: service.category,
      labor_fee: service.labor_fee,
      revenue_account_id: service.revenue_account_id || "",
      description: service.description || "",
      is_active: service.is_active,
      parts: service.parts.map((p) => ({
        inventory_id: p.inventory_id,
        quantity_required: p.quantity,
      })),
    });
    setError(null); // Clear errors when opening modal
    setIsModalOpen(true);
  };

  // --- PARTS ARRAY MANAGEMENT ---
  const addPart = () => {
    setFormData({
      ...formData,
      parts: [...formData.parts, { inventory_id: "", quantity_required: 1 }],
    });
  };

  const updatePart = (index, field, value) => {
    const newParts = [...formData.parts];
    newParts[index][field] = value;
    setFormData({ ...formData, parts: newParts });
  };

  const removePart = (index) => {
    const newParts = formData.parts.filter((_, i) => i !== index);
    setFormData({ ...formData, parts: newParts });
  };

  // --- LIVE PREVIEW CALCULATOR ---
  const calculatePreview = () => {
    const GLOBAL_MARKUP = pricingSettings.markup / 100;
    const GLOBAL_TAX = pricingSettings.tax / 100;

    const partsBaseCost = formData.parts.reduce((sum, p) => {
      const item = inventory.find((i) => i.id === parseInt(p.inventory_id));
      const cost = item ? parseFloat(item.unit_cost) : 0;
      const qty = parseFloat(p.quantity_required) || 0;
      return sum + cost * qty;
    }, 0);

    const partsRetail = partsBaseCost + partsBaseCost * GLOBAL_MARKUP;
    const labor = parseFloat(formData.labor_fee) || 0;
    const subtotal = partsRetail + labor;
    const tax = subtotal * GLOBAL_TAX;

    return {
      partsBaseCost,
      partsRetail,
      labor,
      subtotal,
      tax,
      grandTotal: subtotal + tax,
    };
  };

  const preview = calculatePreview();

  // --- SUBMIT HANDLER ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.revenue_account_id) {
      setError(
        "Accounting Error: You must link a Revenue Account to this service.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null); // Clear previous errors

    try {
      const payload = {
        ...formData,
        labor_fee: parseFloat(formData.labor_fee),
        revenue_account_id: parseInt(formData.revenue_account_id),
        parts: formData.parts
          .filter((p) => p.inventory_id !== "")
          .map((p) => ({
            inventory_id: parseInt(p.inventory_id),
            quantity_required: parseFloat(p.quantity_required),
          })),
      };

      if (modalMode === "CREATE") {
        await workshopService.createService(payload);
      } else {
        await workshopService.updateService(editingId, payload);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      // The specific Zod error (like "Duplicate parts") will appear here
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount) =>
    `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative min-h-screen">
      {/* 0. MAIN PAGE ERROR BANNER (Only shows if modal is closed) */}
      {!isModalOpen && error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex justify-between items-center border border-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. HEADER & FORMULA VISUAL */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
            The Recipe Book
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2">
            Configure standardized service packages. Link labor and inventory
            directly to your Chart of Accounts.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
          <button
            onClick={openCreateModal}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 uppercase text-sm w-full xl:w-auto whitespace-nowrap"
          >
            <Plus size={20} /> New Combo Meal
          </button>

          <div className="relative w-full xl:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Service Name..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold dark:text-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* 2. SERVICES GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center py-20">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      ) : paginatedServices.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <Package size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold">No combo meals found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedServices.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ y: -4 }}
              className={`bg-white dark:bg-slate-800 rounded-3xl border ${service.is_active ? "border-slate-200 dark:border-white/10" : "border-red-200 opacity-75 grayscale-[30%]"} overflow-hidden shadow-sm flex flex-col`}
            >
              <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {service.category}{" "}
                      {service.is_active ? "" : " (INACTIVE)"}
                    </span>
                    {/* ACCOUNTING LINK BADGE */}
                    {service.account_code && (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-emerald-500/20">
                        <Landmark size={10} /> ACC: {service.account_code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {service.name}
                  </h3>
                </div>
                <button
                  onClick={() => openEditModal(service)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                >
                  <Edit size={18} />
                </button>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="space-y-2 flex-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                    Recipe Ingredients
                  </p>
                  {service.parts && service.parts.length > 0 ? (
                    <div className="space-y-2">
                      {service.parts.map((p, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-gray-300"
                        >
                          <span className="flex items-center gap-2 truncate pr-2">
                            <Package
                              size={14}
                              className="text-amber-500 shrink-0"
                            />
                            <span className="truncate">{p.part_name}</span>
                            <span className="text-slate-400 shrink-0">
                              (x{p.quantity})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Labor only (No parts required)
                    </p>
                  )}

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-sm font-bold text-amber-600 dark:text-overdrive-yellow">
                    <span className="flex items-center gap-2">
                      <Wrench size={14} /> Fixed Labor Fee
                    </span>
                    <span>{formatMoney(service.labor_fee)}</span>
                  </div>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-50 dark:border-white/5 flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase">
                      <ShieldCheck size={12} /> Inflation Guard Active
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Standard Retail Price
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">
                      {formatMoney(service.pricing_breakdown?.grand_total || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 3. PREMIUM NUMBERED PAGINATION FOOTER */}
      {!isLoading && totalItems > 0 && (
        <div className="p-4 sm:px-6 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>
              Showing{" "}
              <span className="text-slate-900 dark:text-white">
                {startIndex + 1}
              </span>{" "}
              -{" "}
              <span className="text-slate-900 dark:text-white">
                {Math.min(endIndex, totalItems)}
              </span>{" "}
              of{" "}
              <span className="text-slate-900 dark:text-white">
                {totalItems}
              </span>
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <span>Cards:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none focus:border-amber-500 cursor-pointer text-slate-900 dark:text-white transition-colors"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center px-1 gap-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20"
                      : "text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 4. COMBO MEAL BUILDER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight flex items-center gap-2">
                  <Landmark className="text-emerald-500" size={24} />
                  {modalMode === "CREATE"
                    ? "New Combo Meal Builder"
                    : "Edit Recipe"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* --- INSIDE MODAL ERROR BANNER --- */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 sm:mx-8 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl flex justify-between items-start shadow-sm"
                >
                  <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                    <ShieldCheck
                      size={18}
                      className="rotate-180 shrink-0 mt-0.5"
                    />
                    <span className="text-sm font-bold tracking-tight">
                      {error}
                    </span>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 shrink-0 ml-4 p-1"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              <form
                onSubmit={handleFormSubmit}
                className="flex-1 overflow-y-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {/* LEFT: Inputs */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                        Service Title
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Engine Overhaul"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none"
                      >
                        <option value="Engine">Engine</option>
                        <option value="Transmission">Transmission</option>
                        <option value="Brakes">Brakes</option>
                        <option value="Under chassis">Under chassis</option>
                        <option value="OBD / ECU Scanning">
                          OBD / ECU Scanning
                        </option>
                        <option value="Aircon">Aircon</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-700/30 rounded-2xl">
                    <label className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Landmark size={12} /> Revenue Account (Accounting Link)
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">
                      Where should the profit from this service go in the
                      ledger?
                    </p>
                    <select
                      required
                      value={formData.revenue_account_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          revenue_account_id: e.target.value,
                        })
                      }
                      className="w-full bg-white dark:bg-black/40 border border-emerald-200 dark:border-emerald-700/30 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="" disabled>
                        Select Chart of Account...
                      </option>
                      {accounts
                        .filter(
                          (acc) =>
                            String(acc.code).startsWith("4") ||
                            String(acc.name).toLowerCase().includes("revenue"),
                        )
                        .map((acc, index) => {
                          const id = acc.id || acc.account_id;
                          const code = acc.account_code || acc.code || "CODE";
                          const name =
                            acc.account_name ||
                            acc.name ||
                            acc.account_title ||
                            "Unnamed Account";
                          return (
                            <option key={id || index} value={id}>
                              [{code}] {name}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {/* RESPONSIVE Parts Array */}
                  <div className="space-y-3 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                        Linked Inventory Parts
                      </label>
                      <button
                        type="button"
                        onClick={addPart}
                        className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Add Part
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.parts.map((part, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white dark:bg-black/20 sm:bg-transparent sm:dark:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-200 dark:border-white/10 sm:border-none"
                        >
                          <select
                            required
                            value={part.inventory_id}
                            onChange={(e) =>
                              updatePart(index, "inventory_id", e.target.value)
                            }
                            className="w-full sm:flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm dark:text-white focus:border-amber-500 outline-none"
                          >
                            <option value="" disabled>
                              Select Part from Inventory...
                            </option>
                            {inventory.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.item_code} - {inv.item_name} (₱
                                {inv.unit_cost})
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <input
                              required
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={part.quantity_required}
                              onChange={(e) =>
                                updatePart(
                                  index,
                                  "quantity_required",
                                  e.target.value,
                                )
                              }
                              className="w-full sm:w-24 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-center dark:text-white focus:border-amber-500 outline-none"
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              onClick={() => removePart(index)}
                              className="p-2 w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl shrink-0 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formData.parts.length === 0 && (
                      <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                        <Package
                          size={24}
                          className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
                        />
                        <p className="text-xs text-slate-400 italic">
                          No parts linked. This will be a Labor-Only service.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Fixed Labor Fee (Mandatory)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₱
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.labor_fee}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            labor_fee: e.target.value,
                          })
                        }
                        className="w-full bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl pl-8 pr-4 py-3 font-bold dark:text-amber-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {modalMode === "EDIT" && (
                    <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Service is Active (Visible to Staff)
                      </span>
                    </label>
                  )}
                </div>

                {/* RIGHT: Live Preview */}
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col mt-4 lg:mt-0">
                  <div className="absolute right-0 top-0 p-4 opacity-5">
                    <Calculator size={150} />
                  </div>
                  <h4 className="text-xs font-black uppercase text-amber-500 mb-6 tracking-widest relative z-10 flex items-center gap-2">
                    Live Math Preview
                  </h4>

                  <div className="space-y-4 relative z-10 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold">
                        Raw Parts Cost
                      </span>
                      <span className="font-mono">
                        {formatMoney(preview.partsBaseCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold">
                        Global Markup ({pricingSettings.markup}%)
                      </span>
                      <span className="text-emerald-400 font-mono">
                        +
                        {formatMoney(
                          preview.partsRetail - preview.partsBaseCost,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold text-amber-500">
                        Fixed Labor Fee
                      </span>
                      <span className="font-mono">
                        {formatMoney(preview.labor)}
                      </span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold">
                          Subtotal
                        </span>
                        <span className="font-mono">
                          {formatMoney(preview.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold">
                          VAT ({pricingSettings.tax}%)
                        </span>
                        <span className="text-red-400 font-mono">
                          +{formatMoney(preview.tax)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/20">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">
                        Total Customer Price
                      </p>
                      <p className="text-4xl font-black text-white italic">
                        {formatMoney(preview.grandTotal)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 py-4 bg-white text-slate-900 font-black rounded-xl uppercase text-sm hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-xl flex items-center justify-center gap-2 relative z-10"
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {modalMode === "CREATE"
                      ? "Save to Recipe Book"
                      : "Update Combo"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminServices;

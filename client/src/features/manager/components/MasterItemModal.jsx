import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  DollarSign,
  Loader2,
  AlertCircle,
  Percent,
  Save,
  BookOpen,
  Lock,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";

const ITEM_CATEGORIES = [
  "Fluids",
  "Filters",
  "Brakes",
  "Engine Parts",
  "Transmission",
  "Suspension",
  "Electrical",
  "Air Conditioning",
  "Tires",
  "Consumables",
];

const UOM_OPTIONS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "liters", label: "Liters (L)" },
  { value: "gallons", label: "Gallons (gal)" },
  { value: "sets", label: "Sets" },
  { value: "pairs", label: "Pairs" },
  { value: "bottles", label: "Bottles" },
  { value: "cans", label: "Cans" },
  { value: "boxes", label: "Boxes" },
  { value: "packs", label: "Packs" },
  { value: "meters", label: "Meters (m)" },
  { value: "units", label: "Units" },
];

const MasterItemModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [systemMarkup, setSystemMarkup] = useState(0);

  const [assetAccounts, setAssetAccounts] = useState([]);
  const [incomeAccounts, setIncomeAccounts] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);

  const [formData, setFormData] = useState({
    sku: "",
    item_name: "",
    category: "Fluids",
    uom: "pcs",
    description: "",
    unit_cost: "",
    selling_price: "",
    default_reorder_level: 5,
    asset_account_id: "",
    income_account_id: "",
    expense_account_id: "",
  });

  const isAccountLocked =
    initialData && parseInt(initialData.usage_count, 10) > 0;

  useEffect(() => {
    const fetchDependencies = async () => {
      if (isOpen) {
        const markup = await inventoryService.getSystemMarkup();
        setSystemMarkup(markup);

        setIsFetchingAccounts(true);
        try {
          const res = await chartOfAccountsService.getAccounts(
            1,
            500,
            "",
            "all",
            "active",
          );
          const allAccounts = res.data?.accounts || res.accounts || [];

          const assets = allAccounts.filter((a) => a.account_type === "ASSET");
          const incomes = allAccounts.filter(
            (a) => a.account_type === "INCOME",
          );
          const expenses = allAccounts.filter(
            (a) => a.account_type === "EXPENSE",
          );

          setAssetAccounts(assets);
          setIncomeAccounts(incomes);
          setExpenseAccounts(expenses);

          if (!initialData) {
            setFormData((prev) => ({
              ...prev,
              asset_account_id:
                assets.length > 0 ? assets[0].id.toString() : "",
              income_account_id:
                incomes.length > 0 ? incomes[0].id.toString() : "",
              expense_account_id:
                expenses.length > 0 ? expenses[0].id.toString() : "",
            }));
          }
        } catch (error) {
          console.error("Failed to fetch accounting matrix", error);
        } finally {
          setIsFetchingAccounts(false);
        }
      }
    };
    fetchDependencies();
  }, [isOpen, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        sku: initialData.sku || "",
        item_name: initialData.item_name || "",
        category: initialData.category || "Fluids",
        uom: initialData.uom || "pcs",
        description: initialData.description || "",
        unit_cost: initialData.unit_cost || "",
        selling_price: initialData.selling_price || "",
        default_reorder_level: initialData.default_reorder_level ?? 5,
        asset_account_id: initialData.asset_account_id?.toString() || "",
        income_account_id: initialData.income_account_id?.toString() || "",
        expense_account_id: initialData.expense_account_id?.toString() || "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        sku: "",
        item_name: "",
        category: "Fluids",
        uom: "pcs",
        description: "",
        unit_cost: "",
        selling_price: "",
        default_reorder_level: 5,
      }));
    }
    setValidationError("");
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "sku") {
      setFormData({
        ...formData,
        [name]: value.toUpperCase().replace(/\s+/g, "-"),
      });
      return;
    }

    // Profit Markup Auto-Calculation Logic
    if (name === "unit_cost" && value !== "") {
      const cost = parseFloat(value);
      if (!isNaN(cost) && systemMarkup > 0) {
        const autoSellingPrice = cost + cost * (systemMarkup / 100);
        setFormData({
          ...formData,
          unit_cost: value,
          selling_price: autoSellingPrice.toFixed(2),
        });
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (
      parseFloat(formData.unit_cost) < 0 ||
      parseFloat(formData.selling_price) < 0
    ) {
      setValidationError("Financial values cannot be negative.");
      return;
    }

    if (
      !formData.asset_account_id ||
      !formData.income_account_id ||
      !formData.expense_account_id
    ) {
      setValidationError("All three Chart of Accounts mappings are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setValidationError(error.message || "Failed to process item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[90vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 md:p-8 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {initialData
                      ? "Update Master Item"
                      : "Register Master Item"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {initialData
                      ? `SKU: ${initialData.sku}`
                      : "Stock Catalog Management"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form
                id="masterItemForm"
                onSubmit={handleSubmit}
                className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6"
              >
                {/* LEFT COLUMN: Identification */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                      <Package size={14} /> Item Identification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="item_name"
                          value={formData.item_name}
                          onChange={handleChange}
                          placeholder="e.g., Premium DOT 4 Brake Fluid"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="sku"
                          value={formData.sku}
                          onChange={handleChange}
                          disabled={!!initialData}
                          placeholder="e.g., BRK-FLUID"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black tracking-widest uppercase disabled:opacity-50 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        >
                          {ITEM_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          UOM <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          name="uom"
                          value={formData.uom}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        >
                          {UOM_OPTIONS.map((uom) => (
                            <option key={uom.value} value={uom.value}>
                              {uom.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Default Reorder Level{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min="0"
                          name="default_reorder_level"
                          value={formData.default_reorder_level}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows="2"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Financials & Accounting */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Base Financials */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                        <DollarSign size={14} /> Base Financials
                      </h3>
                      <div className="self-start sm:self-auto bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                        <Percent size={12} /> System Markup: {systemMarkup}%
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Base Unit Cost (PHP){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          name="unit_cost"
                          value={formData.unit_cost}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Selling Price (PHP){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          name="selling_price"
                          value={formData.selling_price}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chart of Accounts Linkage */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
                      <BookOpen size={14} /> Chart of Accounts Linkage
                    </h3>
                    <div className="space-y-4">
                      {/* Asset Account */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Asset Account (Valuation){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          name="asset_account_id"
                          value={formData.asset_account_id}
                          onChange={handleChange}
                          disabled={isFetchingAccounts || isAccountLocked}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled>
                            {isFetchingAccounts
                              ? "Loading..."
                              : "-- Select Asset Account --"}
                          </option>
                          {assetAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.account_code} - {acc.account_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Income Account */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Income Account (Sales Revenue){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          name="income_account_id"
                          value={formData.income_account_id}
                          onChange={handleChange}
                          disabled={isFetchingAccounts || isAccountLocked}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled>
                            {isFetchingAccounts
                              ? "Loading..."
                              : "-- Select Income Account --"}
                          </option>
                          {incomeAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.account_code} - {acc.account_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Expense Account */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Expense Account (Shrinkage/Loss){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          name="expense_account_id"
                          value={formData.expense_account_id}
                          onChange={handleChange}
                          disabled={isFetchingAccounts || isAccountLocked}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled>
                            {isFetchingAccounts
                              ? "Loading..."
                              : "-- Select Expense Account --"}
                          </option>
                          {expenseAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.account_code} - {acc.account_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Immutability Alert */}
                      {isAccountLocked && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold flex items-start sm:items-center gap-2">
                            <Lock
                              size={12}
                              className="shrink-0 mt-0.5 sm:mt-0"
                            />
                            <span>
                              COA mapping locked to preserve historical movement
                              ledger logic.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="masterItemForm"
                disabled={isSubmitting}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {initialData ? "Update Item Profile" : "Register Master Item"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MasterItemModal;

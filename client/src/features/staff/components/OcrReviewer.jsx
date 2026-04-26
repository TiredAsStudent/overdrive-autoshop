import React, { useState, useMemo } from "react";
import {
  Save,
  X,
  Info,
  Tag,
  Bot,
  User as UserIcon,
  Plus,
  Trash2,
  Calculator,
  AlertTriangle,
  Wallet,
} from "lucide-react";

export const OcrReviewer = ({
  image,
  method,
  aiAnalysis,
  categories = [], // Default to empty array to prevent map errors
  vatRate = 12,
  onCancel,
  onSubmit,
}) => {
  const baseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace("/api/v1", "");

  // --- FLAT FORM STATE FOR EASY SUBMISSION ---
  const [formData, setFormData] = useState({
    vendor_name: aiAnalysis?.extractedData?.vendor_name || "",
    invoice_number: aiAnalysis?.extractedData?.invoice_number || "",
    receipt_date:
      aiAnalysis?.extractedData?.receipt_date ||
      new Date().toISOString().split("T")[0],
    total_amount: aiAnalysis?.extractedData?.total_amount || "",
    tax_amount: aiAnalysis?.extractedData?.tax_amount || "",
    account_category_id: "",
    payment_account_id: "", // NEW: Added payment source for accurate ledger balancing
    items:
      aiAnalysis?.extractedData?.items?.length > 0
        ? aiAnalysis.extractedData.items
        : [{ description: "", quantity: 1, unit_cost: "", total_price: 0 }],
  });

  // --- LOGIC: CALCULATE IF ITEMS MATCH TOTAL ---
  const calculatedItemsSum = useMemo(() => {
    return formData.items.reduce(
      (sum, item) => sum + (parseFloat(item.total_price) || 0),
      0,
    );
  }, [formData.items]);

  const isTotalMismatched =
    Math.abs(calculatedItemsSum - parseFloat(formData.total_amount || 0)) >
    0.01;

  // --- DYNAMIC SOURCE TRACKING (For Research Metric) ---
  const getSource = (field) => {
    if (!aiAnalysis?.extractedData || !aiAnalysis.aiSuccess) return "human";
    const originalValue = String(aiAnalysis.extractedData[field] || "").trim();
    const currentValue = String(formData[field] || "").trim();
    return originalValue === currentValue ? "ai" : "human";
  };

  const accuracyRate = (() => {
    if (!aiAnalysis?.extractedData || method === "manual") return 0;
    const fields = [
      "vendor_name",
      "invoice_number",
      "receipt_date",
      "total_amount",
    ];
    const aiMatches = fields.filter((f) => getSource(f) === "ai").length;
    return Math.round((aiMatches / fields.length) * 100);
  })();

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoVat = () => {
    const total = parseFloat(formData.total_amount);
    const vatDecimal = vatRate / 100;

    if (!isNaN(total) && total > 0) {
      // Dynamic Inclusive VAT Formula
      const vat = total - total / (1 + vatDecimal);
      setFormData((prev) => ({ ...prev, tax_amount: vat.toFixed(2) }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    if (field === "quantity" || field === "unit_cost") {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const cost = parseFloat(updatedItems[index].unit_cost) || 0;
      updatedItems[index].total_price = (qty * cost).toFixed(2);
    }
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, unit_cost: "", total_price: 0 },
      ],
    }));
  };

  const removeItemRow = (index) => {
    if (formData.items.length === 1) return;
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[88vh] bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
      {/* LEFT PANE: Image Viewer */}
      <div className="lg:w-5/12 bg-slate-900 relative group overflow-hidden flex flex-col min-h-[350px]">
        {method === "ai" && (
          <div className="absolute top-6 left-6 z-10 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20 flex flex-col gap-1">
            <span className="text-amber-400">Binarization Filter Applied</span>
            <span className="opacity-70">
              Enhancing text contrast for engine
            </span>
          </div>
        )}
        <div className="w-full h-full p-4 sm:p-8 flex items-center justify-center bg-slate-950/50">
          <img
            src={image?.startsWith("blob") ? image : `${baseUrl}${image}`}
            alt="Receipt Evidence"
            className={`max-w-full max-h-full object-contain filter drop-shadow-2xl rounded-lg border border-white/10 transition-all ${
              method === "ai" ? "grayscale contrast-125 brightness-110" : ""
            }`}
          />
        </div>
      </div>

      {/* RIGHT PANE: Editable Review Form */}
      <div className="lg:w-7/12 p-6 sm:p-10 overflow-y-auto flex flex-col custom-scrollbar bg-white dark:bg-slate-900">
        <form
          onSubmit={handleFormSubmit}
          className="space-y-6 flex-1 flex flex-col"
        >
          <div className="flex justify-between items-start shrink-0">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                Data Verification
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                {method === "ai" && (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                      accuracyRate === 100
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}
                  >
                    Match: {accuracyRate}%
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Header Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Vendor / Supplier *
                </label>
                {getSource("vendor_name") === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <UserIcon size={14} className="text-amber-500" />
                )}
              </div>
              <input
                required
                type="text"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl px-4 py-3 outline-none font-bold text-sm transition-colors dark:text-white ${
                  getSource("vendor_name") === "human" && method === "ai"
                    ? "border-amber-400"
                    : "border-slate-200 dark:border-white/5 focus:border-blue-500"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Invoice / SI #
                </label>
                {getSource("invoice_number") === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <UserIcon size={14} className="text-amber-500" />
                )}
              </div>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl px-4 py-3 outline-none font-bold text-sm transition-colors dark:text-white ${
                  getSource("invoice_number") === "human" && method === "ai"
                    ? "border-amber-400"
                    : "border-slate-200 dark:border-white/5 focus:border-blue-500"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Receipt Date *
                </label>
                {getSource("receipt_date") === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <UserIcon size={14} className="text-amber-500" />
                )}
              </div>
              <input
                required
                type="date"
                name="receipt_date"
                value={formData.receipt_date}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl px-4 py-3 outline-none font-bold text-sm transition-colors dark:text-white ${
                  getSource("receipt_date") === "human" && method === "ai"
                    ? "border-amber-400"
                    : "border-slate-200 dark:border-white/5 focus:border-blue-500"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Total Amount *
                </label>
                {getSource("total_amount") === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <UserIcon size={14} className="text-amber-500" />
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                  ₱
                </span>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl pl-8 pr-4 py-3 outline-none font-black text-lg transition-colors dark:text-white ${
                    isTotalMismatched
                      ? "border-red-500 text-red-500"
                      : getSource("total_amount") === "human" && method === "ai"
                        ? "border-amber-400 text-amber-600"
                        : "border-slate-200 dark:border-white/5 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  Input VAT *
                  <button
                    type="button"
                    onClick={handleAutoVat}
                    className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded text-[8px] hover:scale-105 transition-transform flex items-center gap-1 border border-blue-200 dark:border-blue-500/30 font-black uppercase"
                  >
                    <Calculator size={10} /> Auto-{vatRate}%
                  </button>
                </label>
                {getSource("tax_amount") === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <UserIcon size={14} className="text-amber-500" />
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                  ₱
                </span>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="tax_amount"
                  value={formData.tax_amount}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl pl-8 pr-4 py-3 outline-none font-black text-lg transition-colors dark:text-white ${
                    getSource("tax_amount") === "human" && method === "ai"
                      ? "border-amber-400 text-amber-600"
                      : "border-slate-200 dark:border-white/5 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Mismatch Warning UI */}
          {isTotalMismatched && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle size={16} /> Total Mismatch: Line items sum to ₱
              {calculatedItemsSum.toLocaleString()}
            </div>
          )}

          {/* Accounting Routing Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                <Tag size={12} /> Expense/Assets Category *
              </label>
              <select
                required
                name="account_category_id"
                value={formData.account_category_id}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold dark:text-white outline-none focus:border-amber-500 cursor-pointer appearance-none"
              >
                <option value="" disabled>
                  Select category...
                </option>
                {categories
                  .filter(
                    (c) => c.category === "Expenses" || c.category === "Assets",
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category} - {c.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                <Wallet size={12} /> Paid Using *
              </label>
              <select
                required
                name="payment_account_id"
                value={formData.payment_account_id}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold dark:text-white outline-none focus:border-amber-500 cursor-pointer appearance-none"
              >
                <option value="" disabled>
                  Select payment source...
                </option>
                {categories
                  .filter((c) => c.category === "Assets")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category} - {c.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Line Items Array */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Line Items *
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center hover:opacity-80 transition-opacity"
              >
                <Plus size={14} className="mr-1" /> Add Row
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-2 items-start bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm"
              >
                <div className="flex-1 w-full">
                  <input
                    required
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold outline-none dark:text-white focus:border-blue-400 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-16 sm:w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-center outline-none dark:text-white focus:border-blue-400 transition-colors"
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cost"
                    value={item.unit_cost}
                    onChange={(e) =>
                      handleItemChange(index, "unit_cost", e.target.value)
                    }
                    className="w-20 sm:w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono outline-none dark:text-white focus:border-blue-400 transition-colors"
                  />

                  {/* THE REINSTATED TOTAL FIELD */}
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                      ₱
                    </span>
                    <input
                      required
                      readOnly
                      type="number"
                      placeholder="Total"
                      value={item.total_price}
                      className="w-24 sm:w-28 pl-6 pr-3 py-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg text-xs font-mono font-bold outline-none text-slate-500 cursor-not-allowed"
                      title="Auto-calculated (Qty x Cost)"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="p-2 w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 mt-auto border-t border-slate-100 dark:border-white/5 space-y-4 shrink-0">
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-100 dark:border-amber-500/10">
              <Info
                size={18}
                className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
              />
              <p className="text-[10px] sm:text-xs font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
                Please verify fields carefully. The AI mapping accuracy is
                tracked for system learning. Incorrect matching will trigger an
                audit flag during Manager review.
              </p>
            </div>
            <button
              type="submit"
              disabled={isTotalMismatched}
              className="w-full py-4 sm:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest uppercase text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all shadow-xl"
            >
              <Save size={18} /> Post to Ledger Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

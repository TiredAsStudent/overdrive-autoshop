import React, { useState } from "react";
import { Save, X, Info, Tag, Bot, User as UserIcon } from "lucide-react";

export const OcrReviewer = ({ image, method, user, onCancel, onSubmit }) => {
  // State tracks both the value AND who generated it ('ai' or 'human')
  const [formData, setFormData] = useState({
    vendor: { value: method === "ai" ? "SM Auto Supply" : "", source: method },
    date: { value: method === "ai" ? "2026-04-10" : "", source: method },
    invoiceNo: { value: method === "ai" ? "INV-88229" : "", source: method },
    total: { value: method === "ai" ? "4500.00" : "", source: method },
    category: { value: "Inventory Parts", source: "human" }, // Always human selected
  });

  const handleChange = (field, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { value: newValue, source: "human" }, // Any edit switches source to human
    }));
  };

  // Metric for research: What % of fields required human correction?
  const fields = ["vendor", "date", "invoiceNo", "total"];
  const aiFields = fields.filter((f) => formData[f].source === "ai").length;
  const accuracyRate =
    method === "ai" ? Math.round((aiFields / fields.length) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-[85vh] bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
      {/* LEFT PANE: Image Viewer with "Grease-Proof" Filter Simulation */}
      <div className="lg:w-1/2 bg-slate-900 relative group overflow-hidden">
        <div className="absolute top-6 left-6 z-10 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20 flex flex-col gap-1">
          <span className="text-amber-400">Binarization Filter Applied</span>
          <span className="opacity-70">Enhancing text contrast for engine</span>
        </div>

        {/* The Receipt Image with CSS Filters simulating Pre-processing */}
        <div className="w-full h-full p-8 flex items-center justify-center">
          <div className="relative">
            <img
              src={image}
              alt="Receipt"
              className="max-w-full max-h-full object-contain filter grayscale contrast-150 brightness-110 drop-shadow-2xl rounded-sm"
            />
            {/* Simulated AI Bounding Box */}
            {method === "ai" && (
              <div className="absolute top-[20%] left-[10%] w-[80%] h-[10%] border-2 border-amber-500/50 bg-amber-500/10 animate-pulse rounded"></div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Editable Review Form */}
      <div className="lg:w-1/2 p-8 lg:p-12 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Review & Verify
            </h3>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Branch: {user?.assigned_branch || "BATINO_01"}
              </span>
              {method === "ai" && (
                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${accuracyRate === 100 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"}`}
                >
                  Match: {accuracyRate}%
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 flex-1">
          {/* Vendor Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Vendor / Supplier
              </label>
              {formData.vendor.source === "ai" ? (
                <Bot
                  size={14}
                  className="text-blue-500"
                  title="Extracted by AI"
                />
              ) : (
                <UserIcon
                  size={14}
                  className="text-amber-500"
                  title="Manually Edited"
                />
              )}
            </div>
            <input
              type="text"
              value={formData.vendor.value}
              onChange={(e) => handleChange("vendor", e.target.value)}
              placeholder="e.g. Shell Gasoline Station"
              className={`w-full bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl px-4 py-4 outline-none font-bold transition-colors dark:text-white ${formData.vendor.source === "human" && method === "ai" ? "border-amber-400 dark:border-amber-500/50" : "border-slate-200 dark:border-white/10 focus:border-blue-500"}`}
            />
          </div>

          {/* Grid for Date & Invoice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Date
                </label>
                {formData.date.source === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <UserIcon size={14} className="text-amber-500" />
                )}
              </div>
              <input
                type="date"
                value={formData.date.value}
                onChange={(e) => handleChange("date", e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl px-4 py-4 outline-none font-bold transition-colors dark:text-white ${formData.date.source === "human" && method === "ai" ? "border-amber-400 dark:border-amber-500/50" : "border-slate-200 dark:border-white/10 focus:border-blue-500"}`}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Invoice / SI #
                </label>
                {formData.invoiceNo.source === "ai" ? (
                  <Bot size={14} className="text-blue-500" />
                ) : (
                  <UserIcon size={14} className="text-amber-500" />
                )}
              </div>
              <input
                type="text"
                value={formData.invoiceNo.value}
                onChange={(e) => handleChange("invoiceNo", e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl px-4 py-4 outline-none font-bold transition-colors dark:text-white ${formData.invoiceNo.source === "human" && method === "ai" ? "border-amber-400 dark:border-amber-500/50" : "border-slate-200 dark:border-white/10 focus:border-blue-500"}`}
              />
            </div>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Total Amount
              </label>
              {formData.total.source === "ai" ? (
                <Bot size={14} className="text-blue-500" />
              ) : (
                <UserIcon size={14} className="text-amber-500" />
              )}
            </div>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">
                ₱
              </span>
              <input
                type="number"
                value={formData.total.value}
                onChange={(e) => handleChange("total", e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl pl-10 pr-4 py-4 outline-none font-black text-xl transition-colors dark:text-white ${formData.total.source === "human" && method === "ai" ? "border-amber-400 dark:border-amber-500/50 text-amber-600 dark:text-amber-400" : "border-slate-200 dark:border-white/10 focus:border-blue-500"}`}
              />
            </div>
          </div>

          {/* Simplified COA Tagging */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Simplified Expense Tag
            </label>
            <div className="relative">
              <Tag
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={formData.category.value}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-amber-500 dark:text-white font-bold appearance-none cursor-pointer"
              >
                <option value="Inventory Parts">
                  Inventory Parts (Cost of Goods)
                </option>
                <option value="Utilities">
                  Utilities (Water / Electricity)
                </option>
                <option value="Rent">Shop Rent</option>
                <option value="Consumables">
                  Shop Consumables (Rags, Cleaners)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-8 mt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-100 dark:border-amber-500/10">
            <Info
              size={18}
              className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
            />
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
              Verify the Sales Invoice Number perfectly matches the physical
              photo. Incorrect matching will trigger an audit flag during
              Manager review.
            </p>
          </div>
          <button
            onClick={onSubmit}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest uppercase text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <Save size={18} /> Post to General Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

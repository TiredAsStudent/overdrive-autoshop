import React, { useState, useMemo } from "react";
import {
  PackageSearch,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileMinus,
  Save,
  ArrowRight,
  ShieldAlert,
  Camera,
  History,
  Info,
} from "lucide-react";

// --- DUMMY DATA ENGINE ---

// Mock Inventory (Simulates data pulled from the Staff/Inventory module)
const MOCK_INVENTORY = [
  {
    id: "ITEM-001",
    name: "Full Synthetic Motor Oil (1L)",
    branch: "Calamba",
    currentQty: 48,
    movingAvgCost: 450.0,
    reorderPoint: 20,
  },
  {
    id: "ITEM-002",
    name: "Brake Pad Set - Sedan",
    branch: "Calamba",
    currentQty: 12,
    movingAvgCost: 1200.0,
    reorderPoint: 15,
  },
  {
    id: "ITEM-003",
    name: "Spark Plug (Iridium)",
    branch: "Batino",
    currentQty: 105,
    movingAvgCost: 850.0,
    reorderPoint: 50,
  },
  {
    id: "ITEM-004",
    name: "Air Filter - SUV",
    branch: "Calamba",
    currentQty: 8,
    movingAvgCost: 600.0,
    reorderPoint: 10,
  },
];

// Mock Audit Log (Simulates the stock_adjustments table)
const MOCK_AUDIT_LOG = [
  {
    id: "ADJ-9921",
    date: "2026-05-12 14:30",
    item: "Brake Fluid (500ml)",
    branch: "Calamba",
    reason: "Damaged during handling",
    qtyChange: -2,
    valueImpact: -500.0,
    author: "M. Reyes",
    hasProof: true,
  },
  {
    id: "ADJ-9920",
    date: "2026-05-10 09:15",
    item: "Wiper Blades (22 in)",
    branch: "Batino",
    reason: "Data Entry Correction",
    qtyChange: +5,
    valueImpact: +1250.0,
    author: "L. Cruz",
    hasProof: false,
  },
  {
    id: "ADJ-9919",
    date: "2026-05-08 16:45",
    item: "Headlight Bulb (H4)",
    branch: "Biñan",
    reason: "Theft / Missing",
    qtyChange: -1,
    valueImpact: -350.0,
    author: "Admin",
    hasProof: true,
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Math.abs(amount),
  );

const StockAdjustment = () => {
  const [selectedBranch, setSelectedBranch] = useState("Calamba");

  // Form State
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [notes, setNotes] = useState("");
  const [proofAttached, setProofAttached] = useState(false);

  // Filter items by branch
  const branchItems = useMemo(
    () => MOCK_INVENTORY.filter((item) => item.branch === selectedBranch),
    [selectedBranch],
  );

  // Selected Item Logic
  const selectedItem = useMemo(
    () => branchItems.find((item) => item.id === selectedItemId) || null,
    [selectedItemId, branchItems],
  );

  // Adjustment Calculations
  const currentQty = selectedItem ? selectedItem.currentQty : 0;
  const targetQty = newQuantity !== "" ? parseInt(newQuantity, 10) : currentQty;
  const qtyDelta = targetQty - currentQty;
  const isNegativeAdj = qtyDelta < 0;
  const isPositiveAdj = qtyDelta > 0;

  // Valuation Lock (Forces use of Moving Avg Cost)
  const valueImpact = selectedItem ? qtyDelta * selectedItem.movingAvgCost : 0;

  // Alerts
  const triggersReorder =
    selectedItem && targetQty <= selectedItem.reorderPoint;

  // Form Validation
  const isValid =
    selectedItem &&
    newQuantity !== "" &&
    qtyDelta !== 0 &&
    reasonCode &&
    (isNegativeAdj ? proofAttached : true);

  // Handlers
  const handleSimulateUpload = (e) => {
    e.preventDefault();
    setProofAttached(true);
  };

  const handleSubmit = () => {
    alert(
      `Adjustment Logged! \nItem: ${selectedItem.name}\nDelta: ${qtyDelta}\nFinancial Impact: ₱${Math.abs(valueImpact)}\nGeneral Ledger has been updated.`,
    );
    // Reset Form
    setSelectedItemId("");
    setNewQuantity("");
    setReasonCode("");
    setNotes("");
    setProofAttached(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <PackageSearch className="text-indigo-500" size={28} />
            Stock Adjustment
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Inventory Reconciliation & Forensic Asset Control
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
          <ShieldAlert
            size={16}
            className="text-amber-600 dark:text-amber-400"
          />
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Warning: Modifies Balance Sheet
          </p>
        </div>
      </div>

      {/* MAIN ADJUSTMENT CONSOLE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b border-slate-100 dark:border-white/10 pb-4 flex items-center gap-2">
            <FileMinus size={16} /> Record Physical Discrepancy
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch & Item Selection */}
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <MapPin size={12} /> Target Branch{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => {
                      setSelectedBranch(e.target.value);
                      setSelectedItemId("");
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="Calamba">Calamba</option>
                    <option value="Batino">Batino</option>
                    <option value="Biñan">Biñan</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Select Part / Item <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(e.target.value);
                      setNewQuantity("");
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="" disabled>
                      Search or select item...
                    </option>
                    {branchItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.id}] {item.name} - (Current: {item.currentQty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quantity Adjustment */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    System Qty
                  </label>
                  <input
                    type="number"
                    disabled
                    value={currentQty}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl text-sm font-mono font-black text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Actual Count <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    disabled={!selectedItem}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-500/50 rounded-xl text-sm font-mono font-black text-indigo-700 dark:text-indigo-400 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Reason & Notes */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Reason Code <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    disabled={!selectedItem || qtyDelta === 0}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="" disabled>
                      Select reason...
                    </option>
                    {isNegativeAdj && (
                      <option value="Damaged">Damaged / Broken in Shop</option>
                    )}
                    {isNegativeAdj && (
                      <option value="Theft">Shrinkage / Missing (Theft)</option>
                    )}
                    {isNegativeAdj && (
                      <option value="Expired">Expired / Unusable</option>
                    )}
                    {isPositiveAdj && (
                      <option value="Found">Found Inventory</option>
                    )}
                    <option value="DataError">Data Entry Correction</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Audit Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!selectedItem}
                    placeholder="Detailed explanation for the auditors..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-20"
                  />
                </div>
              </div>
            </div>

            {/* Physical Evidence Gate */}
            <div className="space-y-1 h-full flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex justify-between">
                <span>
                  Physical Proof{" "}
                  {isNegativeAdj && <span className="text-rose-500">*</span>}
                </span>
                <span className="text-indigo-500">
                  {isNegativeAdj ? "Required for Loss" : "Optional"}
                </span>
              </label>
              <div
                className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col justify-center items-center text-center transition-all ${
                  proofAttached
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                    : !selectedItem || qtyDelta === 0
                      ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20"
                      : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500"
                }`}
              >
                {proofAttached ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                      Image Uploaded
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera
                      size={32}
                      className={
                        !selectedItem || qtyDelta === 0
                          ? "text-slate-300 dark:text-slate-600"
                          : "text-slate-400"
                      }
                    />
                    <p
                      className={`text-xs font-bold ${!selectedItem || qtyDelta === 0 ? "text-slate-400 dark:text-slate-500" : "text-slate-500"}`}
                    >
                      Upload photo of damaged/found item
                    </p>
                    <button
                      onClick={handleSimulateUpload}
                      disabled={!selectedItem || qtyDelta === 0}
                      className="mt-2 px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Valuation Lock & Financial Impact Panel */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 md:p-8 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full"></div>

          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-700 dark:border-white/10 pb-4 mb-6 flex items-center gap-2">
              <Info size={16} className="text-indigo-500" /> Financial Impact
              Preview
            </h3>

            {selectedItem ? (
              <div className="space-y-6">
                {/* Delta Display */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">
                    Net Quantity Change:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl text-slate-500">
                      {currentQty}
                    </span>
                    <ArrowRight size={16} className="text-slate-500" />
                    <span
                      className={`font-mono text-2xl font-black ${qtyDelta === 0 ? "text-slate-300" : isNegativeAdj ? "text-rose-400" : "text-emerald-400"}`}
                    >
                      {targetQty}
                    </span>
                  </div>
                </div>

                {/* Valuation Lock Info */}
                <div className="bg-slate-800 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-700 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex justify-between">
                    Valuation Lock Applied
                    <span className="text-indigo-400">Moving Average</span>
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-300">
                    ₱{selectedItem.movingAvgCost.toFixed(2)} / unit
                  </p>
                </div>

                {/* Balance Sheet Impact */}
                <div className="pt-4 border-t border-slate-700 dark:border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Balance Sheet Impact (Asset Value)
                  </p>
                  <h2
                    className={`text-4xl font-mono font-black ${qtyDelta === 0 ? "text-white" : isNegativeAdj ? "text-rose-500" : "text-emerald-500"}`}
                  >
                    {qtyDelta === 0
                      ? "₱0.00"
                      : `${isNegativeAdj ? "-" : "+"}${formatCurrency(valueImpact)}`}
                  </h2>
                  {isNegativeAdj && (
                    <p className="text-[10px] font-bold text-rose-400 mt-2">
                      *This will trigger a Shrinkage Expense on the P&L.
                    </p>
                  )}
                </div>

                {/* Reorder Alert */}
                {triggersReorder && (
                  <div className="bg-amber-500/20 text-amber-400 p-3 rounded-xl border border-amber-500/30 flex items-start gap-2 mt-4 animate-in fade-in">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">
                        Low Stock Alert
                      </p>
                      <p className="text-[10px] font-bold opacity-80 mt-0.5">
                        This adjustment drops inventory below the reorder point
                        ({selectedItem.reorderPoint}).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                <PackageSearch size={48} className="text-slate-500 mb-4" />
                <p className="text-sm font-bold text-slate-400">
                  Select an item to preview valuation impact.
                </p>
              </div>
            )}
          </div>

          {/* Submit Gate */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none"
          >
            <Save size={16} />
            {isValid ? "Authorize Adjustment" : "Complete Required Fields"}
          </button>
        </div>
      </div>

      {/* FORENSIC AUDIT LOG */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <History size={14} className="text-amber-500" /> Historical Audit
              Log
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              Permanent record of all manual inventory adjustments.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4 pl-6">Date / Ref</th>
                <th className="p-4">Item Details</th>
                <th className="p-4 text-center">Qty Delta</th>
                <th className="p-4 text-right">Value Impact</th>
                <th className="p-4">Reason & Author</th>
                <th className="p-4 pr-6 text-center">Evidence</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
              {MOCK_AUDIT_LOG.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <p className="font-mono text-xs text-slate-500">
                      {log.date}
                    </p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase">
                      {log.id}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {log.item}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {log.branch}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`font-mono font-black px-2 py-1 rounded text-xs ${
                        log.qtyChange < 0
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                    >
                      {log.qtyChange > 0 ? "+" : ""}
                      {log.qtyChange}
                    </span>
                  </td>
                  <td
                    className={`p-4 text-right font-mono font-black ${
                      log.valueImpact < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {log.valueImpact > 0 ? "+" : ""}
                    {formatCurrency(log.valueImpact)}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {log.reason}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                      By: {log.author}
                    </p>
                  </td>
                  <td className="p-4 pr-6 text-center">
                    {log.hasProof ? (
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors border border-slate-200 dark:border-slate-600">
                        <Camera size={12} /> View
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        N/A
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustment;

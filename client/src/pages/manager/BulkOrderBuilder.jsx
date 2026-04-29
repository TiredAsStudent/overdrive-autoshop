import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan,
  FileText,
  ShoppingCart,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

// Simple stub for missing custom component if needed, replace with your actual import if it exists.
const StatusBadge = ({ status, type }) => (
  <span
    className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${type === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 text-slate-500"}`}
  >
    {status}
  </span>
);

const BulkOrderBuilder = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 1. MOCK DATA: Aggregated shortages found after scan (Now includes OCR Last Cost)
  const [shortages] = useState([
    {
      id: "P-101",
      name: "Fully Synthetic Oil (1L)",
      sku: "OIL-FS-01",
      needs: { main: 0, second: 15, third: 0 },
      totalNeeded: 15,
      lastOcrCost: 850,
    },
    {
      id: "P-102",
      name: "Genuine Oil Filter (Toyota)",
      sku: "FIL-TY-99",
      needs: { main: 25, second: 0, third: 18 },
      totalNeeded: 43,
      lastOcrCost: 450,
    },
    {
      id: "P-105",
      name: "Brake Fluid (DOT 4)",
      sku: "FLU-BF-04",
      needs: { main: 5, second: 5, third: 5 },
      totalNeeded: 15,
      lastOcrCost: 350,
    },
  ]);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowResults(true);
    }, 2000);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  // Changed 'unitCost' to 'lastOcrCost' to align with the research plan
  const grandTotal = shortages.reduce(
    (acc, item) => acc + item.totalNeeded * item.lastOcrCost,
    0,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 2. SCANNING INTERFACE (Your Exact Animation & Layout) */}
      {!showResults ? (
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-8 relative overflow-hidden">
            <div className="h-24 w-24 bg-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/20 relative">
              <Scan
                size={48}
                className={`text-white ${isScanning ? "animate-pulse" : ""}`}
              />
              {isScanning && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute left-0 w-full h-1 bg-white/50 blur-sm"
                />
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                Enterprise Scan
              </h2>
              <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto font-medium">
                Click below to identify every item across the Main, Second, and
                Third branches that has fallen below its healthy stock
                threshold.
              </p>
            </div>

            <button
              onClick={runScan}
              disabled={isScanning}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 group"
            >
              {isScanning
                ? "Querying Databases..."
                : "Run Global Shortage Scan"}
              {!isScanning && (
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* 3. AUTOMATED SHOPPING LIST VIEW */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status="Scan Complete" type="success" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Calculated Shortages Found
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight flex items-center gap-3">
                Bulk Purchase Request
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowResults(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 font-bold rounded-xl text-sm transition-all hover:bg-slate-200 dark:hover:bg-white/10"
              >
                Reset Scan
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || exportSuccess}
                className={`px-8 py-3 font-black rounded-xl flex items-center justify-center gap-2 shadow-lg text-sm transition-all ${
                  exportSuccess
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105"
                }`}
              >
                {isExporting ? (
                  <span className="animate-spin text-lg">↻</span>
                ) : exportSuccess ? (
                  <CheckCircle size={18} />
                ) : (
                  <Download size={18} />
                )}
                {isExporting
                  ? "Generating..."
                  : exportSuccess
                    ? "Exported"
                    : "Export PDF List"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Shortage Table (Your exact layout, just slightly tweaked headers to match Enterprise plan) */}
            <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-white/5">
                      <th className="px-6 py-5">Part Details</th>
                      <th className="px-4 py-5 text-center">Main</th>
                      <th className="px-4 py-5 text-center">Second</th>
                      <th className="px-4 py-5 text-center">Third</th>
                      <th className="px-6 py-5 text-right text-emerald-500">
                        Unit Cost
                      </th>
                      <th className="px-6 py-5 text-right text-amber-500">
                        Order Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {shortages.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">
                            {item.sku}
                          </p>
                        </td>
                        <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">
                          {item.needs.main > 0 ? (
                            <span className="text-red-500">
                              +{item.needs.main}
                            </span>
                          ) : (
                            "0"
                          )}
                        </td>
                        <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">
                          {item.needs.second > 0 ? (
                            <span className="text-red-500">
                              +{item.needs.second}
                            </span>
                          ) : (
                            "0"
                          )}
                        </td>
                        <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">
                          {item.needs.third > 0 ? (
                            <span className="text-red-500">
                              +{item.needs.third}
                            </span>
                          ) : (
                            "0"
                          )}
                        </td>
                        <td className="px-6 py-5 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          ₱{item.lastOcrCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl font-black text-sm">
                            {item.totalNeeded}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* The "OCR Bridge" Notice */}
              <div className="p-4 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border-t border-amber-100 dark:border-amber-500/10 flex items-start gap-4">
                <ShieldCheck
                  className="text-amber-500 shrink-0 mt-1"
                  size={24}
                />
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest mb-1">
                    The OCR Verification Loop
                  </h4>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    Exporting this list creates the{" "}
                    <strong>"Expected Receipt."</strong> When the supplier
                    delivers these items, scanning their invoice through the OCR
                    Intake module will automatically verify that the delivered
                    quantities match this request.
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary Card (Your beautiful dark layout preserved) */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden h-full">
              <div className="absolute right-0 top-0 p-8 opacity-5">
                <ShoppingCart size={150} />
              </div>
              <div className="space-y-8 z-10 flex-1 flex flex-col justify-center">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-6">
                    OCR Cost Forecasting
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                      <span className="text-slate-400 font-bold">
                        Total SKUs Needed
                      </span>
                      <span className="font-black">
                        {shortages.length} Items
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                      <span className="text-slate-400 font-bold">
                        Total Physical Volume
                      </span>
                      <span className="font-black">
                        {shortages.reduce((acc, i) => acc + i.totalNeeded, 0)}{" "}
                        Units
                      </span>
                    </div>
                    <div className="pt-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center justify-between">
                        Projected Purchase Value
                        <span className="px-2 py-0.5 bg-white/10 rounded text-[8px] text-slate-300">
                          Based on Last Scan
                        </span>
                      </p>
                      <p className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter mt-2">
                        ₱{grandTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/10 z-10">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
                  <AlertCircle
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={16}
                  />
                  <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                    Final totals will depend on vendor pricing approved in the
                    OCR module upon delivery. This is an estimate based on
                    historical data.
                  </p>
                </div>
                <button className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-2xl uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2">
                  <Printer size={16} /> Print PR Form
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BulkOrderBuilder;

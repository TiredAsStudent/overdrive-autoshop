import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Printer,
  Share2,
  ArrowRightLeft,
  ShieldCheck,
  PlusCircle,
  History,
  ArrowLeft,
  Car,
  Save,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

// Context & Components
// const { useApp } = require("../../context/AppContext"); // Uncomment for real app
const useApp = () => ({
  activeVehicle: "ABC 1234",
  activeCustomer: { name: "Jay Agustin" },
}); // Mock
import { LineItemBuilder } from "../../features/staff/components/LineItemBuilder";
import { ServiceTemplateSelector } from "../../features/staff/components/ServiceTemplateSelector";

// MOCK DATA: Active vehicles currently in the workshop
const WORKSHOP_VEHICLES = [
  {
    id: "v1",
    plate: "ABC 1234",
    customer: "Jay Agustin",
    model: "Toyota Hilux",
  },
  {
    id: "v2",
    plate: "XYZ 9876",
    customer: "Maria Clara",
    model: "Honda Civic",
  },
  {
    id: "v3",
    plate: "GEE 3344",
    customer: "Juan Dela Cruz",
    model: "Ford Ranger",
  },
];

const Estimates = () => {
  const [view, setView] = useState("list"); // 'list' | 'builder'

  // Dynamic Vehicle Selection
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    WORKSHOP_VEHICLES[0].id,
  );
  const activeVehicleData = WORKSHOP_VEHICLES.find(
    (v) => v.id === selectedVehicleId,
  );

  // --- MOCK DATABASE (List View) ---
  const [estimateHistory] = useState([
    {
      id: "EST-2026-089",
      date: "Apr 23, 2026",
      plate: "ABC 1234",
      customer: "Jay Agustin",
      total: 13650,
      status: "Draft",
    },
    {
      id: "EST-2026-088",
      date: "Apr 22, 2026",
      plate: "XYZ 9876",
      customer: "Maria Clara",
      total: 4500,
      status: "Sent",
    },
  ]);

  // --- BUILDER STATE ---
  const [items, setItems] = useState([
    { desc: "Labor Charge", qty: 1, price: 500, ocrCost: 0, type: "service" },
  ]);
  const pdfRef = useRef();
  const handlePrint = useReactToPrint({ content: () => pdfRef.current });

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.qty * item.price, 0);
  const markup = subtotal * 0.25;
  const vat = (subtotal + markup) * 0.12;
  const grandTotal = subtotal + markup + vat;

  // Handlers
  const addTemplate = (template) => setItems([...items, ...template.items]);

  const copyEstimateLink = () => {
    navigator.clipboard.writeText(`https://overdrive-portal.com/view/est-999`);
    alert(
      "Unique link copied! Paste this into Messenger or Viber for the customer.",
    );
  };

  const handleSaveDraft = () => {
    alert(
      `Draft Estimate for ${activeVehicleData.plate} has been saved successfully.`,
    );
    setView("list");
  };

  const handleConversion = () => {
    const hasBelowCost = items.some(
      (i) => i.type === "inventory" && i.price < i.ocrCost,
    );
    if (hasBelowCost) {
      alert(
        "WARNING: Items are priced below OCR Historical Cost. Manager override required.",
      );
      return;
    }
    alert(
      `Converted to Sales Order for ${activeVehicleData.plate}! Inventory has been officially locked and reserved.`,
    );
    setView("list");
  };

  return (
    <div className="max-w-7xl mx-auto py-6 animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        {/* ========================================== */}
        {/* VIEW A: THE MANAGEMENT LIST (READ)         */}
        {/* ========================================== */}
        {view === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                  Estimates & Quotes
                </h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                  <FileText size={16} className="text-amber-500" /> Non-Posting
                  Document Hub
                </p>
              </div>
              <button
                onClick={() => setView("builder")}
                className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
              >
                <PlusCircle size={18} /> Create New Estimate
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-black/20 text-[10px] uppercase font-black text-slate-400 border-b border-slate-200 dark:border-white/10">
                    <th className="py-4 px-6">Estimate ID</th>
                    <th className="py-4 px-6">Customer & Vehicle</th>
                    <th className="py-4 px-6 text-right">Total Amount</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {estimateHistory.map((est) => (
                    <tr
                      key={est.id}
                      className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {est.id}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-0.5">
                          <History size={10} /> {est.date}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {est.customer}
                        </p>
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5">
                          {est.plate}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900 dark:text-white">
                        ₱{est.total.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${est.status === "Draft" ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300" : "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}`}
                        >
                          {est.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setView("builder")}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Open / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* VIEW B: THE BUILDER (CREATE/UPDATE)        */}
        {/* ========================================== */}
        {view === "builder" && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-8"
          >
            <div className="xl:col-span-2 space-y-6">
              <button
                onClick={() => setView("list")}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mb-2"
              >
                <ArrowLeft size={16} /> Back to Estimates List
              </button>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
                {/* UPGRADED HEADER: Vehicle Selector */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                  <div>
                    <span className="inline-block px-2.5 py-1 mb-2 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-500/20">
                      Non-Posting Document
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                      <FileText className="text-amber-500" /> Estimate Builder
                    </h2>
                  </div>

                  {/* Select Target Vehicle */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-white/10 w-full md:w-64">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Car size={12} /> Link to Active Vehicle
                    </label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full bg-transparent text-lg font-black text-slate-900 dark:text-overdrive-yellow tracking-tighter outline-none cursor-pointer"
                    >
                      {WORKSHOP_VEHICLES.map((v) => (
                        <option
                          key={v.id}
                          value={v.id}
                          className="text-base text-slate-900"
                        >
                          {v.plate} ({v.customer})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <ServiceTemplateSelector onSelect={addTemplate} />
                <LineItemBuilder items={items} setItems={setItems} />

                <div className="mt-8 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10">
                  <ShieldCheck
                    className="text-blue-500 shrink-0 mt-0.5"
                    size={18}
                  />
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-relaxed">
                    This document is used for negotiation. Tracked inventory
                    items will <strong className="font-black">not</strong> be
                    subtracted from the warehouse until converted to a Sales
                    Order.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Summary & Actions */}
            <div className="space-y-6 pt-8 xl:pt-12">
              <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <FileText size={150} />
                </div>

                <div className="relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-6 border-b border-white/10 pb-4">
                    Quoting For
                  </h3>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <p className="text-xl font-black text-white">
                      {activeVehicleData.customer}
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Plate: {activeVehicleData.plate}
                    </p>
                  </div>

                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-6 border-b border-white/10 pb-4">
                    Estimate Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-400">Parts & Labor</span>
                      <span>₱{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-400">
                        Service Markup (25%)
                      </span>
                      <span>₱{markup.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-400">Tax (VAT 12%)</span>
                      <span>₱{vat.toLocaleString()}</span>
                    </div>
                    <div className="pt-6 mt-6 border-t border-white/10">
                      <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Estimated Total
                      </span>
                      <span className="text-5xl font-black text-amber-500 tracking-tighter italic">
                        ₱{grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-3 relative z-10">
                  <button
                    onClick={handleSaveDraft}
                    className="w-full py-3.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <Save size={16} /> Save as Draft
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handlePrint}
                      className="w-full py-3.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Printer size={16} /> Print
                    </button>
                    <button
                      onClick={copyEstimateLink}
                      className="w-full py-3.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Share2 size={16} /> Link
                    </button>
                  </div>
                  <button
                    onClick={handleConversion}
                    className="w-full py-5 mt-2 bg-amber-500 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
                  >
                    <ArrowRightLeft size={16} /> Convert to Sales Order
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden">
              <div ref={pdfRef}>PDF Template</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Estimates;

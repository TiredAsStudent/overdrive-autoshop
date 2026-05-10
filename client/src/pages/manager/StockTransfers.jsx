import React, { useState, useMemo } from "react";
import {
  Truck,
  MapPin,
  ArrowRightLeft,
  Search,
  PackageCheck,
  PackageOpen,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileDigit,
  Send,
  Download,
  Boxes,
} from "lucide-react";

// --- DUMMY DATA ENGINE ---

// Mock Inventory (Cross-Branch Visibility)
const MOCK_GLOBAL_INVENTORY = [
  {
    id: "ITEM-001",
    name: "Full Synthetic Motor Oil (1L)",
    Calamba: 48,
    Batino: 12,
    Biñan: 5,
    movingAvgCost: 450.0,
  },
  {
    id: "ITEM-002",
    name: "Brake Pad Set - Sedan",
    Calamba: 15,
    Batino: 2,
    Biñan: 8,
    movingAvgCost: 1200.0,
  },
  {
    id: "ITEM-003",
    name: "Spark Plug (Iridium)",
    Calamba: 10,
    Batino: 105,
    Biñan: 20,
    movingAvgCost: 850.0,
  },
];

// Mock Transfer Ledger
const MOCK_TRANSFERS = [
  {
    id: "TRF-8802",
    source: "Calamba",
    dest: "Batino",
    item: "Full Synthetic Motor Oil (1L)",
    qty: 10,
    status: "In-Transit",
    date: "2026-05-10",
    dispatchedBy: "M. Reyes",
  },
  {
    id: "TRF-8801",
    source: "Batino",
    dest: "Biñan",
    item: "Spark Plug (Iridium)",
    qty: 25,
    status: "Received",
    date: "2026-05-09",
    dispatchedBy: "L. Cruz",
    receivedBy: "J. Santos",
  },
  {
    id: "TRF-8799",
    source: "Calamba",
    dest: "Biñan",
    item: "Brake Pad Set - Sedan",
    qty: 5,
    status: "Discrepancy",
    date: "2026-05-08",
    dispatchedBy: "M. Reyes",
    receivedBy: "J. Santos",
    note: "Only 4 received. 1 marked lost.",
  },
];

const StockTransfers = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState("Dashboard"); // Dashboard, NewTransfer, Receive

  // --- DASHBOARD STATE ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- NEW TRANSFER STATE ---
  const [transferSource, setTransferSource] = useState("Calamba");
  const [transferDest, setTransferDest] = useState("Batino");
  const [transferItemId, setTransferItemId] = useState("");
  const [transferQty, setTransferQty] = useState("");

  // --- RECEIVE STATE (TID HANDSHAKE) ---
  const [tidInput, setTidInput] = useState("TRF-8802"); // Pre-filled for demo
  const [actualReceivedQty, setActualReceivedQty] = useState("");

  // --- COMPUTED DATA ---
  const filteredTransfers = useMemo(() => {
    return MOCK_TRANSFERS.filter(
      (t) =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.item.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const selectedItemForTransfer = MOCK_GLOBAL_INVENTORY.find(
    (i) => i.id === transferItemId,
  );
  const availableQtyAtSource = selectedItemForTransfer
    ? selectedItemForTransfer[transferSource]
    : 0;

  // TID Lookup Logic
  const pendingTransferToReceive = MOCK_TRANSFERS.find(
    (t) => t.id === tidInput && t.status === "In-Transit",
  );
  const hasDiscrepancy =
    pendingTransferToReceive &&
    actualReceivedQty !== "" &&
    parseInt(actualReceivedQty) !== pendingTransferToReceive.qty;

  // --- HANDLERS ---
  const handleDispatch = () => {
    alert(
      `Transfer Dispatched! \n${transferQty}x ${selectedItemForTransfer.name} moving from ${transferSource} to ${transferDest}. \nInventory moved to "In-Transit" holding account.`,
    );
    setActiveTab("Dashboard");
    setTransferItemId("");
    setTransferQty("");
  };

  const handleReceive = () => {
    if (hasDiscrepancy) {
      alert(
        `Receipt Confirmed with Discrepancy! \nReceived: ${actualReceivedQty} | Expected: ${pendingTransferToReceive.qty}. \nA Stock Adjustment (-${pendingTransferToReceive.qty - actualReceivedQty}) has been automatically generated for the missing items.`,
      );
    } else {
      alert(
        `Receipt Confirmed! \n${actualReceivedQty} units successfully added to ${pendingTransferToReceive.dest} inventory.`,
      );
    }
    setActiveTab("Dashboard");
    setActualReceivedQty("");
    setTidInput("");
  };

  // --- UI HELPERS ---
  const getStatusBadge = (status) => {
    switch (status) {
      case "In-Transit":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
      case "Received":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
      case "Discrepancy":
        return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & MAIN NAVIGATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <Truck className="text-indigo-500" size={28} />
            Stock Transfers
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Inter-Branch Logistics & In-Transit Auditing
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/5">
          <button
            onClick={() => setActiveTab("Dashboard")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "Dashboard" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Tracking Board
          </button>
          <button
            onClick={() => setActiveTab("NewTransfer")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeTab === "NewTransfer" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <Send size={14} /> Dispatch Stock
          </button>
          <button
            onClick={() => setActiveTab("Receive")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeTab === "Receive" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            <PackageCheck size={14} /> Receive TID
          </button>
        </div>
      </div>

      {/* ================================================================================================= */}
      {/* VIEW 1: TRACKING BOARD & DASHBOARD */}
      {/* ================================================================================================= */}
      {activeTab === "Dashboard" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full"></div>
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-indigo-500" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Active In-Transit Moves
                </p>
              </div>
              <h2 className="text-3xl font-mono font-black text-white">4</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-4">
                Stock currently locked in virtual holding.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <PackageCheck size={16} className="text-emerald-500" />
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Successful Receipts (30d)
                </p>
              </div>
              <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white">
                12
              </h2>
              <p className="text-[10px] font-bold text-slate-400 mt-4">
                Transfers verified and accounted for.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-rose-200 dark:border-rose-500/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-rose-500" />
                <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">
                  Discrepancy Flags
                </p>
              </div>
              <h2 className="text-3xl font-mono font-black text-rose-600 dark:text-rose-400">
                1
              </h2>
              <p className="text-[10px] font-bold text-slate-400 mt-4">
                Requires Manager investigation.
              </p>
            </div>
          </div>

          {/* Transfer Tracking Ledger */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by TID or Item Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <button className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <Download size={14} /> Waybill Export
              </button>
            </div>

            <div className="overflow-x-auto pb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                    <th className="p-4 pl-6">Transfer ID (TID)</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Item Payload</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">Signatures</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
                  {filteredTransfers.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 pl-6">
                        <p className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {t.id}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {t.date}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {t.source}
                          </span>
                          <ArrowRightLeft
                            size={12}
                            className="text-slate-400"
                          />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {t.dest}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {t.item}
                        </p>
                        <span className="font-mono text-xs text-slate-500">
                          Qty: {t.qty}
                        </span>
                        {t.note && (
                          <p className="text-[10px] text-rose-500 mt-1">
                            {t.note}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(t.status)}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                          Out:{" "}
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {t.dispatchedBy}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                          In:{" "}
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {t.receivedBy || "Pending..."}
                          </span>
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================================================= */}
      {/* VIEW 2: NEW TRANSFER (MANIFEST CREATOR) */}
      {/* ================================================================================================= */}
      {activeTab === "NewTransfer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Global Stock Finder Panel */}
          <div className="lg:col-span-1 bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm flex flex-col">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-700 dark:border-white/10 pb-4 mb-6 flex items-center gap-2">
              <Search size={16} className="text-indigo-500" /> Cross-Branch
              Stock Finder
            </h3>

            {selectedItemForTransfer ? (
              <div className="space-y-6">
                <p className="font-bold text-white leading-tight">
                  {selectedItemForTransfer.name}
                </p>
                <div className="space-y-3">
                  {["Calamba", "Batino", "Biñan"].map((branch) => (
                    <div
                      key={branch}
                      className={`flex justify-between items-center p-3 rounded-xl border ${branch === transferSource ? "bg-indigo-500/20 border-indigo-500/50" : "bg-slate-800 border-slate-700 dark:border-white/5"}`}
                    >
                      <span
                        className={`text-sm font-bold ${branch === transferSource ? "text-indigo-400" : "text-slate-300"}`}
                      >
                        {branch}
                      </span>
                      <span className="font-mono font-black text-white">
                        {selectedItemForTransfer[branch]} units
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mt-auto">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Moving Average Locked
                  </p>
                  <p className="text-xs text-amber-400/80">
                    Asset valuation will transfer at ₱
                    {selectedItemForTransfer.movingAvgCost.toFixed(2)} per unit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center opacity-50 my-auto">
                <Boxes size={48} className="text-slate-500 mb-4" />
                <p className="text-sm font-bold text-slate-400">
                  Select an item to view global availability.
                </p>
              </div>
            )}
          </div>

          {/* Dispatch Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b border-slate-100 dark:border-white/10 pb-4 mb-6 flex items-center gap-2">
              <FileDigit size={16} /> Digital Waybill & Dispatch
            </h3>

            <div className="space-y-6">
              {/* Route Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <MapPin size={12} /> Origin Branch
                  </label>
                  <select
                    value={transferSource}
                    onChange={(e) => {
                      setTransferSource(e.target.value);
                      setTransferItemId("");
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="Calamba">Calamba</option>
                    <option value="Batino">Batino</option>
                    <option value="Biñan">Biñan</option>
                  </select>
                </div>
                <div className="hidden sm:flex justify-center pb-3">
                  <ArrowRightLeft className="text-slate-300 dark:text-slate-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <MapPin size={12} /> Destination Branch
                  </label>
                  <select
                    value={transferDest}
                    onChange={(e) => setTransferDest(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    {["Calamba", "Batino", "Biñan"]
                      .filter((b) => b !== transferSource)
                      .map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Item Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Payload Item <span className="text-rose-500">*</span>
                </label>
                <select
                  value={transferItemId}
                  onChange={(e) => {
                    setTransferItemId(e.target.value);
                    setTransferQty("");
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="" disabled>
                    Select item to transfer...
                  </option>
                  {MOCK_GLOBAL_INVENTORY.filter(
                    (i) => i[transferSource] > 0,
                  ).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Avail: {item[transferSource]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex justify-between">
                  <span>
                    Dispatch Quantity <span className="text-rose-500">*</span>
                  </span>
                  {selectedItemForTransfer && (
                    <span className="text-indigo-500 font-mono">
                      Max: {availableQtyAtSource}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  disabled={!selectedItemForTransfer}
                  max={availableQtyAtSource}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-500/50 rounded-xl text-sm font-mono font-black text-indigo-700 dark:text-indigo-400 outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <button
                onClick={handleDispatch}
                disabled={
                  !selectedItemForTransfer ||
                  !transferQty ||
                  transferQty <= 0 ||
                  transferQty > availableQtyAtSource
                }
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none"
              >
                <Truck size={16} /> Authorize & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================================================= */}
      {/* VIEW 3: RECEIVE STOCK (TID HANDSHAKE & DISCREPANCY LOGIC) */}
      {/* ================================================================================================= */}
      {activeTab === "Receive" && (
        <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <PackageOpen size={24} className="text-emerald-500" /> TID
                Security Gate
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Scan or manually enter the Transfer ID (TID) from the physical
                delivery waybill to unlock the cargo details.
              </p>

              <div className="mt-6 flex gap-3">
                <input
                  type="text"
                  value={tidInput}
                  onChange={(e) => setTidInput(e.target.value)}
                  placeholder="e.g., TRF-8802"
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl text-lg font-mono font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-all uppercase"
                />
              </div>
            </div>

            {pendingTransferToReceive ? (
              <div className="p-6 md:p-8 space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-2">
                    Verified Cargo Manifest
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">
                    {pendingTransferToReceive.item}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      From:{" "}
                      <span className="text-slate-900 dark:text-white">
                        {pendingTransferToReceive.source}
                      </span>
                    </p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Auth By:{" "}
                      <span className="text-slate-900 dark:text-white">
                        {pendingTransferToReceive.dispatchedBy}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Expected Qty
                    </p>
                    <p className="font-mono text-3xl font-black text-slate-400">
                      {pendingTransferToReceive.qty}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Actual Received <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={actualReceivedQty}
                      onChange={(e) => setActualReceivedQty(e.target.value)}
                      placeholder="0"
                      className={`w-full h-full min-h-[72px] text-center px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl text-3xl font-mono font-black outline-none transition-all ${
                        hasDiscrepancy
                          ? "border-rose-500 text-rose-500 focus:border-rose-600"
                          : "border-emerald-200 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {hasDiscrepancy && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl flex gap-3 animate-in fade-in">
                    <AlertTriangle
                      className="text-rose-500 shrink-0"
                      size={20}
                    />
                    <div>
                      <p className="text-xs font-black uppercase text-rose-600 dark:text-rose-400">
                        Discrepancy Detected
                      </p>
                      <p className="text-[10px] font-bold text-rose-500 mt-1">
                        You are receiving {actualReceivedQty} out of{" "}
                        {pendingTransferToReceive.qty}. Confirming this will
                        automatically flag a Stock Loss adjustment for the
                        missing{" "}
                        {pendingTransferToReceive.qty -
                          parseInt(actualReceivedQty)}{" "}
                        units.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleReceive}
                  disabled={!actualReceivedQty}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none ${
                    hasDiscrepancy
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/30"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  {hasDiscrepancy
                    ? "Accept With Discrepancy"
                    : "Confirm Perfect Receipt"}
                </button>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center text-center opacity-50">
                <Clock size={48} className="text-slate-400 mb-4" />
                <p className="text-sm font-bold text-slate-500">
                  Enter a valid "In-Transit" TID to unlock the receipt form.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransfers;

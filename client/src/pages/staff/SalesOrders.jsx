import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Info,
  Plus,
  ChevronRight,
  FileCheck,
  XCircle,
  Database,
  AlertCircle,
  Receipt,
} from "lucide-react";

// ==========================================
// MOCK DATA & CONSTANTS
// ==========================================
const MOCK_USER = { assigned_branch: "Batino Branch" };

const INVENTORY_DB = [
  { id: "i1", desc: "Standard Wiper Blade", price: 800, type: "inventory" },
  { id: "i2", desc: "Cabin Air Filter", price: 1200, type: "inventory" },
  { id: "i3", desc: "Brake Fluid (DOT 4)", price: 450, type: "inventory" },
  { id: "i4", desc: "Additional Labor (1hr)", price: 500, type: "service" },
];

const SalesOrders = ({ user = MOCK_USER }) => {
  // --- STATE ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [supplementId, setSupplementId] = useState("");

  const [orders, setOrders] = useState([
    {
      id: "SO-2026-001",
      plate: "ABC 1234",
      customer: "Christian Leo Cereno",
      items: [
        {
          id: "p1",
          name: "Fully Synthetic Oil",
          qty: 4,
          price: 850,
          status: "reserved",
        },
        {
          id: "s1",
          name: "Labor Charge",
          qty: 1,
          price: 500,
          status: "service",
        },
      ],
      total: 4750,
      status: "Ongoing",
    },
    {
      id: "SO-2026-002",
      plate: "XYZ 9876",
      customer: "Santi Gear",
      items: [
        {
          id: "p3",
          name: "Brake Pads (Front)",
          qty: 1,
          price: 2500,
          status: "reserved",
        },
        {
          id: "s2",
          name: "Labor Charge",
          qty: 1,
          price: 500,
          status: "service",
        },
      ],
      total: 3000,
      status: "Ongoing",
    },
  ]);

  // --- DYNAMIC CALCULATIONS ---
  // Accrual Basis: Sum of all active WIP orders
  const accruedRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  // --- HANDLERS ---
  const handleAddSupplement = () => {
    if (!supplementId || !selectedOrder) return;

    const partToAdd = INVENTORY_DB.find((p) => p.id === supplementId);
    if (!partToAdd) return;

    const newItem = {
      id: `supp-${Date.now()}`,
      name: partToAdd.desc,
      qty: 1,
      price: partToAdd.price,
      status: partToAdd.type === "inventory" ? "reserved" : "service",
    };

    // Update the specific order in the main state
    const updatedOrders = orders.map((order) => {
      if (order.id === selectedOrder.id) {
        const updatedItems = [...order.items, newItem];
        const newTotal = updatedItems.reduce(
          (acc, item) => acc + item.qty * item.price,
          0,
        );
        return { ...order, items: updatedItems, total: newTotal };
      }
      return order;
    });

    setOrders(updatedOrders);
    // Update the local selected order modal state so UI refreshes
    setSelectedOrder(updatedOrders.find((o) => o.id === selectedOrder.id));
    setSupplementId(""); // Reset dropdown
  };

  const handleGenerateInvoice = (orderId) => {
    alert(
      `Success! Final Invoice generated for ${selectedOrder.plate}. Inventory officially subtracted. Workshop Kanban updated to 'Done'.`,
    );
    setOrders(orders.filter((o) => o.id !== orderId));
    setSelectedOrder(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 py-6">
      {/* 1. HEADER & ACCRUAL VISIBILITY */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200 dark:border-blue-500/20">
              Active Commitments
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white transition-colors tracking-tight italic uppercase">
            Sales Orders (WIP)
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-bold">
            Inventory reserved for active repairs in{" "}
            <span className="text-amber-600 dark:text-overdrive-yellow font-black uppercase tracking-widest">
              {user?.assigned_branch}
            </span>
            .
          </p>
        </div>

        {/* Admin Revenue Insight Badge */}
        <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              Unbilled Accrual Revenue
            </p>
            <p className="text-2xl font-black text-white tracking-tighter">
              ₱{accruedRevenue.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                WIP Value
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. SALES ORDERS LIST */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px]"
            >
              <Box
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
              />
              <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                No Active Sales Orders
              </p>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Convert an Estimate to begin.
              </p>
            </motion.div>
          ) : (
            orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onClick={() => setSelectedOrder(order)}
                className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition-all group"
              >
                {/* Left: Info */}
                <div className="flex gap-6 items-center w-full xl:w-auto">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Box size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {order.id}
                      </h3>
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                        {order.plate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Customer:{" "}
                      <span className="text-slate-700 dark:text-slate-300">
                        {order.customer}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Middle: Reserved Parts (The Blue Status UI) */}
                <div className="flex-1 xl:max-w-2xl bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-3 flex items-center gap-1.5 tracking-widest">
                    Committed Stock <Info size={12} />
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest
                          ${item.status === "reserved" ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}
                      >
                        {item.status === "reserved" && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                        )}
                        {item.name}{" "}
                        <span className="opacity-70">(x{item.qty})</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">
                      + {order.items.length} Items Linked
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between w-full xl:w-auto gap-8 pl-4 xl:border-l border-slate-100 dark:border-white/10">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                      WIP Exposure
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                      ₱{order.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 3. ORDER MANAGEMENT MODAL (Detail & Supplements) */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-slate-50 dark:bg-black/20">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedOrder.id}
                    </h2>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-500/20 flex items-center gap-1">
                      <AlertCircle size={12} /> Workshop Active
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Plate:{" "}
                    <span className="text-slate-900 dark:text-white">
                      {selectedOrder.plate}
                    </span>{" "}
                    • Customer: {selectedOrder.customer}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <XCircle size={32} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                {/* Committed Items Table */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Box size={14} /> Currently Committed Items
                  </h3>
                  <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <th className="p-4">Item & Status</th>
                          <th className="p-4 text-center">Qty</th>
                          <th className="p-4 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {selectedOrder.items.map((item) => (
                          <tr
                            key={item.id}
                            className="bg-white dark:bg-slate-900/50"
                          >
                            <td className="p-4">
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                {item.name}
                              </p>
                              {item.status === "reserved" ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />{" "}
                                  Reserved Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                                  Labor / Service
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                              {item.qty}
                            </td>
                            <td className="p-4 text-right font-black text-slate-900 dark:text-white">
                              ₱{item.price.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Supplement Engine */}
                <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Plus size={14} /> Add Supplement (Discovered Issue)
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={supplementId}
                      onChange={(e) => setSupplementId(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/20 text-slate-700 dark:text-slate-300 text-sm font-bold px-4 py-3 rounded-xl outline-none focus:border-blue-500"
                    >
                      <option value="">
                        -- Select Parts / Labor from Database --
                      </option>
                      {INVENTORY_DB.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.desc} (+₱{inv.price})
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={!supplementId}
                      className="px-6 py-3 bg-blue-600 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                    >
                      Commit Part
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Updated WIP Total
                  </p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    ₱{selectedOrder.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 sm:flex-none px-6 py-4 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleGenerateInvoice(selectedOrder.id)}
                    className="flex-1 sm:flex-none px-8 py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileCheck size={16} /> Generate Final Invoice
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesOrders;

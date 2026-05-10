import React, { useState } from "react";
import {
  Wrench,
  Car,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowLeft,
  PenTool,
  HardDrive,
} from "lucide-react";

// --- MOCK DATA ENGINE ---
const MOCK_SERVICES = [
  {
    id: "SRV-01",
    type: "LABOR",
    code: "LBR-OIL",
    name: "Standard Change Oil",
    price: 500,
  },
  {
    id: "SRV-02",
    type: "LABOR",
    code: "LBR-BRK",
    name: "Brake Pad Replacement",
    price: 800,
  },
  {
    id: "SRV-03",
    type: "LABOR",
    code: "LBR-AC",
    name: "Aircon Freon Recharge",
    price: 1200,
  },
];

const MOCK_MECHANICS = [
  { id: 1, emp_id: "MECH-001", name: "Leo Cereno", specialty: "General Tech" },
  {
    id: 2,
    emp_id: "MECH-002",
    name: "Andrei Domingo",
    specialty: "Electrical",
  },
];

const MOCK_INVENTORY = [
  {
    id: "INV-99",
    type: "PART",
    code: "BRK-FLUID",
    name: "Brake Fluid (500ml)",
    price: 350,
    stockQty: 8,
  },
  {
    id: "INV-98",
    type: "PART",
    code: "WPR-BLD",
    name: "Wiper Blades",
    price: 600,
    stockQty: 15,
  },
];

const INITIAL_ORDERS = [
  {
    id: "JO-CAB-0042",
    plate: "NCO-1234",
    model: "Toyota Vios 2022",
    customer: "Juan Dela Cruz",
    status: "PENDING",
    items: [
      {
        id: 1,
        type: "LABOR",
        code: "LBR-OIL",
        name: "Standard Change Oil",
        price: 500,
        qty: 1,
        mechanic_id: null,
      },
      {
        id: 2,
        type: "PART",
        code: "OIL-SYN-4L",
        name: "Full Synthetic Motor Oil",
        price: 1800,
        qty: 1,
        isLocked: false,
      },
    ],
    totals: { base: 2053.57, vat: 246.43, grand: 2300 },
  },
  {
    id: "JO-CAB-0043",
    plate: "XYZ-9988",
    model: "Honda Civic RS",
    customer: "Maria Clara",
    status: "IN_PROGRESS",
    items: [
      {
        id: 3,
        type: "LABOR",
        code: "LBR-BRK",
        name: "Brake Pad Replacement",
        price: 800,
        qty: 1,
        mechanic_id: 1,
      },
      {
        id: 4,
        type: "PART",
        code: "BRK-PAD-HC",
        name: "Ceramic Brake Pads",
        price: 2500,
        qty: 1,
        isLocked: true,
      },
    ],
    totals: { base: 2946.43, vat: 353.57, grand: 3300 },
  },
];

const SalesOrders = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("DASHBOARD"); // "DASHBOARD" | "WORKSPACE"
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeOrder, setActiveOrder] = useState(null);

  // Workspace Modals State
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddLaborModal, setShowAddLaborModal] = useState(false);

  // --- LOGIC HANDLERS ---
  const openWorkspace = (order) => {
    setActiveOrder({ ...order });
    setView("WORKSPACE");
  };

  const closeWorkspace = () => {
    setActiveOrder(null);
    setShowAddPartModal(false);
    setShowAddLaborModal(false);
    setView("DASHBOARD");
  };

  const handleStatusChange = (newStatus) => {
    // If moving to IN_PROGRESS, hard-lock the inventory parts
    const updatedItems = activeOrder.items.map((item) => {
      if (newStatus === "IN_PROGRESS" && item.type === "PART") {
        return { ...item, isLocked: true };
      }
      return item;
    });

    setActiveOrder((prev) => ({
      ...prev,
      status: newStatus,
      items: updatedItems,
    }));
  };

  const assignMechanic = (itemId, mechanicId) => {
    const updatedItems = activeOrder.items.map((item) =>
      item.id === itemId
        ? { ...item, mechanic_id: parseInt(mechanicId) }
        : item,
    );
    setActiveOrder((prev) => ({ ...prev, items: updatedItems }));
  };

  // Generic function to recalculate totals
  const recalculateTotals = (newPrice) => {
    const newGrand = activeOrder.totals.grand + newPrice;
    const newBase = newGrand / 1.12;
    const newVat = newGrand - newBase;
    return { base: newBase, vat: newVat, grand: newGrand };
  };

  const addMidJobPart = (part) => {
    const newItem = {
      id: Date.now(),
      type: "PART",
      code: part.code,
      name: part.name,
      price: part.price,
      qty: 1,
      isLocked: true,
      isAddon: true,
    };

    setActiveOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      totals: recalculateTotals(part.price),
    }));
    setShowAddPartModal(false);
  };

  const addMidJobLabor = (service) => {
    const newItem = {
      id: Date.now(),
      type: "LABOR",
      code: service.code,
      name: service.name,
      price: service.price,
      qty: 1,
      mechanic_id: null, // Forces staff to assign a mechanic for the new labor
      isAddon: true,
    };

    setActiveOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      totals: recalculateTotals(service.price),
    }));
    setShowAddLaborModal(false);
  };

  const handleCompleteJob = () => {
    // Validation: Ensure all labor has a mechanic
    const unassignedLabor = activeOrder.items.find(
      (i) => i.type === "LABOR" && !i.mechanic_id,
    );
    if (unassignedLabor) {
      return alert(
        "ERROR: You must assign a mechanic to ALL labor tasks before completing the job. (Check for Add-on services too!)",
      );
    }

    alert(
      `Job ${activeOrder.id} Completed successfully! Sent to Invoicing Queue.`,
    );

    // Update main state and close
    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeOrder.id ? { ...activeOrder, status: "COMPLETED" } : o,
      ),
    );
    closeWorkspace();
  };

  // --- UI HELPERS ---
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
      case "IN_PROGRESS":
        return "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-400";
      case "WAITING_PARTS":
        return "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400";
      case "TESTING":
        return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400";
      default:
        return "";
    }
  };

  // =================================================================================================
  // VIEW 1: WIP DASHBOARD (Active Jobs)
  // =================================================================================================
  if (view === "DASHBOARD") {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              <Wrench className="text-indigo-500" size={28} />
              Workshop Pipeline (WIP)
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Calamba Branch • Active Jobs
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 py-2 rounded-xl flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Active WIP Asset Value
              </p>
              <p className="text-sm font-mono font-black text-emerald-500">
                ₱
                {orders
                  .reduce((acc, o) => acc + o.totals.grand, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => openWorkspace(order)}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="font-mono text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                    {order.id}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 uppercase">
                    {order.plate}
                  </h3>
                </div>
                <span
                  className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </div>
              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Car size={14} /> {order.model}
                </p>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                  <User size={14} /> {order.customer}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Mechanics Assigned
                  </p>
                  <div className="flex -space-x-2">
                    {order.items.filter(
                      (i) => i.type === "LABOR" && i.mechanic_id,
                    ).length > 0 ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-white">
                        {
                          order.items.filter(
                            (i) => i.type === "LABOR" && i.mechanic_id,
                          ).length
                        }
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                        <AlertCircle size={12} /> Needs Assignment
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-lg font-mono font-black text-slate-900 dark:text-white">
                  ₱{order.totals.grand.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 2: ACTIVE JOB WORKSPACE
  // =================================================================================================
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      {/* WORKSPACE HEADER */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
        <div className="pl-4">
          <button
            onClick={closeWorkspace}
            className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 mb-3 flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Exit Workspace
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase">
              {activeOrder.plate}
            </h1>
            <span className="font-mono text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
              {activeOrder.id}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500">
            {activeOrder.model} • {activeOrder.customer}
          </p>
        </div>

        {/* Status Controller */}
        <div className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
            Pipeline Status
          </p>
          <select
            className={`w-full md:w-48 appearance-none outline-none text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${getStatusColor(activeOrder.status)}`}
            value={activeOrder.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="PENDING">Pending (Queue)</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_PARTS">Waiting on Parts</option>
            <option value="TESTING">Testing / QC</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Resource Allocation */}
        <div className="lg:col-span-2 space-y-6">
          {/* MECHANIC ATTRIBUTION (LABOR) */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2">
                <PenTool size={18} className="text-indigo-500" /> Labor &
                Mechanic Assignment
              </h3>
            </div>

            <div className="space-y-4">
              {activeOrder.items
                .filter((i) => i.type === "LABOR")
                .map((labor) => (
                  <div
                    key={labor.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                        {labor.name}
                        {labor.isAddon && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] rounded uppercase border border-amber-500/20">
                            Mid-Job Addon
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                        {labor.code} • ₱{labor.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="w-full md:w-64">
                      <select
                        className={`w-full outline-none text-xs font-bold px-4 py-3 rounded-xl border-2 transition-all ${
                          labor.mechanic_id
                            ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        }`}
                        value={labor.mechanic_id || ""}
                        onChange={(e) =>
                          assignMechanic(labor.id, e.target.value)
                        }
                      >
                        <option value="" disabled>
                          ⚠️ Assign Mechanic...
                        </option>
                        {MOCK_MECHANICS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.emp_id} - {m.name} ({m.specialty})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

              {/* Mid-Job Addon Trigger (LABOR) */}
              {activeOrder.status === "IN_PROGRESS" && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => setShowAddLaborModal(!showAddLaborModal)}
                    className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add another service mid-repair
                  </button>
                  {showAddLaborModal && (
                    <div className="mt-4 p-4 border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl animate-in slide-in-from-top-2">
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3">
                        Select Additional Service
                      </p>
                      <div className="flex gap-2">
                        <select
                          id="addonServiceSelect"
                          className="flex-1 outline-none text-xs px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          {MOCK_SERVICES.map((srv) => (
                            <option key={srv.id} value={srv.id}>
                              {srv.name} - ₱{srv.price}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const selectedId =
                              document.getElementById(
                                "addonServiceSelect",
                              ).value;
                            const service = MOCK_SERVICES.find(
                              (s) => s.id === selectedId,
                            );
                            addMidJobLabor(service);
                          }}
                          className="px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500"
                        >
                          Add Service
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* INVENTORY HARD-RESERVATION (PARTS) */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2">
                <HardDrive size={18} className="text-indigo-500" /> Parts &
                Materials
              </h3>
              {activeOrder.status !== "PENDING" && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle size={10} /> Stock Locked
                </span>
              )}
            </div>

            <div className="space-y-3">
              {activeOrder.items
                .filter((i) => i.type === "PART")
                .map((part) => (
                  <div
                    key={part.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                        {part.qty}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                          {part.name}
                          {part.isAddon && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] rounded uppercase border border-amber-500/20">
                              Mid-Job Addon
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500">
                          {part.code}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-mono font-black text-slate-900 dark:text-white">
                      ₱{(part.price * part.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>

            {/* Mid-Job Addon Trigger (PARTS) */}
            {activeOrder.status === "IN_PROGRESS" && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() => setShowAddPartModal(!showAddPartModal)}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  <Plus size={14} /> Add another part mid-repair
                </button>
                {showAddPartModal && (
                  <div className="mt-4 p-4 border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl animate-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3">
                      Select Inventory Item to Lock
                    </p>
                    <div className="flex gap-2">
                      <select
                        id="addonPartSelect"
                        className="flex-1 outline-none text-xs px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {MOCK_INVENTORY.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} (Stock: {inv.stockQty}) - ₱{inv.price}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const selectedId =
                            document.getElementById("addonPartSelect").value;
                          const part = MOCK_INVENTORY.find(
                            (p) => p.id === selectedId,
                          );
                          addMidJobPart(part);
                        }}
                        className="px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500"
                      >
                        Lock Part
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Totals & Finalization */}
        <div className="lg:col-span-1 space-y-6">
          {/* Running Total */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-xl">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 border-b border-slate-800 pb-3">
              Financial Impact
            </h3>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between text-slate-400 text-xs font-bold">
                <span>BASE AMOUNT</span>
                <span>
                  ₱
                  {activeOrder.totals.base.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-indigo-400 text-xs font-black italic">
                <span>OUTPUT VAT (12%)</span>
                <span>
                  ₱
                  {activeOrder.totals.vat.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-end pt-4 mt-2 border-t border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase font-sans">
                  New Grand Total
                </span>
                <span className="text-2xl font-black text-white italic">
                  ₱
                  {activeOrder.totals.grand.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            {activeOrder.items.some((i) => i.isAddon) && (
              <p className="text-[9px] text-amber-500 mt-4 text-center border border-amber-500/20 bg-amber-500/10 p-2 rounded-lg">
                Total increased due to mid-job addons.
              </p>
            )}
          </div>

          {/* SIMPLIFIED COMPLETION BLOCK */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <CheckCircle className="text-emerald-500" size={18} />
              Finalize Job Order
            </h3>
            <p className="text-[10px] text-slate-500 mb-6 font-bold leading-relaxed">
              Ensure all labor tasks have an assigned mechanic before completing
              this job order.
            </p>
            <button
              onClick={handleCompleteJob}
              disabled={activeOrder.status === "COMPLETED"}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:shadow-none flex justify-center items-center gap-2"
            >
              Complete & Push to Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrders;

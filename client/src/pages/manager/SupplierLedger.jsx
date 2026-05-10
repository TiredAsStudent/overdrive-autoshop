import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Loader2,
  Edit,
  History,
  Archive,
  MapPin,
  Phone,
  Mail,
  Receipt,
  AlertTriangle,
  FileText,
  FileImage,
  X,
  ShieldCheck,
} from "lucide-react";
import { managerSupplierService } from "../../services/manager/supplier.service";
import SupplierModal from "../../features/manager/components/SupplierModal";

// Reusing your established helper for evidence tracking
const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("blob:") || path.startsWith("http")) return path;
  const baseUrl =
    import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
    "http://localhost:5000";
  return `${baseUrl}${path}`;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount || 0,
  );

const SupplierLedger = () => {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await managerSupplierService.getLedger(showArchived);
      setLedger(res.data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  // Actions
  const handleOpenModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    if (selectedSupplier) {
      await managerSupplierService.updateSupplier(selectedSupplier.id, data);
    } else {
      await managerSupplierService.createSupplier(data);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const openTimeline = async (supplier) => {
    setSelectedSupplier(supplier);
    setIsDrawerOpen(true);
    setTimelineLoading(true);
    try {
      const res = await managerSupplierService.getTimeline(supplier.id);
      setTimelineData(res.data.timeline || []);
    } catch (error) {
      alert(error.message);
      setIsDrawerOpen(false);
    } finally {
      setTimelineLoading(false);
    }
  };

  const filteredLedger = ledger.filter(
    (s) =>
      s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.tin && s.tin.includes(searchTerm)),
  );

  // Aggregator Math
  const totalLifetimePurchases = ledger.reduce(
    (sum, s) => sum + parseFloat(s.lifetime_purchases || 0),
    0,
  );
  const totalPendingQueue = ledger.reduce(
    (sum, s) => sum + parseFloat(s.pending_purchases || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <Building2
              className="text-indigo-600 dark:text-indigo-400"
              size={28}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              Supplier Ledger
              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] px-2.5 py-1 rounded-full normal-case tracking-widest uppercase border border-indigo-200 dark:border-indigo-500/30">
                {ledger.length} Vendors
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Directory & Historical Financial Aggregation
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Enroll Supplier
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5">
            <Receipt size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Total Shop Expenditures
          </p>
          <h3 className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalLifetimePurchases)}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Lifetime Approved OCR Scans
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5">
            <AlertTriangle size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Pending In Queue
          </p>
          <h3 className="text-3xl font-mono font-black text-amber-500">
            {formatCurrency(totalPendingQueue)}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Currently awaiting Manager Approval
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden hidden lg:block">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5">
            <ShieldCheck size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            VAT Compliance
          </p>
          <h3 className="text-3xl font-mono font-black text-emerald-500">
            {ledger.length > 0
              ? Math.round(
                  (ledger.filter((l) => l.is_vat_registered).length /
                    ledger.length) *
                    100,
                )
              : 0}
            %
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Suppliers eligible for Input Tax Claims
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Name or TIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="w-4 h-4 accent-slate-600 rounded"
          />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Show Archived Records
          </span>
        </label>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/10">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Vendor / Enterprise
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Contact Details
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Lifetime Volume
                  </th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-8 text-center text-slate-500 text-sm font-medium"
                    >
                      No suppliers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {!s.is_active && (
                            <Archive size={16} className="text-slate-400" />
                          )}
                          <div>
                            <p
                              className={`font-black uppercase tracking-tight ${!s.is_active ? "text-slate-400" : "text-slate-900 dark:text-white"}`}
                            >
                              {s.supplier_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">
                                TIN: {s.tin || "UNREGISTERED"}
                              </span>
                              {s.is_vat_registered && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                  VAT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {s.contact_person && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                              {s.contact_person}
                            </p>
                          )}
                          {s.contact_info && (
                            <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <Phone size={10} /> {s.contact_info}
                            </p>
                          )}
                          {s.email && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Mail size={10} /> {s.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-lg">
                          {formatCurrency(s.lifetime_purchases)}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                          {s.total_transaction_count} Scans
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openTimeline(s)}
                            className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors group-hover:scale-110"
                            title="View Transaction Timeline"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(s)}
                            className="p-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors group-hover:scale-110"
                            title="Edit Directory Info"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedSupplier}
      />

      {/* --- TIMELINE DRAWER --- */}
      <AnimatePresence>
        {isDrawerOpen && selectedSupplier && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] bg-white dark:bg-slate-800 z-[70] shadow-2xl border-l border-slate-200 dark:border-white/10 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-1">
                    {selectedSupplier.supplier_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <History size={12} /> Transaction Timeline
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 bg-white dark:bg-slate-700 text-slate-500 rounded-xl shadow-sm border border-slate-200 dark:border-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body (Timeline Feed) */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar">
                {timelineLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2
                      className="animate-spin text-indigo-500 mb-4"
                      size={32}
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Retrieving Ledger...
                    </p>
                  </div>
                ) : timelineData.length === 0 ? (
                  <div className="text-center py-20">
                    <FileText
                      size={48}
                      className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                    />
                    <p className="text-sm font-bold text-slate-500">
                      No transactions recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-indigo-100 dark:border-indigo-500/20 ml-4 space-y-8 pb-10">
                    {timelineData.map((txn, index) => (
                      <div key={txn.transaction_id} className="relative pl-6">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[9px] top-0 bg-white dark:bg-slate-800 border-2 border-indigo-500 w-4 h-4 rounded-full"></div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                          {/* The Evidence Link */}
                          {txn.receipt_image_url && (
                            <a
                              href={getImageUrl(txn.receipt_image_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                              title="View Original OCR Evidence"
                            >
                              <FileImage size={16} />
                            </a>
                          )}

                          <div className="mb-2">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${txn.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : txn.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {txn.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-1 flex items-center gap-2">
                            OCR Purchase
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">
                            {new Date(txn.transaction_date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>

                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">
                              Amount Charged
                            </span>
                            <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                              {formatCurrency(txn.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplierLedger;

import React, { useState, useEffect } from "react";
import { Search, Loader2, CreditCard, Plus, FileSearch } from "lucide-react";
import { paymentService } from "../../services/staff/payment.service";
import PaymentModal from "../../features/staff/components/PaymentModal";
import PaymentDrawer from "../../features/staff/components/PaymentDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const METHOD_FILTERS = [
  { id: "all", label: "All Channels" },
  { id: "CASH", label: "Cash" },
  { id: "GCASH", label: "GCash" },
  { id: "MAYA", label: "Maya" },
  { id: "BANK_TRANSFER", label: "Bank" },
];

const Payments = () => {
  const { showToast } = useApp();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [methodFilter, setMethodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, methodFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPayments(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        methodFilter,
        "all",
      );
      setPayments(response.data?.payments || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [currentPage, debouncedSearchQuery, methodFilter]);

  const handleModalSubmit = async (formData) => {
    try {
      const res = await paymentService.recordPayment(formData);
      const isFullyPaid = res.data?.updatedInvoice?.status === "PAID";
      showToast(
        isFullyPaid
          ? "Payment recorded. Invoice fully settled."
          : "Partial payment recorded.",
        "success",
      );
      setIsModalOpen(false);
      loadPayments();
    } catch (error) {
      throw error;
    }
  };

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return (
          <span className="text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border">
            CASH
          </span>
        );
      case "GCASH":
        return (
          <span className="text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border">
            GCASH
          </span>
        );
      case "MAYA":
        return (
          <span className="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border">
            MAYA
          </span>
        );
      case "BANK_TRANSFER":
        return (
          <span className="text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border">
            BANK
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <CreditCard className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Payments
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Cash Collections Directory
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Method Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {METHOD_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setMethodFilter(f.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${methodFilter === f.id ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search Receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20 shrink-0 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Collect Cash
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Receipt No.",
          "Applied Invoice",
          "Customer",
          "Amount Paid",
          "Channel",
          "Actions",
        ]}
        data={payments}
        loading={loading}
        emptyTitle="No Collections Found"
        renderRow={(pay) => (
          <tr
            key={pay.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col">
                <span className="inline-flex w-fit px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                  {pay.payment_number}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                  {new Date(pay.created_at).toLocaleDateString()}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                {pay.invoice_number}
              </p>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                Current Status: {pay.current_invoice_status.replace("_", " ")}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                {pay.customer_name}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-500">
                + ₱
                {parseFloat(pay.amount_received).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1">
                {renderMethodBadge(pay.payment_method)}
                {pay.reference_number && (
                  <span className="text-[8px] text-slate-400 font-mono tracking-wider truncate max-w-[120px]">
                    {pay.reference_number}
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => {
                  setSelectedPaymentId(pay.id);
                  setIsDrawerOpen(true);
                }}
                title="View Receipt"
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <FileSearch size={16} />
              </button>
            </td>
          </tr>
        )}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals & Drawers */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      <PaymentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        paymentId={selectedPaymentId}
      />
    </div>
  );
};

export default Payments;

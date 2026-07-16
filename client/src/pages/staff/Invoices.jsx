import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Receipt,
  Plus,
  FileSearch,
  CreditCard,
} from "lucide-react";
import { invoiceService } from "../../services/staff/invoice.service";
import InvoiceModal from "../../features/staff/components/InvoiceModal";
import InvoiceDrawer from "../../features/staff/components/InvoiceDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_FILTERS = [
  { id: "all", label: "All Invoices" },
  { id: "UNPAID", label: "Unpaid" },
  { id: "PARTIALLY_PAID", label: "Partial" },
  { id: "PAID", label: "Paid" },
  { id: "OVERDUE", label: "Overdue" },
];

const Invoices = () => {
  const { showToast } = useApp();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
      );
      console.log(response.data?.invoices || []);
      setInvoices(response.data?.invoices || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  const handleModalSubmit = async (formData) => {
    try {
      await invoiceService.createInvoice(formData);
      showToast(
        "Invoice generated. Inventory deducted successfully.",
        "success",
      );
      setIsModalOpen(false);
      loadInvoices();
    } catch (error) {
      throw error;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "UNPAID":
        return "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
      case "PARTIALLY_PAID":
        return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      case "PAID":
        return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "OVERDUE":
        return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Receipt className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Invoices
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Official Billing & Receivables
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${statusFilter === f.id ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
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
              placeholder="Search Invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20 shrink-0 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Bill Order
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Invoice",
          "Client Link",
          "Due Date",
          "Balance Due",
          "Status",
          "Actions",
        ]}
        data={invoices}
        loading={loading}
        emptyTitle="No Billing Records Found"
        renderRow={(inv) => {
          const balance =
            parseFloat(inv.grand_total) - parseFloat(inv.amount_paid);
          return (
            <tr
              key={inv.id}
              className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                  {inv.invoice_number}
                </span>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                  {inv.customer_name}
                </p>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <p
                  className={`text-xs font-bold ${new Date(inv.due_date) < new Date() && inv.status !== "PAID" ? "text-rose-500" : "text-slate-600 dark:text-slate-400"}`}
                >
                  {new Date(inv.due_date).toLocaleDateString()}
                </p>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  ₱
                  {balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                  Paid: ₱
                  {parseFloat(inv.amount_paid).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(inv.status)}`}
                >
                  {inv.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setIsDrawerOpen(true);
                    }}
                    title="View Invoice"
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileSearch size={16} />
                  </button>
                  {inv.status !== "PAID" && (
                    <button
                      title="Record Payment"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <CreditCard size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals & Drawers */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      <InvoiceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
};

export default Invoices;

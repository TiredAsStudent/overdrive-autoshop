import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Receipt,
  Plus,
  FileText,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import { billService } from "../../services/staff/bill.service";
import BillModal from "../../features/staff/components/BillModal";
import BillDrawer from "../../features/staff/components/BillDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const Bills = () => {
  const { showToast } = useApp();

  const [bills, setBills] = useState([]);
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "info",
    onConfirm: () => {},
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const response = await billService.getBills(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
        "all",
      );
      setBills(response.data?.bills || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  const handleModalSubmit = async (formData) => {
    try {
      const res = await billService.createBill(formData);
      const msg =
        res.data.status === "RECEIVED"
          ? "Bill posted and inventory incremented."
          : "Draft bill created securely.";
      showToast(msg, "success");
      setIsModalOpen(false);
      loadBills();
    } catch (error) {
      throw error; // Handled by Modal
    }
  };

  const handleConfirmReceipt = (bill) => {
    setConfirmConfig({
      isOpen: true,
      title: `Confirm Delivery Receipt`,
      message: `Are you certain the goods for Invoice ${bill.vendor_invoice_number} have physically arrived? This will irrevocably increment branch inventory and post the liability.`,
      confirmText: `Yes, Items Received`,
      variant: "warning",
      onConfirm: async () => {
        try {
          await billService.confirmReceipt(bill.id);
          showToast(
            `Goods received. Inventory and Ledger updated successfully.`,
            "success",
          );
          loadBills();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  };

  const openDrawer = (id) => {
    setSelectedBillId(id);
    setIsDrawerOpen(true);
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
              Supplier Bills
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Accounts Payable Registry
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "pending_receipt", label: "Pending" },
              { id: "received", label: "Received" },
              { id: "closed", label: "Closed" },
            ].map((f) => (
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
              placeholder="Search Bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* OCR Trigger Hook (Placeholder for Capstone Feature) */}
          <button
            onClick={() =>
              showToast(
                "OCR Processing Pipeline will be active in the next release.",
                "info",
              )
            }
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <ScanLine size={16} /> Auto-Scan
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <Plus size={16} /> Record Bill
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Reference",
          "Supplier & PO",
          "Date Logs",
          "Grand Total",
          "Status (Rcv / Pay)",
          "Actions",
        ]}
        data={bills}
        loading={loading}
        emptyTitle={`No ${statusFilter !== "all" ? statusFilter.toLowerCase() : ""} bills found`}
        renderRow={(bill) => (
          <tr
            key={bill.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">
                  {bill.bill_number}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  INV: {bill.vendor_invoice_number}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {bill.vendor_name}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {bill.purchase_order_number}
                </p>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                <span className="flex gap-1.5">
                  <span className="text-slate-400 w-10">Billed:</span>{" "}
                  {new Date(bill.bill_date).toLocaleDateString()}
                </span>
                <span className="flex gap-1.5">
                  <span className="text-slate-400 w-10">Rcvd:</span>{" "}
                  {bill.date_received
                    ? new Date(bill.date_received).toLocaleDateString()
                    : "--"}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-500">
                ₱
                {parseFloat(bill.grand_total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${
                    bill.status === "RECEIVED"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : bill.status === "CLOSED"
                        ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border-sky-200 dark:border-sky-500/20"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border-amber-200 dark:border-amber-500/20"
                  }`}
                >
                  {bill.status.replace("_", " ")}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${
                    bill.payment_status === "PAID"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : bill.payment_status === "PARTIALLY_PAID"
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                  }`}
                >
                  {bill.payment_status?.replace("_", " ") || "UNPAID"}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => openDrawer(bill.id)}
                  title="View Ledger"
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <FileText size={16} />
                </button>
                {bill.status === "PENDING_RECEIPT" && (
                  <button
                    onClick={() => handleConfirmReceipt(bill)}
                    title="Confirm Goods Received"
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <BillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      <BillDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        billId={selectedBillId}
      />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default Bills;

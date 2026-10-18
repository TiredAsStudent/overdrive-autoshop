import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Receipt,
  Plus,
  FileSearch,
  CheckCircle2,
  Clock,
  CheckCircle,
  Ban,
  AlertCircle,
  Archive,
  Building2,
  Paperclip,
  ChevronDown,
} from "lucide-react";
import { billService } from "../../services/staff/bill.service";
import { vendorService } from "../../services/staff/vendor.service";
import BillModal from "../../features/staff/components/BillModal";
import BillDrawer from "../../features/staff/components/BillDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusBadge from "../../components/ui/StatusBadge";
import ActionButton from "../../components/ui/ActionButton";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ITEMS_PER_PAGE = 10;

const Bills = () => {
  const { showToast } = useApp();
  const statusFilterSelectId = useId();
  const vendorFilterSelectId = useId();

  const [bills, setBills] = useState([]);
  const [vendorList, setVendorList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
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

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (vendorFilter !== "all" ? 1 : 0);

  useEffect(() => {
    vendorService
      .getActiveLookup()
      .then((res) => setVendorList(res.data || []))
      .catch((err) => console.error("Failed to load vendors", err));
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleVendorFilterChange = (value) => {
    setVendorFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      const response = await billService.getBills(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        vendorFilter,
        "all",
      );

      const fetchedBills = response.data?.bills || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedBills.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setBills(fetchedBills);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(error.message || "Unable to load supplier bills.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    statusFilter,
    vendorFilter,
    showToast,
  ]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const resetFilters = () => {
    setStatusFilter("all");
    setVendorFilter("all");
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    setIsFilterModalOpen(false);
  };

  const handleModalSubmit = async (formData, attachmentFile) => {
    const res = await billService.createBill(formData, attachmentFile);
    const msg =
      res.data.status === "RECEIVED"
        ? "Bill posted and inventory incremented."
        : "Draft bill created securely.";
    showToast(msg, "success");
    setIsModalOpen(false);
    loadBills();
  };

  const handleConfirmReceipt = (bill) => {
    setConfirmConfig({
      isOpen: true,
      title: "Confirm Delivery Receipt",
      message: `Are you sure the goods for Vendor Invoice ${bill.vendor_invoice_number} have arrived? This will add them to branch inventory and record the amount owed.`,
      confirmText: "Yes, Items Received",
      variant: "warning",
      onConfirm: async () => {
        try {
          await billService.confirmReceipt(bill.id);
          showToast(
            "Goods received. Inventory and Ledger updated successfully.",
            "success",
          );
          loadBills();
        } catch (error) {
          showToast(
            error.message || "Failed to confirm goods receipt.",
            "error",
          );
        }
      },
    });
  };

  const openDrawer = (id) => {
    setSelectedBillId(id);
    setIsDrawerOpen(true);
  };

  // Status Badge Mappings with Icons
  const getReceiveVariant = (status) => {
    if (status === "RECEIVED") return "success";
    if (status === "CLOSED") return "info";
    return "warning";
  };

  const getReceiveIcon = (status) => {
    if (status === "RECEIVED") return CheckCircle;
    if (status === "CLOSED") return Archive;
    return Clock;
  };

  const getPaymentVariant = (status) => {
    if (status === "PAID") return "success";
    if (status === "PARTIALLY_PAID") return "info";
    if (status === "VOID") return "danger";
    return "danger";
  };

  const getPaymentIcon = (status) => {
    if (status === "PAID") return CheckCircle;
    if (status === "PARTIALLY_PAID") return Clock;
    if (status === "VOID") return Ban;
    return AlertCircle;
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "--";
    const datePart = String(dateString).split("T")[0];
    const [year, month, day] = datePart.split("-");
    if (year && month && day) {
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const emptyStatusLabel =
    statusFilter !== "all"
      ? `${statusFilter.replace(/_/g, " ").toLowerCase()} `
      : "";

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Bills"
        subtitle="Accounts Payable Registry"
        icon={Receipt}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Bills..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          onClick={() => setIsModalOpen(true)}
          label="Record Bill"
          icon={Plus}
        />
      </PageHeader>

      <DataTable
        caption="Accounts Payable and Supplier Bills Registry"
        minWidth="min-w-[880px]"
        headers={[
          "Reference",
          "Vendor & PO",
          "Date Logs",
          "Grand Total",
          "Status (Rcv / Pay)",
          "Actions",
        ]}
        data={bills}
        loading={loading}
        emptyTitle={`No ${emptyStatusLabel}bills found`}
        emptySubtitle="Try adjusting your search or filter criteria, or record a new supplier bill."
        renderRow={(bill) => (
          <tr
            key={bill.id}
            className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
          >
            {/* Reference */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-mono tabular-nums font-black tracking-widest uppercase bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {bill.bill_number}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <span>INV:</span>
                    <span
                      className="font-mono tabular-nums text-slate-700 dark:text-slate-200 truncate max-w-[130px]"
                      title={bill.vendor_invoice_number}
                    >
                      {bill.vendor_invoice_number}
                    </span>
                  </span>

                  {bill.attachment_url && (
                    <span
                      title="Attachment Present"
                      aria-label="Attachment Present"
                      className="inline-flex text-amber-500 dark:text-overdrive-yellow shrink-0"
                    >
                      <Paperclip size={12} aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            </td>

            {/* Vendor & PO */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate"
                  title={bill.vendor_name}
                >
                  {bill.vendor_name}
                </p>
                <div className="flex flex-col gap-0.5 mt-1">
                  <span
                    className="text-[10px] font-mono tabular-nums font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-widest truncate"
                    title={bill.purchase_order_number}
                  >
                    {bill.purchase_order_number}
                  </span>
                  <span
                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate uppercase tracking-wider"
                    title={bill.branch_name}
                  >
                    <Building2
                      size={10}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                    <span className="truncate">{bill.branch_name}</span>
                  </span>
                </div>
              </div>
            </td>

            {/* Date Logs */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Billed:{" "}
                  <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200 ml-1">
                    {formatCalendarDate(bill.bill_date)}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-widest">
                  Due:{" "}
                  <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400 ml-1">
                    {formatCalendarDate(bill.due_date)}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Rcvd:{" "}
                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 ml-1">
                    {formatCalendarDate(bill.date_received)}
                  </span>
                </span>
              </div>
            </td>

            {/* Grand Total */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                ₱{formatCurrency(bill.grand_total)}
              </span>
            </td>

            {/* Status (Rcv / Pay) */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col items-start gap-1.5">
                <StatusBadge
                  label={
                    bill.status
                      ? bill.status.replace(/_/g, " ")
                      : "PENDING RECEIPT"
                  }
                  variant={getReceiveVariant(bill.status)}
                  icon={getReceiveIcon(bill.status)}
                />
                <StatusBadge
                  label={
                    bill.payment_status
                      ? bill.payment_status.replace(/_/g, " ")
                      : "UNPAID"
                  }
                  variant={getPaymentVariant(bill.payment_status)}
                  icon={getPaymentIcon(bill.payment_status)}
                />
              </div>
            </td>

            {/* Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer(bill.id)}
                  title={`View ${bill.bill_number} Ledger`}
                  aria-label={`View ledger details for ${bill.bill_number}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <FileSearch size={16} aria-hidden="true" />
                </button>
                {bill.status === "PENDING_RECEIPT" && (
                  <button
                    type="button"
                    onClick={() => handleConfirmReceipt(bill)}
                    title={`Confirm Goods Received for ${bill.bill_number}`}
                    aria-label={`Confirm goods received for ${bill.bill_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200/60 dark:hover:border-emerald-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 size={16} aria-hidden="true" />
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={statusFilterSelectId} className="form-label">
              Receiving Status
            </label>
            <div className="relative">
              <select
                id={statusFilterSelectId}
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending_receipt">Pending Receipt</option>
                <option value="received">Received</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor={vendorFilterSelectId} className="form-label">
              Select Target Vendor
            </label>
            <div className="relative">
              <select
                id={vendorFilterSelectId}
                value={vendorFilter}
                onChange={(e) => handleVendorFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Vendors</option>
                {vendorList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.business_name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </FilterModal>

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
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
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

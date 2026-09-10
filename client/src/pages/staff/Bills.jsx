import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  CheckCircle,
  Ban,
  AlertCircle,
  Archive,
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
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";
import ActionButton from "../../components/ui/ActionButton";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const Bills = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempVendorFilter, setTempVendorFilter] = useState("all");
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

  const activeFilterCount = vendorFilter !== "all" ? 1 : 0;

  // Initial Data Load (Vendors for Filter)
  useEffect(() => {
    vendorService
      .getVendors(1, 500, "", "active", "all", "all")
      .then((res) => setVendorList(res.data?.vendors || []))
      .catch((err) => console.error("Failed to load vendors", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, vendorFilter]);

  const loadBills = async () => {
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
  }, [currentPage, debouncedSearchQuery, statusFilter, vendorFilter]);

  const applyFilters = () => {
    setVendorFilter(tempVendorFilter);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setTempVendorFilter("all");
    setVendorFilter("all");
    setIsFilterModalOpen(false);
  };

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
      message: `Are you sure the goods for Invoice ${bill.vendor_invoice_number} have arrived? This will add them to branch inventory and record the amount owed.`,
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
    return "danger"; // UNPAID / OVERDUE
  };

  const getPaymentIcon = (status) => {
    if (status === "PAID") return CheckCircle;
    if (status === "PARTIALLY_PAID") return Clock;
    if (status === "VOID") return Ban;
    return AlertCircle; // UNPAID / OVERDUE
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Bills"
        subtitle="Accounts Payable Registry"
        icon={Receipt}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={[
            { label: "All", value: "all" },
            { label: "Pending", value: "pending_receipt" },
            { label: "Received", value: "received" },
            { label: "Closed", value: "closed" },
          ]}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Bills..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <ActionButton
          onClick={() => setIsModalOpen(true)}
          label="Record Bill"
          icon={Plus}
        />
      </PageHeader>

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
        emptyTitle={`No ${statusFilter !== "all" ? statusFilter.replace("_", " ").toLowerCase() : ""} bills found`}
        renderRow={(bill) => (
          <tr
            key={bill.id}
            className={`group transition-colors ${bill.status === "CLOSED" ? "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"}`}
          >
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col">
                <span className="inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-black tracking-widest uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {bill.bill_number}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                  INV:{" "}
                  <span className="text-slate-700 dark:text-slate-300">
                    {bill.vendor_invoice_number}
                  </span>
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                  {bill.vendor_name}
                </p>
                <div className="flex items-center gap-2 mt-1 truncate">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest truncate">
                    {bill.purchase_order_number}
                  </span>
                </div>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Billed:{" "}
                  <span className="text-slate-700 dark:text-slate-300 ml-1">
                    {new Date(bill.bill_date).toLocaleDateString()}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Rcvd:{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    {bill.date_received
                      ? new Date(bill.date_received).toLocaleDateString()
                      : "--"}
                  </span>
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ₱
                {parseFloat(bill.grand_total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1.5">
                <StatusBadge
                  label={bill.status.replace("_", " ")}
                  variant={getReceiveVariant(bill.status)}
                  icon={getReceiveIcon(bill.status)}
                />
                <StatusBadge
                  label={bill.payment_status?.replace("_", " ") || "UNPAID"}
                  variant={getPaymentVariant(bill.payment_status)}
                  icon={getPaymentIcon(bill.payment_status)}
                />
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  onClick={() => openDrawer(bill.id)}
                  title="View Ledger"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <FileText size={16} />
                </button>
                {bill.status === "PENDING_RECEIPT" && (
                  <button
                    onClick={() => handleConfirmReceipt(bill)}
                    title="Confirm Goods Received"
                    className="p-1.5 sm:p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={clearFilters}
        onApply={applyFilters}
        title="Filter by Vendor"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Select Target Supplier
            </label>
            <select
              value={tempVendorFilter}
              onChange={(e) => setTempVendorFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Vendors</option>
              {vendorList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name}
                </option>
              ))}
            </select>
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

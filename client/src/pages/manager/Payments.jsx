import React, { useState, useEffect, useCallback, useId } from "react";
import {
  CreditCard,
  FileSearch,
  Plus,
  Banknote,
  Wallet,
  Landmark,
  Paperclip,
  Building2,
  Ban,
  ChevronDown,
} from "lucide-react";
import { vendorPaymentService } from "../../services/manager/vendorPayment.service";
import { managerVendorService } from "../../services/manager/vendor.service";
import { inventoryService } from "../../services/manager/inventory.service";

// Reusable / Universal Components
import VendorPaymentModal from "../../features/manager/components/VendorPaymentModal";
import VendorPaymentDrawer from "../../features/manager/components/VendorPaymentDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import ActionButton from "../../components/ui/ActionButton";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmModal from "../../components/shared/ConfirmModal";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const METHOD_FILTERS = [
  { id: "all", label: "All Channels" },
  { id: "CASH", label: "Cash" },
  { id: "CHECK", label: "Check" },
  { id: "GCASH", label: "GCash" },
  { id: "MAYA", label: "Maya" },
  { id: "BANK_TRANSFER", label: "Bank" },
];

const ITEMS_PER_PAGE = 10;

const Payments = () => {
  const { showToast } = useApp();

  // Accessible Filter Control IDs
  const branchFilterSelectId = useId();
  const vendorFilterSelectId = useId();
  const methodFilterSelectId = useId();

  const [payments, setPayments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [methodFilter, setMethodFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [paymentToVoid, setPaymentToVoid] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (vendorFilter !== "all" ? 1 : 0) +
    (methodFilter !== "all" ? 1 : 0);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => {});
    managerVendorService
      .getVendors(1, 1000, "", "active", "all", "all")
      .then((res) => setVendors(res.data?.vendors || []))
      .catch(() => {});
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleBranchFilterChange = (value) => {
    setBranchFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleVendorFilterChange = (value) => {
    setVendorFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleMethodFilterChange = (value) => {
    setMethodFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setVendorFilter("all");
    setMethodFilter("all");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorPaymentService.getPayments(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        methodFilter,
        branchFilter,
        vendorFilter,
      );

      const fetchedPayments = response.data?.payments || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedPayments.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setPayments(fetchedPayments);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load vendor payment records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    methodFilter,
    branchFilter,
    vendorFilter,
    showToast,
  ]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleModalSubmit = async (formData, proofFile) => {
    const res = await vendorPaymentService.recordPayment(formData, proofFile);
    const isFullyPaid = res.data?.updatedBill?.payment_status === "PAID";
    showToast(
      isFullyPaid
        ? "Vendor payment successful. Bill fully settled."
        : "Partial vendor payment recorded.",
      "success",
    );
    setIsModalOpen(false);
    loadPayments();
  };

  const handleConfirmVoid = async () => {
    if (!paymentToVoid) return;
    try {
      await vendorPaymentService.voidPayment(paymentToVoid.id);
      showToast(
        "Payment successfully voided. Bill balance restored.",
        "success",
      );
      loadPayments();
    } catch (error) {
      showToast(error.message || "Failed to void vendor payment.", "error");
      throw error;
    }
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = String(dateString).split("T")[0].split("-");
    if (!year || !month || !day) return String(dateString);
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return <StatusBadge label="CASH" variant="default" icon={Banknote} />;
      case "CHECK":
      case "BANK_TRANSFER":
        return (
          <StatusBadge
            label={method.replace(/_/g, " ")}
            variant="info"
            icon={Landmark}
          />
        );
      case "GCASH":
        return <StatusBadge label="GCASH" variant="info" icon={Wallet} />;
      case "MAYA":
        return <StatusBadge label="MAYA" variant="success" icon={Wallet} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Payments"
        subtitle="Accounts Payable Liquidation Hub"
        icon={CreditCard}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Payment No. or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />
        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />
        <ActionButton
          label="Record Payment"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        />
      </PageHeader>

      <DataTable
        caption="Accounts Payable Vendor Disbursements and Payment Ledger"
        minWidth="min-w-[850px]"
        headers={[
          "Payment No.",
          "Vendor & Bill",
          "Amount Paid",
          "Channel",
          "Payment Date",
          "Actions",
        ]}
        data={payments}
        loading={loading}
        emptyTitle="No Payments Found"
        emptySubtitle="Try adjusting filters or record a new payment."
        renderRow={(pay) => {
          const isVoid = pay.status === "VOID";

          return (
            <tr
              key={pay.id}
              className={`group border-b border-slate-100 dark:border-white/5 last:border-0 ${
                isVoid
                  ? "opacity-65 bg-slate-50/60 dark:bg-slate-900/40"
                  : "table-row-hover"
              }`}
            >
              {/* Payment No. */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-mono tabular-nums font-black tracking-widest uppercase border ${
                      isVoid
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/80 dark:border-rose-500/20 line-through"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border-slate-200/80 dark:border-white/10"
                    }`}
                  >
                    {pay.payment_number}
                  </span>
                  {isVoid && <StatusBadge label="VOID" variant="danger" />}
                </div>
              </td>

              {/* Vendor & Bill */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="min-w-0 max-w-[200px] sm:max-w-[260px]">
                  <p
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate"
                    title={pay.vendor_name}
                  >
                    {pay.vendor_name}
                  </p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-[10px] font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest truncate">
                      {pay.bill_number}
                    </span>
                    {pay.current_bill_status && (
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        Status: {pay.current_bill_status.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* Amount Paid */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span
                  className={`text-xs sm:text-sm font-mono tabular-nums font-black ${
                    isVoid
                      ? "text-slate-400 dark:text-slate-500 line-through"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  -₱{formatCurrency(pay.amount_paid)}
                </span>
              </td>

              {/* Channel */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-1">
                  {renderMethodBadge(pay.payment_method)}
                  {(pay.reference_number || pay.proof_of_payment_url) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {pay.reference_number && (
                        <span
                          className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums tracking-wider truncate max-w-[130px]"
                          title={pay.reference_number}
                        >
                          {pay.reference_number}
                        </span>
                      )}
                      {pay.proof_of_payment_url && (
                        <Paperclip
                          size={12}
                          aria-label="Documentary proof attached"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                          title="Proof Attached"
                        />
                      )}
                    </div>
                  )}
                </div>
              </td>

              {/* Payment Date */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  {formatCalendarDate(pay.payment_date || pay.created_at)}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentId(pay.id);
                      setIsDrawerOpen(true);
                    }}
                    title={`View Payment ${pay.payment_number}`}
                    aria-label={`View payment voucher details for ${pay.payment_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSearch size={16} aria-hidden="true" />
                  </button>
                  {!isVoid && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentToVoid(pay);
                        setIsVoidModalOpen(true);
                      }}
                      title={`Void Payment ${pay.payment_number}`}
                      aria-label={`Void payment ${pay.payment_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <Ban size={16} aria-hidden="true" />
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={branchFilterSelectId} className="form-label">
              Filter by Branch
            </label>
            <div className="relative">
              <select
                id={branchFilterSelectId}
                value={branchFilter}
                onChange={(e) => handleBranchFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
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

          <div>
            <label htmlFor={vendorFilterSelectId} className="form-label">
              Filter by Vendor
            </label>
            <div className="relative">
              <select
                id={vendorFilterSelectId}
                value={vendorFilter}
                onChange={(e) => handleVendorFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Vendors</option>
                {vendors.map((v) => (
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

          <div>
            <label htmlFor={methodFilterSelectId} className="form-label">
              Filter by Payment Method
            </label>
            <div className="relative">
              <select
                id={methodFilterSelectId}
                value={methodFilter}
                onChange={(e) => handleMethodFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                {METHOD_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
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

      <ConfirmModal
        isOpen={isVoidModalOpen && paymentToVoid !== null}
        onClose={() => {
          setIsVoidModalOpen(false);
          setPaymentToVoid(null);
        }}
        onConfirm={handleConfirmVoid}
        title="Void Payment?"
        message={
          paymentToVoid ? (
            <>
              Are you sure you want to void payment{" "}
              <span className="font-bold font-mono tabular-nums text-slate-700 dark:text-slate-200">
                {paymentToVoid.payment_number}
              </span>
              ? This action cannot be undone. The{" "}
              <span className="font-bold font-mono tabular-nums text-slate-700 dark:text-slate-200">
                ₱{formatCurrency(paymentToVoid.amount_paid)}
              </span>{" "}
              payment will be reversed, and the bill balance will be restored.
            </>
          ) : (
            ""
          )
        }
        confirmText="Confirm Void"
        cancelText="Cancel"
        variant="danger"
      />

      <VendorPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      <VendorPaymentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        paymentId={selectedPaymentId}
      />
    </div>
  );
};

export default Payments;

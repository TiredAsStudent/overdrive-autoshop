import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { vendorPaymentService } from "../../services/manager/vendorPayment.service";
import { managerVendorService } from "../../services/manager/vendor.service";
import { inventoryService } from "../../services/manager/inventory.service";

import VendorPaymentModal from "../../features/manager/components/VendorPaymentModal";
import VendorPaymentDrawer from "../../features/manager/components/VendorPaymentDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import ActionButton from "../../components/ui/ActionButton";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";
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

const Payments = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [paymentToVoid, setPaymentToVoid] = useState(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) + (vendorFilter !== "all" ? 1 : 0);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, methodFilter, branchFilter, vendorFilter]);

  const loadPayments = async () => {
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
  }, [
    currentPage,
    debouncedSearchQuery,
    methodFilter,
    branchFilter,
    vendorFilter,
  ]);

  const handleModalSubmit = async (formData, proofFile) => {
    try {
      const res = await vendorPaymentService.recordPayment(formData, proofFile);
      const isFullyPaid = res.data?.updatedBill?.payment_status === "PAID";
      showToast(
        isFullyPaid
          ? "Vendor disbursement executed. Bill fully settled."
          : "Partial vendor disbursement recorded.",
        "success",
      );
      setIsModalOpen(false);
      loadPayments();
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmVoid = async () => {
    if (!paymentToVoid) return;
    setIsVoiding(true);
    try {
      await vendorPaymentService.voidPayment(paymentToVoid.id);
      showToast(
        "Disbursement successfully voided. Bill liability reinstated.",
        "success",
      );
      setIsVoidModalOpen(false);
      setPaymentToVoid(null);
      loadPayments();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsVoiding(false);
    }
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setVendorFilter("all");
    setIsFilterModalOpen(false);
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  };

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return <StatusBadge label="CASH" variant="default" icon={Banknote} />;
      case "CHECK":
      case "BANK_TRANSFER":
        return (
          <StatusBadge
            label={method.replace("_", " ")}
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Vendor Disbursements"
        subtitle="Accounts Payable Liquidation Hub"
        icon={CreditCard}
      >
        <StatusToggle
          activeValue={methodFilter}
          onToggle={setMethodFilter}
          options={METHOD_FILTERS.map((f) => ({ label: f.label, value: f.id }))}
          className="overflow-x-auto custom-scrollbar"
        />
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Voucher or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />
        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />
        <ActionButton
          label="Record Disbursement"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        />
      </PageHeader>

      <DataTable
        headers={[
          "Voucher No.",
          "Vendor & Bill",
          "Amount Disbursed",
          "Channel",
          "Payment Date",
          "Actions",
        ]}
        data={payments}
        loading={loading}
        emptyTitle="No Disbursements Found"
        emptySubtitle="Try adjusting filters or record a new vendor payment."
        renderRow={(pay) => (
          <tr
            key={pay.id}
            className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-black tracking-widest uppercase ${pay.status === "VOID" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 line-through opacity-70" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                  >
                    {pay.payment_number}
                  </span>
                  {pay.proof_of_payment_url && (
                    <Paperclip
                      size={12}
                      className="text-amber-500"
                      title="Proof Attached"
                    />
                  )}
                </div>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div
                className={`min-w-0 max-w-[200px] sm:max-w-[250px] ${pay.status === "VOID" ? "opacity-50" : ""}`}
              >
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                  {pay.vendor_name}
                </p>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest truncate">
                    {pay.bill_number}
                  </span>
                  {pay.current_bill_status && (
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                      Status: {pay.current_bill_status.replace("_", " ")}
                    </p>
                  )}
                  <span className="text-[9px] font-medium text-slate-500 flex items-center gap-1 truncate uppercase tracking-widest">
                    <Building2 size={10} className="shrink-0" />
                    {pay.branch_name}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span
                className={`text-sm font-black ${pay.status === "VOID" ? "text-slate-400 line-through" : "text-rose-600 dark:text-rose-500"}`}
              >
                - ₱
                {parseFloat(pay.amount_paid).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1">
                {pay.status === "VOID" ? (
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest px-2 py-0.5 bg-red-50 dark:bg-red-500/10 rounded border border-red-200 dark:border-red-500/20">
                    VOIDED
                  </span>
                ) : (
                  renderMethodBadge(pay.payment_method)
                )}
                {pay.reference_number && (
                  <span className="text-[8px] text-slate-400 font-mono tracking-wider truncate max-w-[120px] mt-1">
                    {pay.reference_number}
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${pay.status === "VOID" ? "text-slate-400 line-through" : "text-slate-500"}`}
              >
                {formatCalendarDate(pay.payment_date || pay.created_at)}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    setSelectedPaymentId(pay.id);
                    setIsDrawerOpen(true);
                  }}
                  title="View Voucher"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <FileSearch size={16} />
                </button>
                {pay.status !== "VOID" && (
                  <button
                    onClick={() => {
                      setPaymentToVoid(pay);
                      setIsVoidModalOpen(true);
                    }}
                    title="Void Disbursement"
                    className="p-1.5 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Ban size={16} />
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
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Filter by Branch
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Filter by Vendor
            </label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterModal>

      {/* VOID CONFIRMATION MODAL */}
      <AnimatePresence>
        {isVoidModalOpen && paymentToVoid && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Void Disbursement?
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Are you sure you want to void voucher{" "}
                <span className="font-bold font-mono">
                  {paymentToVoid.payment_number}
                </span>
                ? This action is irreversible. The{" "}
                <span className="font-bold">
                  ₱{parseFloat(paymentToVoid.amount_paid).toLocaleString()}
                </span>{" "}
                disbursement will be reversed, and the Accounts Payable
                liability for the target bill will be reinstated.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  disabled={isVoiding}
                  onClick={() => {
                    setIsVoidModalOpen(false);
                    setPaymentToVoid(null);
                  }}
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isVoiding}
                  onClick={handleConfirmVoid}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  {isVoiding ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Ban size={16} />
                  )}
                  Confirm Void
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

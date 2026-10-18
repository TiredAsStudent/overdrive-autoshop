import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  CreditCard,
  FileSearch,
  Ban,
  Plus,
  Banknote,
  Wallet,
  Landmark,
  Paperclip,
} from "lucide-react";
import { paymentService } from "../../services/staff/payment.service";
import PaymentModal from "../../features/staff/components/PaymentModal";
import PaymentDrawer from "../../features/staff/components/PaymentDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import ActionButton from "../../components/ui/ActionButton";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const METHOD_FILTERS = [
  { value: "all", label: "All Channels" },
  { value: "CASH", label: "Cash" },
  { value: "GCASH", label: "GCash" },
  { value: "MAYA", label: "Maya" },
  { value: "BANK_TRANSFER", label: "Bank" },
];

const ITEMS_PER_PAGE = 10;

const Payments = () => {
  const { showToast } = useApp();
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [methodFilter, setMethodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialInvoiceId, setInitialInvoiceId] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Confirm Modal State
  const [voidConfig, setVoidConfig] = useState({
    isOpen: false,
    paymentId: null,
    paymentNumber: "",
  });

  // Handle incoming Invoice-to-Payment deep link handoff
  useEffect(() => {
    if (location.state?.invoiceId) {
      setInitialInvoiceId(location.state.invoiceId);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleMethodFilterChange = (value) => {
    setMethodFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPayments(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        methodFilter,
        "all",
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
        error.message || "Unable to load payment collection records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, methodFilter, showToast]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleModalSubmit = async (formData, proofFile) => {
    const res = await paymentService.recordPayment(formData, proofFile);
    const isFullyPaid = res.data?.updatedInvoice?.status === "PAID";
    showToast(
      isFullyPaid
        ? "Payment recorded. Invoice fully settled."
        : "Partial payment recorded.",
      "success",
    );
    setIsModalOpen(false);
    setInitialInvoiceId(null);
    loadPayments();
  };

  const handleConfirmVoid = async () => {
    if (!voidConfig.paymentId) return;
    try {
      await paymentService.voidPayment(voidConfig.paymentId);
      showToast("Payment voided successfully.", "success");
      loadPayments();
    } catch (error) {
      showToast(error.message || "Failed to void payment receipt.", "error");
    } finally {
      setVoidConfig({ isOpen: false, paymentId: null, paymentNumber: "" });
    }
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("T")[0].split("-");
    if (!year || !month || !day) return dateString;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    ).toLocaleDateString("en-US", {
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

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return <StatusBadge label="CASH" variant="default" icon={Banknote} />;
      case "GCASH":
        return <StatusBadge label="GCASH" variant="info" icon={Wallet} />;
      case "MAYA":
        return <StatusBadge label="MAYA" variant="success" icon={Wallet} />;
      case "BANK_TRANSFER":
        return <StatusBadge label="BANK" variant="info" icon={Landmark} />;
      default:
        return <StatusBadge label={method || "OTHER"} variant="default" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* ACTION BAR */}
      <PageHeader
        title="Payments"
        subtitle="Cash Collections Directory"
        icon={CreditCard}
      >
        <StatusToggle
          activeValue={methodFilter}
          onToggle={handleMethodFilterChange}
          ariaLabel="Filter payments by collection channel"
          options={METHOD_FILTERS}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Receipt..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <ActionButton
          label="Record Payment"
          icon={Plus}
          onClick={() => {
            setInitialInvoiceId(null);
            setIsModalOpen(true);
          }}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Cash Collections and Payment Receipts Directory"
        minWidth="min-w-[840px]"
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
        emptySubtitle="Try adjusting your search or channel filter, or record a new customer payment."
        renderRow={(pay) => {
          const isVoid = pay.status === "VOID";

          return (
            <tr
              key={pay.id}
              className={`group border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors ${
                isVoid
                  ? "bg-slate-50/70 dark:bg-slate-900/40"
                  : "table-row-hover"
              }`}
            >
              {/* Receipt No. & Date */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className={`flex flex-col ${isVoid ? "opacity-70" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-mono tabular-nums font-black tracking-widest uppercase border ${
                        isVoid
                          ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 line-through"
                          : "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-900/70 dark:text-slate-300 dark:border-white/10"
                      }`}
                    >
                      {pay.payment_number}
                    </span>
                    {isVoid && <StatusBadge label="VOID" variant="danger" />}
                  </div>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5">
                    {formatCalendarDate(pay.payment_date || pay.created_at)}
                  </span>
                </div>
              </td>

              {/* Applied Invoice */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className={isVoid ? "opacity-70" : ""}>
                  <p
                    className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white uppercase truncate max-w-[160px]"
                    title={pay.invoice_number}
                  >
                    {pay.invoice_number}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">
                    Current Status:{" "}
                    {pay.current_invoice_status
                      ? pay.current_invoice_status.replace(/_/g, " ")
                      : "RECORDED"}
                  </p>
                </div>
              </td>

              {/* Customer */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className={`text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic tracking-tight truncate max-w-[160px] sm:max-w-[220px] ${
                    isVoid ? "opacity-70" : ""
                  }`}
                  title={pay.customer_name}
                >
                  {pay.customer_name}
                </p>
              </td>

              {/* Amount Paid */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span
                  className={`text-xs sm:text-sm font-mono tabular-nums font-black ${
                    isVoid
                      ? "text-slate-400 dark:text-slate-500 line-through"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  + ₱{formatCurrency(pay.amount_received)}
                </span>
              </td>

              {/* Channel */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div
                  className={`flex flex-col items-start gap-1 ${
                    isVoid ? "opacity-70" : ""
                  }`}
                >
                  {renderMethodBadge(pay.payment_method)}

                  {(pay.reference_number || pay.proof_of_payment_url) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {pay.reference_number && (
                        <span
                          className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums tracking-wider truncate max-w-[130px]"
                          title={pay.reference_number}
                        >
                          {pay.reference_number}
                        </span>
                      )}
                      {pay.proof_of_payment_url && (
                        <span
                          title="Proof of Payment Attached"
                          aria-label="Proof of Payment Attached"
                          className="inline-flex text-amber-500 dark:text-overdrive-yellow"
                        >
                          <Paperclip size={12} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
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
                    title={`View ${pay.payment_number}`}
                    aria-label={`View receipt ${pay.payment_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSearch size={16} aria-hidden="true" />
                  </button>

                  {!isVoid && (
                    <button
                      type="button"
                      onClick={() => {
                        setVoidConfig({
                          isOpen: true,
                          paymentId: pay.id,
                          paymentNumber: pay.payment_number,
                        });
                      }}
                      title={`Void ${pay.payment_number}`}
                      aria-label={`Void receipt ${pay.payment_number}`}
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

      {/* Modals & Drawers */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInitialInvoiceId(null);
        }}
        onSubmit={handleModalSubmit}
        initialInvoiceId={initialInvoiceId}
      />

      <PaymentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        paymentId={selectedPaymentId}
      />

      <ConfirmModal
        isOpen={voidConfig.isOpen}
        onClose={() =>
          setVoidConfig({ isOpen: false, paymentId: null, paymentNumber: "" })
        }
        onConfirm={handleConfirmVoid}
        title="Void Receipt"
        message={`Are you sure you want to VOID receipt ${voidConfig.paymentNumber}? This will reverse the invoice balance and cannot be undone.`}
        confirmText="Void Receipt"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Payments;

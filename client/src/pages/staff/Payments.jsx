import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CreditCard, FileSearch, Ban, Plus } from "lucide-react";
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
  { id: "all", label: "All Channels" },
  { id: "CASH", label: "Cash" },
  { id: "GCASH", label: "GCash" },
  { id: "MAYA", label: "Maya" },
  { id: "BANK_TRANSFER", label: "Bank" },
];

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
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    if (location.state?.invoiceId) {
      setInitialInvoiceId(location.state.invoiceId);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      setInitialInvoiceId(null);
      loadPayments();
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidConfig.paymentId) return;
    try {
      await paymentService.voidPayment(voidConfig.paymentId);
      showToast("Payment voided successfully.", "success");
      loadPayments();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setVoidConfig({ isOpen: false, paymentId: null, paymentNumber: "" });
    }
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  };

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return <StatusBadge label="CASH" variant="default" />;
      case "GCASH":
        return <StatusBadge label="GCASH" variant="info" />;
      case "MAYA":
        return <StatusBadge label="MAYA" variant="success" />;
      case "BANK_TRANSFER":
        return <StatusBadge label="BANK" variant="info" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Payments"
        subtitle="Cash Collections Directory"
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
          placeholder="Search Receipt..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <ActionButton
          label="Record Payment"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        />
      </PageHeader>

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
            className={`group transition-colors ${pay.status === "VOID" ? "opacity-60 bg-slate-50/50 dark:bg-slate-800/20" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-black tracking-widest uppercase ${pay.status === "VOID" ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 line-through" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                  >
                    {pay.payment_number}
                  </span>
                  {pay.status === "VOID" && (
                    <StatusBadge label="VOID" variant="danger" />
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                  {formatCalendarDate(pay.payment_date || pay.created_at)}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                {pay.invoice_number}
              </p>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                Current Status: {pay.current_invoice_status?.replace("_", " ")}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                {pay.customer_name}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span
                className={`text-sm font-black ${pay.status === "VOID" ? "text-slate-400 line-through" : "text-emerald-600 dark:text-emerald-500"}`}
              >
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
              <div className="flex items-center justify-end gap-1.5">
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

                {pay.status !== "VOID" && (
                  <button
                    onClick={() => {
                      setVoidConfig({
                        isOpen: true,
                        paymentId: pay.id,
                        paymentNumber: pay.payment_number,
                      });
                    }}
                    title="Void Receipt"
                    className="p-2 bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:text-slate-500 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
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
        variant="danger"
      />
    </div>
  );
};

export default Payments;

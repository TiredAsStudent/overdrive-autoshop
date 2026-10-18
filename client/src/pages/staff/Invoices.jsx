import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Receipt,
  Plus,
  FileSearch,
  CreditCard,
  Ban,
  Edit2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";

// Services & Hooks
import { invoiceService } from "../../services/staff/invoice.service";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

// Universal Components
import PageHeader from "../../components/shared/PageHeader";
import StatusToggle from "../../components/ui/StatusToggle";
import SearchBar from "../../components/ui/SearchBar";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";

// Features
import InvoiceModal from "../../features/staff/components/InvoiceModal";
import InvoiceDrawer from "../../features/staff/components/InvoiceDrawer";

const STATUS_FILTERS = [
  { value: "all", label: "All Invoices" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIALLY_PAID", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "VOID", label: "Void" },
];

const ITEMS_PER_PAGE = 10;

const Invoices = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingRow, setIsEditingRow] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [voidConfig, setVoidConfig] = useState({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: "",
  });

  // Handle incoming Sales Order-to-Invoice conversion handoff
  useEffect(() => {
    if (location.state?.salesOrderId) {
      setModalMode("CREATE");
      setSelectedInvoiceData({ sales_order_id: location.state.salesOrderId });
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Synchronize status filter if URL query param changes
  useEffect(() => {
    const paramStatus = searchParams.get("status") || "all";
    setStatusFilter((prev) => {
      if (prev !== paramStatus) {
        setCurrentPage(1);
        return paramStatus;
      }
      return prev;
    });
  }, [searchParams]);

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

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
      );

      const fetchedInvoices = response.data?.invoices || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedInvoices.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setInvoices(fetchedInvoices);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(error.message || "Unable to load invoice records.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleEditClick = async (invoiceId) => {
    if (isEditingRow) return;
    try {
      setIsEditingRow(invoiceId);
      const res = await invoiceService.getInvoiceDetails(invoiceId);
      setModalMode("EDIT");
      setSelectedInvoiceData(res.data);
      setIsModalOpen(true);
    } catch (err) {
      showToast(err.message || "Failed to load invoice details.", "error");
    } finally {
      setIsEditingRow(null);
    }
  };

  const handleModalSubmit = async (formData) => {
    if (modalMode === "CREATE") {
      await invoiceService.createInvoice(formData);
      showToast(
        "Invoice generated. Accounts Receivable posted successfully.",
        "success",
      );
    } else {
      await invoiceService.updateInvoice(selectedInvoiceData.id, formData);
      showToast("Invoice metadata updated successfully.", "success");
    }
    setIsModalOpen(false);
    setSelectedInvoiceData(null);
    loadInvoices();
  };

  const handleConfirmVoid = async () => {
    if (!voidConfig.invoiceId) return;
    try {
      await invoiceService.updateInvoice(voidConfig.invoiceId, {
        status: "VOID",
      });
      showToast("Invoice marked as VOID.", "success");
      loadInvoices();
    } catch (error) {
      showToast(error.message || "Failed to void invoice.", "error");
    } finally {
      setVoidConfig({ isOpen: false, invoiceId: null, invoiceNumber: "" });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PARTIALLY_PAID":
        return "warning";
      case "OVERDUE":
        return "danger";
      case "VOID":
      case "UNPAID":
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return CheckCircle;
      case "PARTIALLY_PAID":
        return Clock;
      case "OVERDUE":
        return AlertCircle;
      case "VOID":
        return Ban;
      case "UNPAID":
      default:
        return FileText;
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

  const checkIsOverdue = (dateString, status) => {
    if (status === "PAID" || status === "VOID") return false;
    if (!dateString) return false;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const targetStr = dateString.split("T")[0];
    return targetStr < todayStr;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Invoices"
        subtitle="Official Billing & Receivables"
        icon={Receipt}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusFilterChange}
          ariaLabel="Filter invoices by billing status"
          options={STATUS_FILTERS}
        />
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          isSearching={searchQuery !== debouncedSearchQuery}
          placeholder="Search Invoice..."
        />
        <ActionButton
          label="Bill Order"
          icon={Plus}
          onClick={() => {
            setModalMode("CREATE");
            setSelectedInvoiceData(null);
            setIsModalOpen(true);
          }}
        />
      </PageHeader>

      <DataTable
        caption="Sales Invoices and Accounts Receivable Directory"
        minWidth="min-w-[840px]"
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
        emptySubtitle="Try adjusting your search or filter criteria, or bill a completed sales order."
        renderRow={(inv) => {
          const balance = Math.max(
            0,
            (parseFloat(inv.grand_total) || 0) -
              (parseFloat(inv.amount_paid) || 0),
          );
          const isOverdue = checkIsOverdue(inv.due_date, inv.status);

          return (
            <tr
              key={inv.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Invoice Number */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                  {inv.invoice_number}
                </span>
              </td>

              {/* Client Link */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate max-w-[180px] sm:max-w-[240px]"
                  title={inv.customer_name}
                >
                  {inv.customer_name}
                </p>
              </td>

              {/* Due Date */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className={`text-xs font-mono tabular-nums font-bold ${
                    isOverdue
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {formatCalendarDate(inv.due_date)}
                </p>
              </td>

              {/* Balance Due & Paid */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white">
                  ₱{formatCurrency(balance)}
                </p>
                <p className="text-[10px] font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">
                  Paid: ₱{formatCurrency(inv.amount_paid)}
                </p>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={inv.status ? inv.status.replace(/_/g, " ") : "UNPAID"}
                  variant={getStatusVariant(inv.status)}
                  icon={getStatusIcon(inv.status)}
                  className={
                    inv.status === "VOID" ? "line-through opacity-70" : ""
                  }
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setIsDrawerOpen(true);
                    }}
                    title={`View ${inv.invoice_number}`}
                    aria-label={`View invoice ${inv.invoice_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSearch size={16} aria-hidden="true" />
                  </button>

                  {inv.status !== "PAID" && inv.status !== "VOID" && (
                    <button
                      type="button"
                      onClick={() => handleEditClick(inv.id)}
                      disabled={isEditingRow === inv.id}
                      title={`Edit ${inv.invoice_number} Due Date & Notes`}
                      aria-label={`Edit due date and notes for ${inv.invoice_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isEditingRow === inv.id ? (
                        <Loader2
                          size={16}
                          aria-hidden="true"
                          className="animate-spin text-amber-500"
                        />
                      ) : (
                        <Edit2 size={16} aria-hidden="true" />
                      )}
                    </button>
                  )}

                  {inv.status === "UNPAID" && (
                    <button
                      type="button"
                      onClick={() => {
                        setVoidConfig({
                          isOpen: true,
                          invoiceId: inv.id,
                          invoiceNumber: inv.invoice_number,
                        });
                      }}
                      title={`Void ${inv.invoice_number}`}
                      aria-label={`Void invoice ${inv.invoice_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <Ban size={16} aria-hidden="true" />
                    </button>
                  )}

                  {inv.status !== "PAID" && inv.status !== "VOID" && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/staff/sales/payments", {
                          state: { invoiceId: inv.id },
                        })
                      }
                      title={`Record Payment for ${inv.invoice_number}`}
                      aria-label={`Record payment for ${inv.invoice_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200/60 dark:hover:border-emerald-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <CreditCard size={16} aria-hidden="true" />
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

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInvoiceData(null);
        }}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialData={selectedInvoiceData}
      />

      <InvoiceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        invoiceId={selectedInvoiceId}
      />

      <ConfirmModal
        isOpen={voidConfig.isOpen}
        onClose={() =>
          setVoidConfig({ isOpen: false, invoiceId: null, invoiceNumber: "" })
        }
        onConfirm={handleConfirmVoid}
        title="Void Invoice"
        message={`Are you sure you want to VOID Invoice ${voidConfig.invoiceNumber}? This cannot be undone.`}
        confirmText="Void Invoice"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Invoices;

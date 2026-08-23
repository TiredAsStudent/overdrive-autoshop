import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Receipt,
  Plus,
  FileSearch,
  CreditCard,
  Ban,
  Edit2,
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

const Invoices = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    if (location.state?.salesOrderId) {
      setModalMode("CREATE");
      setSelectedInvoiceData({ sales_order_id: location.state.salesOrderId });
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      loadInvoices();
    } catch (error) {
      throw error;
    }
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
      showToast(error.message, "error");
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Invoices"
        subtitle="Official Billing & Receivables"
        icon={Receipt}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={STATUS_FILTERS}
        />
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
                <StatusBadge
                  label={inv.status.replace("_", " ")}
                  variant={getStatusVariant(inv.status)}
                  className={
                    inv.status === "VOID" ? "line-through opacity-70" : ""
                  }
                />
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

                  {inv.status !== "PAID" && inv.status !== "VOID" && (
                    <button
                      onClick={() => {
                        setModalMode("EDIT");
                        setSelectedInvoiceData(inv);
                        setIsModalOpen(true);
                      }}
                      title="Edit Due Date & Notes"
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}

                  {inv.status === "UNPAID" && (
                    <button
                      onClick={() => {
                        setVoidConfig({
                          isOpen: true,
                          invoiceId: inv.id,
                          invoiceNumber: inv.invoice_number,
                        });
                      }}
                      title="Void Invoice"
                      className="p-2 bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:text-slate-500 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <Ban size={16} />
                    </button>
                  )}

                  {inv.status !== "PAID" && inv.status !== "VOID" && (
                    <button
                      onClick={() =>
                        navigate("/staff/sales/payments", {
                          state: { invoiceId: inv.id },
                        })
                      }
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

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
        variant="danger"
      />
    </div>
  );
};

export default Invoices;

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  FileSearch,
  Receipt,
  Edit2,
  Clock,
  Loader2,
} from "lucide-react";
import { salesOrderService } from "../../services/staff/salesOrder.service";
import SalesOrderModal from "../../features/staff/components/SalesOrderModal";
import SalesOrderDrawer from "../../features/staff/components/SalesOrderDrawer";

// Universal Components
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import StatusBadge from "../../components/ui/StatusBadge";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_FILTERS = [
  { value: "all", label: "All Orders" },
  { value: "PENDING_SERVICE", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const ITEMS_PER_PAGE = 10;

const SalesOrders = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingRow, setIsEditingRow] = useState(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  // Handle incoming Estimate-to-Order conversion handoff
  useEffect(() => {
    if (location.state?.estimateId) {
      setModalMode("CREATE");
      setSelectedOrderData({ estimate_id: location.state.estimateId });
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

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await salesOrderService.getSalesOrders(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
      );

      const fetchedOrders = response.data?.salesOrders || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedOrders.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setOrders(fetchedOrders);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load sales order records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleModalSubmit = async (formData) => {
    if (modalMode === "CREATE") {
      await salesOrderService.createSalesOrder(formData);
      showToast("Job Order initialized successfully.", "success");
    } else {
      await salesOrderService.updateSalesOrder(selectedOrderData.id, formData);
      showToast("Job Order details updated.", "success");
    }
    setIsModalOpen(false);
    setSelectedOrderData(null);
    loadOrders();
  };

  const handleStatusChange = (order, newStatus) => {
    const isProgress = newStatus === "IN_PROGRESS";
    const isCompleted = newStatus === "COMPLETED";
    const formattedStatus = newStatus.replace(/_/g, " ");

    const isCancellingFromProgress =
      order.status === "IN_PROGRESS" && newStatus === "CANCELLED";

    let message = `Are you sure you want to mark ${order.sales_order_number} as ${formattedStatus}?`;

    if (isCancellingFromProgress) {
      message = `Are you sure you want to cancel ${order.sales_order_number}? Cancelling this in-progress order will automatically return all issued parts back to physical inventory.`;
    }

    setConfirmConfig({
      isOpen: true,
      title: `${isCompleted ? "Complete" : isProgress ? "Start" : "Cancel"} Job Order`,
      message: message,
      confirmText: `Yes, Mark ${formattedStatus}`,
      variant: isCompleted ? "info" : isProgress ? "warning" : "danger",
      onConfirm: async () => {
        try {
          await salesOrderService.updateSalesOrder(order.id, {
            status: newStatus,
          });

          if (isCancellingFromProgress) {
            showToast(
              "Order Cancelled. Parts have been restocked to inventory.",
              "success",
            );
          } else {
            showToast(`Job order marked as ${formattedStatus}.`, "success");
          }

          loadOrders();
        } catch (error) {
          showToast(
            error.message || "Failed to update job order status.",
            "error",
          );
        }
      },
    });
  };

  const handleEditClick = async (orderId) => {
    if (isEditingRow) return;
    try {
      setIsEditingRow(orderId);
      const res = await salesOrderService.getSalesOrderDetails(orderId);
      setModalMode("EDIT");
      setSelectedOrderData(res.data);
      setIsModalOpen(true);
    } catch (err) {
      showToast(err.message || "Failed to load order details.", "error");
    } finally {
      setIsEditingRow(null);
    }
  };

  const getStatusVariant = (status) => {
    if (status === "PENDING_SERVICE") return "default";
    if (status === "IN_PROGRESS") return "warning";
    if (status === "COMPLETED" || status === "INVOICED") return "success";
    if (status === "CANCELLED") return "danger";
    return "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING_SERVICE":
        return Clock;
      case "IN_PROGRESS":
        return Play;
      case "COMPLETED":
      case "INVOICED":
        return CheckCircle;
      case "CANCELLED":
        return XCircle;
      default:
        return ClipboardList;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Sales Orders"
        subtitle="Operational Work Hub"
        icon={ClipboardList}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusFilterChange}
          ariaLabel="Filter sales orders by operational status"
          options={STATUS_FILTERS}
        />
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          isSearching={searchQuery !== debouncedSearchQuery}
          placeholder="Search Order..."
        />
        <ActionButton
          label="Convert Order"
          icon={Plus}
          onClick={() => {
            setModalMode("CREATE");
            setSelectedOrderData(null);
            setIsModalOpen(true);
          }}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Sales Orders Directory"
        minWidth="min-w-[840px]"
        headers={[
          "Job Card",
          "Client Link",
          "Completion Target",
          "Grand Total",
          "Status",
          "Actions",
        ]}
        data={orders}
        loading={loading}
        emptyTitle="No Sales Orders Found"
        emptySubtitle="Try adjusting your search or filter criteria, or convert an approved estimate."
        renderRow={(order) => (
          <tr
            key={order.id}
            className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
          >
            {/* Job Card */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                {order.sales_order_number}
              </span>
            </td>

            {/* Client Link */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <p
                className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate max-w-[180px] sm:max-w-[240px]"
                title={order.customer_name}
              >
                {order.customer_name}
              </p>
            </td>

            {/* Completion Target */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <p className="text-xs font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                {formatDate(order.estimated_completion_date)}
              </p>
            </td>

            {/* Grand Total */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white">
                ₱
                {(parseFloat(order.grand_total) || 0).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}
              </span>
            </td>

            {/* Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <StatusBadge
                label={
                  order.status
                    ? order.status.replace(/_/g, " ")
                    : "PENDING SERVICE"
                }
                variant={getStatusVariant(order.status)}
                icon={getStatusIcon(order.status)}
              />
            </td>

            {/* Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setIsDrawerOpen(true);
                  }}
                  title={`View ${order.sales_order_number}`}
                  aria-label={`View sales order ${order.sales_order_number}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <FileSearch size={16} aria-hidden="true" />
                </button>

                {/* Edit Dates & Notes */}
                {(order.status === "PENDING_SERVICE" ||
                  order.status === "IN_PROGRESS") && (
                  <button
                    type="button"
                    onClick={() => handleEditClick(order.id)}
                    disabled={isEditingRow === order.id}
                    title={`Edit ${order.sales_order_number} Dates & Notes`}
                    aria-label={`Edit dates and notes for ${order.sales_order_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isEditingRow === order.id ? (
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

                {/* Convert to Invoice */}
                {order.status === "COMPLETED" && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/staff/sales/invoices", {
                        state: { salesOrderId: order.id },
                      })
                    }
                    title="Convert to Invoice"
                    aria-label={`Convert ${order.sales_order_number} to Invoice`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200/60 dark:hover:border-indigo-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <Receipt size={16} aria-hidden="true" />
                  </button>
                )}

                {/* Start Service */}
                {order.status === "PENDING_SERVICE" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(order, "IN_PROGRESS")}
                    title={`Start Service on ${order.sales_order_number}`}
                    aria-label={`Start service on ${order.sales_order_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <Play size={16} aria-hidden="true" />
                  </button>
                )}

                {/* Mark Completed */}
                {order.status === "IN_PROGRESS" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(order, "COMPLETED")}
                    title={`Mark ${order.sales_order_number} Completed`}
                    aria-label={`Mark ${order.sales_order_number} as Completed`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200/60 dark:hover:border-emerald-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle size={16} aria-hidden="true" />
                  </button>
                )}

                {/* Cancel Action */}
                {(order.status === "PENDING_SERVICE" ||
                  order.status === "IN_PROGRESS") && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(order, "CANCELLED")}
                    title={`Cancel ${order.sales_order_number}`}
                    aria-label={`Cancel ${order.sales_order_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <XCircle size={16} aria-hidden="true" />
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
      <SalesOrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrderData(null);
        }}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialData={selectedOrderData}
      />
      <SalesOrderDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        salesOrderId={selectedOrderId}
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

export default SalesOrders;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

const SalesOrders = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
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

  useEffect(() => {
    if (location.state?.estimateId) {
      setModalMode("CREATE");
      setSelectedOrderData({ estimate_id: location.state.estimateId });
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await salesOrderService.getSalesOrders(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
      );
      setOrders(response.data?.salesOrders || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  const handleModalSubmit = async (formData) => {
    try {
      if (modalMode === "CREATE") {
        await salesOrderService.createSalesOrder(formData);
        showToast("Work Order initialized successfully.", "success");
      } else {
        await salesOrderService.updateSalesOrder(
          selectedOrderData.id,
          formData,
        );
        showToast("Work Order details updated.", "success");
      }
      setIsModalOpen(false);
      loadOrders();
    } catch (error) {
      throw error;
    }
  };

  const handleStatusChange = (order, newStatus) => {
    const isProgress = newStatus === "IN_PROGRESS";
    const isCompleted = newStatus === "COMPLETED";

    setConfirmConfig({
      isOpen: true,
      title: `${isCompleted ? "Complete" : isProgress ? "Start" : "Cancel"} Work Order`,
      message: `Are you sure you want to mark ${order.sales_order_number} as ${newStatus}?`,
      confirmText: `Yes, Mark ${newStatus}`,
      variant: isCompleted ? "info" : isProgress ? "warning" : "danger",
      onConfirm: async () => {
        try {
          await salesOrderService.updateSalesOrder(order.id, {
            status: newStatus,
          });
          showToast(`Work order marked as ${newStatus}.`, "success");
          loadOrders();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "PENDING_SERVICE":
        return { variant: "default", icon: Clock };
      case "IN_PROGRESS":
        return { variant: "warning", icon: Play };
      case "COMPLETED":
      case "INVOICED":
        return { variant: "success", icon: CheckCircle };
      case "CANCELLED":
        return { variant: "danger", icon: XCircle };
      default:
        return { variant: "default", icon: ClipboardList };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Sales Orders"
        subtitle="Operational Work Hub"
        icon={ClipboardList}
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
        renderRow={(order) => {
          const statusConfig = getStatusConfig(order.status);

          return (
            <tr
              key={order.id}
              className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                  {order.sales_order_number}
                </span>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                  {order.customer_name}
                </p>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {order.estimated_completion_date
                    ? new Date(
                        order.estimated_completion_date,
                      ).toLocaleDateString()
                    : "TBD"}
                </p>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  ₱
                  {parseFloat(order.grand_total).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <StatusBadge
                  label={order.status.replace("_", " ")}
                  variant={statusConfig.variant}
                  icon={statusConfig.icon}
                />
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsDrawerOpen(true);
                    }}
                    title="View Document"
                    className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileSearch size={16} />
                  </button>

                  {(order.status === "PENDING_SERVICE" ||
                    order.status === "IN_PROGRESS") && (
                    <button
                      onClick={() => {
                        setModalMode("EDIT");
                        setSelectedOrderData(order);
                        setIsModalOpen(true);
                      }}
                      title="Edit Dates & Notes"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}

                  {order.status === "COMPLETED" && (
                    <button
                      onClick={() =>
                        navigate("/staff/sales/invoices", {
                          state: { salesOrderId: order.id },
                        })
                      }
                      title="Convert to Invoice"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Receipt size={16} />
                    </button>
                  )}

                  {order.status === "PENDING_SERVICE" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(order, "IN_PROGRESS")}
                        title="Start Service"
                        className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Play size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(order, "CANCELLED")}
                        title="Cancel"
                        className="p-1.5 sm:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {order.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange(order, "COMPLETED")}
                      title="Mark Completed"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <CheckCircle size={16} />
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
      <SalesOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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

export default SalesOrders;

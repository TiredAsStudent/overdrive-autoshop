import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  ShoppingCart,
  Plus,
  FileSearch,
  Edit2,
  Send,
  XCircle,
} from "lucide-react";
import { purchaseOrderService } from "../../services/staff/purchaseOrder.service";
import PurchaseOrderModal from "../../features/staff/components/PurchaseOrderModal";
import PurchaseOrderDrawer from "../../features/staff/components/PurchaseOrderDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_FILTERS = [
  { id: "all", label: "All POs" },
  { id: "DRAFT", label: "Drafts" },
  { id: "PENDING_APPROVAL", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
];

const PurchaseOrders = () => {
  const { showToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderService.getPurchaseOrders(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
      );
      setOrders(response.data?.purchaseOrders || []);
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
      if (selectedOrder) {
        await purchaseOrderService.updatePurchaseOrder(
          selectedOrder.id,
          formData,
        );
        showToast(
          formData.is_submitting
            ? "Document submitted for managerial approval."
            : "Draft saved successfully.",
          "success",
        );
      } else {
        await purchaseOrderService.createPurchaseOrder(formData);
        showToast(
          formData.is_submitting
            ? "Purchase Order generated and submitted for approval."
            : "New Purchase Order drafted.",
          "success",
        );
      }
      setIsModalOpen(false);
      loadOrders();
    } catch (error) {
      throw error;
    }
  };

  const handleStatusChange = (order, newStatus) => {
    const isSubmit = newStatus === "PENDING_APPROVAL";
    setConfirmConfig({
      isOpen: true,
      title: `${isSubmit ? "Submit for Approval" : "Cancel Order"}`,
      message: `Are you sure you want to ${isSubmit ? "submit" : "cancel"} ${order.purchase_order_number}? ${isSubmit ? "It will be locked for review." : "This is permanent."}`,
      confirmText: `Yes, ${isSubmit ? "Submit" : "Cancel"}`,
      variant: isSubmit ? "info" : "danger",
      onConfirm: async () => {
        try {
          await purchaseOrderService.updateStatus(order.id, newStatus);
          showToast(
            `Document successfully ${isSubmit ? "submitted" : "cancelled"}.`,
            "success",
          );
          loadOrders();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT":
        return "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
      case "PENDING_APPROVAL":
        return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "REJECTED":
      case "CANCELLED":
        return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      case "CLOSED":
        return "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <ShoppingCart className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Purchase Orders
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Procurement Control
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${statusFilter === f.id ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search PO or Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => {
              setSelectedOrder(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20 shrink-0 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Draft Document
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Document Ref",
          "Supplier Target",
          "Expected Delivery",
          "Financial Lock",
          "Status",
          "Actions",
        ]}
        data={orders}
        loading={loading}
        emptyTitle="No Purchase Orders Found"
        renderRow={(order) => (
          <tr
            key={order.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                {order.purchase_order_number}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                {order.vendor_name}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {new Date(order.expected_delivery_date).toLocaleDateString()}
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
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(order.status)}`}
              >
                {order.status.replace("_", " ")}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsDrawerOpen(true);
                  }}
                  title="View Document"
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <FileSearch size={16} />
                </button>
                {/* Draft / Rejected Records allow Editing & Submission */}
                {["DRAFT", "REJECTED"].includes(order.status) && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          const res =
                            await purchaseOrderService.getPurchaseOrderDetails(
                              order.id,
                            );
                          setSelectedOrder(res.data);
                          setIsModalOpen(true);
                        } catch (e) {
                          showToast("Failed to load details", "error");
                        }
                      }}
                      title="Edit Draft"
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(order, "PENDING_APPROVAL")
                      }
                      title="Submit for Approval"
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(order, "CANCELLED")}
                      title="Cancel Document"
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
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

      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedOrder}
      />
      <PurchaseOrderDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        poId={selectedOrder?.id}
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

export default PurchaseOrders;

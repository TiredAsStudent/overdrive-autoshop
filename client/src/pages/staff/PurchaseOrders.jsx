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
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
} from "lucide-react";
import { purchaseOrderService } from "../../services/staff/purchaseOrder.service";
import { vendorService } from "../../services/staff/vendor.service";
import PurchaseOrderModal from "../../features/staff/components/PurchaseOrderModal";
import PurchaseOrderDrawer from "../../features/staff/components/PurchaseOrderDrawer";

// --- REUSABLE SHARED COMPONENTS ---
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_FILTERS = [
  { label: "All POs", value: "all" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Pending", value: "PENDING_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const PurchaseOrders = () => {
  const { showToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorList, setVendorList] = useState([]);

  // Base Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    vendorId: "all",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [activeFilters, setActiveFilters] = useState({
    vendorId: "all",
    status: "",
    startDate: "",
    endDate: "",
  });

  const activeFilterCount =
    (activeFilters.vendorId !== "all" ? 1 : 0) +
    (activeFilters.status !== "" ? 1 : 0) +
    (activeFilters.startDate ? 1 : 0) +
    (activeFilters.endDate ? 1 : 0);

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
  }, [debouncedSearchQuery, statusFilter, activeFilters]);

  // Load Vendor Dictionary for the Filter
  useEffect(() => {
    vendorService
      .getVendors(1, 500, "", "active", "all", "all")
      .then((res) => setVendorList(res.data?.vendors || []))
      .catch(() => setVendorList([]));
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderService.getPurchaseOrders(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        activeFilters.status || statusFilter,
        activeFilters.vendorId,
        "all",
        activeFilters.startDate,
        activeFilters.endDate,
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
  }, [currentPage, debouncedSearchQuery, statusFilter, activeFilters]);

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

  const applyFilters = () => {
    setActiveFilters(tempFilters);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const reset = { vendorId: "all", status: "", startDate: "", endDate: "" };
    setTempFilters(reset);
    setActiveFilters(reset);
    setIsFilterModalOpen(false);
  };

  const getBadgeDetails = (status) => {
    switch (status) {
      case "APPROVED":
        return { variant: "success", icon: CheckCircle };
      case "PENDING_APPROVAL":
        return { variant: "warning", icon: Clock };
      case "REJECTED":
      case "CANCELLED":
        return { variant: "danger", icon: XCircle };
      case "CLOSED":
        return { variant: "info", icon: CheckCircle };
      default:
        return { variant: "default", icon: FileText };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Purchase Orders"
        subtitle="Procurement Control"
        icon={ShoppingCart}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={STATUS_FILTERS}
        />

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search PO or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          onClick={() => {
            setSelectedOrder(null);
            setIsModalOpen(true);
          }}
          label="Draft Document"
          icon={Plus}
        />
      </PageHeader>

      <DataTable
        headers={[
          "Document Ref",
          "Vendor",
          "Date Details",
          "Grand Total",
          "Status",
          "Actions",
        ]}
        data={orders}
        loading={loading}
        emptyTitle="No Purchase Orders Found"
        renderRow={(order) => {
          const badge = getBadgeDetails(order.status);
          return (
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
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">
                  Delivery:{" "}
                  {new Date(order.expected_delivery_date).toLocaleDateString()}
                </p>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  ₱
                  {parseFloat(order.grand_total).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6">
                <StatusBadge
                  label={order.status.replace("_", " ")}
                  variant={badge.variant}
                  icon={badge.icon}
                />
              </td>
              <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDrawerOpen(true);
                    }}
                    title="View Document"
                    className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
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
                        className="p-1.5 sm:p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(order, "PENDING_APPROVAL")
                        }
                        title="Submit for Approval"
                        className="p-1.5 sm:p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <Send size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(order, "CANCELLED")}
                        title="Cancel Document"
                        className="p-1.5 sm:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
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

      {/* Advanced Filters Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={clearFilters}
        onApply={applyFilters}
        title="Advanced Document Filters"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Filter by Vendor
            </label>
            <select
              value={tempFilters.vendorId}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, vendorId: e.target.value })
              }
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
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Order Status
            </label>
            <select
              value={tempFilters.status}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, status: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Any Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Date Created (From)
            </label>
            <input
              type="date"
              value={tempFilters.startDate}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, startDate: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Date Created (To)
            </label>
            <input
              type="date"
              value={tempFilters.endDate}
              min={tempFilters.startDate}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, endDate: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </FilterModal>

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

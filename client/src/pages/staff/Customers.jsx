import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Users,
  UserPlus,
  FileText,
  UserCheck,
  Edit2,
  PlayCircle,
  Archive,
  RotateCcw,
} from "lucide-react";
import { customerService } from "../../services/staff/customer.service";
import CustomerModal from "../../features/staff/components/CustomerModal";
import CustomerProfileDrawer from "../../features/staff/components/CustomerProfileDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const Customers = () => {
  const { showToast, setSession, activeCustomer } = useApp();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
  }, [debouncedSearchQuery, showArchived]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const statusParam = showArchived ? "archived" : "active";
      const response = await customerService.getCustomers(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusParam,
        "all",
      );
      setCustomers(response.data?.customers || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [currentPage, debouncedSearchQuery, showArchived]);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
        showToast("Customer profile updated successfully.", "success");
      } else {
        await customerService.registerCustomer(formData);
        showToast("New customer registered successfully.", "success");
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (error) {
      throw error;
    }
  };

  const handleToggleStatus = (customerData) => {
    const action = customerData.is_active ? "Archive" : "Restore";
    const variant = customerData.is_active ? "danger" : "info";
    setConfirmConfig({
      isOpen: true,
      title: `${action} Customer Record`,
      message: `Are you sure you want to ${action.toLowerCase()} ${customerData.full_name}? Inactive customers remain preserved in existing invoices.`,
      confirmText: `Yes, ${action}`,
      variant: variant,
      onConfirm: async () => {
        try {
          await customerService.updateCustomer(customerData.id, {
            is_active: !customerData.is_active,
          });
          showToast(
            `${customerData.full_name} ${customerData.is_active ? "archived" : "restored"} successfully.`,
            "success",
          );
          loadCustomers();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  };

  const startSalesSession = (customerData) => {
    setSession(null, customerData);
    showToast(`Active Session Bound: ${customerData.full_name}`, "success");
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Users className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Customer Registry
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Sales Account Masterfile
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-[220px] flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setShowArchived(false)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Archived
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
          >
            <UserPlus size={16} /> Register Client
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Customer Profile",
          "Contact Data",
          "Origin Location",
          "Status",
          "Actions",
        ]}
        data={customers}
        loading={loading}
        emptyTitle={`No ${showArchived ? "archived" : "active"} customers found`}
        renderRow={(customer) => (
          <tr
            key={customer.id}
            className={`group transition-colors ${!customer.is_active ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1">
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[250px]">
                  {customer.full_name}
                </p>
                <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black tracking-widest uppercase">
                  {customer.customer_code}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>{" "}
                  {customer.contact_number}
                </span>
                {customer.email && (
                  <span className="text-[10px] opacity-80 pl-3.5 lowercase">
                    {customer.email}
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {customer.branch_name || "Global"}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${customer.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}
              >
                {customer.is_active ? (
                  <UserCheck size={12} />
                ) : (
                  <Archive size={12} />
                )}
                {customer.is_active ? "Active" : "Archived"}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1.5">
                {customer.is_active && (
                  <button
                    onClick={() => startSalesSession(customer)}
                    disabled={activeCustomer?.id === customer.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCustomer?.id === customer.id ? "bg-amber-500 text-slate-900 shadow-sm cursor-default" : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 cursor-pointer shadow-sm"}`}
                  >
                    <PlayCircle size={14} />{" "}
                    {activeCustomer?.id === customer.id
                      ? "Session Active"
                      : "Set Active Session"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsDrawerOpen(true);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsModalOpen(true);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleToggleStatus(customer)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${customer.is_active ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400"}`}
                >
                  {customer.is_active ? (
                    <Archive size={16} />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                </button>
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
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedCustomer}
      />
      <CustomerProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customer={selectedCustomer}
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

export default Customers;

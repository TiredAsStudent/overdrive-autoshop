import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  FileText,
  UserCheck,
  Edit2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { customerService } from "../../services/staff/customer.service";
import CustomerModal from "../../features/staff/components/CustomerModal";
import CustomerProfileDrawer from "../../features/staff/components/CustomerProfileDrawer";

// Universal Shared Components
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import PageHeader from "../../components/shared/PageHeader";

// Universal UI Components
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ITEMS_PER_PAGE = 10;

const Customers = () => {
  const { showToast } = useApp();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleToggleArchived = (value) => {
    setShowArchived(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadCustomers = useCallback(async () => {
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

      const fetchedCustomers = response.data?.customers || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedCustomers.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setCustomers(fetchedCustomers);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(error.message || "Unable to load customer records.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, showArchived, showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleModalSubmit = async (formData) => {
    if (selectedCustomer) {
      await customerService.updateCustomer(selectedCustomer.id, formData);
      showToast("Customer profile updated successfully.", "success");
    } else {
      await customerService.registerCustomer(formData);
      showToast("New customer registered successfully.", "success");
    }
    setIsModalOpen(false);
    loadCustomers();
  };

  const handleToggleStatus = (customerData) => {
    const action = customerData.is_active ? "Archive" : "Restore";
    const variant = customerData.is_active ? "danger" : "info";
    setConfirmConfig({
      isOpen: true,
      title: `${action} Customer Record`,
      message: `Are you sure you want to ${action.toLowerCase()} ${customerData.full_name}? Inactive customers remain preserved in existing transactions.`,
      confirmText: `Yes, ${action}`,
      variant: variant,
      onConfirm: async () => {
        try {
          await customerService.updateCustomer(customerData.id, {
            is_active: !customerData.is_active,
          });
          showToast(
            `${customerData.full_name} ${
              customerData.is_active ? "archived" : "restored"
            } successfully.`,
            "success",
          );
          loadCustomers();
        } catch (error) {
          showToast(
            error.message || `Unable to ${action.toLowerCase()} customer.`,
            "error",
          );
        }
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Customers"
        subtitle="Global Sales Account Masterfile"
        icon={Users}
      >
        <StatusToggle
          activeValue={showArchived}
          onToggle={handleToggleArchived}
          ariaLabel="Filter customers by active or archived status"
          options={[
            { label: "Active", value: false },
            { label: "Archived", value: true },
          ]}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search name or phone..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <ActionButton
          onClick={() => {
            setSelectedCustomer(null);
            setIsModalOpen(true);
          }}
          label="Register Client"
          icon={UserPlus}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Customer Masterfile Directory"
        minWidth="min-w-[760px]"
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
        emptySubtitle="Try adjusting your search query or register a new client."
        renderRow={(customer) => (
          <tr
            key={customer.id}
            className={`group border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors ${
              !customer.is_active
                ? "bg-slate-50/70 dark:bg-slate-900/40"
                : "table-row-hover"
            }`}
          >
            {/* Customer Profile */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div
                className={`flex flex-col items-start gap-1 ${
                  !customer.is_active ? "opacity-75" : ""
                }`}
              >
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate max-w-[180px] sm:max-w-[260px]"
                  title={customer.full_name}
                >
                  {customer.full_name}
                </p>
                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-[9px] font-mono tabular-nums font-black tracking-widest uppercase">
                  {customer.customer_code}
                </span>
              </div>
            </td>

            {/* Contact Data */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div
                className={`flex flex-col gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 ${
                  !customer.is_active ? "opacity-75" : ""
                }`}
              >
                <span className="flex items-center gap-2 font-mono tabular-nums">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-overdrive-yellow shrink-0"
                  />
                  <span>{customer.contact_number}</span>
                </span>
                {customer.email && (
                  <span
                    className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pl-3.5 lowercase truncate max-w-[180px] sm:max-w-[240px]"
                    title={customer.email}
                  >
                    {customer.email}
                  </span>
                )}
              </div>
            </td>

            {/* Origin Location */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span
                className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 truncate block max-w-[160px]"
                title={customer.branch_name || "Global"}
              >
                {customer.branch_name || "Global"}
              </span>
            </td>

            {/* Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <StatusBadge
                label={customer.is_active ? "Active" : "Archived"}
                variant={customer.is_active ? "success" : "danger"}
                icon={customer.is_active ? UserCheck : Archive}
              />
            </td>

            {/* Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsDrawerOpen(true);
                  }}
                  title={`View ${customer.full_name} Profile`}
                  aria-label={`View profile for ${customer.full_name}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <FileText size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsModalOpen(true);
                  }}
                  title={`Edit ${customer.full_name} Profile`}
                  aria-label={`Edit profile for ${customer.full_name}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Edit2 size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(customer)}
                  title={
                    customer.is_active
                      ? `Archive ${customer.full_name}`
                      : `Restore ${customer.full_name}`
                  }
                  aria-label={
                    customer.is_active
                      ? `Archive ${customer.full_name}`
                      : `Restore ${customer.full_name}`
                  }
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    customer.is_active
                      ? "text-slate-400 border-transparent hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200/60 dark:hover:border-red-500/20"
                      : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20"
                  }`}
                >
                  {customer.is_active ? (
                    <Archive size={16} aria-hidden="true" />
                  ) : (
                    <RotateCcw size={16} aria-hidden="true" />
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

export default Customers;

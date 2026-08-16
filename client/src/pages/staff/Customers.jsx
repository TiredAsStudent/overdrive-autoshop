import React, { useState, useEffect } from "react";
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
      message: `Are you sure you want to ${action.toLowerCase()} ${customerData.full_name}? Inactive customers remain preserved in existing transactions.`,
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Customers"
        subtitle="Global Sales Account Masterfile"
        icon={Users}
      >
        <StatusToggle
          activeValue={showArchived}
          onToggle={setShowArchived}
          options={[
            { label: "Active", value: false },
            { label: "Archived", value: true },
          ]}
        />

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
              <StatusBadge
                label={customer.is_active ? "Active" : "Archived"}
                variant={customer.is_active ? "success" : "danger"}
                icon={customer.is_active ? UserCheck : Archive}
              />
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsDrawerOpen(true);
                  }}
                  title="View Profile"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <FileText size={16} />
                </button>

                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsModalOpen(true);
                  }}
                  title="Edit Profile"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleToggleStatus(customer)}
                  title={
                    customer.is_active ? "Archive Customer" : "Restore Customer"
                  }
                  className={`p-1.5 sm:p-2.5 rounded-xl transition-colors cursor-pointer ${
                    customer.is_active
                      ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      : "text-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                  }`}
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

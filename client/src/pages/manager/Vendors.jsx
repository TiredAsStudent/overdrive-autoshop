import React, { useState, useEffect } from "react";
import {
  Store,
  Plus,
  FileText,
  Edit2,
  Archive,
  RotateCcw,
  ShieldCheck,
  MinusCircle,
  CheckCircle,
} from "lucide-react";
import { managerVendorService } from "../../services/manager/vendor.service";
import VendorModal from "../../features/manager/components/VendorModal";
import VendorDrawer from "../../features/manager/components/VendorDrawer";

import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const Vendors = () => {
  const { showToast } = useApp();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showArchived, setShowArchived] = useState(false);
  const [vatFilter, setVatFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  const activeFilterCount = vatFilter !== "all" ? 1 : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, showArchived, vatFilter]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const statusParam = showArchived ? "inactive" : "active";
      const response = await managerVendorService.getVendors(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusParam,
        vatFilter,
        "all",
      );
      setVendors(response.data?.vendors || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [currentPage, debouncedSearchQuery, showArchived, vatFilter]);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedVendor) {
        await managerVendorService.updateVendor(selectedVendor.id, formData);
        showToast("Vendor master data updated successfully.", "success");
      } else {
        await managerVendorService.registerVendor(formData);
        showToast("New supplier registered successfully.", "success");
      }
      setIsModalOpen(false);
      loadVendors();
    } catch (error) {
      throw error;
    }
  };

  const handleToggleStatus = (vendor) => {
    const action = vendor.is_active ? "Archive" : "Restore";
    const variant = vendor.is_active ? "danger" : "info";
    setConfirmConfig({
      isOpen: true,
      title: `${action} Supplier Profile`,
      message: `Are you sure you want to ${action.toLowerCase()} ${vendor.business_name}? ${vendor.is_active ? "They will be blocked from future purchase orders." : ""}`,
      confirmText: `Yes, ${action}`,
      variant: variant,
      onConfirm: async () => {
        try {
          await managerVendorService.updateVendor(vendor.id, {
            is_active: !vendor.is_active,
          });
          showToast(
            `${vendor.business_name} ${vendor.is_active ? "archived" : "restored"} successfully.`,
            "success",
          );
          loadVendors();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  };

  const resetFilters = () => {
    setVatFilter("all");
    setIsFilterModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader title="Vendors" subtitle="Supplier Master Data" icon={Store}>
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Supplier..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={showArchived}
          onToggle={setShowArchived}
          options={[
            { label: "Active", value: false },
            { label: "Archived", value: true },
          ]}
        />

        <ActionButton
          onClick={() => {
            setSelectedVendor(null);
            setIsModalOpen(true);
          }}
          label="Register Supplier"
          icon={Plus}
        />
      </PageHeader>

      <DataTable
        headers={[
          "Supplier ID",
          "Business Identity",
          "Primary Contact",
          "Tax Status",
          "Status",
          "Actions",
        ]}
        data={vendors}
        loading={loading}
        emptyTitle={`No ${showArchived ? "archived" : "active"} suppliers found`}
        renderRow={(vendor) => (
          <tr
            key={vendor.id}
            className={`group transition-colors ${!vendor.is_active ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                {vendor.vendor_code}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1 max-w-[250px]">
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate w-full">
                  {vendor.business_name}
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate w-full">
                  {vendor.business_address || "Global Entity"}
                </p>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col gap-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="truncate max-w-[150px]">
                  {vendor.contact_person}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-500 tracking-wider">
                  {vendor.contact_number}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              {vendor.is_vat_registered ? (
                <StatusBadge
                  label="VAT Registered"
                  variant="success"
                  icon={ShieldCheck}
                />
              ) : (
                <StatusBadge
                  label="Non-VAT"
                  variant="default"
                  icon={MinusCircle}
                />
              )}
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              {vendor.is_active ? (
                <StatusBadge
                  label="Active"
                  variant="success"
                  icon={CheckCircle}
                />
              ) : (
                <StatusBadge
                  label="Archived"
                  variant="default"
                  icon={Archive}
                />
              )}
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsDrawerOpen(true);
                  }}
                  title="View Profile"
                  className="p-2.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-500/10 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-xl transition-all cursor-pointer"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsModalOpen(true);
                  }}
                  title="Edit Profile"
                  className="p-2.5 bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-500/10 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded-xl transition-all cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleToggleStatus(vendor)}
                  title={vendor.is_active ? "Archive Vendor" : "Restore Vendor"}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    vendor.is_active
                      ? "bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      : "bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {vendor.is_active ? (
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Tax Registration Status
            </label>
            <select
              value={vatFilter}
              onChange={(e) => setVatFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="vat">VAT Registered</option>
              <option value="non_vat">Non-VAT</option>
            </select>
          </div>
        </div>
      </FilterModal>

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedVendor}
      />
      <VendorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        vendor={selectedVendor}
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

export default Vendors;

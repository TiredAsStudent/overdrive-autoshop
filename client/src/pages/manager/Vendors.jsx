import React, { useState, useEffect, useCallback, useId } from "react";
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
  ChevronDown,
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

const STATUS_OPTIONS = [
  { label: "Active", value: false },
  { label: "Archived", value: true },
];

const ITEMS_PER_PAGE = 10;

const Vendors = () => {
  const { showToast } = useApp();
  const vatFilterSelectId = useId();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showArchived, setShowArchived] = useState(false);
  const [vatFilter, setVatFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleStatusToggle = (value) => {
    setShowArchived(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleVatFilterChange = (value) => {
    setVatFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const resetFilters = () => {
    setVatFilter("all");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadVendors = useCallback(async () => {
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

      const fetchedVendors = response.data?.vendors || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedVendors.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setVendors(fetchedVendors);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load supplier master directory.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, showArchived, vatFilter, showToast]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleModalSubmit = async (formData) => {
    if (selectedVendor) {
      await managerVendorService.updateVendor(selectedVendor.id, formData);
      showToast("Vendor master data updated successfully.", "success");
    } else {
      await managerVendorService.registerVendor(formData);
      showToast("New vendor registered successfully.", "success");
    }
    setIsModalOpen(false);
    loadVendors();
  };

  const handleToggleStatus = (vendor) => {
    const action = vendor.is_active ? "Archive" : "Restore";
    const variant = vendor.is_active ? "danger" : "info";
    setConfirmConfig({
      isOpen: true,
      title: `${action} Vendor Profile`,
      message: `Are you sure you want to ${action.toLowerCase()} ${vendor.business_name}? ${
        vendor.is_active
          ? "They will be blocked from future purchase orders."
          : ""
      }`,
      confirmText: `Yes, ${action}`,
      variant,
      onConfirm: async () => {
        try {
          await managerVendorService.updateVendor(vendor.id, {
            is_active: !vendor.is_active,
          });
          showToast(
            `${vendor.business_name} ${
              vendor.is_active ? "archived" : "restored"
            } successfully.`,
            "success",
          );
          loadVendors();
        } catch (error) {
          showToast(
            error.message || "Failed to update vendor status.",
            "error",
          );
        }
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader title="Vendors" subtitle="Supplier Master Data" icon={Store}>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={showArchived}
          onToggle={handleStatusToggle}
          ariaLabel="Filter vendors by active or archived status"
          options={STATUS_OPTIONS}
        />

        <ActionButton
          onClick={() => {
            setSelectedVendor(null);
            setIsModalOpen(true);
          }}
          label="Register Vendor"
          icon={Plus}
        />
      </PageHeader>

      <DataTable
        caption="Supplier Master Data and Vendor Directory"
        minWidth="min-w-[850px]"
        headers={[
          "Vendor Code",
          "Business Identity",
          "Primary Contact",
          "VAT Status",
          "Status",
          "Actions",
        ]}
        data={vendors}
        loading={loading}
        emptyTitle={`No ${showArchived ? "archived" : "active"} vendors found`}
        emptySubtitle="Try adjusting your search or tax filter criteria, or register a new supplier."
        renderRow={(vendor) => (
          <tr
            key={vendor.id}
            className={`group border-b border-slate-100 dark:border-white/5 last:border-0 ${
              !vendor.is_active
                ? "bg-slate-50/70 dark:bg-slate-900/40 opacity-75"
                : "table-row-hover"
            }`}
          >
            {/* Vendor Code */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                {vendor.vendor_code}
              </span>
            </td>

            {/* Business Identity */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col items-start gap-1 max-w-[240px] sm:max-w-[280px]">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate w-full"
                  title={vendor.business_name}
                >
                  {vendor.business_name}
                </p>
                <p
                  className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate w-full"
                  title={vendor.business_address || "Global Entity"}
                >
                  {vendor.business_address || "Global Entity"}
                </p>
              </div>
            </td>

            {/* Primary Contact */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span
                  className="truncate max-w-[160px]"
                  title={vendor.contact_person}
                >
                  {vendor.contact_person}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-amber-600 dark:text-overdrive-yellow tracking-wider">
                  {vendor.contact_number}
                </span>
              </div>
            </td>

            {/* VAT Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
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

            {/* Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
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

            {/* Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsDrawerOpen(true);
                  }}
                  title={`View Profile for ${vendor.business_name}`}
                  aria-label={`View vendor profile and ledger for ${vendor.business_name}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <FileText size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsModalOpen(true);
                  }}
                  title={`Edit ${vendor.business_name}`}
                  aria-label={`Edit vendor profile for ${vendor.business_name}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Edit2 size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(vendor)}
                  title={
                    vendor.is_active
                      ? `Archive ${vendor.business_name}`
                      : `Restore ${vendor.business_name}`
                  }
                  aria-label={
                    vendor.is_active
                      ? `Archive vendor ${vendor.business_name}`
                      : `Restore vendor ${vendor.business_name}`
                  }
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    vendor.is_active
                      ? "text-slate-400 border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20"
                      : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                  }`}
                >
                  {vendor.is_active ? (
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={vatFilterSelectId} className="form-label">
              Tax Registration Status
            </label>
            <div className="relative">
              <select
                id={vatFilterSelectId}
                value={vatFilter}
                onChange={(e) => handleVatFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="vat">VAT Registered</option>
                <option value="non_vat">Non-VAT</option>
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
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

export default Vendors;

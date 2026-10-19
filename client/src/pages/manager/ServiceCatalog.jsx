import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Plus,
  Archive,
  ShieldCheck,
  Wrench,
  RotateCcw,
  Clock,
  Edit2,
  Activity,
  ChevronDown,
} from "lucide-react";
import { serviceCatalogService } from "../../services/manager/serviceCatalog.service";
import ServiceModal from "../../features/manager/components/ServiceModal";
import ServiceUsageDrawer from "../../features/manager/components/ServiceUsageDrawer";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";

import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const CATEGORIES = [
  "all",
  "Engine",
  "Transmission",
  "Brake System",
  "Suspension",
  "Cooling System",
  "Electrical",
  "Air Conditioning",
  "Steering",
  "Preventive Maintenance",
  "Tire Services",
  "General Repair",
];

const STATUS_OPTIONS = [
  { label: "Active", value: false },
  { label: "Archived", value: true },
];

const ITEMS_PER_PAGE = 10;

const ServiceCatalog = () => {
  const { showToast } = useApp();
  const categoryFilterSelectId = useId();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [isUsageDrawerOpen, setIsUsageDrawerOpen] = useState(false);
  const [usageService, setUsageService] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  const activeFilterCount = categoryFilter !== "all" ? 1 : 0;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleStatusToggle = (value) => {
    setShowArchived(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const resetFilters = () => {
    setCategoryFilter("all");
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    setIsFilterModalOpen(false);
  };

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam = showArchived ? "archived" : "active";
      const response = await serviceCatalogService.getAllServices(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        categoryFilter,
        statusParam,
      );

      const fetchedServices = response.data || [];
      const fetchedTotalPages = response.pagination?.totalPages || 1;

      if (fetchedServices.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setServices(fetchedServices);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load master service catalog.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    categoryFilter,
    showArchived,
    showToast,
  ]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleModalSubmit = async (formData) => {
    if (selectedService) {
      await serviceCatalogService.updateService(selectedService.id, formData);
      showToast(`${formData.service_name} updated successfully.`, "success");
    } else {
      await serviceCatalogService.createService(formData);
      showToast(`${formData.service_name} created successfully.`, "success");
    }
    setIsModalOpen(false);
    loadServices();
  };

  const handleToggleStatus = (id, name, currentStatus) => {
    const action = currentStatus ? "Archive" : "Reactivate";
    const variant = currentStatus ? "danger" : "info";
    const msg = currentStatus
      ? `Are you sure you want to archive ${name}? It will be hidden from new estimates but safely retained for historical audits.`
      : `Are you sure you want to reactivate ${name}? It will immediately become available for staff billing.`;

    setConfirmConfig({
      isOpen: true,
      title: `${action} Master Service`,
      message: msg,
      confirmText: `Yes, ${action}`,
      variant,
      onConfirm: async () => {
        try {
          await serviceCatalogService.toggleServiceStatus(id, !currentStatus);
          showToast(
            `${name} ${currentStatus ? "archived" : "restored"} successfully.`,
            "success",
          );
          loadServices();
        } catch (error) {
          showToast(
            error.message || "Failed to update service status.",
            "error",
          );
        }
      },
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Service Catalog"
        subtitle="Master labor & repair dictionary"
        icon={Wrench}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search code or name..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={showArchived}
          onToggle={handleStatusToggle}
          ariaLabel="Filter services by active or archived status"
          options={STATUS_OPTIONS}
        />

        <ActionButton
          onClick={() => {
            setSelectedService(null);
            setIsModalOpen(true);
          }}
          label="Register Service"
          icon={Plus}
        />
      </PageHeader>

      {/* UNIVERSAL DATATABLE */}
      <DataTable
        caption="Master Service Catalog and Labor Pricing Directory"
        minWidth="min-w-[820px]"
        headers={[
          "Service Profile",
          "Category Code",
          "Financials",
          "Status",
          "Actions",
        ]}
        data={services}
        loading={loading}
        emptyTitle={`No ${showArchived ? "archived" : "active"} services found`}
        emptySubtitle="Try adjusting your search or category filter, or register a new master service."
        renderRow={(service) => (
          <tr
            key={service.id}
            className={`group border-b border-slate-100 dark:border-white/5 last:border-0 ${
              !service.is_active
                ? "bg-slate-50/70 dark:bg-slate-900/40 opacity-75"
                : "table-row-hover"
            }`}
          >
            {/* Service Profile */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="min-w-0 max-w-[220px] sm:max-w-[300px]">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate"
                  title={service.service_name}
                >
                  {service.service_name}
                </p>
                <p
                  className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5"
                  title={service.description || "No description provided."}
                >
                  {service.description || "No description provided."}
                </p>
              </div>
            </td>

            {/* Category Code */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col items-start">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                  {service.service_code}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mt-1.5">
                  {service.category}
                </span>
              </div>
            </td>

            {/* Financials */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-emerald-400 tracking-tight">
                  <span>₱{formatCurrency(service.price)}</span>
                  {service.is_vatable && (
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                      VAT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Clock size={12} aria-hidden="true" className="shrink-0" />
                  <span>{service.estimated_minutes} Mins Target</span>
                </div>
              </div>
            </td>

            {/* Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              {!service.is_active ? (
                <StatusBadge
                  label="Archived"
                  variant="default"
                  icon={Archive}
                />
              ) : (
                <StatusBadge
                  label="Operational"
                  variant="success"
                  icon={ShieldCheck}
                />
              )}
            </td>

            {/* Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUsageService(service);
                    setIsUsageDrawerOpen(true);
                  }}
                  title={`View Billing Activity for ${service.service_name}`}
                  aria-label={`View billing activity for ${service.service_name}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Activity size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedService(service);
                    setIsModalOpen(true);
                  }}
                  title={`Edit ${service.service_name}`}
                  aria-label={`Edit service profile for ${service.service_name}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Edit2 size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleToggleStatus(
                      service.id,
                      service.service_name,
                      service.is_active,
                    )
                  }
                  title={
                    service.is_active
                      ? `Archive ${service.service_name}`
                      : `Reactivate ${service.service_name}`
                  }
                  aria-label={
                    service.is_active
                      ? `Archive service ${service.service_name}`
                      : `Reactivate service ${service.service_name}`
                  }
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    service.is_active
                      ? "text-slate-400 border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20"
                      : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                  }`}
                >
                  {service.is_active ? (
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

      {/* UNIVERSAL FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={categoryFilterSelectId} className="form-label">
              Service Category
            </label>
            <div className="relative">
              <select
                id={categoryFilterSelectId}
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
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

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedService}
      />

      <ServiceUsageDrawer
        isOpen={isUsageDrawerOpen}
        onClose={() => setIsUsageDrawerOpen(false)}
        service={usageService}
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

export default ServiceCatalog;

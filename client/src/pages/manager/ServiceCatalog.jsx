import React, { useState, useEffect } from "react";
import {
  Plus,
  Archive,
  ShieldCheck,
  Wrench,
  RotateCcw,
  Clock,
  Edit2,
  Activity,
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

const ServiceCatalog = () => {
  const { showToast } = useApp();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, categoryFilter, showArchived]);

  const loadServices = async () => {
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
      setServices(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [currentPage, debouncedSearchQuery, categoryFilter, showArchived]);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedService) {
        await serviceCatalogService.updateService(selectedService.id, formData);
        showToast(`${formData.service_name} updated successfully.`, "success");
      } else {
        await serviceCatalogService.createService(formData);
        showToast(`${formData.service_name} created successfully.`, "success");
      }
      setIsModalOpen(false);
      loadServices();
    } catch (error) {
      throw error;
    }
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
      variant: variant,
      onConfirm: async () => {
        try {
          await serviceCatalogService.toggleServiceStatus(id, !currentStatus);
          showToast(
            `${name} ${currentStatus ? "archived" : "restored"} successfully.`,
            "success",
          );
          loadServices();
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
        title="Service Catalog"
        subtitle="Master labor & repair dictionary"
        icon={Wrench}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search code or name..."
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
            setSelectedService(null);
            setIsModalOpen(true);
          }}
          label="Register Service"
          icon={Plus}
        />
      </PageHeader>

      {/* UNIVERSAL DATATABLE */}
      <DataTable
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
        renderRow={(service) => (
          <tr
            key={service.id}
            className={`group transition-colors ${!service.is_active ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="min-w-0 max-w-[200px] sm:max-w-[300px]">
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate">
                  {service.service_name}
                </p>
                <p
                  className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5"
                  title={service.description}
                >
                  {service.description || "No description provided."}
                </p>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 tracking-[0.1em] uppercase">
                    {service.service_code}
                  </span>
                </div>
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-amber-500 mt-1.5 hidden sm:block">
                  {service.category}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900 dark:text-emerald-400 tracking-tight">
                  ₱{" "}
                  {parseFloat(service.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                  {service.is_vatable && (
                    <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded ml-1 text-slate-500 dark:text-slate-400">
                      (VAT)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Clock size={12} /> {service.estimated_minutes} Mins Target
                </div>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
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
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setUsageService(service);
                    setIsUsageDrawerOpen(true);
                  }}
                  title="View Billing Activity"
                  className="p-1.5 sm:p-2.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Activity size={14} className="sm:w-[16px] sm:h-[16px]" />
                </button>

                <button
                  onClick={() => {
                    setSelectedService(service);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                </button>

                <button
                  onClick={() =>
                    handleToggleStatus(
                      service.id,
                      service.service_name,
                      service.is_active,
                    )
                  }
                  className={`p-1.5 sm:p-2.5 rounded-xl transition-colors cursor-pointer ${service.is_active ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400"}`}
                >
                  {service.is_active ? (
                    <Archive size={14} className="sm:w-[16px] sm:h-[16px]" />
                  ) : (
                    <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px]" />
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
        onClear={() => setCategoryFilter("all")}
        title="Advanced Filters"
      >
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
          Item Category
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>
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

export default ServiceCatalog;

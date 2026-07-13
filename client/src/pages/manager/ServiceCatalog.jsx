import React, { useState, useEffect } from "react";
import {
  Plus,
  Archive,
  ShieldCheck,
  Search,
  Loader2,
  Wrench,
  RotateCcw,
  Clock,
  EyeIcon,
  Edit2,
  Filter,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { serviceCatalogService } from "../../services/manager/serviceCatalog.service";
import ServiceModal from "../../features/manager/components/ServiceModal";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
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

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

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
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Wrench className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Service Catalog
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Master labor & repair dictionary
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-[200px] flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] uppercase tracking-widest font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Filter size={14} /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-900 shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setShowArchived(false)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${!showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Archived
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedService(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Plus size={16} /> Register Service
          </button>
        </div>
      </div>

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
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  <Archive size={12} /> Archived
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <ShieldCheck size={12} /> Operational
                </span>
              )}
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
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

      {/* FILTER MODAL */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white">
                  <Filter size={16} className="text-amber-500" /> Advanced
                  Filters
                </h3>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
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
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 flex gap-3">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedService}
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

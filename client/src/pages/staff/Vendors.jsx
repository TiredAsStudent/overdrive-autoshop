import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Store,
  Plus,
  FileText,
  Edit2,
  Archive,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { vendorService } from "../../services/staff/vendor.service";
import VendorModal from "../../features/staff/components/VendorModal";
import VendorDrawer from "../../features/staff/components/VendorDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, showArchived, vatFilter]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const statusParam = showArchived ? "inactive" : "active";
      const response = await vendorService.getVendors(
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
        await vendorService.updateVendor(selectedVendor.id, formData);
        showToast("Vendor master data updated successfully.", "success");
      } else {
        await vendorService.registerVendor(formData);
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
          await vendorService.updateVendor(vendor.id, {
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Store className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Vendors
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Supplier Master Data
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* VAT Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "vat", label: "VAT Reg." },
              { id: "non_vat", label: "Non-VAT" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setVatFilter(f.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${vatFilter === f.id ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
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
              placeholder="Search Supplier..."
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
              setSelectedVendor(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} /> Register
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Supplier ID",
          "Business Identity",
          "Primary Contact",
          "Tax Status",
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
              <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black tracking-widest uppercase">
                {vendor.vendor_code}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1 max-w-[250px]">
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate w-full">
                  {vendor.business_name}
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate w-full">
                  {vendor.branch_name || "Global Entity"}
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
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                  <ShieldCheck size={12} /> VAT
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  NON-VAT
                </span>
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
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsModalOpen(true);
                  }}
                  title="Edit Profile"
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleToggleStatus(vendor)}
                  title={vendor.is_active ? "Archive Vendor" : "Restore Vendor"}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${vendor.is_active ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400"}`}
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

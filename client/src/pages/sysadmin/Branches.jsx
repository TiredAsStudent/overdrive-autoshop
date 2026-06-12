import React, { useState, useEffect } from "react";
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Search,
  Loader2,
  Building2,
  RotateCcw,
  Archive,
} from "lucide-react";
import { branchService } from "../../services/sysadmin/branch.service";
import BranchModal from "../../features/sysadmin/components/BranchModal";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const Branches = () => {
  const { showToast } = useApp();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

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

  const loadBranches = async () => {
    try {
      setLoading(true);

      const statusParam = showArchived ? "archived" : "active";

      const response = await branchService.getAllBranches(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusParam,
      );

      setBranches(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      showToast(error.message || "Unable to load branch information.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [currentPage, debouncedSearchQuery, showArchived]);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedBranch) {
        await branchService.updateBranch(selectedBranch.id, formData);
        showToast(`${formData.branch_name} updated successfully.`, "success");
      } else {
        await branchService.createBranch(formData);
        showToast(`${formData.branch_name} created successfully.`, "success");
      }
      setIsModalOpen(false);
      loadBranches();
    } catch (error) {
      throw error;
    }
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id, name) => {
    setConfirmConfig({
      isOpen: true,
      title: "Archive Branch",
      message: `Are you sure you want to archive ${name}? It will be hidden from active operations but safely retained for historical financial audits.`,
      confirmText: "Yes, Archive",
      variant: "danger",
      onConfirm: async () => {
        try {
          await branchService.deleteBranch(id);
          showToast(`${name} archived successfully.`, "success");
          loadBranches();
        } catch (error) {
          showToast(error.message || `Unable to archive ${name}.`, "error");
        }
      },
    });
  };

  const handleRestore = (id, name) => {
    setConfirmConfig({
      isOpen: true,
      title: "Restore Branch",
      message: `Are you sure you want to reactivate ${name}? It will immediately become available in the active registry for staff operations.`,
      confirmText: "Yes, Reactivate",
      variant: "info",
      onConfirm: async () => {
        try {
          await branchService.updateBranch(id, { is_active: true });
          showToast(`${name} restored successfully.`, "success");
          loadBranches();
        } catch (error) {
          showToast(error.message || `Unable to restore ${name}.`, "error");
        }
      },
    });
  };

  const handleToggleMaintenance = (id, name, currentStatus) => {
    const action = currentStatus ? "Unlock" : "Lock";
    const variant = currentStatus ? "info" : "warning";

    setConfirmConfig({
      isOpen: true,
      title: `${action} Branch Access`,
      message: `Are you sure you want to ${action.toLowerCase()} ${name}? This will immediately ${currentStatus ? "restore" : "freeze"} staff access to the system for this location.`,
      confirmText: `Yes, ${action}`,
      variant: variant,
      onConfirm: async () => {
        try {
          await branchService.toggleMaintenance(id, !currentStatus);

          if (!currentStatus) {
            showToast(`${name} is now in maintenance mode.`, "warning");
          } else {
            showToast(`${name} is now active.`, "success");
          }

          loadBranches();
        } catch (error) {
          showToast(
            error.message || "Unable to update maintenance status.",
            "error",
          );
        }
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        {/* Header Title Section */}
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Database className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Branch Registry
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Centralized branch records
            </p>
          </div>
        </div>

        {/* Filter & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-xs lg:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

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
            onClick={handleCreate}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Plus size={16} /> Register Branch
          </button>
        </div>
      </div>

      {/* UNIVERSAL DATATABLE */}
      <DataTable
        headers={["Branch Details", "Branch Code", "Status", "Actions"]}
        data={branches}
        loading={loading}
        emptyTitle={`No ${showArchived ? "archived" : "active"} locations found`}
        emptySubtitle="Try adjusting your search query or register a new branch."
        renderRow={(branch) => (
          <tr
            key={branch.id}
            className={`group transition-colors ${
              !branch.is_active
                ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale"
                : branch.is_maintenance_mode
                  ? "bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/50"
                  : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
            }`}
          >
            {/* Branch Details */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 ${branch.is_active ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
                >
                  <Building2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="min-w-0 max-w-[150px] sm:max-w-[250px]">
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate">
                    {branch.branch_name}
                  </p>
                  <p
                    className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5"
                    title={branch.address}
                  >
                    {branch.address || "Missing official address"}
                  </p>
                </div>
              </div>
            </td>

            {/* Branch Code / System Identifier Badge */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                  <span className="text-[10px] sm:text-xs font-black text-amber-700 dark:text-amber-400 tracking-[0.2em] uppercase">
                    {branch.branch_code}
                  </span>
                </div>
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5 hidden sm:block">
                  Reference
                </span>
              </div>
            </td>

            {/* Security Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              {!branch.is_active ? (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  <Archive size={12} className="sm:w-[14px] sm:h-[14px]" />{" "}
                  Archived
                </span>
              ) : branch.is_maintenance_mode ? (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                  <ShieldAlert size={12} className="sm:w-[14px] sm:h-[14px]" />{" "}
                  Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <ShieldCheck size={12} className="sm:w-[14px] sm:h-[14px]" />{" "}
                  Operational
                </span>
              )}
            </td>

            {/* Governance Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                {!branch.is_active ? (
                  <button
                    onClick={() => handleRestore(branch.id, branch.branch_name)}
                    title="Restore Registry"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                  >
                    <RotateCcw size={12} className="sm:w-[14px] sm:h-[14px]" />{" "}
                    Restore
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleToggleMaintenance(
                          branch.id,
                          branch.branch_name,
                          branch.is_maintenance_mode,
                        )
                      }
                      title={
                        branch.is_maintenance_mode
                          ? "Unlock Branch"
                          : "Lock for Maintenance"
                      }
                      className={`p-1.5 sm:p-2.5 rounded-xl transition-colors cursor-pointer ${branch.is_maintenance_mode ? "text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20" : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10"}`}
                    >
                      {branch.is_maintenance_mode ? (
                        <ShieldCheck
                          size={14}
                          className="sm:w-[16px] sm:h-[16px]"
                        />
                      ) : (
                        <ShieldAlert
                          size={14}
                          className="sm:w-[16px] sm:h-[16px]"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(branch)}
                      title="Edit Location Profile"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(branch.id, branch.branch_name)
                      }
                      title="Archive Registry"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* PAGINATION BAR */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* MODALS */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedBranch}
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

export default Branches;

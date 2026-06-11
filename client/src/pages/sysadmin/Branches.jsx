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

import { useDebounce } from "../../hooks/useDebounce";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search State & Debounce Initialization
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [showArchived, setShowArchived] = useState(false);

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

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchService.getAllBranches();
      const dataArray =
        response?.data?.data || response?.data || response || [];
      setBranches(Array.isArray(dataArray) ? dataArray : []);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      alert(error.message || "Failed to load branch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedBranch) {
        await branchService.updateBranch(selectedBranch.id, formData);
      } else {
        await branchService.createBranch(formData);
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
          loadBranches();
        } catch (error) {
          alert(error.message || "Failed to archive branch.");
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
          loadBranches();
        } catch (error) {
          alert(error.message || "Failed to restore branch.");
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
          loadBranches();
        } catch (error) {
          alert(error.message || "Failed to toggle mode.");
        }
      },
    });
  };

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.branch_name
        .toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase()) ||
      b.branch_code.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

    const matchesStatus = showArchived ? !b.is_active : b.is_active;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 relative pb-10">
      {/* ACTION BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full xl:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Database className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Branch Registry
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Centralized branch records and operational details
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
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

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setShowArchived(false)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${!showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Archived
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Plus size={16} /> Register Branch
          </button>
        </div>
      </div>

      {/* MASTER REGISTRY TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Syncing Locations...
            </span>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 sm:px-8 py-5">Branch Details</th>
                <th className="px-6 sm:px-8 py-5">Branch Code</th>
                <th className="px-6 sm:px-8 py-5">Status</th>
                <th className="px-6 sm:px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredBranches.map((branch) => (
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
                  <td className="px-6 sm:px-8 py-5 sm:py-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 ${branch.is_active ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
                      >
                        <Building2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate">
                          {branch.branch_name}
                        </p>
                        <p
                          className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-[300px] mt-0.5"
                          title={branch.address}
                        >
                          {branch.address || "Missing official address"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Branch Code */}
                  <td className="px-6 sm:px-8 py-5 sm:py-6">
                    <div className="flex flex-col items-start">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400 tracking-[0.2em] uppercase">
                          {branch.branch_code}
                        </span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5">
                        Branch Reference
                      </span>
                    </div>
                  </td>

                  {/* Security Status */}
                  <td className="px-6 sm:px-8 py-5 sm:py-6">
                    {!branch.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        <Archive size={14} /> Archived
                      </span>
                    ) : branch.is_maintenance_mode ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                        <ShieldAlert size={14} /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <ShieldCheck size={14} /> Operational
                      </span>
                    )}
                  </td>

                  {/* Governance Actions */}
                  <td className="px-6 sm:px-8 py-5 sm:py-6 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      {!branch.is_active ? (
                        <button
                          onClick={() =>
                            handleRestore(branch.id, branch.branch_name)
                          }
                          title="Restore Registry"
                          className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw size={14} /> Restore
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
                            className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer ${branch.is_maintenance_mode ? "text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-white/10"}`}
                          >
                            {branch.is_maintenance_mode ? (
                              <ShieldCheck size={16} />
                            ) : (
                              <ShieldAlert size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(branch)}
                            title="Edit Location Profile"
                            className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(branch.id, branch.branch_name)
                            }
                            title="Archive Registry"
                            className="p-2 sm:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBranches.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-8 py-16 text-center">
                    <div className="inline-flex flex-col items-center justify-center text-slate-400">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3">
                        <Search size={32} className="opacity-40" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        No {showArchived ? "archived" : "active"} locations
                        found
                      </p>
                      <p className="text-xs font-medium mt-1.5 opacity-70">
                        Try adjusting your search query or register a new
                        branch.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

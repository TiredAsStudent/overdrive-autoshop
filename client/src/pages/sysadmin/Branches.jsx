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
import { branchApi } from "../../services/sysadmin/branchServices";
import BranchModal from "../../features/sysadmin/components/BranchModal";
import ConfirmModal from "../../components/shared/ConfirmModal";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false); // Controls the Active/Archived view

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
      const response = await branchApi.getAllBranches();
      setBranches(response.data);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      alert("Failed to load branch data.");
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
        await branchApi.updateBranch(selectedBranch.id, formData);
      } else {
        await branchApi.createBranch(formData);
      }
      setIsModalOpen(false);
      loadBranches();
    } catch (error) {
      alert(
        error.response?.data?.error?.message ||
          "An error occurred saving the branch.",
      );
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
      message: `Are you sure you want to archive ${name}? It will be hidden from operations but retained for financial audits.`,
      confirmText: "Yes, Archive",
      variant: "danger",
      onConfirm: async () => {
        try {
          await branchApi.deleteBranch(id);
          loadBranches();
        } catch (error) {
          alert(
            error.response?.data?.error?.message || "Failed to archive branch.",
          );
        }
      },
    });
  };

  const handleRestore = (id, name) => {
    setConfirmConfig({
      isOpen: true,
      title: "Restore Branch",
      message: `Are you sure you want to reactivate ${name}? It will immediately become available in the active registry.`,
      confirmText: "Yes, Reactivate",
      variant: "info",
      onConfirm: async () => {
        try {
          await branchApi.updateBranch(id, { is_active: true });
          loadBranches();
        } catch (error) {
          alert(
            error.response?.data?.error?.message || "Failed to restore branch.",
          );
        }
      },
    });
  };

  const handleToggleMaintenance = (id, name, currentStatus) => {
    const action = currentStatus ? "Unlock" : "Lock";
    const variant = currentStatus ? "info" : "warning";

    setConfirmConfig({
      isOpen: true,
      title: `${action} Branch`,
      message: `Are you sure you want to ${action.toLowerCase()} ${name}? This will immediately affect staff access.`,
      confirmText: `Yes, ${action}`,
      variant: variant,
      onConfirm: async () => {
        try {
          await branchApi.toggleMaintenance(id, !currentStatus);
          loadBranches();
        } catch (error) {
          alert(
            error.response?.data?.error?.message || "Failed to toggle mode.",
          );
        }
      },
    });
  };

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branch_code.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by Active or Archived based on the toggle state
    const matchesStatus = showArchived ? !b.is_active : b.is_active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative pb-10">
      {/* 1. TOP ACTION BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Database
              className="text-amber-600 dark:text-overdrive-yellow"
              size={24}
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Branch Management
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Physical Footprint & Legal Profiles
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Active / Archived Toggle */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
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
            onClick={handleCreate}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors whitespace-nowrap w-full sm:w-auto"
          >
            <Plus size={16} /> Add Branch
          </button>
        </div>
      </div>

      {/* 2. THE MASTER REGISTRY TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Syncing Locations...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Branch Details</th>
                <th className="px-8 py-5">Invoice Logic</th>
                <th className="px-8 py-5">Security Status</th>
                <th className="px-8 py-5 text-right">Governance</th>
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
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${branch.is_active ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
                      >
                        <Building2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase flex items-center gap-2">
                          {branch.branch_name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-0.5">
                          {branch.address || "No official address set"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                      INV-{branch.branch_code}-XXXX
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {!branch.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-tighter bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        <Archive size={12} /> Archived
                      </span>
                    ) : branch.is_maintenance_mode ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-tighter bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <ShieldAlert size={12} /> Maintenance Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <ShieldCheck size={12} /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* ARCHIVED STATE ACTIONS */}
                      {!branch.is_active ? (
                        <button
                          onClick={() =>
                            handleRestore(branch.id, branch.branch_name)
                          }
                          title="Restore Registry"
                          className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                      ) : (
                        /* ACTIVE STATE ACTIONS */
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
                            className={`p-2 rounded-lg transition-colors ${branch.is_maintenance_mode ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-white/5"}`}
                          >
                            {branch.is_maintenance_mode ? (
                              <ShieldCheck size={16} />
                            ) : (
                              <ShieldAlert size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(branch)}
                            title="Edit Legal Profile"
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(branch.id, branch.branch_name)
                            }
                            title="Archive Registry"
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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
                  <td colSpan="4" className="px-8 py-12 text-center">
                    <div className="inline-flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-bold">
                        No {showArchived ? "archived" : "active"} locations
                        found.
                      </p>
                      <p className="text-xs mt-1">
                        Try adjusting your search or register a new branch.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}
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

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  ShieldAlert,
  ShieldCheck,
  Building2,
  RotateCcw,
  Archive,
} from "lucide-react";
import { branchService } from "../../services/sysadmin/branch.service";
import BranchModal from "../../features/sysadmin/components/BranchModal";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

// Universal UI Components
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ITEMS_PER_PAGE = 5;

const Branches = () => {
  const { showToast } = useApp();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleToggleArchived = (value) => {
    setShowArchived(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);

      const statusParam = showArchived ? "archived" : "active";

      const response = await branchService.getAllBranches(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusParam,
      );

      const fetchedBranches = response.data || [];
      const fetchedTotalPages = response.pagination?.totalPages || 1;

      if (fetchedBranches.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setBranches(fetchedBranches);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      showToast(error.message || "Unable to load branch information.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, showArchived, showToast]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleModalSubmit = async (formData) => {
    if (selectedBranch) {
      await branchService.updateBranch(selectedBranch.id, formData);
      showToast(`${formData.branch_name} updated successfully.`, "success");
    } else {
      await branchService.createBranch(formData);
      showToast(`${formData.branch_name} created successfully.`, "success");
    }
    setIsModalOpen(false);
    loadBranches();
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
      message: `Are you sure you want to ${action.toLowerCase()} ${name}? This will immediately ${
        currentStatus ? "restore" : "freeze"
      } staff access to the system for this location.`,
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Branch Registry"
        subtitle="Centralized branch records"
        icon={Building2}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search branches..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <StatusToggle
          activeValue={showArchived}
          onToggle={handleToggleArchived}
          ariaLabel="Filter branches by active or archived status"
          options={[
            { label: "Active", value: false },
            { label: "Archived", value: true },
          ]}
        />

        <ActionButton
          onClick={handleCreate}
          label="Register Branch"
          icon={Plus}
        />
      </PageHeader>

      {/* UNIVERSAL DATATABLE */}
      <DataTable
        caption="Branch Registry Records"
        headers={["Branch Details", "Branch Code", "Status", "Actions"]}
        data={branches}
        loading={loading}
        minWidth="min-w-[680px]"
        emptyTitle={`No ${showArchived ? "archived" : "active"} locations found`}
        emptySubtitle="Try adjusting your search query or register a new branch."
        renderRow={(branch) => (
          <tr
            key={branch.id}
            className={`group border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors ${
              !branch.is_active
                ? "bg-slate-50/70 dark:bg-slate-900/40"
                : branch.is_maintenance_mode
                  ? "bg-red-50/30 dark:bg-red-500/5 hover:bg-red-50/60 dark:hover:bg-red-500/10"
                  : "table-row-hover"
            }`}
          >
            {/* Branch Details */}
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div
                className={`flex items-center gap-3 sm:gap-4 ${
                  !branch.is_active ? "opacity-75" : ""
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 border ${
                    branch.is_active
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-overdrive-yellow"
                      : "bg-slate-200/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Building2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="min-w-0 max-w-[160px] sm:max-w-[260px] lg:max-w-[340px]">
                  <p
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate"
                    title={branch.branch_name}
                  >
                    {branch.branch_name}
                  </p>
                  <p
                    className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5"
                    title={branch.address || "Missing official address"}
                  >
                    {branch.address || "Missing official address"}
                  </p>
                </div>
              </div>
            </td>

            {/* Branch Code / System Identifier Badge */}
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div
                className={`flex flex-col items-start ${
                  !branch.is_active ? "opacity-75" : ""
                }`}
              >
                <div className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20">
                  <span className="text-[10px] sm:text-xs font-mono tabular-nums font-black text-amber-700 dark:text-overdrive-yellow tracking-widest uppercase">
                    {branch.branch_code}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1 hidden sm:block">
                  Reference
                </span>
              </div>
            </td>

            {/* Security Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              {!branch.is_active ? (
                <StatusBadge
                  label="Archived"
                  variant="default"
                  icon={Archive}
                />
              ) : branch.is_maintenance_mode ? (
                <StatusBadge
                  label="Locked"
                  variant="danger"
                  icon={ShieldAlert}
                />
              ) : (
                <StatusBadge
                  label="Operational"
                  variant="success"
                  icon={ShieldCheck}
                />
              )}
            </td>

            {/* Governance Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                {!branch.is_active ? (
                  <button
                    type="button"
                    onClick={() => handleRestore(branch.id, branch.branch_name)}
                    title={`Restore ${branch.branch_name}`}
                    aria-label={`Restore ${branch.branch_name}`}
                    className="px-3.5 sm:px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 border border-blue-200/80 dark:border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw
                      size={14}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                    <span>Restore</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleMaintenance(
                          branch.id,
                          branch.branch_name,
                          branch.is_maintenance_mode,
                        )
                      }
                      title={
                        branch.is_maintenance_mode
                          ? `Unlock ${branch.branch_name}`
                          : `Lock ${branch.branch_name} for Maintenance`
                      }
                      aria-label={
                        branch.is_maintenance_mode
                          ? `Unlock ${branch.branch_name}`
                          : `Lock ${branch.branch_name} for maintenance`
                      }
                      className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                        branch.is_maintenance_mode
                          ? "text-amber-700 dark:text-overdrive-yellow bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:hover:bg-amber-500/20"
                          : "text-slate-400 border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20"
                      }`}
                    >
                      {branch.is_maintenance_mode ? (
                        <ShieldCheck size={16} aria-hidden="true" />
                      ) : (
                        <ShieldAlert size={16} aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(branch)}
                      title={`Edit ${branch.branch_name}`}
                      aria-label={`Edit ${branch.branch_name}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(branch.id, branch.branch_name)
                      }
                      title={`Archive ${branch.branch_name}`}
                      aria-label={`Archive ${branch.branch_name}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200/60 dark:hover:border-red-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <Archive size={16} aria-hidden="true" />
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

export default Branches;

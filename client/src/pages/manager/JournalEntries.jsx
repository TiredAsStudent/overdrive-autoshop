import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  FileText,
  Lock,
} from "lucide-react";
import { journalEntryService } from "../../services/manager/journalEntry.service";
import { inventoryService } from "../../services/manager/inventory.service";

import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import FilterModal from "../../components/shared/FilterModal";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmModal from "../../components/shared/ConfirmModal";

import JournalEntryModal from "../../features/manager/components/JournalEntryModal";
import JournalEntryDrawer from "../../features/manager/components/JournalEntryDrawer";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const JournalEntries = () => {
  const { showToast } = useApp();

  const [entries, setEntries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // View States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [editDraftData, setEditDraftData] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, branchFilter, startDate, endDate]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await journalEntryService.getJournalEntries(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        branchFilter,
        startDate,
        endDate,
      );
      setEntries(res.data?.entries || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [
    currentPage,
    debouncedSearchQuery,
    statusFilter,
    branchFilter,
    startDate,
    endDate,
  ]);

  const handleOpenDrawer = (id) => {
    setSelectedEntryId(id);
    setIsDrawerOpen(true);
  };

  const handleEditDraft = async (id) => {
    try {
      setLoading(true);
      const res = await journalEntryService.getJournalDetails(id);
      setEditDraftData(res.data);
      setIsModalOpen(true);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = (id, journalNumber) => {
    setConfirmConfig({
      isOpen: true,
      title: "Discard Draft",
      message: `Are you sure you want to delete draft ${journalNumber}? This cannot be undone.`,
      confirmText: "Discard Draft",
      onConfirm: async () => {
        try {
          await journalEntryService.deleteDraft(id);
          showToast("Draft successfully discarded.", "success");
          loadEntries();
        } catch (err) {
          showToast(err.message, "error");
        }
      },
    });
  };

  const handleModalSubmit = async (payload) => {
    try {
      const res = await journalEntryService.saveJournalEntry(payload);
      const isPosted = res.data?.status === "POSTED";
      showToast(
        isPosted
          ? "Journal Entry posted to General Ledger."
          : "Draft saved successfully.",
        "success",
      );
      setIsModalOpen(false);
      loadEntries();
    } catch (error) {
      throw error; // Rethrow to modal to handle validation error state
    }
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setStartDate("");
    setEndDate("");
    setIsFilterModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Journal Entries"
        subtitle="Manual Adjustments & Closing Postings"
        icon={BookOpen}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search JRN No. or Memo..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={[
            { label: "All", value: "all" },
            { label: "Drafts", value: "DRAFT" },
            { label: "Posted", value: "POSTED" },
          ]}
        />

        <ActionButton
          label="New Entry"
          icon={Plus}
          onClick={() => {
            setEditDraftData(null);
            setIsModalOpen(true);
          }}
        />
      </PageHeader>

      <DataTable
        headers={[
          "Journal No.",
          "Date & Reference",
          "Description / Memo",
          "Branch Allocation",
          "Total Amount",
          "Status",
          "Actions",
        ]}
        data={entries}
        loading={loading}
        emptyTitle="No Journal Entries Found"
        emptySubtitle="Try adjusting filters or create a new manual adjustment."
        renderRow={(entry) => (
          <tr
            key={entry.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                {entry.journal_number}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {entry.entry_date}
              </p>
              {entry.reference_number && (
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  REF: {entry.reference_number}
                </p>
              )}
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic truncate max-w-[250px]">
                "{entry.description}"
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {entry.branch_name || "Enterprise Global"}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                ₱
                {parseFloat(entry.total_amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <StatusBadge
                label={entry.status}
                variant={entry.status === "POSTED" ? "success" : "warning"}
                icon={entry.status === "POSTED" ? ShieldCheck : FileText}
              />
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1.5">
                {entry.status === "POSTED" ? (
                  <button
                    onClick={() => handleOpenDrawer(entry.id)}
                    title="View Voucher"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <Eye size={14} /> View
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditDraft(entry.id)}
                      title="Edit Draft"
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteDraft(entry.id, entry.journal_number)
                      }
                      title="Discard Draft"
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
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
              Branch Location
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Locations</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </FilterModal>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant="danger"
      />

      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editDraftData}
      />

      <JournalEntryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        journalId={selectedEntryId}
      />
    </div>
  );
};

export default JournalEntries;

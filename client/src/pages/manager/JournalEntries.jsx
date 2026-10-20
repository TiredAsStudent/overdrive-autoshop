import React, { useState, useEffect, useCallback, useId } from "react";
import {
  BookOpen,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  FileText,
  ChevronDown,
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

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Posted", value: "POSTED" },
];

const ITEMS_PER_PAGE = 10;

const JournalEntries = () => {
  const { showToast } = useApp();

  // Accessible Filter Control IDs
  const branchFilterSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleStatusFilterToggle = (value) => {
    setStatusFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleBranchFilterChange = (value) => {
    setBranchFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleDateFilterChange = (field, value) => {
    if (field === "start") {
      setStartDate(value);
      if (value && endDate && value > endDate) {
        setEndDate(value);
      }
    } else if (field === "end") {
      setEndDate(value);
      if (value && startDate && value < startDate) {
        setStartDate(value);
      }
    }
    if (currentPage !== 1) setCurrentPage(1);
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setStartDate("");
    setEndDate("");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadEntries = useCallback(async () => {
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

      const fetchedEntries = res.data?.entries || [];
      const fetchedTotalPages = res.data?.pagination?.totalPages || 1;

      if (fetchedEntries.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setEntries(fetchedEntries);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load general ledger journal entries.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    statusFilter,
    branchFilter,
    startDate,
    endDate,
    showToast,
  ]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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
      showToast(
        error.message || "Failed to load journal draft details.",
        "error",
      );
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
          showToast(err.message || "Failed to discard draft.", "error");
        }
      },
    });
  };

  const handleModalSubmit = async (payload) => {
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
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = String(dateString).split("T")[0].split("-");
    if (year && month && day) {
      const localDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      );
      if (!isNaN(localDate.getTime())) {
        return localDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
      }
    }
    const fallback = new Date(dateString);
    return isNaN(fallback.getTime())
      ? String(dateString)
      : fallback.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
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
      <PageHeader
        title="Journal Entries"
        subtitle="Manual Adjustments & Closing Postings"
        icon={BookOpen}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search JRN No. or Memo..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusFilterToggle}
          ariaLabel="Filter journal entries by posting status"
          options={STATUS_OPTIONS}
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
        caption="General Ledger Manual Journal Entries and Adjustments"
        minWidth="min-w-[880px]"
        headers={[
          "Journal No.",
          "Journal Date & Ref",
          "Description",
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
            className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
          >
            {/* Journal No. */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                {entry.journal_number}
              </span>
            </td>

            {/* Journal Date & Ref */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {formatDate(entry.entry_date)}
              </p>
              {entry.reference_number && (
                <p
                  className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[160px]"
                  title={`REF: ${entry.reference_number}`}
                >
                  REF: {entry.reference_number}
                </p>
              )}
            </td>

            {/* Description */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <p
                className="text-xs font-medium text-slate-600 dark:text-slate-300 italic truncate max-w-[240px] sm:max-w-[280px]"
                title={entry.description}
              >
                "{entry.description}"
              </p>
            </td>

            {/* Branch Allocation */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {entry.branch_name || "Enterprise Global"}
              </span>
            </td>

            {/* Total Amount */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums">
                ₱{formatCurrency(entry.total_amount)}
              </span>
            </td>

            {/* Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <StatusBadge
                label={entry.status}
                variant={entry.status === "POSTED" ? "success" : "warning"}
                icon={entry.status === "POSTED" ? ShieldCheck : FileText}
              />
            </td>

            {/* Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                {entry.status === "POSTED" ? (
                  <button
                    type="button"
                    onClick={() => handleOpenDrawer(entry.id)}
                    title={`View Voucher ${entry.journal_number}`}
                    aria-label={`View posted journal voucher ${entry.journal_number}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                  >
                    <Eye size={14} aria-hidden="true" />
                    <span>View</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditDraft(entry.id)}
                      title={`Edit Draft ${entry.journal_number}`}
                      aria-label={`Edit journal draft ${entry.journal_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteDraft(entry.id, entry.journal_number)
                      }
                      title={`Discard Draft ${entry.journal_number}`}
                      aria-label={`Discard journal draft ${entry.journal_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <Trash2 size={16} aria-hidden="true" />
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
            <label htmlFor={branchFilterSelectId} className="form-label">
              Branch Location
            </label>
            <div className="relative">
              <select
                id={branchFilterSelectId}
                value={branchFilter}
                onChange={(e) => handleBranchFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Locations</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
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

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <div>
              <label htmlFor={startDateInputId} className="form-label">
                Start Date
              </label>
              <input
                id={startDateInputId}
                type="date"
                max={endDate || undefined}
                value={startDate}
                onChange={(e) =>
                  handleDateFilterChange("start", e.target.value)
                }
                className="form-input font-mono tabular-nums cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor={endDateInputId} className="form-label">
                End Date
              </label>
              <input
                id={endDateInputId}
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => handleDateFilterChange("end", e.target.value)}
                className="form-input font-mono tabular-nums cursor-pointer"
              />
            </div>
          </div>
        </div>
      </FilterModal>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
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

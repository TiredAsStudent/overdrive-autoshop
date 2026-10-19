import React, { useState, useEffect, useCallback, useId } from "react";
import { History, FileSearch, FileText, ChevronDown } from "lucide-react";
import { receiptService } from "../../services/staff/receipt.service";
import { vendorService } from "../../services/staff/vendor.service";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import StatusBadge from "../../components/ui/StatusBadge";
import ReceiptHistoryDrawer from "../../features/staff/components/ReceiptHistoryDrawer";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ITEMS_PER_PAGE = 10;

const ReceiptHistory = () => {
  const { showToast } = useApp();

  // Accessible Filter IDs
  const startDateInputId = useId();
  const endDateInputId = useId();
  const vendorSelectId = useId();

  const [records, setRecords] = useState([]);
  const [vendorList, setVendorList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState(null);

  const activeFilterCount =
    (startDate ? 1 : 0) + (endDate ? 1 : 0) + (vendorFilter !== "all" ? 1 : 0);

  useEffect(() => {
    vendorService
      .getActiveLookup()
      .then((res) => setVendorList(res.data || []))
      .catch((err) => console.error("Failed to load vendors", err));
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);
    if (value && endDate && value > endDate) {
      setEndDate(value);
    }
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    if (value && startDate && value < startDate) {
      setStartDate(value);
    }
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleVendorFilterChange = (value) => {
    setVendorFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await receiptService.getReceiptHistory(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        vendorFilter,
        startDate,
        endDate,
      );

      const fetchedRecords = response.data?.historyRecords || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedRecords.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setRecords(fetchedRecords);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load archived receipt history.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    vendorFilter,
    startDate,
    endDate,
    showToast,
  ]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setVendorFilter("all");
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    setIsFilterModalOpen(false);
  };

  const openDrawer = (id) => {
    setSelectedScanId(id);
    setIsDrawerOpen(true);
  };

  const getConfidenceVariant = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85) return "success";
    if (num >= 60) return "warning";
    return "danger";
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "--";
    const datePart = String(dateString).split("T")[0];
    const [year, month, day] = datePart.split("-");
    if (year && month && day) {
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return String(dateString);
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
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
        title="Receipt History"
        subtitle="Verified Documents & Audit Trail"
        icon={History}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Ref, Vendor, File..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Verified Receipt Scans and Audit Trail Registry"
        minWidth="min-w-[860px]"
        headers={[
          "Ledger Linkage & File",
          "Date Records",
          "Vendor Identity",
          "Grand Total",
          "AI Accuracy",
          "Actions",
        ]}
        data={records}
        loading={loading}
        emptyTitle="No Archived Receipts Found"
        emptySubtitle="Adjust your search filters or scan new receipts to populate this history."
        renderRow={(record) => (
          <tr
            key={record.id}
            className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
          >
            {/* Ledger Linkage & File */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-mono tabular-nums font-black tracking-widest uppercase bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {record.expense_number}
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 truncate max-w-[180px] sm:max-w-[230px]"
                    title={record.original_filename}
                  >
                    <FileText
                      size={12}
                      aria-hidden="true"
                      className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                    />
                    <span>FILE:</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200 truncate">
                      {record.original_filename}
                    </span>
                  </span>
                </div>
              </div>
            </td>

            {/* Date Records */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Rcpt:{" "}
                  <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200 ml-1">
                    {formatCalendarDate(record.expense_date)}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Vrfy:{" "}
                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 ml-1">
                    {formatCalendarDate(record.verification_date)}
                  </span>
                </span>
              </div>
            </td>

            {/* Vendor Identity */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate"
                  title={record.vendor_name || "Unregistered Vendor"}
                >
                  {record.vendor_name || "Unregistered Vendor"}
                </p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                  Supplier Entity
                </p>
              </div>
            </td>

            {/* Grand Total */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
                ₱{formatCurrency(record.grand_total)}
              </span>
            </td>

            {/* AI Accuracy */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
              <StatusBadge
                label={`${record.confidence_score ?? 0}%`}
                variant={getConfidenceVariant(record.confidence_score)}
                className="font-mono tabular-nums"
              />
            </td>

            {/* Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer(record.id)}
                  title={`View ${record.expense_number} Archive Details`}
                  aria-label={`View archive details for ${record.expense_number || record.original_filename}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center"
                >
                  <FileSearch size={16} aria-hidden="true" />
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
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div>
              <label htmlFor={startDateInputId} className="form-label">
                Start Date
              </label>
              <input
                id={startDateInputId}
                type="date"
                max={endDate || undefined}
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
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
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="form-input font-mono tabular-nums cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label htmlFor={vendorSelectId} className="form-label">
              Select Vendor
            </label>
            <div className="relative">
              <select
                id={vendorSelectId}
                value={vendorFilter}
                onChange={(e) => handleVendorFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Vendors</option>
                {vendorList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.business_name}
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

      <ReceiptHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scanId={selectedScanId}
      />
    </div>
  );
};

export default ReceiptHistory;

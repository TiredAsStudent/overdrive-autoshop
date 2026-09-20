import React, { useState, useEffect } from "react";
import { History, FileSearch } from "lucide-react";
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

const ReceiptHistory = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, startDate, endDate, vendorFilter]);

  const loadHistory = async () => {
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
      setRecords(response.data?.historyRecords || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentPage, debouncedSearchQuery, startDate, endDate, vendorFilter]);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setVendorFilter("all");
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Receipt History"
        subtitle="Verified Documents & Audit Trail"
        icon={History}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        headers={[
          "Receipt / Vendor",
          "Date Records",
          "Ledger Linkage",
          "Grand Total",
          "AI Confidence",
          "Action",
        ]}
        data={records}
        loading={loading}
        emptyTitle="No Archived Receipts Found"
        emptySubtitle="Adjust your search filters or scan new receipts to populate this history."
        renderRow={(record) => (
          <tr
            key={record.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1 max-w-[200px] sm:max-w-[250px]">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate w-full uppercase italic">
                  {record.vendor_name || "N/A"}
                </span>
                <span className="text-[9px] font-bold text-slate-500 tracking-widest truncate w-full uppercase">
                  FILE: {record.original_filename}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Rcpt:{" "}
                  <span className="text-slate-700 dark:text-slate-300 ml-1">
                    {new Date(record.expense_date).toLocaleDateString()}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Vrfy:{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    {new Date(record.verification_date).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span className="inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
                {record.expense_number}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                ₱
                {parseFloat(record.grand_total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <StatusBadge
                label={`${record.confidence_score}%`}
                variant={getConfidenceVariant(record.confidence_score)}
              />
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <button
                onClick={() => openDrawer(record.id)}
                title="View Document Details"
                className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                <FileSearch size={16} />
              </button>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
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
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Select Vendor
            </label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Vendors</option>
              {vendorList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name}
                </option>
              ))}
            </select>
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

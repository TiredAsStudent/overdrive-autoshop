import React, { useState, useEffect } from "react";
import { Search, Loader2, History, Calendar, FileSearch } from "lucide-react";
import { receiptService } from "../../services/staff/receipt.service";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ReceiptHistoryDrawer from "../../features/staff/components/ReceiptHistoryDrawer";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ReceiptHistory = () => {
  const { showToast } = useApp();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, startDate, endDate]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await receiptService.getReceiptHistory(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        "all",
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
  }, [currentPage, debouncedSearchQuery, startDate, endDate]);

  const openDrawer = (id) => {
    setSelectedScanId(id);
    setIsDrawerOpen(true);
  };

  const getConfidenceBadge = (score) => {
    const num = parseFloat(score);
    if (num >= 85)
      return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (num >= 60)
      return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20";
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <History className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Receipt History
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Verified Documents & Audit Trail
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Date Filters */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-36">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                title="Start Date"
              />
            </div>
            <span className="text-slate-300 dark:text-slate-600 px-1 font-bold">
              -
            </span>
            <div className="relative flex-1 sm:w-36">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                title="End Date"
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search Ref, Vendor, File..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Receipt / Vendor",
          "Verification Date",
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
                <span className="text-[9px] font-bold text-slate-500 tracking-widest truncate w-full">
                  FILE: {record.original_filename}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {new Date(record.verification_date).toLocaleDateString()}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(record.verification_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black tracking-widest border ${getConfidenceBadge(record.confidence_score)}`}
              >
                {record.confidence_score}%
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <button
                onClick={() => openDrawer(record.id)}
                title="View Document Details"
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
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

      <ReceiptHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scanId={selectedScanId}
      />
    </div>
  );
};

export default ReceiptHistory;

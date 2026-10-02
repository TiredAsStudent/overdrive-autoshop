import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Eye,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Search,
} from "lucide-react";

// Services
import { generalLedgerService } from "../../services/manager/generalLedger.service";
import { chartOfAccountsService } from "../../services/manager/chartOfAccounts.service";
import { inventoryService } from "../../services/manager/inventory.service";

// Shared Components
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import FilterModal from "../../components/shared/FilterModal";

// UI Components
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import ActionButton from "../../components/ui/ActionButton";
import StatCard from "../../components/ui/StatCard";

import GeneralLedgerSourceDrawer from "../../features/manager/components/GeneralLedgerSourceDrawer";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const AccountSearchableSelect = ({ value, accounts, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const selected = accounts.find(
        (a) => a.id.toString() === value.toString(),
      );
      if (selected)
        setSearchTerm(`${selected.account_code} - ${selected.account_name}`);
    } else {
      setSearchTerm("");
    }
  }, [value, accounts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        const selected = accounts.find(
          (a) => a.id.toString() === value?.toString(),
        );
        setSearchTerm(
          selected ? `${selected.account_code} - ${selected.account_name}` : "",
        );
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, accounts]);

  const filteredAccounts = accounts.filter(
    (a) =>
      a.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.account_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const grouped = {
    ASSET: [],
    LIABILITY: [],
    EQUITY: [],
    INCOME: [],
    EXPENSE: [],
  };
  filteredAccounts.forEach((acc) => {
    if (grouped[acc.account_type]) {
      grouped[acc.account_type].push(acc);
    }
  });

  return (
    <div ref={wrapperRef} className="relative z-[60] w-full sm:w-[320px]">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400" />
        </div>
        <input
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : value ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by code or name..."
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider focus:outline-none focus:border-amber-500 focus:ring-1 shadow-sm transition-all disabled:opacity-60 cursor-text"
        />
      </div>
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-80 overflow-y-auto custom-scrollbar z-[100]"
          >
            {filteredAccounts.length > 0 ? (
              Object.entries(grouped).map(
                ([type, accList]) =>
                  accList.length > 0 && (
                    <div key={type}>
                      <div className="sticky top-0 bg-slate-50 dark:bg-slate-900/90 px-4 py-2 border-b border-slate-100 dark:border-slate-700/50 backdrop-blur-md z-10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {type}
                        </span>
                      </div>
                      {accList.map((acc) => (
                        <div
                          key={acc.id}
                          onClick={() => {
                            onChange(acc.id.toString());
                            setSearchTerm(
                              `${acc.account_code} - ${acc.account_name}`,
                            );
                            setIsOpen(false);
                          }}
                          className="p-3 sm:p-4 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                        >
                          <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                            {acc.account_code} {!acc.is_active && "(ARCHIVED)"}
                          </p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                            {acc.account_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ),
              )
            ) : (
              <div className="p-6 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  No matching accounts found.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GeneralLedger = () => {
  const { showToast } = useApp();
  const location = useLocation();

  // Master Data
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);

  // Ledger State
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [branchFilter, setBranchFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Unified Audit Drawer State
  const [selectedSource, setSelectedSource] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  // 1. Initial Load: Fetch Accounts and Branches
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [accRes, brRes] = await Promise.all([
          chartOfAccountsService.getAccounts(1, 500, "", "all", "all"),
          inventoryService.getActiveBranches(),
        ]);

        const fetchedAccounts = accRes.data?.accounts || accRes.accounts || [];
        setAccounts(fetchedAccounts);
        setBranches(brRes.data || []);

        const queryParams = new URLSearchParams(location.search);
        const urlAccountId = queryParams.get("accountId");
        const urlBranch = queryParams.get("branch");
        const urlStartDate = queryParams.get("startDate");
        const urlEndDate = queryParams.get("endDate");

        if (
          urlAccountId &&
          fetchedAccounts.some((a) => a.id.toString() === urlAccountId)
        ) {
          setSelectedAccountId(urlAccountId);
        } else if (fetchedAccounts.length > 0) {
          setSelectedAccountId(fetchedAccounts[0].id.toString());
        }

        if (urlBranch) {
          setBranchFilter(urlBranch);
        }
        if (urlStartDate) {
          setStartDate(urlStartDate);
        }
        if (urlEndDate) {
          setEndDate(urlEndDate);
        }
      } catch (error) {
        showToast("Failed to load ledger dependencies.", "error");
        setLoading(false);
      }
    };
    fetchDependencies();
  }, [showToast, location.search]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    branchFilter,
    startDate,
    endDate,
    selectedAccountId,
  ]);

  // 2. Fetch Ledger Data
  const loadLedger = async () => {
    if (!selectedAccountId) return;

    try {
      setLoading(true);
      const res = await generalLedgerService.getAccountLedger(
        selectedAccountId,
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        branchFilter,
        startDate,
        endDate,
      );
      setLedgerData(res.data);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [
    currentPage,
    debouncedSearchQuery,
    branchFilter,
    startDate,
    endDate,
    selectedAccountId,
  ]);

  const resetFilters = () => {
    setBranchFilter("all");
    setStartDate("");
    setEndDate("");
    setIsFilterModalOpen(false);
  };

  const handleViewSource = (sourceType, sourceId, referenceNumber) => {
    setSelectedSource({ type: sourceType, id: sourceId, ref: referenceNumber });
  };

  const closeDrawer = () => {
    setSelectedSource(null);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return num < 0 ? `(₱${formatted})` : `₱${formatted}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="General Ledger"
        subtitle="Immutable Accounting Master Record"
        icon={BookOpen}
      >
        <AccountSearchableSelect
          value={selectedAccountId}
          accounts={accounts}
          onChange={setSelectedAccountId}
          disabled={accounts.length === 0}
        />

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ref or description..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          label="Export Ledger"
          icon={Download}
          onClick={() =>
            showToast("Excel export module queued for reporting phase.", "info")
          }
        />
      </PageHeader>

      {/* SUMMARY DASHBOARD */}
      {ledgerData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Opening Balance"
            value={formatCurrency(ledgerData.summary.opening_balance)}
            icon={Calculator}
            variant="default"
          />
          <StatCard
            title="Period Debits"
            value={formatCurrency(ledgerData.summary.period_debit)}
            icon={ArrowDownRight}
            variant="success"
          />
          <StatCard
            title="Period Credits"
            value={formatCurrency(ledgerData.summary.period_credit)}
            icon={ArrowUpRight}
            variant="warning"
          />
        </div>
      )}

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Date & Source",
          "Reference",
          "Particulars",
          "Debit (₱)",
          "Credit (₱)",
          "Running Bal (₱)",
          "Action",
        ]}
        data={ledgerData?.transactions || []}
        loading={loading}
        emptyTitle="No Ledger Entries Found"
        emptySubtitle="Adjust filters or check another account."
        minWidth="min-w-[900px]"
        renderRow={(txn, idx) => (
          <tr
            key={`${txn.source_type}-${txn.source_id}-${idx}`}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
          >
            <td className="px-4 sm:px-8 py-4">
              <p className="text-xs font-bold text-slate-900 dark:text-white print:text-black">
                {new Date(txn.transaction_date).toLocaleDateString()}
              </p>
              <span className="inline-flex mt-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 print:bg-transparent print:border print:border-slate-400 print:text-black">
                {txn.source_type.replace(/_/g, " ")}
              </span>
            </td>

            <td className="px-4 sm:px-8 py-4">
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono tracking-widest uppercase print:text-black">
                {txn.reference_number || "N/A"}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[120px]">
                {txn.branch_name}
              </p>
            </td>

            <td className="px-4 sm:px-8 py-4">
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 italic truncate max-w-[200px] print:max-w-none print:whitespace-normal print:text-black">
                "{txn.description}"
              </p>
            </td>

            <td className="px-4 sm:px-8 py-4 text-right">
              {txn.debit > 0 ? (
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white print:text-black">
                  {txn.debit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="text-slate-300 dark:text-slate-700">-</span>
              )}
            </td>

            <td className="px-4 sm:px-8 py-4 text-right">
              {txn.credit > 0 ? (
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white print:text-black">
                  {txn.credit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="text-slate-300 dark:text-slate-700">-</span>
              )}
            </td>

            <td className="px-4 sm:px-8 py-4 text-right bg-slate-50/50 dark:bg-slate-900/50 print:bg-transparent border-l border-slate-100 dark:border-slate-800">
              <span
                className={`text-sm font-black font-mono ${txn.running_balance < 0 ? "text-red-500" : "text-blue-600 dark:text-blue-400"} print:text-black`}
              >
                {formatCurrency(txn.running_balance)}
              </span>
            </td>

            <td className="px-4 sm:px-8 py-4 text-right">
              <button
                onClick={() =>
                  handleViewSource(
                    txn.source_type,
                    txn.source_id,
                    txn.reference_number,
                  )
                }
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer print:hidden"
                title="View Source Document"
              >
                <Eye size={16} />
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
        title="Ledger Scope Filters"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Branch Isolation
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Enterprise Global (Consolidated)</option>
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
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </FilterModal>

      <GeneralLedgerSourceDrawer
        isOpen={!!selectedSource}
        onClose={closeDrawer}
        source={selectedSource}
      />
    </div>
  );
};

export default GeneralLedger;

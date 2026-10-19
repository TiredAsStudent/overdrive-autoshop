import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useId,
} from "react";
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
  ChevronDown,
  Check,
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

const ITEMS_PER_PAGE = 20;

const AccountSearchableSelect = ({ value, accounts, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const listboxId = useId();

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id.toString() === value?.toString()),
    [accounts, value],
  );

  const selectedDisplay = selectedAccount
    ? `${selectedAccount.account_code} - ${selectedAccount.account_name}`
    : "";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        (a.account_name || "").toLowerCase().includes(q) ||
        (a.account_code || "").toLowerCase().includes(q),
    );
  }, [accounts, searchTerm]);

  const grouped = useMemo(() => {
    const groups = {
      ASSET: [],
      LIABILITY: [],
      EQUITY: [],
      INCOME: [],
      EXPENSE: [],
    };
    filteredAccounts.forEach((acc) => {
      if (groups[acc.account_type]) {
        groups[acc.account_type].push(acc);
      }
    });
    return groups;
  }, [filteredAccounts]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full sm:w-[300px] xl:w-[340px] ${
        isOpen ? "z-30" : "z-10"
      }`}
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search
            size={15}
            aria-hidden="true"
            className="text-slate-400 dark:text-slate-500"
          />
        </div>
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Select general ledger account"
          disabled={disabled}
          value={isOpen ? searchTerm : selectedDisplay}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setSearchTerm("");
            setIsOpen(true);
          }}
          placeholder={selectedDisplay || "Search account by code or name..."}
          className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs transition-all disabled:opacity-50 cursor-pointer truncate"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setSearchTerm("");
            } else {
              setSearchTerm("");
              setIsOpen(true);
            }
          }}
          aria-label="Toggle account list"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:pointer-events-none"
        >
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180 text-amber-500" : ""
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label="Chart of Accounts"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-80 overflow-y-auto custom-scrollbar z-30"
          >
            {filteredAccounts.length > 0 ? (
              Object.entries(grouped).map(
                ([type, accList]) =>
                  accList.length > 0 && (
                    <div key={type}>
                      <div className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 px-4 py-2 border-b border-slate-100 dark:border-slate-700/50 backdrop-blur-md z-10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          {type}
                        </span>
                      </div>
                      {accList.map((acc) => {
                        const isSelected =
                          acc.id.toString() === value?.toString();
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              onChange(acc.id.toString());
                              setSearchTerm("");
                              setIsOpen(false);
                            }}
                            className={`w-full text-left p-3 sm:px-4 sm:py-3 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-amber-50/70 dark:bg-amber-500/10"
                                : ""
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase">
                                {acc.account_code}{" "}
                                {!acc.is_active && "(ARCHIVED)"}
                              </p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5 uppercase">
                                {acc.account_name}
                              </p>
                            </div>
                            {isSelected && (
                              <Check
                                size={15}
                                aria-hidden="true"
                                className="text-amber-600 dark:text-overdrive-yellow shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ),
              )
            ) : (
              <div className="p-6 text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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

  // Accessible Filter IDs
  const branchSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

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

  // Unified Audit Drawer State
  const [selectedSource, setSelectedSource] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  // 1. Initial Load: Fetch Accounts and Branches
  useEffect(() => {
    let isMounted = true;
    const fetchDependencies = async () => {
      try {
        const [accRes, brRes] = await Promise.all([
          chartOfAccountsService.getAccounts(1, 500, "", "all", "all"),
          inventoryService.getActiveBranches(),
        ]);

        if (!isMounted) return;

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
          setSelectedAccountId((prev) =>
            prev && fetchedAccounts.some((a) => a.id.toString() === prev)
              ? prev
              : fetchedAccounts[0].id.toString(),
          );
        } else {
          setLoading(false);
        }

        if (urlBranch) setBranchFilter(urlBranch);
        if (urlStartDate) setStartDate(urlStartDate);
        if (urlEndDate) setEndDate(urlEndDate);
        setCurrentPage(1);
      } catch (error) {
        if (isMounted) {
          showToast("Failed to load ledger dependencies.", "error");
          setLoading(false);
        }
      }
    };
    fetchDependencies();

    return () => {
      isMounted = false;
    };
  }, [showToast, location.search]);

  const handleAccountChange = (accountId) => {
    setSelectedAccountId(accountId);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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

  // 2. Fetch Ledger Data
  const loadLedger = useCallback(async () => {
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

      const fetchedTransactions = res.data?.transactions || [];
      const fetchedTotalPages = res.data?.pagination?.totalPages || 1;

      if (fetchedTransactions.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setLedgerData(res.data);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load general ledger entries.",
        "error",
      );
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  }, [
    selectedAccountId,
    currentPage,
    debouncedSearchQuery,
    branchFilter,
    startDate,
    endDate,
    showToast,
  ]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleViewSource = (sourceType, sourceId, referenceNumber) => {
    setSelectedSource({ type: sourceType, id: sourceId, ref: referenceNumber });
  };

  const closeDrawer = () => {
    setSelectedSource(null);
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

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return num < 0 ? `(₱${formatted})` : `₱${formatted}`;
  };

  const formatAmount = (amount) => {
    return (parseFloat(amount) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="General Ledger"
        subtitle="Immutable Accounting Master Record"
        icon={BookOpen}
      >
        <AccountSearchableSelect
          value={selectedAccountId}
          accounts={accounts}
          onChange={handleAccountChange}
          disabled={accounts.length === 0}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search ref or description..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          label="Export"
          icon={Download}
          onClick={() =>
            showToast("Excel export module queued for reporting phase.", "info")
          }
        />
      </PageHeader>

      {/* SUMMARY DASHBOARD */}
      {ledgerData?.summary && (
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
        caption="General Ledger Account Transactions and Running Balance"
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
        minWidth="min-w-[920px]"
        renderRow={(txn, idx) => {
          const debitVal = parseFloat(txn.debit) || 0;
          const creditVal = parseFloat(txn.credit) || 0;
          const runningBal = parseFloat(txn.running_balance) || 0;

          return (
            <tr
              key={`${txn.source_type}-${txn.source_id}-${idx}`}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 print:hover:bg-transparent"
            >
              {/* Date & Source */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white print:text-black">
                  {formatDate(txn.transaction_date)}
                </p>
                <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 print:bg-transparent print:border print:border-slate-400 print:text-black">
                  {(txn.source_type || "").replace(/_/g, " ")}
                </span>
              </td>

              {/* Reference */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono tabular-nums tracking-widest uppercase print:text-black">
                  {txn.reference_number || "N/A"}
                </p>
                <p
                  className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[140px]"
                  title={txn.branch_name}
                >
                  {txn.branch_name || "Enterprise Global"}
                </p>
              </td>

              {/* Particulars */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs font-medium text-slate-600 dark:text-slate-300 italic truncate max-w-[220px] sm:max-w-[260px] print:max-w-none print:whitespace-normal print:text-black"
                  title={txn.description}
                >
                  "{txn.description || "No description provided."}"
                </p>
              </td>

              {/* Debit */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                {debitVal > 0 ? (
                  <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                    {formatAmount(debitVal)}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600 font-mono">
                    -
                  </span>
                )}
              </td>

              {/* Credit */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                {creditVal > 0 ? (
                  <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                    {formatAmount(creditVal)}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600 font-mono">
                    -
                  </span>
                )}
              </td>

              {/* Running Balance */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap bg-slate-50/60 dark:bg-slate-900/40 print:bg-transparent border-l border-slate-100 dark:border-white/5">
                <span
                  className={`text-xs sm:text-sm font-black font-mono tabular-nums ${
                    runningBal < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-blue-600 dark:text-blue-400"
                  } print:text-black`}
                >
                  {formatCurrency(runningBal)}
                </span>
              </td>

              {/* Action */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() =>
                    handleViewSource(
                      txn.source_type,
                      txn.source_id,
                      txn.reference_number,
                    )
                  }
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer print:hidden"
                  title={`View Source Document (${txn.reference_number || txn.source_type})`}
                  aria-label={`View source document for ${txn.reference_number || txn.source_type}`}
                >
                  <Eye size={16} aria-hidden="true" />
                </button>
              </td>
            </tr>
          );
        }}
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
            <label htmlFor={branchSelectId} className="form-label">
              Branch Isolation
            </label>
            <div className="relative">
              <select
                id={branchSelectId}
                value={branchFilter}
                onChange={(e) => handleBranchFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">Enterprise Global (Consolidated)</option>
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

      <GeneralLedgerSourceDrawer
        isOpen={Boolean(selectedSource)}
        onClose={closeDrawer}
        source={selectedSource}
      />
    </div>
  );
};

export default GeneralLedger;

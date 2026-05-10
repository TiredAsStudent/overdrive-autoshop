import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Lock,
  Search,
  Loader2,
  FileText,
  CornerDownRight,
} from "lucide-react";
import { coaService } from "../../services/manager/coa.service";
import CoaModal from "../../features/manager/components/CoaModal";

// Helper to color-code the 5 account types professionally
const getTypeColor = (type) => {
  switch (type) {
    case "Asset":
      return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
    case "Liability":
      return "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
    case "Equity":
      return "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
    case "Revenue":
      return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    case "Expense":
      return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";
    default:
      return "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  }
};

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await coaService.getAllAccounts();
      const dataArray = response?.data || [];
      setAccounts(Array.isArray(dataArray) ? dataArray : []);
    } catch (error) {
      console.error("Failed to fetch COA:", error);
      alert(error.message || "Failed to load Chart of Accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedAccount) {
        await coaService.updateAccount(selectedAccount.id, formData);
      } else {
        await coaService.createAccount(formData);
      }
      setIsModalOpen(false);
      loadAccounts();
    } catch (error) {
      throw error;
    }
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const filteredAccounts = accounts.filter((acc) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      acc.account_name.toLowerCase().includes(searchLower) ||
      acc.account_code.toLowerCase().includes(searchLower) ||
      acc.account_type.toLowerCase().includes(searchLower) ||
      (acc.parent_name && acc.parent_name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative pb-10">
      {/* 1. TOP ACTION BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <BookOpen
              className="text-amber-600 dark:text-overdrive-yellow"
              size={24}
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Chart of Accounts
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Master Ledger Dictionary
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors whitespace-nowrap w-full sm:w-auto cursor-pointer"
          >
            <Plus size={16} /> New Account
          </button>
        </div>
      </div>

      {/* 2. THE ACCOUNT TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Loading Ledger...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Account Details</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">System Protection</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredAccounts.map((acc) => {
                const isSubAccount = !!acc.parent_id;

                return (
                  <tr
                    key={acc.id}
                    className={`group transition-colors ${
                      acc.status === "Inactive"
                        ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale"
                        : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Code & Name with VISUAL NESTING */}
                    <td className={`px-8 py-5 ${isSubAccount ? "pl-16" : ""}`}>
                      <div className="flex items-center gap-4">
                        {isSubAccount ? (
                          <div className="p-2 text-slate-400 dark:text-slate-500">
                            <CornerDownRight size={20} />
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400">
                            <FileText size={16} />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <span
                              className={`${isSubAccount ? "text-slate-500" : "text-amber-600 dark:text-amber-500"} font-mono`}
                            >
                              {acc.account_code}
                            </span>
                            {" - "} {acc.account_name}
                          </p>
                          <p
                            className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[250px] mt-0.5"
                            title={acc.description}
                          >
                            {acc.description || "No description provided."}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getTypeColor(acc.account_type)}`}
                      >
                        {acc.account_type}
                      </span>
                    </td>

                    {/* System Protection */}
                    <td className="px-8 py-5">
                      {acc.is_system_protected ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                          <Lock size={12} /> Protected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Custom
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-8 py-5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${acc.status === "Active" ? "text-emerald-500" : "text-slate-400"}`}
                      >
                        {acc.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleEdit(acc)}
                        title="Edit Account"
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer inline-flex"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAccounts.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center">
                    <div className="inline-flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-bold">No accounts found.</p>
                      <p className="text-xs mt-1">
                        Try adjusting your search query.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CoaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedAccount}
        accounts={accounts}
      />
    </div>
  );
};

export default ChartOfAccounts;

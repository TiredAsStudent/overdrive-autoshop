import React, { useState, useMemo } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Image as ImageIcon,
  Edit3,
  Send,
  ShieldAlert,
  FileWarning,
} from "lucide-react";

// --- MOCK DATA ENGINE ---
const MOCK_SUBMISSIONS = [
  {
    id: "EXP-CAB-1045",
    date: "2026-05-10",
    supplier: "Meralco Calamba",
    total: 15420.5,
    status: "APPROVED",
    submittedAt: "2 days ago",
    imgUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "EXP-CAB-1046",
    date: "2026-05-11",
    supplier: "Shell Gasoline",
    total: 2500.0,
    status: "PENDING",
    submittedAt: "5 hours ago",
    imgUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "EXP-CAB-1047",
    date: "2026-05-12",
    supplier: "AutoParts Hub Corp",
    total: 8500.0,
    status: "REJECTED",
    submittedAt: "1 hour ago",
    rejectionReason:
      "The AI extracted 8500 for the total, but the VAT amount is missing. Please review the physical receipt and manually encode the 12% VAT amount before resubmitting.",
    extractedData: {
      supplier_name: "AutoParts Hub Corp",
      transaction_date: "2026-05-12",
      base_amount: 8500.0,
      vat_amount: 0.0,
      total_amount: 8500.0,
    },
    imgUrl:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=500&auto=format&fit=crop",
  },
];

const SubmissionStatus = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("DASHBOARD"); // DASHBOARD | CORRECTION
  const [filter, setFilter] = useState("ALL"); // ALL | REJECTED | PENDING | APPROVED
  const [searchQuery, setSearchQuery] = useState("");
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);

  // Correction State
  const [activeItem, setActiveItem] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // --- LOGIC HANDLERS ---
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "ALL" || sub.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [submissions, searchQuery, filter]);

  const stats = useMemo(() => {
    return {
      actionNeeded: submissions.filter((s) => s.status === "REJECTED").length,
      pending: submissions.filter((s) => s.status === "PENDING").length,
      approved: submissions.filter((s) => s.status === "APPROVED").length,
    };
  }, [submissions]);

  const openCorrection = (item) => {
    setActiveItem(item);
    setFormData({ ...item.extractedData });
    setView("CORRECTION");
  };

  const closeCorrection = () => {
    setActiveItem(null);
    setFormData(null);
    setView("DASHBOARD");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResubmit = () => {
    setIsResubmitting(true);

    // Simulate network delay and Parent-Child linking
    setTimeout(() => {
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id === activeItem.id) {
            return {
              ...sub,
              status: "RESUBMITTED", // Changes from REJECTED to RESUBMITTED
              total: parseFloat(formData.total_amount),
              supplier: formData.supplier_name,
              submittedAt: "Just now",
            };
          }
          return sub;
        }),
      );

      alert(
        `Success: Revision submitted to Manager.\n\nAudit Trail updated: Linked to parent record ${activeItem.id}.`,
      );
      setIsResubmitting(false);
      closeCorrection();
    }, 1500);
  };

  // --- UI HELPERS ---
  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
            <CheckCircle size={10} /> Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
            <Clock size={10} /> Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit animate-pulse">
            <FileWarning size={10} /> Action Needed
          </span>
        );
      case "RESUBMITTED":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
            <RefreshCw size={10} /> Resubmitted
          </span>
        );
      default:
        return null;
    }
  };

  // =================================================================================================
  // VIEW 1: DASHBOARD (Status Tracking)
  // =================================================================================================
  if (view === "DASHBOARD") {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        {/* HEADER & METRICS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              <FileText className="text-indigo-500" size={28} />
              Submission Status
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Calamba Branch • Expense & Receipt Tracker
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilter("REJECTED")}
              className={`flex flex-col items-center justify-center min-w-[90px] p-3 rounded-2xl border-2 transition-all ${filter === "REJECTED" ? "bg-rose-50 border-rose-500 dark:bg-rose-500/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-rose-300"}`}
            >
              <span className="text-xl font-black text-rose-500">
                {stats.actionNeeded}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">
                Action Needed
              </span>
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={`flex flex-col items-center justify-center min-w-[90px] p-3 rounded-2xl border-2 transition-all ${filter === "PENDING" ? "bg-amber-50 border-amber-500 dark:bg-amber-500/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-amber-300"}`}
            >
              <span className="text-xl font-black text-amber-500">
                {stats.pending}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">
                Pending
              </span>
            </button>
            <button
              onClick={() => setFilter("APPROVED")}
              className={`flex flex-col items-center justify-center min-w-[90px] p-3 rounded-2xl border-2 transition-all ${filter === "APPROVED" ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-500/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-emerald-300"}`}
            >
              <span className="text-xl font-black text-emerald-500">
                {stats.approved}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">
                Approved
              </span>
            </button>
            <button
              onClick={() => setFilter("ALL")}
              className={`flex items-center justify-center min-w-[60px] p-3 rounded-2xl border-2 transition-all ${filter === "ALL" ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10 text-indigo-600" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-400 hover:border-indigo-300"}`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                All
              </span>
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Supplier Name or EXP-ID..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-sm font-bold focus:border-indigo-500 transition-colors shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* SUBMISSION LIST */}
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
            <div
              key={sub.id}
              className={`bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl border shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${sub.status === "REJECTED" ? "border-rose-200 dark:border-rose-500/30" : "border-slate-200 dark:border-white/10 hover:border-indigo-500/30"}`}
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                  {sub.imgUrl ? (
                    <img
                      src={sub.imgUrl}
                      alt="Receipt"
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <ImageIcon className="text-slate-300" size={24} />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                      {sub.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {sub.submittedAt}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                      {sub.supplier}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Date: {sub.date}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between md:justify-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between md:flex-col md:items-end w-full">
                  <p className="text-lg font-mono font-black text-slate-900 dark:text-white">
                    ₱
                    {sub.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <div className="mt-1">{getStatusBadge(sub.status)}</div>
                </div>

                {/* Action Button for Rejected Items */}
                {sub.status === "REJECTED" && (
                  <button
                    onClick={() => openCorrection(sub)}
                    className="w-full md:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    View Issue & Resubmit <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredSubmissions.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <CheckCircle
                size={40}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
              />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                You're all caught up!
              </p>
              <p className="text-xs text-slate-500 mt-2">
                No submissions found matching this filter.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 2: SPLIT-SCREEN CORRECTION INTERFACE (Human-in-the-Loop)
  // =================================================================================================
  if (view === "CORRECTION") {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in slide-in-from-right-4 duration-500">
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-rose-500/30 dark:border-rose-500/30 shadow-lg shadow-rose-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
          <div className="pl-4">
            <button
              onClick={closeCorrection}
              disabled={isResubmitting}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 mb-3 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={12} /> Back to Tracker
            </button>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                Correction Required
              </h1>
              <span className="font-mono text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                {activeItem.id}
              </span>
            </div>
          </div>

          {/* Manager's Rejection Note */}
          <div className="w-full md:w-1/2 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-1">
                Manager's Note
              </p>
              <p className="text-xs font-medium text-rose-800 dark:text-rose-200 leading-relaxed">
                "{activeItem.rejectionReason}"
              </p>
            </div>
          </div>
        </div>

        {/* SPLIT SCREEN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Original Scanned Document */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-sm flex flex-col min-h-[500px]">
            <div className="p-4 bg-black/50 border-b border-white/10 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> Original Receipt Scan
              </p>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center bg-black/20">
              <img
                src={activeItem.imgUrl}
                alt="Rejected Receipt"
                className="w-full max-h-[600px] object-contain rounded-xl opacity-90"
              />
            </div>
          </div>

          {/* RIGHT: Data Correction Form */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
              <Edit3 size={18} className="text-indigo-500" /> Fix Extracted Data
            </h3>

            <div className="space-y-5 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white transition-all uppercase"
                  value={formData.supplier_name}
                  onChange={handleFormChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white transition-all uppercase"
                  value={formData.transaction_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Base Amount (₱)
                  </label>
                  <input
                    type="number"
                    name="base_amount"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 focus:border-indigo-500 rounded-xl outline-none text-sm font-mono font-black text-slate-900 dark:text-white transition-all"
                    value={formData.base_amount}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-1">
                    VAT Amount (₱) - Flagged
                  </label>
                  <input
                    type="number"
                    name="vat_amount"
                    className="w-full px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-300 dark:border-rose-500/50 focus:border-rose-500 rounded-xl outline-none text-sm font-mono font-black text-rose-600 dark:text-rose-400 transition-all"
                    value={formData.vat_amount}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="space-y-1 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Total Amount (₱)
                </label>
                <input
                  type="number"
                  name="total_amount"
                  className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-xl font-mono font-black text-slate-900 dark:text-emerald-400 transition-all"
                  value={formData.total_amount}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={closeCorrection}
                disabled={isResubmitting}
                className="px-6 py-4 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResubmit}
                disabled={isResubmitting}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isResubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Linking to
                    Parent Record...
                  </>
                ) : (
                  <>
                    Submit Revision to Manager <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SubmissionStatus;

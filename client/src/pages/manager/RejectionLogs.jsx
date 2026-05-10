import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArchiveX,
  MapPin,
  Loader2,
  FileWarning,
  Image as ImageIcon,
  X,
  Calendar,
  User,
} from "lucide-react";
import { expenseService } from "../../services/manager/expense.service";

// Helper for styling rejection categories
const getCategoryBadge = (category) => {
  const styles = {
    IMAGE_QUALITY:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    DATA_MISMATCH:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    DUPLICATE:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    UNAUTHORIZED:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    POLICY_VIOLATION:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    OTHER:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-white/10",
  };

  const labels = {
    IMAGE_QUALITY: "Poor Image Quality",
    DATA_MISMATCH: "Data Mismatch",
    DUPLICATE: "Duplicate Entry",
    UNAUTHORIZED: "Unauthorized Expense",
    POLICY_VIOLATION: "Policy Violation",
    OTHER: "Other Issue",
  };

  return {
    style: styles[category] || styles.OTHER,
    label: labels[category] || category || "Unknown",
  };
};

const RejectionLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null);

  // Initialize branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await expenseService.getActiveBranches();
        setBranches(branchRes.data || []);
      } catch (error) {
        console.error("Failed to load branches:", error.message);
      }
    };
    fetchBranches();
  }, []);

  // Fetch logs when branch filter changes
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await expenseService.getRejectionLogs(selectedBranch);
        setLogs(res.data || []);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [selectedBranch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-500/20">
            <ArchiveX className="text-red-600 dark:text-red-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              Rejection Logs
              <span className="bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 normal-case tracking-widest uppercase border border-slate-200 dark:border-white/10">
                {logs.length} Records
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Permanent Audit Trail for Denied Submissions
            </p>
          </div>
        </div>

        {/* Dynamic Branch Filter */}
        <div className="relative w-full sm:w-56">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-red-500 transition-all"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_code} - {b.branch_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DATA GRID / LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10">
          <Loader2 className="animate-spin text-red-500 mb-4" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Retrieving Archive...
          </p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-16 flex flex-col items-center justify-center text-center">
          <FileWarning
            size={60}
            className="text-slate-300 dark:text-slate-600 mb-6"
          />
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">
            Clean Record
          </h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            No rejected expenses found for this branch.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const badge = getCategoryBadge(log.rejection_category);
            return (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Visual Evidence Thumbnail */}
                <div
                  className="w-full md:w-48 h-32 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden relative cursor-pointer group shrink-0 border border-slate-200 dark:border-white/5"
                  onClick={() => setLightboxImage(log.receipt_image_url)}
                >
                  <img
                    src={log.receipt_image_url}
                    alt="Rejected Scan"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ImageIcon
                      className="text-white drop-shadow-md"
                      size={24}
                    />
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">
                    ID: {log.id}
                  </div>
                </div>

                {/* Log Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">
                        {log.supplier_name || "Unknown/Unverified Supplier"}
                      </h3>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
                        <Calendar size={12} />
                        {new Date(log.updated_at).toLocaleString()}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
                        <User size={12} />
                        Submitted by: {log.staff_name}
                      </p>
                    </div>
                  </div>

                  {/* Manager's Note Block */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Manager's Rejection Note
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{log.rejection_reason}"
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL SCREEN IMAGE LIGHTBOX */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-black uppercase tracking-widest italic text-lg flex items-center gap-2">
                  <ImageIcon size={20} /> Evidence Viewer
                </h3>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center p-2 shadow-2xl">
                <img
                  src={lightboxImage}
                  alt="Full Evidence"
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RejectionLogs;

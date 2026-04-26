import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Wrench,
  PackageCheck,
  Receipt,
  Loader2,
  CreditCard,
  FileText,
} from "lucide-react";

import staffJobCardService from "../../services/staffJobCard.service";
import workshopService from "../../services/workshopService";

// ==========================================
// 1. STATUS BADGE COMPONENT
// ==========================================
const StatusBadge = ({ status, type = "neutral" }) => {
  const colorMap = {
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    danger:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
    neutral:
      "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300 border-slate-200 dark:border-white/10",
  };
  return (
    <span
      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border transition-colors ${colorMap[type] || colorMap.neutral}`}
    >
      {status}
    </span>
  );
};

// ==========================================
// 2. KANBAN CARD COMPONENT
// ==========================================
const KanbanCard = ({
  job,
  mechanics,
  onMove,
  onAssign,
  onUpdateDiagnosis,
  setGlobalError,
}) => {
  const [localDiagnosis, setLocalDiagnosis] = useState(
    job.diagnostic_notes || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  // Sync local text state if the backend updates
  useEffect(() => {
    setLocalDiagnosis(job.diagnostic_notes || "");
  }, [job.diagnostic_notes]);

  // The "Auto-Save" feature when the mechanic clicks away from the text box
  const handleBlur = async () => {
    if (localDiagnosis !== (job.diagnostic_notes || "")) {
      setIsSaving(true);
      try {
        await onUpdateDiagnosis(job.id, localDiagnosis);
      } catch (err) {
        setLocalError("Failed to save diagnosis.");
        setTimeout(() => setLocalError(""), 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Frontend Validation Gate Guardrails
  const handleStartJob = () => {
    if (!job.mechanic_id) {
      setGlobalError(
        "Validation Gate: You must assign a mechanic before moving the vehicle into the bay.",
      );
      return;
    }
    onMove(job.id, "PENDING");
  };

  const handleFinishJob = () => {
    if (!localDiagnosis || localDiagnosis.trim().length < 5) {
      setLocalError("Diagnosis required.");
      setGlobalError(
        "Validation Gate: A detailed Mechanic Diagnosis is required before marking this job as Done.",
      );
      setTimeout(() => setLocalError(""), 3000);
      return;
    }
    onMove(job.id, "ONGOING");
  };

  // Billing Badge Styling Logic
  let billingColor = "neutral";
  if (job.billing_status === "APPROVED" || job.billing_status === "PAID")
    billingColor = "success";
  if (job.billing_status === "DRAFT" || job.billing_status === "SENT")
    billingColor = "warning";
  if (job.billing_status === "CANCELLED") billingColor = "danger";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-5 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm group transition-all 
        ${job.status === "DONE" ? "border-emerald-200 dark:border-emerald-500/20" : "border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-overdrive-yellow/50"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tighter">
          {job.plate_number}
        </h4>
        {job.billing_type ? (
          <StatusBadge
            status={`${job.billing_type}: ${job.billing_status}`}
            type={billingColor}
          />
        ) : (
          <StatusBadge status="NO BILLING YET" type="neutral" />
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-gray-400 font-bold mb-4 uppercase tracking-widest">
        {job.make || "Unknown Make"} {job.model || ""}
      </p>

      {/* MECHANIC ASSIGNMENT DROPDOWN */}
      <div className="mb-4">
        <label className="text-[10px] uppercase font-black text-slate-400 block mb-1.5 tracking-widest">
          Assigned Mechanic
        </label>
        <div className="relative">
          <select
            value={job.mechanic_id || ""}
            onChange={(e) => onAssign(job.id, e.target.value)}
            disabled={job.status === "DONE"}
            className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl text-slate-700 dark:text-gray-300 outline-none focus:border-amber-500 appearance-none disabled:opacity-70 transition-all cursor-pointer"
          >
            <option value="">-- Unassigned --</option>
            {mechanics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </select>
          <User
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* DIGITAL DIAGNOSIS (Only visible in WIP or DONE) */}
      <AnimatePresence>
        {(job.status === "ONGOING" || job.status === "DONE") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4"
          >
            <label className="text-[10px] uppercase font-black text-slate-400 block mb-1.5 tracking-widest flex items-center justify-between">
              <span>
                Mechanic Diagnosis{" "}
                {isSaving && (
                  <Loader2
                    size={10}
                    className="inline animate-spin text-amber-500 ml-1"
                  />
                )}
              </span>
              {localError && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} /> {localError}
                </span>
              )}
            </label>
            <textarea
              value={localDiagnosis}
              onChange={(e) => setLocalDiagnosis(e.target.value)}
              onBlur={handleBlur}
              disabled={job.status === "DONE"}
              placeholder="e.g. Brake pads worn down to 2mm. Requires replacement..."
              rows="2"
              className={`w-full p-3 text-xs font-medium bg-slate-50 dark:bg-black/20 border rounded-xl outline-none transition-all resize-none 
                ${localError ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-white/5 focus:border-amber-500"} 
                text-slate-700 dark:text-gray-300 disabled:opacity-70`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD FOOTER & ACTION BUTTONS */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
        <div className="flex-1">
          {job.status === "PENDING" && (
            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Wrench size={10} /> Awaiting Bay
            </span>
          )}
          {job.status === "ONGOING" && (
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
              <PackageCheck size={10} /> Work In Progress
            </span>
          )}
          {job.status === "DONE" && (
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
              <Receipt size={10} /> Pending Payment
            </span>
          )}
        </div>

        {/* Dynamic Contextual Actions */}
        {job.status === "PENDING" && (
          <button
            onClick={handleStartJob}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
              ${job.mechanic_id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 shadow-lg" : "bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"}`}
          >
            Start Job <ArrowRight size={14} />
          </button>
        )}

        {job.status === "ONGOING" && (
          <button
            onClick={handleFinishJob}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 dark:bg-overdrive-yellow text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 shadow-lg shadow-amber-500/20 transition-all"
          >
            Finish Job <CheckCircle2 size={14} />
          </button>
        )}

        {job.status === "DONE" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 opacity-80 cursor-default">
            <CreditCard size={14} /> Ready to Invoice
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ==========================================
// 3. MAIN KANBAN BOARD COMPONENT
// ==========================================
const WorkshopKanban = () => {
  const [jobs, setJobs] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  // 1. Initial Load
  useEffect(() => {
    const fetchKanbanData = async () => {
      setIsLoading(true);
      try {
        const [boardData, mechanicsData] = await Promise.all([
          staffJobCardService.getBoard(),
          workshopService.getMechanics(), // Pulls mechanics locked to this branch
        ]);
        setJobs(boardData);
        setMechanics(mechanicsData.filter((m) => m.status === "ACTIVE"));
      } catch (err) {
        setGlobalError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKanbanData();
  }, []);

  // 2. Assign Mechanic (Optimistic UI with Rollback)
  const handleAssignMechanic = async (jobId, mechanicId) => {
    const snapshot = [...jobs];
    try {
      setJobs(
        jobs.map((j) =>
          j.id === jobId ? { ...j, mechanic_id: mechanicId } : j,
        ),
      );
      await staffJobCardService.assignMechanic(jobId, mechanicId);
    } catch (err) {
      setJobs(snapshot); // Rollback
      setGlobalError("Failed to assign mechanic: " + err.message);
      setTimeout(() => setGlobalError(null), 5000);
    }
  };

  // 3. Update Diagnosis
  const handleUpdateDiagnosis = async (jobId, text) => {
    const snapshot = [...jobs];
    try {
      setJobs(
        jobs.map((j) =>
          j.id === jobId ? { ...j, diagnostic_notes: text } : j,
        ),
      );
      await staffJobCardService.updateDiagnosis(jobId, text);
    } catch (err) {
      setJobs(snapshot); // Rollback
      setGlobalError("Failed to save diagnosis: " + err.message);
      setTimeout(() => setGlobalError(null), 5000);
    }
  };

  // 4. Move Job Status (Optimistic UI with Rollback)
  const handleMoveJob = async (jobId, currentStatus) => {
    let nextStatus = "PENDING";
    if (currentStatus === "PENDING") nextStatus = "ONGOING";
    if (currentStatus === "ONGOING") nextStatus = "DONE";

    const snapshot = [...jobs];
    try {
      // Optimistic UI change (Instant visual feedback)
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: nextStatus } : job,
        ),
      );

      // Fire Backend Atomic Transaction
      await staffJobCardService.updateStatus(jobId, nextStatus);
    } catch (err) {
      setJobs(snapshot); // Rollback if Backend Validation Gate fails
      setGlobalError(err.message);
      setTimeout(() => setGlobalError(null), 7000);
    }
  };

  // Setup the 3 Logic Columns
  const columns = [
    { id: "PENDING", title: "Pending Queue" },
    { id: "ONGOING", title: "Active Workshop (WIP)" },
    { id: "DONE", title: "Ready for Release" },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
          Loading Workshop Board...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto py-6 animate-in fade-in duration-500 relative">
      {/* GLOBAL ERROR / VALIDATION BANNER */}
      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-between border border-red-200 dark:border-red-500/30 shadow-lg sticky top-0 z-50"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} /> {globalError}
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="hover:opacity-70"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => {
          const columnJobs = jobs.filter((j) => j.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-100/50 dark:bg-slate-900 p-5 rounded-[32px] min-h-[75vh] border border-slate-200 dark:border-white/5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <FileText size={14} /> {col.title}
                </h3>
                <div className="h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500">
                  {columnJobs.length}
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <AnimatePresence mode="popLayout">
                  {columnJobs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl"
                    >
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Queue is empty
                      </p>
                    </motion.div>
                  ) : (
                    columnJobs.map((job) => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        mechanics={mechanics}
                        onAssign={handleAssignMechanic}
                        onMove={handleMoveJob}
                        onUpdateDiagnosis={handleUpdateDiagnosis}
                        setGlobalError={setGlobalError}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkshopKanban;

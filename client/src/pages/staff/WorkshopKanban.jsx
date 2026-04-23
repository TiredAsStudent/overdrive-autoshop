import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Wrench,
  FileSignature,
  PackageCheck,
  Receipt,
} from "lucide-react";

// ==========================================
// 1. CONSTANTS & MOCK DATA
// ==========================================
const ALL_MECHANICS = [
  { id: "m1", name: 'Mike "Wrench" Torres', branch: "Batino Branch" },
  { id: "m2", name: "Alex Turbo", branch: "Batino Branch" },
  { id: "m3", name: "John Doe", branch: "Main Branch" },
  { id: "m4", name: "Santi Gear", branch: "Third Branch" },
];

// Fallback Mock User (so the branch filter works out of the box)
const MOCK_USER = {
  name: "Staff",
  assigned_branch: "Batino Branch",
};

// ==========================================
// 2. SHARED UI COMPONENT
// ==========================================
const StatusBadge = ({ status, type = "neutral" }) => {
  const colorMap = {
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    danger:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    neutral:
      "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300 dark:border-white/10",
  };
  return (
    <span
      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border border-transparent transition-colors ${colorMap[type] || colorMap.neutral}`}
    >
      {status}
    </span>
  );
};

// ==========================================
// 3. KANBAN CARD COMPONENT
// ==========================================
const KanbanCard = ({
  job,
  mechanics = [],
  onMove,
  onAssign,
  onUpdateDiagnosis,
}) => {
  const { plate, vehicle, mechanic, status, column, diagnosis } = job;
  const [error, setError] = useState("");

  const handleFinishJob = () => {
    if (!diagnosis || diagnosis.trim().length < 5) {
      setError("Diagnosis required before finishing job.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    onMove(job.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-5 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm group transition-all 
        ${column === "done" ? "border-emerald-200 dark:border-emerald-500/20" : "border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-overdrive-yellow/50"}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tighter">
          {plate}
        </h4>
        <StatusBadge status={status.text} type={status.type} />
      </div>
      <p className="text-xs text-slate-500 dark:text-gray-400 font-bold mb-5 uppercase tracking-widest">
        {vehicle}
      </p>

      {/* BRANCH-LOCKED MECHANIC ASSIGNMENT */}
      <div className="mb-4">
        <label className="text-[10px] uppercase font-black text-slate-400 block mb-1.5 tracking-widest">
          Assigned Mechanic
        </label>
        <div className="relative">
          <select
            value={mechanic || ""}
            onChange={(e) => onAssign(job.id, e.target.value)}
            disabled={column === "done"}
            className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl text-slate-700 dark:text-gray-300 outline-none focus:border-amber-500 appearance-none disabled:opacity-70 transition-all"
          >
            <option value="">-- Unassigned --</option>
            {mechanics.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <User
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* THE DIGITAL DIAGNOSIS (Only visible in Ongoing or Done) */}
      <AnimatePresence>
        {(column === "ongoing" || column === "done") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4"
          >
            <label className="text-[10px] uppercase font-black text-slate-400 block mb-1.5 tracking-widest flex items-center justify-between">
              Mechanic Diagnosis
              {error && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} /> Required
                </span>
              )}
            </label>
            <textarea
              value={diagnosis || ""}
              onChange={(e) => onUpdateDiagnosis(job.id, e.target.value)}
              disabled={column === "done"}
              placeholder="e.g. Brake pads worn down to 2mm, requires replacement."
              rows="2"
              className={`w-full p-3 text-xs font-medium bg-slate-50 dark:bg-black/20 border rounded-xl outline-none transition-all resize-none 
                ${error ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-white/5 focus:border-amber-500"} 
                text-slate-700 dark:text-gray-300 disabled:opacity-70`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTOMATION TRIGGERS & ACTIONS */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
        {/* Dynamic Status Indicators */}
        <div className="flex-1">
          {column === "pending" && (
            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Wrench size={10} /> Awaiting Bay
            </span>
          )}
          {column === "ongoing" && (
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
              <PackageCheck size={10} /> Parts Reserved
            </span>
          )}
          {column === "done" && (
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
              <Receipt size={10} /> Invoice Drafted
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {column === "pending" && (
          <button
            onClick={() => onMove(job.id)}
            disabled={!mechanic}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
              ${mechanic ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 shadow-lg" : "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"}
            `}
          >
            Start Job <ArrowRight size={14} />
          </button>
        )}

        {column === "ongoing" && (
          <button
            onClick={handleFinishJob}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 dark:bg-overdrive-yellow text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 shadow-lg shadow-amber-500/20 transition-all"
          >
            Finish Job <CheckCircle2 size={14} />
          </button>
        )}

        {column === "done" && (
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20">
            <FileSignature size={14} /> Ready
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ==========================================
// 4. MAIN WORKSHOP KANBAN COMPONENT
// ==========================================
const WorkshopKanban = ({ user = MOCK_USER }) => {
  // Filter mechanics by the assigned branch of the logged-in user
  const branchMechanics =
    ALL_MECHANICS?.filter((m) => m.branch === user?.assigned_branch) || [];

  const [jobs, setJobs] = useState([
    {
      id: 1,
      plate: "ABC 1234",
      vehicle: "Toyota Hilux",
      mechanic: null,
      diagnosis: "",
      status: { text: "Waiting", type: "neutral" },
      column: "pending",
    },
    {
      id: 2,
      plate: "XYZ 9876",
      vehicle: "Honda Civic",
      mechanic: 'Mike "Wrench" Torres',
      diagnosis: "Replaced Engine Oil and Oil Filter. Checked tire pressure.",
      status: { text: "Repairs", type: "warning" },
      column: "ongoing",
    },
    {
      id: 3,
      plate: "GEE 3344",
      vehicle: "Mitsubishi Mirage",
      mechanic: "Alex Turbo",
      diagnosis: "Replaced 2 front brake pads. Cleaned rotors.",
      status: { text: "Done", type: "success" },
      column: "done",
    },
  ]);

  const assignMechanic = (jobId, mechanicName) => {
    setJobs(
      jobs.map((j) => (j.id === jobId ? { ...j, mechanic: mechanicName } : j)),
    );
  };

  const updateDiagnosis = (jobId, text) => {
    setJobs(jobs.map((j) => (j.id === jobId ? { ...j, diagnosis: text } : j)));
  };

  const moveJob = (id) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === id) {
          if (job.column === "pending")
            return {
              ...job,
              column: "ongoing",
              status: { text: "Ongoing", type: "warning" },
            };
          if (job.column === "ongoing")
            return {
              ...job,
              column: "done",
              status: { text: "QC Passed", type: "success" },
            };
        }
        return job;
      }),
    );
  };

  const columns = [
    { id: "pending", title: "Pending Queue" },
    { id: "ongoing", title: "Active Workshop (WIP)" },
    { id: "done", title: "Ready for Release" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className="bg-slate-100/50 dark:bg-slate-900 p-5 rounded-[32px] min-h-[75vh] border border-slate-200 dark:border-white/5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                {col.title}
              </h3>
              <div className="h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500">
                {jobs.filter((j) => j.column === col.id).length}
              </div>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <AnimatePresence mode="popLayout">
                {jobs.filter((j) => j.column === col.id).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl"
                  >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Queue is empty
                    </p>
                  </motion.div>
                ) : (
                  jobs
                    .filter((j) => j.column === col.id)
                    .map((job) => (
                      <KanbanCard
                        key={job.id}
                        job={job}
                        mechanics={branchMechanics}
                        onAssign={assignMechanic}
                        onMove={moveJob}
                        onUpdateDiagnosis={updateDiagnosis}
                      />
                    ))
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkshopKanban;

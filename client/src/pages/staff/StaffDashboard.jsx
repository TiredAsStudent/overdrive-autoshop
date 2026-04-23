import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Car,
  Wallet,
  Clock,
  AlertTriangle,
  ClipboardSignature,
  Camera,
  FileText,
  MessageSquare,
  AlertCircle,
  Building2,
  ChevronRight,
} from "lucide-react";

// Import your existing UI building blocks
import StatCard from "../../components/ui/StatCard";
import ActionTile from "../../components/ui/ActionTile";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";

// Placeholder for your form
// import VehicleCheckInForm from "../../features/staff/components/VehicleCheckInForm";
const VehicleCheckInForm = ({ onFinished }) => (
  <div className="p-8 text-center space-y-4">
    <Car size={48} className="mx-auto text-amber-500 mb-4" />
    <h3 className="text-xl font-black dark:text-white">
      Plate Search / Registration
    </h3>
    <p className="text-sm text-slate-500">Scan plate to pull Medical Record.</p>
    <button
      onClick={onFinished}
      className="mt-4 px-6 py-3 bg-amber-500 text-slate-900 font-black rounded-xl w-full"
    >
      Simulate Check-In
    </button>
  </div>
);

// MOCK USER CONTEXT
const MOCK_USER = {
  assigned_branch: "Second Branch",
  role: "Accounting Staff",
};

const StaffDashboard = ({ user = MOCK_USER }) => {
  const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);

  // ==========================================
  // MOCK DATA
  // ==========================================
  const tableColumns = [
    { key: "plate", label: "Plate No." },
    { key: "vehicle", label: "Vehicle Info" },
    { key: "status", label: "Workshop Status" },
    { key: "time", label: "Check-In" },
  ];

  const recentVehicles = [
    {
      plate: (
        <span className="font-black text-slate-900 dark:text-white">
          ABC 1234
        </span>
      ),
      vehicle: "Toyota Hilux",
      status: <StatusBadge status="Ongoing" type="warning" />,
      time: "08:30 AM",
    },
    {
      plate: (
        <span className="font-black text-slate-900 dark:text-white">
          XYZ 9876
        </span>
      ),
      vehicle: "Honda Civic RS",
      status: <StatusBadge status="Pending Quote" type="neutral" />,
      time: "09:15 AM",
    },
    {
      plate: (
        <span className="font-black text-slate-900 dark:text-white">
          DEF 4567
        </span>
      ),
      vehicle: "Ford Ranger",
      status: <StatusBadge status="Done / Unpaid" type="success" />,
      time: "10:05 AM",
    },
    {
      plate: (
        <span className="font-black text-slate-900 dark:text-white">
          GHI 1122
        </span>
      ),
      vehicle: "Mitsubishi Montero",
      status: <StatusBadge status="Evaluating" type="neutral" />,
      time: "11:45 AM",
    },
  ];

  const managerFeedback = [
    {
      id: "REQ-9850",
      type: "OCR Intake",
      issue: "Total amount mismatch. Check photo.",
      time: "10 mins ago",
    },
    {
      id: "ADJ-1022",
      type: "Stock Loss",
      issue: "Please provide better explanation for spillage.",
      time: "1 hour ago",
    },
  ];

  const customerMessages = [
    {
      plate: "ABC 1234",
      message: "Go ahead with the synthetic oil upgrade.",
      time: "Just now",
    },
    {
      plate: "DEF 4567",
      message: "What time can I pick up the car?",
      time: "25 mins ago",
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 py-6">
      {/* ========================================== */}
      {/* HEADER SECTION                             */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Action Center
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            <Building2 size={16} /> {user.assigned_branch} Local Data
          </p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            System Status
          </p>
          <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Live & Synced
          </p>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. QUICK ACTIONS HUB                       */}
      {/* ========================================== */}
      <div>
        <h2 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
          Maker Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionTile
            title="Integrated Check-In"
            description="Scan plate to pull medical record or register new arrival."
            icon={ClipboardSignature}
            onClick={() => setCheckInModalOpen(true)}
          />
          <ActionTile
            title="Scan Supplier Receipt"
            description="Trigger OCR Intake for parts & utilities."
            icon={Camera}
            onClick={() => alert("Navigating to OCR Intake Sub-Tab...")}
          />
          <ActionTile
            title="New Estimate Quote"
            description="Generate a non-posting price quote."
            icon={FileText}
            onClick={() => alert("Navigating to Billing: Estimates Sub-Tab...")}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. LOCAL KPI CARDS (Branch Pulse)          */}
      {/* ========================================== */}
      <div>
        <h2 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">
          Local Key Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Collections"
            value="₱24,500"
            icon={Wallet}
            trend="Cash/Digital Remittance"
            trendUp={true}
          />
          <StatCard
            title="Bay Capacity"
            value="4 / 6"
            icon={Car}
            trend="Vehicles Ongoing"
            trendUp={false}
          />
          <StatCard
            title="Pending Approval"
            value="3"
            icon={Clock}
            trend="Awaiting Checker"
            trendUp={false}
          />
          <StatCard
            title="Local Stock Alerts"
            value="2"
            icon={AlertTriangle}
            trend="Critical Items"
            trendUp={false}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. LIVE WORKFLOW & FEEDBACK GRID           */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Job Ticker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              Active Job Ticker
            </h2>
            <button className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-600 tracking-widest flex items-center">
              View Kanban <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-2 shadow-sm">
            <DataTable
              columns={tableColumns}
              data={recentVehicles}
              onRowClick={(row) => console.log("Clicked vehicle:", row.plate)}
            />
          </div>
        </div>

        {/* Right Column: Feedback Feeds */}
        <div className="space-y-8">
          {/* Manager Feedback Loop */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <AlertCircle size={14} /> Manager Feedback
            </h2>
            <div className="space-y-3">
              {managerFeedback.map((feedback, idx) => (
                <div
                  key={idx}
                  className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 p-4 rounded-2xl cursor-pointer hover:border-red-300 dark:hover:border-red-500/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                      {feedback.id} ({feedback.type})
                    </span>
                    <span className="text-[9px] font-bold text-red-400 uppercase">
                      {feedback.time}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-red-800 dark:text-red-200">
                    {feedback.issue}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Communication Feed */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquare size={14} /> Customer Portal Msgs
            </h2>
            <div className="space-y-3">
              {customerMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 p-4 rounded-2xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                      Plate: {msg.plate}
                    </span>
                    <span className="text-[9px] font-bold text-blue-400 uppercase">
                      {msg.time}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-200">
                    "{msg.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. MODALS                                  */}
      {/* ========================================== */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        title="Automotive Triage & Intake"
      >
        <VehicleCheckInForm onFinished={() => setCheckInModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default StaffDashboard;

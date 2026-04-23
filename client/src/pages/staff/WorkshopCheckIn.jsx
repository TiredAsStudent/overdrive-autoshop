import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PlusCircle,
  Car,
  User,
  Gauge,
  History,
  ArrowRight,
  Wrench,
  ClipboardList,
  Package,
  CheckCircle2,
  Mail,
  Copy,
  AlertCircle,
} from "lucide-react";

// ==========================================
// 1. SHARED UI COMPONENTS (From your existing code)
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
      className={`px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded-full border border-transparent transition-colors ${colorMap[type] || colorMap.neutral}`}
    >
      {status}
    </span>
  );
};

const TimelineItem = ({
  date,
  title,
  description,
  type,
  mechanic,
  odometer,
}) => {
  const icons = {
    service: <Wrench size={16} className="text-amber-500" />,
    checkin: <ClipboardList size={16} className="text-blue-500" />,
    parts: <Package size={16} className="text-purple-500" />,
    completed: <CheckCircle2 size={16} className="text-emerald-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative pl-8 pb-10 last:pb-0"
    >
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center z-10 shadow-sm transition-colors">
        {icons[type] || icons.service}
      </div>
      <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:border-amber-400 dark:hover:border-overdrive-yellow/50 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <span className="text-xs font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-wider">
            {date}
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded">
            ODO: {odometer} KM
          </span>
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white mb-1 transition-colors">
          {title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed transition-colors">
          {description}
        </p>
        {mechanic && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-white">
              {mechanic[0]}
            </div>
            <span className="text-xs text-slate-500 dark:text-gray-500">
              Handled by{" "}
              <span className="text-slate-700 dark:text-gray-300 font-medium">
                {mechanic}
              </span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ==========================================
// 2. MAIN WORKSHOP CHECK-IN COMPONENT
// ==========================================
const WorkshopCheckIn = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("search"); // 'search' | 'passport' | 'invite' | 'manual'
  const [foundVehicle, setFoundVehicle] = useState(null);

  // Intake Logic States
  const [currentOdo, setCurrentOdo] = useState("");
  const [email, setEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  // MOCK DATA: Global PostgreSQL Simulation
  const mockDatabase = [
    {
      plate: "ABC 1234",
      owner: "Christian Leo Cereno",
      model: "Toyota Hilux 2021",
      lastVisit: "Mar 15, 2026",
      branch: "Batino Branch",
      lastOdo: 45000,
      history: [
        {
          date: "Mar 15, 2026",
          title: "Periodic Maintenance",
          description: "Oil change, filter replacement, and brake cleaning.",
          type: "service",
          mechanic: "Mike",
          odometer: "45,000",
        },
        {
          date: "Jan 10, 2026",
          title: "Suspension Check",
          description: "Front shocks replaced at Main Branch.",
          type: "parts",
          mechanic: "Alex",
          odometer: "42,200",
        },
      ],
    },
  ];

  // Logic Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return alert("Please enter a plate number first!");

    const result = mockDatabase.find(
      (v) => v.plate === searchQuery.toUpperCase(),
    );
    if (result) {
      setFoundVehicle(result);
      setView("passport");
    } else {
      setView("not_found"); // Trigger the hybrid flow choice
    }
  };

  const handleSendInvite = () => {
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setSearchQuery("");
      setView("search");
    }, 3000);
  };

  const startIntake = () => {
    if (!currentOdo)
      return alert("Current Odometer reading is mandatory for liability.");
    alert(
      `Intake started for ${foundVehicle.plate}. Sending to Kanban Job Board...`,
    );
    setView("search");
    setSearchQuery("");
    setCurrentOdo("");
  };

  // Automated Maintenance Math
  const nextService = currentOdo ? parseInt(currentOdo) + 5000 : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 py-6">
      {/* GLOBAL SEARCH HEADER */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">
          Universal Plate Search
        </h2>
        <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mb-6 flex items-center gap-2">
          <Car size={16} className="text-blue-500" /> Search the enterprise
          database (Biñan, Batino, Cabuyao).
        </p>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
              size={24}
            />
            <input
              type="text"
              placeholder="ENTER PLATE (e.g. ABC 1234)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-2xl font-black tracking-widest uppercase text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest uppercase text-sm rounded-2xl shadow-lg hover:scale-105 transition-transform"
          >
            Search
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: THE SAFETY GATE (Not Found Choice) */}
        {view === "not_found" && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-10 rounded-[32px] flex flex-col items-center text-center"
          >
            <PlusCircle className="text-amber-500 mb-4" size={56} />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              New Vehicle Detected
            </h3>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 max-w-md">
              Plate{" "}
              <span className="text-amber-600 font-black">{searchQuery}</span>{" "}
              was not found. Please select a registration path.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button
                onClick={() => setView("invite")}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
              >
                <Mail size={18} /> Digital Invite (Recommended)
              </button>
              <button
                onClick={() => setView("manual")}
                className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Manual Fallback
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: SERVICE PASSPORT (Returning Customer) */}
        {view === "passport" && foundVehicle && (
          <motion.div
            key="passport"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column: Vehicle Summary & Intake Math */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
                <StatusBadge status="Record Found" type="success" />
                <h3 className="text-4xl font-black mt-4 text-slate-900 dark:text-white tracking-tighter">
                  {foundVehicle.plate}
                </h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
                  {foundVehicle.model}
                </p>

                <div className="mt-8 space-y-5 pt-6 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Owner
                      </p>
                      <p className="text-sm font-bold dark:text-gray-200">
                        {foundVehicle.owner}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                      <Gauge size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Last Recorded Odo
                      </p>
                      <p className="text-sm font-bold dark:text-gray-200">
                        {foundVehicle.lastOdo.toLocaleString()} KM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandatory Intake Math Container */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 p-6 opacity-5">
                  <Car size={100} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">
                  Mandatory Intake
                </h4>
                <div className="space-y-4 relative z-10">
                  <label className="block text-xs font-bold text-slate-300">
                    Current Odometer (KM)
                  </label>
                  <input
                    type="number"
                    value={currentOdo}
                    onChange={(e) => setCurrentOdo(e.target.value)}
                    placeholder="e.g. 48000"
                    className="w-full bg-white/10 border border-white/20 p-4 rounded-xl font-bold outline-none focus:border-amber-500 text-white"
                  />

                  {/* Automated Maintenance Logic */}
                  <AnimatePresence>
                    {currentOdo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-2"
                      >
                        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                          <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">
                            Forecast Next Service
                          </p>
                          <p className="text-lg font-black text-white">
                            {nextService.toLocaleString()} KM
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={startIntake}
                    className="w-full mt-4 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest transition-colors"
                  >
                    Push to Job Board <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Medical Record */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <History
                    className="text-slate-600 dark:text-slate-400"
                    size={20}
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Unified Service Passport
                </h3>
              </div>
              <div className="py-2">
                {foundVehicle.history.map((item, index) => (
                  <TimelineItem key={index} {...item} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: DIGITAL INVITE (Primary New Customer Path) */}
        {view === "invite" && (
          <motion.div
            key="invite"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
              <div className="text-center space-y-3 mb-10">
                <div className="h-20 w-20 bg-blue-50 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                  <Mail size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Digital Invite
                </h3>
                <p className="text-sm font-bold text-slate-500 px-6">
                  The customer will receive a secure link to input their own
                  vehicle and contact information.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl font-bold outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleSendInvite}
                  disabled={!email || inviteSent}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${inviteSent ? "bg-emerald-500 text-white" : "bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:scale-[1.02]"}`}
                >
                  {inviteSent ? (
                    <>
                      <CheckCircle2 size={20} /> Link Sent Securely
                    </>
                  ) : (
                    <>
                      <Mail size={20} /> Send Invite Link
                    </>
                  )}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100 dark:border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-white dark:bg-slate-800 px-4 text-slate-400">
                      Fallback Option
                    </span>
                  </div>
                </div>

                <button className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                  <Copy size={16} /> Copy Invite Link for Viber / SMS
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: MANUAL ENTRY (Fallback New Customer Path) */}
        {view === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-600 dark:text-slate-400">
                <Car size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Manual Fallback
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                  Plate: {searchQuery}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">
                  Customer Info
                </p>
                <input
                  placeholder="Full Legal Name"
                  className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 font-bold outline-none focus:border-amber-500 dark:text-white"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 font-bold outline-none focus:border-amber-500 dark:text-white"
                />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">
                  Vehicle Specs
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Make"
                    className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 font-bold dark:text-white"
                  />
                  <input
                    placeholder="Model"
                    className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 font-bold dark:text-white"
                  />
                </div>
                <input
                  placeholder="Chassis / Engine Number"
                  className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 font-bold dark:text-white"
                />
              </div>
            </div>

            <div className="mt-10 p-6 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-amber-200 dark:border-amber-500/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 max-w-sm">
                  Please show this screen to the customer to verify spelling
                  before clicking save to ensure Data Integrity.
                </p>
              </div>
              <button
                onClick={() => {
                  alert("Saved. Moving to Kanban Job Board.");
                  setView("search");
                  setSearchQuery("");
                }}
                className="w-full sm:w-auto px-10 py-4 bg-amber-500 text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-colors"
              >
                Acknowledge & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkshopCheckIn;

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  UserCheck,
  MapPin,
  Award,
  Star,
  Phone,
  Search,
  Power,
  ShieldAlert,
  Edit3,
  Loader2,
  X,
  UserMinus,
  Briefcase,
} from "lucide-react";
import workshopService from "../../services/workshopService";

const MechanicRegistry = () => {
  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- DATA STATE ---
  const [mechanics, setMechanics] = useState([]);
  const [branches, setBranches] = useState([]);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    branch_id: "",
    specialization: "",
    certification_level: "Junior",
    contact_number: "",
    status: "ACTIVE",
  });

  // --- DATA FETCHING ---
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mechData, branchData] = await Promise.all([
        workshopService.getMechanics(),
        workshopService.getBranches(),
      ]);
      setMechanics(mechData);
      setBranches(branchData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- ACTIONS ---
  const handleToggleStatus = async (mech) => {
    if (mech.status === "TERMINATED") {
      setError(
        "Cannot quick-toggle a terminated professional. Please use the Edit menu to reinstate them.",
      );
      return;
    }
    const newStatus = mech.status === "ACTIVE" ? "ON_LEAVE" : "ACTIVE";
    try {
      await workshopService.updateMechanic(mech.id, { status: newStatus });
      await fetchInitialData();
    } catch (err) {
      setError("Failed to change mechanic status: " + err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode("CREATE");
    setFormData({
      first_name: "",
      last_name: "",
      branch_id: branches.length > 0 ? branches[0].id : "",
      specialization: "",
      certification_level: "Junior",
      contact_number: "",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mech) => {
    setModalMode("EDIT");
    setEditingId(mech.id);
    setFormData({
      first_name: mech.first_name,
      last_name: mech.last_name,
      branch_id: mech.branch_id,
      specialization: mech.specialization || "",
      certification_level: mech.certification_level || "Junior",
      contact_number: mech.contact_number || "",
      status: mech.status || "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (modalMode === "CREATE") {
        await workshopService.createMechanic({
          ...formData,
          branch_id: parseInt(formData.branch_id, 10),
        });
      } else {
        await workshopService.updateMechanic(editingId, {
          ...formData,
          branch_id: parseInt(formData.branch_id, 10),
        });
      }
      setIsModalOpen(false);
      await fetchInitialData();
    } catch (err) {
      setError(err.message);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const filteredMechanics = mechanics.filter((mech) => {
    const fullName = `${mech.first_name} ${mech.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      (mech.specialization &&
        mech.specialization.toLowerCase().includes(search)) ||
      (mech.branch_name && mech.branch_name.toLowerCase().includes(search)) ||
      (mech.certification_level &&
        mech.certification_level.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 relative min-h-screen">
      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50 font-bold flex justify-between items-center mb-6">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. ADMIN CONTROL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Name, Specialty, Certification, or Branch..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold shadow-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={openCreateModal}
          className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all uppercase text-xs tracking-widest shadow-lg whitespace-nowrap"
        >
          <UserPlus size={18} /> Register Professional
        </button>
      </div>

      {/* 2. PROFESSIONAL CARDS GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Loading Registry...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMechanics.map((mech) => {
            const isActive = mech.status === "ACTIVE";
            const isOnLeave = mech.status === "ON_LEAVE";
            const isTerminated = mech.status === "TERMINATED";

            return (
              <motion.div
                key={mech.id}
                layout
                className={`bg-white dark:bg-slate-800 rounded-3xl border overflow-hidden shadow-sm hover:shadow-xl transition-all group relative 
                  ${isActive ? "border-slate-200 dark:border-white/10" : ""}
                  ${isOnLeave ? "border-blue-200 dark:border-blue-900/30 opacity-90" : ""}
                  ${isTerminated ? "border-red-200 dark:border-red-900/30 opacity-60 grayscale" : ""}
                `}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner transition-colors
                        ${isActive ? "bg-amber-500 text-slate-900" : ""}
                        ${isOnLeave ? "bg-blue-100 dark:bg-blue-900/40 text-blue-500" : ""}
                        ${isTerminated ? "bg-slate-200 dark:bg-slate-700 text-slate-400" : ""}
                      `}
                    >
                      {isTerminated ? (
                        <UserMinus size={32} />
                      ) : (
                        <UserCheck size={32} />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <button
                        onClick={() => handleToggleStatus(mech)}
                        disabled={isTerminated}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all 
                          ${isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer" : ""}
                          ${isOnLeave ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer" : ""}
                          ${isTerminated ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 cursor-not-allowed" : ""}
                        `}
                      >
                        <Power size={12} />
                        {mech.status.replace("_", " ")}
                      </button>

                      <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                        <Star size={14} fill="currentColor" />{" "}
                        {isActive ? "4.9" : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-8">
                    <h3
                      className={`text-xl font-black tracking-tight uppercase italic line-clamp-1
                      ${isTerminated ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-white"}`}
                    >
                      {mech.first_name} {mech.last_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                      <Award
                        size={14}
                        className={
                          isActive ? "text-blue-500" : "text-slate-400"
                        }
                      />
                      {mech.certification_level} •{" "}
                      {mech.specialization || "General"}
                    </div>
                  </div>

                  <div className="space-y-4 py-6 border-t border-slate-50 dark:border-white/5">
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                      <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg shrink-0">
                        <Phone size={14} />
                      </div>
                      <span className="font-bold">
                        {mech.contact_number || "No Contact Listed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                      <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg shrink-0">
                        <MapPin size={14} />
                      </div>
                      <span className="font-bold text-amber-600 dark:text-overdrive-yellow uppercase">
                        {mech.branch_name || "Unknown Branch"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => openEditModal(mech)}
                      className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 size={14} /> Manage / Transfer
                    </button>
                    <div className="px-4 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center min-w-[70px]">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none">
                        {isActive ? "12" : "-"}
                      </p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">
                        Jobs
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredMechanics.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-black uppercase tracking-widest">
            No Mechanics Found
          </p>
          <p className="text-sm">
            Adjust your search or register a new professional to the system.
          </p>
        </div>
      )}

      {/* 4. CRUD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10 my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                  {modalMode === "CREATE"
                    ? "Hire Professional"
                    : "Manage Profile"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                      First Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                      Last Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                      Certification Level
                    </label>
                    <select
                      value={formData.certification_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certification_level: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Master">Master</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                      Specialization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Engine Overhaul"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                    Branch Assignment (Transfer)
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) =>
                      setFormData({ ...formData, branch_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl text-sm font-bold text-slate-900 dark:text-amber-500 focus:outline-none focus:border-amber-500 appearance-none"
                    required
                  >
                    <option value="" disabled>
                      Select a branch...
                    </option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0917-xxx-xxxx"
                    value={formData.contact_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_number: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {modalMode === "EDIT" && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                      Employment Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-bold appearance-none focus:outline-none focus:border-amber-500 transition-colors
                        ${formData.status === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30" : ""}
                        ${formData.status === "ON_LEAVE" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30" : ""}
                        ${formData.status === "TERMINATED" ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" : ""}
                      `}
                    >
                      <option value="ACTIVE">
                        ACTIVE - Available for Job Allocation
                      </option>
                      <option value="ON_LEAVE">
                        ON LEAVE - Temporarily Unavailable
                      </option>
                      <option value="TERMINATED">
                        TERMINATED - Deactivate Profile
                      </option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      Warning: Changing status to Terminated removes them
                      permanently from Staff Dropdowns.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2 shadow-lg"
                >
                  {isSubmitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {modalMode === "CREATE"
                    ? "Save Professional"
                    : "Confirm Updates"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MechanicRegistry;

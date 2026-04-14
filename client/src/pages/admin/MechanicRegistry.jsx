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
} from "lucide-react";
import workshopService from "../../services/workshopService";

const MechanicRegistry = () => {
  // --- UI STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- DATA STATE ---
  const [mechanics, setMechanics] = useState([]);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // "CREATE" or "EDIT"
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    branch_id: 1, // Default to Main Branch
    specialization: "",
    contact_number: "",
    is_active: true,
  });

  // --- DATA FETCHING ---
  const fetchMechanics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workshopService.getMechanics();
      setMechanics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMechanics();
  }, [fetchMechanics]);

  // --- ACTIONS ---
  const handleToggleStatus = async (mech) => {
    try {
      // Instantly flip the status in the database
      await workshopService.updateMechanic(mech.id, {
        is_active: !mech.is_active,
      });
      await fetchMechanics(); // Refresh the UI
    } catch (err) {
      setError("Failed to change mechanic status: " + err.message);
    }
  };

  const openCreateModal = () => {
    setModalMode("CREATE");
    setFormData({
      first_name: "",
      last_name: "",
      branch_id: 1,
      specialization: "",
      contact_number: "",
      is_active: true,
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
      contact_number: mech.contact_number || "",
      is_active: mech.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (modalMode === "CREATE") {
        // Convert branch_id to integer for backend validation
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
      setIsModalOpen(false); // Close on success
      await fetchMechanics(); // Refresh the list
    } catch (err) {
      setError(err.message);
      setIsModalOpen(false); // Ensure modal closes so user sees global error banner
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
      (mech.branch_name && mech.branch_name.toLowerCase().includes(search))
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
            placeholder="Search by Name, Specialty, or Branch..."
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
          {filteredMechanics.map((mech) => (
            <motion.div
              key={mech.id}
              layout
              className={`bg-white dark:bg-slate-800 rounded-3xl border ${
                mech.is_active
                  ? "border-slate-200 dark:border-white/10"
                  : "border-red-200 dark:border-red-900/30 opacity-75 grayscale-[30%]"
              } overflow-hidden shadow-sm hover:shadow-xl transition-all group relative`}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${
                      mech.is_active
                        ? "bg-amber-500 text-slate-900"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    }`}
                  >
                    <UserCheck size={32} />
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => handleToggleStatus(mech)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all hover:scale-105 ${
                        mech.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      <Power size={12} />{" "}
                      {mech.is_active ? "Active" : "On-Leave"}
                    </button>
                    {/* Placeholder for future Kanban integration */}
                    <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                      <Star size={14} fill="currentColor" /> 4.9
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic line-clamp-1">
                    {mech.first_name} {mech.last_name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                    <Award size={14} className="text-blue-500 shrink-0" />{" "}
                    {mech.specialization || "General Mechanic"}
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
                    <Edit3 size={14} /> Edit / Transfer
                  </button>
                  {/* Placeholder for future Kanban integration */}
                  <div className="px-4 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center min-w-[70px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">
                      ---
                    </p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">
                      Jobs
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredMechanics.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-black uppercase tracking-widest">
            No Mechanics Found
          </p>
          <p className="text-sm">
            Adjust your search or register a new professional.
          </p>
        </div>
      )}

      {/* 3. ACCOUNTABILITY NOTE */}
      <div className="p-5 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-2xl shrink-0">
          <ShieldAlert className="text-blue-600 dark:text-blue-400" size={20} />
        </div>
        <div>
          <h4 className="font-black uppercase text-sm tracking-tight text-blue-900 dark:text-blue-300 italic mb-1">
            Security Protocol: Branch Lock Active
          </h4>
          <p className="text-xs text-blue-700 dark:text-blue-400/80 font-medium leading-relaxed max-w-3xl">
            Mechanics are hard-coded to specific branches. When Staff create a
            Kanban Job Card, the "Assign Mechanic" dropdown will{" "}
            <strong>ONLY</strong> display professionals currently assigned to
            that location. Only an Admin can authorize a Branch Transfer.
          </p>
        </div>
      </div>

      {/* 4. CRUD MODAL (Hire & Transfer) */}
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
                  {modalMode === "CREATE" ? "Hire Mechanic" : "Edit Profile"}
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

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                    Branch Assignment
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) =>
                      setFormData({ ...formData, branch_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl text-sm font-bold text-slate-900 dark:text-amber-500 focus:outline-none focus:border-amber-500 appearance-none"
                  >
                    <option value="1">Main Branch</option>
                    <option value="2">Second Branch</option>
                    <option value="3">Third Branch</option>
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
                  <div className="flex items-center gap-3 pt-2 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10">
                    <input
                      type="checkbox"
                      id="isActiveMech"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-amber-500 bg-white border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <label
                        htmlFor="isActiveMech"
                        className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer select-none"
                      >
                        Mechanic is Active
                      </label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Unchecking this places them On-Leave and removes them
                        from Staff Job Card dropdowns.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
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

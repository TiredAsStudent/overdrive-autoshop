import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Edit2,
  Search,
  Loader2,
  UserSquare2,
  MapPin,
} from "lucide-react";
import { mechanicService } from "../../services/manager/mechanic.service";
import MechanicModal from "../../features/manager/components/MechanicModal";

const getStatusColor = (status) => {
  switch (status) {
    case "Active":
      return "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
    case "On Leave":
      return "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
    case "Inactive":
      return "text-slate-500 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20";
    default:
      return "text-slate-400";
  }
};

const Mechanics = () => {
  const [mechanics, setMechanics] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mechRes, branchRes] = await Promise.all([
        mechanicService.getAllMechanics(),
        mechanicService.getManagerBranches(),
      ]);
      setMechanics(Array.isArray(mechRes?.data) ? mechRes.data : []);
      setBranches(Array.isArray(branchRes?.data) ? branchRes.data : []);
    } catch (error) {
      console.error("Data load failed:", error);
      alert(error.message || "Failed to load Mechanics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedMechanic) {
        await mechanicService.updateMechanic(selectedMechanic.id, formData);
      } else {
        await mechanicService.createMechanic(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleEdit = (mechanic) => {
    setSelectedMechanic(mechanic);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedMechanic(null);
    setIsModalOpen(true);
  };

  const filteredMechanics = mechanics.filter((m) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      m.employee_id.toLowerCase().includes(searchLower) ||
      m.branch_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Wrench
              className="text-amber-600 dark:text-overdrive-yellow"
              size={24}
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Mechanics Registry
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Workforce & Resource Distribution
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by name, ID, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors whitespace-nowrap w-full sm:w-auto cursor-pointer"
          >
            <Plus size={16} /> Enroll Mechanic
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Syncing Roster...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Technician Profile</th>
                <th className="px-8 py-5">Assigned Location</th>
                <th className="px-8 py-5">Skill Specialties</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredMechanics.map((mech) => (
                <tr
                  key={mech.id}
                  className={`group transition-colors ${mech.status === "Inactive" ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400">
                        <UserSquare2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {mech.first_name} {mech.last_name}
                        </p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-mono mt-0.5">
                          {mech.employee_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {mech.branch_name || "Unassigned"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded font-mono">
                        {mech.branch_code}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-5 max-w-[280px]">
                    <div className="flex flex-wrap gap-1.5">
                      {mech.skills && mech.skills.length > 0 ? (
                        <>
                          {mech.skills.slice(0, 2).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded text-[9px] font-bold uppercase tracking-wider"
                            >
                              {skill}
                            </span>
                          ))}
                          {mech.skills.length > 2 && (
                            <span className="inline-flex px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 rounded text-[9px] font-black uppercase tracking-wider">
                              +{mech.skills.length - 2} More
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No skills tagged
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <span
                      className={`inline-flex px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(mech.status)}`}
                    >
                      {mech.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => handleEdit(mech)}
                      title="Edit Profile"
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer inline-flex"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <MechanicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedMechanic}
        branches={branches}
      />
    </div>
  );
};

export default Mechanics;

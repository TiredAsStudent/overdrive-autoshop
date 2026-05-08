import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Edit2,
  Search,
  Loader2,
  Receipt,
  Clock,
  Tag,
} from "lucide-react";
import { serviceCatalogService } from "../../services/manager/service.service";
import ServiceModal from "../../features/manager/components/ServiceModal";

// Helper for Philippine Peso Formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

// Helper for formatting minutes into Hours/Mins
const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await serviceCatalogService.getAllServices();
      setServices(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Data load failed:", error);
      alert(error.message || "Failed to load Services data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedService) {
        await serviceCatalogService.updateService(selectedService.id, formData);
      } else {
        await serviceCatalogService.createService(formData);
      }
      setIsModalOpen(false);
      loadData(); // Refresh the table
    } catch (error) {
      throw error;
    }
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const filteredServices = services.filter((s) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      s.service_name.toLowerCase().includes(searchLower) ||
      s.service_code.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative pb-10">
      {/* 1. TOP ACTION BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Tag
              className="text-amber-600 dark:text-overdrive-yellow"
              size={24}
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Service Catalog
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Labor Master Pricing & Revenue Mapping
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
            <Plus size={16} /> Add Service
          </button>
        </div>
      </div>

      {/* 2. THE SERVICES TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Syncing Catalog...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Service Details</th>
                <th className="px-8 py-5">Standard Price</th>
                <th className="px-8 py-5">Duration</th>
                <th className="px-8 py-5">Tax Config</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredServices.map((srv) => (
                <tr
                  key={srv.id}
                  className={`group transition-colors ${
                    !srv.is_active
                      ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale"
                      : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Service Details Column */}
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {srv.service_name}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-500 font-mono mt-0.5">
                        {srv.service_code}
                      </span>
                    </div>
                  </td>

                  {/* Price Column */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <Receipt size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                        {formatCurrency(srv.price)}
                      </span>
                    </div>
                  </td>

                  {/* Duration Column */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {formatDuration(srv.estimated_minutes)}
                      </span>
                    </div>
                  </td>

                  {/* VAT Status */}
                  <td className="px-8 py-5">
                    {srv.is_vatable ? (
                      <span className="inline-flex px-2 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-500 rounded text-[9px] font-black uppercase tracking-wider">
                        VAT Inclusive
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded text-[9px] font-black uppercase tracking-wider">
                        Non-VAT
                      </span>
                    )}
                  </td>

                  {/* Active/Inactive Status */}
                  <td className="px-8 py-5">
                    {srv.is_active ? (
                      <span className="inline-flex px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border text-slate-500 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => handleEdit(srv)}
                      title="Edit Service"
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer inline-flex"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredServices.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-8 py-12 text-center">
                    <div className="inline-flex flex-col items-center justify-center text-slate-400">
                      <Tag size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-bold">
                        No services defined yet.
                      </p>
                      <p className="text-xs mt-1">
                        Click "Add Service" to build the master labor catalog.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedService}
      />
    </div>
  );
};

export default Services;

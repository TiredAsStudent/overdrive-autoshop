import { useState } from "react";
import {
  Search,
  Plus,
  Calendar,
  User,
  Clock,
  MapPin,
  Activity,
  Car,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import RegisterVehicleModal from "../../components/vehicles/RegisterVehicleModal";
import AddRecordModal from "../../components/vehicles/AddRecordModal";

const VehicleArchive = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setVehicle(null);
    setHistory([]);

    try {
      const response = await api.get(`/vehicles/${searchQuery}`);
      setVehicle(response.data.vehicle);
      setHistory(response.data.medical_record);
      toast.success("Medical Record retrieved!");
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("Vehicle not found. Please register it.");
        setIsRegisterOpen(true);
      } else {
        toast.error("Error retrieving vehicle data.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const handleRegistrationSuccess = (newVehicle) => {
    setVehicle(newVehicle);
    setHistory([]);
  };

  const handleRecordSuccess = (newRecord) => {
    setHistory([newRecord, ...history]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <RegisterVehicleModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        initialPlate={searchQuery}
        onSuccess={handleRegistrationSuccess}
      />
      <AddRecordModal
        isOpen={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        plateNumber={vehicle?.plate_number}
        onSuccess={handleRecordSuccess}
      />

      {/* Sleek Search Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-yellow-100 p-2.5 rounded-xl">
            <Search className="text-yellow-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase text-zinc-900 tracking-tight">
              Vehicle Archive
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex w-full md:max-w-md shadow-sm rounded-lg overflow-hidden border border-zinc-300 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Plate Number..."
            className="w-full py-2.5 px-4 text-sm sm:text-base font-bold text-zinc-800 tracking-widest bg-zinc-50 focus:bg-white focus:outline-none placeholder-zinc-400"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-zinc-900 text-yellow-400 text-sm font-bold px-5 hover:bg-zinc-800 transition-colors disabled:opacity-70 whitespace-nowrap"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {vehicle && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Vehicle Profile Card */}
          <div className="bg-zinc-900 rounded-2xl p-5 text-white shadow-lg sticky top-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-5 border-b border-zinc-800 pb-4">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Plate Number
              </span>
              <div className="bg-yellow-400 text-zinc-900 font-black text-xl tracking-widest px-3 py-1 rounded shadow-inner">
                {vehicle.plate_number}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <Car className="text-yellow-500 shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">
                    {vehicle.make} {vehicle.model}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <Calendar className="text-yellow-500 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-base">
                    {vehicle.year || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <User className="text-yellow-500 shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">
                    {vehicle.owner_name}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAddRecordOpen(true)}
              className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors border border-zinc-700"
            >
              <Plus size={18} /> Log Service Repair
            </button>
          </div>

          {/* Right Column: Medical Record Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-zinc-200 min-h-[400px]">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-zinc-100">
              <Activity className="text-yellow-500" size={22} />
              <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                Service History
              </h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 font-medium bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                <p>No service history found for this vehicle.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-zinc-200 ml-2 space-y-6 pb-2">
                {history.map((record) => (
                  <div key={record.id} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-yellow-400 border-[3px] border-white shadow-sm"></div>

                    {/* Record Card */}
                    <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
                          <Clock size={14} />
                          {new Date(record.service_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md w-fit">
                          <MapPin size={12} className="text-yellow-600" />
                          Branch {record.branch_id}
                        </div>
                      </div>

                      <p className="text-zinc-800 text-sm font-medium leading-relaxed mb-3">
                        {record.service_details}
                      </p>

                      <div className="flex justify-end pt-2 border-t border-zinc-100">
                        <span className="text-base font-black text-zinc-900">
                          {formatCurrency(record.total_cost)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleArchive;

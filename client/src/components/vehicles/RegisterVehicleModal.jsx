import { useState } from "react";
import { X, Car } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const RegisterVehicleModal = ({ isOpen, onClose, initialPlate, onSuccess }) => {
  const [formData, setFormData] = useState({
    plate_number: initialPlate || "",
    make: "",
    model: "",
    year: "",
    owner_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Registering vehicle...");

    try {
      const response = await api.post("/vehicles/register", formData);
      toast.success(response.data.message, { id: toastId });
      onSuccess(response.data.vehicle);
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to register vehicle.",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2 text-zinc-800">
            <Car className="text-yellow-500" size={20} />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Register Vehicle
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
              Plate Number
            </label>
            <input
              type="text"
              name="plate_number"
              required
              value={formData.plate_number}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 uppercase font-mono text-sm"
              placeholder="ABC 123"
            />
          </div>

          {/* Fixed Responsiveness: grid-cols-1 on mobile, grid-cols-2 on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Make
              </label>
              <input
                type="text"
                name="make"
                required
                value={formData.make}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:ring-1 focus:ring-yellow-500 text-sm"
                placeholder="Toyota"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Model
              </label>
              <input
                type="text"
                name="model"
                required
                value={formData.model}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:ring-1 focus:ring-yellow-500 text-sm"
                placeholder="Vios"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:ring-1 focus:ring-yellow-500 text-sm"
                placeholder="2018"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Owner Name
              </label>
              <input
                type="text"
                name="owner_name"
                required
                value={formData.owner_name}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:ring-1 focus:ring-yellow-500 text-sm"
                placeholder="Juan Dela Cruz"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 mt-2 rounded-md text-sm font-bold text-yellow-400 bg-zinc-900 hover:bg-zinc-800 transition-all disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save Vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterVehicleModal;

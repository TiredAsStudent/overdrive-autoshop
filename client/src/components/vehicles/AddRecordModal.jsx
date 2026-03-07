import { useState } from "react";
import { X, Wrench } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const AddRecordModal = ({ isOpen, onClose, plateNumber, onSuccess }) => {
  const [formData, setFormData] = useState({
    service_details: "",
    total_cost: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Adding record...");

    try {
      const response = await api.post("/vehicles/history", {
        plate_number: plateNumber,
        service_details: formData.service_details,
        total_cost: parseFloat(formData.total_cost),
      });
      toast.success("Record added successfully!", { id: toastId });
      onSuccess(response.data.record);
      onClose();
      setFormData({ service_details: "", total_cost: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add record.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2 text-zinc-800">
            <Wrench className="text-yellow-500" size={20} />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Log Service
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
              Service Details
            </label>
            <textarea
              required
              rows="3"
              value={formData.service_details}
              onChange={(e) =>
                setFormData({ ...formData, service_details: e.target.value })
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none"
              placeholder="E.g., Change oil, replace brake pads..."
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
              Total Cost (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-500 font-medium text-sm">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.total_cost}
                onChange={(e) =>
                  setFormData({ ...formData, total_cost: e.target.value })
                }
                className="w-full rounded-md border border-zinc-300 pl-8 pr-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 mt-2 rounded-md text-sm font-bold text-zinc-900 bg-yellow-400 hover:bg-yellow-500 transition-all disabled:opacity-70 shadow-sm"
          >
            {isSubmitting ? "Saving..." : "Save Record"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRecordModal;

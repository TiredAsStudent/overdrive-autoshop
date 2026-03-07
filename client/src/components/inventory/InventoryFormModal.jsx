import { useState, useEffect } from "react";
import { X, Package, Tag, DollarSign } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const InventoryFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  userRole,
}) => {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "Fluids",
    quantity: "",
    unit_cost: "",
    tax_category: "VAT-Exempt",
    branch_id: "1", // Default to Main Branch for Admins
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill form if we are editing an item
  useEffect(() => {
    if (editItem) {
      setFormData({
        item_name: editItem.item_name,
        category: editItem.category,
        quantity: editItem.quantity,
        unit_cost: editItem.unit_cost,
        tax_category: editItem.tax_category,
        branch_id: editItem.branch_id?.toString() || "1",
      });
    } else {
      setFormData({
        item_name: "",
        category: "Fluids",
        quantity: "",
        unit_cost: "",
        tax_category: "VAT-Exempt",
        branch_id: "1",
      });
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading(
      editItem ? "Updating item..." : "Adding item...",
    );

    try {
      // Prepare payload, ensuring numbers are parsed
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        unit_cost: parseFloat(formData.unit_cost),
        branch_id: parseInt(formData.branch_id),
      };

      if (editItem) {
        await api.put(`/inventory/edit/${editItem.id}`, payload);
        toast.success("Item updated successfully!", { id: toastId });
      } else {
        await api.post("/inventory/add", payload);
        toast.success("Item added to warehouse!", { id: toastId });
      }

      onSuccess(); // Refresh the list
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save item.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live preview of the suggested markup price
  const previewMarkup = formData.unit_cost
    ? (parseFloat(formData.unit_cost) * 1.25).toFixed(2)
    : "0.00";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2 text-zinc-800">
            <Package className="text-yellow-500" size={20} />
            <h2 className="text-lg font-black uppercase tracking-tight">
              {editItem ? "Edit Stock Item" : "Add New Item"}
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
          {/* Admin Branch Selector */}
          {userRole === "admin" && !editItem && (
            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Assign to Branch
              </label>
              <select
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500"
              >
                <option value="1">Branch 1 (Main)</option>
                <option value="2">Branch 2 (Batino)</option>
                <option value="3">Branch 3 (Third)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Item Name
              </label>
              <input
                type="text"
                name="item_name"
                required
                value={formData.item_name}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                placeholder="e.g. Mobil 1 Synthetic Oil"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Category
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500"
              >
                <option value="Fluids">Fluids & Oils</option>
                <option value="Filters">Filters</option>
                <option value="Brakes">Brake Parts</option>
                <option value="Tires">Tires</option>
                <option value="Misc">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
                Initial Quantity
              </label>
              <input
                type="number"
                name="quantity"
                required
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 mb-1.5 uppercase">
                <DollarSign size={14} /> Unit Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 font-medium text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  name="unit_cost"
                  required
                  min="0"
                  value={formData.unit_cost}
                  onChange={handleChange}
                  className="w-full rounded-md border border-zinc-300 pl-8 pr-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500 bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 mb-1.5 uppercase">
                <Tag size={14} /> Auto-Markup (+25%)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 font-medium text-sm">
                  ₱
                </span>
                <input
                  type="text"
                  disabled
                  value={previewMarkup}
                  className="w-full rounded-md border border-yellow-300 pl-8 pr-3 py-2 text-zinc-900 text-sm bg-yellow-50/30 font-bold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1 uppercase">
              Zoho Tax Category
            </label>
            <select
              name="tax_category"
              value={formData.tax_category}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500"
            >
              <option value="VAT-Exempt">VAT-Exempt</option>
              <option value="VAT-12%">VAT (12%)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 mt-2 rounded-md text-sm font-bold text-zinc-900 bg-yellow-400 hover:bg-yellow-500 transition-all disabled:opacity-70 shadow-sm"
          >
            {isSubmitting
              ? "Saving..."
              : editItem
                ? "Update Item"
                : "Save to Warehouse"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryFormModal;

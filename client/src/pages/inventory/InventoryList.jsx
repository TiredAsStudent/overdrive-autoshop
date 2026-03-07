import { useState, useEffect, useContext } from "react";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Edit,
  Trash2,
  MapPin,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import InventoryFormModal from "../../components/inventory/InventoryFormModal";

const InventoryList = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/inventory");
      setItems(response.data);
    } catch (error) {
      toast.error("Failed to load inventory data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = async (item) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this item?")
    )
      return;

    const toastId = toast.loading("Deleting item...");
    try {
      await api.delete(`/inventory/delete/${item.id}`, {
        data: { branch_id: item.branch_id },
      });
      toast.success("Item deleted.", { id: toastId });
      fetchInventory();
    } catch (error) {
      toast.error("Failed to delete item.", { id: toastId });
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Filter items based on search query
  const filteredItems = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <InventoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInventory}
        editItem={editingItem}
        userRole={user?.role}
      />

      {/* Header Actions & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2.5 rounded-xl">
            <Package className="text-yellow-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase text-zinc-900 tracking-tight">
              Inventory
            </h1>
          </div>
        </div>

        {/* Improved layout: Search and Add Button side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Medium Sized Search Bar */}
          <div className="relative w-full sm:w-72 md:w-80 shadow-sm rounded-lg overflow-hidden border border-zinc-200 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all bg-zinc-50 focus-within:bg-white">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search part name or category..."
              className="w-full py-2.5 pl-9 pr-4 text-sm font-medium text-zinc-800 bg-transparent focus:outline-none placeholder-zinc-400"
            />
          </div>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto bg-zinc-900 text-yellow-400 text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Plus size={18} /> Add Stock Item
          </button>
        </div>
      </div>

      {/* Inventory Display */}
      {isLoading ? (
        <div className="text-center py-16 text-zinc-500 font-medium bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-yellow-500 mx-auto mb-4"></div>
          Loading warehouse data...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300 text-zinc-500 shadow-sm">
          <Package size={48} className="mx-auto text-zinc-300 mb-3" />
          <p className="font-bold text-lg text-zinc-700">No items found.</p>
          <p className="text-sm text-zinc-400 mt-1">
            Adjust your search query or add a new stock item.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW - Improved UI */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100/80 border-b border-zinc-200 text-[11px] uppercase tracking-widest text-zinc-500 font-black">
                  <th className="p-4 pl-6">Item Name & Category</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4">Retail Price</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredItems.map((item) => {
                  const isLowStock = item.quantity <= 5;
                  const isOutOfStock = item.quantity === 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50 transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        <p className="font-bold text-zinc-900 text-sm">
                          {item.item_name}
                        </p>
                        <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                          {item.category}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md w-fit">
                          <MapPin size={12} className="text-yellow-600" /> B
                          {item.branch_id}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-black ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-emerald-600"}`}
                          >
                            {item.quantity}
                          </span>
                          {/* Low Stock Intelligence Indicator */}
                          {isLowStock && (
                            <div
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${isOutOfStock ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}
                            >
                              <AlertTriangle size={10} />{" "}
                              {isOutOfStock ? "EMPTY" : "LOW"}
                            </div>
                          )}
                        </div>
                        {/* Zoho Readiness: Reserved Logic */}
                        <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wider">
                          {item.reserved_quantity} Reserved
                        </p>
                      </td>
                      <td className="p-4 text-sm font-semibold text-zinc-500">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td className="p-4">
                        {/* Improved Retail Badge */}
                        <span className="text-sm font-black text-yellow-800 bg-yellow-100 px-2.5 py-1 rounded-md border border-yellow-200/60 shadow-sm">
                          {formatCurrency(item.markup_price)}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW - Slightly polished borders */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredItems.map((item) => {
              const isLowStock = item.quantity <= 5;
              const isOutOfStock = item.quantity === 0;

              return (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-zinc-900 text-base">
                        {item.item_name}
                      </h3>
                      <p className="text-xs font-semibold text-zinc-500 mt-0.5 flex items-center gap-1">
                        {item.category} <span className="text-zinc-300">•</span>{" "}
                        Branch {item.branch_id}
                      </p>
                    </div>
                    {isLowStock && (
                      <div
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${isOutOfStock ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}
                      >
                        <AlertTriangle size={12} />{" "}
                        {isOutOfStock ? "OUT OF STOCK" : "LOW STOCK"}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Avail. Stock
                      </p>
                      <p
                        className={`font-black text-lg ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {item.quantity}{" "}
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block sm:inline sm:ml-1">
                          ({item.reserved_quantity} Res)
                        </span>
                      </p>
                    </div>
                    <div className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Retail Price
                      </p>
                      <p className="font-black text-lg text-zinc-900">
                        {formatCurrency(item.markup_price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-xs font-bold text-zinc-600 flex items-center gap-1.5 py-1.5 px-3 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-xs font-bold text-red-600 flex items-center gap-1.5 py-1.5 px-3 hover:bg-red-50 border border-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryList;

import React, { useState, useMemo } from "react";
import {
  ClipboardList,
  Search,
  ScanLine,
  Plus,
  Car,
  User,
  CheckCircle,
  FileText,
  Sparkles,
  ChevronRight,
  Minus,
  AlertTriangle,
  ArrowRight,
  Save,
  Clock,
  Edit3,
  Image as ImageIcon,
  Calculator,
  Phone,
} from "lucide-react";

// --- MOCK DATA ENGINE ---
const MOCK_SERVICES = [
  {
    id: "SRV-01",
    type: "LABOR",
    code: "LBR-OIL",
    name: "Standard Change Oil",
    price: 500,
  },
  {
    id: "SRV-02",
    type: "LABOR",
    code: "LBR-BRK",
    name: "Brake Pad Replacement",
    price: 800,
  },
  {
    id: "SRV-03",
    type: "LABOR",
    code: "LBR-AC",
    name: "Aircon Freon Recharge",
    price: 1200,
  },
];

const MOCK_INVENTORY = [
  {
    id: "INV-01",
    type: "PART",
    code: "OIL-SYN-4L",
    name: "Full Synthetic Motor Oil (4L)",
    price: 1800,
    stockQty: 12,
  },
  {
    id: "INV-02",
    type: "PART",
    code: "FLT-TYT",
    name: "Toyota Genuine Oil Filter",
    price: 450,
    stockQty: 2,
  },
];

const MOCK_VEHICLE_REGISTRY = {
  "NCO-1234": {
    model: "Toyota Vios 2022",
    customer: "Juan Dela Cruz",
    phone: "0912-345-6789",
  },
};

// Mock Database of Drafts
const INITIAL_DRAFTS = [
  {
    id: "EST-CAB-0091",
    plate: "XYZ-9988",
    date: "2026-05-10",
    items: 2,
    total: 2300,
    status: "DRAFT",
  },
  {
    id: "EST-CAB-0092",
    plate: "DEF-4455",
    date: "2026-05-10",
    items: 1,
    total: 800,
    status: "DRAFT",
  },
];

const Estimates = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("DASHBOARD");
  const [activeStep, setActiveStep] = useState(1);

  // Dashboard State
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS);

  // Intake State (Expanded for Customer/Vehicle Data)
  const [isScanning, setIsScanning] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Financial State
  const [selectedItems, setSelectedItems] = useState([]);
  const [isTaxInclusive, setIsTaxInclusive] = useState(true);

  // --- LOGIC HANDLERS ---
  const handlePlateSearch = (plate) => {
    const cleanPlate = plate.toUpperCase().trim();
    setPlateNumber(cleanPlate);
    if (MOCK_VEHICLE_REGISTRY[cleanPlate]) {
      const info = MOCK_VEHICLE_REGISTRY[cleanPlate];
      setVehicleInfo(info);
      // Auto-fill the rest of the form
      setVehicleModel(info.model);
      setCustomerName(info.customer);
      setCustomerPhone(info.phone);
    } else {
      setVehicleInfo(null);
      // Don't clear manually typed details if plate is not found, letting staff type new customer info
    }
  };

  const handleAiScan = () => {
    setIsScanning(true);
    setUploadedImage(
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=500&auto=format&fit=crop",
    );

    setTimeout(() => {
      // AI extracts data with intentional error for verification
      handlePlateSearch("NC0-1234");
      setCustomerName("Juan Dela Cruz");
      setCustomerPhone("0912-345-6789");
      setVehicleModel("Toyota Vios 2022");
      setSelectedItems([{ ...MOCK_SERVICES[0], qty: 1 }]);
      setIsScanning(false);
      setActiveStep(2);
    }, 2500);
  };

  const addItemToEstimate = (item) => {
    if (item.type === "PART" && item.stockQty <= 0)
      return alert(`Out of stock.`);

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        // STRICT LOGIC: Prevent adding multiple quantities of the same LABOR
        if (item.type === "LABOR") return prev;

        if (item.type === "PART" && existing.qty >= item.stockQty) return prev;
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (id) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing.qty > 1 && existing.type === "PART") {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleSaveDraft = () => {
    alert(`Estimate saved as DRAFT.`);
    setView("DASHBOARD");
    setActiveStep(1);
    setPlateNumber("");
    setVehicleModel("");
    setCustomerName("");
    setCustomerPhone("");
    setSelectedItems([]);
  };

  // --- FINANCIAL ENGINE ---
  const totals = useMemo(() => {
    const GLOBAL_VAT_RATE = 0.12;
    let grossTotal = selectedItems.reduce(
      (acc, item) => acc + item.price * item.qty,
      0,
    );
    let baseAmount = isTaxInclusive
      ? grossTotal / (1 + GLOBAL_VAT_RATE)
      : grossTotal;
    let vatAmount = isTaxInclusive
      ? grossTotal - baseAmount
      : baseAmount * GLOBAL_VAT_RATE;
    return {
      base: baseAmount,
      vat: vatAmount,
      grand: isTaxInclusive ? grossTotal : baseAmount + vatAmount,
    };
  }, [selectedItems, isTaxInclusive]);

  // =================================================================================================
  // VIEW 1: DRAFTS DASHBOARD
  // =================================================================================================
  if (view === "DASHBOARD") {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              <ClipboardList className="text-indigo-500" size={28} />
              Estimates & Intake
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Calamba Branch Dashboard
            </p>
          </div>
          <button
            onClick={() => {
              setView("INTAKE");
              setActiveStep(1);
            }}
            className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <Plus size={16} /> New Intake
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Clock size={16} /> Saved Drafts (Awaiting Customer Approval)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 transition-all shadow-sm group flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                      {draft.id}
                    </span>
                    <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {draft.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500">
                      <Car size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {draft.plate}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {draft.items} Items Quoted
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <p className="text-lg font-mono font-black text-slate-900 dark:text-white">
                    ₱{draft.total.toLocaleString()}
                  </p>
                  <button
                    onClick={() => {
                      setView("INTAKE");
                      setActiveStep(3);
                      setPlateNumber(draft.plate);
                    }}
                    className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-all"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 2: INTAKE WORKFLOW
  // =================================================================================================
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
      {/* HEADER & STEPPER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <button
            onClick={() => setView("DASHBOARD")}
            className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 mb-2 flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={12} /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Digital Intake
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 w-full md:w-auto overflow-x-auto">
          {[
            { num: 1, label: "Intake Form" },
            { num: 2, label: "Verify AI" },
            { num: 3, label: "Catalog" },
            { num: 4, label: "Review" },
          ].map((step) => (
            <div
              key={step.num}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black transition-all whitespace-nowrap ${
                activeStep === step.num
                  ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                {step.num}
              </span>
              <span className="hidden sm:block uppercase tracking-widest">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- STEP 1: AI SCAN OR MANUAL INTAKE FORM --- */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-indigo-600 p-12 rounded-3xl shadow-xl shadow-indigo-500/20 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[500px]">
            {isScanning ? (
              <div className="space-y-6 animate-pulse flex flex-col items-center">
                <div className="relative">
                  <Sparkles size={64} className="text-white" />
                  <div className="absolute inset-0 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
                <div>
                  <p className="text-white font-black uppercase tracking-widest text-sm">
                    Gemini AI Processing
                  </p>
                  <p className="text-indigo-200 text-[10px] font-mono mt-2">
                    Extracting HTR Plate Data & OMR Services...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ScanLine size={64} className="text-white mb-6" />
                <h3 className="text-3xl font-black text-white uppercase italic leading-tight">
                  AI Vision Intake
                </h3>
                <p className="text-indigo-100 text-sm mt-3 mb-8 max-w-md font-medium">
                  Capture the physical customer checklist. The AI will extract
                  the Plate Number, Customer Details, and auto-check the
                  requested services.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleAiScan}
                    className="px-8 py-4 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                  >
                    <ImageIcon size={16} /> Upload & Scan
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-6">
              <Car size={16} /> Manual Intake Form
            </h3>

            <div className="space-y-5 flex-1">
              {/* Plate Search drives auto-fill */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Plate Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="e.g., ABC-1234"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-lg font-mono font-black text-slate-900 dark:text-white uppercase transition-all"
                    value={plateNumber}
                    onChange={(e) => handlePlateSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  placeholder="e.g., Toyota Vios 2022"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white transition-all"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white transition-all"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="09..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white transition-all"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {vehicleInfo && (
                <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg">
                  <CheckCircle size={12} /> Existing Customer Auto-Filled
                </p>
              )}
            </div>

            <button
              onClick={() => setActiveStep(3)}
              disabled={!plateNumber}
              className="w-full mt-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-30"
            >
              Continue to Catalog <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: HUMAN-IN-THE-LOOP SPLIT-SCREEN VERIFICATION --- */}
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
          {/* LEFT: Original Image */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-sm flex flex-col min-h-[400px]">
            <div className="p-4 bg-black/50 border-b border-white/10 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> Original Checklist
              </p>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center bg-black/20">
              <img
                src={uploadedImage}
                alt="Scanned Intake Form"
                className="max-h-[400px] object-contain rounded-xl opacity-80"
              />
            </div>
          </div>

          {/* RIGHT: Extracted Data (Editable) */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
              <Edit3 size={18} className="text-amber-500" /> Verify AI
              Extraction
            </h3>

            <div className="space-y-4 flex-1">
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-2">
                  Verify plate carefully. AI confidence low on 'O' vs '0'.
                </p>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Plate Number
                </label>
                <input
                  type="text"
                  className="w-full mt-1 px-4 py-3 bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-500/50 focus:border-indigo-500 rounded-xl outline-none text-xl font-mono font-black text-slate-900 dark:text-white uppercase transition-all"
                  value={plateNumber}
                  onChange={(e) => handlePlateSearch(e.target.value)}
                />
                {vehicleInfo && (
                  <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                    <CheckCircle size={12} /> DB Match
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Customer
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  OMR Detected Services
                </label>
                <div className="mt-2 space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                        {item.name}
                      </span>
                      <CheckCircle size={16} className="text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveStep(3)}
              className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Confirm Data is Correct <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: SERVICE CATALOG & FINANCIALS --- */}
      {activeStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                <ClipboardList size={16} /> Master Labor Services
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_SERVICES.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addItemToEstimate(service)}
                    className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-white/5 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all text-left group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                        {service.name}
                      </p>
                      <p className="text-[10px] font-bold text-indigo-500 font-mono tracking-tighter mt-1">
                        ₱{service.price.toLocaleString()}
                      </p>
                    </div>
                    <Plus
                      size={18}
                      className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                <ScanLine size={16} /> Branch Parts Inventory
              </h3>
              <div className="space-y-3">
                {MOCK_INVENTORY.map((part) => (
                  <div
                    key={part.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50"
                  >
                    <div className="mb-3 sm:mb-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                        {part.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] font-bold text-indigo-500 font-mono tracking-tighter">
                          ₱{part.price.toLocaleString()}
                        </p>
                        <span className="text-slate-300 dark:text-slate-600">
                          |
                        </span>
                        {part.stockQty > 0 ? (
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            {part.stockQty} In Stock
                          </p>
                        ) : (
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                            <AlertTriangle size={10} /> Out of Stock
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => addItemToEstimate(part)}
                      disabled={part.stockQty <= 0}
                      className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-indigo-500 hover:border-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Running Bill / Calculator */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-xl sticky top-6">
              <div className="mb-6 pb-4 border-b border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">
                  Target Vehicle
                </p>
                <p className="text-lg font-mono font-black text-white uppercase">
                  {plateNumber || "N/A"}
                </p>
                {customerName && (
                  <p className="text-xs text-slate-400 mt-1">{customerName}</p>
                )}
              </div>
              <div className="space-y-4 mb-8 min-h-[150px]">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start group"
                  >
                    <div className="flex-1 pr-4">
                      <p className="text-[11px] font-bold text-white uppercase leading-tight">
                        {item.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs font-mono font-black text-white italic">
                        ₱{(item.price * item.qty).toLocaleString()}
                      </p>

                      {/* Quantity Logic: Labor is fixed, Parts can increment */}
                      {item.type === "PART" ? (
                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-md"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-[10px] font-black text-white w-4 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => addItemToEstimate(item)}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded-md"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-md"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-[10px] font-black text-slate-500 w-4 text-center px-1">
                            LBR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700 mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tax Setup
                </span>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isTaxInclusive}
                      onChange={() => setIsTaxInclusive(!isTaxInclusive)}
                    />
                    <div
                      className={`block w-10 h-6 rounded-full transition-colors ${isTaxInclusive ? "bg-indigo-500" : "bg-slate-700"}`}
                    ></div>
                    <div
                      className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isTaxInclusive ? "transform translate-x-4" : ""}`}
                    ></div>
                  </div>
                  <div className="ml-3 text-[10px] font-bold text-white uppercase w-16">
                    {isTaxInclusive ? "VAT Inc." : "VAT Exc."}
                  </div>
                </label>
              </div>
              <div className="space-y-2 border-t border-slate-800 pt-6 mb-8 font-mono">
                <div className="flex justify-between text-slate-400 text-xs font-bold">
                  <span>BASE</span>
                  <span>
                    ₱
                    {totals.base.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-400 text-xs font-black italic">
                  <span>VAT (12%)</span>
                  <span>
                    ₱
                    {totals.vat.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase font-sans">
                    Total
                  </span>
                  <span className="text-3xl font-black text-overdrive-yellow italic">
                    ₱
                    {totals.grand.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              <button
                disabled={selectedItems.length === 0}
                onClick={() => setActiveStep(4)}
                className="w-full py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                Review <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 4: FINAL REVIEW & PRINT --- */}
      {activeStep === 4 && (
        <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-500" size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">
              Estimate Ready
            </h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto font-medium">
              Prepared for{" "}
              <span className="font-black text-slate-900 dark:text-white uppercase px-2">
                {plateNumber}
              </span>
              .
              <br />
              Owner: {customerName}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSaveDraft}
                className="w-full py-4 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex justify-center gap-2"
              >
                <Save size={18} /> Save as Draft
              </button>
              <button
                onClick={() => alert("Pushed to Sales Orders (WIP)")}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex justify-center gap-2"
              >
                Authorize to WIP
              </button>
            </div>

            {/* PRINT & EDIT BUTTONS Restored */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <button
                onClick={() => setActiveStep(3)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Edit Setup
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={() => alert("Printing Customer Estimate PDF...")}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <FileText size={12} /> Print Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estimates;

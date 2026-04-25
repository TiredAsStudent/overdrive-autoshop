import React, { useState } from "react";
import {
  Search,
  Car,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  RefreshCw,
  AlertCircle,
  Lock,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import checkInService from "../../services/checkin.service";

const WorkshopCheckIn = () => {
  const [searchPlate, setSearchPlate] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("pathA");

  const [formData, setFormData] = useState({
    plate_number: "",
    odometer: "",
    service_intent: "",
    mechanic_id: "",
    email: "",
    first_name: "",
    last_name: "",
    make: "",
    model: "",
    year: "",
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPlate) return;

    const alphaNumericOnly = searchPlate.replace(/[^A-Z0-9]/gi, "");

    if (alphaNumericOnly.length < 3) {
      setError("Invalid Plate: Must contain at least 3 letters/numbers.");
      return;
    }
    if (alphaNumericOnly.length > 8) {
      setError("Invalid Plate: Too long for a standard plate format.");
      return;
    }

    setSearchLoading(true);
    setError(null);
    setSuccessData(null);
    try {
      const res = await checkInService.searchPlate(searchPlate);
      if (res.isFound) {
        setVehicleData(res.vehicle);
        setFormData((prev) => ({
          ...prev,
          plate_number: res.vehicle.plate_number,
          email: res.vehicle.email || "",
        }));
      } else {
        setVehicleData(false);
        // Auto-sanitize plate for UI display (saving cleanly to DB)
        setFormData((prev) => ({
          ...prev,
          plate_number: alphaNumericOnly.toUpperCase(),
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmitCheckIn = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      const payload = { ...formData };

      // Zod Cleanup: Strip empty strings that cause crashes
      if (!payload.mechanic_id) delete payload.mechanic_id;
      if (!payload.year) delete payload.year;

      // Tab Cleanup: If staff chose Path A, clear out manual details so the customer fills them in
      if (!vehicleData) {
        if (activeTab === "pathA") {
          delete payload.first_name;
          delete payload.last_name;
          delete payload.make;
          delete payload.model;
          delete payload.year;
        }
        // Note: Email is ALWAYS sent now, regardless of the tab!
      }

      const res = await checkInService.submitCheckIn(payload);
      setSuccessData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Magic Link copied! Paste it in Viber or Messenger.");
  };

  const resetFlow = () => {
    setVehicleData(null);
    setSuccessData(null);
    setSearchPlate("");
    setError(null);
    setActiveTab("pathA");
    setFormData({
      plate_number: "",
      odometer: "",
      service_intent: "",
      mechanic_id: "",
      email: "",
      first_name: "",
      last_name: "",
      make: "",
      model: "",
      year: "",
    });
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tight">
            Workshop Intake
          </h1>
        </div>
        {vehicleData !== null && (
          <button
            onClick={resetFlow}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg"
          >
            <RefreshCw size={14} /> Start Over
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* STEP 1: PLATE SEARCH */}
      {vehicleData === null && !successData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm max-w-md mx-auto mt-12 text-center"
        >
          <div className="bg-amber-100 dark:bg-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
            <Car size={28} className="text-amber-600 dark:text-amber-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">
            Scan License Plate
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => {
                const sanitized = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9 -]/g, "");
                setSearchPlate(sanitized);
              }}
              placeholder="ABC 123"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.2em] text-slate-900 dark:text-white uppercase outline-none focus:border-amber-500 transition-colors"
            />
            <button
              disabled={searchLoading}
              type="submit"
              className="w-full bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center gap-2 uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-lg"
            >
              {searchLoading ? (
                "Searching..."
              ) : (
                <>
                  <Search size={16} /> Verify Identity
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* STEP 2: INTAKE FORM */}
      {vehicleData !== null && !successData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left Column: Context */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Identity Status
                </p>
                {vehicleData ? (
                  <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                    Returning
                  </span>
                ) : (
                  <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                    New Arrival
                  </span>
                )}
              </div>
              <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-center mb-4">
                <p className="text-2xl font-black tracking-widest text-slate-900 dark:text-white">
                  {formData.plate_number}
                </p>
              </div>
              {vehicleData && (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Owner</span>
                    <span className="font-black dark:text-white">
                      {vehicleData.first_name} {vehicleData.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Model</span>
                    <span className="font-black dark:text-white">
                      {vehicleData.make} {vehicleData.model}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-white/10 pt-3">
                    <span className="text-slate-500 font-bold">
                      Total Visits
                    </span>
                    <span className="font-black dark:text-white">
                      {vehicleData.total_visits}
                    </span>
                  </div>
                  <div className="flex justify-between bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="text-amber-600 dark:text-amber-500 font-bold">
                      Last Odometer
                    </span>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {vehicleData.last_odometer_reading} km
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <form onSubmit={handleSubmitCheckIn} className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10 pb-3 mb-6">
                  Service Ticket
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Current Odometer
                    </label>
                    <input
                      required
                      placeholder="000,000 (km)"
                      type="number"
                      name="odometer"
                      value={formData.odometer}
                      onChange={handleInputChange}
                      className="w-full mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Service Intent
                    </label>
                    <select
                      required
                      name="service_intent"
                      value={formData.service_intent}
                      onChange={handleInputChange}
                      className="w-full mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm dark:text-white outline-none focus:border-amber-500"
                    >
                      <option value="">Select Category...</option>
                      <option value="Engine">Engine & Tune-up</option>
                      <option value="Underchassis">
                        Underchassis / Suspension
                      </option>
                      <option value="Brakes">Brakes & Safety</option>
                      <option value="Aircon">Aircon System</option>
                      <option value="General">General Checkup</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* NEW REGISTRATION SECTION */}
              {!vehicleData && (
                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">
                    Customer Portal Setup
                  </h3>

                  {/* Email is now MANDATORY and sits globally above the tabs */}
                  <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Mail size={12} /> Email Address (Required)
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="customer@example.com"
                      className="w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm dark:text-white outline-none focus:border-amber-500 shadow-sm"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      An activation link will be sent to this email to secure
                      the Digital Passport.
                    </p>
                  </div>

                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-t border-slate-200 dark:border-white/10 pt-4">
                    Vehicle Details
                  </h3>

                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("pathA")}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${
                        activeTab === "pathA"
                          ? "bg-amber-500 text-slate-900"
                          : "text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      Let Customer Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pathB")}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 ${
                        activeTab === "pathB"
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                          : "text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Edit3 size={14} /> I will fill it now
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === "pathA" ? (
                      <motion.div
                        key="pathA"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300">
                          To save time, the customer will enter their Name,
                          Make, and Model when they click their Activation Link.
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pathB"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              First Name
                            </label>
                            <input
                              required={activeTab === "pathB"}
                              name="first_name"
                              placeholder="e.g., Juan"
                              value={formData.first_name}
                              onChange={handleInputChange}
                              className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Last Name
                            </label>
                            <input
                              required={activeTab === "pathB"}
                              name="last_name"
                              placeholder="e.g., Dela Cruz"
                              value={formData.last_name}
                              onChange={handleInputChange}
                              className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Make
                            </label>
                            <input
                              name="make"
                              placeholder="e.g., Toyota"
                              value={formData.make}
                              onChange={handleInputChange}
                              className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Model
                            </label>
                            <input
                              name="model"
                              placeholder="e.g., Vios"
                              value={formData.model}
                              onChange={handleInputChange}
                              className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Year
                            </label>
                            <input
                              type="number"
                              name="year"
                              placeholder="YYYY"
                              value={formData.year}
                              onChange={handleInputChange}
                              className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-8 py-4 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 font-black rounded-xl uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"
                >
                  {submitLoading ? "Processing..." : "Generate Ticket"}{" "}
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* STEP 3: SUCCESS */}
      {successData && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center max-w-xl mx-auto mt-10 shadow-2xl relative overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black italic text-slate-900 dark:text-white mb-2">
            Job Card Active!
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Vehicle queued on the Kanban board.
          </p>

          {successData.warning && (
            <div
              className={`border p-3 rounded-xl text-left flex items-start gap-3 mb-6 text-xs font-bold ${
                successData.warning.includes("Security")
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500"
              }`}
            >
              <AlertTriangle size={16} className="shrink-0" />{" "}
              {successData.warning}
            </div>
          )}

          {successData.magicLink && (
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                <Lock size={12} /> Digital Handshake Required
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={successData.magicLink}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-xs text-slate-500 outline-none"
                />
                <button
                  onClick={() => copyToClipboard(successData.magicLink)}
                  className="bg-amber-500 text-slate-900 px-4 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-amber-400"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <button
            onClick={resetFlow}
            className="w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-black rounded-xl uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Process Next Arrival
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default WorkshopCheckIn;

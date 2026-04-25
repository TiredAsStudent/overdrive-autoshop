import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Car,
  Lock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  UserCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import authService from "../../services/auth.service";

const ActivateCustomer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No activation token found.");
        setLoading(false);
        return;
      }
      try {
        const data = await authService.verifyCustomerInvite(token);
        setUserData(data);
        setFormData({
          first_name: data.firstName === "Valued" ? "" : data.firstName || "",
          last_name: data.lastName === "Customer" ? "" : data.lastName || "",
          make: data.vehicle?.make || "",
          model: data.vehicle?.model || "",
          year: data.vehicle?.year || new Date().getFullYear(),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");

    setSubmitLoading(true);
    setError(null);
    try {
      await authService.activateCustomerAccount(token, password, formData);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <ShieldCheck className="text-amber-500 animate-pulse w-12 h-12" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
      >
        <div className="bg-slate-900 p-8 text-white text-center relative">
          <Car
            size={120}
            className="absolute opacity-5 top-4 left-1/2 -translate-x-1/2 pointer-events-none"
          />
          {success ? (
            <div className="relative z-10 flex flex-col items-center">
              <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
              <h2 className="text-2xl font-black italic">
                Passport Activated!
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Redirecting to login...
              </p>
            </div>
          ) : error && !userData ? (
            <div className="relative z-10 flex flex-col items-center">
              <AlertCircle size={48} className="text-red-500 mb-3" />
              <h2 className="text-2xl font-black italic">Link Invalid</h2>
              <p className="text-sm text-slate-400 mt-2">{error}</p>
              <Link
                to="/login"
                className="mt-6 px-6 py-2 bg-amber-500 text-slate-900 font-bold rounded-xl text-sm"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] mb-1">
                Overdrive Auto Shop
              </p>
              <h2 className="text-2xl font-black italic tracking-tight">
                Complete Profile
              </h2>
            </div>
          )}
        </div>

        {!success && userData && (
          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    required
                    placeholder="e.g., Juan"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    required
                    placeholder="e.g., Dela Cruz"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20">
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Car size={14} /> Plate: {userData.vehicle.plateNumber}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    required
                    placeholder="e.g., Toyota"
                    value={formData.make}
                    onChange={(e) =>
                      setFormData({ ...formData, make: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs dark:text-white outline-none focus:border-amber-500"
                  />
                  <input
                    required
                    placeholder="e.g., Vios"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs dark:text-white outline-none focus:border-amber-500"
                  />
                  <input
                    required
                    type="number"
                    placeholder="YYYY (e.g., 2024)"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  {/* FIX: relative wrapper only around the input & button so it centers perfectly */}
                  <div className="relative mt-1">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 text-sm dark:text-white outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-3 pr-10 text-sm dark:text-white outline-none ${
                        confirmPassword && password !== confirmPassword
                          ? "border-red-500"
                          : "border-slate-200 dark:border-slate-700 focus:border-amber-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-4 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 font-black rounded-xl uppercase text-xs tracking-widest flex justify-center items-center gap-2 mt-4 hover:scale-[1.01] transition-transform shadow-lg"
              >
                {submitLoading ? "Activating..." : "Activate Passport"}{" "}
                <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivateCustomer;

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BannerLogo from "../../assets/Banner_Logo.png";
import Button from "../../components/ui/Buttons";
import { useApp } from "../../context/AppContext";

const ROLE_REDIRECTS = {
  ADMIN: "/sysadmin/dashboard/overview",
  MANAGER: "/manager/dashboard/overview",
  STAFF: "/staff/dashboard/overview",
};

const AccessDenied = ({ user }) => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  // Fire universal toast on mount to alert the user of the security block
  useEffect(() => {
    showToast(
      "Access restricted: You do not have permission to view this module.",
      "error",
    );
  }, [showToast]);

  const handleSafeReturn = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const redirectPath = ROLE_REDIRECTS[user.role];
    navigate(redirectPath || "/login");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 sm:p-12 transition-colors duration-300 z-50 absolute inset-0">
      {/* Top Logo Integration  */}
      <div className="absolute top-8 sm:top-12 w-full flex justify-center opacity-90">
        <img
          src={BannerLogo}
          alt="Overdrive Banner"
          className="h-12 sm:h-16 w-auto object-contain"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto text-center flex flex-col items-center justify-center mt-12"
      >
        {/* Animated Security Icon Graphic */}
        <div className="relative inline-block mb-10 sm:mb-14">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="h-24 w-24 sm:h-32 sm:w-32 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shadow-inner"
          >
            <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16" />
          </motion.div>
          <div className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 h-10 w-10 sm:h-14 sm:w-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl border-[6px] border-slate-50">
            <Lock size={24} className="sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Messaging Section  */}
        <div className="space-y-4 sm:space-y-6 mb-12">
          <p className="text-xs sm:text-sm font-black uppercase text-rose-600 tracking-[0.25em]">
            Error 403: Unauthorized Request
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 uppercase italic tracking-tighter">
            Access Restricted
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 leading-relaxed max-w-md mx-auto">
            Your authenticated account does not have sufficient permission to
            access this protected resource. System role restrictions are
            currently enforced.
          </p>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex flex-col items-center gap-6 w-full">
          <Button
            onClick={handleSafeReturn}
            variant="primary"
            className="w-full sm:w-auto sm:px-12 h-14 sm:h-16 text-[11px] sm:text-xs font-black tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
          >
            <ArrowLeft size={18} className="shrink-0" />
            RETURN TO AUTHORIZED PORTAL
          </Button>

          {/* Secondary subtle return button */}
          <button
            onClick={() => navigate(-1)}
            className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            Or Return To Previous Screen
          </button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 sm:bottom-12 w-full text-center">
        <p className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest">
          Overdrive Auto Shop // Protected Route Guard 403
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;

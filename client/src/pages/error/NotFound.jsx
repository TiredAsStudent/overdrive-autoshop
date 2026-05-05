import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Wrench, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Buttons";

const ROLE_REDIRECTS = {
  ADMIN: "/sysadmin/dashboard/overview",
  MANAGER: "/manager/dashboard/overview",
  STAFF: "/staff/dashboard/overview",
};

const NotFound = ({ user }) => {
  const navigate = useNavigate();

  const handleReturn = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const redirectPath = ROLE_REDIRECTS[user.role];

    navigate(redirectPath || "/login");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="relative inline-block">
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="h-24 w-24 bg-slate-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center text-slate-400"
          >
            <Wrench size={46} />
          </motion.div>

          <div className="absolute -right-2 -top-2 h-10 w-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 shadow-lg border-4 border-white dark:border-slate-950">
            <ShieldAlert size={16} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
            Module Not Available
          </h1>

          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] leading-relaxed">
            The requested page may be unavailable,
            <br />
            relocated, or outside your access authority.
          </p>
        </div>

        <Button
          onClick={handleReturn}
          variant="primary"
          className="w-full h-14 font-black tracking-[0.2em] shadow-xl"
        >
          {user ? "RETURN TO PORTAL DASHBOARD" : "BACK TO LOGIN PORTAL"}
          <ArrowRight size={18} className="ml-2" />
        </Button>

        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
          Overdrive Auto Shop Enterprise OS // Navigation Exception 404
        </p>
      </div>
    </div>
  );
};

export default NotFound;

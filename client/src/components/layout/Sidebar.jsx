import React, { useState } from "react";
import { ChevronRight, Shield, Car, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BannerLogo from "../../assets/OverdriveLogo2.png";
// Pulling all 4 menus
import {
  sysAdminMenu,
  managerMenu,
  staffMenu,
  customerMenu,
} from "../../config/navigation";
import { useApp } from "../../context/AppContext";

const Sidebar = ({ user }) => {
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const { activeVehicle } = useApp();

  // 1. Logic to handle 4 Roles
  const isSysAdmin = user?.role?.toUpperCase() === "ADMIN";
  const isManager = user?.role?.toUpperCase() === "MANAGER";
  const isCustomer = user?.role?.toUpperCase() === "CUSTOMER";

  let menuGroups = staffMenu; // Default to staff
  if (isSysAdmin) menuGroups = sysAdminMenu;
  else if (isManager) menuGroups = managerMenu;
  else if (isCustomer) menuGroups = customerMenu;

  const toggleSubMenu = (label) => {
    setOpenSubMenu(openSubMenu === label ? null : label);
  };

  return (
    <div className="h-screen w-64 shrink-0 bg-white dark:bg-overdrive-dark text-slate-900 dark:text-white flex flex-col border-r border-slate-200 dark:border-white/5 z-30 relative transition-colors duration-300">
      {/* Brand Logo Section */}
      <div
        className="relative h-20 flex items-center justify-center shrink-0 border-b-2 border-yellow-600 shadow-lg overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #facc15 0px, #facc15 16px, #ca8a04 16px, #ca8a04 20px)",
        }}
      >
        <img
          src={BannerLogo}
          alt="Logo"
          className="w-full h-full object-contain scale-110 relative z-10"
        />
      </div>

      {/* ACCESS BADGE */}
      <div className="p-6 flex flex-col gap-1 pb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-gray-500 font-bold">
          {isSysAdmin || isManager
            ? "Access Level"
            : isCustomer
              ? "Portal Status"
              : "Current Context"}
        </span>
        <div className="bg-amber-50 dark:bg-overdrive-yellow/10 border border-amber-200 dark:border-overdrive-yellow/20 rounded-lg px-3 py-2 flex items-center gap-2">
          {(isSysAdmin || isManager) && (
            <Shield className="h-4 w-4 text-amber-600 dark:text-overdrive-yellow" />
          )}
          {isCustomer && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
          {!isSysAdmin && !isManager && !isCustomer && (
            <div className="h-2 w-2 rounded-full bg-overdrive-yellow animate-pulse" />
          )}

          <span className="text-amber-700 dark:text-overdrive-yellow font-black text-sm uppercase italic tracking-tighter">
            {isSysAdmin
              ? "God Mode"
              : isManager
                ? "Enterprise Owner"
                : isCustomer
                  ? "Verified Owner"
                  : user?.assigned_branch || "Main Branch"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <h3 className="px-2 mb-2 text-[10px] font-bold uppercase text-slate-500 dark:text-gray-500">
          Navigations
        </h3>

        {menuGroups.map((group) => {
          const isGroupActive = group.items.some((item) =>
            location.pathname.includes(item.path),
          );
          const isOpen = openSubMenu === group.label || isGroupActive;

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleSubMenu(group.label)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${isGroupActive ? "text-slate-900 dark:text-overdrive-yellow bg-slate-100 dark:bg-white/5" : "text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <div className="flex items-center gap-3">
                  <group.icon
                    size={18}
                    className={
                      isGroupActive
                        ? "text-amber-500 dark:text-overdrive-yellow"
                        : "text-slate-400 dark:text-gray-500 group-hover:text-amber-500 dark:group-hover:text-overdrive-yellow transition-colors"
                    }
                  />
                  {group.label}
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight
                    size={14}
                    className="text-slate-400 dark:text-gray-500"
                  />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 dark:border-white/10">
                      {group.items.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.path}
                            className={`block px-4 py-2 text-xs transition-all relative ${isSubActive ? "text-slate-900 dark:text-overdrive-yellow font-bold" : "font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:translate-x-1"}`}
                          >
                            {isSubActive && (
                              <motion.div
                                layoutId="activeDot"
                                className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-500 dark:bg-overdrive-yellow rounded-r-full"
                              />
                            )}
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ACTIVE SESSION */}
      <AnimatePresence>
        {(activeVehicle || isCustomer) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-auto p-4 bg-amber-500/10 dark:bg-overdrive-yellow/5 border-t border-slate-200 dark:border-white/10"
          >
            <p className="text-[10px] uppercase font-black text-amber-600 dark:text-overdrive-yellow mb-1 tracking-widest flex items-center gap-1">
              {isCustomer ? (
                <ShieldCheck size={10} />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              {isCustomer ? "Authenticated Car" : "Active Session"}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white tracking-widest uppercase italic">
                {isCustomer ? user?.plate || "ABC 1234" : activeVehicle}
              </span>
              <Car size={16} className="text-slate-400 opacity-50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;

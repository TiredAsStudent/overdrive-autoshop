import React, { useState } from "react";
import { ChevronRight, Shield, Car, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BannerLogo from "../../assets/OverdriveLogo2.png";

import { sysAdminMenu, managerMenu, staffMenu } from "../../config/navigation";
import { useApp } from "../../context/AppContext";

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const { activeVehicle } = useApp();

  const isSysAdmin = user?.role?.toUpperCase() === "ADMIN";
  const isManager = user?.role?.toUpperCase() === "MANAGER";

  let menuGroups = staffMenu;
  if (isSysAdmin) menuGroups = sysAdminMenu;
  else if (isManager) menuGroups = managerMenu;

  const toggleSubMenu = (label) => {
    setOpenSubMenu(openSubMenu === label ? null : label);
  };

  // Closes the sidebar automatically when a link is clicked on mobile devices
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* MOBILE OVERLAY: Darkens the screen behind the sidebar when open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER: Responsive transform logic applied here */}
      <div
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 bg-white dark:bg-overdrive-dark text-slate-900 dark:text-white flex flex-col border-r border-slate-200 dark:border-white/5 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* BRAND HEADER */}
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
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-1/2 -translate-y-1/2 right-3 z-20 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full lg:hidden transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ACCESS BADGE */}
        <div className="p-6 flex flex-col gap-1 pb-2 shrink-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-gray-500 font-bold">
            Access Level
          </span>
          <div className="bg-amber-50 dark:bg-overdrive-yellow/10 border border-amber-200 dark:border-overdrive-yellow/20 rounded-lg px-3 py-2 flex items-center gap-2">
            {(isSysAdmin || isManager) && (
              <Shield className="h-4 w-4 text-amber-600 dark:text-overdrive-yellow shrink-0" />
            )}
            {!isSysAdmin && !isManager && (
              <div className="h-2 w-2 rounded-full bg-overdrive-yellow animate-pulse shrink-0" />
            )}
            <span className="text-amber-700 dark:text-overdrive-yellow font-black text-sm uppercase italic tracking-tighter truncate">
              {isSysAdmin
                ? "God Mode"
                : isManager
                  ? "Enterprise Owner"
                  : user?.assigned_branch || "Main Branch"}
            </span>
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          <h3 className="px-2 mb-2 text-[10px] font-bold uppercase text-slate-500 dark:text-gray-500">
            Navigations
          </h3>

          {menuGroups.map((group) => {
            const isGroupActive = group.items.some((item) =>
              location.pathname.includes(item.path),
            );
            const isOpenGroup = openSubMenu === group.label || isGroupActive;

            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleSubMenu(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                    isGroupActive
                      ? "text-slate-900 dark:text-overdrive-yellow bg-slate-100 dark:bg-white/5"
                      : "text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
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
                    animate={{ rotate: isOpenGroup ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight
                      size={14}
                      className="text-slate-400 dark:text-gray-500"
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpenGroup && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 dark:border-white/10">
                        {group.items.map((subItem) => {
                          const isSubActive =
                            location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.path}
                              onClick={handleLinkClick} // Attached auto-close logic here
                              className={`block px-4 py-2 text-xs transition-all relative ${
                                isSubActive
                                  ? "text-slate-900 dark:text-overdrive-yellow font-bold"
                                  : "font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:translate-x-1"
                              }`}
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

        {/* ACTIVE SESSION FOOTER */}
        <AnimatePresence>
          {activeVehicle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-auto p-4 bg-amber-500/10 dark:bg-overdrive-yellow/5 border-t border-slate-200 dark:border-white/10 shrink-0"
            >
              <p className="text-[10px] uppercase font-black text-amber-600 dark:text-overdrive-yellow mb-1 tracking-widest flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Active Session
              </p>

              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white tracking-widest uppercase italic truncate pr-2">
                  {activeVehicle}
                </span>
                <Car size={16} className="text-slate-400 opacity-50 shrink-0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Sidebar;

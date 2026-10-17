import React, { useState, useEffect } from "react";
import { ChevronRight, X, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BannerLogo from "../../assets/OverdriveLogo2.png";

import {
  getMenuByRole,
  getPortalLabelByRole,
  getDashboardRoute,
  isNavItemActive,
} from "../../config/navigation";

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  const location = useLocation();
  const menuGroups = getMenuByRole(user?.role);
  const portalLabel = getPortalLabelByRole(user?.role);
  const homeDashboardPath = getDashboardRoute(user?.role);

  // Track expanded menu groups; automatically open the group matching the active route
  const [openGroups, setOpenGroups] = useState(() => {
    const activeGroup = menuGroups.find((group) =>
      group.items.some((item) => isNavItemActive(location.pathname, item)),
    );
    return activeGroup ? { [activeGroup.label]: true } : {};
  });

  // Sync expanded group when navigating to a new route
  useEffect(() => {
    const activeGroup = menuGroups.find((group) =>
      group.items.some((item) => isNavItemActive(location.pathname, item)),
    );
    if (activeGroup) {
      setOpenGroups((prev) => ({
        ...prev,
        [activeGroup.label]: true,
      }));
    }
  }, [location.pathname, user?.role]);

  const toggleSubMenu = (label) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Closes the sidebar automatically when a link is clicked on mobile/tablet devices
  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* MOBILE OVERLAY: Darkens the screen behind the sidebar when open on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR CONTAINER */}
      <aside
        aria-label="Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-50 h-screen h-dvh w-64 shrink-0 bg-white dark:bg-overdrive-dark text-slate-900 dark:text-white flex flex-col border-r border-slate-200 dark:border-white/10 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* BRAND HEADER */}
        <div
          className="relative h-20 flex items-center justify-center shrink-0 border-b-2 border-yellow-600 shadow-md overflow-hidden"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #facc15 0px, #facc15 16px, #ca8a04 16px, #ca8a04 20px)",
          }}
        >
          <Link
            to={homeDashboardPath}
            onClick={handleLinkClick}
            aria-label="Go to Dashboard Overview"
            className="w-full h-full flex items-center justify-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900"
          >
            <img
              src={BannerLogo}
              alt="Overdrive Auto Shop Logo"
              className="w-full h-full object-contain scale-110 select-none pointer-events-none"
            />
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close Sidebar Menu"
            className="absolute top-1/2 -translate-y-1/2 right-3 z-20 p-1.5 bg-slate-900/50 hover:bg-slate-900/75 text-white rounded-xl lg:hidden transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION LIST */}
        <nav
          aria-label="Main Portal Navigation"
          className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1.5 custom-scrollbar"
        >
          <div className="px-2.5 mb-3 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Main Menu
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-overdrive-yellow border border-amber-500/20">
              {user?.role || "STAFF"}
            </span>
          </div>

          {menuGroups.map((group) => {
            const isGroupActive = group.items.some((item) =>
              isNavItemActive(location.pathname, item),
            );
            const isOpenGroup = !!openGroups[group.label];
            const submenuId = `sidebar-submenu-${group.label
              .toLowerCase()
              .replace(/\s+/g, "-")}`;

            return (
              <div key={group.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSubMenu(group.label)}
                  aria-expanded={isOpenGroup}
                  aria-controls={submenuId}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    isGroupActive
                      ? "text-slate-900 dark:text-overdrive-yellow bg-amber-50/80 dark:bg-white/5 border border-amber-200/70 dark:border-white/10 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <group.icon
                      size={18}
                      aria-hidden="true"
                      className={
                        isGroupActive
                          ? "text-amber-600 dark:text-overdrive-yellow"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-amber-500 dark:group-hover:text-overdrive-yellow transition-colors"
                      }
                    />
                    <span className="truncate">{group.label}</span>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpenGroup ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    aria-hidden="true"
                  >
                    <ChevronRight
                      size={14}
                      className={
                        isGroupActive
                          ? "text-amber-600 dark:text-overdrive-yellow"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpenGroup && (
                    <motion.div
                      id={submenuId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 pl-3 my-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800">
                        {group.items.map((subItem) => {
                          const isSubActive = isNavItemActive(
                            location.pathname,
                            subItem,
                          );
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={handleLinkClick}
                              aria-current={isSubActive ? "page" : undefined}
                              className={`block px-3 py-2 rounded-lg text-xs transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                isSubActive
                                  ? "text-amber-700 dark:text-overdrive-yellow font-black bg-amber-50/60 dark:bg-amber-500/10"
                                  : "font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:translate-x-0.5"
                              }`}
                            >
                              {isSubActive && (
                                <motion.div
                                  layoutId="activeDot"
                                  aria-hidden="true"
                                  className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 dark:bg-overdrive-yellow rounded-r-full"
                                />
                              )}
                              <span className="truncate block">
                                {subItem.name}
                              </span>
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

        {/* SIDEBAR FOOTER: Portal & Branch Context */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div
              aria-hidden="true"
              className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-overdrive-yellow border border-amber-500/20 shrink-0"
            >
              <ShieldCheck size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white truncate">
                {portalLabel}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.branch_name || "Overdrive Auto Shop"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

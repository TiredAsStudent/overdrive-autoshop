import React, { useState, useRef, useEffect } from "react";
import { /* Link, */ useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  UserCircle,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  /* User, */
  /* Settings, */
  Building2,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { getActiveNavigationContext } from "../../config/navigation";
import ConfirmModal from "../shared/ConfirmModal";

const Navbar = ({ user, onMenuClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { showToast } = useApp();

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dropdown automatically when route changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    logout();
    showToast("You have been successfully logged out.", "success");
    navigate("/login");
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "System User";

  let displayRole = "Staff";
  if (user?.role?.toUpperCase() === "ADMIN") displayRole = "Administrator";
  if (user?.role?.toUpperCase() === "MANAGER") displayRole = "Manager";

  const { portalLabel, groupLabel, pageName } = getActiveNavigationContext(
    location.pathname,
    user?.role,
  );

  // const isProfileActive = location.pathname.startsWith("/profile");
  // const isSettingsActive = location.pathname.startsWith("/settings");

  return (
    <>
      <header className="h-16 shrink-0 w-full border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-overdrive-dark/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 transition-colors duration-300">
        {/* Left Section: Mobile Hamburger Menu + Active Breadcrumb Context */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors lg:hidden cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Open Sidebar Menu"
          >
            <Menu size={22} aria-hidden="true" />
          </button>

          {/* Dynamic Breadcrumb & Portal Indicator */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 min-w-0"
          >
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0">
              {portalLabel}
            </span>

            <ChevronRight
              size={14}
              aria-hidden="true"
              className="hidden md:block text-slate-400 dark:text-slate-600 shrink-0"
            />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 hidden sm:inline truncate">
                {groupLabel}
              </span>
              <ChevronRight
                size={13}
                aria-hidden="true"
                className="hidden sm:block text-slate-300 dark:text-slate-600 shrink-0"
              />
              <span
                aria-current="page"
                className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase truncate"
              >
                {pageName}
              </span>
            </div>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4 ml-4 shrink-0">
          {/* BRANCH INDICATOR BADGE (When user is assigned to a branch) */}
          {user?.branch_name && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Building2
                size={14}
                aria-hidden="true"
                className="text-amber-500 dark:text-overdrive-yellow"
              />
              <span className="truncate max-w-[160px]">{user.branch_name}</span>
            </div>
          )}

          {/* THEME TOGGLE */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-overdrive-yellow border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? (
              <Sun size={19} aria-hidden="true" />
            ) : (
              <Moon size={19} aria-hidden="true" />
            )}
          </button>

          {/* DIVIDER */}
          <div
            aria-hidden="true"
            className="h-7 w-px bg-slate-200 dark:bg-white/10 hidden sm:block transition-colors"
          />

          {/* USER PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="user-menu-button"
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="menu"
              aria-label="Open user account menu"
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent hover:border-slate-200/80 dark:hover:border-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 font-bold transition-colors">
                  {displayRole}
                </p>
              </div>

              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 group-hover:border-amber-500 dark:group-hover:border-overdrive-yellow group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow transition-colors shrink-0">
                <UserCircle
                  size={20}
                  aria-hidden="true"
                  className="sm:w-5 sm:h-5"
                />
              </div>

              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`text-slate-400 dark:text-slate-400 hidden sm:block transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-amber-500" : ""
                }`}
              />
            </button>

            {/* DROPDOWN MENU */}
            {isDropdownOpen && (
              <div
                role="menu"
                aria-labelledby="user-menu-button"
                className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 py-2 z-50 transition-all origin-top-right"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-widest mt-0.5">
                    {displayRole}
                  </p>
                  {user?.email && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {user.email}
                    </p>
                  )}
                </div>

                <div className="flex flex-col py-1">
                  {/*
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors ${
                      isProfileActive
                        ? "text-amber-600 dark:text-overdrive-yellow bg-amber-50/70 dark:bg-white/5"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <User
                      size={15}
                      className={
                        isProfileActive
                          ? "text-amber-500 dark:text-overdrive-yellow"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    />
                    My Profile
                  </Link>

                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors ${
                      isSettingsActive
                        ? "text-amber-600 dark:text-overdrive-yellow bg-amber-50/70 dark:bg-white/5"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Settings
                      size={15}
                      className={
                        isSettingsActive
                          ? "text-amber-500 dark:text-overdrive-yellow"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    />
                    Account Settings
                  </Link>

                  <div className="h-px bg-slate-100 dark:bg-white/10 my-1.5 mx-3" />
                  */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer focus-visible:outline-none focus-visible:bg-red-50 dark:focus-visible:bg-red-500/10"
                  >
                    <LogOut size={15} aria-hidden="true" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to sign in again to access the system."
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default Navbar;

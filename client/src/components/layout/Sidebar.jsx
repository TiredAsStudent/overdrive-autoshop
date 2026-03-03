import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Car,
  Package,
  ScanLine,
  Wrench,
  PieChart,
  Users,
  MapPin,
  ClipboardList,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import logoImg from "../../assets/overdrive_logo-removebg-preview.png";

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: `/${user?.role}`,
      icon: LayoutDashboard,
      roles: ["admin", "staff"],
    },
    {
      name: "Vehicle Archive",
      path: `/${user?.role}/vehicles`,
      icon: Car,
      roles: ["admin", "staff"],
    },
    {
      name: "Job Cards",
      path: `/${user?.role}/jobs`,
      icon: Wrench,
      roles: ["admin", "staff"],
    },
    {
      name: "Inventory",
      path: `/${user?.role}/inventory`,
      icon: Package,
      roles: ["admin", "staff"],
    },
    {
      name: "OCR Intake",
      path: `/${user?.role}/ocr`,
      icon: ScanLine,
      roles: ["admin", "staff"],
    },
    {
      name: "Financials",
      path: `/admin/financials`,
      icon: PieChart,
      roles: ["admin"],
    },
    {
      name: "Branch Control",
      path: `/admin/branches`,
      icon: MapPin,
      roles: ["admin"],
    },
    {
      name: "Audit Logs",
      path: `/admin/audit`,
      icon: ClipboardList,
      roles: ["admin"],
    },
    {
      name: "Manage Users",
      path: `/admin/users`,
      icon: Users,
      roles: ["admin"],
    },
  ];

  const allowedLinks = navItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container*/}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-zinc-950 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-zinc-800 md:static md:inset-0 
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        {/* Top Header & Logo Area */}
        <div
          className={`flex h-20 items-center border-b border-zinc-800 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : "justify-between px-5"}`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-white p-1 rounded-lg shadow-sm shrink-0">
                <img
                  src={logoImg}
                  alt="Overdrive Logo"
                  className="h-6 w-auto object-contain"
                />
              </div>
              <span className="text-white font-black tracking-widest text-base uppercase mt-0.5">
                Overdrive
              </span>
            </div>
          )}

          <button
            onClick={() => {
              if (window.innerWidth >= 768) setIsCollapsed(!isCollapsed);
              else setIsMobileOpen(false);
            }}
            className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800/50 rounded-lg transition-all focus:outline-none shrink-0"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 mt-6 px-3 space-y-2">
          {allowedLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.path === `/${user?.role}`}
                onClick={() => {
                  if (window.innerWidth < 768) setIsMobileOpen(false);
                }}
                className={({ isActive }) =>
                  `group relative flex items-center h-11 rounded-xl transition-all duration-300 overflow-visible shrink-0 ${
                    isCollapsed
                      ? "justify-center w-11 mx-auto"
                      : "px-4 gap-4 w-full"
                  } ${
                    isActive
                      ? "bg-yellow-400 text-zinc-950 font-black shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white font-semibold"
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />

                {!isCollapsed && (
                  <span className="whitespace-nowrap text-[15px] transition-all duration-300">
                    {link.name}
                  </span>
                )}

                {/* Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-5 px-3 py-2 bg-yellow-400 text-zinc-950 text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-100 flex items-center">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-yellow-400 rotate-45 rounded-sm"></div>
                    {link.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Area: Settings & Logout */}
        <div className="p-4 mb-2 border-t border-zinc-800/50 flex flex-col gap-2 shrink-0">
          {user?.role === "admin" && (
            <NavLink
              to="/admin/settings"
              onClick={() => {
                if (window.innerWidth < 768) setIsMobileOpen(false);
              }}
              className={({ isActive }) =>
                `group relative flex items-center h-11 rounded-xl transition-all duration-300 overflow-visible ${
                  isCollapsed
                    ? "justify-center w-11 mx-auto"
                    : "px-4 gap-4 w-full"
                } ${
                  isActive
                    ? "bg-yellow-400 text-zinc-950 font-black shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white font-semibold"
                }`
              }
            >
              <Settings size={20} className="shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap text-[15px] transition-all duration-300">
                  Settings
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-5 px-3 py-2 bg-yellow-400 text-zinc-950 text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-50 flex items-center">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-yellow-400 rotate-45 rounded-sm"></div>
                  Settings
                </div>
              )}
            </NavLink>
          )}

          <button
            onClick={handleLogout}
            className={`group relative flex items-center h-11 rounded-xl hover:bg-red-500 hover:text-white text-zinc-400 transition-all duration-300 overflow-visible ${
              isCollapsed
                ? "justify-center w-11 mx-auto bg-zinc-900"
                : "px-4 gap-4 w-full"
            }`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap text-[15px] font-bold">
                Logout
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-5 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-100 flex items-center">
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rotate-45 rounded-sm"></div>
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

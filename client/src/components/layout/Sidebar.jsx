import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Search, 
  ScanLine, 
  Package, 
  CheckSquare, 
  BarChart3, 
  Truck,
  History,
  Users
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import BannerLogo from '../../assets/OverdriveLogo2.png'; // Make sure this path is correct!

const Sidebar = ({ user }) => {
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const menuGroups = [
    {
      label: "Workshop (Maker)",
      items: [
        { name: 'Floor (Kanban)', icon: LayoutDashboard, path: '/staff/workshop' },
        { name: 'Check-In', icon: ClipboardList, path: '/check-in' },
        { name: 'Medical Records', icon: Search, path: '/records' },
        { name: 'OCR Intake', icon: ScanLine, path: '/ocr' },
        { name: 'Local Inventory', icon: Package, path: '/inventory' },
      ]
    },
    ...(isAdmin ? [{
      label: "Governance (Checker)",
      items: [
        { name: 'Approval Queue', icon: CheckSquare, path: '/approvals' },
        { name: 'Financials', icon: BarChart3, path: '/analytics' },
        { name: 'Stock Transfers', icon: Truck, path: '/transfers' },
        { name: 'Resource Mgmt', icon: Users, path: '/resources' },
        { name: 'Audit Trail', icon: History, path: '/audit' },
      ]
    }] : [])
  ];

  return (
    <div className="h-screen w-64 shrink-0 bg-overdrive-dark text-white flex flex-col border-r border-white/5 z-30 relative">
      
     
     {/* 1. Brand Logo Section - Custom Corrugated Metal Background */}
      {/* 1. Brand Logo Section - Custom Corrugated Metal Background */}
      <div 
        className="relative h-20 flex items-center justify-center shrink-0 border-b-2 border-yellow-600 shadow-lg overflow-hidden"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #facc15 0px, #facc15 16px, #ca8a04 16px, #ca8a04 20px)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>

        <img 
          src={BannerLogo} 
          alt="Overdrive Autoworks" 
          // THE FIX: 
          // 1. Removed 'p-2' to give it 16px more room instantly.
          // 2. Added 'scale-110' to visually zoom it in and make it wider!
          className="w-full h-full object-contain scale-110 relative z-10 drop-shadow-md"
        />
      </div>
      {/* 2. Branch Context Badge */}
      <div className="p-6 flex flex-col gap-1 pb-2 shrink-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Current Context</span>
        <div className="bg-overdrive-yellow/10 border border-overdrive-yellow/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-overdrive-yellow animate-pulse" />
          <span className="text-overdrive-yellow font-bold text-sm tracking-tight">
            {user?.assigned_branch || 'Main Branch'}
          </span>
        </div>
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                      ${isActive 
                        ? 'bg-overdrive-yellow text-black' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    <item.icon size={18} className={isActive ? 'text-black' : 'text-gray-500 group-hover:text-overdrive-yellow transition-colors'} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

    </div>
  );
};

export default Sidebar;
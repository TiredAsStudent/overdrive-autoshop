import {
  LayoutDashboard,
  CheckSquare,
  Wrench,
  Package,
  CircleDollarSign,
  Users2,
  Settings2,
  Home,
  FileText,
  Camera,
  Inbox,
  UserCircle,
  History,
  ShieldCheck,
  Car,
  Activity,
  Receipt,
  ShieldAlert,
  Database,
  Server,
} from "lucide-react";

// === SYSTEM ADMIN MENU ===
export const sysAdminMenu = [
  {
    label: "Dashboard",
    icon: Activity,
    items: [{ name: "Overview", path: "/sysadmin/overview" }],
  },
  {
    label: "Management",
    icon: Database,
    items: [
      { name: "Branches", path: "/sysadmin/management/branches" },
      { name: "Users", path: "/sysadmin/management/users" },
    ],
  },
  {
    label: "Settings",
    icon: Settings2,
    items: [{ name: "Business", path: "/sysadmin/settings/business" }],
  },
  {
    label: "Records",
    icon: ShieldAlert,
    items: [
      { name: "Audit", path: "/sysadmin/records/audit" },
      { name: "Health", path: "/sysadmin/records/health" },
    ],
  },
];

// === MANAGER / OWNER MENU ===
export const managerMenu = [];

// === STAFF MENU ===
export const staffMenu = [];

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
    items: [
      { name: "Business", path: "/sysadmin/settings/business" },
      { name: "Integrations", path: "/sysadmin/settings/integrations" },
    ],
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
export const managerMenu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { name: "Overview", path: "/manager/dashboard/overview" },
      { name: "Branch Stats", path: "/manager/dashboard/ranking" },
    ],
  },
  {
    label: "Approval Queue",
    icon: CheckSquare,
    items: [
      { name: "OCR Verifications", path: "/manager/approvals/ocr" },
      { name: "Stock Adjustments", path: "/manager/approvals/stock" },
    ],
  },
  {
    label: "Workshop",
    icon: Wrench,
    items: [
      { name: "Services", path: "/manager/workshop/services" },
      { name: "Mechanics", path: "/manager/workshop/mechanics" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    items: [
      { name: "Stock Overview", path: "/manager/inventory/overview" },
      { name: "Bulk Order", path: "/manager/inventory/bulk" },
      { name: "Transfers", path: "/manager/inventory/transfers" },
    ],
  },
  {
    label: "Finance",
    icon: CircleDollarSign,
    items: [
      { name: "Accounts", path: "/manager/finance/accounts" },
      { name: "Reports", path: "/manager/finance/reports" },
      { name: "Taxes", path: "/manager/finance/taxes" },
    ],
  },
  {
    label: "Customers",
    icon: Users2,
    items: [
      { name: "Directory", path: "/manager/customers/directory" },
      { name: "Service History", path: "/manager/customers/history" },
    ],
  },
];

// === STAFF MENU ===
export const staffMenu = [
  {
    label: "Dashboard",
    icon: Home,
    items: [{ name: "Local Stats", path: "/staff/dashboard/stats" }],
  },
  {
    label: "Workshop",
    icon: LayoutDashboard,
    items: [
      { name: "Check-In", path: "/staff/workshop/check-in" },
      { name: "Kanban Board", path: "/staff/workshop/kanban" },
    ],
  },
  {
    label: "Billing",
    icon: FileText,
    items: [
      { name: "Estimates", path: "/staff/billing/estimates" },
      { name: "Sales Orders", path: "/staff/billing/orders" },
      { name: "Invoices", path: "/staff/billing/invoices" },
    ],
  },
  {
    label: "OCR Intake",
    icon: Camera,
    items: [
      { name: "New Intake", path: "/staff/ocr/new" },
      { name: "Submission History", path: "/staff/ocr/history" },
    ],
  },
  {
    label: "Inventory",
    icon: Inbox,
    items: [
      { name: "Stock Room", path: "/staff/inventory/stock" },
      { name: "Stock Requests", path: "/staff/inventory/requests" },
    ],
  },
  {
    label: "Customers",
    icon: UserCircle,
    items: [
      { name: "Directory", path: "/staff/customers/directory" },
      { name: "Service Passport", path: "/staff/customers/passport" },
      { name: "Portal Support", path: "/staff/customers/support" },
    ],
  },
];

// === CUSTOMER MENU ===
export const customerMenu = [
  {
    label: "Dashboard",
    icon: Home,
    items: [
      { name: "Live Status", path: "/customer/dashboard/status" },
      { name: "Instructions", path: "/customer/dashboard/instructions" },
    ],
  },
  {
    label: "History",
    icon: History,
    items: [
      { name: "Timeline", path: "/customer/history/timeline" },
      { name: "Technical Details", path: "/customer/history/logs" },
    ],
  },
  {
    label: "Documents",
    icon: Receipt,
    items: [
      { name: "Estimates", path: "/customer/documents/estimates" },
      { name: "Invoices", path: "/customer/documents/invoices" },
    ],
  },
  {
    label: "My Garage",
    icon: Car,
    items: [{ name: "Vehicle Stalls", path: "/customer/garage" }],
  },
];

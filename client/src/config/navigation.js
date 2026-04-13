import { 
  LayoutDashboard, CheckSquare, Wrench, Package, CircleDollarSign, 
  Users2, Settings2, Home, FileText, Camera, Inbox, UserCircle 
} from 'lucide-react';

export const adminMenu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { name: 'Overview', path: '/admin/dashboard/overview' },
      { name: 'Branch Ranking', path: '/admin/dashboard/ranking' },
    ]
  },
  {
    label: "Approval Queue",
    icon: CheckSquare,
    items: [
      { name: 'OCR Verifications', path: '/admin/approvals/ocr' },
      { name: 'Stock Adjustments', path: '/admin/approvals/stock' },
    ]
  },
  {
    label: "Workshop",
    icon: Wrench,
    items: [
      { name: 'Services', path: '/admin/workshop/services' },
      { name: 'Mechanics', path: '/admin/workshop/mechanics' },
    ]
  },
  {
    label: "Inventory",
    icon: Package,
    items: [
      { name: 'Stock Overview', path: '/admin/inventory/overview' },
      { name: 'Bulk Order', path: '/admin/inventory/bulk' },
      { name: 'Transfers', path: '/admin/inventory/transfers' },
    ]
  },
  {
    label: "Finance",
    icon: CircleDollarSign,
    items: [
      { name: 'Accounts', path: '/admin/finance/accounts' },
      { name: 'Reports', path: '/admin/finance/reports' },
      { name: 'Taxes', path: '/admin/finance/taxes' },
    ]
  },
  {
    label: "Customers",
    icon: Users2,
    items: [
      { name: 'Directory', path: '/admin/customers/directory' },
      { name: 'Service History', path: '/admin/customers/history' },
    ]
  },
  {
    label: "Control Center",
    icon: Settings2,
    items: [
      { name: 'User Management', path: '/admin/control/users' },
      { name: 'Settings', path: '/admin/control/settings' },
      { name: 'Logs', path: '/admin/control/logs' },
    ]
  }
];

export const staffMenu = [
  {
    label: "Dashboard",
    icon: Home,
    items: [
      { name: 'Local Stats', path: '/staff/dashboard/stats' },
      { name: 'Quick Actions', path: '/staff/dashboard/actions' },
    ]
  },
  {
    label: "Workshop Floor",
    icon: LayoutDashboard,
    items: [
      { name: 'Check-In', path: '/staff/workshop/check-in' },
      { name: 'Kanban Board', path: '/staff/workshop/kanban' },
    ]
  },
  {
    label: "Billing",
    icon: FileText,
    items: [
      { name: 'Estimates', path: '/staff/billing/estimates' },
      { name: 'Sales Orders', path: '/staff/billing/orders' },
      { name: 'Invoices', path: '/staff/billing/invoices' },
    ]
  },
  {
    label: "OCR Intake",
    icon: Camera,
    items: [
      { name: 'New Intake', path: '/staff/ocr/new' },
      { name: 'Submission History', path: '/staff/ocr/history' },
    ]
  },
  {
    label: "Inventory",
    icon: Inbox,
    items: [
      { name: 'Stock Room', path: '/staff/inventory/stock' },
      { name: 'Movement Requests', path: '/staff/inventory/requests' },
    ]
  },
  {
    label: "Customers",
    icon: UserCircle,
    items: [
      { name: 'Directory', path: '/staff/customers/directory' },
      { name: 'Service Passport', path: '/staff/customers/passport' },
    ]
  }
];
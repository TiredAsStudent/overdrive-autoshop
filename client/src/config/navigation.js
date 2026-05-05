import {
  Activity,
  Database,
  Settings2,
  ShieldAlert,
  GitBranch,
  Users2,
  Building2,
  ClipboardCheck,
  Wrench,
  Package,
  Calculator,
  FileBarChart2,
  WalletCards,
} from "lucide-react";

// === SYSTEM ADMIN MENU ===
export const sysAdminMenu = [
  {
    label: "Dashboard",
    icon: Activity,
    items: [{ name: "Overview", path: "/sysadmin/dashboard/overview" }],
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
export const managerMenu = [
  {
    label: "Dashboard",
    icon: Activity,
    items: [{ name: "Overview", path: "/manager/dashboard/overview" }],
  },

  {
    label: "Approvals",
    icon: ClipboardCheck,
    items: [
      {
        name: "Expense Approvals",
        path: "/manager/approvals/expense-approvals",
      },
      { name: "Stock Adjustment", path: "/manager/approvals/stock-adjustment" },
      { name: "Rejection Logs", path: "/manager/approvals/rejection-logs" },
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
      { name: "Stock Overview", path: "/manager/inventory/stock-overview" },
      { name: "Stock Value", path: "/manager/inventory/stock-value" },
      { name: "COGS Tracking", path: "/manager/inventory/cogs-tracking" },
      { name: "Stock Transfers", path: "/manager/inventory/stock-transfers" },
    ],
  },

  {
    label: "Accounting",
    icon: Calculator,
    items: [
      { name: "General Ledger", path: "/manager/accounting/general-ledger" },
      {
        name: "Chart of Accounts",
        path: "/manager/accounting/chart-of-accounts",
      },
      { name: "Journal Entries", path: "/manager/accounting/journal-entries" },
      { name: "Trial Balance", path: "/manager/accounting/trial-balance" },
      { name: "VAT Ledger", path: "/manager/accounting/vat-ledger" },
    ],
  },

  {
    label: "Reports",
    icon: FileBarChart2,
    items: [
      { name: "Income Statement", path: "/manager/reports/income-statement" },
      { name: "Balance Sheet", path: "/manager/reports/balance-sheet" },
      {
        name: "Cash Flow Statement",
        path: "/manager/reports/cash-flow-statement",
      },
      { name: "Revenue Reports", path: "/manager/reports/revenue-reports" },
      { name: "Expense Reports", path: "/manager/reports/expense-reports" },
    ],
  },

  {
    label: "Balances",
    icon: WalletCards,
    items: [
      { name: "Accounts Payable", path: "/manager/balances/accounts-payable" },
      {
        name: "Accounts Receivable",
        path: "/manager/balances/accounts-receivable",
      },
      { name: "Supplier Ledger", path: "/manager/balances/supplier-ledger" },
    ],
  },
];

// === STAFF MENU ===
export const staffMenu = [];

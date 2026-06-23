import {
  Activity,
  Database,
  Settings2,
  ShieldAlert,
  ClipboardCheck,
  Wrench,
  Package,
  Calculator,
  FileBarChart2,
  WalletCards,
  ShoppingCart,
  Receipt,
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
      {
        name: "Branch Registry",
        path: "/sysadmin/management/branches-registry",
      },
      { name: "Users Accounts", path: "/sysadmin/management/users-accounts" },
    ],
  },
  {
    label: "Settings",
    icon: Settings2,
    items: [
      { name: "Business Logic", path: "/sysadmin/settings/business-logic" },
    ],
  },
  {
    label: "Records",
    icon: ShieldAlert,
    items: [
      { name: "Audit Trail", path: "/sysadmin/records/audit-trail" },
      { name: "Database Backups", path: "/sysadmin/records/database-backups" },
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
export const staffMenu = [
  {
    label: "Dashboard",
    icon: Activity,
    items: [{ name: "Overview", path: "/staff/dashboard/overview" }],
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    items: [
      { name: "Estimates", path: "/staff/sales/estimates" },
      { name: "Sales Orders", path: "/staff/sales/sales-orders" },
      { name: "Invoices", path: "/staff/sales/invoices" },
      { name: "Payment Postings", path: "/staff/sales/payments-postings" },
      { name: "Sales History", path: "/staff/sales/sales-history" },
    ],
  },
  {
    label: "Expenses",
    icon: Receipt,
    items: [
      { name: "Receipt Scanning", path: "/staff/expenses/receipt-scanning" },
      { name: "Submission Status", path: "/staff/expenses/submission-status" },
      { name: "Expense History", path: "/staff/expenses/expense-history" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    items: [
      { name: "Stock Inventory", path: "/staff/inventory/stock-inventory" },
      { name: "Stock Adjustments", path: "/staff/inventory/stock-adjustments" },
      { name: "Stock Transfers", path: "/staff/inventory/stock-transfers" },
    ],
  },
];

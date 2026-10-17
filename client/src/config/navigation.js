import {
  Database,
  Settings2,
  ShieldAlert,
  LayoutDashboard,
  Wrench,
  Boxes,
  ClipboardCheck,
  Calculator,
  FileBarChart,
  ShoppingCart,
  ShoppingBag,
  ScanText,
} from "lucide-react";

// === SYSTEM ADMIN MENU ===
export const sysAdminMenu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
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
      { name: "User Accounts", path: "/sysadmin/management/users-accounts" },
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
    icon: LayoutDashboard,
    items: [{ name: "Overview", path: "/manager/dashboard/overview" }],
  },
  {
    label: "Services",
    icon: Wrench,
    items: [
      { name: "Service Catalog", path: "/manager/services/service-catalog" },
    ],
  },
  {
    label: "Inventory",
    icon: Boxes,
    items: [
      { name: "Stock Management", path: "/manager/inventory/stock-management" },
      {
        name: "Stock Adjustments",
        path: "/manager/inventory/stock-adjustments",
      },
      { name: "Stock Transfers", path: "/manager/inventory/stock-transfers" },
    ],
  },
  {
    label: "Purchases",
    icon: ShoppingBag,
    items: [
      { name: "Vendors", path: "/manager/purchases/vendors" },
      { name: "Payments", path: "/manager/purchases/payments" },
    ],
  },
  {
    label: "Approvals",
    icon: ClipboardCheck,
    items: [
      {
        name: "Expense Approvals",
        path: "/manager/approvals/expense-approvals",
      },
      {
        name: "Purchase Order Approvals",
        path: "/manager/approvals/purchase-order-approvals",
      },
      {
        name: "Receipt Approvals",
        path: "/manager/approvals/receipt-approvals",
      },
    ],
  },
  {
    label: "Accounting",
    icon: Calculator,
    items: [
      {
        name: "Chart of Accounts",
        path: "/manager/accounting/chart-of-accounts",
      },
      { name: "Journal Entries", path: "/manager/accounting/journal-entries" },
      { name: "General Ledger", path: "/manager/accounting/general-ledger" },
      { name: "Trial Balance", path: "/manager/accounting/trial-balance" },
    ],
  },
  {
    label: "Reports",
    icon: FileBarChart,
    items: [
      { name: "Income Statement", path: "/manager/reports/income-statement" },
      { name: "Balance Sheet", path: "/manager/reports/balance-sheet" },
      {
        name: "Cash Flow Statement",
        path: "/manager/reports/cash-flow-statement",
      },
      { name: "Expense Reports", path: "/manager/reports/expense-reports" },
      { name: "Sales Reports", path: "/manager/reports/sales-reports" },
      { name: "Inventory Reports", path: "/manager/reports/inventory-reports" },
      {
        name: "Receivables Reports",
        path: "/manager/reports/receivables-reports",
      },
      { name: "Payables Reports", path: "/manager/reports/payables-reports" },
      { name: "Tax/VAT Reports", path: "/manager/reports/tax-vat-reports" },
    ],
  },
];

// === STAFF MENU ===
export const staffMenu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [{ name: "Overview", path: "/staff/dashboard/overview" }],
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    items: [
      { name: "Customers", path: "/staff/sales/customers" },
      { name: "Estimates", path: "/staff/sales/estimates" },
      { name: "Sales Orders", path: "/staff/sales/sales-orders" },
      { name: "Invoices", path: "/staff/sales/invoices" },
      { name: "Payments", path: "/staff/sales/payments" },
    ],
  },
  {
    label: "Purchases",
    icon: ShoppingBag,
    items: [
      { name: "Expenses", path: "/staff/purchases/expenses" },
      { name: "Purchase Orders", path: "/staff/purchases/purchase-orders" },
      { name: "Bills", path: "/staff/purchases/bills" },
    ],
  },
  {
    label: "Inventory",
    icon: Boxes,
    items: [
      { name: "Stock Management", path: "/staff/inventory/stock-management" },
      { name: "Stock Adjustments", path: "/staff/inventory/stock-adjustments" },
    ],
  },
  {
    label: "Receipts",
    icon: ScanText,
    items: [
      {
        name: "Receipt Scanner",
        path: "/staff/receipts/receipt-scanner",
        matchPaths: ["/staff/receipts/verification"],
      },
      { name: "Receipt History", path: "/staff/receipts/receipt-history" },
    ],
  },
];

// === SHARED NAVIGATION HELPERS ===
export const getMenuByRole = (role) => {
  const normalizedRole = role?.toUpperCase();
  if (normalizedRole === "ADMIN") return sysAdminMenu;
  if (normalizedRole === "MANAGER") return managerMenu;
  return staffMenu;
};

export const getPortalLabelByRole = (role) => {
  const normalizedRole = role?.toUpperCase();
  if (normalizedRole === "ADMIN") return "System Admin Portal";
  if (normalizedRole === "MANAGER") return "Manager Portal";
  return "Staff Portal";
};

export const isNavItemActive = (pathname, item) => {
  if (!pathname || !item?.path) return false;
  if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
    return true;
  }
  if (Array.isArray(item.matchPaths)) {
    return item.matchPaths.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }
  return false;
};

export const getActiveNavigationContext = (pathname, role) => {
  const portalLabel = getPortalLabelByRole(role);

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return {
      portalLabel,
      groupLabel: "Account",
      pageName: "My Profile",
    };
  }

  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return {
      portalLabel,
      groupLabel: "Account",
      pageName: "Account Settings",
    };
  }

  if (pathname.startsWith("/staff/receipts/verification")) {
    return {
      portalLabel,
      groupLabel: "Receipts",
      pageName: "Receipt Verification",
    };
  }

  const menuGroups = getMenuByRole(role);
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (isNavItemActive(pathname, item)) {
        return {
          portalLabel,
          groupLabel: group.label,
          pageName: item.name,
        };
      }
    }
  }

  return {
    portalLabel,
    groupLabel: "Workspace",
    pageName: "Overview",
  };
};

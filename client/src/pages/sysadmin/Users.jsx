import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  ShieldCheck,
  MapPin,
  Mail,
  Clock,
  MoreVertical,
  Search,
  Users,
  Key,
  Send,
  AlertCircle,
  RefreshCw,
  UserX,
  Edit,
  UserCheck,
  PowerOff,
  Globe,
  Plus,
  X,
} from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import { userService } from "../../services/sysadmin/user.service";
import { branchService } from "../../services/sysadmin/branch.service";
import { useAuth } from "../../context/AuthContext";

const UsersTab = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  // Global Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  // Invite Modal State
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "STAFF",
    branchId: "",
  });

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    branchId: "",
  });

  const menuRef = useRef();

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parallel Fetch: Loads Users and Branches simultaneously
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userRoster, branchDataResponse] = await Promise.all([
        userService.getRoster(),
        branchService.getAllBranches(),
      ]);

      setUsers(userRoster || []);

      // Extract active branches safely
      const rawBranches = branchDataResponse?.data || branchDataResponse || [];
      const activeBranches = Array.isArray(rawBranches)
        ? rawBranches.filter((b) => b.is_active)
        : [];
      setBranches(activeBranches);

      // Pre-select the first active branch for invites
      if (activeBranches.length > 0) {
        setInviteForm((prev) => ({
          ...prev,
          branchId: activeBranches[0].id.toString(),
        }));
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInviteSubmit = async (e) => {
    if (e) e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    try {
      const payload = {
        ...inviteForm,
        // Strict Branch Lock Enforcement before sending to backend
        branchId:
          inviteForm.role === "MANAGER"
            ? null
            : parseInt(inviteForm.branchId, 10),
      };
      await userService.inviteUser(payload);
      setIsInviting(false);
      setInviteForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "STAFF",
        branchId: branches.length > 0 ? branches[0].id.toString() : "",
      });
      fetchData();
    } catch (error) {
      setInviteError(error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        role: editForm.role,
        branchId:
          editForm.role === "MANAGER" || editForm.role === "ADMIN"
            ? null
            : parseInt(editForm.branchId, 10),
      };
      await userService.updateUser(editForm.id, payload);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      setEditError(error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const executeAction = async (actionFn, successMessage) => {
    try {
      await actionFn();
      if (successMessage) alert(successMessage); // Optional generic toast fallback
      fetchData();
    } catch (error) {
      alert(error.message || "An error occurred.");
    }
  };

  const handleMenuAction = (userId, action, userObj = null) => {
    setOpenMenuId(null);

    if (action === "EDIT") {
      setEditError(null);
      setEditForm({
        id: userObj.id,
        firstName: userObj.first_name,
        lastName: userObj.last_name,
        email: userObj.email,
        role: userObj.role,
        branchId:
          userObj.branch_id ||
          (branches.length > 0 ? branches[0].id.toString() : ""),
      });
      setIsEditing(true);
      return;
    }

    if (action === "RESEND") {
      setConfirmConfig({
        isOpen: true,
        title: "Resend Invitation",
        message:
          "This will generate a new 2-hour activation link and send it directly to the user's email. Proceed?",
        confirmText: "Send Invite",
        variant: "info",
        onConfirm: () =>
          executeAction(
            () => userService.resendInvite(userId),
            "New invite sent securely.",
          ),
      });
      return;
    }

    if (action === "DEACTIVATE") {
      setConfirmConfig({
        isOpen: true,
        title: "Deactivate User",
        message:
          "Are you sure you want to deactivate this user? They will lose access to the system and will be signed out of all active sessions.",
        confirmText: "Deactivate User",
        variant: "danger",
        onConfirm: () =>
          executeAction(() =>
            userService.updateUser(userId, { isActive: false }),
          ),
      });
      return;
    }

    if (action === "ACTIVATE") {
      setConfirmConfig({
        isOpen: true,
        title: "Reactivate User",
        message:
          "Are you sure you want to reactivate this user? They will regain access to the system.",
        confirmText: "Reactivate User",
        variant: "info",
        onConfirm: () =>
          executeAction(() =>
            userService.updateUser(userId, { isActive: true }),
          ),
      });
      return;
    }

    if (action === "KILL_SESSION") {
      setConfirmConfig({
        isOpen: true,
        title: "Terminate Active Sessions",
        message:
          "This will sign the user out of all active sessions. They will need to sign in again to continue using the system.",
        confirmText: "Terminate Sessions",
        variant: "danger",
        onConfirm: () =>
          executeAction(
            () => userService.killSession(userId),
            "All active sessions have been terminated.",
          ),
      });
      return;
    }
  };

  const activeCount = users.filter((u) => u.account_status === "ACTIVE").length;
  const pendingCount = users.filter(
    (u) => u.account_status === "PENDING",
  ).length;
  const filteredUsers = users.filter(
    (user) =>
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 w-full pb-10">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        {/* Header Title Section */}
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Users className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Users Accounts
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              User Accounts & Access Control
            </p>
          </div>
        </div>

        {/* Filter & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-xs lg:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <button
            onClick={() => setIsInviting(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Plus size={16} /> Invite User
          </button>
        </div>
      </div>

      {/* 2. Top Stats KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm relative overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col justify-between">
          <div className="absolute right-0 top-0 p-4 text-slate-900 dark:text-white opacity-[0.03] dark:opacity-10 pointer-events-none">
            <ShieldCheck size={100} />
          </div>

          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">
              Gate Status
            </p>
            <h3 className="text-3xl font-black italic text-slate-900 dark:text-white">
              Restricted
            </h3>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase">
              Public user registration is disabled.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2">
            Active Users
          </p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white italic">
            {activeCount.toString().padStart(2, "0")}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">
            Pending Invites
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-black text-slate-900 dark:text-white italic">
              {pendingCount.toString().padStart(2, "0")}
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase italic">
              Awaiting Setup
            </span>
          </div>
        </div>
      </div>

      {/* 4. Directory Table */}
      <DataTable
        headers={["Account Details", "Role", "Branch", "Status & Actions"]}
        data={filteredUsers}
        loading={isLoading}
        emptyTitle="No personnel found"
        emptySubtitle="Try adjusting your search criteria or issue a new security invite."
        renderRow={(user) => (
          <tr
            key={user.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors relative"
          >
            {/* Identity Column */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-100 dark:bg-black/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 max-w-[150px] sm:max-w-xs lg:max-w-none">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    {/* Google SSO Badge */}
                    {user.google_id && (
                      <span
                        title="Secured via Google SSO"
                        className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[4px] text-[8px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20 flex items-center gap-1 shrink-0"
                      >
                        <Globe size={8} /> SSO
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </td>

            {/* Role Column */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-2">
                <Key
                  size={14}
                  className={
                    user.role === "ADMIN" || user.role === "MANAGER"
                      ? "text-amber-500"
                      : "text-blue-500"
                  }
                />
                <span className="text-[10px] sm:text-xs font-black dark:text-gray-300">
                  {user.role}
                </span>
              </div>
            </td>

            {/* Branch Assignment Column */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase">
                {user.branch_name ? (
                  <>
                    <MapPin size={12} className="text-slate-400" />{" "}
                    {user.branch_name}
                  </>
                ) : (
                  <>
                    <Globe size={12} className="text-amber-500" /> Enterprise
                    Global
                  </>
                )}
              </div>
            </td>

            {/* Status & Actions Column */}
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-3 sm:gap-4 relative">
                <StatusBadge
                  status={user.account_status}
                  type={
                    user.account_status === "ACTIVE"
                      ? "success"
                      : user.account_status === "DEACTIVATED"
                        ? "danger"
                        : "warning"
                  }
                />

                {/* Self-Preservation Logic Display */}
                {currentUser?.id === user.id ? (
                  <span className="text-[8px] sm:text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 px-2 py-1 rounded-lg uppercase whitespace-nowrap">
                    Active Session
                  </span>
                ) : (
                  <div ref={menuRef} className="w-8 flex justify-end">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === user.id ? null : user.id)
                      }
                      className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors cursor-pointer"
                    >
                      <MoreVertical
                        size={16}
                        className="sm:w-[18px] sm:h-[18px]"
                      />
                    </button>

                    {/* Action Menu */}
                    {openMenuId === user.id && (
                      <div className="absolute right-0 top-10 mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden text-left">
                        {user.account_status === "PENDING" && (
                          <button
                            onMouseDown={() =>
                              handleMenuAction(user.id, "RESEND")
                            }
                            className="w-full px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                          >
                            <RefreshCw size={14} /> Resend Invite
                          </button>
                        )}
                        <button
                          onMouseDown={() =>
                            handleMenuAction(user.id, "EDIT", user)
                          }
                          className="w-full px-4 py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 cursor-pointer"
                        >
                          <Edit size={14} /> Edit Account Details
                        </button>
                        {user.account_status === "ACTIVE" && (
                          <button
                            onMouseDown={() =>
                              handleMenuAction(user.id, "KILL_SESSION")
                            }
                            className="w-full px-4 py-3 text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 bg-red-50/50 dark:bg-red-900/10 cursor-pointer"
                          >
                            <PowerOff size={14} /> Kill Active Sessions
                          </button>
                        )}
                        {user.account_status === "DEACTIVATED" ? (
                          <button
                            onMouseDown={() =>
                              handleMenuAction(user.id, "ACTIVATE")
                            }
                            className="w-full px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 cursor-pointer"
                          >
                            <UserCheck size={14} /> Reactivate User
                          </button>
                        ) : (
                          <button
                            onMouseDown={() =>
                              handleMenuAction(user.id, "DEACTIVATE")
                            }
                            className="w-full px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 cursor-pointer"
                          >
                            <UserX size={14} /> Deactivate User
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* 5. INVITE MODAL */}
      <AnimatePresence>
        {isInviting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 sm:p-8 pb-4">
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                  Invite User
                </h2>
                <button
                  onClick={() => setIsInviting(false)}
                  disabled={inviteLoading}
                  className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 overflow-y-auto custom-scrollbar">
                {inviteError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <form
                  id="inviteForm"
                  onSubmit={handleInviteSubmit}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Basic Details Section */}
                  <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                      <Users size={16} /> Basic Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={inviteForm.firstName}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="e.g., Juan"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={inviteForm.lastName}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="e.g., Dela Cruz"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Official Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          required
                          type="email"
                          value={inviteForm.email}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="e.g., juan@overdrive.com"
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Access Configuration Section */}
                  <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                      <ShieldCheck size={16} /> Access Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          Role Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={inviteForm.role}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              role: e.target.value,
                              branchId:
                                e.target.value === "MANAGER"
                                  ? ""
                                  : branches.length > 0
                                    ? branches[0].id.toString()
                                    : "",
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none transition-colors cursor-pointer"
                        >
                          <option value="STAFF">Staff (Branch Lock)</option>
                          <option value="MANAGER">Manager (Global)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          Branch Assignment{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={inviteForm.branchId}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              branchId: e.target.value,
                            })
                          }
                          disabled={inviteForm.role === "MANAGER"}
                          className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none transition-colors cursor-pointer ${inviteForm.role === "MANAGER" ? "opacity-50 bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-amber-600 dark:text-amber-500" : ""}`}
                        >
                          {inviteForm.role === "MANAGER" ? (
                            <option value="">Enterprise Global</option>
                          ) : (
                            branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.branch_name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3 mt-2">
                      <Clock
                        size={16}
                        className="text-amber-600 shrink-0 mt-0.5"
                      />
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed italic uppercase tracking-wider">
                        Security Notice: This generates a unique activation link
                        valid for only 2 hours.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    {inviteLoading && (
                      <RefreshCw size={18} className="animate-spin" />
                    )}
                    {inviteLoading
                      ? "SENDING INVITATION..."
                      : "SEND INVITATION"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. EDIT MODAL */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 sm:p-8 pb-4">
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                  Edit Account Details
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={editLoading}
                  className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 overflow-y-auto custom-scrollbar">
                {editError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{editError}</span>
                  </div>
                )}

                <form
                  id="editForm"
                  onSubmit={handleEditSubmit}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Basic Details Section */}
                  <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                      <Users size={16} /> Basic Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="e.g., Juan"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="e.g., Dela Cruz"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                        Official Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          required
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          placeholder="e.g., juan@overdrive.com"
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Access Configuration Section */}
                  <div className="bg-slate-50/50 dark:bg-black/10 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-black uppercase text-amber-500 mb-5 tracking-widest flex items-center gap-2">
                      <ShieldCheck size={16} /> Access Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          System Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          disabled={editForm.role === "ADMIN"}
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              role: e.target.value,
                              branchId:
                                e.target.value === "MANAGER"
                                  ? ""
                                  : editForm.branchId ||
                                    (branches.length > 0
                                      ? branches[0].id.toString()
                                      : ""),
                            })
                          }
                          className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none transition-colors cursor-pointer ${editForm.role === "ADMIN" ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <option value="STAFF">Staff (Branch Lock)</option>
                          <option value="MANAGER">Manager (Global)</option>
                          {editForm.role === "ADMIN" && (
                            <option value="ADMIN">Admin (Global)</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                          Branch Assignment{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={editForm.branchId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              branchId: e.target.value,
                            })
                          }
                          disabled={
                            editForm.role === "MANAGER" ||
                            editForm.role === "ADMIN"
                          }
                          className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none transition-colors cursor-pointer ${editForm.role === "MANAGER" || editForm.role === "ADMIN" ? "opacity-50 bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-amber-600 dark:text-amber-500" : ""}`}
                        >
                          {editForm.role === "MANAGER" ||
                          editForm.role === "ADMIN" ? (
                            <option value="">Enterprise Global</option>
                          ) : (
                            branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.branch_name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={editLoading}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    {editLoading ? (
                      <RefreshCw size={18} className="animate-spin mr-2" />
                    ) : null}
                    {editLoading ? "UPDATING..." : "UPDATE ACCOUNT DETAILS"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. REUSABLE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default UsersTab;

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  ShieldCheck,
  MapPin,
  Mail,
  Clock,
  Lock,
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
} from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmModal from "../../components/shared/ConfirmModal";
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

  const handleInviteSubmit = async () => {
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

  const handleEditSubmit = async () => {
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
          "Are you sure you want to deactivate this user? They will be locked out immediately and all active sessions will be killed.",
        confirmText: "Deactivate Account",
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
          "This will restore system access for this employee based on their current role configuration.",
        confirmText: "Reactivate Account",
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
        title: "Kill Active Sessions",
        message:
          "EMERGENCY ACTION: Instantly invalidate all browser tokens for this user. They will be logged out mid-action. Proceed?",
        confirmText: "Kill Session",
        variant: "danger",
        onConfirm: () =>
          executeAction(
            () => userService.killSession(userId),
            "Session Kill-Switch activated.",
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
    <div className="space-y-8 animate-in fade-in duration-700 w-full pb-10">
      {/* 1. Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Users
            className="text-amber-600 dark:text-overdrive-yellow"
            size={24}
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            User RBAC Management
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
            Enterprise Directory & Identity Access Control
          </p>
        </div>
      </div>

      {/* 2. Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <ShieldCheck size={100} />
          </div>
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">
            Gatekeeper Status
          </p>
          <h3 className="text-3xl font-black italic">Closed-Loop</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
            Public Registration Disabled
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2">
            Active Personnel
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

      {/* 3. Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Roster by Name or Email..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsInviting(true)}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all uppercase text-xs tracking-widest shadow-xl w-full lg:w-auto"
        >
          <UserPlus size={18} /> Send Security Invite
        </button>
      </div>

      {/* 4. Directory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-visible shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Employee Identity</th>
                <th className="px-8 py-5">Role Level</th>
                <th className="px-8 py-5">Branch Assignment</th>
                <th className="px-8 py-5 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw
                        size={24}
                        className="animate-spin text-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Syncing Directory...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors relative"
                  >
                    {/* Identity Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-100 dark:bg-black/20 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors shrink-0">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                            {user.first_name} {user.last_name}
                            {/* Google SSO Badge Visualization */}
                            {user.google_id && (
                              <span
                                title="Secured via Google SSO"
                                className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[4px] text-[8px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20 flex items-center gap-1"
                              >
                                <Globe size={8} /> SSO
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Key
                          size={14}
                          className={
                            user.role === "ADMIN" || user.role === "MANAGER"
                              ? "text-amber-500"
                              : "text-blue-500"
                          }
                        />
                        <span className="text-xs font-black dark:text-gray-300">
                          {user.role}
                        </span>
                      </div>
                    </td>

                    {/* Branch Assignment Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                        {user.branch_name ? (
                          <>
                            <MapPin size={12} className="text-slate-400" />{" "}
                            {user.branch_name}
                          </>
                        ) : (
                          <>
                            <Globe size={12} className="text-amber-500" />{" "}
                            Enterprise Global
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status & Actions Column */}
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-4 relative">
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
                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 px-2 py-1 rounded-lg uppercase whitespace-nowrap">
                            Active Session
                          </span>
                        ) : (
                          <div ref={menuRef} className="w-8 flex justify-end">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === user.id ? null : user.id,
                                )
                              }
                              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {/* Action Menu */}
                            {openMenuId === user.id && (
                              <div className="absolute right-0 top-10 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden">
                                {user.account_status === "PENDING" && (
                                  <button
                                    onMouseDown={() =>
                                      handleMenuAction(user.id, "RESEND")
                                    }
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                                  >
                                    <RefreshCw size={14} /> Resend Invite
                                  </button>
                                )}
                                <button
                                  onMouseDown={() =>
                                    handleMenuAction(user.id, "EDIT", user)
                                  }
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5"
                                >
                                  <Edit size={14} /> Edit Configuration
                                </button>
                                {user.account_status === "ACTIVE" && (
                                  <button
                                    onMouseDown={() =>
                                      handleMenuAction(user.id, "KILL_SESSION")
                                    }
                                    className="w-full text-left px-4 py-3 text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 bg-red-50/50 dark:bg-red-900/10"
                                  >
                                    <PowerOff size={14} /> Kill Active Sessions
                                  </button>
                                )}
                                {user.account_status === "DEACTIVATED" ? (
                                  <button
                                    onMouseDown={() =>
                                      handleMenuAction(user.id, "ACTIVATE")
                                    }
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5"
                                  >
                                    <UserCheck size={14} /> Reactivate User
                                  </button>
                                ) : (
                                  <button
                                    onMouseDown={() =>
                                      handleMenuAction(user.id, "DEACTIVATE")
                                    }
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 border-t border-slate-100 dark:border-white/5"
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
                ))
              )}
              {filteredUsers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={32} className="mb-2 opacity-20" />
                      <span className="font-bold text-sm">
                        No personnel found.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INVITE MODAL */}
      <AnimatePresence>
        {isInviting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviting(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden z-10 p-8 md:p-10 space-y-8"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">
                    Issue Invite
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase">
                    Enforcing Closed-Loop Security
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                  <Lock size={24} />
                </div>
              </div>

              {inviteError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {inviteError}
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={inviteForm.firstName}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={inviteForm.lastName}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, email: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Role Level
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
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 appearance-none transition-colors"
                    >
                      <option value="STAFF">Staff (Branch Lock)</option>
                      <option value="MANAGER">Manager (Global)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Branch Assignment
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
                      className={`w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 appearance-none transition-colors ${inviteForm.role === "MANAGER" ? "opacity-50 bg-slate-200 dark:bg-slate-700 cursor-not-allowed text-amber-600 dark:text-amber-500" : ""}`}
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

                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3 mt-4">
                  <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed italic uppercase tracking-wider">
                    Security Notice: This generates a unique activation link
                    valid for only 2 hours.
                  </p>
                </div>
              </div>

              <button
                onClick={handleInviteSubmit}
                disabled={inviteLoading}
                className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-xl uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {inviteLoading
                  ? "PROCESSING SECURE LINK..."
                  : "ISSUE INVITATION"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. EDIT MODAL */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden z-10 p-8 md:p-10 space-y-6"
            >
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">
                  Edit Personnel Config
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase">
                  Update Identity & Access Rules
                </p>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" /> {editError}
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      System Role
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
                      className={`w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 appearance-none transition-colors ${editForm.role === "ADMIN" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="STAFF">Staff (Branch)</option>
                      <option value="MANAGER">Manager (Global)</option>
                      {editForm.role === "ADMIN" && (
                        <option value="ADMIN">Admin (Global)</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Branch Assignment
                    </label>
                    <select
                      value={editForm.branchId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, branchId: e.target.value })
                      }
                      disabled={
                        editForm.role === "MANAGER" || editForm.role === "ADMIN"
                      }
                      className={`w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-amber-500 appearance-none transition-colors ${editForm.role === "MANAGER" || editForm.role === "ADMIN" ? "opacity-50 bg-slate-200 dark:bg-slate-700 cursor-not-allowed text-amber-600 dark:text-amber-500" : ""}`}
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
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-xl uppercase text-xs tracking-widest shadow-xl flex items-center justify-center hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? (
                  <RefreshCw size={16} className="animate-spin mr-2" />
                ) : null}
                {editLoading ? "SAVING..." : "COMMIT CHANGES"}
              </button>
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

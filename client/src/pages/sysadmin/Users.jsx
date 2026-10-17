import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  Mail,
  Clock,
  MoreVertical,
  Users,
  Key,
  RefreshCw,
  UserX,
  Edit,
  UserCheck,
  PowerOff,
  Globe,
  Plus,
  X,
  Loader2,
  Send,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// Universal UI Components
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import StatCard from "../../components/ui/StatCard";

import { userService } from "../../services/sysadmin/user.service";
import { branchService } from "../../services/sysadmin/branch.service";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ITEMS_PER_PAGE = 5;

const UsersTab = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useApp();

  // Accessible IDs for Invite & Edit Modals
  const inviteModalTitleId = useId();
  const inviteFirstNameId = useId();
  const inviteLastNameId = useId();
  const inviteEmailId = useId();
  const inviteRoleId = useId();
  const inviteBranchId = useId();

  const editModalTitleId = useId();
  const editFirstNameId = useId();
  const editLastNameId = useId();
  const editEmailId = useId();
  const editRoleId = useId();
  const editBranchId = useId();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  const [isInviting, setIsInviting] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "STAFF",
    branchId: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    branchId: "",
  });

  const menuRef = useRef(null);

  // Close row action menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
        if (isInviting && !inviteLoading) {
          setIsInviting(false);
          setInviteError("");
        }
        if (isEditing && !editLoading) {
          setIsEditing(false);
          setEditError("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isInviting, inviteLoading, isEditing, editLoading]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userRosterResponse, branchDataResponse, globalStatsResponse] =
        await Promise.all([
          userService.getRoster(
            currentPage,
            ITEMS_PER_PAGE,
            debouncedSearchTerm,
          ),
          branchService.getAllBranches(1, 100, "", "active"),
          userService.getRoster(1, 1000, ""),
        ]);

      const fetchedUsers = userRosterResponse.data || [];
      const fetchedTotalPages = userRosterResponse.pagination?.totalPages || 1;

      if (fetchedUsers.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setUsers(fetchedUsers);
      setTotalPages(fetchedTotalPages);

      const allUsers = globalStatsResponse.data || [];
      setTotalCount(allUsers.length);
      setActiveCount(
        allUsers.filter((u) => u.account_status === "ACTIVE").length,
      );
      setPendingCount(
        allUsers.filter((u) => u.account_status === "PENDING").length,
      );

      const rawBranches = branchDataResponse?.data || branchDataResponse || [];
      const activeBranches = Array.isArray(rawBranches)
        ? rawBranches.filter((b) => b.is_active)
        : [];
      setBranches(activeBranches);

      if (activeBranches.length > 0) {
        setInviteForm((prev) => ({
          ...prev,
          branchId:
            prev.role === "MANAGER"
              ? ""
              : prev.branchId || activeBranches[0].id.toString(),
        }));
      }
    } catch (error) {
      showToast("Unable to load personnel accounts.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openInviteModal = () => {
    setInviteError("");
    setInviteForm({
      email: "",
      firstName: "",
      lastName: "",
      role: "STAFF",
      branchId: branches.length > 0 ? branches[0].id.toString() : "",
    });
    setIsInviting(true);
  };

  const closeInviteModal = () => {
    if (inviteLoading) return;
    setIsInviting(false);
    setInviteError("");
  };

  const closeEditModal = () => {
    if (editLoading) return;
    setIsEditing(false);
    setEditError("");
  };

  const handleInviteSubmit = async (e) => {
    if (e) e.preventDefault();
    setInviteError("");

    const trimmedFirstName = inviteForm.firstName.trim();
    const trimmedLastName = inviteForm.lastName.trim();
    const trimmedEmail = inviteForm.email.trim().toLowerCase();

    if (!trimmedFirstName || !trimmedLastName) {
      setInviteError("First Name and Last Name are required.");
      return;
    }

    if (!trimmedEmail) {
      setInviteError("Official Email is required.");
      return;
    }

    if (inviteForm.role === "STAFF" && !inviteForm.branchId) {
      setInviteError("Please select an active branch assignment for Staff.");
      return;
    }

    setInviteLoading(true);
    try {
      const payload = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        role: inviteForm.role,
        branchId:
          inviteForm.role === "MANAGER"
            ? null
            : parseInt(inviteForm.branchId, 10),
      };
      await userService.inviteUser(payload);

      showToast(`Secure invitation issued to ${payload.email}`, "success");

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
      const errMsg = error.message || "Failed to issue user invitation.";
      setInviteError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    setEditError("");

    const trimmedFirstName = editForm.firstName.trim();
    const trimmedLastName = editForm.lastName.trim();
    const trimmedEmail = editForm.email.trim().toLowerCase();

    if (!trimmedFirstName || !trimmedLastName) {
      setEditError("First Name and Last Name are required.");
      return;
    }

    if (!trimmedEmail) {
      setEditError("Official Email is required.");
      return;
    }

    const isGlobalRole =
      editForm.role === "MANAGER" || editForm.role === "ADMIN";
    if (!isGlobalRole && !editForm.branchId) {
      setEditError("Please select an active branch assignment for Staff.");
      return;
    }

    setEditLoading(true);
    try {
      const payload = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        role: editForm.role,
        branchId: isGlobalRole ? null : parseInt(editForm.branchId, 10),
      };
      await userService.updateUser(editForm.id, payload);

      showToast("Account details updated successfully.", "success");

      setIsEditing(false);
      fetchData();
    } catch (error) {
      const errMsg = error.message || "Failed to update account details.";
      setEditError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setEditLoading(false);
    }
  };

  const executeAction = async (actionFn, successMessage) => {
    try {
      await actionFn();
      if (successMessage) showToast(successMessage, "success");
      fetchData();
    } catch (error) {
      showToast(error.message || "An error occurred.", "error");
    }
  };

  const handleMenuAction = (userId, action, userObj = null) => {
    setOpenMenuId(null);

    if (action === "EDIT") {
      setEditError("");
      setEditForm({
        id: userObj.id,
        firstName: userObj.first_name || "",
        lastName: userObj.last_name || "",
        email: userObj.email || "",
        role: userObj.role || "STAFF",
        branchId: userObj.branch_id
          ? userObj.branch_id.toString()
          : branches.length > 0
            ? branches[0].id.toString()
            : "",
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
            "New secure invite has been issued.",
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
          executeAction(
            () => userService.updateUser(userId, { isActive: false }),
            "User account has been deactivated.",
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
          executeAction(
            () => userService.updateUser(userId, { isActive: true }),
            "User account has been reactivated.",
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
            "All active browser sessions terminated.",
          ),
      });
      return;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative w-full pb-10">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="User Accounts"
        subtitle="User Accounts & Access Control"
        icon={Users}
      >
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search users..."
          isSearching={searchTerm !== debouncedSearchTerm}
        />

        <ActionButton
          onClick={openInviteModal}
          label="Invite User"
          icon={Plus}
        />
      </PageHeader>

      {/* Top Stats KPIs */}
      <section
        aria-label="User Account Summary Metrics"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full"
      >
        <StatCard
          title="Total Accounts"
          value={totalCount.toString().padStart(2, "0")}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Active Personnel"
          value={activeCount.toString().padStart(2, "0")}
          icon={ShieldCheck}
          variant="success"
        />
        <StatCard
          title="Pending Invitations"
          value={pendingCount.toString().padStart(2, "0")}
          icon={Clock}
          variant="warning"
        />
      </section>

      {/* Directory Table */}
      <DataTable
        caption="Personnel Accounts Directory"
        headers={["Account Details", "Role", "Branch", "Status & Actions"]}
        data={users}
        loading={isLoading}
        minWidth="min-w-[720px]"
        emptyTitle="No personnel found"
        emptySubtitle="Try adjusting your search criteria or issue a new security invite."
        renderRow={(user, index) => {
          const fullName =
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            "System User";
          const isMenuOpen = openMenuId === user.id;
          const isLastRow = users.length > 2 && index >= users.length - 1;

          return (
            <tr
              key={user.id}
              className={`group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 relative ${
                user.account_status === "DEACTIVATED" ? "opacity-75" : ""
              }`}
            >
              {/* Identity Column */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    aria-hidden="true"
                    className="h-10 w-10 sm:h-11 sm:w-11 bg-amber-500/10 border border-amber-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 dark:text-overdrive-yellow shrink-0"
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 max-w-[160px] sm:max-w-[240px] lg:max-w-[320px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate"
                        title={fullName}
                      >
                        {fullName}
                      </p>
                      {user.google_id && (
                        <span
                          title="Secured via Google SSO"
                          className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md text-[9px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20 inline-flex items-center gap-1 shrink-0"
                        >
                          <Globe size={10} aria-hidden="true" /> SSO
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate w-full"
                      title={user.email}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </td>

              {/* Role Column */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
                  <Key
                    size={13}
                    aria-hidden="true"
                    className={
                      user.role === "ADMIN" || user.role === "MANAGER"
                        ? "text-amber-600 dark:text-overdrive-yellow"
                        : "text-blue-600 dark:text-blue-400"
                    }
                  />
                  <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-slate-700 dark:text-slate-200">
                    {user.role}
                  </span>
                </div>
              </td>

              {/* Branch Column */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {user.branch_name ? (
                    <>
                      <MapPin
                        size={14}
                        aria-hidden="true"
                        className="text-blue-600 dark:text-blue-400 shrink-0"
                      />
                      <span
                        className="truncate max-w-[120px] sm:max-w-[200px]"
                        title={user.branch_name}
                      >
                        {user.branch_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Globe
                        size={14}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow shrink-0"
                      />
                      <span>Global</span>
                    </>
                  )}
                </div>
              </td>

              {/* Status & Actions Column */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                <div className="flex items-center justify-end gap-2 sm:gap-3 relative">
                  <StatusBadge
                    label={user.account_status}
                    variant={
                      user.account_status === "ACTIVE"
                        ? "success"
                        : user.account_status === "DEACTIVATED"
                          ? "danger"
                          : "warning"
                    }
                    icon={
                      user.account_status === "ACTIVE"
                        ? ShieldCheck
                        : user.account_status === "DEACTIVATED"
                          ? UserX
                          : Clock
                    }
                  />

                  {currentUser?.id === user.id ? (
                    <StatusBadge label="You" variant="info" className="ml-1" />
                  ) : (
                    <div
                      ref={isMenuOpen ? menuRef : null}
                      className="relative flex justify-end shrink-0"
                    >
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-label={`Open actions menu for ${fullName}`}
                        title={`Actions for ${fullName}`}
                        onClick={() =>
                          setOpenMenuId(isMenuOpen ? null : user.id)
                        }
                        className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                          isMenuOpen
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-overdrive-yellow border-amber-200 dark:border-amber-500/30"
                            : "border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      >
                        <MoreVertical
                          size={16}
                          aria-hidden="true"
                          className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                        />
                      </button>

                      {/* Action Menu */}
                      {isMenuOpen && (
                        <div
                          role="menu"
                          aria-label={`Actions for ${fullName}`}
                          className={`absolute right-0 ${
                            isLastRow ? "bottom-full mb-1.5" : "top-full mt-1.5"
                          } w-52 sm:w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-[70] overflow-hidden text-left py-1`}
                        >
                          {user.account_status === "PENDING" && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleMenuAction(user.id, "RESEND")
                              }
                              className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <RefreshCw
                                size={14}
                                aria-hidden="true"
                                className="text-amber-500"
                              />
                              <span>Resend Invite</span>
                            </button>
                          )}

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              handleMenuAction(user.id, "EDIT", user)
                            }
                            className="w-full px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 first:border-t-0 transition-colors cursor-pointer"
                          >
                            <Edit size={14} aria-hidden="true" />
                            <span>Edit Account Details</span>
                          </button>

                          {user.account_status === "ACTIVE" && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleMenuAction(user.id, "KILL_SESSION")
                              }
                              className="w-full px-4 py-2.5 text-xs font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 bg-red-50/40 dark:bg-red-900/10 transition-colors cursor-pointer"
                            >
                              <PowerOff size={14} aria-hidden="true" />
                              <span>Terminate Active Sessions</span>
                            </button>
                          )}

                          {user.account_status === "DEACTIVATED" ? (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleMenuAction(user.id, "ACTIVATE")
                              }
                              className="w-full px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 transition-colors cursor-pointer"
                            >
                              <UserCheck size={14} aria-hidden="true" />
                              <span>Reactivate User</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleMenuAction(user.id, "DEACTIVATE")
                              }
                              className="w-full px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 border-t border-slate-100 dark:border-white/5 transition-colors cursor-pointer"
                            >
                              <UserX size={14} aria-hidden="true" />
                              <span>Deactivate User</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* INVITE MODAL */}
      <AnimatePresence>
        {isInviting && (
          <div
            onClick={closeInviteModal}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={inviteModalTitleId}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* MODAL HEADER */}
              <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    aria-hidden="true"
                    className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                  >
                    <Plus size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id={inviteModalTitleId}
                      className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                    >
                      Invite User
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                      New Access Registration
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={inviteLoading}
                  aria-label="Close invite user modal"
                  className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {inviteError && (
                  <div role="alert" className="form-error-banner">
                    <AlertCircle
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 mt-0.5"
                    />
                    <span>{inviteError}</span>
                  </div>
                )}

                <form
                  id="inviteForm"
                  onSubmit={handleInviteSubmit}
                  className="space-y-6"
                >
                  {/* Basic Details Section */}
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-4 tracking-widest flex items-center gap-2">
                      <Users size={14} aria-hidden="true" /> Basic Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
                      <div>
                        <label
                          htmlFor={inviteFirstNameId}
                          className="form-label"
                        >
                          First Name <span className="form-required">*</span>
                        </label>
                        <input
                          id={inviteFirstNameId}
                          required
                          type="text"
                          disabled={inviteLoading}
                          value={inviteForm.firstName}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="e.g., Juan"
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={inviteLastNameId}
                          className="form-label"
                        >
                          Last Name <span className="form-required">*</span>
                        </label>
                        <input
                          id={inviteLastNameId}
                          required
                          type="text"
                          disabled={inviteLoading}
                          value={inviteForm.lastName}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="e.g., Dela Cruz"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={inviteEmailId} className="form-label">
                        Official Email <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <input
                          id={inviteEmailId}
                          required
                          type="email"
                          disabled={inviteLoading}
                          value={inviteForm.email}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="e.g., juan@overdrive.com"
                          className="form-input pl-10"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Access Configuration Section */}
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-4 tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} aria-hidden="true" /> Access
                      Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
                      <div>
                        <label htmlFor={inviteRoleId} className="form-label">
                          Role Level <span className="form-required">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id={inviteRoleId}
                            disabled={inviteLoading}
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
                            className="form-select appearance-none pr-10 cursor-pointer"
                          >
                            <option value="STAFF">Staff (Branch)</option>
                            <option value="MANAGER">Manager (Global)</option>
                          </select>
                          <ChevronDown
                            size={15}
                            aria-hidden="true"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor={inviteBranchId} className="form-label">
                          Branch Assignment{" "}
                          <span className="form-required">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id={inviteBranchId}
                            value={inviteForm.branchId}
                            onChange={(e) =>
                              setInviteForm({
                                ...inviteForm,
                                branchId: e.target.value,
                              })
                            }
                            disabled={
                              inviteLoading || inviteForm.role === "MANAGER"
                            }
                            className={`form-select appearance-none pr-10 cursor-pointer ${
                              inviteForm.role === "MANAGER"
                                ? "text-amber-700 dark:text-overdrive-yellow"
                                : ""
                            }`}
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
                          <ChevronDown
                            size={15}
                            aria-hidden="true"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3 mt-2">
                      <Clock
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow shrink-0 mt-0.5"
                      />
                      <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed italic uppercase tracking-wider">
                        Security Notice: This generates a unique activation link
                        valid for only 2 hours.
                      </p>
                    </div>
                  </section>
                </form>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={inviteLoading}
                  className="w-full sm:w-auto px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="inviteForm"
                  disabled={inviteLoading}
                  className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {inviteLoading ? (
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={16} aria-hidden="true" />
                  )}
                  <span>
                    {inviteLoading
                      ? "PROCESSING SECURE LINK..."
                      : "ISSUE INVITATION"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditing && (
          <div
            onClick={closeEditModal}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={editModalTitleId}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* MODAL HEADER */}
              <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    aria-hidden="true"
                    className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                  >
                    <Edit size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id={editModalTitleId}
                      className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                    >
                      Edit Account Details
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                      Personnel Record Update
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editLoading}
                  aria-label="Close edit account modal"
                  className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {editError && (
                  <div role="alert" className="form-error-banner">
                    <AlertCircle
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 mt-0.5"
                    />
                    <span>{editError}</span>
                  </div>
                )}

                <form
                  id="editForm"
                  onSubmit={handleEditSubmit}
                  className="space-y-6"
                >
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-4 tracking-widest flex items-center gap-2">
                      <Users size={14} aria-hidden="true" /> Basic Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
                      <div>
                        <label htmlFor={editFirstNameId} className="form-label">
                          First Name <span className="form-required">*</span>
                        </label>
                        <input
                          id={editFirstNameId}
                          required
                          type="text"
                          disabled={editLoading}
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="e.g., Juan"
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label htmlFor={editLastNameId} className="form-label">
                          Last Name <span className="form-required">*</span>
                        </label>
                        <input
                          id={editLastNameId}
                          required
                          type="text"
                          disabled={editLoading}
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="e.g., Dela Cruz"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={editEmailId} className="form-label">
                        Official Email <span className="form-required">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                        <input
                          id={editEmailId}
                          required
                          type="email"
                          disabled={editLoading}
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          placeholder="e.g., juan@overdrive.com"
                          className="form-input pl-10"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-4 tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} aria-hidden="true" /> Access
                      Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label htmlFor={editRoleId} className="form-label">
                          System Role <span className="form-required">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id={editRoleId}
                            disabled={editLoading || editForm.role === "ADMIN"}
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
                            className="form-select appearance-none pr-10 cursor-pointer"
                          >
                            <option value="STAFF">Staff (Branch)</option>
                            <option value="MANAGER">Manager (Global)</option>
                            {editForm.role === "ADMIN" && (
                              <option value="ADMIN">Admin (Global)</option>
                            )}
                          </select>
                          <ChevronDown
                            size={15}
                            aria-hidden="true"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor={editBranchId} className="form-label">
                          Branch Assignment{" "}
                          <span className="form-required">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id={editBranchId}
                            value={editForm.branchId}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                branchId: e.target.value,
                              })
                            }
                            disabled={
                              editLoading ||
                              editForm.role === "MANAGER" ||
                              editForm.role === "ADMIN"
                            }
                            className={`form-select appearance-none pr-10 cursor-pointer ${
                              editForm.role === "MANAGER" ||
                              editForm.role === "ADMIN"
                                ? "text-amber-700 dark:text-overdrive-yellow"
                                : ""
                            }`}
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
                          <ChevronDown
                            size={15}
                            aria-hidden="true"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </form>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editLoading}
                  className="w-full sm:w-auto px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="editForm"
                  disabled={editLoading}
                  className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {editLoading ? (
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <Edit size={16} aria-hidden="true" />
                  )}
                  <span>
                    {editLoading ? "UPDATING..." : "UPDATE ACCOUNT DETAILS"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
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

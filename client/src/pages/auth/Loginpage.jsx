import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoginForm from "../../features/auth/LoginForm";
import BannerLogo from "../../assets/Banner_Logo.png";
import Footer from "../../components/layout/Footer";
import AlertDialog from "../../components/shared/AlertDialog";

const ALERT_CONFIGS = {
  session_revoked: {
    title: "Session Terminated",
    message:
      "Your active session was terminated by a system administrator. Please sign in again to continue.",
    variant: "danger",
  },
  account_deactivated: {
    title: "Account Disabled",
    message:
      "Your account has been deactivated. Please contact your system administrator for assistance.",
    variant: "danger",
  },
  maintenance_mode: {
    title: "System Maintenance",
    message:
      "Your assigned branch is currently undergoing maintenance. Access is temporarily restricted.",
    variant: "warning",
  },
  branch_archived: {
    title: "Branch Inactive",
    message:
      "Your assigned branch has been closed or decommissioned. Please contact administration.",
    variant: "danger",
  },
};

const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
  });

  useEffect(() => {
    const alertType = searchParams.get("alert");

    if (alertType && ALERT_CONFIGS[alertType]) {
      setAlertConfig({
        isOpen: true,
        ...ALERT_CONFIGS[alertType],
      });

      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4 relative">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-6 z-10">
        {/* Banner Logo */}
        <div className="w-full flex justify-center">
          <img
            src={BannerLogo}
            alt="Overdrive Banner"
            className="h-24 sm:h-28 w-full object-contain"
          />
        </div>

        {/* Login Form */}
        <div className="w-full">
          <LoginForm />
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/*  Security Landing Modal */}
      <AlertDialog
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        buttonText="Understood"
      />
    </div>
  );
};

export default LoginPage;

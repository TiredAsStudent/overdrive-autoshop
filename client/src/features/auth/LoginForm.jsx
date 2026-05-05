import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, Chrome } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Buttons";
import { useAuth } from "../../context/AuthContext";

const ROLE_REDIRECTS = {
  ADMIN: "/sysadmin/dashboard/overview",
  MANAGER: "/manager/dashboard/overview",
  STAFF: "/staff/dashboard/stats",
};

const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;

    setCredentials((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (error) setError("");
  };

  const validateInputs = () => {
    const cleanEmail = credentials.email.trim().toLowerCase();
    const cleanPassword = credentials.password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter your email and password.");
      return false;
    }

    return {
      email: cleanEmail,
      password: cleanPassword,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const validated = validateInputs();
    if (!validated) return;

    setLoading(true);
    setError("");

    try {
      const loggedInUser = await login(validated.email, validated.password);

      const redirectPath = ROLE_REDIRECTS[loggedInUser.role];

      if (!redirectPath) {
        throw new Error("Unauthorized portal access.");
      }

      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Access denied. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 text-xs font-black uppercase tracking-wide text-red-700 bg-red-50 border-l-4 border-red-600 rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="name@gmail.com"
            value={credentials.email}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="username"
            className="text-slate-900 font-bold h-14"
          />

          <div className="relative">
            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="current-password"
              className="text-slate-900 font-bold h-14 pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-[38px] p-1 text-slate-400 hover:text-slate-900 transition-colors z-10"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            type="submit"
            loading={loading}
            variant="primary"
            className="w-full h-14 text-sm font-black tracking-[0.2em] shadow-xl shadow-slate-900/10"
          >
            {loading ? "VERIFYING..." : "SIGN IN"}
          </Button>

          <button
            type="button"
            className="w-full h-14 border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            <Chrome size={18} /> Continue with Google
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

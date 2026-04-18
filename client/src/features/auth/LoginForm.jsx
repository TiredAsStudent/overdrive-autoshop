import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, Chrome } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Buttons";
import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Trigger Login
      const loggedInUser = await login(credentials.email, credentials.password);

      // The 4-Portal Traffic Cop
      switch (loggedInUser.role) {
        case "ADMIN": // System IT Admin
          navigate("/sysadmin/overview");
          break;
        case "MANAGER": // Enterprise Owner
          navigate("/manager/dashboard/ranking");
          break;
        case "STAFF": // Daily Operations
          navigate("/staff/dashboard/stats");
          break;
        case "CUSTOMER": // Digital Passport
          navigate("/customer/dashboard/status");
          break;
        default:
          throw new Error("Unrecognized access level. Please contact support.");
      }
    } catch (err) {
      setError(err.message || "Access Denied. Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 text-xs font-black uppercase tracking-tighter text-red-600 bg-red-50 border-l-4 border-red-600 rounded-r-xl animate-in fade-in slide-in-from-top-2 duration-300">
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
            placeholder="name@overdrive.com"
            value={credentials.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="text-slate-900 font-bold h-14"
          />

          <div className="relative group">
            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="text-slate-900 font-bold h-14 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] p-1 text-slate-400 hover:text-slate-900 transition-colors z-10"
              tabIndex="-1"
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

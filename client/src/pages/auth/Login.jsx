import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import logoImg from "../../assets/overdrive_logo-removebg-preview.png";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Trigger a loading toast so the user knows something is happening
    const toastId = toast.loading("Verifying credentials...");

    try {
      const loggedInUser = await login(email, password);

      // Trigger a success toast and attach it to the loading toast ID so it replaces it
      toast.success(`You have successfully logged in!`, {
        id: toastId,
      });

      // Redirect Logic
      if (loggedInUser.role === "admin") {
        navigate("/admin");
      } else if (loggedInUser.role === "staff") {
        navigate("/staff");
      }
    } catch (err) {
      // Trigger an error toast if login fails
      const errorMessage =
        err.response?.data?.message || "Failed to connect to the server.";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 md:left-1/3 w-64 h-64 md:w-96 md:h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Card Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Top/Left Side - Branding */}
        <div className="flex w-full md:w-1/2 bg-linear-to-br from-yellow-400 to-yellow-500 p-8 md:p-12 flex-col items-center justify-center shadow-inner">
          <img
            src={logoImg}
            alt="Overdrive Auto Shop Logo"
            className="w-auto h-20 sm:h-24 md:h-auto md:max-w-xs object-contain drop-shadow-xl transition-transform"
          />
        </div>

        {/* Bottom/Right Side - Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl sm:text-3xl text-center font-extrabold text-zinc-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-center text-zinc-500 font-medium">
              Please sign in to your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none transition-all bg-zinc-50 focus:bg-white placeholder-zinc-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none transition-all bg-zinc-50 focus:bg-white placeholder-zinc-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end mt-3">
                <span className="text-sm font-bold text-zinc-500 hover:text-yellow-600 cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 mt-2 rounded-lg shadow-md text-sm font-bold text-yellow-400 bg-zinc-900 hover:bg-zinc-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:bg-zinc-400 disabled:text-zinc-200 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

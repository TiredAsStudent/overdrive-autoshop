import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Menu } from "lucide-react";

const Header = ({ setIsMobileOpen }) => {
  const { user } = useContext(AuthContext);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Get the short day
  const formattedDay = time.toLocaleDateString("en-US", {
    weekday: "short",
  });

  // Get the time
  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <header className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 transition-all shadow-sm">
      {/* Mobile Menu & Bold Title Area */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden text-zinc-900 hover:text-yellow-500 focus:outline-none transition-colors"
        >
          <Menu size={28} />
        </button>

        <div className="hidden sm:flex flex-col">
          <h1 className="text-xl sm:text-2xl uppercase font-black text-zinc-900 tracking-tight leading-none">
            {user?.role} Portal
          </h1>
        </div>
      </div>

      {/* Ultra-Simple Live Time Display */}
      <div className="flex items-center justify-center px-4 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100/80">
        <span className="text-[15px] sm:text-base font-medium text-zinc-500 tracking-wide font-mono">
          {formattedDay} {formattedTime}
        </span>
      </div>
    </header>
  );
};

export default Header;

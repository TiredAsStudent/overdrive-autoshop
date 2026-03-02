const Loader = ({ message = "Loading Overdrive System..." }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 md:left-1/3 w-64 h-64 md:w-96 md:h-96 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Loader Content */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-zinc-700 border-t-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)]"></div>

        {/* Pulsing Message */}
        <div className="text-lg sm:text-xl font-bold text-zinc-300 animate-pulse text-center tracking-wide">
          {message}
        </div>
      </div>
    </div>
  );
};

export default Loader;

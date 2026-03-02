const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 p-4 text-center">
      <h1 className="text-8xl sm:text-9xl font-black text-yellow-500 tracking-wider">
        404
      </h1>
      <p className="mt-4 text-lg sm:text-xl text-zinc-100 font-medium tracking-wide">
        Oops! Page not found.
      </p>
    </div>
  );
};

export default NotFound;

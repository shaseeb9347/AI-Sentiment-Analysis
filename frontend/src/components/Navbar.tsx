type NavbarProps = {
  isLoggedIn: boolean;
  onLogout: () => void;
};

function Navbar({ isLoggedIn, onLogout }: NavbarProps) {
  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SentimentAI
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            AI-powered sentiment analysis
          </p>
        </div>

        {isLoggedIn && (
          <button
            onClick={onLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
import { useState } from "react";
import { Brain, LockKeyhole, Mail, Sparkles } from "lucide-react";

type LoginProps = { onLogin: (token: string) => void };

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Login failed");
      onLogin(data.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-10 text-slate-900">
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[28px] border border-white bg-white/90 p-8 shadow-2xl shadow-indigo-100 backdrop-blur-xl sm:p-10">
        <div className="mb-9 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-200">
            <Brain size={30} />
          </div>
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
            <Sparkles size={14} /> AI sentiment platform
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Welcome to SentimentAI</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to your intelligent sentiment analytics workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">Email address</label>
            <div className="relative">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">Password</label>
            <div className="relative">
              <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
            </div>
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In to SentimentAI"}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Secure AI workspace
        </div>
      </div>
    </div>
  );
}

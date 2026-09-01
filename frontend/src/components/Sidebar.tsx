import { BarChart3, FileText, History, LayoutDashboard, LogOut, User } from "lucide-react";

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
};

const items = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Analyze Text", icon: FileText },
  { name: "History", icon: History },
  { name: "Analytics", icon: BarChart3 },
  { name: "Profile", icon: User },
];

export default function Sidebar({ activePage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 items-center border-b border-slate-100 px-6">
        <button type="button" onClick={() => onNavigate("Dashboard")} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
            <BarChart3 size={20} />
          </div>
          <div className="text-left">
            <div className="text-lg font-extrabold tracking-tight text-slate-950">
              Sentiment<span className="text-indigo-600">AI</span>
            </div>
            <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400">AI SENTIMENT PLATFORM</div>
          </div>
        </button>
      </div>

      <div className="flex-1 px-4 py-8">
        <div className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onNavigate(item.name)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-[15px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon size={19} className={active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
                <span>{item.name}</span>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-[15px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={19} className="text-slate-400 transition group-hover:text-rose-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

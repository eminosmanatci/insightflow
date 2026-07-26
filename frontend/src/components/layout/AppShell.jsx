import { useState } from "react";
import {
  BarChart3,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const NAVIGATION = [
  {
    label: "Genel Bakış",
    description: "Analitik merkezi",
    to: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Veri Setleri",
    description: "Kaynakları yönet",
    to: "/datasets",
    icon: Database,
  },
];

function Navigation({ onNavigate }) {
  return (
    <nav className="space-y-2">
      {NAVIGATION.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                isActive
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-950/40"
                      : "bg-white/[0.05] text-slate-400 group-hover:text-white",
                  ].join(" ")}
                >
                  <Icon size={19} />
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>

                  <span className="block truncate text-xs text-slate-500">
                    {item.description}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function Sidebar({ onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-white/[0.07] px-6">
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-950/50">
          <BarChart3 size={22} className="text-white" />

          <div className="absolute inset-x-2 bottom-1 h-px bg-white/50" />
        </div>

        <div>
          <div className="text-lg font-bold tracking-tight text-white">
            InsightFlow
          </div>

          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-blue-300">
            Analytics OS
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Workspace
        </p>

        <Navigation onNavigate={onNavigate} />
      </div>

      <div className="border-t border-white/[0.07] p-4">
        <div className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Sistemler çalışıyor
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-bold text-white ring-1 ring-white/10">
            E
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              Yönetici
            </p>

            <p className="truncate text-xs text-slate-500">
              Organization Admin
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            aria-label="Çıkış yap"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppShell({ title, description, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb] text-slate-950">
      <aside className="hidden w-[280px] shrink-0 bg-slate-950 md:block">
        <Sidebar onLogout={handleLogout} />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => {
              setMobileMenuOpen(false);
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <aside className="relative z-10 h-full w-[280px] bg-slate-950 shadow-2xl">
            <button
              type="button"
              aria-label="Menüyü kapat"
              onClick={() => {
                setMobileMenuOpen(false);
              }}
              className="absolute right-4 top-5 z-20 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            <Sidebar
              onLogout={handleLogout}
              onNavigate={() => {
                setMobileMenuOpen(false);
              }}
            />
          </aside>
        </div>
      )}

      <div className="min-h-0 min-w-0 flex flex-1 flex-col">
        <header className="z-20 flex min-h-20 items-center border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-8">
          <button
            type="button"
            aria-label="Menüyü aç"
            onClick={() => {
              setMobileMenuOpen(true);
            }}
            className="mr-3 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm md:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
              <Sparkles size={14} />
              InsightFlow Intelligence
            </div>

            <div className="flex flex-col gap-1 lg:flex-row lg:items-end lg:gap-3">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {title}
              </h1>

              {description && (
                <p className="hidden truncate pb-0.5 text-sm text-slate-500 lg:block">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              Canlı veri
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-200">
              E
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.07),transparent_32%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_28%)] p-4 sm:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;

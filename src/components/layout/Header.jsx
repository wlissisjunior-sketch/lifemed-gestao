import { useState } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { notifications as mockNotifications } from "../../data/mockData";

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0 bg-surface border-b border-slate-200 flex items-center gap-3 px-4 lg:px-6">
      <button
        className="lg:hidden text-slate-500 hover:text-ink"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Buscar paciente, orçamento, documento…"
          className="w-full bg-slate-100 border border-transparent focus:border-sage focus:bg-white rounded-md pl-9 pr-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="relative">
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className="relative h-9 w-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ink"
          aria-label="Notificações"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-coral" />
          )}
        </button>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-card shadow-pop border border-slate-200 z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink">
                  Notificações
                </p>
                <span className="text-xs text-slate-400">{unread} novas</span>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 last:border-0 text-sm ${
                      !n.read ? "bg-sage-50/40" : ""
                    }`}
                  >
                    <p className="text-slate-700 leading-snug">{n.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
        <div className="h-9 w-9 rounded-full bg-ink flex items-center justify-center text-xs font-semibold text-white">
          {user?.initials || "U"}
        </div>
        <div className="hidden md:block leading-tight">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.role}</p>
        </div>
      </div>
    </header>
  );
}

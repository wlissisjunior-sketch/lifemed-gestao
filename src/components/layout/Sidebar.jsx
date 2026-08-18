import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Building2,
  ClipboardCheck,
  Receipt,
  Stethoscope,
  CalendarClock,
  TimerReset,
  FilePlus2,
  Boxes,
  FolderOpen,
  UserSquare2,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/instituicoes", label: "Instituições", icon: Building2 },
  { to: "/avaliacoes", label: "Avaliações", icon: ClipboardCheck },
  { to: "/orcamentos", label: "Orçamentos", icon: Receipt },
  { to: "/atendimentos", label: "Atendimentos", icon: Stethoscope },
  { to: "/visitas", label: "Visitas", icon: CalendarClock },
  { to: "/prorrogacoes", label: "Prorrogações", icon: TimerReset },
  { to: "/aditivos", label: "Aditivos", icon: FilePlus2 },
  { to: "/materiais", label: "Materiais", icon: Boxes },
  { to: "/documentos", label: "Documentos", icon: FolderOpen },
  { to: "/profissionais", label: "Profissionais", icon: UserSquare2 },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-72 bg-ink text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-sage flex items-center justify-center font-display font-semibold text-sm">
              L
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              LifeMed
            </span>
          </div>
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-sage text-white font-medium"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sage-600 flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-white/50 truncate">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Sair"
            className="text-white/50 hover:text-white shrink-0"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}

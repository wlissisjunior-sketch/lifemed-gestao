import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }
    setError("");
    login(email);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div
        className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-sage/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sage-700/30 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-md bg-sage flex items-center justify-center font-display font-semibold text-white">
            L
          </div>
          <span className="font-display text-2xl font-semibold text-white tracking-tight">
            LifeMed
          </span>
        </div>

        <div className="bg-surface rounded-card shadow-pop p-7 sm:p-9">
          <h1 className="font-display text-xl font-semibold text-ink">
            Acessar plataforma
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Entre com suas credenciais de gestão LifeMed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@lifemed.com"
                  className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-coral bg-coral-50 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-sage focus:ring-sage-100"
                />
                Lembrar acesso
              </label>
              <button type="button" className="text-sage hover:text-sage-700 font-medium">
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-sage hover:bg-sage-600 text-white font-medium text-sm rounded-md py-2.5 transition-colors mt-2"
            >
              Entrar
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5 text-white/60 text-xs">
          <ShieldCheck size={14} />
          Ambiente seguro de gestão LifeMed
        </div>
      </div>
    </div>
  );
}

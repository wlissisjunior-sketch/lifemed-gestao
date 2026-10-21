import "./global-react";
import { StoreProvider, useStore } from "./lib/store";
import { NavCtx, Route } from "./components/ui";
import Layout from "./components/Layout";
import Inicio from "./pages/Inicio";
import Checklist from "./pages/Checklist";
import Pacientes from "./pages/Pacientes";
import Valores from "./pages/Valores";
import Pacotes from "./pages/Pacotes";
import { Faturamento, Fechamento, Fisico } from "./pages/Resultados";
import { Painel, Relatorios } from "./pages/Relatorios";
import { Dietas, Medicamentos } from "./pages/Tabelas";
import Ajustes from "./pages/Ajustes";
import PadPage from "./pages/Pad";
import { LOGO } from "./assets";
import { DemoGate } from "./components/Demo";
import "./styles.css";

const { useState } = React;
const PAGES: Record<Route, any> = { inicio: Inicio, pad: PadPage, checklist: Checklist, pacientes: Pacientes, valores: Valores, pacotes: Pacotes, fechamento: Fechamento,
  faturamento: Faturamento, fisico: Fisico, relatorios: Relatorios, painel: Painel, medicamentos: Medicamentos, dietas: Dietas, ajustes: Ajustes };

function Toasts() {
  const { toasts } = useStore();
  return <div className="toasts" role="status" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div>;
}

function Shell() {
  const { status } = useStore();
  const h = (typeof location !== "undefined" ? location.hash.slice(1) : "") as Route;
  const [nav, setNav] = useState({ route: (h in PAGES ? h : "inicio") as Route, arg: null as any });
  const go = (route: Route, arg?: any) => { setNav({ route, arg: arg ?? null }); try { window.scrollTo(0, 0); } catch { /* ok */ } };
  if (status !== "ready") return (
    <div className="skel">
      <img src={LOGO} alt="LifeMed" style={{ width: 120, background: "#fff", borderRadius: 12, padding: 8 }} />
      {status === "loading" ? <p>Carregando os dados do fechamento…</p> : <>
        <h2>Não foi possível abrir os dados</h2>
        <p style={{ maxWidth: "46ch" }}>Recarregue a página. Se continuar, limpe os dados do site no navegador.</p>
      </>}
    </div>
  );
  const Page = PAGES[nav.route];
  return (
    <NavCtx.Provider value={{ route: nav.route, go, arg: nav.arg }}>
      <Layout><Page key={nav.route} /></Layout>
      <Toasts />
    </NavCtx.Provider>
  );
}

export function App() { return <DemoGate>{(caps: any) => <StoreProvider boot={caps}><Shell /></StoreProvider>}</DemoGate>; }

const el = typeof document !== "undefined" ? document.getElementById("root") : null;
if (el && (window as any).ReactDOM) (window as any).ReactDOM.createRoot(el).render(<App />);

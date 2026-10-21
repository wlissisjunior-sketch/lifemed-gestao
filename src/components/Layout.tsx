import { useStore, newCompDoc } from "../lib/store";
import { mesAno, mesCurto } from "../lib/format";
import { MARK } from "../assets";
import { Field, Ico, Modal, Route, useNav } from "./ui";
import { trocarPerfil } from "./Demo";

const { useState } = React;

export const GROUPS: { t: string; items: [Route, string][] }[] = [
  { t: "Lançar", items: [["pad", "Planos de atenção (PAD)"], ["checklist", "Checklist de serviços"], ["relatorios", "Relatórios entregues"]] },
  { t: "Resultados", items: [["faturamento", "Faturamento por paciente"], ["fisico", "Físico-financeiro"], ["fechamento", "Fechamento do paciente"], ["painel", "Painel de relatórios"]] },
  { t: "Cadastros", items: [["pacientes", "Pacientes"], ["valores", "Serviços e valores"], ["pacotes", "Pacotes e inclusos"], ["medicamentos", "Medicamentos PLANSERV"], ["dietas", "Dietas e suplementos"]] },
  { t: "Sistema", items: [["ajustes", "Competências e ajustes"]] },
];
const ROLE_LABEL = { admin: "Administrador", operador: "Operador", leitor: "Somente leitura" } as const;

function NovaComp({ onClose }: { onClose: () => void }) {
  const { db, comps, setComp, write, log } = useStore();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const id = `${ano}-${String(mes).padStart(2, "0")}`;
  const existe = comps.some((c) => c.id === id);
  const criar = async () => {
    if (existe) { setComp(id); onClose(); return; }
    const ok = await write(() => db.doc(`competencias/${id}`).set(newCompDoc(id)), `Competência de ${mesAno(id)} criada.`);
    if (ok) { log("criar competência", id); setComp(id); onClose(); }
  };
  return (
    <Modal title="Nova competência" onClose={onClose}>
      <div className="grid2">
        <Field label="Mês" id="nc-mes"><select id="nc-mes" value={mes} onChange={(e: any) => setMes(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{mesAno(`2000-${String(i + 1).padStart(2, "0")}`).split(" de ")[0]}</option>)}</select></Field>
        <Field label="Ano" id="nc-ano"><input id="nc-ano" type="number" value={ano} onChange={(e: any) => setAno(Number(e.target.value))} /></Field>
      </div>
      {existe && <p className="hint">Esta competência já existe; o botão abaixo só a seleciona.</p>}
      <div className="row"><button className="btn" onClick={criar}>{existe ? "Abrir competência" : "Criar competência"}</button><button className="btn sec" onClick={onClose}>Cancelar</button></div>
    </Modal>
  );
}

export default function Layout({ children }: { children: any }) {
  const { comps, comp, setComp, role, can } = useStore();
  const { route, go } = useNav();
  const [mais, setMais] = useState(false);
  const [nova, setNova] = useState(false);
  const pick = (r: Route) => { go(r); setMais(false); };
  const onSel = (e: any) => { if (e.target.value === "__nova") setNova(true); else setComp(e.target.value); };
  const compSelect = (cls?: string, id?: string) => (
    <select id={id} className={cls} value={comp?.id || ""} onChange={onSel} aria-label="Competência">
      {comps.length === 0 && <option value="">Nenhuma competência</option>}
      {comps.map((c) => <option key={c.id} value={c.id}>{mesAno(c.id)}{c.status === "fechada" ? " (fechada)" : ""}</option>)}
      {can("operador") && <option value="__nova">+ Nova competência…</option>}
    </select>
  );
  const tabs: [Route | "mais", string, any][] = [["inicio", "Início", Ico.home], ["checklist", "Lançar", Ico.check], ["faturamento", "Faturamento", Ico.money], ["relatorios", "Relatórios", Ico.doc], ["mais", "Mais", Ico.more]];

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><div className="badge-logo"><img src={MARK} alt="" /></div><div><b>LifeMed</b><span>FECHAMENTO DE SERVIÇOS</span></div></div>
        <div className="compbox">
          <label htmlFor="comp-side">Competência</label>
          {compSelect(undefined, "comp-side")}
          {comp && <span className="compstate"><i className={`dot ${comp.status === "fechada" ? "closed" : ""}`} />{comp.status === "fechada" ? "Fechada para edição" : "Aberta para lançamentos"}</span>}
        </div>
        <nav className="nav" aria-label="Menu">
          <button className={route === "inicio" ? "on" : ""} onClick={() => go("inicio")}>Início</button>
          {GROUPS.map((g) => (
            <div className="nav" key={g.t}><h4>{g.t}</h4>
              {g.items.map(([r, l]) => <button key={r} className={route === r ? "on" : ""} onClick={() => go(r)}>{l}</button>)}
            </div>
          ))}
        </nav>
        <div className="who">Seu acesso: <b>{ROLE_LABEL[role]}</b><br /><button className="btn ghost sm" style={{ color: "var(--side-ink)", paddingLeft: 0 }} onClick={trocarPerfil}>Trocar perfil</button><p className="tiny" style={{ marginTop: 6 }}>Demonstração · dados neste navegador</p></div>
      </aside>

      <header className="topbar">
        <div className="badge-logo"><img src={MARK} alt="" /></div><b>LifeMed</b>
        {compSelect(undefined, "comp-top")}
      </header>

      <main className="main" id="conteudo">{children}</main>

      <nav className="tabbar" aria-label="Atalhos">
        {tabs.map(([r, l, ic]) => (
          <button key={r} className={(r === "mais" ? mais : route === r && !mais) ? "on" : ""} onClick={() => (r === "mais" ? setMais(true) : pick(r as Route))}>{ic}<span>{l}</span></button>
        ))}
      </nav>

      {mais && (
        <Modal title="Menu" onClose={() => setMais(false)}>
          <div className="drawer-list">
            {comp && <p className="hint" style={{ padding: "0 12px" }}>Competência: <b>{mesCurto(comp.id)}</b> · {comp.status === "fechada" ? "fechada" : "aberta"} · acesso {ROLE_LABEL[role].toLowerCase()}</p>}
            {GROUPS.map((g) => (
              <div key={g.t} className="drawer-list"><h4>{g.t}</h4>
                {g.items.map(([r, l]) => <button key={r} className={route === r ? "on" : ""} onClick={() => pick(r)}><span>{l}</span><span aria-hidden="true">›</span></button>)}
              </div>
            ))}
            <div className="drawer-list"><h4>Demonstração</h4><button onClick={() => { setMais(false); trocarPerfil(); }}><span>Trocar perfil</span><span aria-hidden="true">›</span></button></div>
          </div>
        </Modal>
      )}
      {nova && <NovaComp onClose={() => setNova(false)} />}
    </div>
  );
}

import { useStore } from "../lib/store";
import { matrizRelatorios } from "../lib/views";
import { mesAno, norm, pct, shortName } from "../lib/format";
import { xlsxRelatorios } from "../lib/exporters";
import { Banner, Empty, PageHead } from "../components/ui";

const { useMemo, useState } = React;

export function Relatorios() {
  const { comp, pacList, tipos, rels, db, write, can, downloads, toast, log } = useStore();
  const [busca, setBusca] = useState("");
  const m = useMemo(() => matrizRelatorios(pacList, tipos, rels), [pacList, tipos, rels]);
  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const pode = can("operador");
  const toggle = async (pid: string, tid: string, atual: string) => {
    if (!pode) return;
    const id = `${comp.id}_${pid}`;
    const st = { ...(rels[id]?.st || {}) };
    if (atual === "entregue") delete st[tid]; else st[tid] = "entregue";
    if (await write(() => db.doc(`relatorios/${id}`).set({ comp: comp.id, pac: pid, st }))) {
      const t = tipos.find((x) => x.id === tid)?.nome;
      log(atual === "entregue" ? "relatório pendente" : "relatório entregue", pacList.find((p) => p.id === pid)?.nome || pid, t);
    }
  };
  const vis = m.linhas.filter((l) => norm(l.p.nome).includes(norm(busca)));
  const cell = (pid: string, t: any, st: string) => (
    <button className={`cellbtn ${st}`} aria-disabled={!pode} aria-pressed={st === "entregue"} onClick={() => toggle(pid, t.id, st)} title={pode ? "Clique para alternar" : undefined}>
      {st === "entregue" ? "Entregue" : "Pendente"}</button>
  );
  return (
    <>
      <PageHead title="Relatórios entregues" actions={downloads && <button className="btn sec" onClick={() => xlsxRelatorios(comp, m, tipos, downloads, toast)}>Baixar Excel</button>}>
        Toque em um relatório para alternar entre pendente e entregue. Vale para os pacientes ativos e para a competência de {mesAno(comp.id)}.
      </PageHead>
      <div className="kpis" style={{ marginBottom: 14 }}>
        <div className="kpi ok"><span>Entregues</span><b>{m.entregues}</b></div>
        <div className="kpi warn"><span>Pendentes</span><b>{m.pendentes}</b></div>
        <div className="kpi"><span>Concluído</span><b>{pct(m.pct)}</b><small>{m.esperados} relatórios esperados</small></div>
      </div>
      {tipos.length === 0 && <Banner kind="warn">Nenhum tipo de relatório cadastrado. Cadastre em Competências e ajustes.</Banner>}
      <div className="card flush">
        <div style={{ padding: 12 }}><input className="inp" placeholder="Buscar paciente" aria-label="Buscar paciente" value={busca} onChange={(e: any) => setBusca(e.target.value)} /></div>
        <div className="tbl-wrap only-desktop" style={{ maxHeight: "68vh" }}>
          <table className="matrix">
            <thead><tr><th>Paciente</th>{tipos.map((t) => <th key={t.id}>{t.nome}</th>)}<th>Entregues</th></tr></thead>
            <tbody>{vis.map((l) => (
              <tr key={l.p.id}><td>{l.p.nome}</td>{tipos.map((t) => <td key={t.id}>{cell(l.p.id, t, l.st[t.id] === "entregue" ? "entregue" : "pendente")}</td>)}<td><b>{l.entregues}/{tipos.length}</b></td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="only-mobile">
          {vis.map((l) => (
            <div className="rcard" key={l.p.id}>
              <div className="row between"><b className="small">{l.p.nome}</b><span className={`pill ${l.pendentes ? "warn" : "ok"}`}>{l.entregues}/{tipos.length}</span></div>
              <div className="rchips">{tipos.map((t) => { const st = l.st[t.id] === "entregue" ? "entregue" : "pendente"; return (
                <button key={t.id} className={`cellbtn ${st}`} aria-disabled={!pode} aria-pressed={st === "entregue"} onClick={() => toggle(l.p.id, t.id, st)}>{st === "entregue" ? "✓ " : ""}{t.nome}</button>); })}</div>
            </div>
          ))}
        </div>
        {vis.length === 0 && <Empty>Nenhum paciente ativo encontrado.</Empty>}
      </div>
    </>
  );
}

export function Painel() {
  const { comp, pacList, tipos, rels } = useStore();
  const m = useMemo(() => matrizRelatorios(pacList, tipos, rels), [pacList, tipos, rels]);
  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const piores = [...m.linhas].sort((a, b) => a.pct - b.pct || a.p.nome.localeCompare(b.p.nome, "pt-BR"));
  return (
    <>
      <PageHead title="Painel de relatórios">Quanto já foi entregue em {mesAno(comp.id)} e onde estão as pendências.</PageHead>
      <div className="stack">
        <div className="kpis">
          <div className="kpi"><span>Relatórios esperados</span><b>{m.esperados}</b></div>
          <div className="kpi ok"><span>Entregues</span><b>{m.entregues}</b></div>
          <div className="kpi warn"><span>Pendentes</span><b>{m.pendentes}</b></div>
          <div className="kpi money"><span>Concluído</span><b>{pct(m.pct)}</b></div>
        </div>
        <div className="grid2" style={{ alignItems: "start" }}>
          <div className="card"><h2>Por tipo de relatório</h2>
            {m.porTipo.map((t) => { const tot = t.entregues + t.pendentes || 1; return (
              <div className="bar" key={t.t.id}><span className="name">{t.t.nome}</span>
                <div className="track" role="img" aria-label={`${t.entregues} entregues e ${t.pendentes} pendentes`}><i className="e" style={{ width: `${(t.entregues / tot) * 100}%` }} /><i className="p" style={{ width: `${(t.pendentes / tot) * 100}%` }} /></div>
                <span className="num small">{t.entregues}/{tot}</span></div>); })}
            <div className="legend"><span><i style={{ background: "var(--green-strong)" }} />Entregue</span><span><i style={{ background: "#f2b24a" }} />Pendente</span></div>
          </div>
          <div className="card"><h2>Por paciente</h2><p className="hint">Quem tem mais pendências aparece primeiro.</p>
            {piores.map((l) => (
              <div className="bar" key={l.p.id}><span className="name" title={l.p.nome}>{shortName(l.p.nome)}</span>
                <div className="track"><i className="e" style={{ width: `${l.pct * 100}%` }} /><i className="p" style={{ width: `${(1 - l.pct) * 100}%` }} /></div>
                <span className="num small">{l.entregues}/{tipos.length}</span></div>
            ))}
            {piores.length === 0 && <Empty>Nenhum paciente ativo.</Empty>}
          </div>
        </div>
      </div>
    </>
  );
}

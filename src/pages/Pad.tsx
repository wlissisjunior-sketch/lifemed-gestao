import { useStore, uid } from "../lib/store";
import {
  Pad, PadItem, Freq, FREQ_LABEL, Escala, Criterio, pontuar, orcamento, situacao, ultimasVersoes, padsDoPeriodo,
  previstoRealizado, diffVersoes, pendenciasPad, addDays, qtdPrevista,
} from "../lib/pad";
import { days } from "../lib/engine";
import { dateBR, dateTimeBR, mesAno, money, norm, parseQtd, qty, todayISO } from "../lib/format";
import { Banner, Confirm, Empty, Field, Modal, PageHead, useNav } from "../components/ui";
import { pdfPad } from "../lib/exporters";

const { useMemo, useState, useEffect } = React;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const FREQS: Freq[] = ["dia", "semana", "mes", "periodo"];
const FREQ_CURTA: Record<Freq, string> = { dia: "/dia", semana: "/semana", mes: "/mês", periodo: "no período" };
const freqPadrao = (cat: string): Freq => (/EQUIPAMENTO|MEDICAMENTO|DIETA/.test(cat) ? "dia" : /TRANSPORTE/.test(cat) ? "periodo" : "semana");

export default function PadPage() {
  const { arg } = useNav();
  const { pads } = useStore();
  if (arg?.id) return pads.some((p) => p.id === arg.id) ? <PadEditor key={arg.id} arg={arg} /> : <PadAusente />;
  if (arg?.novo) return <PadEditor key={"novo-" + arg.novo} arg={arg} />;
  return <PadLista />;
}

/** O PAD recém-salvo leva um instante para chegar; só depois disso dizemos que não existe. */
function PadAusente() {
  const { go } = useNav();
  const [espera, setEspera] = useState(true);
  useEffect(() => { const t = setTimeout(() => setEspera(false), 1500); return () => clearTimeout(t); }, []);
  if (espera) return <div className="skel"><p>Carregando o PAD…</p></div>;
  return <><PageHead title="PAD" /><div className="card"><Empty><p>Este PAD não existe mais.</p><button className="btn" onClick={() => go("pad")}>Voltar à lista</button></Empty></div></>;
}

/* ============================== LISTA ============================== */
function PadLista() {
  const { pads, pacList, pacientes, servicos, rules, can } = useStore();
  const { go } = useNav();
  const hoje = todayISO();
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState(false);
  const [cfg, setCfg] = useState(false);
  const ult = useMemo(() => ultimasVersoes(pads), [pads]);
  const linhas = useMemo(() => pacList.filter((p) => p.ativo || ult[p.id]).map((p) => {
    const pad = ult[p.id] || null;
    return { p, pad, sit: pad ? situacao(pad, hoje) : null, orc: pad ? orcamento(pad, servicos, rules) : null };
  }), [pacList, ult, servicos, rules, hoje]);
  const conta = (f: (l: any) => boolean) => linhas.filter(f).length;
  const grupos: [string, string, (l: any) => boolean][] = [
    ["todos", "Todos", () => true],
    ["vigor", "Em vigor", (l) => ["vigente", "avencer", "autorizado"].includes(l.sit?.k)],
    ["avencer", "A vencer", (l) => l.sit?.k === "avencer"],
    ["vencido", "Vencidos", (l) => l.sit?.k === "vencido" && l.p.ativo],
    ["enviado", "Aguardando", (l) => l.sit?.k === "enviado"],
    ["rascunho", "Rascunhos", (l) => l.sit?.k === "rascunho"],
    ["sem", "Sem PAD", (l) => !l.pad && l.p.ativo],
  ];
  const fg = grupos.find((g) => g[0] === filtro)![2];
  const vis = linhas.filter((l) => fg(l) && norm(l.p.nome).includes(norm(busca)));

  return (
    <>
      <PageHead title="Planos de atenção domiciliar (PAD)" actions={<>
        {can("admin") && <button className="btn sec" onClick={() => setCfg(true)}>Escala de complexidade</button>}
        {can("operador") && <button className="btn" onClick={() => setNovo(true)}>+ Novo PAD</button>}</>}>
        O PAD define a modalidade, a equipe, os equipamentos e os insumos de cada paciente. Ele preenche o checklist do mês, gera o orçamento e diz quais relatórios cobrar.
      </PageHead>
      <div className="kpis" style={{ marginBottom: 14 }}>
        <div className="kpi ok"><span>Em vigor</span><b>{conta(grupos[1][2])}</b></div>
        <div className="kpi warn"><span>Vencem em até 7 dias</span><b>{conta(grupos[2][2])}</b></div>
        <div className="kpi warn"><span>Vencidos</span><b>{conta(grupos[3][2])}</b><small>pacientes ativos</small></div>
        <div className="kpi"><span>Aguardando autorização</span><b>{conta(grupos[4][2])}</b></div>
        <div className="kpi"><span>Ativos sem PAD</span><b>{conta(grupos[6][2])}</b></div>
      </div>
      <div className="card flush">
        <div className="row" style={{ padding: 12 }}>
          <input className="inp grow" placeholder="Buscar paciente" aria-label="Buscar paciente" value={busca} onChange={(e: any) => setBusca(e.target.value)} />
          <div className="seg scroll-x">{grupos.map(([k, l]) => <button key={k} className={filtro === k ? "on" : ""} onClick={() => setFiltro(k)}>{l}</button>)}</div>
        </div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Paciente</th><th>Modalidade</th><th>Período</th><th>Situação</th><th className="num">Previsto no período</th><th /></tr></thead>
          <tbody>
            {vis.map(({ p, pad, sit, orc }) => (
              <tr key={p.id} className={p.ativo ? "" : "dim"}>
                <td><b>{p.nome}</b>{pad && <div className="hint">versão {pad.versao}{pad.autorizacao ? ` · autorização ${pad.autorizacao}` : ""}</div>}</td>
                <td>{pad ? servicos[pad.pacote]?.nome || "—" : <span className="muted">—</span>}</td>
                <td className="small">{pad ? `${dateBR(pad.ini)} a ${dateBR(pad.fim)}` : "—"}</td>
                <td>{sit ? <span className={`pill ${sit.kind}`}>{sit.label}</span> : <span className="pill warn">Sem PAD</span>}</td>
                <td className="num">{orc ? <b>{money(orc.cobrado)}</b> : "—"}</td>
                <td className="num">{pad ? <button className="btn sm sec" onClick={() => go("pad", { id: pad.id })}>Abrir</button>
                  : can("operador") && <button className="btn sm" onClick={() => go("pad", { novo: p.id })}>Montar PAD</button>}</td>
              </tr>
            ))}
            {vis.length === 0 && <tr><td colSpan={6}><Empty>Nenhum paciente nesta lista.</Empty></td></tr>}
          </tbody>
        </table></div>
      </div>
      {novo && <NovoPad onClose={() => setNovo(false)} />}
      {cfg && <EscalaModal onClose={() => setCfg(false)} />}
      {Object.keys(pacientes).length === 0 && null}
    </>
  );
}

function NovoPad({ onClose }: { onClose: () => void }) {
  const { pacList, pads } = useStore();
  const { go } = useNav();
  const [pid, setPid] = useState("");
  const ult = ultimasVersoes(pads);
  return (
    <Modal title="Novo PAD" onClose={onClose}>
      <Field label="Paciente" id="np-pac"><select id="np-pac" value={pid} onChange={(e: any) => setPid(e.target.value)}>
        <option value="">Escolha…</option>{pacList.filter((p) => p.ativo).map((p) => <option key={p.id} value={p.id}>{p.nome}{ult[p.id] ? ` (já tem PAD v${ult[p.id].versao})` : ""}</option>)}</select></Field>
      {pid && ult[pid] && <Banner kind="info">Este paciente já tem um PAD. Para prorrogar o atual, abra-o e use <b>Nova versão</b>, que copia tudo. Aqui você começa um plano em branco.</Banner>}
      <div className="row"><button className="btn" disabled={!pid} onClick={() => { onClose(); go("pad", { novo: pid }); }}>Montar PAD</button><button className="btn sec" onClick={onClose}>Cancelar</button></div>
    </Modal>
  );
}

/* ============================== EDITOR ============================== */
function PadEditor({ arg }: { arg: { id?: string; novo?: string } }) {
  const st = useStore();
  const { pads, pacientes, servicos, svlist, rules, tipos, escala, can, db, write, log, comp, lancs, downloads, toast, meId } = { ...st, svlist: st.svcList };
  const { go } = useNav();
  const hoje = todayISO();
  const base = arg.id ? pads.find((p) => p.id === arg.id) || null : null;
  const doPac = (pac: string) => pads.filter((p) => p.pac === pac).sort((a, b) => b.versao - a.versao);
  const novoPad = (pac: string): Pad => {
    const ant = doPac(pac)[0];
    return { id: "", pac, versao: (ant?.versao || 0) + 1, anterior: ant?.id, status: "rascunho", operadora: ant?.operadora || "PLANSERV", autorizacao: "",
      medico: ant?.medico || "", crm: ant?.crm || "", ini: hoje, fim: addDays(hoje, 29), escala: {}, pontos: 0, sugerida: "", pacote: "", motivo: "",
      itens: [], relatorios: tipos.map((t) => t.id), objetivos: "", alta: "", reavaliacao: "" };
  };
  const [f, setF] = useState(() => (base ? clone(base) : novoPad(arg.novo!)) as Pad);
  const [sujo, setSujo] = useState(!base);
  const [pend, setPend] = useState([] as string[]);
  const [conf, setConf] = useState(null as null | "excluir" | "encerrar" | "autorizar");
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (base && !sujo) setF(clone(base)); }, [base]);

  const p = pacientes[f.pac];
  const ro = !can("operador") || f.status !== "rascunho";
  const sit = situacao(f, hoje);
  const pt = pontuar(escala, f.escala);
  const orc = orcamento(f, servicos, rules);
  const pacotes = svlist.filter((s) => s.pacote && (s.ativo || s.id === f.pacote));
  const itensSvc = svlist.filter((s) => !s.pacote && s.ativo);
  const cats = [...new Set(itensSvc.map((s) => s.categoria))];
  const versoes = doPac(f.pac);
  const ultima = versoes[0];
  const anterior = f.anterior ? pads.find((x) => x.id === f.anterior) : null;
  const mudancas = anterior ? diffVersoes(anterior, f, servicos, (id) => tipos.find((t) => t.id === id)?.nome || id) : [];
  const nDias = f.ini && f.fim && f.fim >= f.ini ? days(f.ini, f.fim) : 0;

  const set = (patch: Partial<Pad>) => { setF({ ...f, ...patch }); setSujo(true); };
  const setEsc = (cid: string, v: string) => {
    const esc = { ...f.escala }; if (v === "") delete esc[cid]; else esc[cid] = Number(v);
    const r = pontuar(escala, esc);
    const patch: Partial<Pad> = { escala: esc, pontos: r.pontos, sugerida: r.sugerida };
    if (!f.pacote || f.pacote === f.sugerida) patch.pacote = r.sugerida;  // acompanha a sugestão até alguém trocar
    set(patch);
  };
  const setItem = (i: number, patch: Partial<PadItem>) => { const it = [...f.itens]; it[i] = { ...it[i], ...patch }; set({ itens: it }); };
  const addItem = (sid: string) => { if (!sid) return; const s = servicos[sid]; set({ itens: [...f.itens, { sid, qtd: 1, freq: freqPadrao(s.categoria), obs: "" }] }); };
  const delItem = (i: number) => set({ itens: f.itens.filter((_, k) => k !== i) });

  const corpo = (x: Pad) => { const { id, ...rest } = x as any; return { ...rest, pontos: pontuar(escala, x.escala).pontos, sugerida: pontuar(escala, x.escala).sugerida }; };
  const salvar = async (extra: Partial<Pad> = {}, okMsg = "PAD salvo.") => {
    const novo = !f.id;
    const id = f.id || uid("pad");
    const doc = { ...corpo({ ...f, ...extra }), editEm: new Date().toISOString(), ...(novo ? { criadoEm: new Date().toISOString(), por: meId || "" } : {}) };
    setBusy(true);
    const ok = await write(() => db.doc(`pads/${id}`).set(doc), okMsg);
    setBusy(false);
    if (ok) { setSujo(false); setF({ ...doc, id } as Pad); log(novo ? "criar PAD" : "editar PAD", p?.nome || f.pac, `versão ${f.versao}${extra.status ? " · " + extra.status : ""}`); if (novo) go("pad", { id }); }
    return ok;
  };
  const enviar = async () => {
    const e = pendenciasPad({ ...f, sugerida: pt.sugerida }, escala); setPend(e);
    if (e.length) { window.scrollTo(0, 0); return; }
    await salvar({ status: "enviado", enviadoEm: new Date().toISOString() }, "PAD enviado para autorização.");
  };
  const mudarStatus = async (patch: Partial<Pad>, msg: string, acao: string) => {
    setBusy(true);
    const ok = await write(() => db.doc(`pads/${f.id}`).update(patch), msg);
    setBusy(false); if (ok) { setF({ ...f, ...patch }); log(acao, p?.nome || f.pac, `versão ${f.versao}`); }
  };
  const novaVersao = async () => {
    const id = uid("pad");
    const dur = Math.max(1, days(f.ini, f.fim));
    const ini = addDays(f.fim, 1);
    const doc = { ...corpo(f), versao: f.versao + 1, anterior: f.id, status: "rascunho", autorizacao: "", ini, fim: addDays(ini, dur - 1),
      criadoEm: new Date().toISOString(), por: meId || "", enviadoEm: "", autorizadoEm: "", encerradoEm: "", motivoEnc: "", reavaliacao: "" };
    if (await write(() => db.doc(`pads/${id}`).set(doc), `Versão ${f.versao + 1} criada como rascunho.`)) { log("nova versão do PAD", p?.nome || f.pac, `versão ${f.versao + 1}`); go("pad", { id }); }
  };
  const excluir = async () => { setConf(null); if (await write(() => db.doc(`pads/${f.id}`).delete(), "Rascunho excluído.")) { log("excluir rascunho de PAD", p?.nome || f.pac); go("pad"); } };

  // previsto x realizado na competência selecionada
  const pr = useMemo(() => {
    if (!comp || f.status === "rascunho" || !f.id) return null;
    const ps = padsDoPeriodo(pads, f.pac, comp.ini, comp.fim);
    if (!ps.length) return { ps, linhas: [] as any[] };
    return { ps, linhas: previstoRealizado(ps, lancs.filter((l) => l.pac === f.pac), comp.ini, comp.fim, servicos) };
  }, [comp, pads, lancs, f.pac, f.status, f.id, servicos]);

  const acoes = (
    <>
      {f.id && <button className="btn sec" onClick={() => pdfPad(f, { paciente: p, servicos, tipos, escala, orc }, downloads, toast)}>Baixar PDF</button>}
      {!ro && <button className="btn sec" disabled={busy || !sujo} onClick={() => salvar()}>Salvar rascunho</button>}
      {!ro && <button className="btn" disabled={busy} onClick={enviar}>Enviar para autorização</button>}
      {f.status === "enviado" && can("admin") && <button className="btn" disabled={busy} onClick={() => { setTxt(f.autorizacao || ""); setConf("autorizar"); }}>Marcar como autorizado</button>}
      {f.status === "enviado" && can("operador") && <button className="btn sec" disabled={busy} onClick={() => mudarStatus({ status: "rascunho" }, "PAD voltou para rascunho.", "PAD devolvido para rascunho")}>Voltar para rascunho</button>}
      {f.status === "autorizado" && ultima?.id === f.id && can("operador") && <button className="btn" onClick={novaVersao}>Nova versão (prorrogar)</button>}
      {f.status === "autorizado" && can("admin") && <button className="btn sec" onClick={() => { setTxt(""); setConf("encerrar"); }}>Encerrar</button>}
    </>
  );

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <button className="btn ghost sm" style={{ marginLeft: -10, marginBottom: 4 }} onClick={() => go("pad")}>‹ Planos de atenção</button>
          <h1>PAD · {p?.nome || "paciente"}</h1>
          <p className="row" style={{ gap: 8, marginTop: 6 }}><span className={`pill ${sit.kind}`}>{sit.label}</span><span className="muted">Versão {f.versao}{f.autorizacao ? ` · autorização ${f.autorizacao}` : ""}{f.editEm ? ` · alterado em ${dateTimeBR(f.editEm)}` : ""}</span></p>
        </div>
        <div className="row">{acoes}</div>
      </div>
      {pend.length > 0 && <div style={{ marginBottom: 12 }}><Banner kind="err"><b>Falta completar antes de enviar:</b><ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{pend.map((x) => <li key={x}>{x}</li>)}</ul></Banner></div>}
      {f.status !== "rascunho" && can("operador") && <div style={{ marginBottom: 12 }}><Banner kind="info">{f.status === "autorizado" ? "PAD autorizado: o conteúdo fica travado. Para mudar algo, crie uma nova versão." : f.status === "enviado" ? "PAD enviado: aguardando autorização da operadora. Para corrigir, volte para rascunho." : `PAD encerrado${f.motivoEnc ? `: ${f.motivoEnc}` : ""}.`}</Banner></div>}
      {sujo && !ro && f.id && <div style={{ marginBottom: 12 }}><Banner kind="warn">Há alterações não salvas.</Banner></div>}

      <div className="kpis" style={{ marginBottom: 14 }}>
        <div className="kpi"><span>Período</span><b>{nDias} dias</b><small>{dateBR(f.ini)} a {dateBR(f.fim)}</small></div>
        <div className="kpi"><span>Complexidade</span><b>{pt.pontos} pts</b><small>{pt.completo ? `sugere ${servicos[pt.sugerida]?.nome || "—"}` : `${pt.respondidos} de ${escala.criterios.length} critérios`}</small></div>
        <div className="kpi money"><span>Valor previsto do período</span><b>{money(orc.cobrado)}</b><small>orçamento para a operadora</small></div>
        <div className="kpi cov"><span>Incluso no pacote</span><b>{money(orc.incluso)}</b><small>não cobrado à parte</small></div>
      </div>

      <div className="stack">
        {/* 1. identificação */}
        <section className="card stack">
          <h2>1. Identificação e período</h2>
          <div className="grid3" style={{ alignItems: "start" }}>
            <Field label="Operadora" id="pd-op"><input id="pd-op" disabled={ro} value={f.operadora} onChange={(e: any) => set({ operadora: e.target.value })} /></Field>
            <Field label="Nº da autorização" id="pd-aut" hint={f.status === "rascunho" ? "Preenchido quando a operadora autorizar" : undefined}><input id="pd-aut" disabled={ro} value={f.autorizacao} onChange={(e: any) => set({ autorizacao: e.target.value })} /></Field>
            <Field label="Reavaliação prevista" id="pd-rea"><input id="pd-rea" type="date" disabled={ro} value={f.reavaliacao} onChange={(e: any) => set({ reavaliacao: e.target.value })} /></Field>
            <Field label="Médico responsável" id="pd-med"><input id="pd-med" disabled={ro} value={f.medico} onChange={(e: any) => set({ medico: e.target.value })} /></Field>
            <Field label="CRM" id="pd-crm"><input id="pd-crm" disabled={ro} value={f.crm} onChange={(e: any) => set({ crm: e.target.value })} /></Field>
            <div />
            <Field label="Início" id="pd-ini"><input id="pd-ini" type="date" disabled={ro} value={f.ini} onChange={(e: any) => set({ ini: e.target.value, fim: f.fim && nDias ? addDays(e.target.value, nDias - 1) : f.fim })} /></Field>
            <Field label="Fim" id="pd-fim"><input id="pd-fim" type="date" disabled={ro} min={f.ini} value={f.fim} onChange={(e: any) => set({ fim: e.target.value })} /></Field>
            {!ro && <div className="field"><label>Duração</label><div className="row" style={{ gap: 6 }}>{[30, 60, 90].map((n) => <button key={n} type="button" className={`btn sm ${nDias === n ? "" : "sec"}`} onClick={() => set({ fim: addDays(f.ini, n - 1) })}>{n} dias</button>)}</div></div>}
          </div>
        </section>

        {/* 2. complexidade */}
        <section className="card stack">
          <div className="row between"><h2>2. Avaliação de complexidade</h2><span className="hint">{escala.nome}</span></div>
          <div className="grid2">
            {escala.criterios.map((c: Criterio) => (
              <Field key={c.id} label={c.nome} id={`pd-${c.id}`}>
                <select id={`pd-${c.id}`} disabled={ro} value={f.escala[c.id] ?? ""} onChange={(e: any) => setEsc(c.id, e.target.value)}>
                  <option value="">Escolha…</option>
                  {c.opcoes.map((o, i) => <option key={i} value={i}>{o.t} ({o.p} pt{o.p === 1 ? "" : "s"})</option>)}
                </select>
              </Field>
            ))}
          </div>
          <div className="scorebox">
            <div><span className="eyebrow">Pontuação</span><b>{pt.pontos}</b></div>
            <div className="grow"><span className="eyebrow">Modalidade sugerida pela escala</span><b>{pt.completo ? servicos[pt.sugerida]?.nome || "—" : "Responda todos os critérios"}</b></div>
          </div>
          <div className="grid2">
            <Field label="Modalidade do PAD (pacote)" id="pd-pkg"><select id="pd-pkg" disabled={ro} value={f.pacote} onChange={(e: any) => set({ pacote: e.target.value })}>
              <option value="">Escolha…</option>{pacotes.map((s) => <option key={s.id} value={s.id}>{s.nome} — {money(s.valor)}/diária</option>)}</select></Field>
            {f.pacote && pt.completo && f.pacote !== pt.sugerida && (
              <Field label="Por que a modalidade é diferente da sugerida?" id="pd-mot"><textarea id="pd-mot" rows={2} disabled={ro} value={f.motivo} onChange={(e: any) => set({ motivo: e.target.value })} /></Field>)}
          </div>
        </section>

        {/* 3. itens */}
        <section className="card flush">
          <div className="card-head"><h2>3. Equipe, equipamentos, medicamentos e insumos</h2>
            <span className="hint">Previsão para os {nDias} dias do PAD. A cobertura segue as regras do pacote escolhido.</span></div>
          <div className="pad-its">
            <div className="pad-it head"><span>Item</span><span>Qtd</span><span>Frequência</span><span>Observação</span><span className="num">Previsto</span><span>Cobertura</span><span className="num">Valor</span><span /></div>
            {f.itens.length === 0 && <Empty>Nenhum item ainda. {!ro && "Use o campo abaixo para incluir profissionais, equipamentos, medicamentos, dieta e curativos."}</Empty>}
            {f.itens.map((it, i) => {
              const r = orc.porItem["i" + i]; const s = servicos[it.sid];
              const prev = qtdPrevista(it, f, f.ini, f.fim);
              const cob = !r ? null : r.cobrada === 0 ? <span className="pill cov">Incluso no pacote</span> : r.inclusa === 0 ? <span className="pill">Cobrado à parte</span> : <span className="pill warn">Parte incluso</span>;
              return (
                <div className="pad-it" key={i}>
                  <div className="svc"><b>{s?.nome || it.sid}</b><div className="hint">{s?.categoria.toLowerCase()} · {money(s?.valor)}</div></div>
                  <div><span className="lab">Qtd</span><input className="inp" disabled={ro} inputMode="decimal" aria-label={`Quantidade de ${s?.nome}`} value={String(it.qtd).replace(".", ",")}
                    onChange={(e: any) => { const q = parseQtd(e.target.value); setItem(i, { qtd: q == null || isNaN(q) ? 0 : q }); }} /></div>
                  <div><span className="lab">Frequência</span><select className="inp" disabled={ro} aria-label={`Frequência de ${s?.nome}`} value={it.freq} onChange={(e: any) => setItem(i, { freq: e.target.value })}>
                    {FREQS.map((q) => <option key={q} value={q}>{FREQ_LABEL[q]}</option>)}</select></div>
                  <div><span className="lab">Observação</span><input className="inp" disabled={ro} aria-label={`Observação de ${s?.nome}`} value={it.obs || ""} onChange={(e: any) => setItem(i, { obs: e.target.value })} /></div>
                  <div className="num"><span className="lab">Previsto</span>{qty(prev)}</div>
                  <div>{cob}</div>
                  <div className="num"><span className="lab">Valor</span><b>{money(r?.total || 0)}</b></div>
                  <div className="acts">{!ro && <button className="btn sm ghost" aria-label={`Remover ${s?.nome}`} onClick={() => delItem(i)}>Remover</button>}</div>
                </div>
              );
            })}
          </div>
          {!ro && (
            <div className="row" style={{ padding: 12 }}>
              <select className="inp grow" aria-label="Incluir item" value="" onChange={(e: any) => addItem(e.target.value)}>
                <option value="">+ Incluir item…</option>
                {cats.map((c) => <optgroup key={c} label={c}>{itensSvc.filter((s) => s.categoria === c).map((s) => <option key={s.id} value={s.id} disabled={f.itens.some((x) => x.sid === s.id)}>{s.nome}</option>)}</optgroup>)}
              </select>
            </div>
          )}
        </section>

        <div className="grid2" style={{ alignItems: "start" }}>
          {/* 4. relatórios */}
          <section className="card stack">
            <h2>4. Relatórios exigidos</h2>
            <p className="hint">Só os marcados aparecem como pendentes no controle de relatórios enquanto este PAD valer.</p>
            <div className="chips">{tipos.map((t) => {
              const on = f.relatorios.includes(t.id);
              return <label key={t.id} className={`tog ${on ? "on" : ""}`}><input type="checkbox" disabled={ro} checked={on}
                onChange={() => set({ relatorios: on ? f.relatorios.filter((x) => x !== t.id) : [...f.relatorios, t.id] })} />{t.nome}</label>;
            })}</div>
          </section>
          {/* 5. objetivos */}
          <section className="card stack">
            <h2>5. Objetivos e critérios de alta</h2>
            <Field label="Objetivos terapêuticos" id="pd-obj"><textarea id="pd-obj" rows={3} disabled={ro} value={f.objetivos} onChange={(e: any) => set({ objetivos: e.target.value })} /></Field>
            <Field label="Critérios de alta" id="pd-alta"><textarea id="pd-alta" rows={2} disabled={ro} value={f.alta} onChange={(e: any) => set({ alta: e.target.value })} /></Field>
          </section>
        </div>

        {/* previsto x realizado */}
        {pr && comp && (
          <section className="card flush">
            <div className="card-head"><h2>Previsto x realizado · {mesAno(comp.id)}</h2>
              <button className="btn sm sec" onClick={() => go("checklist", f.pac)}>Abrir no checklist</button></div>
            {pr.ps.length === 0 ? <div style={{ padding: "0 18px 16px" }}><p className="hint">Nenhum PAD autorizado cobre {mesAno(comp.id)}. Troque a competência no seletor para comparar outro mês.</p></div> : (
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Serviço</th><th className="num">Previsto</th><th className="num">Lançado</th><th>Situação</th></tr></thead>
                <tbody>{pr.linhas.map((l: any) => (
                  <tr key={l.sid}><td>{l.svc.nome}</td><td className="num">{l.foraDoPlano ? "—" : qty(l.previsto)}</td><td className="num">{qty(l.realizado)}</td>
                    <td>{l.foraDoPlano ? <span className="pill err">Fora do plano</span> : l.dif === 0 ? <span className="pill ok">Confere</span>
                      : l.dif < 0 ? <span className="pill warn">Faltou lançar {qty(-l.dif)}</span> : <span className="pill warn">{qty(l.dif)} acima do plano</span>}</td></tr>
                ))}</tbody>
              </table></div>
            )}
            {pr.ps.length > 1 && <p className="hint" style={{ padding: "8px 18px 14px" }}>Soma de {pr.ps.length} versões que cobrem o mês: {pr.ps.map((x: Pad) => `v${x.versao}`).join(", ")}.</p>}
          </section>
        )}

        {/* versões */}
        {f.id && (
          <section className="card stack">
            <h2>Versões deste paciente</h2>
            <div className="vers">{versoes.map((v) => {
              const s = situacao(v, hoje);
              return <button key={v.id} className={`ver ${v.id === f.id ? "on" : ""}`} onClick={() => v.id !== f.id && go("pad", { id: v.id })}>
                <b>Versão {v.versao}</b><span className="small">{dateBR(v.ini)} a {dateBR(v.fim)}</span><span className={`pill ${s.kind}`}>{s.label}</span></button>;
            })}</div>
            {anterior && (mudancas.length ? <div><h3>O que mudou em relação à versão {anterior.versao}</h3><ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>{mudancas.map((m) => <li key={m}>{m}</li>)}</ul></div>
              : <p className="hint">Sem mudanças de conteúdo em relação à versão {anterior.versao}.</p>)}
          </section>
        )}
        {f.status === "rascunho" && f.id && can("operador") && <div><button className="btn sm danger" onClick={() => setConf("excluir")}>Excluir rascunho</button></div>}
      </div>

      {conf === "excluir" && <Confirm text={`Excluir o rascunho da versão ${f.versao}?`} okText="Excluir" danger onOk={excluir} onCancel={() => setConf(null)} />}
      {conf === "autorizar" && (
        <Modal title="Marcar como autorizado" onClose={() => setConf(null)}>
          <Field label="Número da autorização da operadora" id="pd-aut2"><input id="pd-aut2" value={txt} onChange={(e: any) => setTxt(e.target.value)} /></Field>
          <div className="row"><button className="btn" disabled={!txt.trim() || busy} onClick={async () => { setConf(null); await mudarStatus({ status: "autorizado", autorizacao: txt.trim(), autorizadoEm: new Date().toISOString() }, "PAD autorizado.", "PAD autorizado"); }}>Confirmar autorização</button>
            <button className="btn sec" onClick={() => setConf(null)}>Cancelar</button></div>
        </Modal>
      )}
      {conf === "encerrar" && (
        <Modal title="Encerrar PAD" onClose={() => setConf(null)}>
          <p className="hint">Use em alta, óbito, internação hospitalar ou troca de operadora. O PAD deixa de valer a partir de hoje.</p>
          <Field label="Motivo" id="pd-enc"><input id="pd-enc" value={txt} onChange={(e: any) => setTxt(e.target.value)} /></Field>
          <div className="row"><button className="btn danger" disabled={!txt.trim() || busy} onClick={async () => { setConf(null); await mudarStatus({ status: "encerrado", motivoEnc: txt.trim(), encerradoEm: new Date().toISOString(), fim: f.fim > hoje ? hoje : f.fim }, "PAD encerrado.", "PAD encerrado"); }}>Encerrar PAD</button>
            <button className="btn sec" onClick={() => setConf(null)}>Cancelar</button></div>
        </Modal>
      )}
    </>
  );
}

/* ============================== ESCALA ============================== */
function EscalaModal({ onClose }: { onClose: () => void }) {
  const { escala, svcList, db, write, log } = useStore();
  const [e, setE] = useState(() => clone(escala) as Escala);
  const pacotes = svcList.filter((s) => s.pacote);
  const upd = (fn: (x: Escala) => void) => { const n = clone(e); fn(n); setE(n); };
  const salvar = async () => {
    const limpo: Escala = { ...e, criterios: e.criterios.filter((c) => c.nome.trim() && c.opcoes.length).map((c) => ({ ...c, opcoes: c.opcoes.filter((o) => o.t.trim()).map((o) => ({ ...o, p: Number(o.p) || 0 })) })),
      faixas: e.faixas.filter((x) => x.sid).map((x) => ({ ...x, min: Number(x.min) || 0 })) };
    if (await write(() => db.doc("config/escala").set(limpo), "Escala salva.")) { log("editar escala de complexidade", limpo.nome); onClose(); }
  };
  return (
    <Modal title="Escala de complexidade" onClose={onClose} wide>
      <p className="hint">Ajuste os critérios e os pontos para a escala que a LifeMed usa. A soma dos pontos indica a modalidade sugerida no PAD.</p>
      <Field label="Nome da escala" id="es-nome"><input id="es-nome" value={e.nome} onChange={(ev: any) => upd((x) => { x.nome = ev.target.value; })} /></Field>
      {e.criterios.map((c, ci) => (
        <div key={c.id} className="card stack" style={{ padding: 12 }}>
          <div className="row"><input className="inp grow" aria-label="Critério" value={c.nome} onChange={(ev: any) => upd((x) => { x.criterios[ci].nome = ev.target.value; })} />
            <button className="btn sm ghost" onClick={() => upd((x) => { x.criterios.splice(ci, 1); })}>Remover critério</button></div>
          {c.opcoes.map((o, oi) => (
            <div className="row" key={oi} style={{ gap: 6 }}>
              <input className="inp grow" aria-label="Opção" value={o.t} onChange={(ev: any) => upd((x) => { x.criterios[ci].opcoes[oi].t = ev.target.value; })} />
              <input className="inp" style={{ width: 70 }} aria-label="Pontos" inputMode="numeric" value={o.p} onChange={(ev: any) => upd((x) => { x.criterios[ci].opcoes[oi].p = ev.target.value; })} />
              <select className="inp" style={{ width: 190 }} aria-label="Exige modalidade" value={o.exige || ""} onChange={(ev: any) => upd((x) => { x.criterios[ci].opcoes[oi].exige = ev.target.value || undefined; })}>
                <option value="">não exige modalidade</option>{pacotes.map((s) => <option key={s.id} value={s.id}>exige {s.nome}</option>)}</select>
              <button className="btn sm ghost" aria-label="Remover opção" onClick={() => upd((x) => { x.criterios[ci].opcoes.splice(oi, 1); })}>×</button>
            </div>
          ))}
          <div><button className="btn sm sec" onClick={() => upd((x) => { x.criterios[ci].opcoes.push({ t: "", p: 0 }); })}>+ Opção</button></div>
        </div>
      ))}
      <div><button className="btn sm sec" onClick={() => upd((x) => { x.criterios.push({ id: "c" + Date.now().toString(36), nome: "Novo critério", opcoes: [{ t: "", p: 0 }] }); })}>+ Critério</button></div>
      <h3>Faixas de pontuação</h3>
      {[...e.faixas].map((fx, i) => (
        <div className="row" key={i} style={{ gap: 6 }}>
          <span className="small">A partir de</span>
          <input className="inp" style={{ width: 70 }} aria-label="Pontos mínimos" inputMode="numeric" value={fx.min} onChange={(ev: any) => upd((x) => { x.faixas[i].min = ev.target.value; })} />
          <span className="small">pontos:</span>
          <select className="inp grow" aria-label="Modalidade" value={fx.sid} onChange={(ev: any) => upd((x) => { x.faixas[i].sid = ev.target.value; })}>{pacotes.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
          <button className="btn sm ghost" aria-label="Remover faixa" onClick={() => upd((x) => { x.faixas.splice(i, 1); })}>×</button>
        </div>
      ))}
      <div><button className="btn sm sec" onClick={() => upd((x) => { x.faixas.push({ min: 0, sid: pacotes[0]?.id || "" }); })}>+ Faixa</button></div>
      <div className="row"><button className="btn" onClick={salvar}>Salvar escala</button><button className="btn sec" onClick={onClose}>Cancelar</button></div>
    </Modal>
  );
}

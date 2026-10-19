import { useStore, uid } from "../lib/store";
import { useResults } from "../lib/hooks";
import { inclusosDoPaciente, overview, Lanc } from "../lib/views";
import { days, LineResult } from "../lib/engine";
import { dateBR, horasBR, isHora, money, norm, parseQtd, qty } from "../lib/format";
import { Banner, Confirm, Empty, Field, Modal, PageHead, useNav } from "../components/ui";
import Timeline from "../components/Timeline";

const { useMemo, useState, useEffect } = React;

interface FormState { sid: string; qtd: string; ini: string; fim: string; cobrar: boolean; obs: string }
const VAZIO: FormState = { sid: "", qtd: "", ini: "", fim: "", cobrar: false, obs: "" };

function LancForm({ pid, edit, onClose, inclusos }: { pid: string; edit: Lanc | null; onClose: () => void; inclusos: any[] }) {
  const { db, comp, svcList, servicos, write, log, meId, pacientes } = useStore();
  const [f, setF] = useState(edit ? { sid: edit.sid, qtd: String(edit.qtd).replace(".", ","), ini: edit.ini || "", fim: edit.fim || "", cobrar: edit.modo === "cobrar", obs: edit.obs || "" } : VAZIO);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const svc = servicos[f.sid];
  const ativos = svcList.filter((s) => s.ativo || s.id === f.sid);
  const cats = [...new Set(ativos.map((s) => s.categoria))];
  const q = parseQtd(f.qtd);
  const periodo = f.ini && f.fim && f.fim >= f.ini ? days(f.ini, f.fim) : null;
  const inc = inclusos.find((i) => i.svc.id === f.sid);
  const set = (k: keyof FormState) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const salvar = async (e: any) => {
    e.preventDefault(); setErro("");
    if (!svc) return setErro("Escolha o serviço.");
    if (!!f.ini !== !!f.fim) return setErro("Informe as duas datas (início e fim) ou deixe as duas em branco.");
    if (f.ini && f.fim) {
      if (f.ini > f.fim) return setErro("A data de início está depois da data final.");
      if (f.ini < comp!.ini || f.fim > comp!.fim) return setErro(`As datas precisam estar dentro da competência (${dateBR(comp!.ini)} a ${dateBR(comp!.fim)}).`);
    }
    let qtd = q;
    if (qtd == null && svc.pacote && periodo) qtd = periodo;
    if (qtd == null || isNaN(qtd) || qtd <= 0) return setErro(isHora(svc.nome) ? "Informe a quantidade de horas (ex.: 7:37 ou 7,6167)." : "Informe a quantidade (maior que zero).");
    const base: any = { sid: svc.id, qtd, ini: f.ini || "", fim: f.fim || "", modo: f.cobrar ? "cobrar" : "auto", obs: f.obs.trim() };
    setBusy(true);
    let ok: boolean;
    if (edit) {
      const vu = edit.sid === svc.id ? edit.vu : svc.valor;
      ok = await write(() => db.doc(`lancamentos/${edit.id}`).update({ ...base, vu, editPor: meId || "", editEm: new Date().toISOString() }), "Lançamento atualizado.");
      if (ok) log("editar lançamento", pacientes[pid]?.nome || pid, `${svc.nome}: ${qty(qtd)}`);
    } else {
      const id = uid("l");
      ok = await write(() => db.doc(`lancamentos/${id}`).set({ ...base, comp: comp!.id, pac: pid, vu: svc.valor, por: meId || "", em: new Date().toISOString() }), "Serviço lançado.");
      if (ok) log("lançar", pacientes[pid]?.nome || pid, `${svc.nome}: ${qty(qtd)}`);
    }
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal title={edit ? "Editar lançamento" : "Lançar serviço"} onClose={onClose}>
      <form className="stack" onSubmit={salvar}>
        <Field label="Serviço" id="lf-svc">
          <select id="lf-svc" required value={f.sid} onChange={set("sid")}>
            <option value="">Escolha…</option>
            {cats.map((c) => <optgroup key={c} label={c}>{ativos.filter((s) => s.categoria === c).map((s) => <option key={s.id} value={s.id}>{s.nome} — {money(s.valor)}</option>)}</optgroup>)}
          </select>
        </Field>
        <div className="grid2">
          <Field label="Início" id="lf-ini"><input id="lf-ini" type="date" min={comp!.ini} max={comp!.fim} value={f.ini} onChange={set("ini")} /></Field>
          <Field label="Fim" id="lf-fim"><input id="lf-fim" type="date" min={f.ini || comp!.ini} max={comp!.fim} value={f.fim} onChange={set("fim")} /></Field>
        </div>
        <Field label={svc && isHora(svc.nome) ? "Horas" : svc?.pacote ? "Diárias" : "Quantidade"} id="lf-qtd"
          hint={svc && isHora(svc.nome) ? (q && !isNaN(q) ? `= ${qty(Math.round(q * 10000) / 10000)} h (${horasBR(q)}). Pode digitar 7:37.` : "Digite como no relatório, por exemplo 7:37 (7 h 37 min).")
            : svc?.pacote && periodo ? `Em branco = ${periodo} diárias (dias do período).` : "Aceita decimais, por exemplo 2,5."}>
          <input id="lf-qtd" inputMode="decimal" autoComplete="off" value={f.qtd} onChange={set("qtd")} placeholder={svc && isHora(svc.nome) ? "7:37" : ""} />
        </Field>
        {inc && !f.cobrar && <Banner kind="info">{inc.svc.nome} está incluso no pacote deste paciente ({inc.pacotes.join(", ")}). Só será cobrado o que cair fora dos dias do pacote{inc.limite === "dias" ? ", até 1 por dia de pacote" : ""}.</Banner>}
        <label className="check"><input type="checkbox" checked={f.cobrar} onChange={set("cobrar")} />
          <span><b>Cobrar mesmo dentro do pacote</b><br /><span className="hint">Use só em exceções. Normalmente deixe desmarcado e informe as datas: o sistema decide o que o pacote cobre.</span></span></label>
        <Field label="Observação" id="lf-obs"><input id="lf-obs" maxLength={300} value={f.obs} onChange={set("obs")} /></Field>
        {erro && <Banner kind="err">{erro}</Banner>}
        <div className="row"><button className="btn" disabled={busy}>{edit ? "Salvar alterações" : "Lançar serviço"}</button><button type="button" className="btn sec" onClick={onClose}>Cancelar</button></div>
      </form>
    </Modal>
  );
}

function LinhaQtd({ r }: { r: LineResult }) {
  const h = isHora(r.svc.nome);
  return <>{qty(r.line.qtd)}{h && <span className="hint"> ({horasBR(r.line.qtd)})</span>}</>;
}

export default function Checklist() {
  const { comp, pacList, pacientes, svcList, servicos, rules, lancs, editavel, db, write, log, names } = useStore();
  const { arg } = useNav();
  const res = useResults();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [sel, setSel] = useState((arg as string) || "");
  const [form, setForm] = useState(null as null | { edit: Lanc | null });
  const [del, setDel] = useState(null as Lanc | null);
  useEffect(() => { if (arg) setSel(arg); }, [arg]);

  const ov = useMemo(() => overview(pacList, res), [pacList, res]);
  const vis = ov.filter((o) => norm(o.p.nome).includes(norm(busca)) && (filtro === "todos" || (filtro === "com" ? o.linhas > 0 : o.linhas === 0)));
  const rs = (sel && res[sel]) || [];
  const inclusos = useMemo(() => inclusosDoPaciente(rs, servicos, rules), [rs, servicos, rules]);
  const cob = rs.reduce((a, r) => a + r.total, 0), nc = rs.reduce((a, r) => a + r.naoCobrado, 0);
  const p = sel ? pacientes[sel] : null;
  const lancById = useMemo(() => Object.fromEntries(lancs.map((l) => [l.id, l])), [lancs]);
  const ordered = [...rs].sort((a, b) => Number(b.svc.pacote) - Number(a.svc.pacote) || (a.line.ini || "").localeCompare(b.line.ini || "") || a.svc.ordem - b.svc.ordem);
  const nm = names(rs.map((r) => lancById[r.line.id]?.por || ""));

  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const excluir = async () => {
    const l = del!; setDel(null);
    if (await write(() => db.doc(`lancamentos/${l.id}`).delete(), "Lançamento excluído.")) log("excluir lançamento", pacientes[l.pac]?.nome || l.pac, `${servicos[l.sid]?.nome}: ${qty(l.qtd)}`);
  };

  return (
    <>
      <PageHead title="Checklist de serviços">
        Escolha o paciente e lance o pacote e os serviços usados, com as datas. O que o pacote já inclui deixa de ser cobrado sozinho, só nos dias em que o pacote vale.
      </PageHead>
      {comp.status === "fechada" && <div style={{ marginBottom: 12 }}><Banner kind="warn">Competência fechada: os lançamentos estão só para consulta.</Banner></div>}
      <div className={`bench ${sel ? "has-sel" : ""}`}>
        <div className="card flush plist-card">
          <div className="stack" style={{ padding: 12, gap: 8 }}>
            <input className="inp" placeholder="Buscar paciente" aria-label="Buscar paciente" value={busca} onChange={(e: any) => setBusca(e.target.value)} />
            <div className="seg" role="tablist" aria-label="Filtrar">
              {[["todos", "Todos"], ["com", "Com serviços"], ["sem", "Sem serviços"]].map(([k, l]) => <button key={k} className={filtro === k ? "on" : ""} onClick={() => setFiltro(k)}>{l}</button>)}
            </div>
          </div>
          <div className="plist">
            {vis.map((o) => (
              <button key={o.p.id} className={`pitem ${sel === o.p.id ? "on" : ""}`} onClick={() => setSel(o.p.id)}>
                <b>{o.p.nome}</b>
                <span className="meta"><span>{o.linhas ? `${o.linhas} lançamento(s)` : "sem lançamentos"}</span><span>{o.linhas ? money(o.cobrado) : ""}</span></span>
                {o.pacotes.length > 0 && <span className="meta"><span className="pill info">{o.pacotes.join(" · ")}</span></span>}
              </button>
            ))}
            {vis.length === 0 && <Empty>Nenhum paciente encontrado.</Empty>}
          </div>
        </div>

        <div className="stack detail" style={{ minWidth: 0 }}>
          {!p && <div className="card"><Empty>Escolha um paciente na lista para ver e lançar os serviços do mês.</Empty></div>}
          {p && (
            <>
              <div className="card stack">
                <div className="row between" style={{ alignItems: "flex-start" }}>
                  <div className="grow">
                    <button className="btn ghost sm only-mobile" style={{ marginLeft: -10, marginBottom: 4 }} onClick={() => setSel("")}>‹ Pacientes</button>
                    <h2>{p.nome}</h2>
                    <p className="hint">{p.municipio || "Município não informado"} · admissão {dateBR(p.admissao)}{p.cns ? ` · CNS ${p.cns}` : ""}</p>
                  </div>
                  {editavel && <button className="btn" onClick={() => setForm({ edit: null })}>+ Lançar serviço</button>}
                </div>
                <div className="kpis">
                  <div className="kpi money"><span>Cobrado no mês</span><b>{money(cob)}</b></div>
                  <div className="kpi cov"><span>Incluso em pacote</span><b>{money(nc)}</b></div>
                </div>
                <Timeline ini={comp.ini} fim={comp.fim} res={rs} />
                {inclusos.length > 0 && (
                  <div className="stack" style={{ gap: 6 }}>
                    <h3>O que o pacote já inclui</h3>
                    <p className="hint">Se usado nos dias do pacote, entra como incluso. Tracejado: até 1 por dia de pacote.</p>
                    <div className="chips">{inclusos.map((i) => <span key={i.svc.id} className={`chip ${i.limite === "dias" ? "dias" : ""}`} title={i.pacotes.join(", ")}>{i.svc.nome}</span>)}</div>
                  </div>
                )}
              </div>

              <div className="card flush">
                <div className="lines">
                  <div className="lrow head"><span>Serviço</span><span>Período</span><span className="num">Informado</span><span className="num">Incluso</span><span className="num">Cobrado</span><span className="num">Total</span><span /></div>
                  {ordered.length === 0 && <Empty><p>Nenhum serviço lançado para este paciente.</p>{editavel && <button className="btn" onClick={() => setForm({ edit: null })}>Lançar o primeiro serviço</button>}</Empty>}
                  {ordered.map((r) => {
                    const l = lancById[r.line.id];
                    return (
                      <div className="lrow" key={r.line.id}>
                        <div className="svc"><b>{r.svc.nome}</b> {r.svc.pacote && <span className="pill info">pacote</span>} {r.line.modo === "cobrar" && <span className="pill warn">cobrar sempre</span>}
                          <div className="hint">{money(r.line.vu)} por unidade{l?.por ? ` · ${nm[l.por] || "…"}` : ""}{l?.obs ? ` · ${l.obs}` : ""}</div></div>
                        <div className="c"><span className="lab">Período:</span>{r.line.ini ? `${dateBR(r.line.ini)} a ${dateBR(r.line.fim)}` : <span className="muted">sem datas</span>}</div>
                        <div className="c num"><span className="lab">Informado:</span><LinhaQtd r={r} /></div>
                        <div className="c num"><span className="lab">Incluso:</span>{r.inclusa > 0 ? <span className="pill cov">{qty(r.inclusa)}</span> : "—"}</div>
                        <div className="c num"><span className="lab">Cobrado:</span>{qty(r.cobrada)}</div>
                        <div className="c num"><span className="lab">Total:</span><b>{money(r.total)}</b></div>
                        <div className="acts">{editavel && l && <><button className="btn sm sec" onClick={() => setForm({ edit: l })}>Editar</button><button className="btn sm danger" onClick={() => setDel(l)}>Excluir</button></>}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {form && sel && <LancForm pid={sel} edit={form.edit} inclusos={inclusos} onClose={() => setForm(null)} />}
      {del && <Confirm text={`Excluir o lançamento de ${servicos[del.sid]?.nome || "serviço"} (${qty(del.qtd)})?`} okText="Excluir" danger onOk={excluir} onCancel={() => setDel(null)} />}
    </>
  );
}

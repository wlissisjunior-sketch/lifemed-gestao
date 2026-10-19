import { useStore } from "../lib/store";
import { useResults } from "../lib/hooks";
import { faturamento, fechamento, fisicoFinanceiro } from "../lib/views";
import { dateBR, horasBR, isHora, mesAno, money, norm, parseQtd, pct, qty } from "../lib/format";
import { pdfFechamento, xlsxFaturamento, xlsxFechamento, xlsxFisicoFinanceiro } from "../lib/exporters";
import { Banner, Empty, Field, PageHead, useNav } from "../components/ui";
import { LOGO } from "../assets";

const { useMemo, useState, useEffect } = React;

export function Faturamento() {
  const { comp, pacientes, downloads, toast } = useStore();
  const { go } = useNav();
  const res = useResults();
  const [busca, setBusca] = useState("");
  const fat = useMemo(() => (comp ? faturamento(pacientes, res, comp) : { blocos: [], total: 0 }), [pacientes, res, comp]);
  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const vis = fat.blocos.filter((b) => norm(b.p.nome).includes(norm(busca)));
  return (
    <>
      <PageHead title="Faturamento por paciente" actions={downloads && fat.blocos.length > 0 && <button className="btn" onClick={() => xlsxFaturamento(comp, fat, downloads, toast)}>Baixar Excel</button>}>
        Uma linha por serviço cobrado, com o total de cada paciente. O que o pacote já incluiu não aparece. Mesmo layout da planilha de faturamento de pacientes.
      </PageHead>
      <div className="kpis" style={{ marginBottom: 14 }}>
        <div className="kpi money"><span>Total faturamento · {mesAno(comp.id)}</span><b>{money(fat.total)}</b></div>
        <div className="kpi"><span>Pacientes faturados</span><b>{fat.blocos.length}</b></div>
      </div>
      <div className="card flush">
        <div style={{ padding: 12 }}><input className="inp" placeholder="Buscar paciente" aria-label="Buscar paciente" value={busca} onChange={(e: any) => setBusca(e.target.value)} /></div>
        <div className="tbl-wrap" style={{ maxHeight: "none" }}><table className="tbl">
          <thead><tr><th>Programa de assistência</th><th>Início</th><th>Final</th><th className="num">Nº diárias</th><th className="num">Valor unit.</th><th className="num">Valor total</th></tr></thead>
          <tbody>
            {vis.map((b) => [
              <tr className="group" key={"g" + b.p.id}><td colSpan={6}>
                <div className="row between"><span>{b.p.nome}<span className="muted" style={{ fontWeight: 400 }}> · {b.p.municipio || "município não informado"} · admissão {dateBR(b.p.admissao)}</span></span>
                  <button className="btn ghost sm" onClick={() => go("fechamento", b.p.id)}>Fechamento</button></div></td></tr>,
              ...b.linhas.map((l, i) => (
                <tr key={b.p.id + i}><td className="small">{l.programa}</td><td>{dateBR(l.ini)}</td><td>{dateBR(l.fim)}</td>
                  <td className="num">{qty(l.qtd)}{isHora(l.r.svc.nome) && <span className="hint"> ({horasBR(l.qtd)})</span>}</td><td className="num">{money(l.vu)}</td><td className="num">{money(l.total)}</td></tr>
              )),
              <tr className="sub" key={"t" + b.p.id}><td colSpan={5} className="num">Total individual</td><td className="num">{money(b.total)}</td></tr>,
            ])}
            {vis.length === 0 && <tr><td colSpan={6}><Empty>Nenhum serviço cobrado {busca ? "para essa busca" : "nesta competência"}.</Empty></td></tr>}
            <tr className="total"><td colSpan={5} className="num">Total faturamento</td><td className="num">{money(fat.total)}</td></tr>
          </tbody>
        </table></div>
      </div>
    </>
  );
}

export function Fisico() {
  const { comp, svcList, downloads, toast } = useStore();
  const res = useResults();
  const all = useMemo(() => Object.values(res).flat(), [res]);
  const ff = useMemo(() => fisicoFinanceiro(svcList, all), [svcList, all]);
  const [soUsados, setSo] = useState(true);
  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const rows = ff.rows.filter((r) => !soUsados || r.fisico > 0 || r.incluso > 0);
  const cats = [...new Set(rows.map((r) => r.svc.categoria))];
  return (
    <>
      <PageHead title="Físico-financeiro" actions={downloads && <button className="btn" onClick={() => xlsxFisicoFinanceiro(comp, ff, downloads, toast)}>Baixar Excel</button>}>
        Total da competência por serviço, de {dateBR(comp.ini)} a {dateBR(comp.fim)}. Físico é a quantidade cobrada, já sem o que os pacotes incluem.
      </PageHead>
      <div className="kpis" style={{ marginBottom: 14 }}>
        <div className="kpi money"><span>Total geral</span><b>{money(ff.total)}</b></div>
        <div className="kpi cov"><span>Incluso em pacotes (não cobrado)</span><b>{money(ff.naoCobrado)}</b><small>controle interno</small></div>
      </div>
      <div className="grid2" style={{ gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1fr)", alignItems: "start" }}>
        <div className="card flush">
          <div className="card-head"><h2>Por serviço</h2><label className="check small"><input type="checkbox" checked={soUsados} onChange={(e: any) => setSo(e.target.checked)} />Só serviços usados</label></div>
          <div className="tbl-wrap" style={{ maxHeight: "none" }}><table className="tbl">
            <thead><tr><th>Procedimento</th><th className="num">Valor unit.</th><th className="num">Físico</th><th className="num">Financeiro</th><th className="num only-desktop">Incluso</th></tr></thead>
            <tbody>
              {cats.map((c) => [
                <tr className="group" key={"g" + c}><td colSpan={5}>{c}</td></tr>,
                ...rows.filter((r) => r.svc.categoria === c).map((r) => (
                  <tr key={r.svc.id} className={r.fisico === 0 ? "dim" : ""}><td className="small">{r.svc.descricao || r.svc.nome}</td><td className="num">{money(r.svc.valor)}</td>
                    <td className="num">{qty(r.fisico)}</td><td className="num"><b>{money(r.financeiro)}</b></td><td className="num only-desktop">{r.incluso ? qty(r.incluso) : "—"}</td></tr>
                )),
              ])}
              <tr className="total"><td colSpan={3} className="num">Total geral</td><td className="num">{money(ff.total)}</td><td className="only-desktop" /></tr>
            </tbody>
          </table></div>
        </div>
        <div className="card">
          <h2>Por categoria</h2>
          {ff.categorias.filter((c) => c.valor > 0).sort((a, b) => b.valor - a.valor).map((c) => (
            <div key={c.categoria} style={{ margin: "12px 0" }}>
              <div className="row between small"><span>{c.categoria}</span><b>{money(c.valor)}</b></div>
              <div className="bar" style={{ gridTemplateColumns: "minmax(0,1fr) 40px", margin: "4px 0" }}><div className="track"><i className="b" style={{ width: `${c.pct * 100}%` }} /></div><span className="hint num">{pct(c.pct)}</span></div>
            </div>
          ))}
          {ff.total === 0 && <Empty>Nada cobrado ainda.</Empty>}
        </div>
      </div>
    </>
  );
}

export function Fechamento() {
  const { comp, pacientes, downloads, toast } = useStore();
  const { arg } = useNav();
  const res = useResults();
  const com = useMemo(() => Object.keys(res).filter((k) => pacientes[k]).sort((a, b) => pacientes[a].nome.localeCompare(pacientes[b].nome, "pt-BR")), [res, pacientes]);
  const [pid, setPid] = useState((arg as string) || "");
  const [manual, setManual] = useState("");
  useEffect(() => { if (arg) setPid(arg); }, [arg]);
  useEffect(() => { if (!pid || !com.includes(pid)) setPid(com[0] || ""); }, [com.join(",")]);
  useEffect(() => setManual(""), [pid]);
  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const p = pid ? pacientes[pid] : null;
  const fe = p ? fechamento(res[pid] || []) : null;
  const m = parseQtd(manual);
  const dif = fe && m != null && !isNaN(m) ? Math.round((fe.total - m) * 100) / 100 : null;
  return (
    <>
      <PageHead title="Fechamento do paciente" actions={p && fe && downloads && <>
        <button className="btn sec" onClick={() => xlsxFechamento(comp, p, fe, downloads, toast)}>Baixar Excel</button>
        <button className="btn" onClick={() => pdfFechamento(comp, p, fe, downloads, toast)}>Baixar PDF</button></>}>
        Relatório individual com quantidade, descrição, valor unitário e total de cada serviço cobrado no período.
      </PageHead>
      {com.length === 0 ? <div className="card"><Empty>Nenhum paciente com serviços nesta competência.</Empty></div> : (
        <div className="stack">
          <div className="grid2" style={{ alignItems: "end" }}>
            <Field label="Paciente" id="fe-pac"><select id="fe-pac" value={pid} onChange={(e: any) => setPid(e.target.value)}>{com.map((k) => <option key={k} value={k}>{pacientes[k].nome}</option>)}</select></Field>
            <Field label="Conferir com a fatura feita à mão (total)" id="fe-man" hint="Opcional: digite o total da fatura manual para ver a diferença.">
              <input id="fe-man" inputMode="decimal" placeholder="ex.: 64.787,23" value={manual} onChange={(e: any) => setManual(e.target.value)} /></Field>
          </div>
          {dif != null && (Math.abs(dif) < 0.01 ? <Banner kind="ok">A fatura manual bate com o sistema.</Banner>
            : <Banner kind="warn">Diferença de <b>{money(Math.abs(dif))}</b>: a fatura manual está {dif > 0 ? "abaixo" : "acima"} do sistema. Causas comuns: horas digitadas como 7,37 em vez de 7:37, km ou horas da remoção somados no total, quantidade de diárias.</Banner>)}
          {p && fe && (
            <div className="sheet">
              <header><div className="lg"><img src={LOGO} alt="LifeMed" /></div><div><h2 style={{ fontFamily: "var(--f-display)", fontSize: 22 }}>Relatório de fechamento</h2><p className="hint">Competência de {mesAno(comp.id)}</p></div></header>
              <dl><dt>Data</dt><dd>{dateBR(comp.ini)} a {dateBR(comp.fim)}</dd><dt>Paciente</dt><dd>{p.nome}</dd><dt>CNS</dt><dd>{p.cns || "—"}</dd></dl>
              <div className="tbl-wrap" style={{ maxHeight: "none" }}><table className="tbl">
                <thead><tr><th className="num">Qtd</th><th>Descrição</th><th className="num">Valor unit.</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {fe.linhas.map((l) => <tr key={l.svc.id + l.vu}><td className="num">{qty(l.qtd)}{isHora(l.svc.nome) && <div className="hint">{horasBR(l.qtd)}</div>}</td><td className="small">{l.svc.descricao || l.svc.nome}</td><td className="num">{money(l.vu)}</td><td className="num">{money(l.total)}</td></tr>)}
                  <tr className="total"><td colSpan={3} className="num">Total</td><td className="num">{money(fe.total)}</td></tr>
                </tbody>
              </table></div>
              {fe.naoCobrado > 0 && <p className="hint" style={{ marginTop: 8 }}>Incluso no pacote e não cobrado: {money(fe.naoCobrado)} (não sai no PDF).</p>}
              <p className="foot">LIFE MED MEDICINA ESPECIALIZADA · CNPJ 56.378.234/0001-21 · Rua Intendente Abdon, 153 A, Queimadinha, Feira de Santana – BA</p>
            </div>
          )}
          {!downloads && <Banner kind="info">Os botões de download aparecem quando o sistema é aberto pelo link do claude.ai.</Banner>}
        </div>
      )}
    </>
  );
}

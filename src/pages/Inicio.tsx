import { useStore } from "../lib/store";
import { useResults, useMatriz } from "../lib/hooks";
import { situacao, ultimasVersoes } from "../lib/pad";
import { fisicoFinanceiro, overview } from "../lib/views";
import { dateBR, mesAno, money, pct, shortName, todayISO } from "../lib/format";
import { Banner, Empty, PageHead, useNav } from "../components/ui";

const { useMemo } = React;

export default function Inicio() {
  const { comp, svcList, pacList, editavel, can, pads } = useStore();
  const { go } = useNav();
  const res = useResults();
  const all = useMemo(() => Object.values(res).flat(), [res]);
  const ff = useMemo(() => fisicoFinanceiro(svcList, all), [svcList, all]);
  const ov = useMemo(() => overview(pacList, res), [pacList, res]);
  const alertas = useMemo(() => {
    const ult = ultimasVersoes(pads); const hoje = todayISO();
    const ativos = pacList.filter((p) => p.ativo);
    const comPad = ativos.map((p) => ({ p, pad: ult[p.id], s: ult[p.id] ? situacao(ult[p.id], hoje) : null }));
    return {
      avencer: comPad.filter((x) => x.s?.k === "avencer"),
      vencidos: comPad.filter((x) => x.s?.k === "vencido"),
      aguardando: comPad.filter((x) => x.s?.k === "enviado"),
      sem: comPad.filter((x) => !x.pad),
    };
  }, [pads, pacList]);
  const m = useMatriz();
  if (!comp) return (
    <>
      <PageHead title="Bem-vindo" />
      <div className="card"><Empty><p>Nenhuma competência criada ainda.</p>{can("operador") && <p className="hint">Use o seletor de competência e escolha “+ Nova competência”.</p>}</Empty></div>
    </>
  );
  const com = ov.filter((o) => o.linhas > 0);
  const sem = ov.filter((o) => o.p.ativo && o.linhas === 0);
  const top = [...com].sort((a, b) => b.cobrado - a.cobrado).slice(0, 6);
  const maxTop = top[0]?.cobrado || 1;
  return (
    <>
      <PageHead title={`Fechamento de ${mesAno(comp.id)}`}>
        Período de {dateBR(comp.ini)} a {dateBR(comp.fim)}. {comp.status === "fechada" ? "A competência está fechada: os dados ficam só para consulta." : "Os lançamentos estão abertos."}
      </PageHead>
      <div className="stack">
        <div className="kpis">
          <div className="kpi money"><span>Faturamento da competência</span><b>{money(ff.total)}</b><small>{com.length} paciente(s) com serviços</small></div>
          <div className="kpi cov"><span>Incluso em pacotes (não cobrado)</span><b>{money(ff.naoCobrado)}</b><small>o que os pacotes já cobrem</small></div>
          <div className="kpi ok"><span>Relatórios entregues</span><b>{m.entregues} de {m.esperados}</b><small>{pct(m.pct)} concluído</small></div>
          <div className="kpi warn"><span>Ativos sem lançamento</span><b>{sem.length}</b><small>de {pacList.filter((p) => p.ativo).length} pacientes ativos</small></div>
        </div>
        {(alertas.avencer.length + alertas.vencidos.length + alertas.aguardando.length) > 0 && (
          <Banner kind="warn"><b>PAD:</b>{" "}
            {alertas.avencer.map((x) => `${shortName(x.p.nome)} (${x.s!.label.toLowerCase()})`).join(", ")}{alertas.avencer.length > 0 && alertas.vencidos.length > 0 ? " · " : ""}
            {alertas.vencidos.length > 0 && `vencido: ${alertas.vencidos.map((x) => shortName(x.p.nome)).join(", ")}`}
            {alertas.aguardando.length > 0 && ` · aguardando autorização: ${alertas.aguardando.length}`}
            {alertas.sem.length > 0 && ` · ${alertas.sem.length} paciente(s) ativo(s) sem PAD`}{" "}
            <button className="btn ghost sm" onClick={() => go("pad")}>Ver planos</button></Banner>
        )}
        {sem.length > 0 && editavel && (
          <Banner kind="warn">Ainda sem serviços lançados: {sem.slice(0, 6).map((o) => shortName(o.p.nome)).join(", ")}{sem.length > 6 ? ` e mais ${sem.length - 6}` : ""}.{" "}
            <button className="btn ghost sm" onClick={() => go("checklist")}>Abrir o checklist</button></Banner>
        )}
        <div className="grid2" style={{ alignItems: "start" }}>
          <div className="card">
            <div className="row between"><h2>Maiores valores do mês</h2><button className="btn ghost sm" onClick={() => go("faturamento")}>Ver faturamento</button></div>
            {top.length === 0 ? <Empty>Nenhum serviço lançado nesta competência.</Empty> : top.map((o) => (
              <div className="bar" key={o.p.id}><span className="name" title={o.p.nome}>{shortName(o.p.nome)}</span>
                <div className="track"><i className="b" style={{ width: `${(o.cobrado / maxTop) * 100}%` }} /></div>
                <span className="num small" style={{ minWidth: 0 }}>{money(o.cobrado).replace("R$", "").trim()}</span></div>
            ))}
          </div>
          <div className="card stack">
            <h2>O mês em quatro passos</h2>
            <ol className="small" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              <li><b>Planejar</b> o <button className="btn ghost sm" onClick={() => go("pad")}>PAD</button> de cada paciente e <b>lançar</b> o mês no <button className="btn ghost sm" onClick={() => go("checklist")}>Checklist</button></li>
              <li><b>Conferir</b> o <button className="btn ghost sm" onClick={() => go("faturamento")}>Faturamento</button> e o <button className="btn ghost sm" onClick={() => go("fisico")}>Físico-financeiro</button></li>
              <li><b>Emitir</b> o <button className="btn ghost sm" onClick={() => go("fechamento")}>Fechamento</button> de cada paciente em PDF</li>
              <li><b>Anexar</b> os <button className="btn ghost sm" onClick={() => go("relatorios")}>Relatórios</button> em PDF e fechar a competência</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

import { useStore } from "../lib/store";
import { dateBR, dateTimeBR, mesAno } from "../lib/format";
import { Banner, Confirm, Empty, PageHead } from "../components/ui";
import { resetDemo } from "../lib/datasource";

const { useEffect, useState } = React;

export default function Ajustes() {
  const { comps, can, db, write, log, meId, names, tipos, role, setComp } = useStore();
  const admin = can("admin");
  const [audit, setAudit] = useState([] as any[]);
  const [conf, setConf] = useState(null as any);
  const [tEd, setTEd] = useState(null as any[] | null);
  const [rst, setRst] = useState(false);

  useEffect(() => {
    if (!db) return;
    const un = db.collection("auditoria").orderBy("em", "desc").limit(150).onSnapshot((s: any) => setAudit(s.docs.map((d: any) => ({ id: d.id, ...d.data() }))), () => undefined);
    return () => un();
  }, [db]);
  const nm = names(audit.map((a) => a.por));

  const alternar = async (c: any) => {
    setConf(null);
    const fechar = c.status === "aberta";
    const ok = await write(() => db.doc(`fechamentos/${c.id}`).set(fechar ? { status: "fechada", por: meId || "", em: new Date().toISOString() } : { status: "aberta", por: meId || "", em: new Date().toISOString() }),
      fechar ? `Competência de ${mesAno(c.id)} fechada.` : `Competência de ${mesAno(c.id)} reaberta.`);
    if (ok) log(fechar ? "fechar competência" : "reabrir competência", c.id);
  };
  const salvarTipos = async () => {
    const lista = tEd!.map((t) => ({ ...t, nome: t.nome.trim() })).filter((t) => t.nome);
    if (await write(() => db.doc("config/relatorios").set({ tipos: lista }), "Tipos de relatório salvos.")) { log("editar tipos de relatório", `${lista.length} tipos`); setTEd(null); }
  };

  return (
    <>
      <PageHead title="Competências e ajustes">Fechar uma competência trava os lançamentos daquele mês. Só administradores fecham e reabrem.</PageHead>
      <div className="stack">
        <div className="card flush">
          <div className="card-head"><h2>Competências</h2></div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Mês</th><th>Período</th><th>Situação</th><th /></tr></thead>
            <tbody>
              {comps.map((c) => (
                <tr key={c.id}><td><b>{mesAno(c.id)}</b></td><td>{dateBR(c.ini)} a {dateBR(c.fim)}</td>
                  <td><span className={`pill ${c.status === "aberta" ? "ok" : "warn"}`}>{c.status === "aberta" ? "Aberta" : "Fechada"}</span>{c.fechadaEm && c.status === "fechada" && <div className="hint">em {dateTimeBR(c.fechadaEm)}</div>}</td>
                  <td className="num"><div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                    <button className="btn sm sec" onClick={() => setComp(c.id)}>Selecionar</button>
                    {admin && <button className="btn sm sec" onClick={() => setConf(c)}>{c.status === "aberta" ? "Fechar" : "Reabrir"}</button>}</div></td></tr>
              ))}
              {comps.length === 0 && <tr><td colSpan={4}><Empty>Nenhuma competência criada.</Empty></td></tr>}
            </tbody>
          </table></div>
        </div>

        <div className="grid2" style={{ alignItems: "start" }}>
          <div className="card stack">
            <div className="row between"><h2>Tipos de relatório</h2>{admin && !tEd && <button className="btn sm sec" onClick={() => setTEd(tipos.map((t) => ({ ...t })))}>Editar</button>}</div>
            {!tEd ? <div className="chips">{tipos.map((t) => <span className="pill" key={t.id}>{t.nome}</span>)}</div> : (
              <div className="stack" style={{ gap: 8 }}>
                {tEd.map((t, i) => <div className="row" key={t.id}><input className="inp grow" aria-label={`Tipo ${i + 1}`} value={t.nome} onChange={(e: any) => { const n = [...tEd]; n[i] = { ...t, nome: e.target.value }; setTEd(n); }} /></div>)}
                <button className="btn sm sec" onClick={() => setTEd([...tEd, { id: "r" + Date.now().toString(36), nome: "" }])}>+ Adicionar tipo</button>
                <p className="hint">Para remover um tipo, apague o nome. Os registros já marcados ficam guardados.</p>
                <div className="row"><button className="btn" onClick={salvarTipos}>Salvar</button><button className="btn sec" onClick={() => setTEd(null)}>Cancelar</button></div>
              </div>
            )}
          </div>
          <div className="card stack">
            <h2>Acesso</h2>
            <p className="small">Seu acesso: <b>{role === "admin" ? "administrador" : role === "operador" ? "operador" : "somente leitura"}</b>.</p>
            <ul className="small" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
              <li><b>Administrador:</b> altera valores, regras de pacote, tabelas e fecha competências.</li>
              <li><b>Operador:</b> lança serviços, cadastra pacientes e marca relatórios.</li>
              <li><b>Leitor:</b> só consulta e baixa relatórios.</li>
            </ul>
            <p className="hint">Versão de demonstração: os dados ficam só neste navegador. Na versão com banco de dados, cada pessoa entra com e-mail e senha.</p>
            <button className="btn sec sm" onClick={() => setRst(true)}>Restaurar dados de exemplo</button>
          </div>
        </div>

        <div className="card flush">
          <div className="card-head"><h2>Histórico de alterações</h2><span className="hint">últimas 150</span></div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Detalhe</th></tr></thead>
            <tbody>
              {audit.map((a) => <tr key={a.id}><td className="small">{dateTimeBR(a.em)}</td><td className="small">{nm[a.por] || (a.por ? "Usuário" : "—")}</td><td className="small"><b>{a.acao}</b> · {a.alvo}</td><td className="small muted">{a.det}</td></tr>)}
              {audit.length === 0 && <tr><td colSpan={4}><Empty>Nenhuma alteração registrada ainda.</Empty></td></tr>}
            </tbody>
          </table></div>
        </div>
        {!admin && <Banner kind="info">Algumas opções desta tela aparecem só para administradores.</Banner>}
      </div>
      {rst && <Confirm text="Apagar tudo o que foi lançado neste navegador e voltar aos dados de exemplo?" okText="Restaurar" danger onOk={() => { setRst(false); resetDemo(); }} onCancel={() => setRst(false)} />}
      {conf && <Confirm text={conf.status === "aberta" ? `Fechar a competência de ${mesAno(conf.id)}? Os lançamentos ficam travados até alguém reabrir.` : `Reabrir a competência de ${mesAno(conf.id)} para edição?`}
        okText={conf.status === "aberta" ? "Fechar competência" : "Reabrir"} onOk={() => alternar(conf)} onCancel={() => setConf(null)} />}
    </>
  );
}

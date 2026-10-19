import { useStore } from "../lib/store";
import { dateBR, dateTimeBR, money, norm } from "../lib/format";
import { parsePlanserv } from "../lib/exporters";
import { loadPlanserv, savePlanserv } from "../lib/datasource";
import { Banner, Empty, Field, PageHead } from "../components/ui";

const { useEffect, useMemo, useRef, useState } = React;

let cache: { id: string; itens: any[] } | null = null;
const keyOf = (m: any) => (m ? `${m.versao}|${m.itens}|${m.importadoEm}` : "");

export function Medicamentos() {
  const { config, can, assets, db, write, log, toast } = useStore();
  const meta = config.planserv;
  const [itens, setItens] = useState(cache && meta && cache.id === keyOf(meta) ? cache.itens : null as any[] | null);
  const [erro, setErro] = useState("");
  const [q, setQ] = useState("");
  const [q2, setQ2] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef(null as any);

  useEffect(() => {
    if (!meta || (cache && cache.id === keyOf(meta))) return;
    let alive = true;
    setItens(null); setErro("");
    loadPlanserv()
      .then((j) => { const its = (j.itens || []).map((x: any[]) => ({ cod: x[0], desc: x[1], fr: x[2], un: x[3], v: x[4], g: x[5], b: norm(x[1]) })); cache = { id: keyOf(meta), itens: its }; if (alive) setItens(its); })
      .catch(() => alive && setErro("Não foi possível carregar a tabela de medicamentos. Recarregue a página."));
    return () => { alive = false; };
  }, [keyOf(meta)]);

  const res = useMemo(() => {
    const t = [norm(q), norm(q2)].filter(Boolean);
    if (!t.length || !itens) return null;
    const hit = itens.filter((x: any) => t.every((s) => x.b.includes(s) || x.cod.includes(s.replace(/\s/g, ""))));
    return { total: hit.length, list: hit.slice(0, 60) };
  }, [q, q2, itens]);

  const importar = async (e: any) => {
    e.preventDefault(); setErro("");
    const f = file.current?.files?.[0]; if (!f) return;
    setBusy(true);
    try {
      const { versao, itens: novos, avisos } = await parsePlanserv(f);
      if (!(await savePlanserv({ versao, itens: novos }))) throw new Error("O navegador não tem espaço para guardar a tabela. Na versão com banco de dados isso não acontece.");
      cache = null;
      const ok = await write(() => db.doc("config/planserv").set({ versao: versao || "", itens: novos.length, arquivo: f.name, importadoEm: new Date().toISOString(), avisos: avisos.slice(0, 50) }),
        `Tabela importada: ${novos.length} itens${versao ? `, versão ${dateBR(versao)}` : ""}.`);
      if (ok) { log("importar tabela PLANSERV", f.name, `${novos.length} itens`); if (file.current) file.current.value = ""; }
    } catch (err: any) { setErro(err?.message || "Não foi possível ler o arquivo."); }
    setBusy(false);
  };

  return (
    <>
      <PageHead title="Medicamentos PLANSERV">
        Consulta de valores de referência. Quando sair uma tabela nova, envie o arquivo .xlsx: ela substitui a atual para todos.
      </PageHead>
      <div className="grid2" style={{ gridTemplateColumns: "minmax(0, 2.3fr) minmax(0, 1fr)", alignItems: "start" }}>
        <div className="stack">
          <div className="card stack">
            <div className="grid2">
              <Field label="Buscar por nome ou código" id="md-q"><input id="md-q" value={q} onChange={(e: any) => setQ(e.target.value)} placeholder="ex.: meropenem" /></Field>
              <Field label="E também (opcional)" id="md-q2"><input id="md-q2" value={q2} onChange={(e: any) => setQ2(e.target.value)} placeholder="ex.: 1 g" /></Field>
            </div>
            {res && <p className="hint">{res.total} resultado(s){res.total > 60 ? ", mostrando os 60 primeiros. Refine a busca." : "."}</p>}
            {!itens && meta && !erro && <p className="hint">Carregando a tabela…</p>}
          </div>
          {erro && <Banner kind="err">{erro}</Banner>}
          {res ? (
            <div className="card flush"><div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Código</th><th>Descrição</th><th className="only-desktop">Unidade</th><th className="num">Valor</th></tr></thead>
              <tbody>
                {res.list.map((i: any) => <tr key={i.cod + i.desc}><td>{i.cod}</td><td className="small">{i.desc}<div className="hint">{[i.fr && `fração ${i.fr}`, i.un, i.g].filter(Boolean).join(" · ")}</div></td><td className="only-desktop">{i.un || "—"}</td><td className="num"><b>{money(i.v)}</b></td></tr>)}
                {res.list.length === 0 && <tr><td colSpan={4}><Empty>Nada encontrado para essa busca.</Empty></td></tr>}
              </tbody></table></div></div>
          ) : <div className="card"><Empty>Digite parte do nome ou do código para buscar.</Empty></div>}
        </div>
        <div className="stack">
          <div className="card stack" style={{ gap: 6 }}>
            <h2>Tabela carregada</h2>
            {meta ? <>
              <p>Versão <b>{dateBR(meta.versao)}</b> · <b>{(meta.itens || 0).toLocaleString("pt-BR")}</b> itens</p>
              <p className="hint">{meta.arquivo} · importada em {dateTimeBR(meta.importadoEm)}</p>
              {meta.avisos?.length > 0 && <details><summary className="small">Avisos da importação ({meta.avisos.length})</summary><ul className="small">{meta.avisos.slice(0, 20).map((a: string, i: number) => <li key={i}>{a}</li>)}</ul></details>}
            </> : <p className="muted">Nenhuma tabela importada ainda.</p>}
          </div>
          {can("admin") ? (
            <form className="card stack" onSubmit={importar}>
              <h2>Atualizar a tabela</h2>
              <p className="hint">Envie a tabela PLANSERV em .xlsx, no mesmo layout (colunas “CÓDIGO DO MEDICAMENTO”, “DESCRIÇÃO DO MEDICAMENTO” e “VALOR (R$)”).</p>
              <input ref={file} id="md-file" type="file" accept=".xlsx,.xls" required aria-label="Arquivo da tabela" />
              <button className="btn" disabled={busy}>{busy ? "Importando…" : "Importar tabela"}</button>
            </form>
          ) : <Banner kind="info">Somente administradores atualizam a tabela.</Banner>}
        </div>
      </div>
    </>
  );
}

const USADO: Record<number, string> = { 6: "Dieta enteral 1000ml", 24: "Módulo de proteína", 30: "Suplemento oral 200ml" };

export function Dietas() {
  const { config, svcList, can, db, write, log } = useStore();
  const di = config.dietas;
  const [ed, setEd] = useState(null as any[] | null);
  const tipo = (d: string) => (/^dieta/i.test(d) ? "Dieta enteral" : /^suplemento/i.test(d) ? "Suplemento" : /^m[óo]dulo/i.test(d) ? "Módulo" : "Outros");
  if (!di) return <><PageHead title="Dietas e suplementos" /><div className="card"><Empty>Tabela ainda não carregada.</Empty></div></>;
  const salvar = async () => {
    const itens = ed!.map((x) => ({ d: x.d, v: Number(String(x.v).replace(",", ".")) }));
    if (itens.some((x) => isNaN(x.v) || x.v < 0)) return;
    if (await write(() => db.doc("config/dietas").update({ itens, atualizadaEm: new Date().toISOString() }), "Tabela de dietas atualizada.")) { log("atualizar tabela de dietas", "Anexo II"); setEd(null); }
  };
  return (
    <>
      <PageHead title="Dietas e suplementos" actions={can("admin") && !ed && <button className="btn sec" onClick={() => setEd(di.itens.map((x: any) => ({ ...x, v: String(x.v).replace(".", ",") })))}>Atualizar valores</button>}>
        Valores de referência do Anexo II ({di.fonte?.replace(" — Anexo II", "") || "Diário Oficial"}). Tabela fixa, revista uma vez por ano.
      </PageHead>
      <div className="card flush">
        <div className="tbl-wrap" style={{ maxHeight: "none" }}><table className="tbl">
          <thead><tr><th>Nº</th><th>Descrição</th><th className="only-desktop">Tipo</th><th className="num">Valor</th><th>Na tabela de serviços</th></tr></thead>
          <tbody>{(ed || di.itens).map((x: any, i: number) => {
            const nome = USADO[i + 1]; const s = nome ? svcList.find((v) => v.nome === nome) : null;
            const v = Number(String(x.v).replace(",", "."));
            return (
              <tr key={i}><td>{i + 1}</td><td className="small">{x.d}</td><td className="only-desktop small">{tipo(x.d)}</td>
                <td className="num">{ed ? <input className="inp" style={{ width: 100, textAlign: "right", minHeight: 32, padding: "4px 8px" }} inputMode="decimal" aria-label={`Valor do item ${i + 1}`} value={x.v} onChange={(e: any) => { const n = [...ed]; n[i] = { ...x, v: e.target.value }; setEd(n); }} /> : <b>{money(x.v)}</b>}</td>
                <td>{s ? (Math.abs(s.valor - v) < 0.005 ? <span className="pill ok">{s.nome} · confere</span> : <span className="pill err">{s.nome} · difere ({money(s.valor)})</span>) : <span className="hint">—</span>}</td></tr>
            );
          })}</tbody>
        </table></div>
      </div>
      {ed && <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={salvar}>Salvar tabela</button><button className="btn sec" onClick={() => setEd(null)}>Cancelar</button></div>}
      <p className="hint" style={{ marginTop: 12 }}>Itens marcados já são faturados como serviço. Para faturar outro item desta tabela, cadastre-o em Serviços e valores.</p>
    </>
  );
}

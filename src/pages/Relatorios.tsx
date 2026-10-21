import { useStore } from "../lib/store";
import { useMatriz } from "../lib/hooks";
import { dateBR, dateTimeBR, mesAno, norm, pct, shortName, todayISO } from "../lib/format";
import { xlsxRelatorios } from "../lib/exporters";
import { arquivos } from "../lib/arquivos";
import { validarPdf, desenharPaginas, fotosParaPdf, montarPasta, zipar, nomeArquivo, MAX_MB, PdfInfo, ItemPasta } from "../lib/pdf";
import { padDoPeriodo } from "../lib/pad";
import { Banner, Empty, Field, Modal, PageHead } from "../components/ui";

const { useEffect, useRef, useState } = React;
const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

type Celula = "entregue" | "semarq" | "pendente" | "na";
function estado(l: any, tid: string): Celula {
  if (!l.req.has(tid)) return l.st[tid] === "entregue" ? (l.arq[tid] ? "entregue" : "semarq") : "na";
  if (l.st[tid] !== "entregue") return "pendente";
  return l.arq[tid] ? "entregue" : "semarq";
}
const ROTULO: Record<Celula, string> = { entregue: "✓ Entregue", semarq: "Entregue sem PDF", pendente: "Pendente", na: "—" };

export function Relatorios() {
  const { comp, tipos, downloads, toast, can } = useStore();
  const m = useMatriz();
  const [busca, setBusca] = useState("");
  const [abre, setAbre] = useState(null as null | { pid: string; tid: string });
  const [pasta, setPasta] = useState(false);
  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const vis = m.linhas.filter((l) => norm(l.p.nome).includes(norm(busca)));
  const cell = (l: any, t: any, mobile = false) => {
    const e = estado(l, t.id);
    if (e === "na") return <span className="cellbtn na" title="Não exigido pelo PAD deste paciente">{mobile ? null : "—"}</span>;
    const cls = e === "entregue" ? "entregue" : "pendente";
    return (
      <button className={`cellbtn ${cls}`} onClick={() => setAbre({ pid: l.p.id, tid: t.id })} aria-label={`${t.nome} de ${l.p.nome}: ${ROTULO[e]}`}>
        {mobile ? `${e === "entregue" ? "✓ " : ""}${t.nome}` : ROTULO[e]}
      </button>
    );
  };
  return (
    <>
      <PageHead title="Relatórios entregues" actions={<>
        {downloads && <button className="btn sec" onClick={() => xlsxRelatorios(comp, m, tipos, downloads, toast)}>Baixar Excel</button>}
        {downloads && <button className="btn" onClick={() => setPasta(true)}>Pasta de cobrança</button>}</>}>
        Toque em um relatório para anexar o PDF. Ele só passa para entregue depois que o arquivo termina de carregar. Os tipos exigidos de cada paciente vêm do PAD; sem PAD, todos são cobrados.
      </PageHead>
      <div className="kpis" style={{ marginBottom: 14 }}>
        <div className="kpi ok"><span>Entregues com PDF</span><b>{m.entregues - m.semArquivo}</b></div>
        <div className="kpi warn"><span>Pendentes</span><b>{m.pendentes}</b></div>
        <div className="kpi"><span>Concluído</span><b>{pct(m.pct)}</b><small>{m.esperados} relatórios exigidos</small></div>
        {m.semArquivo > 0 && <div className="kpi warn"><span>Entregues sem PDF</span><b>{m.semArquivo}</b><small>marcados antes do anexo obrigatório</small></div>}
      </div>
      {tipos.length === 0 && <Banner kind="warn">Nenhum tipo de relatório cadastrado. Cadastre em Competências e ajustes.</Banner>}
      {comp.status === "fechada" && <div style={{ marginBottom: 12 }}><Banner kind="warn">Competência fechada: os relatórios ficam só para consulta.</Banner></div>}
      {!can("operador") && <div style={{ marginBottom: 12 }}><Banner kind="info">Seu acesso é de consulta: você pode abrir e baixar os PDFs.</Banner></div>}
      <div className="card flush">
        <div style={{ padding: 12 }}><input className="inp" placeholder="Buscar paciente" aria-label="Buscar paciente" value={busca} onChange={(e: any) => setBusca(e.target.value)} /></div>
        <div className="tbl-wrap only-desktop" style={{ maxHeight: "68vh" }}>
          <table className="matrix">
            <thead><tr><th>Paciente</th>{tipos.map((t) => <th key={t.id}>{t.nome}</th>)}<th>Entregues</th></tr></thead>
            <tbody>{vis.map((l) => (
              <tr key={l.p.id}><td>{l.p.nome}{l.porPad && <div className="hint">exigidos pelo PAD</div>}</td>{tipos.map((t) => <td key={t.id}>{cell(l, t)}</td>)}<td><b>{l.entregues}/{l.total}</b></td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="only-mobile">
          {vis.map((l) => (
            <div className="rcard" key={l.p.id}>
              <div className="row between"><b className="small">{l.p.nome}</b><span className={`pill ${l.pendentes ? "warn" : "ok"}`}>{l.entregues}/{l.total}</span></div>
              <div className="rchips">{tipos.filter((t) => estado(l, t.id) !== "na").map((t) => <span key={t.id}>{cell(l, t, true)}</span>)}</div>
            </div>
          ))}
        </div>
        {vis.length === 0 && <Empty>Nenhum paciente ativo encontrado.</Empty>}
      </div>
      {abre && <AnexoModal pid={abre.pid} tid={abre.tid} onClose={() => setAbre(null)} />}
      {pasta && <PastaModal onClose={() => setPasta(false)} />}
    </>
  );
}

/* ---------------- prévia de PDF ---------------- */
function Previa({ blob }: { blob: Blob }) {
  const ref = useRef(null as any);
  const [erro, setErro] = useState("");
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let vivo = true;
    const w = Math.min(560, (ref.current?.clientWidth || 520) - 20);
    desenharPaginas(blob, ref.current, w, 3).then((n) => vivo && setTotal(n)).catch(() => vivo && setErro("Não foi possível mostrar a prévia."));
    return () => { vivo = false; };
  }, [blob]);
  return <div className="stack" style={{ gap: 6 }}>
    <div className="prev" ref={ref} aria-label="Prévia do PDF" />
    {erro ? <span className="hint">{erro}</span> : total > 3 ? <span className="hint">Mostrando 3 de {total} páginas.</span> : null}
  </div>;
}

/* ---------------- janela de anexo ---------------- */
function AnexoModal({ pid, tid, onClose }: { pid: string; tid: string; onClose: () => void }) {
  const { comp, pacientes, tipos, rels, db, write, log, can, meId, downloads, toast, names } = useStore();
  const p = pacientes[pid]; const t = tipos.find((x) => x.id === tid)!;
  const docId = `${comp!.id}_${pid}`;
  const doc = rels[docId] || { st: {}, arq: {}, hist: [] };
  const meta = doc.arq?.[tid];
  const entregue = doc.st?.[tid] === "entregue";
  const pode = can("operador") && comp!.status === "aberta";
  const [modo, setModo] = useState(entregue && meta ? "ver" : "anexar" as "ver" | "anexar" | "remover");
  const [info, setInfo] = useState(null as null | PdfInfo);
  const [lendo, setLendo] = useState(false);
  const [over, setOver] = useState(false);
  const [envio, setEnvio] = useState("" as "" | "enviando" | "falhou");
  const [entrega, setEntrega] = useState(todayISO());
  const [prof, setProf] = useState("");
  const [obs, setObs] = useState("");
  const [motivo, setMotivo] = useState("");
  const [atual, setAtual] = useState(null as null | Blob | "ausente");
  const pdfIn = useRef(null as any), fotoIn = useRef(null as any);
  const hist = (doc.hist || []).filter((h: any) => h.tid === tid).slice().reverse();
  const nm = names([meta?.por, ...hist.map((h: any) => h.por)].filter(Boolean));

  useEffect(() => {
    if (modo !== "ver" || !meta) return;
    let vivo = true; setAtual(null);
    arquivos.get(meta.id).then((b) => vivo && setAtual(b || "ausente")).catch(() => vivo && setAtual("ausente"));
    return () => { vivo = false; };
  }, [modo, meta?.id]);

  const receber = async (files: File[]) => {
    if (!files.length) return;
    setLendo(true); setInfo(null); setEnvio("");
    try {
      const fotos = files.filter((f) => f.type.startsWith("image/"));
      if (fotos.length && fotos.length === files.length) {
        const b = await fotosParaPdf(fotos);
        setInfo(await validarPdf(b, `${nomeArquivo(t.nome)}-${nomeArquivo(shortName(p.nome))}.pdf`));
      } else if (files.length > 1) setInfo({ ok: false, erro: "Envie um PDF por vez (ou várias fotos do mesmo documento)." });
      else setInfo(await validarPdf(files[0], files[0].name));
    } catch { setInfo({ ok: false, erro: "Não foi possível ler o arquivo." }); }
    setLendo(false);
  };

  const confirmar = async () => {
    if (!info?.ok || !info.blob) return;
    setEnvio("enviando");
    let id = "";
    try { id = await arquivos.put(info.blob, { nome: info.nome || "relatorio.pdf", tipo: "application/pdf", tamanho: info.blob.size }); }
    catch { setEnvio("falhou"); return; }
    const agora = new Date().toISOString();
    const novo = { id, nome: info.nome, tamanho: info.blob.size, paginas: info.paginas, em: agora, por: meId || "", entrega, profissional: prof.trim(), obs: obs.trim() };
    const h = [...(doc.hist || [])];
    if (meta) h.push({ tid, acao: "substituído", arq: meta, em: agora, por: meId || "" });
    const corpo = { comp: comp!.id, pac: pid, st: { ...(doc.st || {}), [tid]: "entregue" }, arq: { ...(doc.arq || {}), [tid]: novo }, hist: h };
    const ok = await write(() => db.doc(`relatorios/${docId}`).set(corpo), meta ? "PDF substituído." : `${t.nome} de ${shortName(p.nome)} entregue.`);
    if (!ok) { arquivos.remove(id).catch(() => undefined); setEnvio("falhou"); return; }
    log(meta ? "relatório substituído" : "relatório entregue", p.nome, `${t.nome} · ${info.nome} (${info.paginas} pág.)`);
    onClose();
  };

  const remover = async () => {
    const agora = new Date().toISOString();
    const st = { ...(doc.st || {}) }; delete st[tid];
    const arq = { ...(doc.arq || {}) }; delete arq[tid];
    const h = [...(doc.hist || []), { tid, acao: "removido", motivo: motivo.trim(), arq: meta || null, em: agora, por: meId || "" }];
    if (await write(() => db.doc(`relatorios/${docId}`).set({ comp: comp!.id, pac: pid, st, arq, hist: h }), "Relatório voltou para pendente.")) {
      log("relatório removido", p.nome, `${t.nome} · ${motivo.trim()}`); onClose();
    }
  };
  const baixar = async (m: any) => {
    const b = await arquivos.get(m.id).catch(() => null);
    if (!b) { toast("err", "O arquivo não está disponível neste aparelho."); return; }
    try { await downloads.save({ filename: m.nome || "relatorio.pdf", data: b }); } catch { /* cancelado */ }
  };

  return (
    <Modal title={`${t.nome} · ${shortName(p.nome)}`} onClose={onClose} wide>
      <p className="hint" style={{ marginTop: -6 }}>{p.nome} · competência de {mesAno(comp!.id)}</p>

      {modo === "ver" && meta && (
        <>
          <div className="filemeta"><span className="ic">PDF</span>
            <div className="grow"><b>{meta.nome}</b><div className="hint">{meta.paginas} página(s) · {kb(meta.tamanho)} · anexado em {dateTimeBR(meta.em)}{meta.por ? ` por ${nm[meta.por] || "…"}` : ""}</div></div>
            <span className="pill ok">Entregue</span></div>
          <div className="grid3 small">
            <div><span className="eyebrow">Data de entrega</span><div>{dateBR(meta.entrega)}</div></div>
            <div><span className="eyebrow">Profissional</span><div>{meta.profissional || "—"}</div></div>
            <div><span className="eyebrow">Observação</span><div>{meta.obs || "—"}</div></div>
          </div>
          {atual === null && <p className="hint">Carregando o arquivo…</p>}
          {atual === "ausente" && <Banner kind="warn">O arquivo não está disponível neste aparelho. Na demonstração, os PDFs ficam guardados só no navegador onde foram anexados.</Banner>}
          {atual && atual !== "ausente" && <Previa blob={atual} />}
          <div className="row">
            <button className="btn" onClick={() => baixar(meta)}>Baixar PDF</button>
            {pode && <button className="btn sec" onClick={() => { setModo("anexar"); setInfo(null); }}>Substituir arquivo</button>}
            {pode && can("admin") && <button className="btn danger" onClick={() => setModo("remover")}>Remover</button>}
          </div>
        </>
      )}

      {modo === "remover" && (
        <>
          <Banner kind="warn">O relatório volta para <b>pendente</b>. O arquivo atual fica guardado no histórico.</Banner>
          <Field label="Motivo da remoção" id="ax-mot"><input id="ax-mot" value={motivo} onChange={(e: any) => setMotivo(e.target.value)} placeholder="ex.: relatório do paciente errado" /></Field>
          <div className="row"><button className="btn danger" disabled={!motivo.trim()} onClick={remover}>Remover e voltar para pendente</button><button className="btn sec" onClick={() => setModo("ver")}>Cancelar</button></div>
        </>
      )}

      {modo === "anexar" && (
        !pode ? <Banner kind="info">{comp!.status === "fechada" ? "Competência fechada: não é possível anexar." : "Seu acesso não permite anexar relatórios."}</Banner> : (
        <>
          {entregue && !meta && <Banner kind="warn">Este relatório foi marcado como entregue antes do anexo obrigatório. Anexe o PDF para regularizar.</Banner>}
          {meta && <Banner kind="info">Você está substituindo <b>{meta.nome}</b>. A versão atual fica no histórico.</Banner>}
          {!info?.ok && (
            <div className={`drop ${over ? "over" : ""}`}
              onDragOver={(e: any) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e: any) => { e.preventDefault(); setOver(false); receber([...e.dataTransfer.files]); }}>
              <b>Arraste o PDF do relatório aqui</b>
              <span className="hint">ou</span>
              <div className="row">
                <button className="btn" type="button" onClick={() => pdfIn.current?.click()}>Escolher PDF</button>
                <button className="btn sec" type="button" onClick={() => fotoIn.current?.click()}>Fotografar documento</button>
              </div>
              <span className="hint">Somente PDF, até {MAX_MB} MB. Fotos viram PDF automaticamente (uma por página).</span>
              <input ref={pdfIn} type="file" accept="application/pdf,.pdf" hidden onChange={(e: any) => { receber([...e.target.files]); e.target.value = ""; }} aria-label="Arquivo PDF" />
              <input ref={fotoIn} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e: any) => { receber([...e.target.files]); e.target.value = ""; }} aria-label="Fotos do documento" />
            </div>
          )}
          {lendo && <p className="hint">Conferindo o arquivo…</p>}
          {info && !info.ok && <Banner kind="err">{info.erro}</Banner>}
          {info?.ok && info.blob && (
            <>
              <div className="filemeta"><span className="ic">PDF</span>
                <div className="grow"><b>{info.nome}</b><div className="hint">{info.paginas} página(s) · {kb(info.blob.size)} · arquivo conferido</div></div>
                <button className="btn sm sec" onClick={() => setInfo(null)}>Trocar arquivo</button></div>
              <Previa blob={info.blob} />
              <div className="grid3">
                <Field label="Data de entrega" id="ax-ent"><input id="ax-ent" type="date" value={entrega} onChange={(e: any) => setEntrega(e.target.value)} /></Field>
                <Field label="Profissional (opcional)" id="ax-prof"><input id="ax-prof" value={prof} onChange={(e: any) => setProf(e.target.value)} /></Field>
                <Field label="Observação (opcional)" id="ax-obs"><input id="ax-obs" value={obs} onChange={(e: any) => setObs(e.target.value)} /></Field>
              </div>
            </>
          )}
          {envio === "falhou" && <Banner kind="err">O envio do arquivo falhou. O relatório continua <b>pendente</b>. Tente de novo.</Banner>}
          <div className="row">
            <button className="btn green" disabled={!info?.ok || envio === "enviando"} onClick={confirmar}>{envio === "enviando" ? "Enviando o arquivo…" : "Confirmar entrega"}</button>
            <button className="btn sec" onClick={() => (meta ? setModo("ver") : onClose())}>Cancelar</button>
            {!info?.ok && <span className="hint">O relatório só fica como entregue depois que o PDF for carregado.</span>}
          </div>
        </>)
      )}

      {hist.length > 0 && modo !== "anexar" && (
        <div className="stack" style={{ gap: 6 }}>
          <h3>Histórico</h3>
          <div className="histo">{hist.map((h: any, i: number) => (
            <div key={i}><b>{h.acao === "removido" ? "Removido" : "Substituído"}</b> em {dateTimeBR(h.em)}{h.por ? ` por ${nm[h.por] || "…"}` : ""}{h.motivo ? ` · motivo: ${h.motivo}` : ""}
              {h.arq && <> · <button className="btn ghost sm" style={{ padding: 0, minHeight: 0 }} onClick={() => baixar(h.arq)}>{h.arq.nome}</button></>}</div>
          ))}</div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- pasta de cobrança ---------------- */
function PastaModal({ onClose }: { onClose: () => void }) {
  const { comp, tipos, pads, downloads, toast, log } = useStore();
  const m = useMatriz();
  const com = m.linhas.filter((l) => tipos.some((t) => l.arq[t.id]));
  const [pid, setPid] = useState(com[0]?.p.id || "__todos");
  const [prog, setProg] = useState("");
  const [falhas, setFalhas] = useState([] as string[]);
  const montar = async (l: any) => {
    const pad = padDoPeriodo(pads, l.p.id, comp!.ini, comp!.fim);
    const itens: ItemPasta[] = [];
    for (const t of tipos) {
      if (!l.req.has(t.id) && !l.arq[t.id]) continue;
      const a = l.arq[t.id];
      itens.push({ titulo: t.nome, blob: a ? await arquivos.get(a.id).catch(() => null) : null, detalhe: a ? `entregue em ${dateBR(a.entrega)}` : undefined });
    }
    const capa = { titulo: l.p.nome, linhas: [
      `Competência: ${mesAno(comp!.id)} (${dateBR(comp!.ini)} a ${dateBR(comp!.fim)})`,
      l.p.cns ? `CNS: ${l.p.cns}` : "", pad ? `PAD versão ${pad.versao}${pad.autorizacao ? ` · autorização ${pad.autorizacao}` : ""} · ${pad.operadora}` : "Sem PAD no período",
      `Relatórios exigidos: ${l.entregues} de ${l.total} entregues`, `Gerado em ${dateTimeBR(new Date().toISOString())}`,
    ].filter(Boolean) };
    return montarPasta(capa, itens);
  };
  const gerar = async () => {
    setFalhas([]);
    try {
      if (pid !== "__todos") {
        const l = com.find((x) => x.p.id === pid)!; setProg("Montando a pasta…");
        const r = await montar(l); setFalhas(r.falhas);
        await downloads.save({ filename: `pasta-${nomeArquivo(l.p.nome)}-${comp!.id}.pdf`, data: r.blob });
        log("pasta de cobrança", l.p.nome, mesAno(comp!.id));
      } else {
        const arqs: { nome: string; blob: Blob }[] = []; const fs: string[] = [];
        for (let i = 0; i < com.length; i++) {
          setProg(`Montando ${i + 1} de ${com.length}…`);
          const r = await montar(com[i]); arqs.push({ nome: `pasta-${nomeArquivo(com[i].p.nome)}-${comp!.id}.pdf`, blob: r.blob });
          fs.push(...r.falhas.map((x) => `${shortName(com[i].p.nome)}: ${x}`));
        }
        setProg("Compactando…");
        const z = await zipar(arqs); setFalhas(fs);
        await downloads.save({ filename: `pastas-de-cobranca-${comp!.id}.zip`, data: z });
        log("pastas de cobrança", `${arqs.length} pacientes`, mesAno(comp!.id));
      }
      setProg("");
    } catch (e: any) { setProg(""); if (e?.code !== "cancelled" && e?.code !== "declined") toast("err", "Não foi possível montar a pasta. Tente de novo."); }
  };
  return (
    <Modal title="Pasta de cobrança" onClose={onClose}>
      <p className="hint">Junta num PDF só, por paciente, todos os relatórios anexados em {mesAno(comp!.id)}, na ordem dos tipos, com uma capa que lista o que entrou e o que está pendente.</p>
      {com.length === 0 ? <Banner kind="warn">Nenhum relatório com PDF anexado nesta competência.</Banner> : (
        <>
          <Field label="Paciente" id="pc-pac"><select id="pc-pac" value={pid} onChange={(e: any) => setPid(e.target.value)}>
            {com.map((l) => <option key={l.p.id} value={l.p.id}>{l.p.nome} ({tipos.filter((t) => l.arq[t.id]).length} PDF)</option>)}
            <option value="__todos">Todos os pacientes ({com.length}) · arquivo .zip</option></select></Field>
          {falhas.length > 0 && <Banner kind="warn">Não entraram na pasta (arquivo protegido ou danificado): {falhas.join(", ")}.</Banner>}
          <div className="row"><button className="btn" disabled={!!prog} onClick={gerar}>{prog || (pid === "__todos" ? "Gerar .zip" : "Gerar PDF")}</button><button className="btn sec" onClick={onClose}>Fechar</button></div>
        </>
      )}
    </Modal>
  );
}

export function Painel() {
  const { comp, tipos } = useStore();
  const m = useMatriz();
  if (!comp) return <Empty>Crie uma competência para começar.</Empty>;
  const piores = [...m.linhas].sort((a, b) => a.pct - b.pct || a.p.nome.localeCompare(b.p.nome, "pt-BR"));
  return (
    <>
      <PageHead title="Painel de relatórios">Quanto já foi entregue em {mesAno(comp.id)} e onde estão as pendências. Conta só os relatórios exigidos pelo PAD de cada paciente.</PageHead>
      <div className="stack">
        <div className="kpis">
          <div className="kpi"><span>Relatórios exigidos</span><b>{m.esperados}</b></div>
          <div className="kpi ok"><span>Entregues</span><b>{m.entregues}</b></div>
          <div className="kpi warn"><span>Pendentes</span><b>{m.pendentes}</b></div>
          <div className="kpi money"><span>Concluído</span><b>{pct(m.pct)}</b></div>
        </div>
        <div className="grid2" style={{ alignItems: "start" }}>
          <div className="card"><h2>Por tipo de relatório</h2>
            {m.porTipo.filter((t) => t.entregues + t.pendentes > 0).map((t) => { const tot = t.entregues + t.pendentes || 1; return (
              <div className="bar" key={t.t.id}><span className="name">{t.t.nome}</span>
                <div className="track" role="img" aria-label={`${t.entregues} entregues e ${t.pendentes} pendentes`}><i className="e" style={{ width: `${(t.entregues / tot) * 100}%` }} /><i className="p" style={{ width: `${(t.pendentes / tot) * 100}%` }} /></div>
                <span className="num small">{t.entregues}/{tot}</span></div>); })}
            <div className="legend"><span><i style={{ background: "var(--green-strong)" }} />Entregue</span><span><i style={{ background: "#f2b24a" }} />Pendente</span></div>
            {tipos.length === 0 && <Empty>Nenhum tipo cadastrado.</Empty>}
          </div>
          <div className="card"><h2>Por paciente</h2><p className="hint">Quem tem mais pendências aparece primeiro.</p>
            {piores.map((l) => (
              <div className="bar" key={l.p.id}><span className="name" title={l.p.nome}>{shortName(l.p.nome)}</span>
                <div className="track"><i className="e" style={{ width: `${l.pct * 100}%` }} /><i className="p" style={{ width: `${(1 - l.pct) * 100}%` }} /></div>
                <span className="num small">{l.entregues}/{l.total}</span></div>
            ))}
            {piores.length === 0 && <Empty>Nenhum paciente ativo.</Empty>}
          </div>
        </div>
      </div>
    </>
  );
}

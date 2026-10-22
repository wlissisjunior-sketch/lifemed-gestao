import { dateBR, mesAno, horasBR, isHora } from "./format";
import { LOGO } from "../assets";

declare let XLSX: any;
const CDN = "https://cdnjs.cloudflare.com/ajax/libs/";
const loaded: Record<string, Promise<void>> = {};
function script(url: string) {
  return (loaded[url] ||= new Promise<void>((ok, fail) => {
    const s = document.createElement("script"); s.src = url; s.async = true;
    s.onload = () => ok(); s.onerror = () => { delete loaded[url]; fail(new Error("load")); };
    document.head.appendChild(s);
  }));
}
export async function needXlsx() { if (!(window as any).XLSX) await script(CDN + "xlsx/0.18.5/xlsx.full.min.js"); XLSX = (window as any).XLSX; }
async function needPdf() {
  if (!(window as any).jspdf) await script(CDN + "jspdf/2.5.1/jspdf.umd.min.js");
  if (!(window as any).jspdf?.jsPDF?.API?.autoTable) await script(CDN + "jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
}
const MOEDA = '"R$" #,##0.00';
const EMPRESA = "LIFE MED MEDICINA ESPECIALIZADA · CNPJ 56.378.234/0001-21 · Rua Intendente Abdon, 153 A, Queimadinha, Feira de Santana – BA";

async function save(downloads: any, filename: string, data: ArrayBuffer | Blob, toast: (k: any, t: string) => void) {
  if (!downloads) { toast("err", "O download de arquivos não está disponível nesta visualização."); return; }
  try {
    const r = await downloads.save({ filename, data });
    toast("ok", r?.status === "delivered" ? "Arquivo enviado." : "Arquivo salvo.");
  } catch (e: any) {
    if (e?.code === "cancelled" || e?.code === "declined") return;
    toast("err", "Não foi possível gerar o arquivo. Tente de novo.");
  }
}

function sheet(rows: any[][], widths: number[], moneyCols: number[], dateCols: number[] = [], startRow = 1) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = startRow; R <= range.e.r; R++) {
    for (const C of moneyCols) { const c = ws[XLSX.utils.encode_cell({ r: R, c: C })]; if (c && typeof c.v === "number") c.z = MOEDA; }
    for (const C of dateCols) { const c = ws[XLSX.utils.encode_cell({ r: R, c: C })]; if (c && c.v instanceof Date) c.z = "dd/mm/yyyy"; }
  }
  ws["!cols"] = widths.map((w) => ({ wch: w }));
  return ws;
}
const d = (iso?: string) => (iso ? new Date(iso + "T12:00:00") : "");
const xbuf = (wb: any) => XLSX.write(wb, { type: "array", bookType: "xlsx", cellDates: true });

export async function xlsxFisicoFinanceiro(comp: any, ff: any, downloads: any, toast: any) {
  try { await needXlsx(); } catch { toast("err", "Não foi possível carregar o gerador de Excel. Verifique a conexão."); return; }
  const rows: any[][] = [[`PLANILHA TOTAL COMPETÊNCIA ${dateBR(comp.ini)} a ${dateBR(comp.fim)}`], [],
    ["CATEGORIA", "PROCEDIMENTOS", "VALOR UNITÁRIO", "FÍSICO", "FINANCEIRO"]];
  let last = "";
  for (const r of ff.rows) { rows.push([r.svc.categoria !== last ? r.svc.categoria : "", r.svc.descricao || r.svc.nome, r.svc.valor, r.fisico, r.financeiro]); last = r.svc.categoria; }
  rows.push(["", "TOTAL GERAL", "", "", ff.total]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows, [30, 78, 16, 10, 18], [2, 4], [], 3), "Planilha Total Competência");
  await save(downloads, `fisico-financeiro-${comp.id}.xlsx`, xbuf(wb), toast);
}

export async function xlsxFaturamento(comp: any, fat: any, downloads: any, toast: any) {
  try { await needXlsx(); } catch { toast("err", "Não foi possível carregar o gerador de Excel. Verifique a conexão."); return; }
  const rows: any[][] = [["NOME COMPLETO DO PACIENTE", "MUNICÍPIO", "DATA DA ADMISSÃO", "DATA DO INÍCIO", "DATA FINAL", "PROGRAMA DE ASSISTÊNCIA", "Nº DE DIÁRIAS", "VALOR UNITÁRIO", "VALOR TOTAL"]];
  for (const b of fat.blocos) {
    for (const l of b.linhas) rows.push([b.p.nome, b.p.municipio, d(b.p.admissao), d(l.ini), d(l.fim), l.programa, l.qtd, l.vu, l.total]);
    rows.push(["", "", "", "", "", "TOTAL INDIVIDUAL", "", "", b.total]);
  }
  rows.push(["", "", "", "", "", "TOTAL FATURAMENTO", "", "", fat.total]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows, [42, 18, 14, 14, 12, 66, 12, 14, 16], [7, 8], [2, 3, 4]), "Faturamento");
  await save(downloads, `faturamento-pacientes-${comp.id}.xlsx`, xbuf(wb), toast);
}

export async function xlsxFechamento(comp: any, p: any, fe: any, downloads: any, toast: any) {
  try { await needXlsx(); } catch { toast("err", "Não foi possível carregar o gerador de Excel. Verifique a conexão."); return; }
  const rows: any[][] = [[`DATA: ${dateBR(comp.ini)} A ${dateBR(comp.fim)}`], [`PACIENTE: ${p.nome}`], [`CNS ${p.cns || ""}`], [],
    ["QUANTIDADE", "DESCRIÇÃO", "VALOR UNITÁRIO", "VALOR TOTAL"]];
  for (const l of fe.linhas) rows.push([l.qtd, l.svc.descricao || l.svc.nome, l.vu, l.total]);
  rows.push(["", "", "TOTAL", fe.total]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows, [12, 70, 16, 16], [2, 3], [], 5), "Fechamento");
  await save(downloads, `fechamento-${p.nome.split(" ").slice(0, 2).join("-").toLowerCase()}-${comp.id}.xlsx`, xbuf(wb), toast);
}

export async function xlsxRelatorios(comp: any, m: any, tipos: any[], downloads: any, toast: any) {
  try { await needXlsx(); } catch { toast("err", "Não foi possível carregar o gerador de Excel. Verifique a conexão."); return; }
  const rows: any[][] = [["Paciente", ...tipos.map((t) => t.nome), "Entregues", "Pendentes"]];
  for (const l of m.linhas) rows.push([l.p.nome, ...tipos.map((t) => (l.req && !l.req.has(t.id) ? "Não exigido" : l.st[t.id] === "entregue" ? (l.arq?.[t.id] ? "Entregue (PDF)" : "Entregue sem PDF") : "Pendente")), l.entregues, l.pendentes]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(rows, [42, ...tipos.map(() => 13), 10, 10], []), "Relatórios");
  await save(downloads, `relatorios-${comp.id}.xlsx`, xbuf(wb), toast);
}

export async function pdfFechamento(comp: any, p: any, fe: any, downloads: any, toast: any) {
  try { await needPdf(); } catch { toast("err", "Não foi possível carregar o gerador de PDF. Verifique a conexão."); return; }
  const J = (window as any).jspdf;
  if (!J?.jsPDF) { toast("err", "O gerador de PDF não carregou. Verifique a conexão e recarregue."); return; }
  const doc = new J.jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  doc.addImage(LOGO, "PNG", 14, 10, 30, 29.5);
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(6, 90, 140);
  doc.text("Relatório de fechamento", 50, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80, 96, 110);
  doc.text(`Competência: ${mesAno(comp.id)}`, 50, 27);
  doc.setDrawColor(147, 192, 31); doc.setLineWidth(1.2); doc.line(14, 43, W - 14, 43);
  doc.setTextColor(20, 41, 58); doc.setFontSize(10.5);
  const info: [string, string][] = [["DATA", `${dateBR(comp.ini)} A ${dateBR(comp.fim)}`], ["PACIENTE", p.nome], ["CNS", p.cns || "—"]];
  info.forEach(([k, v], i) => { doc.setFont("helvetica", "bold"); doc.text(k + ":", 14, 51 + i * 6.5); doc.setFont("helvetica", "normal"); doc.text(v, 38, 51 + i * 6.5); });
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const q = (l: any) => (isHora(l.svc.nome) ? `${l.qtd.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} (${horasBR(l.qtd)})` : l.qtd.toLocaleString("pt-BR", { maximumFractionDigits: 4 }));
  (doc as any).autoTable({
    startY: 72, head: [["QTD", "DESCRIÇÃO", "VALOR UNITÁRIO", "VALOR TOTAL"]],
    body: fe.linhas.map((l: any) => [q(l), l.svc.descricao || l.svc.nome, brl(l.vu), brl(l.total)]),
    foot: [["", "", "TOTAL", brl(fe.total)]],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.2, textColor: [20, 41, 58], lineColor: [200, 214, 224], lineWidth: 0.2 },
    headStyles: { fillColor: [6, 90, 140], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [227, 243, 251], textColor: [6, 90, 140], fontStyle: "bold" },
    columnStyles: { 0: { halign: "center", cellWidth: 24 }, 2: { halign: "right", cellWidth: 32 }, 3: { halign: "right", cellWidth: 34 } },
    margin: { left: 14, right: 14 },
  });
  doc.setFontSize(7.5); doc.setTextColor(110, 125, 138);
  doc.text(EMPRESA, W / 2, 288, { align: "center" });
  const blob: Blob = doc.output("blob");
  await save(downloads, `fechamento-${p.nome.split(" ").slice(0, 2).join("-").toLowerCase()}-${comp.id}.pdf`, blob, toast);
}

/** Lê a tabela PLANSERV (.xlsx) no navegador. */
export async function parsePlanserv(file: File) {
  try { await needXlsx(); } catch { throw new Error("Não foi possível carregar o leitor de Excel. Verifique a conexão."); }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const n = (s: any) => String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const h = rows.slice(0, 20).findIndex((r) => r.some((c) => n(c) === "codigo do medicamento"));
  if (h < 0) throw new Error("Não encontrei a coluna “CÓDIGO DO MEDICAMENTO”. Confira se é a tabela PLANSERV.");
  const col: Record<string, number> = {}; rows[h].forEach((c, i) => { if (c != null) col[n(c)] = i; });
  for (const k of ["codigo do medicamento", "descricao do medicamento", "valor (r$)"]) if (!(k in col)) throw new Error(`Falta a coluna “${k.toUpperCase()}”.`);
  let versao: string | null = null;
  for (const r of rows.slice(0, h)) r.forEach((c, j) => { if (n(c) === "versao" && r[j + 1] instanceof Date) versao = (r[j + 1] as Date).toISOString().slice(0, 10); });
  const clean = (s: any) => String(s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  const itens: any[] = []; const avisos: string[] = [];
  rows.slice(h + 1).forEach((r, i) => {
    if (!r.some((c) => c != null && c !== "")) return;
    const cod = clean(r[col["codigo do medicamento"]]).replace(/\s/g, ""), desc = clean(r[col["descricao do medicamento"]]);
    if (!cod || !desc) { avisos.push(`linha ${h + i + 2}: sem código ou descrição`); return; }
    let v: any = r[col["valor (r$)"]];
    if (typeof v !== "number") { const x = Number(String(v ?? "").replace(/\./g, "").replace(",", ".")); if (isNaN(x)) { if (v != null && v !== "") avisos.push(`linha ${h + i + 2}: valor não numérico (“${v}”)`); v = null; } else v = x; }
    const g = (k: string) => (k in col ? clean(r[col[k]]) : "");
    itens.push([cod, desc, g("fracao"), g("unidade"), v, g("grupo de classificacao")]);
  });
  if (!itens.length) throw new Error("Nenhum medicamento encontrado no arquivo.");
  return { versao, itens, avisos };
}

/** PDF do PAD: identificação, complexidade, itens com previsão e valores, relatórios, objetivos e assinaturas. */
export async function pdfPad(pad: any, ctx: { paciente: any; servicos: any; tipos: any[]; escala: any; orc: any }, downloads: any, toast: any) {
  try { await needPdf(); } catch { toast("err", "Não foi possível carregar o gerador de PDF. Verifique a conexão."); return; }
  const J = (window as any).jspdf;
  if (!J?.jsPDF) { toast("err", "O gerador de PDF não carregou. Verifique a conexão e recarregue."); return; }
  const { paciente: p, servicos, tipos, escala, orc } = ctx;
  const doc = new J.jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 14;
  const brl = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const nq = (v: number) => (v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const FREQ: any = { dia: "por dia", alternados: "dias alternados", "48h": "a cada 48 h", semana: "por semana", mes: "por mês", periodo: "no período" };
  const usaEsc = pad.usarEscala ?? Object.keys(pad.escala || {}).length > 0;
  const curta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const STATUS: any = { rascunho: "RASCUNHO", enviado: "ENVIADO PARA AUTORIZAÇÃO", autorizado: "AUTORIZADO", encerrado: "ENCERRADO" };
  doc.addImage(LOGO, "PNG", M, 10, 26, 25.6);
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(6, 90, 140);
  doc.text("Plano de Atenção Domiciliar (PAD)", 46, 19);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80, 96, 110);
  doc.text(`Versão ${pad.versao} · ${STATUS[pad.status] || ""}`, 46, 26);
  doc.setDrawColor(147, 192, 31); doc.setLineWidth(1.2); doc.line(M, 39, W - M, 39);
  const head = { fillColor: [6, 90, 140], textColor: 255, fontStyle: "bold" };
  const sty = { font: "helvetica", fontSize: 9, cellPadding: 1.5, textColor: [20, 41, 58], lineColor: [200, 214, 224], lineWidth: 0.2 };
  const at = (o: any) => (doc as any).autoTable({ styles: sty, headStyles: head, margin: { left: M, right: M }, ...o });
  const last = () => (doc as any).lastAutoTable.finalY;
  at({ startY: 43, theme: "plain", styles: { ...sty, lineWidth: 0 }, columnStyles: { 0: { fontStyle: "bold", cellWidth: 34 }, 2: { fontStyle: "bold", cellWidth: 30 } },
    body: [
      ["Paciente", p?.nome || "", "CNS", p?.cns || "—"],
      ["PAD SESAB", pad.codSesab || "—", "Versão", String(pad.versao)],
      ["Operadora", pad.operadora || "—", "Autorização", pad.autorizacao || "—"],
      ["Período", `${dateBR(pad.ini)} a ${dateBR(pad.fim)}`, "Reavaliação", pad.reavaliacao ? dateBR(pad.reavaliacao) : "—"],
      ["Médico", pad.medico || "—", "CRM", pad.crm || "—"],
    ] });
  const programa = `Programa: ${servicos[pad.pacote]?.nome || "—"} · visitas ${pad.pacoteFreq === "alternados" ? "em dias alternados" : "todos os dias"} · ${orc.diarias ?? ""} diária(s)`;
  if (usaEsc) {
    const crit = (escala?.criterios || []).map((c: any) => { const o = c.opcoes[pad.escala?.[c.id]]; return [c.nome, o ? o.t : "—", o ? String(o.p) : "—"]; });
    at({ startY: last() + 4, head: [["AVALIAÇÃO DE COMPLEXIDADE", "RESPOSTA", "PONTOS"]], body: crit,
      foot: [[programa + (pad.sugerida && pad.sugerida !== pad.pacote ? ` (escala sugeria ${servicos[pad.sugerida]?.nome || ""})` : ""), "TOTAL", String(pad.pontos ?? "")]],
      footStyles: { fillColor: [227, 243, 251], textColor: [6, 90, 140], fontStyle: "bold" }, columnStyles: { 2: { halign: "center", cellWidth: 18 } } });
  } else {
    at({ startY: last() + 4, theme: "plain", styles: { ...sty, lineWidth: 0, fontStyle: "bold", textColor: [6, 90, 140] }, body: [[programa]] });
  }
  if (usaEsc && pad.motivo) { doc.setFontSize(8.5); doc.setTextColor(80, 96, 110); doc.text(doc.splitTextToSize("Justificativa da modalidade: " + pad.motivo, W - 2 * M), M, last() + 5); }
  const rows: any[] = [];
  const pk = orc.porItem?.pkg;
  if (pk) rows.push([servicos[pad.pacote]?.descricao || servicos[pad.pacote]?.nome, "1", pad.pacoteFreq === "alternados" ? "dias alternados" : "por dia", nq(pk.line.qtd), "Pacote", brl(pk.total)]);
  pad.itens.forEach((it: any, i: number) => {
    const s = servicos[it.sid]; const r = orc.porItem?.["i" + i];
    const cob = !r ? "" : r.cobrada === 0 ? "Incluso" : r.inclusa === 0 ? "Cobrado" : "Parte incluso";
    const per = it.ini || it.fim ? `\nde ${curta(it.ini || pad.ini)} a ${curta(it.fim || pad.fim)}` : "";
    rows.push([(s?.nome || it.sid) + per + (it.obs ? `\n${it.obs}` : ""), nq(it.qtd), FREQ[it.freq], r ? nq(r.line.qtd) : "0", cob, brl(r?.total || 0)]);
  });
  (pad.aditivos || []).filter((a: any) => a.status === "aprovado").forEach((ad: any, k: number) => {
    ad.itens.forEach((it: any, i: number) => {
      const s = servicos[it.sid]; const r = orc.porItem?.[`a${k}-${i}`];
      const cob = !r ? "" : r.cobrada === 0 ? "Incluso" : r.inclusa === 0 ? "Cobrado" : "Parte incluso";
      rows.push([`${s?.nome || it.sid}\nAditivo ${ad.codigo || ""} · ${curta(it.ini || ad.ini)} a ${curta(it.fim || ad.fim)}`, nq(it.qtd), FREQ[it.freq], r ? nq(r.line.qtd) : "0", cob, brl(r?.total || 0)]);
    });
  });
  at({ startY: last() + (usaEsc && pad.motivo ? 10 : 4), head: [["ITEM", "QTD", "FREQUÊNCIA", "PREVISTO", "COBERTURA", "VALOR"]], body: rows,
    foot: [["", "", "", "", "TOTAL PREVISTO", brl(orc.cobrado)], ["", "", "", "", "INCLUSO NO PACOTE", brl(orc.incluso)]],
    footStyles: { fillColor: [227, 243, 251], textColor: [6, 90, 140], fontStyle: "bold" },
    columnStyles: { 1: { halign: "center", cellWidth: 12 }, 2: { cellWidth: 28 }, 3: { halign: "center", cellWidth: 21 }, 4: { cellWidth: 26 }, 5: { halign: "right", cellWidth: 28 } } });
  const rel = (pad.relatorios || []).map((id: string) => tipos.find((t: any) => t.id === id)?.nome).filter(Boolean).join(", ");
  at({ startY: last() + 4, theme: "plain", styles: { ...sty, lineWidth: 0 }, columnStyles: { 0: { fontStyle: "bold", cellWidth: 42 } },
    body: [["Relatórios exigidos", rel || "—"], ["Objetivos terapêuticos", pad.objetivos || "—"], ["Critérios de alta", pad.alta || "—"]] });
  let y = last() + 16;
  if (y > 279) { doc.addPage(); y = 40; }
  doc.setDrawColor(120, 135, 148); doc.setLineWidth(0.3);
  doc.line(M, y, M + 80, y); doc.line(W - M - 80, y, W - M, y);
  doc.setFontSize(8.5); doc.setTextColor(60, 75, 88);
  doc.text(`Médico responsável${pad.crm ? " · " + pad.crm : ""}`, M, y + 4.5); doc.text("Paciente ou responsável", W - M - 80, y + 4.5);
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(110, 125, 138); doc.text(EMPRESA, W / 2, 288, { align: "center" }); doc.text(`${i}/${n}`, W - M, 288, { align: "right" }); }
  await save(downloads, `pad-v${pad.versao}-${(p?.nome || "paciente").split(" ").slice(0, 2).join("-").toLowerCase()}.pdf`, doc.output("blob"), toast);
}

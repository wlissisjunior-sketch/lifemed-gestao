// PAD — Plano de Atenção Domiciliar. Funções puras (sem banco), testadas em test/pad.test.mjs.
import { computePatient, days, Line, LineResult, r2, Rules, Svc } from "./engine";

export type Freq = "dia" | "alternados" | "48h" | "semana" | "mes" | "periodo";
export const FREQ_LABEL: Record<Freq, string> = { dia: "por dia", alternados: "em dias alternados", "48h": "a cada 48 h", semana: "por semana", mes: "por mês", periodo: "no período" };
export const FREQS: Freq[] = ["dia", "alternados", "48h", "semana", "mes", "periodo"];
/** ini/fim opcionais: sem datas, o item vale o período inteiro do PAD (ou do aditivo). */
export interface PadItem { sid: string; qtd: number; freq: Freq; obs?: string; ini?: string; fim?: string }
export type AditivoStatus = "solicitado" | "aprovado" | "negado";
export interface Aditivo {
  id: string; codigo: string; tipo: string; ini: string; fim: string; status: AditivoStatus;
  itens: PadItem[]; obs: string; em?: string; por?: string; avaliadoEm?: string;
}
export const TIPOS_ADITIVO = ["Antibioticoterapia", "Curativo especial", "Dieta ou suplemento", "Equipamento", "Mudança de programação", "Outro"];
export type PacoteFreq = "dia" | "alternados";
export type PadStatus = "rascunho" | "enviado" | "autorizado" | "encerrado";
export interface Pad {
  id: string; pac: string; versao: number; anterior?: string; status: PadStatus;
  codSesab?: string; usarEscala?: boolean; pacoteFreq?: PacoteFreq; aditivos?: Aditivo[];
  operadora: string; autorizacao: string; medico: string; crm: string;
  ini: string; fim: string;
  escala: Record<string, number>; pontos: number; sugerida: string; pacote: string; motivo: string;
  itens: PadItem[]; relatorios: string[];
  objetivos: string; alta: string; reavaliacao: string;
  criadoEm?: string; por?: string; editEm?: string; enviadoEm?: string; autorizadoEm?: string; encerradoEm?: string; motivoEnc?: string;
}
export interface Opcao { t: string; p: number; exige?: string }
export interface Criterio { id: string; nome: string; opcoes: Opcao[] }
export interface Faixa { min: number; sid: string }
export interface Escala { nome: string; criterios: Criterio[]; faixas: Faixa[] }

/** Modelo de exemplo — a LifeMed deve ajustar para a escala que usa (NEAD, ABEMID ou própria). */
export const ESCALA_PADRAO: Escala = {
  nome: "Escala de complexidade (modelo de exemplo — ajuste à escala usada pela LifeMed)",
  criterios: [
    { id: "c1", nome: "Suporte ventilatório", opcoes: [{ t: "Nenhum", p: 0 }, { t: "Oxigênio contínuo", p: 2 }, { t: "Ventilação não invasiva", p: 3 }, { t: "Ventilação mecânica invasiva", p: 6, exige: "s01" }] },
    { id: "c2", nome: "Via de alimentação", opcoes: [{ t: "Oral", p: 0 }, { t: "Oral com suplemento", p: 1 }, { t: "Sonda ou gastrostomia", p: 2 }, { t: "Nutrição parenteral", p: 4 }] },
    { id: "c3", nome: "Aspiração de vias aéreas", opcoes: [{ t: "Não precisa", p: 0 }, { t: "Até 6 vezes ao dia", p: 1 }, { t: "Mais de 6 vezes ao dia", p: 3 }] },
    { id: "c4", nome: "Medicação", opcoes: [{ t: "Oral ou intramuscular", p: 0 }, { t: "Endovenosa intermitente", p: 2 }, { t: "Endovenosa contínua", p: 4 }] },
    { id: "c5", nome: "Lesões e curativos", opcoes: [{ t: "Nenhum", p: 0 }, { t: "Curativo simples", p: 1 }, { t: "Lesão complexa ou várias lesões", p: 2 }] },
    { id: "c6", nome: "Dependência nas atividades diárias", opcoes: [{ t: "Independente", p: 0 }, { t: "Dependência parcial", p: 1 }, { t: "Dependência total", p: 2 }] },
    { id: "c7", nome: "Nível de consciência", opcoes: [{ t: "Alerta", p: 0 }, { t: "Confuso ou agitado", p: 1 }, { t: "Rebaixado ou comatoso", p: 2 }] },
  ],
  faixas: [
    { min: 0, sid: "s05" }, { min: 3, sid: "s06" }, { min: 5, sid: "s07" },
    { min: 7, sid: "s04" }, { min: 10, sid: "s03" }, { min: 13, sid: "s02" },
  ],
};

const maxS = (a: string, b: string) => (a > b ? a : b), minS = (a: string, b: string) => (a < b ? a : b);
export const addDays = (iso: string, n: number) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d) + n * 864e5).toISOString().slice(0, 10); };
export const overlap = (a1: string, b1: string, a2: string, b2: string): [string, string] | null => {
  const i = maxS(a1, a2), f = minS(b1, b2); return i <= f ? [i, f] : null;
};
const diasDoMes = (iso: string) => { const [y, m] = iso.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };

/** Pontuação e modalidade sugerida pela escala. */
export function pontuar(esc: Escala, resp: Record<string, number>) {
  let pontos = 0; let exige: string | null = null;
  for (const c of esc.criterios) {
    const o = c.opcoes[resp[c.id] ?? -1]; if (!o) continue;
    pontos += o.p; if (o.exige) exige = o.exige;
  }
  const faixas = [...esc.faixas].sort((a, b) => a.min - b.min);
  let sid = faixas[0]?.sid || "";
  for (const f of faixas) if (pontos >= f.min) sid = f.sid;
  if (exige) sid = exige;
  const respondidos = esc.criterios.filter((c) => resp[c.id] != null && c.opcoes[resp[c.id]]).length;
  return { pontos, sugerida: sid, completo: respondidos === esc.criterios.length, respondidos };
}

/** Dias em [a, b] que caem na alternância iniciada em `ancora` (ancora, ancora+2, ancora+4…). */
export function diasAlternados(ancora: string, a: string, b: string): number {
  const ini = maxS(ancora, a); if (ini > b) return 0;
  const off = days(ancora, ini) - 1;                 // distância da âncora até o 1º dia da janela
  const primeiro = off % 2 === 0 ? ini : addDays(ini, 1);
  if (primeiro > b) return 0;
  return Math.floor((days(primeiro, b) - 1) / 2) + 1;
}

/** Janela em que o item vale: as datas dele (se houver) dentro do período do PAD ou do aditivo. */
export function janelaItem(it: PadItem, base: { ini: string; fim: string }): { ini: string; fim: string } | null {
  const ov = overlap(base.ini, base.fim, it.ini || base.ini, it.fim || base.fim);
  return ov ? { ini: ov[0], fim: ov[1] } : null;
}

/** Quantidade prevista de um item em [a, b]. `base` = período do PAD (ou do aditivo). */
export function qtdPrevista(it: PadItem, base: { ini: string; fim: string }, a: string, b: string): number {
  const w = janelaItem(it, base); if (!w) return 0;
  const ov = overlap(w.ini, w.fim, a, b); if (!ov) return 0;
  const d = days(ov[0], ov[1]); const q = Number(it.qtd) || 0;
  switch (it.freq) {
    case "dia": return r2(q * d);
    case "alternados": case "48h": return r2(q * diasAlternados(w.ini, ov[0], ov[1]));
    case "semana": return Math.round((q * d) / 7);
    case "mes": {
      // proporcional aos dias de cada mês tocado
      let tot = 0, cur = ov[0];
      while (cur <= ov[1]) {
        const fimMes = `${cur.slice(0, 8)}${String(diasDoMes(cur)).padStart(2, "0")}`;
        const f = minS(fimMes, ov[1]);
        tot += (q * days(cur, f)) / diasDoMes(cur);
        cur = addDays(f, 1);
      }
      return Math.round(tot);
    }
    case "periodo": return Math.round((q * d) / days(w.ini, w.fim));
  }
  return 0;
}

/** Diárias do pacote em [a, b] (todos os dias ou em dias alternados). */
export function diariasPacote(pad: Pick<Pad, "ini" | "fim" | "pacoteFreq">, a: string, b: string): number {
  const ov = overlap(pad.ini, pad.fim, a, b); if (!ov) return 0;
  return pad.pacoteFreq === "alternados" ? diasAlternados(pad.ini, ov[0], ov[1]) : days(ov[0], ov[1]);
}

const aprovados = (pad: Pad) => (pad.aditivos || []).filter((x) => x.status === "aprovado");

/** Linhas previstas pelo PAD em [a, b], no formato do motor de cobrança (inclui os aditivos aprovados). */
export function linhasPrevistas(pad: Pad, a: string, b: string, svcs: Record<string, Svc>, comAditivos = true): Line[] {
  const out: Line[] = [];
  const ov = overlap(pad.ini, pad.fim, a, b);
  if (ov && pad.pacote && svcs[pad.pacote]) out.push({ id: "pkg", sid: pad.pacote, qtd: diariasPacote(pad, a, b), ini: ov[0], fim: ov[1], modo: "auto", vu: svcs[pad.pacote].valor });
  const push = (id: string, it: PadItem, base: { ini: string; fim: string }) => {
    const s = svcs[it.sid]; if (!s || s.pacote) return;
    const w = janelaItem(it, base); if (!w) return;
    const o = overlap(w.ini, w.fim, a, b); if (!o) return;
    const q = qtdPrevista(it, base, a, b); if (q <= 0) return;
    out.push({ id, sid: it.sid, qtd: q, ini: o[0], fim: o[1], modo: "auto", vu: s.valor });
  };
  if (ov) pad.itens.forEach((it, i) => push("i" + i, it, pad));
  if (comAditivos) aprovados(pad).forEach((ad, k) => ad.itens.forEach((it, i) => push(`a${k}-${i}`, it, ad)));
  return out;
}

/** Orçamento do período inteiro do PAD (com os aditivos aprovados) e quanto vem dos aditivos. */
export function orcamento(pad: Pad, svcs: Record<string, Svc>, rules: Rules) {
  const ini = [pad.ini, ...aprovados(pad).map((x) => x.ini)].sort()[0], fim = [pad.fim, ...aprovados(pad).map((x) => x.fim)].sort().slice(-1)[0];
  const res: LineResult[] = computePatient(linhasPrevistas(pad, ini, fim, svcs), svcs, rules);
  const cobrado = r2(res.reduce((s, r) => s + r.total, 0));
  const incluso = r2(res.reduce((s, r) => s + r.naoCobrado, 0));
  const aditivos = r2(res.filter((r) => r.line.id.startsWith("a")).reduce((s, r) => s + r.total, 0));
  const porItem: Record<string, LineResult> = {}; for (const r of res) porItem[r.line.id] = r;
  return { res, cobrado, incluso, aditivos, porItem, dias: days(pad.ini, pad.fim), diarias: diariasPacote(pad, pad.ini, pad.fim) };
}

/** Escala em uso? Planos antigos sem o campo usam a escala se já tinham respostas. */
export const usaEscala = (p: Pick<Pad, "usarEscala" | "escala">) => p.usarEscala ?? Object.keys(p.escala || {}).length > 0;

/** Situação para exibição (considera a data de hoje). */
export function situacao(pad: Pick<Pad, "status" | "ini" | "fim">, hoje: string) {
  if (pad.status === "rascunho") return { k: "rascunho", label: "Rascunho", kind: "" };
  if (pad.status === "enviado") return { k: "enviado", label: "Aguardando autorização", kind: "info" };
  if (pad.status === "encerrado") return { k: "encerrado", label: "Encerrado", kind: "" };
  if (hoje > pad.fim) return { k: "vencido", label: "Vencido", kind: "err" };
  if (hoje < pad.ini) return { k: "autorizado", label: "Autorizado", kind: "ok" };
  const resta = days(hoje, pad.fim) - 1;
  if (resta <= 7) return { k: "avencer", label: resta === 0 ? "Vence hoje" : `Vence em ${resta} dia${resta > 1 ? "s" : ""}`, kind: "warn", resta };
  return { k: "vigente", label: "Em vigor", kind: "ok" };
}

/** Versão mais recente de cada paciente. */
export function ultimasVersoes(pads: Pad[]): Record<string, Pad> {
  const m: Record<string, Pad> = {};
  for (const p of pads) if (!m[p.pac] || p.versao > m[p.pac].versao) m[p.pac] = p;
  return m;
}

/** PAD que vale para o paciente em [a, b]: autorizado ou enviado, com período sobreposto (o de maior versão). */
export function padDoPeriodo(pads: Pad[], pac: string, a: string, b: string): Pad | null {
  const c = pads.filter((p) => p.pac === pac && (p.status === "autorizado" || p.status === "enviado") && overlap(p.ini, p.fim, a, b));
  return c.sort((x, y) => y.versao - x.versao)[0] || null;
}
export function padsDoPeriodo(pads: Pad[], pac: string, a: string, b: string): Pad[] {
  return pads.filter((p) => p.pac === pac && (p.status === "autorizado" || p.status === "enviado") && overlap(p.ini, p.fim, a, b)).sort((x, y) => x.ini.localeCompare(y.ini));
}

/** Previsto (todos os PADs do período) x realizado (lançamentos) por serviço. */
export function previstoRealizado(pads: Pad[], lancs: { sid: string; qtd: number }[], a: string, b: string, svcs: Record<string, Svc>) {
  const prev: Record<string, number> = {}, real: Record<string, number> = {};
  for (const p of pads) for (const l of linhasPrevistas(p, a, b, svcs)) prev[l.sid] = r2((prev[l.sid] || 0) + l.qtd);
  for (const l of lancs) real[l.sid] = r2((real[l.sid] || 0) + (Number(l.qtd) || 0));
  const sids = [...new Set([...Object.keys(prev), ...Object.keys(real)])].filter((s) => svcs[s]).sort((x, y) => svcs[x].ordem - svcs[y].ordem);
  return sids.map((sid) => {
    const pv = prev[sid] || 0, rl = real[sid] || 0;
    return { sid, svc: svcs[sid], previsto: pv, realizado: rl, dif: r2(rl - pv), foraDoPlano: !(sid in prev) };
  });
}

/** O que mudou de uma versão para a outra. */
export function diffVersoes(a: Pad, b: Pad, svcs: Record<string, Svc>, nomeTipo: (id: string) => string = (x) => x): string[] {
  const out: string[] = []; const n = (sid: string) => svcs[sid]?.nome || sid;
  const fq = (it: PadItem) => `${String(it.qtd).replace(".", ",")} ${FREQ_LABEL[it.freq]}`;
  if (a.pacote !== b.pacote) out.push(`Modalidade: ${n(a.pacote)} → ${n(b.pacote)}`);
  const ma: Record<string, PadItem> = {}, mb: Record<string, PadItem> = {};
  a.itens.forEach((i) => (ma[i.sid] = i)); b.itens.forEach((i) => (mb[i.sid] = i));
  for (const sid of Object.keys(mb)) if (!ma[sid]) out.push(`Incluído: ${n(sid)} (${fq(mb[sid])})`);
  for (const sid of Object.keys(ma)) if (!mb[sid]) out.push(`Retirado: ${n(sid)}`);
  for (const sid of Object.keys(ma)) if (mb[sid] && (ma[sid].qtd !== mb[sid].qtd || ma[sid].freq !== mb[sid].freq)) out.push(`Alterado: ${n(sid)}, de ${fq(ma[sid])} para ${fq(mb[sid])}`);
  for (const sid of Object.keys(ma)) if (mb[sid] && ((ma[sid].ini || "") !== (mb[sid].ini || "") || (ma[sid].fim || "") !== (mb[sid].fim || ""))) out.push(`Período alterado: ${n(sid)}`);
  if ((a.pacoteFreq || "dia") !== (b.pacoteFreq || "dia")) out.push(`Visitas do pacote: ${b.pacoteFreq === "alternados" ? "passam a ser em dias alternados" : "passam a ser todos os dias"}`);
  const ra = new Set(a.relatorios), rb = new Set(b.relatorios);
  for (const r of rb) if (!ra.has(r)) out.push(`Relatório exigido: ${nomeTipo(r)}`);
  for (const r of ra) if (!rb.has(r)) out.push(`Relatório dispensado: ${nomeTipo(r)}`);
  if (a.medico !== b.medico) out.push(`Médico responsável: ${a.medico || "—"} → ${b.medico || "—"}`);
  return out;
}

/** Validação antes de enviar para autorização. */
export function pendenciasPad(p: Pad, esc: Escala): string[] {
  const e: string[] = [];
  if (!p.pac) e.push("Escolha o paciente.");
  if (!p.ini || !p.fim) e.push("Informe o início e o fim do período.");
  else if (p.fim < p.ini) e.push("O fim do período está antes do início.");
  if (!p.pacote) e.push("Escolha a modalidade (pacote).");
  if (usaEscala(p)) {
    if (!pontuar(esc, p.escala).completo) e.push("Responda todos os critérios da avaliação de complexidade (ou desligue a escala).");
    if (p.pacote && p.sugerida && p.pacote !== p.sugerida && !p.motivo.trim()) e.push("Explique por que a modalidade é diferente da sugerida pela escala.");
  }
  for (const it of p.itens) if (it.ini && it.fim && it.fim < it.ini) e.push("Há item com fim antes do início.");
  for (const it of p.itens) if ((it.ini && (it.ini < p.ini || it.ini > p.fim)) || (it.fim && (it.fim > p.fim || it.fim < p.ini))) { e.push("Há item com datas fora do período do PAD."); break; }
  if (!p.medico.trim()) e.push("Informe o médico responsável.");
  if (p.itens.some((i) => !(Number(i.qtd) > 0))) e.push("Há itens sem quantidade.");
  return e;
}

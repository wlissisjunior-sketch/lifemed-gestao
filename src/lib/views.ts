import { computePatient, includes, LineResult, Line, Rules, Svc, r2 } from "./engine";

export interface Paciente { id: string; nome: string; cns: string; municipio: string; admissao: string; ativo: boolean }
export interface Lanc { id: string; comp: string; pac: string; sid: string; qtd: number; ini?: string; fim?: string; modo: "auto" | "cobrar"; vu: number; obs?: string; por?: string; em?: string; editPor?: string; editEm?: string }
export interface Tipo { id: string; nome: string }

export const toLine = (l: Lanc): Line => ({ id: l.id, sid: l.sid, qtd: Number(l.qtd) || 0, ini: l.ini || undefined, fim: l.fim || undefined, modo: l.modo || "auto", vu: Number(l.vu) || 0 });

export function byPatient(lancs: Lanc[], svcs: Record<string, Svc>, rules: Rules): Record<string, LineResult[]> {
  const g: Record<string, Line[]> = {};
  for (const l of lancs) (g[l.pac] ||= []).push(toLine(l));
  const out: Record<string, LineResult[]> = {};
  for (const [p, ls] of Object.entries(g)) out[p] = computePatient(ls, svcs, rules);
  return out;
}

const sum = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0));

export function overview(pacs: Paciente[], res: Record<string, LineResult[]>) {
  return pacs
    .filter((p) => p.ativo || res[p.id]?.length)
    .map((p) => {
      const rs = res[p.id] || [];
      return { p, linhas: rs.length, pacotes: [...new Set(rs.filter((r) => r.svc.pacote).map((r) => r.svc.nome))],
        cobrado: sum(rs.map((r) => r.total)), naoCobrado: sum(rs.map((r) => r.naoCobrado)) };
    })
    .sort((a, b) => a.p.nome.localeCompare(b.p.nome, "pt-BR"));
}

export function inclusosDoPaciente(rs: LineResult[], svcs: Record<string, Svc>, rules: Rules) {
  const pk = rs.filter((r) => r.svc.pacote && r.line.qtd > 0);
  const out: Record<string, { svc: Svc; limite: string; pacotes: string[] }> = {};
  for (const p of pk) for (const s of Object.values(svcs)) {
    if (!s.ativo) continue;
    const lim = includes(p.svc, s, rules);
    if (lim) { (out[s.id] ||= { svc: s, limite: lim, pacotes: [] }); if (!out[s.id].pacotes.includes(p.svc.nome)) out[s.id].pacotes.push(p.svc.nome); }
  }
  return Object.values(out).sort((a, b) => a.svc.ordem - b.svc.ordem);
}

export function fisicoFinanceiro(svcs: Svc[], all: LineResult[]) {
  const agg: Record<string, { fisico: number; fin: number; inc: number; nc: number }> = {};
  for (const r of all) {
    const a = (agg[r.svc.id] ||= { fisico: 0, fin: 0, inc: 0, nc: 0 });
    a.fisico += r.cobrada; a.fin += r.total; a.inc += r.inclusa; a.nc += r.naoCobrado;
  }
  const rows = svcs.filter((s) => s.ativo || agg[s.id]).sort((a, b) => a.ordem - b.ordem).map((s) => {
    const a = agg[s.id] || { fisico: 0, fin: 0, inc: 0, nc: 0 };
    return { svc: s, fisico: Math.round(a.fisico * 10000) / 10000, financeiro: r2(a.fin), incluso: Math.round(a.inc * 10000) / 10000, naoCobrado: r2(a.nc) };
  });
  const total = sum(rows.map((r) => r.financeiro));
  const cats: Record<string, number> = {};
  for (const r of rows) cats[r.svc.categoria] = (cats[r.svc.categoria] || 0) + r.financeiro;
  return { rows, total, naoCobrado: sum(rows.map((r) => r.naoCobrado)),
    categorias: Object.entries(cats).map(([c, v]) => ({ categoria: c, valor: r2(v), pct: total ? v / total : 0 })) };
}

export function faturamento(pacs: Record<string, Paciente>, res: Record<string, LineResult[]>, comp: { ini: string; fim: string }) {
  const blocos = Object.entries(res)
    .filter(([pid]) => pacs[pid])
    .map(([pid, rs]) => {
      const p = pacs[pid];
      const linhas = rs.filter((r) => r.cobrada > 0)
        .sort((a, b) => a.svc.ordem - b.svc.ordem || (a.line.ini || "").localeCompare(b.line.ini || ""))
        .map((r) => ({ r, programa: r.svc.descricao || r.svc.nome,
          ini: r.line.ini || (p.admissao && p.admissao > comp.ini ? p.admissao : comp.ini), fim: r.line.fim || comp.fim,
          qtd: r.cobrada, vu: r.line.vu, total: r.total }));
      return { p, linhas, total: sum(linhas.map((l) => l.total)) };
    })
    .filter((b) => b.linhas.length)
    .sort((a, b) => a.p.nome.localeCompare(b.p.nome, "pt-BR"));
  return { blocos, total: sum(blocos.map((b) => b.total)) };
}

export function fechamento(rs: LineResult[]) {
  const agg: Record<string, { svc: Svc; qtd: number; vu: number; total: number }> = {};
  for (const r of rs) {
    if (r.cobrada <= 0) continue;
    const k = r.svc.id + "|" + r.line.vu;
    const a = (agg[k] ||= { svc: r.svc, qtd: 0, vu: r.line.vu, total: 0 });
    a.qtd += r.cobrada; a.total += r.total;
  }
  const linhas = Object.values(agg).sort((a, b) => a.svc.ordem - b.svc.ordem).map((a) => ({ ...a, qtd: Math.round(a.qtd * 10000) / 10000, total: r2(a.total) }));
  return { linhas, total: sum(linhas.map((l) => l.total)), naoCobrado: sum(rs.map((r) => r.naoCobrado)) };
}

export function matrizRelatorios(pacs: Paciente[], tipos: Tipo[], rels: Record<string, { pac: string; st: Record<string, string> }>) {
  const ativos = pacs.filter((p) => p.ativo).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const byPac: Record<string, Record<string, string>> = {};
  for (const r of Object.values(rels)) byPac[r.pac] = r.st || {};
  const linhas = ativos.map((p) => {
    const st = byPac[p.id] || {};
    const ent = tipos.filter((t) => st[t.id] === "entregue").length;
    return { p, st, entregues: ent, pendentes: tipos.length - ent, pct: tipos.length ? ent / tipos.length : 0 };
  });
  const esperados = ativos.length * tipos.length;
  const entregues = linhas.reduce((a, l) => a + l.entregues, 0);
  const porTipo = tipos.map((t) => { const e = linhas.filter((l) => l.st[t.id] === "entregue").length; return { t, entregues: e, pendentes: ativos.length - e }; });
  return { linhas, esperados, entregues, pendentes: esperados - entregues, pct: esperados ? entregues / esperados : 0, porTipo };
}

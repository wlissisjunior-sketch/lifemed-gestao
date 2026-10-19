// Motor de cobrança — funções puras (sem banco), testadas contra as planilhas de agosto/2026.
//
// Regra (Diário Oficial da Bahia, 15/04/2026): o que o pacote do paciente já inclui não é
// cobrado pelo valor unitário; o que está fora do pacote é cobrado normalmente.
// Cada lançamento pode ter início e fim: a cobertura é calculada pelos dias em que o serviço
// se sobrepõe aos períodos de pacote do paciente.

export interface Svc {
  id: string; ordem: number; categoria: string; nome: string; descricao: string; valor: number;
  pacote: boolean; medicamento: boolean; medLimit: number | null; ativo: boolean;
}
export interface Line {
  id: string; sid: string; qtd: number; ini?: string; fim?: string; modo: "auto" | "cobrar"; vu: number;
}
export interface LineResult {
  line: Line; svc: Svc;
  inclusa: number;      // quantidade coberta pelo pacote (não cobrada)
  cobrada: number;
  total: number;        // valor cobrado
  naoCobrado: number;   // valor do que o pacote incluiu
  pacotes: string[];    // ids dos lançamentos de pacote que cobriram
}
export type Rules = Record<string, Record<string, "dias" | "total">>;  // pacote sid -> serviço sid -> limite

export const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
export const r4 = (x: number) => Math.round((x + Number.EPSILON) * 10000) / 10000;

const utc = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const days = (a: string, b: string) => Math.round((utc(b) - utc(a)) / 86400000) + 1;
const addDay = (iso: string, n: number) => new Date(utc(iso) + n * 86400000).toISOString().slice(0, 10);

export function includes(pkg: Svc, svc: Svc, rules: Rules): "dias" | "total" | null {
  if (svc.pacote) return null;
  if (svc.medicamento) return pkg.medLimit != null && svc.valor <= pkg.medLimit ? "total" : null;
  return rules[pkg.id]?.[svc.id] ?? null;
}

function unionDays(iv: [string, string][]): number {
  const s = [...iv].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  let total = 0, ci: string | null = null, cf: string | null = null;
  for (const [i, f] of s) {
    if (ci === null) { ci = i; cf = f; }
    else if (i <= addDay(cf!, 1)) { if (f > cf!) cf = f; }
    else { total += days(ci, cf!); ci = i; cf = f; }
  }
  if (ci !== null) total += days(ci, cf!);
  return total;
}

export function computePatient(lines: Line[], svcs: Record<string, Svc>, rules: Rules): LineResult[] {
  const res: LineResult[] = lines.filter((l) => svcs[l.sid]).map((l) => ({ line: l, svc: svcs[l.sid], inclusa: 0, cobrada: 0, total: 0, naoCobrado: 0, pacotes: [] }));
  const pkgs = res.filter((r) => r.svc.pacote && r.line.qtd > 0);
  for (const r of res) {
    const { line: l, svc: s } = r;
    const q = l.qtd;
    let covered = 0;
    if (!s.pacote && l.modo !== "cobrar" && q > 0) {
      const cov = pkgs.map((p) => ({ p, lim: includes(p.svc, s, rules) })).filter((x) => x.lim);
      if (cov.length) {
        const diasLimit = cov.some((x) => x.lim === "dias");
        if (l.ini && l.fim) {
          const lineDays = days(l.ini, l.fim);
          const inter: [string, string][] = []; let undated = 0;
          for (const { p } of cov) {
            const pl = p.line;
            if (pl.ini && pl.fim) {
              const i = l.ini > pl.ini ? l.ini : pl.ini, f = l.fim < pl.fim ? l.fim : pl.fim;
              if (i <= f) inter.push([i, f]);
            } else undated += Math.floor(pl.qtd);
          }
          const covDays = Math.min(lineDays, unionDays(inter) + undated);
          covered = (q * covDays) / lineDays;
          if (diasLimit) covered = Math.min(covered, covDays);
        } else {
          const pkgDays = cov.reduce((a, { p }) => a + (p.line.ini && p.line.fim ? days(p.line.ini, p.line.fim) : Math.floor(p.line.qtd)), 0);
          covered = diasLimit ? Math.min(q, pkgDays) : q;
        }
        covered = Math.min(r4(covered), q);
        r.pacotes = cov.map((x) => x.p.line.id);
      }
    }
    r.inclusa = covered;
    r.cobrada = r4(q - covered);
    r.total = r2(r.cobrada * l.vu);
    r.naoCobrado = r2(covered * l.vu);
  }
  return res;
}

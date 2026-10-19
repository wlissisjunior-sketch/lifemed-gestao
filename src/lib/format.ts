const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const money = (v: number | null | undefined) => (v == null || isNaN(v) ? "—" : brl.format(v));
export const qty = (v: number | null | undefined) => (v == null ? "—" : num.format(v));
export const pct = (v: number) => `${Math.round((v || 0) * 100)}%`;
export const dateBR = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
export const dateTimeBR = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? dateBR(iso) : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
export const mesAno = (comp: string) => { const [y, m] = comp.split("-").map(Number); return `${MESES[m - 1]} de ${y}`; };
export const mesCurto = (comp: string) => { const [y, m] = comp.split("-").map(Number); return `${MESES[m - 1].slice(0, 3)}/${String(y).slice(2)}`; };
export const compRange = (comp: string) => {
  const [y, m] = comp.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { ini: `${comp}-01`, fim: `${comp}-${String(last).padStart(2, "0")}` };
};
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Quantidade digitada: aceita "2,5", "2.5" ou horas "7:37" (= 7 + 37/60). */
export function parseQtd(s: string): number | null {
  const t = (s || "").trim();
  if (!t) return null;
  const hm = t.match(/^(\d+)\s*[:h]\s*(\d{1,2})$/i);
  if (hm) { const m = Number(hm[2]); if (m >= 60) return NaN; return Number(hm[1]) + m / 60; }
  const n = Number(t.replace(/\./g, (t.includes(",") ? "" : ".")).replace(",", "."));
  return isNaN(n) ? NaN : n;
}
export const isHora = (nome: string) => /hora/i.test(nome);
/** 7.616666 -> "7h37" */
export const horasBR = (v: number) => { const h = Math.floor(v + 1e-9); const m = Math.round((v - h) * 60); return m === 60 ? `${h + 1}h00` : `${h}h${String(m).padStart(2, "0")}`; };
export const norm = (s: string) => (s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
export const shortName = (n: string) => n.split(" ").slice(0, 2).join(" ");

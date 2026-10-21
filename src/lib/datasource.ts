// ============================================================================
// CAMADA DE DADOS — ponto único de troca do armazenamento.
//
// Hoje (demonstração): os dados ficam no navegador de quem abre o sistema
// (localStorage). Cada pessoa vê a própria cópia, iniciada com dados de exemplo.
//
// Depois (produção): troque `createLocalSource()` por um adaptador que chame a
// API do backend (MySQL ou SQL Server). As telas só usam a interface abaixo:
//   db.doc("tabela/id").get/set/update/delete
//   db.collection("tabela").where(campo,"==",valor).orderBy(campo).limit(n).onSnapshot/get
//   db.collection("tabela").add(dados)
// O mapeamento de cada "tabela" para o esquema SQL está em docs/modelo-de-dados.md.
// ============================================================================
import seed from "../demo-seed.json";
import { arquivos } from "./arquivos";

const KEY = "lifemed.demo.v1";
type Store = Map<string, any>;
const listeners = new Set<() => void>();

function seedStore(): Store {
  const m: Store = new Map();
  for (const [col, docs] of Object.entries<any>(seed as any)) for (const [id, d] of Object.entries<any>(docs)) m.set(`${col}/${id}`, d);
  return m;
}
function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const m: Store = new Map(Object.entries(JSON.parse(raw)));
      // versões novas do sistema: coleções que a cópia salva ainda não tem entram com os dados de exemplo
      for (const [col, docs] of Object.entries<any>(seed as any)) {
        if ([...m.keys()].some((k) => k.startsWith(col + "/"))) continue;
        for (const [id, d] of Object.entries<any>(docs)) m.set(`${col}/${id}`, d);
      }
      return m;
    }
  } catch { /* sem armazenamento */ }
  return seedStore();
}
let store: Store = load();
let saveTimer: any = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(store))); } catch { /* cheio ou bloqueado */ } }, 150);
  setTimeout(() => listeners.forEach((l) => l()), 0);
}
export function resetDemo() { store = seedStore(); try { localStorage.removeItem(KEY); localStorage.removeItem("lm.comp"); } catch { /* ok */ } arquivos.clear().catch(() => undefined); persist(); }
// outras abas do mesmo navegador
if (typeof window !== "undefined") window.addEventListener("storage", (e) => { if (e.key === KEY) { store = load(); listeners.forEach((l) => l()); } });

const clone = (x: any) => JSON.parse(JSON.stringify(x));
const snap = (p: string) => ({ id: p.split("/").pop()!, exists: store.has(p), data: () => (store.has(p) ? clone(store.get(p)) : undefined), metadata: {} });

function query(col: string, filters: [string, any][] = [], order: [string, string] | null = null, lim = 1000): any {
  const run = () => {
    let docs = [...store.keys()].filter((k) => k.startsWith(col + "/") && k.split("/").length === 2)
      .filter((k) => filters.every(([f, v]) => store.get(k)[f] === v)).map(snap);
    if (order) docs.sort((a, b) => { const x = a.data()![order[0]], y = b.data()![order[0]]; return (x < y ? -1 : x > y ? 1 : 0) * (order[1] === "desc" ? -1 : 1); });
    docs = docs.slice(0, lim);
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} };
  };
  return {
    where: (f: string, _op: string, v: any) => query(col, [...filters, [f, v]], order, lim),
    orderBy: (f: string, d = "asc") => query(col, filters, [f, d], lim),
    limit: (n: number) => query(col, filters, order, n),
    get: async () => run(),
    onSnapshot(next: (s: any) => void) { const l = () => next(run()); listeners.add(l); setTimeout(l, 0); return () => listeners.delete(l); },
  };
}
function doc(path: string) {
  return {
    id: path.split("/").pop()!, path,
    get: async () => snap(path),
    set: async (d: any) => { store.set(path, clone(d)); persist(); },
    update: async (d: any) => { if (!store.has(path)) throw { code: "invalid_argument", message: "Registro não encontrado." }; store.set(path, { ...store.get(path), ...clone(d) }); persist(); },
    delete: async () => { store.delete(path); persist(); },
  };
}
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const db = {
  doc,
  collection: (c: string) => Object.assign(query(c), { path: c, doc: (id?: string) => doc(`${c}/${id || newId()}`), add: async (d: any) => { const r = doc(`${c}/${newId()}`); await r.set(d); return r; } }),
};

/** Tabela PLANSERV: arquivo estático publicado com o site; uma tabela importada fica no navegador. */
const PS_KEY = "lifemed.demo.planserv";
export async function loadPlanserv(): Promise<any> {
  try { const raw = localStorage.getItem(PS_KEY); if (raw) return JSON.parse(raw); } catch { /* ok */ }
  const r = await fetch("/planserv.json"); if (!r.ok) throw new Error(String(r.status)); return r.json();
}
export async function savePlanserv(data: any) { try { localStorage.setItem(PS_KEY, JSON.stringify(data)); return true; } catch { return false; } }

export type Papel = "admin" | "operador" | "leitor";
export function capsFor(papel: Papel, nome: string) {
  const user = {
    canEdit: async () => papel === "admin",
    can: async (n: string) => (n === "data.write" ? papel !== "leitor" : false),
    isOwner: async () => papel === "admin",
    me: async () => ({ id: "demo-" + papel, name: nome }),
    profiles: async (ids: string[]) => Object.fromEntries(ids.map((i) => [i, { name: i === "demo" ? "dados de exemplo" : i.startsWith("demo-") ? `perfil ${i.slice(5)}` : "Usuário" }])),
  };
  const downloads = {
    async save({ filename, data }: { filename: string; data: any }) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => globalThis.URL.revokeObjectURL(url), 4000);
      return { status: "saved" };
    },
  };
  return { db, user, downloads, assets: null };
}

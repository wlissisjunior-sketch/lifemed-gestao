import { Svc, Rules } from "./engine";
import { Paciente, Lanc, Tipo } from "./views";
import { compRange, todayISO } from "./format";
import { Pad, Escala, ESCALA_PADRAO } from "./pad";

const { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } = React;

export type Role = "admin" | "operador" | "leitor";
export interface Comp { id: string; ini: string; fim: string; status: "aberta" | "fechada"; fechadaPor?: string; fechadaEm?: string }
export interface Toast { id: number; kind: "ok" | "err" | "info"; text: string }

interface Ctx {
  status: "loading" | "ready" | "nodb";
  role: Role; meId: string | null; isOwner: boolean;
  db: any; assets: any; downloads: any; user: any;
  servicos: Record<string, Svc>; svcList: Svc[]; rules: Rules;
  pacientes: Record<string, Paciente>; pacList: Paciente[];
  comps: Comp[]; comp: Comp | null; setComp: (id: string) => void;
  lancs: Lanc[]; rels: Record<string, any>;
  config: Record<string, any>; tipos: Tipo[];
  pads: Pad[]; escala: Escala;
  can: (r: Role) => boolean; editavel: boolean;
  write: (fn: () => Promise<any>, ok?: string) => Promise<boolean>;
  log: (acao: string, alvo: string, det?: any) => void;
  toast: (kind: Toast["kind"], text: string) => void; toasts: Toast[];
  names: (ids: string[]) => Record<string, string>;
}
const StoreCtx = createContext(null as any as Ctx);
export const useStore = (): Ctx => useContext(StoreCtx);

const RANK: Record<Role, number> = { admin: 3, operador: 2, leitor: 1 };
const ls = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } } };

function errText(e: any): string {
  const c = e?.code;
  if (c === "invalid_argument") return "Seu acesso não permite fazer esta alteração. Peça ao responsável para liberar.";
  if (c === "quota_exceeded") return "O banco de dados atingiu o limite de registros. Avise o responsável pelo sistema.";
  if (c === "resource_exhausted") return "Muitas alterações seguidas. Aguarde alguns segundos e tente de novo.";
  if (c === "revoked") return "Seu acesso a este sistema foi alterado. Recarregue a página.";
  return e?.message ? `Não foi possível salvar: ${e.message}` : "Não foi possível salvar. Tente de novo.";
}

const docsToMap = (snap: any) => { const m: Record<string, any> = {}; for (const d of snap.docs) m[d.id] = { id: d.id, ...d.data() }; return m; };

export function StoreProvider({ children, boot }: { children: any; boot: any }) {
  const [status, setStatus] = useState("loading" as Ctx["status"]);
  const [caps, setCaps] = useState({ db: null, user: null, assets: null, downloads: null } as any);
  const [role, setRole] = useState("operador" as Role);
  const [meId, setMeId] = useState(null as string | null);
  const [isOwner, setOwner] = useState(false);
  const [servicos, setServicos] = useState({} as Record<string, Svc>);
  const [regras, setRegras] = useState({} as Record<string, any>);
  const [pacientes, setPacientes] = useState({} as Record<string, Paciente>);
  const [compDocs, setCompDocs] = useState({} as Record<string, any>);
  const [fechDocs, setFechDocs] = useState({} as Record<string, any>);
  const [config, setConfig] = useState({} as Record<string, any>);
  const [compId, setCompId] = useState(ls.get("lm.comp") || "");
  const [lancMap, setLancMap] = useState({} as Record<string, Lanc>);
  const [rels, setRels] = useState({} as Record<string, any>);
  const [padMap, setPadMap] = useState({} as Record<string, Pad>);
  const [toasts, setToasts] = useState([] as Toast[]);
  const [nameMap, setNameMap] = useState({} as Record<string, string>);
  const pendingNames = useRef(new Set<string>());
  const tid = useRef(0);

  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++tid.current;
    setToasts((t: Toast[]) => [...t.slice(-2), { id, kind, text }]);
    setTimeout(() => setToasts((t: Toast[]) => t.filter((x) => x.id !== id)), kind === "err" ? 7000 : 3500);
  }, []);

  // 1) capacidades (vindas do login no Supabase)
  useEffect(() => {
    let alive = true;
    (async () => {
      const c = boot; if (!c?.db) { setStatus("nodb"); return; }
      setCaps(c);
      const [edit, w, own, me] = await Promise.all([c.user.canEdit(), c.user.can("data.write"), c.user.isOwner(), c.user.me()]);
      if (!alive) return;
      setRole(edit || own ? "admin" : w === false ? "leitor" : "operador");
      setOwner(!!own); setMeId(me?.id || null);
    })();
    return () => { alive = false; };
  }, [boot]);

  // 2) assinaturas gerais (uma vez)
  useEffect(() => {
    const db = caps.db; if (!db) return;
    const loaded = new Set<string>();
    const done = (k: string) => { loaded.add(k); if (loaded.size >= 7) setStatus("ready"); };
    const onErr = (e: any) => { if (e?.code !== "revoked") toast("err", "A conexão com o banco caiu. Recarregue a página."); };
    const subs = [
      db.collection("servicos").onSnapshot((s: any) => { setServicos(docsToMap(s)); done("s"); }, onErr),
      db.collection("regras").onSnapshot((s: any) => { setRegras(docsToMap(s)); done("r"); }, onErr),
      db.collection("pacientes").onSnapshot((s: any) => { setPacientes(docsToMap(s)); done("p"); }, onErr),
      db.collection("competencias").onSnapshot((s: any) => { setCompDocs(docsToMap(s)); done("c"); }, onErr),
      db.collection("fechamentos").onSnapshot((s: any) => { setFechDocs(docsToMap(s)); done("f"); }, onErr),
      db.collection("config").onSnapshot((s: any) => { setConfig(docsToMap(s)); done("g"); }, onErr),
      db.collection("pads").onSnapshot((s: any) => { setPadMap(docsToMap(s)); done("d"); }, onErr),
    ];
    return () => subs.forEach((u: any) => u());
  }, [caps.db]);

  const comps: Comp[] = useMemo(() => Object.values(compDocs).map((c: any) => {
    const f = fechDocs[c.id];
    return { id: c.id, ini: c.ini, fim: c.fim, status: f?.status === "fechada" ? "fechada" : "aberta", fechadaPor: f?.por, fechadaEm: f?.em } as Comp;
  }).sort((a: Comp, b: Comp) => (a.id < b.id ? 1 : -1)), [compDocs, fechDocs]);
  const comp = comps.find((c) => c.id === compId) || comps[0] || null;
  const curId = comp?.id || "";

  // 3) assinaturas da competência escolhida
  useEffect(() => {
    const db = caps.db; if (!db || !curId) { setLancMap({}); setRels({}); return; }
    const a = db.collection("lancamentos").where("comp", "==", curId).limit(1000).onSnapshot((s: any) => setLancMap(docsToMap(s)), () => undefined);
    const b = db.collection("relatorios").where("comp", "==", curId).limit(1000).onSnapshot((s: any) => setRels(docsToMap(s)), () => undefined);
    return () => { a(); b(); };
  }, [caps.db, curId]);

  const svcList = useMemo(() => (Object.values(servicos) as Svc[]).sort((a, b) => a.ordem - b.ordem), [servicos]);
  const rules: Rules = useMemo(() => { const r: Rules = {}; for (const [k, v] of Object.entries<any>(regras)) r[k] = v.itens || {}; return r; }, [regras]);
  const pacList = useMemo(() => (Object.values(pacientes) as Paciente[]).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [pacientes]);
  const lancs = useMemo(() => Object.values(lancMap) as Lanc[], [lancMap]);
  const tipos: Tipo[] = config.relatorios?.tipos || [];
  const pads = useMemo(() => Object.values(padMap) as Pad[], [padMap]);
  const escala: Escala = config.escala?.criterios ? config.escala : ESCALA_PADRAO;

  const can = (r: Role) => RANK[role] >= RANK[r];
  const editavel = can("operador") && comp?.status === "aberta";

  const write = useCallback(async (fn: () => Promise<any>, ok?: string) => {
    try { await fn(); if (ok) toast("ok", ok); return true; }
    catch (e: any) { toast("err", errText(e)); return false; }
  }, [toast]);

  const log = useCallback((acao: string, alvo: string, det?: any) => {
    const db = caps.db; if (!db) return;
    db.collection("auditoria").add({ em: new Date().toISOString(), por: meId || "", acao, alvo, det: det == null ? "" : typeof det === "string" ? det : JSON.stringify(det) }).catch(() => undefined);
  }, [caps.db, meId]);

  // nomes de quem lançou (ids opacos -> nome exibido)
  const names = useCallback((ids: string[]) => {
    const want = ids.filter((i) => i && !(i in nameMap) && !pendingNames.current.has(i));
    if (want.length && caps.user) {
      want.forEach((i) => pendingNames.current.add(i));
      caps.user.profiles(want).then((ps: any) => {
        setNameMap((m: any) => { const n = { ...m }; for (const i of want) n[i] = ps?.[i]?.name || "Usuário"; return n; });
      }).catch(() => undefined);
    }
    return nameMap;
  }, [caps.user, nameMap]);

  const setComp = (id: string) => { setCompId(id); ls.set("lm.comp", id); };

  const value: Ctx = {
    status, role, meId, isOwner, db: caps.db, assets: caps.assets, downloads: caps.downloads, user: caps.user,
    servicos, svcList, rules, pacientes, pacList, comps, comp, setComp, lancs, rels, config, tipos, pads, escala,
    can, editavel, write, log, toast, toasts, names,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function newCompDoc(id: string) { const r = compRange(id); return { ini: r.ini, fim: r.fim, criadaEm: todayISO() }; }
export const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

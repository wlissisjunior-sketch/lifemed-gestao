import { capsFor, Papel } from "../lib/datasource";
import { LOGO } from "../assets";
import { Field } from "./ui";

const { useEffect, useState, useMemo } = React;
const K = "lifemed.demo.perfil";
const read = () => { try { return JSON.parse(localStorage.getItem(K) || "null"); } catch { return null; } };
export function trocarPerfil() { try { localStorage.removeItem(K); } catch { /* ok */ } window.dispatchEvent(new Event("lm-perfil")); }

const OPC: { p: Papel; t: string; d: string }[] = [
  { p: "admin", t: "Administrador", d: "Tudo: lançamentos, valores, regras dos pacotes, tabelas e fechamento do mês." },
  { p: "operador", t: "Operador", d: "Lança serviços, cadastra pacientes e marca relatórios entregues." },
  { p: "leitor", t: "Leitor", d: "Só consulta e baixa os relatórios." },
];

/** Entrada da demonstração: escolha de perfil (na versão com banco, vira login com e-mail e senha). */
export function DemoGate({ children }: { children: (caps: any) => any }) {
  const [perfil, setPerfil] = useState(read() as null | { p: Papel; nome: string });
  const [nome, setNome] = useState("");
  useEffect(() => { const h = () => setPerfil(read()); window.addEventListener("lm-perfil", h); return () => window.removeEventListener("lm-perfil", h); }, []);
  const caps = useMemo(() => (perfil ? capsFor(perfil.p, perfil.nome) : null), [perfil?.p, perfil?.nome]);
  const entrar = (p: Papel) => { const v = { p, nome: nome.trim() || OPC.find((o) => o.p === p)!.t }; try { localStorage.setItem(K, JSON.stringify(v)); } catch { /* ok */ } setPerfil(v); };
  if (caps) return children(caps);
  return (
    <div className="skel" style={{ alignContent: "center" }}>
      <div className="card stack" style={{ width: "min(460px, 100%)", textAlign: "left", padding: 24 }}>
        <img src={LOGO} alt="LifeMed — Medicina especializada" style={{ width: 118, justifySelf: "center", background: "#fff", borderRadius: 12, padding: 6 }} />
        <div><h1>Sistema de Fechamento</h1><p className="hint">Demonstração com dados de exemplo (pacientes fictícios). O que você lançar fica só neste navegador.</p></div>
        <Field label="Seu nome (opcional)" id="dm-nome"><input id="dm-nome" autoComplete="name" value={nome} onChange={(e: any) => setNome(e.target.value)} /></Field>
        <p className="eyebrow">Entrar como</p>
        <div className="stack" style={{ gap: 8 }}>
          {OPC.map((o) => (
            <button key={o.p} className="btn sec" style={{ justifyContent: "flex-start", textAlign: "left", padding: "10px 14px" }} onClick={() => entrar(o.p)}>
              <span><b>{o.t}</b><br /><span className="hint" style={{ fontWeight: 400 }}>{o.d}</span></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

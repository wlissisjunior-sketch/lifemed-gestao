import { useStore } from "../lib/store";
import { money } from "../lib/format";
import { Banner, PageHead } from "../components/ui";

const { useState, useEffect } = React;
const NOTAS: Record<string, string> = {
  "PROGRAMA DE ASSISTÊNCIA": "",
  "SERVIÇOS E EXAMES EM DOMICÍLIO": "Fono só na 24h c/ VM (obs. 4). Visita de especialista é faturada à parte. Coleta: inclusa nas diárias de ID; cobrada no gerenciamento (obs. 7).",
  "EQUIPAMENTOS - DIÁRIA": "Listados na composição dos pacotes. No gerenciamento, aspirador, oxímetro e concentrador são itens excluídos.",
  "EXTRA - CURATIVO": "Curativos especiais ficam fora da diária, exceto na 24h c/ VM (obs. 8 e 9).",
  "EXTRA - TRANSPORTE": "Transporte da implantação já incluso até 100 km e 2 h (obs. 12): lance só o excedente.",
  "EXTRA - MEDICAMENTOS": "Regra por valor: incluso até o limite por dose do pacote.",
  "EXTRA - DIETA/SUPLEMENTO": "Dietas e suplementos só inclusos na 24h c/ VM.",
};

export default function Pacotes() {
  const { svcList, rules, can, db, write, log } = useStore();
  const admin = can("admin");
  const pkgs = svcList.filter((s) => s.pacote);
  const [pid, setPid] = useState(pkgs[0]?.id || "");
  const pkg = pkgs.find((p) => p.id === pid) || pkgs[0];
  const [itens, setItens] = useState({} as Record<string, string>);
  const [lim, setLim] = useState("");
  const [sujo, setSujo] = useState(false);
  useEffect(() => { if (pkg) { setItens({ ...(rules[pkg.id] || {}) }); setLim(pkg.medLimit == null ? "" : String(pkg.medLimit).replace(".", ",")); setSujo(false); } }, [pkg?.id, rules, pkg?.medLimit]);
  if (!pkg) return <><PageHead title="Pacotes e inclusos" /><div className="card">Nenhum pacote cadastrado.</div></>;
  const limNum = lim.trim() === "" ? null : Number(lim.replace(",", "."));
  const itensSvc = svcList.filter((s) => !s.pacote && s.ativo);
  const cats = [...new Set(itensSvc.map((s) => s.categoria))];
  const nInc = itensSvc.filter((s) => (s.medicamento ? limNum != null && s.valor <= limNum : !!itens[s.id])).length;

  const salvar = async () => {
    if (limNum != null && (isNaN(limNum) || limNum < 0)) return;
    const clean: Record<string, string> = {}; for (const [k, v] of Object.entries(itens)) if (v) clean[k] = v;
    const ok1 = await write(() => db.doc(`regras/${pkg.id}`).set({ itens: clean }));
    const ok2 = ok1 && await write(() => db.doc(`servicos/${pkg.id}`).update({ medLimit: limNum }), `Regras de ${pkg.nome} salvas.`);
    if (ok2) { log("editar regras do pacote", pkg.nome, `${Object.keys(clean).length} serviços inclusos; medicamento até ${limNum == null ? "—" : money(limNum)}`); setSujo(false); }
  };

  return (
    <>
      <PageHead title="Pacotes e inclusos">
        O que cada pacote já contempla, conforme o Diário Oficial da Bahia de 15/04/2026. O que estiver marcado aqui não é cobrado à parte quando o paciente está no pacote.
      </PageHead>
      {!admin && <div style={{ marginBottom: 12 }}><Banner kind="info">Somente administradores alteram as regras.</Banner></div>}
      <div className="card stack">
        <div className="grid2" style={{ alignItems: "end" }}>
          <div className="field"><label htmlFor="pk-sel">Pacote</label>
            <select id="pk-sel" value={pkg.id} onChange={(e: any) => setPid(e.target.value)}>{pkgs.map((p) => <option key={p.id} value={p.id}>{p.nome} — {money(p.valor)}/diária</option>)}</select></div>
          <div className="field"><label htmlFor="pk-lim">Medicamento incluso até (R$ por dose)</label>
            <input id="pk-lim" inputMode="decimal" disabled={!admin} value={lim} onChange={(e: any) => { setLim(e.target.value); setSujo(true); }} /></div>
        </div>
        <p className="hint">{nInc} serviço(s) incluso(s) neste pacote. “Até 1 por dia” limita a cobertura a uma unidade por dia de pacote; “Incluso” cobre a quantidade toda.</p>
      </div>
      <div className="card flush" style={{ marginTop: 14 }}>
        <div className="tbl-wrap" style={{ maxHeight: "none" }}><table className="tbl">
          <thead><tr><th>Serviço</th><th style={{ width: 170 }}>Neste pacote</th></tr></thead>
          <tbody>
            {cats.map((c) => [
              <tr className="group" key={"g" + c}><td colSpan={2}>{c}{NOTAS[c] && <div className="hint" style={{ fontWeight: 400, letterSpacing: 0 }}>{NOTAS[c]}</div>}</td></tr>,
              ...itensSvc.filter((s) => s.categoria === c).map((s) => {
                if (s.medicamento) {
                  const inc = limNum != null && s.valor <= limNum;
                  return <tr key={s.id}><td>{s.nome} <span className="hint">· {money(s.valor)} por dose</span></td><td><span className={`pill ${inc ? "ok" : ""}`}>{inc ? "Incluso (pelo valor)" : "Cobrar"}</span></td></tr>;
                }
                const v = itens[s.id] || "";
                return (
                  <tr key={s.id}><td>{s.nome}</td><td>
                    <select className="inp" style={{ minHeight: 34, padding: "5px 8px" }} disabled={!admin} value={v} aria-label={`${s.nome} em ${pkg.nome}`}
                      onChange={(e: any) => { setItens({ ...itens, [s.id]: e.target.value }); setSujo(true); }}>
                      <option value="">Cobrar</option><option value="total">Incluso</option><option value="dias">Até 1 por dia</option>
                    </select></td></tr>
                );
              }),
            ])}
          </tbody>
        </table></div>
      </div>
      {admin && <div className="row" style={{ marginTop: 14 }}><button className="btn" disabled={!sujo} onClick={salvar}>Salvar regras de {pkg.nome}</button>{sujo && <span className="hint">Há alterações não salvas.</span>}</div>}
    </>
  );
}

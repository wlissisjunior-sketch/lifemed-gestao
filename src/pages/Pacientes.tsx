import { useStore, uid } from "../lib/store";
import { Paciente } from "../lib/views";
import { dateBR, norm } from "../lib/format";
import { Banner, Empty, Field, Modal, PageHead, useNav } from "../components/ui";

const { useState } = React;
const NOVO = { nome: "", cns: "", municipio: "", admissao: "", ativo: true };

export default function Pacientes() {
  const { pacList, can, db, write, log } = useStore();
  const { go } = useNav();
  const [busca, setBusca] = useState("");
  const [so, setSo] = useState("ativos");
  const [ed, setEd] = useState(null as any);
  const [erro, setErro] = useState("");
  const vis = pacList.filter((p) => (so === "todos" || (so === "ativos" ? p.ativo : !p.ativo)) && (norm(p.nome).includes(norm(busca)) || (p.cns || "").includes(busca)));

  const salvar = async (e: any) => {
    e.preventDefault(); setErro("");
    const nome = ed.nome.replace(/\s+/g, " ").trim().toUpperCase();
    if (nome.length < 3) return setErro("Informe o nome completo.");
    if (pacList.some((p) => p.nome === nome && p.id !== ed.id)) return setErro("Já existe um paciente com este nome.");
    const cns = ed.cns.replace(/\D/g, "");
    if (cns && cns.length !== 15) return setErro("O CNS tem 15 dígitos. Confira o número ou deixe em branco.");
    const body = { nome, cns, municipio: ed.municipio.trim().toUpperCase(), admissao: ed.admissao || "", ativo: !!ed.ativo };
    const id = ed.id || uid("p");
    if (await write(() => db.doc(`pacientes/${id}`).set(body), ed.id ? "Paciente atualizado." : "Paciente cadastrado.")) {
      log(ed.id ? "editar paciente" : "cadastrar paciente", nome); setEd(null);
    }
  };

  return (
    <>
      <PageHead title="Pacientes" actions={can("operador") && <button className="btn" onClick={() => { setEd({ ...NOVO }); setErro(""); }}>+ Novo paciente</button>}>
        Somente pacientes ativos aparecem no checklist e no controle de relatórios. Município e admissão saem no faturamento por paciente.
      </PageHead>
      <div className="card flush">
        <div className="row" style={{ padding: 12 }}>
          <input className="inp grow" placeholder="Buscar por nome ou CNS" aria-label="Buscar paciente" value={busca} onChange={(e: any) => setBusca(e.target.value)} />
          <div className="seg">{[["ativos", "Ativos"], ["inativos", "Inativos"], ["todos", "Todos"]].map(([k, l]) => <button key={k} className={so === k ? "on" : ""} onClick={() => setSo(k)}>{l}</button>)}</div>
        </div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Paciente</th><th>CNS</th><th>Município</th><th>Admissão</th><th>Situação</th><th /></tr></thead>
          <tbody>
            {vis.map((p: Paciente) => (
              <tr key={p.id} className={p.ativo ? "" : "dim"}>
                <td><b>{p.nome}</b></td><td>{p.cns || "—"}</td><td>{p.municipio || "—"}</td><td>{dateBR(p.admissao)}</td>
                <td><span className={`pill ${p.ativo ? "ok" : ""}`}>{p.ativo ? "Ativo" : "Inativo"}</span></td>
                <td className="num"><div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                  <button className="btn sm sec" onClick={() => go("checklist", p.id)}>Serviços</button>
                  {can("operador") && <button className="btn sm sec" onClick={() => { setEd({ ...NOVO, ...p }); setErro(""); }}>Editar</button>}</div></td>
              </tr>
            ))}
            {vis.length === 0 && <tr><td colSpan={6}><Empty>Nenhum paciente nesta lista.</Empty></td></tr>}
          </tbody>
        </table></div>
      </div>
      {ed && (
        <Modal title={ed.id ? "Editar paciente" : "Novo paciente"} onClose={() => setEd(null)}>
          <form className="stack" onSubmit={salvar}>
            <Field label="Nome completo" id="pa-nome"><input id="pa-nome" required value={ed.nome} onChange={(e: any) => setEd({ ...ed, nome: e.target.value })} /></Field>
            <div className="grid2">
              <Field label="CNS (cartão SUS)" id="pa-cns" hint="15 dígitos"><input id="pa-cns" inputMode="numeric" value={ed.cns} onChange={(e: any) => setEd({ ...ed, cns: e.target.value })} /></Field>
              <Field label="Município" id="pa-mun"><input id="pa-mun" value={ed.municipio} onChange={(e: any) => setEd({ ...ed, municipio: e.target.value })} /></Field>
            </div>
            <Field label="Data da admissão" id="pa-adm"><input id="pa-adm" type="date" value={ed.admissao} onChange={(e: any) => setEd({ ...ed, admissao: e.target.value })} /></Field>
            <label className="check"><input type="checkbox" checked={ed.ativo} onChange={(e: any) => setEd({ ...ed, ativo: e.target.checked })} />Paciente ativo</label>
            {erro && <Banner kind="err">{erro}</Banner>}
            <div className="row"><button className="btn">Salvar paciente</button><button type="button" className="btn sec" onClick={() => setEd(null)}>Cancelar</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

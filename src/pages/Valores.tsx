import { useStore } from "../lib/store";
import { Svc } from "../lib/engine";
import { money, norm } from "../lib/format";
import { Banner, Field, Modal, PageHead } from "../components/ui";

const { useState } = React;

export default function Valores() {
  const { svcList, can, db, write, log } = useStore();
  const admin = can("admin");
  const [busca, setBusca] = useState("");
  const [ed, setEd] = useState(null as any);
  const [erro, setErro] = useState("");
  const cats = [...new Set(svcList.map((s) => s.categoria))];
  const vis = svcList.filter((s) => norm(s.nome + " " + s.descricao).includes(norm(busca)));

  const salvar = async (e: any) => {
    e.preventDefault(); setErro("");
    const valor = Number(String(ed.valor).replace(/\./g, String(ed.valor).includes(",") ? "" : ".").replace(",", "."));
    if (!ed.nome.trim() || !ed.categoria.trim()) return setErro("Preencha categoria e nome.");
    if (isNaN(valor) || valor < 0) return setErro("Informe um valor válido, por exemplo 90,21.");
    const isNew = !ed.id;
    const ordem = isNew ? Math.max(0, ...svcList.map((s) => s.ordem)) + 1 : ed.ordem;
    const id = isNew ? `s${String(ordem).padStart(2, "0")}` : ed.id;
    const body: any = { ordem, categoria: ed.categoria.trim().toUpperCase(), nome: ed.nome.trim(), descricao: (ed.descricao || "").trim().toUpperCase(), valor,
      pacote: !!ed.pacote, medicamento: !!ed.medicamento, medLimit: ed.pacote ? (ed.medLimit ?? null) : null, ativo: !!ed.ativo };
    if (await write(() => db.doc(`servicos/${id}`).set(body), isNew ? "Serviço criado." : "Serviço atualizado.")) {
      log(isNew ? "criar serviço" : "editar serviço", body.nome, isNew ? money(valor) : (ed._valorAntes !== valor ? `${money(ed._valorAntes)} → ${money(valor)}` : ""));
      setEd(null);
    }
  };

  return (
    <>
      <PageHead title="Serviços e valores" actions={admin && <button className="btn" onClick={() => { setEd({ categoria: cats[cats.length - 1] || "", nome: "", descricao: "", valor: "", ativo: true }); setErro(""); }}>+ Novo serviço</button>}>
        Valor unitário de cada pacote, serviço e medicamento faturável. Cada lançamento guarda o valor do dia em que foi feito: mudar um valor aqui vale para os próximos lançamentos.
      </PageHead>
      {!admin && <div style={{ marginBottom: 12 }}><Banner kind="info">Somente administradores alteram valores.</Banner></div>}
      <div className="card flush">
        <div style={{ padding: 12 }}><input className="inp" placeholder="Buscar serviço" aria-label="Buscar serviço" value={busca} onChange={(e: any) => setBusca(e.target.value)} /></div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Serviço</th><th className="only-desktop">Descrição nos relatórios</th><th className="num">Valor</th>{admin && <th />}</tr></thead>
          <tbody>
            {cats.map((c) => {
              const it = vis.filter((s) => s.categoria === c);
              if (!it.length) return null;
              return [<tr className="group" key={"g" + c}><td colSpan={admin ? 4 : 3}>{c}</td></tr>,
                ...it.map((s: Svc) => (
                  <tr key={s.id} className={s.ativo ? "" : "dim"}>
                    <td><b>{s.nome}</b> {s.pacote && <span className="pill info">pacote</span>} {!s.ativo && <span className="pill">inativo</span>}
                      {s.pacote && s.medLimit != null && <div className="hint">inclui medicamento até {money(s.medLimit)} por dose</div>}</td>
                    <td className="small only-desktop">{s.descricao}</td>
                    <td className="num"><b>{money(s.valor)}</b></td>
                    {admin && <td className="num"><button className="btn sm sec" onClick={() => { setEd({ ...s, valor: String(s.valor).replace(".", ","), _valorAntes: s.valor }); setErro(""); }}>Editar</button></td>}
                  </tr>
                ))];
            })}
          </tbody>
        </table></div>
      </div>
      {ed && (
        <Modal title={ed.id ? "Editar serviço" : "Novo serviço"} onClose={() => setEd(null)}>
          <form className="stack" onSubmit={salvar}>
            <Field label="Categoria" id="sv-cat"><input id="sv-cat" list="sv-cats" required value={ed.categoria} onChange={(e: any) => setEd({ ...ed, categoria: e.target.value })} /></Field>
            <datalist id="sv-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            <Field label="Nome curto (aparece no checklist)" id="sv-nome"><input id="sv-nome" required value={ed.nome} onChange={(e: any) => setEd({ ...ed, nome: e.target.value })} /></Field>
            <Field label="Descrição oficial (sai nos relatórios)" id="sv-desc"><input id="sv-desc" value={ed.descricao} onChange={(e: any) => setEd({ ...ed, descricao: e.target.value })} /></Field>
            <Field label="Valor unitário (R$)" id="sv-val"><input id="sv-val" required inputMode="decimal" value={ed.valor} onChange={(e: any) => setEd({ ...ed, valor: e.target.value })} /></Field>
            {!ed.pacote && <label className="check"><input type="checkbox" checked={!!ed.medicamento} onChange={(e: any) => setEd({ ...ed, medicamento: e.target.checked })} /><span>É medicamento <span className="hint">(incluso no pacote só até o limite por dose)</span></span></label>}
            <label className="check"><input type="checkbox" checked={!!ed.ativo} onChange={(e: any) => setEd({ ...ed, ativo: e.target.checked })} />Ativo (aparece para lançamento)</label>
            {erro && <Banner kind="err">{erro}</Banner>}
            <div className="row"><button className="btn">Salvar serviço</button><button type="button" className="btn sec" onClick={() => setEd(null)}>Cancelar</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

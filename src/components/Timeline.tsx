import { LineResult, days } from "../lib/engine";
import { qty } from "../lib/format";

/** Faixa do mês: períodos de pacote e onde cada serviço cai — mostra a cobertura por dia. */
export default function Timeline({ ini, fim, res }: { ini: string; fim: string; res: LineResult[] }) {
  const n = days(ini, fim);
  const cols = { gridTemplateColumns: `repeat(${n}, 1fr)` };
  const place = (a: string, b: string) => ({ gridColumn: `${days(ini, a < ini ? ini : a)} / ${days(ini, b > fim ? fim : b) + 1}` });
  const [y, m] = ini.split("-").map(Number);
  const we = (d: number) => [0, 6].includes(new Date(Date.UTC(y, m - 1, d)).getUTCDay());
  const pk = res.filter((r) => r.svc.pacote && r.line.ini && r.line.fim);
  const dated = res.filter((r) => !r.svc.pacote && r.line.ini && r.line.fim);
  const undated = res.filter((r) => !(r.line.ini && r.line.fim));
  if (!res.length) return null;
  return (
    <div className="tl" role="img" aria-label="Faixa do mês com pacotes e serviços">
      <div className="tl-inner">
        <div className="tl-row"><span className="l muted">Dia</span>
          <div className="tl-days" style={cols}>{Array.from({ length: n }, (_, i) => <span key={i} className={we(i + 1) ? "we" : ""}>{i + 1}</span>)}</div>
        </div>
        {pk.map((p) => (
          <div className="tl-row" key={p.line.id}><span className="l" title={p.svc.nome}><b>{p.svc.nome}</b></span>
            <div className="tl-track" style={cols}><div className="tl-bar pkg" style={place(p.line.ini!, p.line.fim!)}>{qty(p.line.qtd)} diárias</div></div>
          </div>
        ))}
        {dated.map((r) => {
          const k = r.inclusa === 0 ? "bill" : r.cobrada === 0 ? "cov" : "mix";
          return (
            <div className="tl-row" key={r.line.id}><span className="l" title={r.svc.nome}>{r.svc.nome}</span>
              <div className="tl-track" style={cols}>
                <div className={`tl-bar ${k}`} style={place(r.line.ini!, r.line.fim!)} title={`Informado ${qty(r.line.qtd)} · incluso ${qty(r.inclusa)} · cobrado ${qty(r.cobrada)}`}>
                  {k === "bill" ? qty(r.cobrada) : k === "cov" ? "incluso" : `${qty(r.cobrada)} cobr.`}
                </div>
              </div>
            </div>
          );
        })}
        <div className="legend">
          <span><i style={{ background: "var(--brand)" }} />Pacote</span>
          <span><i style={{ background: "var(--green)" }} />Cobrado</span>
          <span><i style={{ background: "var(--covered)" }} />Incluso no pacote</span>
          <span><i style={{ background: "repeating-linear-gradient(135deg,var(--green) 0 4px,var(--covered) 4px 8px)" }} />Parte cobrada, parte inclusa</span>
        </div>
        {undated.length > 0 && <p className="hint" style={{ marginTop: 6 }}>Sem datas (fora da faixa): {undated.map((r) => r.svc.nome).join(", ")}.</p>}
      </div>
    </div>
  );
}

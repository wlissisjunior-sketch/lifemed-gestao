import Breadcrumbs from "../components/layout/Breadcrumbs";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { professionals } from "../data/mockData";

export default function Professionals() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: "Profissionais" }]} />
      <div>
        <h1 className="text-2xl font-semibold">Profissionais</h1>
        <p className="text-sm text-slate-500 mt-1">Equipe cadastrada com acesso ao sistema.</p>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Registro</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {professionals.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-sage-50/30">
                  <td className="px-5 py-3.5 font-medium text-ink">{p.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{p.role}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell font-mono text-xs text-slate-500">
                    {p.registro}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="progress">{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

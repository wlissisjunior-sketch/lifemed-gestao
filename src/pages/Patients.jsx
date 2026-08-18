import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import Badge from "../components/Badge";
import Card from "../components/Card";
import { patients, institutionName, statusVariant } from "../data/mockData";

const STATUS_OPTIONS = [
  "Todos",
  "Novo",
  "Em avaliação",
  "Aguardando orçamento",
  "Aguardando aprovação",
  "Atendimento",
  "Prorrogação",
  "Encerrado",
];

const PAGE_SIZE = 6;

export default function Patients() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.cpf.includes(query) ||
        p.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "Todos" || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateQuery(v) {
    setQuery(v);
    setPage(1);
  }
  function updateStatus(v) {
    setStatus(v);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: "Pacientes" }]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} paciente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/pacientes/novo"
          className="inline-flex items-center gap-1.5 bg-sage hover:bg-sage-600 text-white text-sm font-medium rounded-md px-4 py-2.5 transition-colors"
        >
          <Plus size={16} /> Novo paciente
        </Link>
      </div>

      <Card padded={false}>
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder="Buscar por nome, CPF ou código…"
              className="w-full bg-slate-100 rounded-md pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-100 focus:bg-white border border-transparent focus:border-sage transition-all"
            />
          </div>
          <div className="relative sm:w-56">
            <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={status}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full appearance-none bg-slate-100 rounded-md pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-100 focus:bg-white border border-transparent focus:border-sage transition-all"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "Todos" ? "Todos os status" : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Paciente</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">CPF</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Instituição</th>
                <th className="px-5 py-3 font-medium hidden xl:table-cell">Entrada</th>
                <th className="px-5 py-3 font-medium">Etapa atual</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Responsável</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-sage-50/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link to={`/pacientes/${p.id}`} className="block">
                      <p className="font-medium text-ink hover:text-sage transition-colors">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{p.id}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell font-mono text-xs text-slate-500">
                    {p.cpf}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-600">
                    {institutionName(p.institutionId)}
                  </td>
                  <td className="px-5 py-3.5 hidden xl:table-cell font-mono text-xs text-slate-500">
                    {formatDate(p.entryDate)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{p.stage}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-600">
                    {p.responsible}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell font-mono text-xs text-slate-400">
                    {formatDate(p.lastUpdate)}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhum paciente encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

import { Building2 } from "lucide-react";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import Card from "../components/Card";
import { institutions, patients } from "../data/mockData";

export default function Institutions() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: "Instituições" }]} />
      <div>
        <h1 className="text-2xl font-semibold">Instituições</h1>
        <p className="text-sm text-slate-500 mt-1">
          Convênios e órgãos parceiros vinculados aos atendimentos.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {institutions.map((inst) => {
          const count = patients.filter((p) => p.institutionId === inst.id).length;
          return (
            <Card key={inst.id}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-sage-50 text-sage-700 flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="font-medium text-ink">{inst.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {count} paciente{count !== 1 ? "s" : ""} vinculado{count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

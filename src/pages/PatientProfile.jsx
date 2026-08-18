import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Users2,
  FileText,
  Image as ImageIcon,
  Plus,
  Clock,
} from "lucide-react";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import Badge from "../components/Badge";
import Card from "../components/Card";
import StageRail from "../components/StageRail";
import {
  patients,
  institutionName,
  statusVariant,
  historyFor,
  visitsFor,
  budgetsFor,
  addendumsFor,
  documentsFor,
  materialsFor,
} from "../data/mockData";

const TABS = [
  "Resumo",
  "Dados cadastrais",
  "Avaliações",
  "Orçamentos",
  "Atendimentos",
  "Visitas",
  "Prorrogações",
  "Aditivos",
  "Documentos",
  "Histórico",
];

export default function PatientProfile() {
  const { id } = useParams();
  const patient = patients.find((p) => p.id === id);
  const [tab, setTab] = useState("Resumo");

  if (!patient) return <Navigate to="/pacientes" replace />;

  const age = calcAge(patient.birthDate);

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "Dashboard", to: "/" },
          { label: "Pacientes", to: "/pacientes" },
          { label: patient.name },
        ]}
      />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold">{patient.name}</h1>
              <Badge variant={statusVariant(patient.status)}>{patient.status}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              {patient.id} · {age} anos · {institutionName(patient.institutionId)}
            </p>
          </div>
          <div className="text-sm text-slate-500 sm:text-right shrink-0">
            <p>
              Entrada: <span className="font-mono text-slate-700">{formatDate(patient.entryDate)}</span>
            </p>
            <p>
              Responsável: <span className="text-slate-700">{patient.responsible}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <StageRail current={patient.stage} compact />
        </div>
      </Card>

      <Card padded={false}>
        <div className="flex overflow-x-auto scrollbar-thin border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? "border-sage text-sage font-medium"
                  : "border-transparent text-slate-500 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === "Resumo" && <ResumoTab patient={patient} />}
          {tab === "Dados cadastrais" && <DadosTab patient={patient} />}
          {tab === "Avaliações" && <AvaliacoesTab />}
          {tab === "Orçamentos" && <OrcamentosTab />}
          {tab === "Atendimentos" && <AtendimentosTab />}
          {tab === "Visitas" && <VisitasTab />}
          {tab === "Prorrogações" && <ProrrogacoesTab patient={patient} />}
          {tab === "Aditivos" && <AditivosTab />}
          {tab === "Documentos" && <DocumentosTab />}
          {tab === "Histórico" && <HistoricoTab id={patient.id} />}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}

function ResumoTab({ patient }) {
  const materials = materialsFor();
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoRow icon={Phone} label="Telefone" value={patient.phone} />
          <InfoRow icon={Mail} label="E-mail" value={patient.email} />
          <InfoRow
            icon={MapPin}
            label="Endereço"
            value={`${patient.address.street}, ${patient.address.number} — ${patient.address.district}, ${patient.address.city}/${patient.address.state}`}
          />
          <InfoRow
            icon={Users2}
            label="Responsável familiar"
            value={`${patient.guardian.name} (${patient.guardian.relation}) · ${patient.guardian.phone}`}
          />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Tipo de atendimento</p>
          <Badge variant="progress">{patient.attendanceType}</Badge>
        </div>
      </div>

      <div className="bg-slate-50 rounded-card p-4 border border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-3">
          Materiais destinados a este atendimento
        </p>
        <ul className="space-y-2">
          {materials.map((m) => (
            <li key={m.name} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{m.name}</span>
              <span className="font-mono text-xs text-slate-400">
                {m.qty} {m.unit}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DadosTab({ patient }) {
  const rows = [
    ["Nome completo", patient.name],
    ["CPF", patient.cpf],
    ["Data de nascimento", formatDate(patient.birthDate)],
    ["Sexo", patient.sex],
    ["Telefone", patient.phone],
    ["E-mail", patient.email],
    ["CEP", patient.address.cep],
    ["Logradouro", `${patient.address.street}, ${patient.address.number} ${patient.address.complement}`],
    ["Bairro", patient.address.district],
    ["Cidade/UF", `${patient.address.city}/${patient.address.state}`],
    ["Responsável", `${patient.guardian.name} (${patient.guardian.relation})`],
    ["Telefone do responsável", patient.guardian.phone],
  ];
  return (
    <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between border-b border-slate-100 pb-2">
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="text-sm text-ink font-medium text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyState({ text, cta }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
      <p className="text-sm text-slate-400">{text}</p>
      {cta && (
        <button className="inline-flex items-center gap-1.5 text-sage text-sm font-medium hover:text-sage-700">
          <Plus size={15} /> {cta}
        </button>
      )}
    </div>
  );
}

function AvaliacoesTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink">Avaliação social</p>
          <p className="text-xs text-slate-400">Realizada em 08/08/2026 por Marcos Vinícius Teles</p>
        </div>
        <Badge variant="progress">Aprovado</Badge>
      </div>
      <div className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink">Avaliação clínica</p>
          <p className="text-xs text-slate-400">Realizada em 17/08/2026 por Ana Beatriz Lima</p>
        </div>
        <Badge variant="warning">Pendente</Badge>
      </div>
      <button className="inline-flex items-center gap-1.5 text-sage text-sm font-medium hover:text-sage-700 pt-1">
        <Plus size={15} /> Nova avaliação
      </button>
    </div>
  );
}

function OrcamentosTab() {
  const budgets = budgetsFor();
  return (
    <div className="space-y-5">
      {budgets.map((b) => (
        <div key={b.id} className="border border-slate-200 rounded-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
            <div>
              <p className="text-sm font-medium text-ink font-mono">{b.id}</p>
              <p className="text-xs text-slate-400">Criado em {formatDate(b.date)}</p>
            </div>
            <Badge variant="warning">{b.status}</Badge>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Categoria</th>
                <th className="px-4 py-2 font-medium text-right">Qtd.</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {b.items.map((it) => (
                <tr key={it.desc} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 text-slate-700">{it.desc}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-slate-500">{it.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{it.qty}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                    {formatCurrency(it.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end px-4 py-3 bg-slate-50 text-sm">
            <span className="text-slate-500 mr-2">Total:</span>
            <span className="font-mono font-semibold text-ink">{formatCurrency(b.total)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AtendimentosTab() {
  return (
    <EmptyState text="Nenhum relatório de atendimento registrado ainda." cta="Registrar atendimento" />
  );
}

function VisitasTab() {
  const visits = visitsFor();
  return (
    <div className="space-y-2">
      {visits.map((v, i) => (
        <div key={i} className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-sage-50 text-sage-700 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {v.type} · {formatDate(v.date)} às {v.time}
              </p>
              <p className="text-xs text-slate-400">{v.professional}</p>
            </div>
          </div>
          <Badge variant={v.status === "Realizada" ? "progress" : "neutral"}>{v.status}</Badge>
        </div>
      ))}
      <button className="inline-flex items-center gap-1.5 text-sage text-sm font-medium hover:text-sage-700 pt-1">
        <Plus size={15} /> Agendar nova visita
      </button>
    </div>
  );
}

function ProrrogacoesTab({ patient }) {
  if (patient.stage !== "Prorrogação") {
    return <EmptyState text="Nenhuma prorrogação em andamento para este paciente." />;
  }
  return (
    <div className="border border-slate-200 rounded-card p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-400">Atendimento atual</p>
          <p className="text-slate-700">{patient.attendanceType}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Data de término do período atual</p>
          <p className="text-slate-700 font-mono">25/08/2026</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-400">Justificativa</p>
          <p className="text-slate-700">
            Manutenção do quadro clínico com necessidade de continuidade dos cuidados de enfermagem.
          </p>
        </div>
      </div>
      <Badge variant="warning">Em elaboração</Badge>
    </div>
  );
}

function AditivosTab() {
  const addendums = addendumsFor();
  return (
    <div className="space-y-3">
      {addendums.map((a) => (
        <div key={a.id} className="border border-slate-200 rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink font-mono">{a.id}</p>
            <span className="text-xs text-slate-400">Vinculado a {a.originalBudget}</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">{a.reason}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-mono">
            <span className="text-slate-400">
              Original: <span className="text-slate-600">{formatCurrency(a.originalValue)}</span>
            </span>
            <span className="text-slate-400">
              Aditivo: <span className="text-amber">+{formatCurrency(a.additionalValue)}</span>
            </span>
            <span className="text-slate-400">
              Total atualizado:{" "}
              <span className="text-ink font-semibold">
                {formatCurrency(a.originalValue + a.additionalValue)}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentosTab() {
  const docs = documentsFor();
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {docs.map((d) => (
        <div key={d.name} className="flex items-center gap-3 border border-slate-200 rounded-md px-3.5 py-3">
          <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            {d.name.endsWith(".zip") ? <ImageIcon size={16} /> : <FileText size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-ink truncate">{d.name}</p>
            <p className="text-xs text-slate-400">
              {d.type} · {formatDate(d.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoricoTab({ id }) {
  const events = historyFor(id);
  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-6">
      {events.map((e, i) => (
        <li key={i} className="ml-5">
          <span className="absolute -left-[7px] h-3.5 w-3.5 rounded-full bg-sage ring-4 ring-sage-50" />
          <p className="text-sm font-medium text-ink">{e.label}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {formatDate(e.date)} · {e.by}
          </p>
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatCurrency(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcAge(iso) {
  const birth = new Date(iso);
  const now = new Date("2026-08-18");
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

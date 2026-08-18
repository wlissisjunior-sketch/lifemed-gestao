import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  ClipboardList,
  Receipt,
  Stethoscope,
  TimerReset,
  CalendarCheck2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Card, { KpiCard } from "../components/Card";
import StageRail from "../components/StageRail";
import {
  patients,
  pendencias,
  attendancesByMonth,
  attendancesByProfessional,
  patientsByStage,
} from "../data/mockData";

const PIE_COLORS = ["#1F7A5C", "#3E9C7E", "#7FBFA8", "#B9781F"];

const SEVERITY = {
  high: "bg-coral-50 text-coral border-coral-50",
  medium: "bg-amber-50 text-amber border-amber-50",
  low: "bg-slate-100 text-slate-600 border-slate-100",
};

export default function Dashboard() {
  const kpis = [
    { label: "Pacientes ativos", value: patients.filter((p) => p.stage !== "Encerrado").length, icon: Users, tone: "sage" },
    { label: "Novos pacientes (mês)", value: patients.filter((p) => p.status === "Novo").length, icon: UserPlus, tone: "ink" },
    { label: "Avaliações pendentes", value: 4, icon: ClipboardList, tone: "amber" },
    { label: "Orçamentos pendentes", value: patients.filter((p) => p.stage === "Orçamento" || p.stage === "Aprovação").length, icon: Receipt, tone: "amber" },
    { label: "Atendimentos em andamento", value: patients.filter((p) => p.stage === "Atendimento").length, icon: Stethoscope, tone: "sage" },
    { label: "Prorrogações próximas", value: patients.filter((p) => p.stage === "Prorrogação").length, icon: TimerReset, tone: "coral" },
    { label: "Visitas previstas hoje", value: 3, icon: CalendarCheck2, tone: "sage" },
    { label: "Pendências críticas", value: pendencias.filter((p) => p.severity === "high").length, icon: AlertTriangle, tone: "coral" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Visão geral da operação</h1>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhamento em tempo real do ciclo de atendimento domiciliar.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <Card title="Pacientes por etapa do processo">
        <StageRail current="Orçamento" />
        <div className="mt-5 pt-5 border-t border-slate-100">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={patientsByStage} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="#EEEFEB" />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 10, fill: "#64707F" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64707F" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E7E2" }}
              />
              <Bar dataKey="total" fill="#1F7A5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card title="Atendimentos por mês" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendancesByMonth} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="#EEEFEB" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64707F" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64707F" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E7E2" }}
              />
              <Line
                type="monotone"
                dataKey="atendimentos"
                stroke="#1F7A5C"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#1F7A5C" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribuição por profissional" className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={attendancesByProfessional}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {attendancesByProfessional.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-xs">
              {attendancesByProfessional.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-600">{p.name}</span>
                  <span className="font-mono text-slate-400 ml-auto">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Pendências"
        action={
          <Link
            to="/pacientes"
            className="text-xs font-medium text-sage hover:text-sage-700 flex items-center gap-1"
          >
            Ver todas as pendências <ArrowRight size={13} />
          </Link>
        }
      >
        <div className="space-y-2">
          {pendencias.map((p) => (
            <Link
              to={`/pacientes/${p.patientId}`}
              key={p.id}
              className={`flex items-center gap-3 rounded-md border px-3.5 py-2.5 hover:shadow-sm transition-shadow ${SEVERITY[p.severity]}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{p.patient}</p>
                <p className="text-xs text-slate-500 truncate">{p.label}</p>
              </div>
              <span className="text-xs font-mono font-medium shrink-0">{p.due}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

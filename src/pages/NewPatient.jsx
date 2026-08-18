import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Breadcrumbs from "../components/layout/Breadcrumbs";
import Card from "../components/Card";
import { institutions } from "../data/mockData";

function Field({ label, required, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-coral">*</span>}
      </span>
      <input
        {...props}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 transition-all"
      />
    </label>
  );
}

function Select({ label, required, options, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-coral">*</span>}
      </span>
      <select
        {...props}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 transition-all"
      >
        <option value="">Selecione…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({ step, title, children }) {
  return (
    <div className="pb-7 mb-7 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="h-6 w-6 rounded-full bg-sage-50 text-sage-700 text-[11px] font-mono flex items-center justify-center">
          {step}
        </span>
        <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function NewPatient() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => navigate("/pacientes"), 1400);
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "Dashboard", to: "/" },
          { label: "Pacientes", to: "/pacientes" },
          { label: "Novo paciente" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-semibold">Novo paciente</h1>
        <p className="text-sm text-slate-500 mt-1">
          Preencha os dados para iniciar o ciclo de atendimento.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-sage-50 text-sage-700 text-sm rounded-md px-4 py-3">
          <CheckCircle2 size={17} /> Paciente cadastrado com sucesso. Redirecionando…
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="pt-1">
            <Section step="01" title="Dados pessoais">
              <Field label="Nome completo" required placeholder="Ex.: João da Silva Andrade" className="sm:col-span-2" />
              <Field label="CPF" required placeholder="000.000.000-00" />
              <Field label="Data de nascimento" required type="date" />
              <Select label="Sexo" required options={["Masculino", "Feminino"]} />
              <Field label="Telefone" required placeholder="(00) 00000-0000" />
              <Field label="E-mail" type="email" placeholder="nome@exemplo.com" />
            </Section>

            <Section step="02" title="Endereço">
              <Field label="CEP" required placeholder="00000-000" />
              <Field label="Logradouro" required className="sm:col-span-2" />
              <Field label="Número" required />
              <Field label="Complemento" />
              <Field label="Bairro" required />
              <Field label="Cidade" required />
              <Field label="Estado" required placeholder="BA" />
            </Section>

            <Section step="03" title="Contato do responsável">
              <Field label="Nome do responsável" required />
              <Field label="Telefone" required placeholder="(00) 00000-0000" />
              <Field label="Grau de parentesco" required placeholder="Ex.: Filha, Esposo…" />
            </Section>

            <Section step="04" title="Atendimento">
              <Select
                label="Instituição"
                required
                options={institutions.map((i) => i.name)}
              />
              <Field label="Data da solicitação" required type="date" />
              <Select
                label="Tipo de atendimento"
                required
                options={["Enfermagem", "Médico", "Fisioterapia", "Avaliação inicial", "Multiprofissional"]}
              />
              <label className="block sm:col-span-2">
                <span className="block text-xs font-medium text-slate-600 mb-1.5">
                  Observações
                </span>
                <textarea
                  rows={3}
                  placeholder="Informações adicionais relevantes para a avaliação…"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage-100 transition-all resize-none"
                />
              </label>
            </Section>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => navigate("/pacientes")}
            className="text-sm font-medium text-slate-600 hover:text-ink px-4 py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-sage hover:bg-sage-600 text-white text-sm font-medium rounded-md px-5 py-2.5 transition-colors"
          >
            Salvar paciente
          </button>
        </div>
      </form>
    </div>
  );
}

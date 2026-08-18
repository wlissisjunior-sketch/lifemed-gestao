// Dados fictícios para o protótipo do LifeMed Gestão.
// Nenhum dado real de paciente é utilizado. Estrutura pensada para
// mapear 1:1 com as tabelas previstas no Supabase/PostgreSQL
// (patients, institutions, professionals, social_evaluations,
// clinical_evaluations, budgets, visits, extensions, addendums,
// documents, audit_history, notifications).

export const STAGES = [
  "Cadastro",
  "Avaliação Social",
  "Avaliação Clínica",
  "Orçamento",
  "Aprovação",
  "Atendimento",
  "Prorrogação",
  "Encerrado",
];

export const institutions = [
  { id: "inst-1", name: "Convênio Vitalis Saúde" },
  { id: "inst-2", name: "Prefeitura Municipal — Secretaria de Saúde" },
  { id: "inst-3", name: "Convênio Amparo Saúde" },
  { id: "inst-4", name: "Particular" },
];

export const professionals = [
  { id: "prof-1", name: "Ana Beatriz Lima", role: "Enfermeira", registro: "COREN 88213", status: "Ativo" },
  { id: "prof-2", name: "Dr. Rafael Nogueira", role: "Médico", registro: "CRM 45012", status: "Ativo" },
  { id: "prof-3", name: "Juliana Prado", role: "Fisioterapeuta", registro: "CREFITO 33210", status: "Ativo" },
  { id: "prof-4", name: "Marcos Vinícius Teles", role: "Avaliação Social", registro: "CRESS 12099", status: "Ativo" },
  { id: "prof-5", name: "Camila Duarte", role: "ADM", registro: "—", status: "Ativo" },
  { id: "prof-6", name: "Eduardo Ramos", role: "Gestor", registro: "—", status: "Ativo" },
];

const statusBadge = {
  "Novo": "new",
  "Em avaliação": "progress",
  "Aguardando orçamento": "progress",
  "Aguardando aprovação": "warning",
  "Atendimento": "active",
  "Prorrogação": "warning",
  "Encerrado": "closed",
};

export const patients = [
  {
    id: "PAC-1001",
    name: "João da Silva Andrade",
    cpf: "123.456.789-01",
    birthDate: "1952-04-12",
    sex: "Masculino",
    phone: "(75) 99123-4501",
    email: "joao.andrade@exemplo.com",
    institutionId: "inst-1",
    entryDate: "2026-07-02",
    stage: "Avaliação Clínica",
    status: "Em avaliação",
    responsible: "Ana Beatriz Lima",
    lastUpdate: "2026-08-17",
    address: { cep: "44001-000", street: "Rua das Acácias", number: "212", complement: "Casa 2", district: "Centro", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Marta Andrade", phone: "(75) 99123-4502", relation: "Filha" },
    attendanceType: "Enfermagem + Fisioterapia",
  },
  {
    id: "PAC-1002",
    name: "Maria Santos Oliveira",
    cpf: "234.567.890-12",
    birthDate: "1968-11-03",
    sex: "Feminino",
    phone: "(75) 99123-4503",
    email: "maria.oliveira@exemplo.com",
    institutionId: "inst-2",
    entryDate: "2026-06-18",
    stage: "Orçamento",
    status: "Aguardando orçamento",
    responsible: "Camila Duarte",
    lastUpdate: "2026-08-16",
    address: { cep: "44025-100", street: "Av. Presidente Dutra", number: "1450", complement: "Apto 301", district: "Kalilândia", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Pedro Oliveira", phone: "(75) 99123-4504", relation: "Filho" },
    attendanceType: "Médico",
  },
  {
    id: "PAC-1003",
    name: "Carlos Eduardo Souza",
    cpf: "345.678.901-23",
    birthDate: "1945-02-27",
    sex: "Masculino",
    phone: "(75) 99123-4505",
    email: "carlos.souza@exemplo.com",
    institutionId: "inst-1",
    entryDate: "2026-03-10",
    stage: "Prorrogação",
    status: "Prorrogação",
    responsible: "Dr. Rafael Nogueira",
    lastUpdate: "2026-08-15",
    address: { cep: "44052-091", street: "Rua Sergipe", number: "58", complement: "", district: "Tomba", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Renata Souza", phone: "(75) 99123-4506", relation: "Esposa" },
    attendanceType: "Enfermagem",
  },
  {
    id: "PAC-1004",
    name: "Francisca Almeida Costa",
    cpf: "456.789.012-34",
    birthDate: "1959-09-19",
    sex: "Feminino",
    phone: "(75) 99123-4507",
    email: "francisca.costa@exemplo.com",
    institutionId: "inst-3",
    entryDate: "2026-08-01",
    stage: "Cadastro",
    status: "Novo",
    responsible: "Marcos Vinícius Teles",
    lastUpdate: "2026-08-14",
    address: { cep: "44077-030", street: "Rua Barão de Cotegipe", number: "980", complement: "", district: "Capuchinhos", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Luiz Costa", phone: "(75) 99123-4508", relation: "Filho" },
    attendanceType: "Avaliação inicial",
  },
  {
    id: "PAC-1005",
    name: "Antônio Pereira Nunes",
    cpf: "567.890.123-45",
    birthDate: "1971-01-08",
    sex: "Masculino",
    phone: "(75) 99123-4509",
    email: "antonio.nunes@exemplo.com",
    institutionId: "inst-4",
    entryDate: "2026-05-22",
    stage: "Atendimento",
    status: "Atendimento",
    responsible: "Juliana Prado",
    lastUpdate: "2026-08-17",
    address: { cep: "44026-115", street: "Av. Eduardo Fróes da Mota", number: "3200", complement: "Bloco B", district: "Sim", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Sônia Nunes", phone: "(75) 99123-4510", relation: "Esposa" },
    attendanceType: "Fisioterapia",
  },
  {
    id: "PAC-1006",
    name: "Rita de Cássia Ferreira",
    cpf: "678.901.234-56",
    birthDate: "1963-06-30",
    sex: "Feminino",
    phone: "(75) 99123-4511",
    email: "rita.ferreira@exemplo.com",
    institutionId: "inst-2",
    entryDate: "2026-07-28",
    stage: "Aprovação",
    status: "Aguardando aprovação",
    responsible: "Camila Duarte",
    lastUpdate: "2026-08-13",
    address: { cep: "44001-222", street: "Rua Visconde do Rio Branco", number: "77", complement: "", district: "Centro", city: "Feira de Santana", state: "BA" },
    guardian: { name: "José Ferreira", phone: "(75) 99123-4512", relation: "Esposo" },
    attendanceType: "Médico + Enfermagem",
  },
  {
    id: "PAC-1007",
    name: "Sebastião Rocha Lima",
    cpf: "789.012.345-67",
    birthDate: "1948-12-15",
    sex: "Masculino",
    phone: "(75) 99123-4513",
    email: "sebastiao.lima@exemplo.com",
    institutionId: "inst-1",
    entryDate: "2026-02-14",
    stage: "Encerrado",
    status: "Encerrado",
    responsible: "Ana Beatriz Lima",
    lastUpdate: "2026-07-30",
    address: { cep: "44052-200", street: "Rua Piauí", number: "301", complement: "", district: "Tomba", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Helena Lima", phone: "(75) 99123-4514", relation: "Filha" },
    attendanceType: "Enfermagem",
  },
  {
    id: "PAC-1008",
    name: "Terezinha Gomes Barbosa",
    cpf: "890.123.456-78",
    birthDate: "1955-08-05",
    sex: "Feminino",
    phone: "(75) 99123-4515",
    email: "terezinha.barbosa@exemplo.com",
    institutionId: "inst-3",
    entryDate: "2026-08-05",
    stage: "Avaliação Social",
    status: "Em avaliação",
    responsible: "Marcos Vinícius Teles",
    lastUpdate: "2026-08-12",
    address: { cep: "44075-080", street: "Rua Odilon Coutinho", number: "145", complement: "", district: "George Américo", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Paulo Barbosa", phone: "(75) 99123-4516", relation: "Filho" },
    attendanceType: "Avaliação inicial",
  },
  {
    id: "PAC-1009",
    name: "Osvaldo Martins Cardoso",
    cpf: "901.234.567-89",
    birthDate: "1960-03-22",
    sex: "Masculino",
    phone: "(75) 99123-4517",
    email: "osvaldo.cardoso@exemplo.com",
    institutionId: "inst-4",
    entryDate: "2026-06-01",
    stage: "Atendimento",
    status: "Atendimento",
    responsible: "Dr. Rafael Nogueira",
    lastUpdate: "2026-08-16",
    address: { cep: "44024-470", street: "Av. Getúlio Vargas", number: "610", complement: "Sala 4", district: "Feira IV", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Isabel Cardoso", phone: "(75) 99123-4518", relation: "Esposa" },
    attendanceType: "Médico",
  },
  {
    id: "PAC-1010",
    name: "Aparecida Souza Melo",
    cpf: "012.345.678-90",
    birthDate: "1957-10-11",
    sex: "Feminino",
    phone: "(75) 99123-4519",
    email: "aparecida.melo@exemplo.com",
    institutionId: "inst-2",
    entryDate: "2026-08-10",
    stage: "Cadastro",
    status: "Novo",
    responsible: "Camila Duarte",
    lastUpdate: "2026-08-11",
    address: { cep: "44052-333", street: "Rua Minas Gerais", number: "22", complement: "", district: "Tomba", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Cláudio Melo", phone: "(75) 99123-4520", relation: "Filho" },
    attendanceType: "Avaliação inicial",
  },
  {
    id: "PAC-1011",
    name: "Manoel Ribeiro Tavares",
    cpf: "112.233.445-56",
    birthDate: "1950-07-17",
    sex: "Masculino",
    phone: "(75) 99123-4521",
    email: "manoel.tavares@exemplo.com",
    institutionId: "inst-1",
    entryDate: "2026-04-09",
    stage: "Prorrogação",
    status: "Prorrogação",
    responsible: "Juliana Prado",
    lastUpdate: "2026-08-17",
    address: { cep: "44001-050", street: "Rua Conselheiro Franco", number: "410", complement: "", district: "Centro", city: "Feira de Santana", state: "BA" },
    guardian: { name: "Vera Tavares", phone: "(75) 99123-4522", relation: "Esposa" },
    attendanceType: "Fisioterapia",
  },
];

export function statusVariant(status) {
  return statusBadge[status] || "neutral";
}

export function institutionName(id) {
  return institutions.find((i) => i.id === id)?.name || "—";
}

export const pendencias = [
  { id: 1, patient: "João da Silva Andrade", patientId: "PAC-1001", label: "Avaliação clínica pendente", due: "Hoje", severity: "high" },
  { id: 2, patient: "Maria Santos Oliveira", patientId: "PAC-1002", label: "Orçamento aguardando aprovação", due: "Amanhã", severity: "medium" },
  { id: 3, patient: "Carlos Eduardo Souza", patientId: "PAC-1003", label: "Prorrogação próxima do vencimento", due: "3 dias", severity: "medium" },
  { id: 4, patient: "Rita de Cássia Ferreira", patientId: "PAC-1006", label: "Documento pendente de envio", due: "2 dias", severity: "low" },
  { id: 5, patient: "Terezinha Gomes Barbosa", patientId: "PAC-1008", label: "Avaliação social aguardando visita", due: "Hoje", severity: "high" },
];

export const attendancesByMonth = [
  { month: "Mar", atendimentos: 42 },
  { month: "Abr", atendimentos: 51 },
  { month: "Mai", atendimentos: 47 },
  { month: "Jun", atendimentos: 63 },
  { month: "Jul", atendimentos: 58 },
  { month: "Ago", atendimentos: 66 },
];

export const attendancesByProfessional = [
  { name: "Ana B. Lima", value: 28 },
  { name: "Rafael Nogueira", value: 19 },
  { name: "Juliana Prado", value: 24 },
  { name: "Marcos Teles", value: 15 },
];

export const patientsByStage = STAGES.map((stage) => ({
  stage,
  total: patients.filter((p) => p.stage === stage).length || (stage === "Encerrado" ? 1 : 0),
}));

export const notifications = [
  { id: 1, text: "Nova avaliação clínica pendente para João da Silva Andrade", time: "há 12 min", read: false },
  { id: 2, text: "Orçamento de Maria Santos Oliveira aguardando aprovação", time: "há 1 h", read: false },
  { id: 3, text: "Prorrogação de Carlos Eduardo Souza vence em 5 dias", time: "há 3 h", read: false },
  { id: 4, text: "Documento pendente para Rita de Cássia Ferreira", time: "ontem", read: true },
  { id: 5, text: "Visita agendada para hoje — Antônio Pereira Nunes", time: "ontem", read: true },
];

export const documentTypes = [
  "Avaliação social",
  "Avaliação clínica",
  "Prescrição",
  "Orçamento",
  "Relatório de atendimento",
  "Prorrogação",
  "Aditivo",
  "Evidência",
  "Outros",
];

export function historyFor(patientId) {
  const base = [
    { date: "2026-08-17", label: "Avaliação clínica realizada", by: "Ana Beatriz Lima" },
    { date: "2026-08-10", label: "Avaliação social aprovada", by: "Marcos Vinícius Teles" },
    { date: "2026-08-08", label: "Avaliação social agendada", by: "Marcos Vinícius Teles" },
    { date: "2026-08-02", label: "Cadastro realizado", by: "Camila Duarte" },
  ];
  return base;
}

export function visitsFor() {
  return [
    { date: "2026-08-19", time: "09:00", type: "Enfermagem", professional: "Ana Beatriz Lima", status: "Agendada" },
    { date: "2026-08-12", time: "14:30", type: "Avaliação", professional: "Marcos Vinícius Teles", status: "Realizada" },
  ];
}

export const budgetsFor = () => [
  {
    id: "ORC-3391",
    date: "2026-08-05",
    status: "Em análise",
    total: 8000,
    items: [
      { desc: "Enfermagem 12h/dia", category: "Enfermagem", qty: 30, unit: 180, total: 5400 },
      { desc: "Curativos especiais", category: "Materiais", qty: 30, unit: 40, total: 1200 },
      { desc: "Fisioterapia motora", category: "Fisioterapia", qty: 8, unit: 175, total: 1400 },
    ],
  },
];

export const addendumsFor = () => [
  { id: "ADT-01", originalBudget: "ORC-3391", originalValue: 8000, additionalValue: 1500, date: "2026-08-15", reason: "Ampliação da carga horária de enfermagem" },
];

export const documentsFor = () => [
  { name: "Prescrição médica — Ago/2026.pdf", type: "Prescrição", date: "2026-08-16", by: "Dr. Rafael Nogueira" },
  { name: "Ficha de avaliação social.pdf", type: "Avaliação social", date: "2026-08-08", by: "Marcos Vinícius Teles" },
  { name: "Evidência — fotos residência.zip", type: "Evidência", date: "2026-08-08", by: "Marcos Vinícius Teles" },
  { name: "Orçamento ORC-3391.pdf", type: "Orçamento", date: "2026-08-05", by: "Camila Duarte" },
];

export const materialsFor = () => [
  { name: "Fralda geriátrica G", qty: 60, unit: "un" },
  { name: "Luva de procedimento", qty: 3, unit: "cx" },
  { name: "Curativo hidrocoloide", qty: 20, unit: "un" },
];

export const roles = [
  "Administrador",
  "ADM",
  "Enfermeiro",
  "Médico",
  "Fisioterapeuta",
  "Avaliação Social",
  "Gestor",
];

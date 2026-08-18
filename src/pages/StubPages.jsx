import {
  ClipboardCheck,
  Receipt,
  Stethoscope,
  CalendarClock,
  TimerReset,
  FilePlus2,
  Boxes,
  FolderOpen,
  BarChart3,
  Settings,
} from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

export const Assessments = () => (
  <ModulePlaceholder
    icon={ClipboardCheck}
    title="Avaliações"
    description="Avaliações sociais e clínicas de todos os pacientes."
  />
);

export const Budgets = () => (
  <ModulePlaceholder
    icon={Receipt}
    title="Orçamentos"
    description="Orçamentos, itens e status de aprovação."
  />
);

export const Attendances = () => (
  <ModulePlaceholder
    icon={Stethoscope}
    title="Atendimentos"
    description="Relatórios de atendimento realizados pela equipe."
  />
);

export const Visits = () => (
  <ModulePlaceholder
    icon={CalendarClock}
    title="Visitas"
    description="Calendário de visitas domiciliares por profissional."
  />
);

export const Extensions = () => (
  <ModulePlaceholder
    icon={TimerReset}
    title="Prorrogações"
    description="Acompanhamento de prorrogações de atendimento."
  />
);

export const Addendums = () => (
  <ModulePlaceholder
    icon={FilePlus2}
    title="Aditivos"
    description="Aditivos vinculados a orçamentos originais."
  />
);

export const Materials = () => (
  <ModulePlaceholder
    icon={Boxes}
    title="Materiais"
    description="Estoque, reservas e movimentações de materiais."
  />
);

export const Documents = () => (
  <ModulePlaceholder
    icon={FolderOpen}
    title="Documentos"
    description="Central de documentos de todos os pacientes."
  />
);

export const Reports = () => (
  <ModulePlaceholder
    icon={BarChart3}
    title="Relatórios"
    description="Indicadores gerenciais. Arquitetura preparada para futura conexão com Power BI."
  />
);

export const SettingsPage = () => (
  <ModulePlaceholder
    icon={Settings}
    title="Configurações"
    description="Perfis, permissões e preferências do sistema."
  />
);

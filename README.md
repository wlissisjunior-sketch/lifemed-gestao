# LifeMed Gestão — MVP/Protótipo

Aplicação web (SaaS interno) para gestão de atendimento domiciliar,
desenvolvida como protótipo funcional para avaliação visual e de fluxo.
Todos os dados são fictícios — nenhum dado real de paciente é usado.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Na tela de login, qualquer e-mail e
senha preenchidos entram no sistema (autenticação real entra quando o
Supabase for conectado — ver abaixo).

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## O que já está funcional nesta fase

Conforme combinado, esta primeira entrega cobre **layout geral, login,
dashboard, listagem de pacientes e perfil completo do paciente**:

- **Login** — tela com e-mail, senha, "lembrar acesso" e mensagem de
  ambiente seguro.
- **Layout principal** — menu lateral (vira drawer no mobile), header
  com busca global e notificações, breadcrumbs.
- **Dashboard** — cards de indicadores, trilho de etapas do paciente
  (elemento visual reaproveitado no perfil do paciente), gráfico de
  pacientes por etapa, atendimentos por mês, distribuição por
  profissional e lista de pendências.
- **Pacientes** — busca, filtro por status, tabela e paginação.
- **Novo paciente** — formulário dividido em seções (dados pessoais,
  endereço, contato do responsável, atendimento).
- **Perfil do paciente** — cabeçalho com trilho de etapas e abas:
  Resumo, Dados cadastrais, Avaliações, Orçamentos, Atendimentos,
  Visitas, Prorrogações, Aditivos, Documentos e Histórico.
- **Instituições** e **Profissionais** — listagens funcionais com os
  dados fictícios já cadastrados.

Os demais módulos do menu (Avaliações, Orçamentos, Atendimentos,
Visitas, Prorrogações, Aditivos, Materiais, Documentos, Relatórios,
Configurações) já têm navegação, rota e o mesmo padrão visual — o
conteúdo funcional completo de cada um entra na próxima fase, mantendo
esse padrão.

## Estrutura do projeto

```
src/
  components/         Componentes reutilizáveis (Card, Badge, StageRail…)
  components/layout/  Sidebar, Header, Breadcrumbs, AppShell
  context/             AuthContext (mock de autenticação)
  data/mockData.js     Todos os dados fictícios (pacientes, instituições,
                        profissionais, orçamentos, histórico…)
  pages/                Uma página por rota
```

A estrutura foi pensada para que, ao conectar o Supabase, `mockData.js`
seja substituído por chamadas reais (`supabase-js`) sem precisar
reescrever os componentes — cada página já consome os dados através de
funções isoladas (`institutionName()`, `historyFor()`,
`budgetsFor()` etc.).

## Próximos passos sugeridos

1. Conectar Supabase (auth real + Postgres) seguindo as entidades já
   mapeadas em `mockData.js`: `patients`, `institutions`,
   `professionals`, `social_evaluations`, `clinical_evaluations`,
   `budgets`, `budget_items`, `approvals`, `materials`,
   `material_movements`, `visits`, `attendances`, `extensions`,
   `addendums`, `documents`, `notifications`, `audit_history`.
2. Implementar Row Level Security por perfil (Administrador, ADM,
   Enfermeiro, Médico, Fisioterapeuta, Avaliação Social, Gestor).
3. Construir os formulários funcionais dos módulos ainda em
   placeholder (avaliação social/clínica, orçamento com cálculo de
   itens, prorrogação, aditivo, upload real de documentos/fotos).
4. Upload de imagens com acesso à câmera do celular (input
   `capture="environment"`) nos formulários de evidência.

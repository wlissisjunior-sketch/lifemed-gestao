# Sistema de Fechamento LifeMed

Lançamento de serviços por paciente, regras de pacote (Diário Oficial BA, 15/04/2026), faturamento por paciente,
físico-financeiro, fechamento individual (PDF/Excel), controle de relatórios entregues e tabelas PLANSERV e Anexo II.
Funciona no computador e no celular.

## Esta versão (demonstração)

- Os dados ficam **no navegador de quem abre** (localStorage). Cada pessoa vê a própria cópia, iniciada com
  dados de exemplo de agosto/2026 (pacientes fictícios; serviços, valores e regras reais).
- Entrada por escolha de perfil (Administrador, Operador, Leitor). Em *Competências e ajustes* há
  “Restaurar dados de exemplo”.

## Publicar na Vercel

**Opção 1 — pelo computador (sem GitHub):**
```bash
npm install
npx vercel --prod        # faz login no navegador na primeira vez e publica
```

**Opção 2 — pelo GitHub:** envie esta pasta para um repositório, entre em vercel.com → *Add New → Project*,
importe o repositório e clique em *Deploy* (a Vercel detecta o Vite sozinha).

## Rodar localmente
```bash
npm install
npm run dev              # http://localhost:5173
```

## Passar para banco de dados (MySQL ou SQL Server)

1. Crie o banco e rode `sql/<mysql|sqlserver>/01_schema.sql` e `02_catalogo.sql`.
2. Crie um backend (API) com as rotas de `docs/modelo-de-dados.md` e login com e-mail e senha.
3. Troque o adaptador em `src/lib/datasource.ts` por chamadas à API. As telas não mudam.

## Estrutura
```
src/lib/engine.ts       regra de cobrança (pura, testada contra as planilhas de agosto/2026)
src/lib/views.ts        faturamento, físico-financeiro, fechamento, relatórios
src/lib/datasource.ts   camada de dados (trocar aqui pelo banco)
src/pages/              telas
sql/                    esquema MySQL e SQL Server + dados de catálogo
docs/                   modelo de dados e contrato da API
```

# Modelo de dados — Sistema de Fechamento LifeMed

Esquema pronto para **MySQL 8** (`sql/mysql`) ou **SQL Server 2017+** (`sql/sqlserver`). Rode `01_schema.sql` e depois `02_catalogo.sql` (serviços, regras dos 7 pacotes, tipos de relatório e Anexo II). A tabela PLANSERV entra pela tela *Medicamentos PLANSERV* (importação do .xlsx) ou por carga direta em `planserv_medicamentos`.

## Onde cada tela grava

| Tela | Tabela(s) |
|---|---|
| Checklist de serviços | `lancamentos` |
| Pacientes | `pacientes` |
| Serviços e valores | `servicos` |
| Pacotes e inclusos | `pacote_regras`, `servicos.limite_medicamento` |
| Relatórios entregues / Painel | `relatorios_status`, `tipos_relatorio` |
| Competências e ajustes | `competencias`, `auditoria`, `usuarios` |
| Medicamentos PLANSERV | `planserv_versoes`, `planserv_medicamentos` |
| Dietas e suplementos | `dietas_anexo2` |
| Faturamento, Físico-financeiro, Fechamento | calculados a partir de `lancamentos` + `servicos` + `pacote_regras` |

## Regra de cobrança

O valor cobrado de cada lançamento é calculado pela aplicação (`src/lib/engine.ts`, função pura e testada): o que o pacote do paciente inclui nos dias em que o pacote vale não é cobrado; o resto é cobrado por `quantidade × valor_unitario`. Medicamentos ficam inclusos quando o valor da dose é menor ou igual a `servicos.limite_medicamento` do pacote. A visão `vw_lancamentos` traz o valor **bruto** para BI; para o valor cobrado, use os relatórios do sistema ou porte a função para o backend.

## Tabelas

### `usuarios`
Pessoas que acessam o sistema (login).

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | INT | INT | PK, autoincremento |
| `nome` | VARCHAR(150) | NVARCHAR(150) | obrigatório |
| `email` | VARCHAR(200) | NVARCHAR(200) | único |
| `senha_hash` | VARCHAR(255) | NVARCHAR(255) | bcrypt/argon2, nunca a senha |
| `papel` | VARCHAR(10) | VARCHAR(10) | admin | operador | leitor | pendente |
| `ativo` | TINYINT(1) | BIT | 1 = pode entrar |
| `criado_em` | DATETIME | DATETIME2 |  |

### `servicos`
Serviços, pacotes e medicamentos faturáveis (tela Serviços e valores).

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | VARCHAR(10) | VARCHAR(10) | PK, ex. s01 |
| `ordem` | INT | INT | ordem de exibição |
| `categoria` | VARCHAR(80) | NVARCHAR(80) |  |
| `nome` | VARCHAR(120) | NVARCHAR(120) | nome curto |
| `descricao` | VARCHAR(300) | NVARCHAR(300) | descrição oficial nos relatórios |
| `valor` | DECIMAL(12,2) | DECIMAL(12,2) | valor unitário vigente |
| `eh_pacote` | TINYINT(1) | BIT | 1 = diária/gerenciamento |
| `eh_medicamento` | TINYINT(1) | BIT | 1 = regra por valor da dose |
| `limite_medicamento` | DECIMAL(12,2) NULL | DECIMAL(12,2) NULL | só pacotes: R$ por dose incluso |
| `ativo` | TINYINT(1) | BIT |  |

### `pacote_regras`
O que cada pacote já inclui (tela Pacotes e inclusos).

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `pacote_id` | VARCHAR(10) | VARCHAR(10) | PK, FK servicos |
| `servico_id` | VARCHAR(10) | VARCHAR(10) | PK, FK servicos |
| `limite` | VARCHAR(5) | VARCHAR(5) | dias = até 1 por dia de pacote | total |

### `pacientes`
Cadastro de pacientes.

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | VARCHAR(40) | VARCHAR(40) | PK |
| `nome` | VARCHAR(200) | NVARCHAR(200) | único |
| `cns` | CHAR(15) NULL | CHAR(15) NULL | cartão SUS |
| `municipio` | VARCHAR(100) NULL | NVARCHAR(100) NULL |  |
| `data_admissao` | DATE NULL | DATE NULL |  |
| `ativo` | TINYINT(1) | BIT |  |

### `competencias`
Meses de fechamento.

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | CHAR(7) | CHAR(7) | PK, AAAA-MM |
| `data_inicio` | DATE | DATE |  |
| `data_fim` | DATE | DATE |  |
| `status` | VARCHAR(10) | VARCHAR(10) | aberta | fechada |
| `fechada_por` | INT NULL | INT NULL | FK usuarios |
| `fechada_em` | DATETIME NULL | DATETIME2 NULL |  |
| `criada_em` | DATETIME | DATETIME2 |  |

### `lancamentos`
Serviços usados por paciente no mês (tela Checklist).

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | VARCHAR(40) | VARCHAR(40) | PK |
| `competencia_id` | CHAR(7) | CHAR(7) | FK competencias |
| `paciente_id` | VARCHAR(40) | VARCHAR(40) | FK pacientes |
| `servico_id` | VARCHAR(10) | VARCHAR(10) | FK servicos |
| `quantidade` | DECIMAL(14,4) | DECIMAL(14,4) | diárias, unidades ou horas (7:37 = 7,6167) |
| `data_inicio` | DATE NULL | DATE NULL |  |
| `data_fim` | DATE NULL | DATE NULL |  |
| `modo` | VARCHAR(6) | VARCHAR(6) | auto | cobrar (cobrar mesmo dentro do pacote) |
| `valor_unitario` | DECIMAL(12,2) | DECIMAL(12,2) | congelado no dia do lançamento |
| `observacao` | VARCHAR(300) NULL | NVARCHAR(300) NULL |  |
| `criado_por` | INT NULL | INT NULL | FK usuarios |
| `criado_em` | DATETIME | DATETIME2 |  |
| `alterado_por` | INT NULL | INT NULL | FK usuarios |
| `alterado_em` | DATETIME NULL | DATETIME2 NULL |  |

### `tipos_relatorio`
Tipos de relatório controlados (Médico, Enfermagem…).

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | VARCHAR(20) | VARCHAR(20) | PK |
| `nome` | VARCHAR(80) | NVARCHAR(80) |  |
| `ordem` | INT | INT |  |
| `ativo` | TINYINT(1) | BIT |  |

### `relatorios_status`
Relatório entregue por paciente e mês (tela Relatórios). Sem linha = pendente.

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `competencia_id` | CHAR(7) | CHAR(7) | PK, FK competencias |
| `paciente_id` | VARCHAR(40) | VARCHAR(40) | PK, FK pacientes |
| `tipo_id` | VARCHAR(20) | VARCHAR(20) | PK, FK tipos_relatorio |
| `status` | VARCHAR(10) | VARCHAR(10) | entregue | pendente |
| `atualizado_por` | INT NULL | INT NULL | FK usuarios |
| `atualizado_em` | DATETIME | DATETIME2 |  |

### `planserv_versoes`
Cada importação da tabela PLANSERV.

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | INT | INT | PK, autoincremento |
| `versao` | DATE NULL | DATE NULL | data da tabela |
| `arquivo` | VARCHAR(255) | NVARCHAR(255) |  |
| `itens` | INT | INT |  |
| `importado_por` | INT NULL | INT NULL | FK usuarios |
| `importado_em` | DATETIME | DATETIME2 |  |
| `vigente` | TINYINT(1) | BIT | 1 = versão em uso |

### `planserv_medicamentos`
Itens da tabela PLANSERV.

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | BIGINT | BIGINT | PK, autoincremento |
| `versao_id` | INT | INT | FK planserv_versoes |
| `codigo` | VARCHAR(20) | VARCHAR(20) |  |
| `descricao` | VARCHAR(400) | NVARCHAR(400) |  |
| `fracao` | VARCHAR(40) NULL | NVARCHAR(40) NULL |  |
| `unidade` | VARCHAR(40) NULL | NVARCHAR(40) NULL |  |
| `valor` | DECIMAL(12,2) NULL | DECIMAL(12,2) NULL |  |
| `grupo` | VARCHAR(120) NULL | NVARCHAR(120) NULL |  |

### `dietas_anexo2`
Valores de referência do Anexo II (dietas e suplementos).

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | INT | INT | PK, nº do item |
| `descricao` | VARCHAR(300) | NVARCHAR(300) |  |
| `valor` | DECIMAL(12,2) | DECIMAL(12,2) |  |
| `vigencia` | VARCHAR(80) | NVARCHAR(80) | ex. DOE-BA 15/04/2026 |

### `auditoria`
Histórico de alterações.

| Coluna | MySQL | SQL Server | Observação |
|---|---|---|---|
| `id` | BIGINT | BIGINT | PK, autoincremento |
| `em` | DATETIME | DATETIME2 |  |
| `usuario_id` | INT NULL | INT NULL | FK usuarios |
| `acao` | VARCHAR(60) | NVARCHAR(60) |  |
| `alvo` | VARCHAR(200) | NVARCHAR(200) |  |
| `detalhe` | VARCHAR(1000) NULL | NVARCHAR(1000) NULL |  |

### PAD (plano de atenção domiciliar)
| Tabela | Conteúdo |
|---|---|
| `escala_criterios`, `escala_opcoes`, `escala_faixas` | Escala de complexidade configurável: critérios, opções com pontos (uma opção pode exigir uma modalidade, ex.: ventilação mecânica → 24h c/ VM) e faixas de pontos → modalidade sugerida |
| `pads` | Uma linha por versão do PAD: paciente, versão, versão anterior, situação (`rascunho`, `enviado`, `autorizado`, `encerrado`), operadora, nº da autorização, médico/CRM, início e fim, pontos, modalidade sugerida e escolhida (com motivo), objetivos, critérios de alta, reavaliação e datas de envio/autorização/encerramento |
| `pad_escala` | Respostas da avaliação de complexidade |
| `pad_itens` | Itens previstos: serviço, quantidade e frequência (`dia`, `semana`, `mes`, `periodo`) |
| `pad_relatorios` | Tipos de relatório exigidos enquanto o PAD vale |

Regras na aplicação (`src/lib/pad.ts`): previsão por frequência e período, orçamento pelo motor de cobrança, situação (em vigor, vence em N dias, vencido), previsto x realizado e diferença entre versões.

### Anexos dos relatórios
| Tabela | Conteúdo |
|---|---|
| `relatorios_anexos` | Um PDF por linha: competência, paciente, tipo, chave do arquivo no armazenamento, nome, tamanho, páginas, data de entrega, profissional, observação, quem enviou e quando, situação (`vigente`, `substituido`, `removido`) e motivo da remoção |

O relatório só é **entregue** quando existe um anexo `vigente`. Substituir marca o anterior como `substituido`; remover marca como `removido` (o arquivo fica para o histórico).

**Onde ficam os arquivos:** ainda não definido. Toda a leitura e gravação de arquivos passa por `src/lib/arquivos.ts` (`put`, `get`, `remove`). Hoje a implementação é provisória e guarda no navegador, só para a demonstração. No servidor, troque por chamadas à API (rotas abaixo) e grave o arquivo onde for decidido (disco da VPS, armazenamento de objetos etc.).

## Contrato da API para o backend

A interface usada pelas telas está em `src/lib/datasource.ts`. Para ligar o banco, crie um adaptador com a mesma interface que chame uma API REST, por exemplo:

| Método | Rota | Uso |
|---|---|---|
| POST | `/api/auth/login` | e-mail e senha → token |
| GET | `/api/servicos`, `/api/pacote-regras`, `/api/pacientes`, `/api/competencias`, `/api/tipos-relatorio`, `/api/dietas` | cadastros |
| GET | `/api/competencias/{id}/lancamentos` | lançamentos do mês |
| POST / PUT / DELETE | `/api/lancamentos[/{id}]` | lançar, editar, excluir (recusar se a competência estiver fechada) |
| GET / PUT | `/api/competencias/{id}/relatorios` | status dos relatórios |
| POST | `/api/competencias/{id}/fechar` e `/reabrir` | só administrador |
| GET | `/api/planserv?q=...` | busca |
| GET / POST / PUT | `/api/pads[/{id}]` | listar, criar e editar PAD (só em rascunho) |
| POST | `/api/pads/{id}/enviar`, `/autorizar`, `/encerrar`, `/nova-versao` | mudança de situação (autorizar e encerrar: administrador) |
| GET / PUT | `/api/escala` | escala de complexidade (alterar: administrador) |
| POST | `/api/arquivos` | recebe o PDF, valida (PDF, tamanho, páginas) e devolve a chave |
| GET / DELETE | `/api/arquivos/{chave}` | baixar / apagar |
| POST | `/api/competencias/{id}/relatorios/{paciente}/{tipo}/anexo` | registra o anexo e marca entregue (só depois do arquivo salvo) |
| POST | `/api/planserv/importar` | só administrador |

Papéis: **admin** (tudo), **operador** (lança, cadastra pacientes, marca relatórios), **leitor** (consulta). O backend deve validar o papel em cada rota e gravar em `auditoria`.

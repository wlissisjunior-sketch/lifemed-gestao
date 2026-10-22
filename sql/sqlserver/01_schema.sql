-- Sistema de Fechamento LifeMed — esquema SQL Server 2017+
-- Gerado a partir do modelo de dados do sistema. Ordem: tabelas, chaves, índices.

-- Pessoas que acessam o sistema (login).
CREATE TABLE usuarios (
  id INT IDENTITY(1,1) NOT NULL,
  nome NVARCHAR(150) NOT NULL,
  email NVARCHAR(200) NOT NULL,
  senha_hash NVARCHAR(255) NOT NULL,
  papel VARCHAR(10) NOT NULL DEFAULT 'pendente',
  ativo BIT NOT NULL DEFAULT 1,
  criado_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT pk_usuarios PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT ck_usuarios_papel CHECK (papel IN ('admin','operador','leitor','pendente'))
);

-- Serviços, pacotes e medicamentos faturáveis (tela Serviços e valores).
CREATE TABLE servicos (
  id VARCHAR(10) NOT NULL,
  ordem INT NOT NULL,
  categoria NVARCHAR(80) NOT NULL,
  nome NVARCHAR(120) NOT NULL,
  descricao NVARCHAR(300) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  eh_pacote BIT NOT NULL,
  eh_medicamento BIT NOT NULL,
  limite_medicamento DECIMAL(12,2) NULL,
  ativo BIT NOT NULL DEFAULT 1,
  CONSTRAINT pk_servicos PRIMARY KEY (id)
);

-- O que cada pacote já inclui (tela Pacotes e inclusos).
CREATE TABLE pacote_regras (
  pacote_id VARCHAR(10) NOT NULL,
  servico_id VARCHAR(10) NOT NULL,
  limite VARCHAR(5) NOT NULL,
  CONSTRAINT pk_pacote_regras PRIMARY KEY (pacote_id, servico_id),
  CONSTRAINT ck_pacote_regras_limite CHECK (limite IN ('dias','total'))
);

-- Cadastro de pacientes.
CREATE TABLE pacientes (
  id VARCHAR(40) NOT NULL,
  nome NVARCHAR(200) NOT NULL,
  cns CHAR(15) NULL,
  municipio NVARCHAR(100) NULL,
  data_admissao DATE NULL,
  ativo BIT NOT NULL DEFAULT 1,
  CONSTRAINT pk_pacientes PRIMARY KEY (id),
  CONSTRAINT uq_pacientes_nome UNIQUE (nome)
);

-- Meses de fechamento.
CREATE TABLE competencias (
  id CHAR(7) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'aberta',
  fechada_por INT NULL,
  fechada_em DATETIME2 NULL,
  criada_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT pk_competencias PRIMARY KEY (id),
  CONSTRAINT ck_competencias_status CHECK (status IN ('aberta','fechada'))
);

-- Serviços usados por paciente no mês (tela Checklist).
CREATE TABLE lancamentos (
  id VARCHAR(40) NOT NULL,
  competencia_id CHAR(7) NOT NULL,
  paciente_id VARCHAR(40) NOT NULL,
  servico_id VARCHAR(10) NOT NULL,
  quantidade DECIMAL(14,4) NOT NULL,
  data_inicio DATE NULL,
  data_fim DATE NULL,
  modo VARCHAR(6) NOT NULL DEFAULT 'auto',
  valor_unitario DECIMAL(12,2) NOT NULL,
  observacao NVARCHAR(300) NULL,
  criado_por INT NULL,
  criado_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  alterado_por INT NULL,
  alterado_em DATETIME2 NULL,
  CONSTRAINT pk_lancamentos PRIMARY KEY (id),
  CONSTRAINT ck_lancamentos_modo CHECK (modo IN ('auto','cobrar')),
  CONSTRAINT ck_lancamentos_quantidade CHECK (quantidade > 0)
);

-- Tipos de relatório controlados (Médico, Enfermagem…).
CREATE TABLE tipos_relatorio (
  id VARCHAR(20) NOT NULL,
  nome NVARCHAR(80) NOT NULL,
  ordem INT NOT NULL,
  ativo BIT NOT NULL DEFAULT 1,
  CONSTRAINT pk_tipos_relatorio PRIMARY KEY (id)
);

-- Relatório entregue por paciente e mês (tela Relatórios). Sem linha = pendente.
CREATE TABLE relatorios_status (
  competencia_id CHAR(7) NOT NULL,
  paciente_id VARCHAR(40) NOT NULL,
  tipo_id VARCHAR(20) NOT NULL,
  status VARCHAR(10) NOT NULL,
  atualizado_por INT NULL,
  atualizado_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT pk_relatorios_status PRIMARY KEY (competencia_id, paciente_id, tipo_id),
  CONSTRAINT ck_relatorios_status_status CHECK (status IN ('entregue','pendente'))
);

-- Cada importação da tabela PLANSERV.
CREATE TABLE planserv_versoes (
  id INT IDENTITY(1,1) NOT NULL,
  versao DATE NULL,
  arquivo NVARCHAR(255) NOT NULL,
  itens INT NOT NULL,
  importado_por INT NULL,
  importado_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  vigente BIT NOT NULL DEFAULT 1,
  CONSTRAINT pk_planserv_versoes PRIMARY KEY (id)
);

-- Itens da tabela PLANSERV.
CREATE TABLE planserv_medicamentos (
  id BIGINT IDENTITY(1,1) NOT NULL,
  versao_id INT NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  descricao NVARCHAR(400) NOT NULL,
  fracao NVARCHAR(40) NULL,
  unidade NVARCHAR(40) NULL,
  valor DECIMAL(12,2) NULL,
  grupo NVARCHAR(120) NULL,
  CONSTRAINT pk_planserv_medicamentos PRIMARY KEY (id)
);

-- Valores de referência do Anexo II (dietas e suplementos).
CREATE TABLE dietas_anexo2 (
  id INT NOT NULL,
  descricao NVARCHAR(300) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  vigencia NVARCHAR(80) NOT NULL,
  CONSTRAINT pk_dietas_anexo2 PRIMARY KEY (id)
);

-- Histórico de alterações.
CREATE TABLE auditoria (
  id BIGINT IDENTITY(1,1) NOT NULL,
  em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  usuario_id INT NULL,
  acao NVARCHAR(60) NOT NULL,
  alvo NVARCHAR(200) NOT NULL,
  detalhe NVARCHAR(1000) NULL,
  CONSTRAINT pk_auditoria PRIMARY KEY (id)
);

GO

-- ===================== PAD (plano de atenção domiciliar) =====================
-- Escala de complexidade configurável (critérios, opções com pontos e faixas → modalidade).
CREATE TABLE escala_criterios (
  id NVARCHAR(20) NOT NULL,
  nome NVARCHAR(120) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  CONSTRAINT pk_escala_criterios PRIMARY KEY (id)
);

CREATE TABLE escala_opcoes (
  criterio_id NVARCHAR(20) NOT NULL,
  ordem INT NOT NULL,
  texto NVARCHAR(160) NOT NULL,
  pontos INT NOT NULL DEFAULT 0,
  exige_servico_id NVARCHAR(10) NULL,
  CONSTRAINT pk_escala_opcoes PRIMARY KEY (criterio_id, ordem)
);

CREATE TABLE escala_faixas (
  pontos_min INT NOT NULL,
  servico_id NVARCHAR(10) NOT NULL,
  CONSTRAINT pk_escala_faixas PRIMARY KEY (pontos_min)
);

CREATE TABLE pads (
  id NVARCHAR(40) NOT NULL,
  paciente_id NVARCHAR(40) NOT NULL,
  versao INT NOT NULL,
  anterior_id NVARCHAR(40) NULL,
  cod_pad_sesab NVARCHAR(30) NULL,
  usar_escala BIT NOT NULL DEFAULT 0,
  pacote_frequencia NVARCHAR(12) NOT NULL DEFAULT 'dia',
  status NVARCHAR(12) NOT NULL DEFAULT 'rascunho',
  operadora NVARCHAR(80) NULL,
  autorizacao NVARCHAR(60) NULL,
  medico NVARCHAR(120) NULL,
  crm NVARCHAR(30) NULL,
  inicio DATE NOT NULL,
  fim DATE NOT NULL,
  pontos INT NOT NULL DEFAULT 0,
  modalidade_sugerida_id NVARCHAR(10) NULL,
  pacote_id NVARCHAR(10) NULL,
  motivo_modalidade NVARCHAR(500) NULL,
  objetivos NVARCHAR(MAX) NULL,
  criterios_alta NVARCHAR(MAX) NULL,
  reavaliacao DATE NULL,
  criado_por INT NULL,
  criado_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  enviado_em DATETIME2 NULL,
  autorizado_em DATETIME2 NULL,
  encerrado_em DATETIME2 NULL,
  motivo_encerramento NVARCHAR(300) NULL,
  CONSTRAINT pk_pads PRIMARY KEY (id),
  CONSTRAINT uq_pads_paciente_versao UNIQUE (paciente_id, versao),
  CONSTRAINT ck_pads_status CHECK (status IN ('rascunho','enviado','autorizado','encerrado')),
  CONSTRAINT ck_pads_periodo CHECK (fim >= inicio),
  CONSTRAINT ck_pads_pacote_freq CHECK (pacote_frequencia IN ('dia','alternados'))
);

CREATE TABLE pad_escala (
  pad_id NVARCHAR(40) NOT NULL,
  criterio_id NVARCHAR(20) NOT NULL,
  opcao_ordem INT NOT NULL,
  CONSTRAINT pk_pad_escala PRIMARY KEY (pad_id, criterio_id)
);

CREATE TABLE pad_itens (
  pad_id NVARCHAR(40) NOT NULL,
  servico_id NVARCHAR(10) NOT NULL,
  quantidade DECIMAL(12,4) NOT NULL,
  frequencia NVARCHAR(10) NOT NULL,
  data_inicio DATE NULL,
  data_fim DATE NULL,
  observacao NVARCHAR(300) NULL,
  CONSTRAINT pk_pad_itens PRIMARY KEY (pad_id, servico_id),
  CONSTRAINT ck_pad_itens_freq CHECK (frequencia IN ('dia','alternados','48h','semana','mes','periodo'))
);

CREATE TABLE pad_relatorios (
  pad_id NVARCHAR(40) NOT NULL,
  tipo_id NVARCHAR(20) NOT NULL,
  CONSTRAINT pk_pad_relatorios PRIMARY KEY (pad_id, tipo_id)
);

-- Aditivos aprovados pela SESAB durante o período do PAD (ex.: antibioticoterapia).
CREATE TABLE pad_aditivos (
  id NVARCHAR(40) NOT NULL,
  pad_id NVARCHAR(40) NOT NULL,
  codigo NVARCHAR(30) NULL,
  tipo NVARCHAR(60) NOT NULL,
  inicio DATE NOT NULL,
  fim DATE NOT NULL,
  situacao NVARCHAR(12) NOT NULL DEFAULT 'solicitado',
  justificativa NVARCHAR(1000) NULL,
  criado_por INT NULL,
  criado_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  avaliado_em DATETIME2 NULL,
  CONSTRAINT pk_pad_aditivos PRIMARY KEY (id),
  CONSTRAINT ck_pad_aditivos_situacao CHECK (situacao IN ('solicitado','aprovado','negado')),
  CONSTRAINT ck_pad_aditivos_periodo CHECK (fim >= inicio)
);

CREATE TABLE pad_aditivo_itens (
  aditivo_id NVARCHAR(40) NOT NULL,
  servico_id NVARCHAR(10) NOT NULL,
  quantidade DECIMAL(12,4) NOT NULL,
  frequencia NVARCHAR(10) NOT NULL,
  data_inicio DATE NULL,
  data_fim DATE NULL,
  observacao NVARCHAR(300) NULL,
  CONSTRAINT pk_pad_aditivo_itens PRIMARY KEY (aditivo_id, servico_id)
);

-- ===================== anexos dos relatórios =====================
-- O arquivo em si fica no armazenamento de arquivos (a definir); aqui ficam só os dados e a chave.
CREATE TABLE relatorios_anexos (
  id BIGINT IDENTITY(1,1) NOT NULL,
  competencia_id CHAR(7) NOT NULL,
  paciente_id NVARCHAR(40) NOT NULL,
  tipo_id NVARCHAR(20) NOT NULL,
  arquivo_chave NVARCHAR(200) NOT NULL,
  arquivo_nome NVARCHAR(255) NOT NULL,
  tamanho_bytes INT NOT NULL,
  paginas INT NOT NULL,
  data_entrega DATE NULL,
  profissional NVARCHAR(120) NULL,
  observacao NVARCHAR(300) NULL,
  enviado_por INT NULL,
  enviado_em DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  situacao NVARCHAR(12) NOT NULL DEFAULT 'vigente',
  substituido_em DATETIME2 NULL,
  removido_motivo NVARCHAR(300) NULL,
  CONSTRAINT pk_relatorios_anexos PRIMARY KEY (id),
  CONSTRAINT ck_relatorios_anexos_situacao CHECK (situacao IN ('vigente','substituido','removido'))
);
CREATE INDEX ix_relatorios_anexos_mes ON relatorios_anexos (competencia_id, paciente_id, tipo_id, situacao);

ALTER TABLE pacote_regras ADD CONSTRAINT fk_pacote_regras_pacote_id FOREIGN KEY (pacote_id) REFERENCES servicos(id);
ALTER TABLE pacote_regras ADD CONSTRAINT fk_pacote_regras_servico_id FOREIGN KEY (servico_id) REFERENCES servicos(id);
ALTER TABLE competencias ADD CONSTRAINT fk_competencias_fechada_por FOREIGN KEY (fechada_por) REFERENCES usuarios(id);
ALTER TABLE lancamentos ADD CONSTRAINT fk_lancamentos_competencia_id FOREIGN KEY (competencia_id) REFERENCES competencias(id);
ALTER TABLE lancamentos ADD CONSTRAINT fk_lancamentos_paciente_id FOREIGN KEY (paciente_id) REFERENCES pacientes(id);
ALTER TABLE lancamentos ADD CONSTRAINT fk_lancamentos_servico_id FOREIGN KEY (servico_id) REFERENCES servicos(id);
ALTER TABLE lancamentos ADD CONSTRAINT fk_lancamentos_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios(id);
ALTER TABLE lancamentos ADD CONSTRAINT fk_lancamentos_alterado_por FOREIGN KEY (alterado_por) REFERENCES usuarios(id);
ALTER TABLE relatorios_status ADD CONSTRAINT fk_relatorios_status_competencia_id FOREIGN KEY (competencia_id) REFERENCES competencias(id);
ALTER TABLE relatorios_status ADD CONSTRAINT fk_relatorios_status_paciente_id FOREIGN KEY (paciente_id) REFERENCES pacientes(id);
ALTER TABLE relatorios_status ADD CONSTRAINT fk_relatorios_status_tipo_id FOREIGN KEY (tipo_id) REFERENCES tipos_relatorio(id);
ALTER TABLE relatorios_status ADD CONSTRAINT fk_relatorios_status_atualizado_por FOREIGN KEY (atualizado_por) REFERENCES usuarios(id);
ALTER TABLE planserv_versoes ADD CONSTRAINT fk_planserv_versoes_importado_por FOREIGN KEY (importado_por) REFERENCES usuarios(id);
ALTER TABLE planserv_medicamentos ADD CONSTRAINT fk_planserv_medicamentos_versao_id FOREIGN KEY (versao_id) REFERENCES planserv_versoes(id);
ALTER TABLE auditoria ADD CONSTRAINT fk_auditoria_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuarios(id);

CREATE INDEX ix_lanc_comp_pac ON lancamentos (competencia_id, paciente_id);
CREATE INDEX ix_planserv_codigo ON planserv_medicamentos (codigo);
CREATE INDEX ix_planserv_versao ON planserv_medicamentos (versao_id);
CREATE INDEX ix_auditoria_em ON auditoria (em);

GO
-- Visão para relatórios/BI: lançamentos com nomes (a regra de pacote é aplicada pela aplicação; ver docs).
CREATE VIEW vw_lancamentos AS
SELECT l.id, l.competencia_id, p.nome AS paciente, p.municipio, s.categoria, s.nome AS servico, s.descricao,
       l.quantidade, l.data_inicio, l.data_fim, l.modo, l.valor_unitario, l.quantidade * l.valor_unitario AS valor_bruto
FROM lancamentos l
JOIN pacientes p ON p.id = l.paciente_id
JOIN servicos s ON s.id = l.servico_id;
GO

ALTER TABLE escala_opcoes ADD CONSTRAINT fk_escala_opcoes_criterio FOREIGN KEY (criterio_id) REFERENCES escala_criterios(id);
ALTER TABLE escala_opcoes ADD CONSTRAINT fk_escala_opcoes_servico FOREIGN KEY (exige_servico_id) REFERENCES servicos(id);
ALTER TABLE escala_faixas ADD CONSTRAINT fk_escala_faixas_servico FOREIGN KEY (servico_id) REFERENCES servicos(id);
ALTER TABLE pads ADD CONSTRAINT fk_pads_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id);
ALTER TABLE pads ADD CONSTRAINT fk_pads_anterior FOREIGN KEY (anterior_id) REFERENCES pads(id) ON DELETE NO ACTION;
ALTER TABLE pads ADD CONSTRAINT fk_pads_pacote FOREIGN KEY (pacote_id) REFERENCES servicos(id);
ALTER TABLE pads ADD CONSTRAINT fk_pads_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios(id);
ALTER TABLE pad_escala ADD CONSTRAINT fk_pad_escala_pad FOREIGN KEY (pad_id) REFERENCES pads(id) ON DELETE CASCADE;
ALTER TABLE pad_itens ADD CONSTRAINT fk_pad_itens_pad FOREIGN KEY (pad_id) REFERENCES pads(id) ON DELETE CASCADE;
ALTER TABLE pad_itens ADD CONSTRAINT fk_pad_itens_servico FOREIGN KEY (servico_id) REFERENCES servicos(id);
ALTER TABLE pad_relatorios ADD CONSTRAINT fk_pad_relatorios_pad FOREIGN KEY (pad_id) REFERENCES pads(id) ON DELETE CASCADE;
ALTER TABLE pad_relatorios ADD CONSTRAINT fk_pad_relatorios_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_relatorio(id);
ALTER TABLE relatorios_anexos ADD CONSTRAINT fk_relatorios_anexos_comp FOREIGN KEY (competencia_id) REFERENCES competencias(id);
ALTER TABLE relatorios_anexos ADD CONSTRAINT fk_relatorios_anexos_pac FOREIGN KEY (paciente_id) REFERENCES pacientes(id);
ALTER TABLE relatorios_anexos ADD CONSTRAINT fk_relatorios_anexos_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_relatorio(id);
ALTER TABLE relatorios_anexos ADD CONSTRAINT fk_relatorios_anexos_por FOREIGN KEY (enviado_por) REFERENCES usuarios(id);
ALTER TABLE pad_aditivos ADD CONSTRAINT fk_pad_aditivos_pad FOREIGN KEY (pad_id) REFERENCES pads(id) ON DELETE CASCADE;
ALTER TABLE pad_aditivos ADD CONSTRAINT fk_pad_aditivos_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios(id);
ALTER TABLE pad_aditivo_itens ADD CONSTRAINT fk_pad_aditivo_itens_aditivo FOREIGN KEY (aditivo_id) REFERENCES pad_aditivos(id) ON DELETE CASCADE;
ALTER TABLE pad_aditivo_itens ADD CONSTRAINT fk_pad_aditivo_itens_servico FOREIGN KEY (servico_id) REFERENCES servicos(id);

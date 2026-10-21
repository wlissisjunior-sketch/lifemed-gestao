-- Sistema de Fechamento LifeMed — esquema MySQL 8 (InnoDB, utf8mb4)
-- Gerado a partir do modelo de dados do sistema. Ordem: tabelas, chaves, índices.

SET NAMES utf8mb4;

-- Pessoas que acessam o sistema (login).
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(200) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  papel VARCHAR(10) NOT NULL DEFAULT 'pendente',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT ck_usuarios_papel CHECK (papel IN ('admin','operador','leitor','pendente'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Pessoas que acessam o sistema (login).';

-- Serviços, pacotes e medicamentos faturáveis (tela Serviços e valores).
CREATE TABLE servicos (
  id VARCHAR(10) NOT NULL,
  ordem INT NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(300) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  eh_pacote TINYINT(1) NOT NULL,
  eh_medicamento TINYINT(1) NOT NULL,
  limite_medicamento DECIMAL(12,2) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT pk_servicos PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Serviços, pacotes e medicamentos faturáveis (tela Serviços e valores).';

-- O que cada pacote já inclui (tela Pacotes e inclusos).
CREATE TABLE pacote_regras (
  pacote_id VARCHAR(10) NOT NULL,
  servico_id VARCHAR(10) NOT NULL,
  limite VARCHAR(5) NOT NULL,
  CONSTRAINT pk_pacote_regras PRIMARY KEY (pacote_id, servico_id),
  CONSTRAINT ck_pacote_regras_limite CHECK (limite IN ('dias','total'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='O que cada pacote já inclui (tela Pacotes e inclusos).';

-- Cadastro de pacientes.
CREATE TABLE pacientes (
  id VARCHAR(40) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  cns CHAR(15) NULL,
  municipio VARCHAR(100) NULL,
  data_admissao DATE NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT pk_pacientes PRIMARY KEY (id),
  CONSTRAINT uq_pacientes_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Cadastro de pacientes.';

-- Meses de fechamento.
CREATE TABLE competencias (
  id CHAR(7) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'aberta',
  fechada_por INT NULL,
  fechada_em DATETIME NULL,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_competencias PRIMARY KEY (id),
  CONSTRAINT ck_competencias_status CHECK (status IN ('aberta','fechada'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Meses de fechamento.';

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
  observacao VARCHAR(300) NULL,
  criado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  alterado_por INT NULL,
  alterado_em DATETIME NULL,
  CONSTRAINT pk_lancamentos PRIMARY KEY (id),
  CONSTRAINT ck_lancamentos_modo CHECK (modo IN ('auto','cobrar')),
  CONSTRAINT ck_lancamentos_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Serviços usados por paciente no mês (tela Checklist).';

-- Tipos de relatório controlados (Médico, Enfermagem…).
CREATE TABLE tipos_relatorio (
  id VARCHAR(20) NOT NULL,
  nome VARCHAR(80) NOT NULL,
  ordem INT NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT pk_tipos_relatorio PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tipos de relatório controlados (Médico, Enfermagem…).';

-- Relatório entregue por paciente e mês (tela Relatórios). Sem linha = pendente.
CREATE TABLE relatorios_status (
  competencia_id CHAR(7) NOT NULL,
  paciente_id VARCHAR(40) NOT NULL,
  tipo_id VARCHAR(20) NOT NULL,
  status VARCHAR(10) NOT NULL,
  atualizado_por INT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_relatorios_status PRIMARY KEY (competencia_id, paciente_id, tipo_id),
  CONSTRAINT ck_relatorios_status_status CHECK (status IN ('entregue','pendente'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Relatório entregue por paciente e mês (tela Relatórios). Sem linha = pendente.';

-- Cada importação da tabela PLANSERV.
CREATE TABLE planserv_versoes (
  id INT AUTO_INCREMENT NOT NULL,
  versao DATE NULL,
  arquivo VARCHAR(255) NOT NULL,
  itens INT NOT NULL,
  importado_por INT NULL,
  importado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vigente TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT pk_planserv_versoes PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Cada importação da tabela PLANSERV.';

-- Itens da tabela PLANSERV.
CREATE TABLE planserv_medicamentos (
  id BIGINT AUTO_INCREMENT NOT NULL,
  versao_id INT NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  descricao VARCHAR(400) NOT NULL,
  fracao VARCHAR(40) NULL,
  unidade VARCHAR(40) NULL,
  valor DECIMAL(12,2) NULL,
  grupo VARCHAR(120) NULL,
  CONSTRAINT pk_planserv_medicamentos PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Itens da tabela PLANSERV.';

-- Valores de referência do Anexo II (dietas e suplementos).
CREATE TABLE dietas_anexo2 (
  id INT NOT NULL,
  descricao VARCHAR(300) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  vigencia VARCHAR(80) NOT NULL,
  CONSTRAINT pk_dietas_anexo2 PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Valores de referência do Anexo II (dietas e suplementos).';

-- Histórico de alterações.
CREATE TABLE auditoria (
  id BIGINT AUTO_INCREMENT NOT NULL,
  em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NULL,
  acao VARCHAR(60) NOT NULL,
  alvo VARCHAR(200) NOT NULL,
  detalhe VARCHAR(1000) NULL,
  CONSTRAINT pk_auditoria PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Histórico de alterações.';

-- ===================== PAD (plano de atenção domiciliar) =====================
-- Escala de complexidade configurável (critérios, opções com pontos e faixas → modalidade).
CREATE TABLE escala_criterios (
  id VARCHAR(20) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  CONSTRAINT pk_escala_criterios PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Critérios da escala de complexidade.';

CREATE TABLE escala_opcoes (
  criterio_id VARCHAR(20) NOT NULL,
  ordem INT NOT NULL,
  texto VARCHAR(160) NOT NULL,
  pontos INT NOT NULL DEFAULT 0,
  exige_servico_id VARCHAR(10) NULL,
  CONSTRAINT pk_escala_opcoes PRIMARY KEY (criterio_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Opções de cada critério; exige_servico_id força a modalidade (ex.: ventilação mecânica).';

CREATE TABLE escala_faixas (
  pontos_min INT NOT NULL,
  servico_id VARCHAR(10) NOT NULL,
  CONSTRAINT pk_escala_faixas PRIMARY KEY (pontos_min)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='A partir de N pontos, a modalidade sugerida.';

CREATE TABLE pads (
  id VARCHAR(40) NOT NULL,
  paciente_id VARCHAR(40) NOT NULL,
  versao INT NOT NULL,
  anterior_id VARCHAR(40) NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'rascunho',
  operadora VARCHAR(80) NULL,
  autorizacao VARCHAR(60) NULL,
  medico VARCHAR(120) NULL,
  crm VARCHAR(30) NULL,
  inicio DATE NOT NULL,
  fim DATE NOT NULL,
  pontos INT NOT NULL DEFAULT 0,
  modalidade_sugerida_id VARCHAR(10) NULL,
  pacote_id VARCHAR(10) NULL,
  motivo_modalidade VARCHAR(500) NULL,
  objetivos TEXT NULL,
  criterios_alta TEXT NULL,
  reavaliacao DATE NULL,
  criado_por INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enviado_em DATETIME NULL,
  autorizado_em DATETIME NULL,
  encerrado_em DATETIME NULL,
  motivo_encerramento VARCHAR(300) NULL,
  CONSTRAINT pk_pads PRIMARY KEY (id),
  CONSTRAINT uq_pads_paciente_versao UNIQUE (paciente_id, versao),
  CONSTRAINT ck_pads_status CHECK (status IN ('rascunho','enviado','autorizado','encerrado')),
  CONSTRAINT ck_pads_periodo CHECK (fim >= inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Plano de atenção domiciliar, uma linha por versão.';

CREATE TABLE pad_escala (
  pad_id VARCHAR(40) NOT NULL,
  criterio_id VARCHAR(20) NOT NULL,
  opcao_ordem INT NOT NULL,
  CONSTRAINT pk_pad_escala PRIMARY KEY (pad_id, criterio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Respostas da avaliação de complexidade.';

CREATE TABLE pad_itens (
  pad_id VARCHAR(40) NOT NULL,
  servico_id VARCHAR(10) NOT NULL,
  quantidade DECIMAL(12,4) NOT NULL,
  frequencia VARCHAR(10) NOT NULL,
  observacao VARCHAR(300) NULL,
  CONSTRAINT pk_pad_itens PRIMARY KEY (pad_id, servico_id),
  CONSTRAINT ck_pad_itens_freq CHECK (frequencia IN ('dia','semana','mes','periodo'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Equipe, equipamentos, medicamentos e insumos previstos no PAD.';

CREATE TABLE pad_relatorios (
  pad_id VARCHAR(40) NOT NULL,
  tipo_id VARCHAR(20) NOT NULL,
  CONSTRAINT pk_pad_relatorios PRIMARY KEY (pad_id, tipo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Relatórios exigidos enquanto o PAD vale.';

-- ===================== anexos dos relatórios =====================
-- O arquivo em si fica no armazenamento de arquivos (a definir); aqui ficam só os dados e a chave.
CREATE TABLE relatorios_anexos (
  id BIGINT AUTO_INCREMENT NOT NULL,
  competencia_id CHAR(7) NOT NULL,
  paciente_id VARCHAR(40) NOT NULL,
  tipo_id VARCHAR(20) NOT NULL,
  arquivo_chave VARCHAR(200) NOT NULL,
  arquivo_nome VARCHAR(255) NOT NULL,
  tamanho_bytes INT NOT NULL,
  paginas INT NOT NULL,
  data_entrega DATE NULL,
  profissional VARCHAR(120) NULL,
  observacao VARCHAR(300) NULL,
  enviado_por INT NULL,
  enviado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  situacao VARCHAR(12) NOT NULL DEFAULT 'vigente',
  substituido_em DATETIME NULL,
  removido_motivo VARCHAR(300) NULL,
  CONSTRAINT pk_relatorios_anexos PRIMARY KEY (id),
  CONSTRAINT ck_relatorios_anexos_situacao CHECK (situacao IN ('vigente','substituido','removido'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='PDFs dos relatórios; o vigente define o status entregue. Versões antigas ficam como histórico.';
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

-- Visão para relatórios/BI: lançamentos com nomes (a regra de pacote é aplicada pela aplicação; ver docs).
CREATE VIEW vw_lancamentos AS
SELECT l.id, l.competencia_id, p.nome AS paciente, p.municipio, s.categoria, s.nome AS servico, s.descricao,
       l.quantidade, l.data_inicio, l.data_fim, l.modo, l.valor_unitario, l.quantidade * l.valor_unitario AS valor_bruto
FROM lancamentos l
JOIN pacientes p ON p.id = l.paciente_id
JOIN servicos s ON s.id = l.servico_id;

ALTER TABLE escala_opcoes ADD CONSTRAINT fk_escala_opcoes_criterio FOREIGN KEY (criterio_id) REFERENCES escala_criterios(id);
ALTER TABLE escala_opcoes ADD CONSTRAINT fk_escala_opcoes_servico FOREIGN KEY (exige_servico_id) REFERENCES servicos(id);
ALTER TABLE escala_faixas ADD CONSTRAINT fk_escala_faixas_servico FOREIGN KEY (servico_id) REFERENCES servicos(id);
ALTER TABLE pads ADD CONSTRAINT fk_pads_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id);
ALTER TABLE pads ADD CONSTRAINT fk_pads_anterior FOREIGN KEY (anterior_id) REFERENCES pads(id);
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

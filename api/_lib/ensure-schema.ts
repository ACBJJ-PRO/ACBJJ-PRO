import pkg from 'pg';
const { Pool } = pkg;

let isSchemaVerified = false;

export async function ensureTablesCreated(pool: InstanceType<typeof Pool>) {
  if (isSchemaVerified) return;

  try {
    const check = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'users' LIMIT 1;");
    if (check.rows && check.rows.length > 0) {
      isSchemaVerified = true;
      return;
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('timeout') || msg.includes('terminated') || msg.includes('ECONN') || msg.includes('ENOTFOUND')) {
      throw err;
    }
  }

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      tipo TEXT DEFAULT 'aluno',
      perfil_label TEXT,
      foto_perfil TEXT,
      status TEXT DEFAULT 'ativo',
      raw_user JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS alunos (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      nome TEXT NOT NULL,
      cpf TEXT,
      rg TEXT,
      email TEXT,
      telefone TEXT,
      data_nascimento TEXT,
      faixa TEXT,
      graus INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ativo',
      academias TEXT,
      professor_responsavel TEXT,
      foto_perfil TEXT,
      raw_student JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS idx_alunos_cpf_unique ON alunos (cpf) WHERE cpf IS NOT NULL AND cpf != '';`,

    `CREATE TABLE IF NOT EXISTS professores (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      faixa TEXT,
      grau INTEGER DEFAULT 0,
      bio TEXT,
      foto_perfil TEXT,
      raw_professor JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS turmas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      modulo TEXT,
      horario TEXT,
      dias TEXT,
      professor TEXT,
      status TEXT DEFAULT 'ativa',
      raw_turma JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS training_schedules (
      id TEXT PRIMARY KEY,
      turma_id TEXT,
      dia_semana TEXT,
      horario_inicio TEXT,
      horario_fim TEXT,
      disciplina TEXT,
      professor TEXT,
      raw_schedule JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS aulas_experimentais (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      turma_id TEXT,
      data TEXT,
      status TEXT DEFAULT 'pendente',
      observacoes TEXT,
      raw_aula JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      aluno_id TEXT,
      turma_id TEXT,
      professor_id TEXT,
      data_hora TEXT NOT NULL,
      status TEXT NOT NULL,
      tipo_checkin TEXT,
      justificativa TEXT,
      raw_checkin JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS justificativas_faltas (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      data_falta TEXT,
      motivo TEXT,
      status TEXT DEFAULT 'pendente',
      foto_comprovante TEXT,
      raw_justificativa JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS carteirinhas (
      id TEXT PRIMARY KEY,
      credential_id TEXT NOT NULL UNIQUE,
      auth_code TEXT NOT NULL UNIQUE,
      entity_type TEXT DEFAULT 'user',
      entity_id TEXT,
      user_id TEXT NOT NULL,
      user_nome TEXT NOT NULL,
      user_tipo TEXT,
      foto_perfil TEXT,
      status TEXT DEFAULT 'ativo',
      validade TEXT,
      registro TEXT,
      qr_token TEXT,
      raw_carteirinha JSONB,
      updated_at TIMESTAMP DEFAULT NOW()
    );`,
    `ALTER TABLE carteirinhas ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'user';`,
    `ALTER TABLE carteirinhas ADD COLUMN IF NOT EXISTS entity_id TEXT;`,

    `CREATE TABLE IF NOT EXISTS carteirinha_logs (
      id TEXT PRIMARY KEY,
      credential_id TEXT,
      user_id TEXT,
      user_nome TEXT,
      data_hora TEXT,
      metodo TEXT,
      resultado TEXT,
      raw_log JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS certificados (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      user_nome TEXT,
      curso TEXT,
      data_emissao TEXT,
      codigo_validacao TEXT,
      status TEXT,
      raw_certificado JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS provas_enviadas (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      user_nome TEXT,
      modulo TEXT,
      nota TEXT,
      status TEXT,
      raw_prova JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS contratos_oficiais (
      id TEXT PRIMARY KEY,
      titulo TEXT,
      versao TEXT,
      ativo BOOLEAN DEFAULT TRUE,
      raw_contrato JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS contrato_aceites (
      id TEXT PRIMARY KEY,
      contrato_id TEXT,
      user_id TEXT,
      data_aceite TEXT,
      raw_aceite JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS digital_contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      doc_type TEXT,
      raw_doc JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS user_digital_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      doc_type TEXT,
      raw_doc JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS notificacoes (
      id TEXT PRIMARY KEY,
      texto TEXT,
      data TEXT,
      para TEXT,
      de TEXT,
      lida BOOLEAN DEFAULT FALSE,
      raw_notificacao JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS publicidades (
      id TEXT PRIMARY KEY,
      titulo TEXT,
      imagem_url TEXT,
      link_url TEXT,
      posicao TEXT DEFAULT 'topo',
      ordem INTEGER DEFAULT 0,
      ativo BOOLEAN DEFAULT TRUE,
      raw_publicidade JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS noticias (
      id TEXT PRIMARY KEY,
      titulo TEXT,
      resumo TEXT,
      conteudo TEXT,
      imagem_url TEXT,
      data TEXT,
      raw_noticia JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      titulo TEXT,
      descricao TEXT,
      video_url TEXT,
      thumb_url TEXT,
      categoria TEXT,
      raw_video JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS live_streams (
      id TEXT PRIMARY KEY,
      titulo TEXT,
      descricao TEXT,
      stream_url TEXT,
      status TEXT,
      raw_live JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS campeonatos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      data TEXT,
      local TEXT,
      status TEXT,
      banner_url TEXT,
      raw_campeonato JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS campeonato_inscricoes (
      id TEXT PRIMARY KEY,
      campeonato_id TEXT,
      atleta_id TEXT,
      atleta_nome TEXT,
      cpf TEXT,
      categoria TEXT,
      status_pagamento TEXT,
      raw_inscricao JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      acao TEXT,
      detalhe TEXT,
      raw_log JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS health_records (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      tipo TEXT,
      raw_record JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS anti_evasion_alerts (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      nivel_risco TEXT,
      raw_alert JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      tipo TEXT,
      raw_event JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS teacher_ai_analyses (
      id TEXT PRIMARY KEY,
      professor_id TEXT,
      aluno_id TEXT,
      raw_analysis JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS student_goals (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      raw_goal JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS student_achievements (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      raw_achievement JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS crm_interactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      aluno_id TEXT,
      raw_interaction JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS backup_records (
      id TEXT PRIMARY KEY,
      raw_backup JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS system_configs (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS calendar_events (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      google_event_id TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      location TEXT,
      synced_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      google_contact_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT,
      phone_number TEXT,
      relationship TEXT,
      notes TEXT,
      synced_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS evaluation_cycles (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      semestre TEXT,
      data_inicio TEXT,
      data_fim TEXT,
      status TEXT DEFAULT 'ativo',
      encerrado BOOLEAN DEFAULT FALSE,
      criado_por TEXT,
      raw_cycle JSONB,
      created_at TEXT,
      updated_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS student_evaluations (
      id TEXT PRIMARY KEY,
      aluno_id TEXT,
      ciclo_id TEXT,
      professor_id TEXT,
      professor_nome TEXT,
      notas JSONB,
      media_final TEXT,
      frequencia_percent TEXT,
      nota_teorica TEXT,
      nota_tecnica TEXT,
      nota_postura TEXT,
      status TEXT,
      aprovado BOOLEAN DEFAULT FALSE,
      observacoes TEXT,
      data_avaliacao TEXT,
      raw_evaluation JSONB,
      created_at TEXT,
      updated_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS evaluation_settings (
      id TEXT PRIMARY KEY,
      nota_minima TEXT,
      frequencia_minima TEXT,
      criterios JSONB,
      pesos JSONB,
      raw_settings JSONB,
      updated_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS mensalidades_alunos (
      id TEXT PRIMARY KEY,
      aluno_id TEXT NOT NULL,
      aluno_nome TEXT,
      valor REAL,
      valor_original REAL,
      desconto REAL,
      competencia TEXT,
      data_vencimento TEXT,
      data_pagamento TEXT,
      status TEXT DEFAULT 'Pendente',
      metodo_pagamento TEXT,
      transaction_id TEXT,
      pix_txid TEXT,
      observacao TEXT,
      raw_mensalidade JSONB,
      created_at TEXT,
      updated_at TEXT
    );`,
  ];

  try {
    await pool.query(ddlStatements.join('\n\n'));
  } catch (err: any) {
    // If batch execution fails, fallback to sequential execution to capture individual statement errors
    console.warn('Batch DDL notice, falling back to sequential statements:', err?.message || String(err));
    for (const statement of ddlStatements) {
      try {
        await pool.query(statement);
      } catch (innerErr: any) {
        console.warn('DDL execution notice:', innerErr?.message || String(innerErr));
      }
    }
  }
  isSchemaVerified = true;
}

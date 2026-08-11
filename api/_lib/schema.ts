import { pgTable, serial, text, integer, boolean, timestamp, jsonb, real } from 'drizzle-orm/pg-core';

// 1. USUÁRIOS
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID / ID de usuario
  email: text('email').notNull(),
  name: text('name'),
  tipo: text('tipo').default('aluno'),
  perfilLabel: text('perfil_label'),
  fotoPerfil: text('foto_perfil'),
  status: text('status').default('ativo'),
  rawUser: jsonb('raw_user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. ALUNOS
export const alunos = pgTable('alunos', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  nome: text('nome').notNull(),
  cpf: text('cpf'),
  rg: text('rg'),
  email: text('email'),
  telefone: text('telefone'),
  dataNascimento: text('data_nascimento'),
  faixa: text('faixa'),
  graus: integer('graus').default(0),
  status: text('status').default('ativo'),
  academias: text('academias'),
  professorResponsavel: text('professor_responsavel'),
  fotoPerfil: text('foto_perfil'),
  rawStudent: jsonb('raw_student'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. PROFESSORES
export const professores = pgTable('professores', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  nome: text('nome').notNull(),
  email: text('email'),
  telefone: text('telefone'),
  faixa: text('faixa'),
  grau: integer('grau').default(0),
  bio: text('bio'),
  fotoPerfil: text('foto_perfil'),
  rawProfessor: jsonb('raw_professor'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. TURMAS
export const turmas = pgTable('turmas', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  modulo: text('modulo'),
  horario: text('horario'),
  dias: text('dias'),
  professor: text('professor'),
  status: text('status').default('ativa'),
  rawTurma: jsonb('raw_turma'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. AGENDA / TRAINING SCHEDULES
export const trainingSchedules = pgTable('training_schedules', {
  id: text('id').primaryKey(),
  turmaId: text('turma_id'),
  diaSemana: text('dia_semana'),
  horarioInicio: text('horario_inicio'),
  horarioFim: text('horario_fim'),
  disciplina: text('disciplina'),
  professor: text('professor'),
  rawSchedule: jsonb('raw_schedule'),
});

// 6. AULAS EXPERIMENTAIS
export const aulasExperimentais = pgTable('aulas_experimentais', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email'),
  telefone: text('telefone'),
  turmaId: text('turma_id'),
  data: text('data'),
  status: text('status').default('pendente'),
  observacoes: text('observacoes'),
  rawAula: jsonb('raw_aula'),
});

// 7. CHECKINS
export const checkins = pgTable('checkins', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  alunoId: text('aluno_id'),
  turmaId: text('turma_id'),
  professorId: text('professor_id'),
  dataHora: text('data_hora').notNull(),
  status: text('status').notNull(), // 'pendente' | 'confirmado' | 'professor'
  tipoCheckin: text('tipo_checkin'),
  justificativa: text('justificativa'),
  rawCheckin: jsonb('raw_checkin'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. JUSTIFICATIVAS DE FALTAS
export const justificativasFaltas = pgTable('justificativas_faltas', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  dataFalta: text('data_falta'),
  motivo: text('motivo'),
  status: text('status').default('pendente'),
  fotoComprovante: text('foto_comprovante'),
  rawJustificativa: jsonb('raw_justificativa'),
});

// 9. CARTEIRINHAS E CREDENCIAIS
export const carteirinhas = pgTable('carteirinhas', {
  id: text('id').primaryKey(),
  credentialId: text('credential_id').notNull().unique(),
  authCode: text('auth_code').notNull().unique(),
  entityType: text('entity_type').default('user'),
  entityId: text('entity_id'),
  userId: text('user_id').notNull(),
  userNome: text('user_nome').notNull(),
  userTipo: text('user_tipo'),
  fotoPerfil: text('foto_perfil'),
  status: text('status').default('ativo'),
  validade: text('validade'),
  registro: text('registro'),
  qrToken: text('qr_token'),
  rawCarteirinha: jsonb('raw_carteirinha'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. CARTEIRINHA LOGS
export const carteirinhaLogs = pgTable('carteirinha_logs', {
  id: text('id').primaryKey(),
  credentialId: text('credential_id'),
  userId: text('user_id'),
  userNome: text('user_nome'),
  dataHora: text('data_hora'),
  metodo: text('metodo'),
  resultado: text('resultado'),
  rawLog: jsonb('raw_log'),
});

// 11. CERTIFICADOS
export const certificados = pgTable('certificados', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  userNome: text('user_nome'),
  curso: text('curso'),
  dataEmissao: text('data_emissao'),
  codigoValidacao: text('codigo_validacao'),
  status: text('status'),
  rawCertificado: jsonb('raw_certificado'),
});

// 12. PROVAS ENVIADAS
export const provasEnviadas = pgTable('provas_enviadas', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  userNome: text('user_nome'),
  modulo: text('modulo'),
  nota: text('nota'),
  status: text('status'),
  rawProva: jsonb('raw_prova'),
});

// 13. CONTRATOS OFICIAIS
export const contratosOficiais = pgTable('contratos_oficiais', {
  id: text('id').primaryKey(),
  titulo: text('titulo'),
  versao: text('versao'),
  ativo: boolean('ativo').default(true),
  rawContrato: jsonb('raw_contrato'),
});

// 14. CONTRATO ACEITES
export const contratoAceites = pgTable('contrato_aceites', {
  id: text('id').primaryKey(),
  contratoId: text('contrato_id'),
  userId: text('user_id'),
  dataAceite: text('data_aceite'),
  rawAceite: jsonb('raw_aceite'),
});

// 15. DIGITAL CONTRACTS & USER DOCUMENTS
export const digitalContracts = pgTable('digital_contracts', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  docType: text('doc_type'),
  rawDoc: jsonb('raw_doc'),
});

export const userDigitalDocuments = pgTable('user_digital_documents', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  docType: text('doc_type'),
  rawDoc: jsonb('raw_doc'),
});

// 16. NOTIFICAÇÕES
export const notificacoes = pgTable('notificacoes', {
  id: text('id').primaryKey(),
  texto: text('texto'),
  data: text('data'),
  para: text('para'),
  de: text('de'),
  lida: boolean('lida').default(false),
  rawNotificacao: jsonb('raw_notificacao'),
});

// 17. PUBLICIDADES
export const publicidades = pgTable('publicidades', {
  id: text('id').primaryKey(),
  titulo: text('titulo'),
  imagemUrl: text('imagem_url'),
  linkUrl: text('link_url'),
  posicao: text('posicao').default('topo'),
  ordem: integer('ordem').default(0),
  ativo: boolean('ativo').default(true),
  rawPublicidade: jsonb('raw_publicidade'),
});

// 18. NOTÍCIAS
export const noticias = pgTable('noticias', {
  id: text('id').primaryKey(),
  titulo: text('titulo'),
  resumo: text('resumo'),
  conteudo: text('conteudo'),
  imagemUrl: text('imagem_url'),
  data: text('data'),
  rawNoticia: jsonb('raw_noticia'),
});

// 19. VÍDEOS
export const videos = pgTable('videos', {
  id: text('id').primaryKey(),
  titulo: text('titulo'),
  descricao: text('descricao'),
  videoUrl: text('video_url'),
  thumbUrl: text('thumb_url'),
  categoria: text('categoria'),
  rawVideo: jsonb('raw_video'),
});

// 20. LIVE STREAMS
export const liveStreams = pgTable('live_streams', {
  id: text('id').primaryKey(),
  titulo: text('titulo'),
  descricao: text('descricao'),
  streamUrl: text('stream_url'),
  status: text('status'),
  rawLive: jsonb('raw_live'),
});

// 21. CAMPEONATOS
export const campeonatos = pgTable('campeonatos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  data: text('data'),
  local: text('local'),
  status: text('status'),
  bannerUrl: text('banner_url'),
  rawCampeonato: jsonb('raw_campeonato'),
});

// 22. CAMPEONATO INSCRIÇÕES
export const campeonatoInscricoes = pgTable('campeonato_inscricoes', {
  id: text('id').primaryKey(),
  campeonatoId: text('campeonato_id'),
  atletaId: text('atleta_id'),
  atletaNome: text('atleta_nome'),
  cpf: text('cpf'),
  categoria: text('categoria'),
  statusPagamento: text('status_pagamento'),
  rawInscricao: jsonb('raw_inscricao'),
});

// 23. AUDIT LOGS, HEALTH RECORDS, CRM, ETC.
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  acao: text('acao'),
  detalhe: text('detalhe'),
  rawLog: jsonb('raw_log'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const healthRecords = pgTable('health_records', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  tipo: text('tipo'),
  rawRecord: jsonb('raw_record'),
});

export const antiEvasionAlerts = pgTable('anti_evasion_alerts', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  nivelRisco: text('nivel_risco'),
  rawAlert: jsonb('raw_alert'),
});

export const timelineEvents = pgTable('timeline_events', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  tipo: text('tipo'),
  rawEvent: jsonb('raw_event'),
});

export const teacherAiAnalyses = pgTable('teacher_ai_analyses', {
  id: text('id').primaryKey(),
  professorId: text('professor_id'),
  alunoId: text('aluno_id'),
  rawAnalysis: jsonb('raw_analysis'),
});

export const studentGoals = pgTable('student_goals', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  rawGoal: jsonb('raw_goal'),
});

export const studentAchievements = pgTable('student_achievements', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  rawAchievement: jsonb('raw_achievement'),
});

export const crmInteractions = pgTable('crm_interactions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  alunoId: text('aluno_id'),
  rawInteraction: jsonb('raw_interaction'),
});

export const backupRecords = pgTable('backup_records', {
  id: text('id').primaryKey(),
  rawBackup: jsonb('raw_backup'),
});

// 24. SYSTEM CONFIGS (key-value store for themes, logos, carousel, etc.)
export const systemConfigs = pgTable('system_configs', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 25. GOOGLE INTEGRATIONS (calendar_events, contacts)
export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  googleEventId: text('google_event_id').unique(),
  title: text('title').notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: text('location'),
  syncedAt: timestamp('synced_at').defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  googleContactId: text('google_contact_id').unique(),
  fullName: text('full_name').notNull(),
  email: text('email'),
  phoneNumber: text('phone_number'),
  relationship: text('relationship'),
  notes: text('notes'),
  syncedAt: timestamp('synced_at').defaultNow(),
});

// 26. EVALUATION CYCLES
export const evaluationCycles = pgTable('evaluation_cycles', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  semestre: text('semestre'),
  dataInicio: text('data_inicio'),
  dataFim: text('data_fim'),
  status: text('status').default('ativo'),
  encerrado: boolean('encerrado').default(false),
  criadoPor: text('criado_por'),
  rawCycle: jsonb('raw_cycle'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// 27. STUDENT EVALUATIONS
export const studentEvaluations = pgTable('student_evaluations', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id'),
  cicloId: text('ciclo_id'),
  professorId: text('professor_id'),
  professorNome: text('professor_nome'),
  notas: jsonb('notas'),
  mediaFinal: text('media_final'),
  frequenciaPercent: text('frequencia_percent'),
  notaTeorica: text('nota_teorica'),
  notaTecnica: text('nota_tecnica'),
  notaPostura: text('nota_postura'),
  status: text('status'),
  aprovado: boolean('aprovado').default(false),
  observacoes: text('observacoes'),
  dataAvaliacao: text('data_avaliacao'),
  rawEvaluation: jsonb('raw_evaluation'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// 28. EVALUATION SETTINGS
export const evaluationSettings = pgTable('evaluation_settings', {
  id: text('id').primaryKey(),
  notaMinima: text('nota_minima'),
  frequenciaMinima: text('frequencia_minima'),
  criterios: jsonb('criterios'),
  pesos: jsonb('pesos'),
  rawSettings: jsonb('raw_settings'),
  updatedAt: text('updated_at'),
});

// 29. MENSALIDADES ALUNOS
export const mensalidadesAlunos = pgTable('mensalidades_alunos', {
  id: text('id').primaryKey(),
  alunoId: text('aluno_id').notNull(),
  alunoNome: text('aluno_nome'),
  valor: real('valor'),
  valorOriginal: real('valor_original'),
  desconto: real('desconto'),
  competencia: text('competencia'),
  dataVencimento: text('data_vencimento'),
  dataPagamento: text('data_pagamento'),
  status: text('status').default('Pendente'),
  metodoPagamento: text('metodo_pagamento'),
  transactionId: text('transaction_id'),
  pixTxid: text('pix_txid'),
  observacao: text('observacao'),
  rawMensalidade: jsonb('raw_mensalidade'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

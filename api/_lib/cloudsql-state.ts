import { db, ensureSchema, isDatabaseUrlConfigured } from './db.js';
import * as schema from './schema.js';
import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_PROFESSORS,
  INITIAL_TURMAS,
  INITIAL_TRAINING_SCHEDULES,
  INITIAL_NEWS,
  INITIAL_VIDEOS,
  INITIAL_CAROUSEL_FOTOS,
} from './initial-data.js';

export const defaultState = {
  usuarios: INITIAL_USERS,
  alunos: INITIAL_STUDENTS,
  professores: INITIAL_PROFESSORS,
  checkinsPendentes: [],
  checkinsConfirmados: [],
  professorCheckins: [],
  notificacoes: [],
  turmas: INITIAL_TURMAS,
  carouselFotos: INITIAL_CAROUSEL_FOTOS,
  provasEnviadas: [],
  evaluationCycles: [],
  studentEvaluations: [],
  evaluationSettings: null,
  avaliacoesCiclos: [],
  avaliacoesRegistros: [],
  avaliacoesConfig: null,
  noticias: INITIAL_NEWS,
  videos: INITIAL_VIDEOS,
  liveStreams: [],
  certificados: [],
  logoApp: '',
  trainingSchedules: INITIAL_TRAINING_SCHEDULES,
  themeKey: 'orange',
  publicidades: [],
  justificativasFaltas: [],
  recuperacoesSenha: [],
  publicidadePosicao: 'topo',
  confrontoInscricoes: [],
  confrontoManutencao: false,
  confrontoCampeonatos: [],
  auditLogs: [],
  healthRecords: [],
  antiEvasionAlerts: [],
  timelineEvents: [],
  teacherAiAnalyses: [],
  studentGoals: [],
  studentAchievements: [],
  crmInteractions: [],
  digitalContracts: [],
  userDigitalDocuments: [],
  backupRecords: [],
  aulasExperimentais: [],
  contratosOficiais: [],
  contratoAceites: [],
};

export async function fetchStateFromCloudSQL() {
  if (!isDatabaseUrlConfigured) {
    console.warn('[Cloud SQL] DATABASE_URL is not configured — returning default state');
    return defaultState;
  }

  try {
    await ensureSchema();
  } catch (schemaErr: any) {
    console.warn('[Cloud SQL] ensureSchema notice — returning default state:', schemaErr?.message || String(schemaErr));
    return defaultState;
  }

  let connectionError: Error | null = null;
  const safeQuery = async <T>(p: Promise<T[]>): Promise<T[]> => {
    if (connectionError) return [];
    try {
      return await p;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('timeout') || msg.includes('terminated') || msg.includes('ECONN') || msg.includes('unreachable')) {
        connectionError = err instanceof Error ? err : new Error(msg);
      }
      console.warn('Table read notice:', msg);
      return [];
    }
  };

  try {
    const [
      usersList,
      alunosList,
      profList,
      turmasList,
      schedulesList,
      aulasExpList,
      checkinsList,
      justifsList,
      carteirinhasList,
      certsList,
      notifsList,
      pubsList,
      noticiasList,
      videosList,
      liveStreamsList,
      campeonatosList,
      inscricoesList,
      provasList,
      cyclesList,
      evalsList,
      settingsList,
      configsList,
      mensalidadesList,
    ] = await Promise.all([
      safeQuery(db.select().from(schema.users)),
      safeQuery(db.select().from(schema.alunos)),
      safeQuery(db.select().from(schema.professores)),
      safeQuery(db.select().from(schema.turmas)),
      safeQuery(db.select().from(schema.trainingSchedules)),
      safeQuery(db.select().from(schema.aulasExperimentais)),
      safeQuery(db.select().from(schema.checkins)),
      safeQuery(db.select().from(schema.justificativasFaltas)),
      safeQuery(db.select().from(schema.carteirinhas)),
      safeQuery(db.select().from(schema.certificados)),
      safeQuery(db.select().from(schema.notificacoes)),
      safeQuery(db.select().from(schema.publicidades)),
      safeQuery(db.select().from(schema.noticias)),
      safeQuery(db.select().from(schema.videos)),
      safeQuery(db.select().from(schema.liveStreams)),
      safeQuery(db.select().from(schema.campeonatos)),
      safeQuery(db.select().from(schema.campeonatoInscricoes)),
      safeQuery(db.select().from(schema.provasEnviadas)),
      safeQuery(db.select().from(schema.evaluationCycles)),
      safeQuery(db.select().from(schema.studentEvaluations)),
      safeQuery(db.select().from(schema.evaluationSettings)),
      safeQuery(db.select().from(schema.systemConfigs)),
      safeQuery(db.select().from(schema.mensalidadesAlunos)),
    ]);

    const stateObj: Record<string, any> = { ...defaultState };

    if (usersList.length > 0) {
      stateObj.usuarios = usersList.map((u) => {
        const raw = (u.rawUser as any) || {};
        const isApproved = u.status === 'ativo' || raw.aprovado === true || raw.status === 'ativo' || u.tipo === 'admin';
        const finalStatus = isApproved ? 'ativo' : (u.status || raw.status || 'pendente');
        return {
          ...raw,
          id: raw.id || Number(u.uid) || u.uid,
          uid: u.uid,
          nome: raw.nome || u.name,
          email: raw.email || u.email,
          tipo: raw.tipo || u.tipo,
          status: finalStatus,
          aprovado: isApproved,
        };
      });
    }

    // Pre-process confirmed student checkin dates by student ID and user ID
    const confirmedCheckinsByAlunoId = new Map<string, Set<string>>();
    const confirmedCheckinsByUserId = new Map<string, Set<string>>();

    for (const c of checkinsList) {
      const isProf = c.tipoCheckin === 'professor' || c.tipoCheckin === 'PROFESSOR' || c.status === 'professor' || c.status === 'PROFESSOR';
      const isConfirmado = c.status?.toLowerCase() === 'confirmado';
      if (!isProf && isConfirmado) {
        const raw = (c.rawCheckin as any) || {};
        const checkinDate = raw.data || (c.dataHora ? c.dataHora.split('T')[0] : null);
        if (checkinDate) {
          const aIdKey = c.alunoId ? String(c.alunoId) : (raw.alunoId ? String(raw.alunoId) : null);
          const uIdKey = c.userId ? String(c.userId) : (raw.userId ? String(raw.userId) : null);
          
          if (aIdKey) {
            if (!confirmedCheckinsByAlunoId.has(aIdKey)) confirmedCheckinsByAlunoId.set(aIdKey, new Set());
            confirmedCheckinsByAlunoId.get(aIdKey)!.add(checkinDate);
          }
          if (uIdKey) {
            if (!confirmedCheckinsByUserId.has(uIdKey)) confirmedCheckinsByUserId.set(uIdKey, new Set());
            confirmedCheckinsByUserId.get(uIdKey)!.add(checkinDate);
          }
        }
      }
    }

    if (alunosList.length > 0) {
      stateObj.alunos = alunosList.map((a) => {
        const raw = (a.rawStudent as any) || {};
        const isActive = a.status === 'ativo' || raw.ativo === true || raw.status === 'ativo' || raw.aprovado === true;
        const finalStatus = isActive ? 'ativo' : (a.status || raw.status || 'pendente');
        const alunoIdStr = String(raw.id || a.id);
        const userIdStr = String(raw.usuarioId || a.userId);

        const dateSet = new Set<string>();

        if (confirmedCheckinsByAlunoId.has(alunoIdStr)) {
          confirmedCheckinsByAlunoId.get(alunoIdStr)!.forEach((d) => dateSet.add(d));
        }
        if (confirmedCheckinsByUserId.has(userIdStr)) {
          confirmedCheckinsByUserId.get(userIdStr)!.forEach((d) => dateSet.add(d));
        }

        if (Array.isArray(raw.checkins)) {
          raw.checkins.forEach((d: any) => {
            if (typeof d === 'string' && d.trim()) {
              dateSet.add(d.trim());
            }
          });
        }

        const mergedCheckins = Array.from(dateSet);

        return {
          ...raw,
          id: raw.id || Number(a.id) || a.id,
          usuarioId: raw.usuarioId || a.userId,
          nome: raw.nome || a.nome,
          status: finalStatus,
          ativo: isActive,
          checkins: mergedCheckins,
        };
      });
    }

    if (profList.length > 0) {
      stateObj.professores = profList.map((p) => (p.rawProfessor as any) || p);
    }
    if (turmasList.length > 0) {
      stateObj.turmas = turmasList.map((t) => (t.rawTurma as any) || t);
    }
    if (schedulesList.length > 0) {
      stateObj.trainingSchedules = schedulesList.map((s) => (s.rawSchedule as any) || s);
    }
    if (aulasExpList.length > 0) {
      stateObj.aulasExperimentais = aulasExpList.map((a) => (a.rawAula as any) || a);
    }

    if (checkinsList.length > 0) {
      stateObj.checkinsPendentes = checkinsList
        .filter((c) => (c.tipoCheckin !== 'professor' && c.tipoCheckin !== 'PROFESSOR') && (c.status?.toLowerCase() === 'pendente'))
        .map((c) => (c.rawCheckin as any) || c);

      stateObj.checkinsConfirmados = checkinsList
        .filter((c) => (c.tipoCheckin !== 'professor' && c.tipoCheckin !== 'PROFESSOR') && (c.status?.toLowerCase() === 'confirmado'))
        .map((c) => (c.rawCheckin as any) || c);

      stateObj.professorCheckins = checkinsList
        .filter((c) => c.tipoCheckin === 'professor' || c.tipoCheckin === 'PROFESSOR' || c.status === 'professor' || c.status === 'PROFESSOR')
        .map((c) => (c.rawCheckin as any) || c);
    }

    if (justifsList.length > 0) stateObj.justificativasFaltas = justifsList.map((j) => (j.rawJustificativa as any) || j);
    if (carteirinhasList.length > 0) stateObj.carteirinhas = carteirinhasList.map((c) => (c.rawCarteirinha as any) || c);
    if (certsList.length > 0) stateObj.certificados = certsList.map((c) => (c.rawCertificado as any) || c);
    if (notifsList.length > 0) stateObj.notificacoes = notifsList.map((n) => (n.rawNotificacao as any) || n);
    if (pubsList.length > 0) stateObj.publicidades = pubsList.map((p) => (p.rawPublicidade as any) || p);
    if (noticiasList.length > 0) stateObj.noticias = noticiasList.map((n) => (n.rawNoticia as any) || n);
    if (videosList.length > 0) stateObj.videos = videosList.map((v) => (v.rawVideo as any) || v);
    if (liveStreamsList.length > 0) stateObj.liveStreams = liveStreamsList.map((l) => (l.rawLive as any) || l);
    if (campeonatosList.length > 0) stateObj.confrontoCampeonatos = campeonatosList.map((c) => (c.rawCampeonato as any) || c);
    if (inscricoesList.length > 0) stateObj.confrontoInscricoes = inscricoesList.map((i) => (i.rawInscricao as any) || i);
    if (mensalidadesList.length > 0) stateObj.mensalidades = mensalidadesList.map((m) => (m.rawMensalidade as any) || m);

    if (provasList.length > 0) {
      stateObj.provasEnviadas = provasList.map((p) => (p.rawProva as any) || p);
    }
    if (cyclesList.length > 0) {
      const parsedCycles = cyclesList.map((c) => (c.rawCycle as any) || c);
      stateObj.evaluationCycles = parsedCycles;
      stateObj.avaliacoesCiclos = parsedCycles;
    }
    if (evalsList.length > 0) {
      const parsedEvals = evalsList.map((e) => (e.rawEvaluation as any) || e);
      stateObj.studentEvaluations = parsedEvals;
      stateObj.avaliacoesRegistros = parsedEvals;
    }
    if (settingsList.length > 0) {
      const parsedSettings = (settingsList[0]?.rawSettings as any) || settingsList[0];
      stateObj.evaluationSettings = parsedSettings;
      stateObj.avaliacoesConfig = parsedSettings;
    }

    if (connectionError) {
      throw connectionError;
    }

    for (const cfg of configsList) {
      stateObj[cfg.key] = cfg.value;
    }

    return stateObj;
  } catch (err: any) {
    console.error('Error reading state from Cloud SQL:', err?.message || String(err));
    throw err;
  }
}

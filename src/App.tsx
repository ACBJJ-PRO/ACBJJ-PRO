import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Student,
  Professor,
  ClassUnit,
  NewsItem,
  VideoItem,
  CertificateItem,
  Notification,
  CheckinRequest,
  SentExam,
  TrainingSchedule,
  PublicidadeItem,
  JustificativaFalta,
  RecuperacaoSenha,
  AulaExperimental,
  LiveStreamItem,
  AuditLog,
  HealthRecord,
  AntiEvasionAlert,
  TimelineEvent,
  TeacherAiAnalysis,
  StudentGoal,
  StudentAchievement,
  CrmInteraction,
  DigitalContract,
  UserDigitalDocument,
  BackupRecord,
  OfficialContract,
  ContractAcceptanceRecord,
  ProfessorCheckinRecord,
  MensalidadeAluno,
  isAdultPerson,
  UserRole,
} from './types';
import { CONTRATOS_INICIAIS } from './data/contratosOficiais';
import { stableStringify, getStableNumericId } from './utils/stableStringify';
import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_PROFESSORS,
  INITIAL_TURMAS,
  INITIAL_NEWS,
  INITIAL_VIDEOS,
  INITIAL_CAROUSEL_FOTOS,
  INITIAL_GRADE,
  INITIAL_LIVE_STREAMS,
} from './data';
import LoginScreen from './components/LoginScreen';
import DashboardPane from './components/DashboardPane';
import AlunosPane from './components/AlunosPane';
import RankingsPane from './components/RankingsPane';
import AvaliacoesPane from './components/AvaliacoesPane';
import ProvasPane from './components/ProvasPane';
import ProvasEAvaliacoesModule from './components/avaliacoes/ProvasEAvaliacoesModule';
import TurmasPane from './components/TurmasPane';
import NoticiasPane from './components/NoticiasPane';
import VideosPane from './components/VideosPane';
import CertificadosPane from './components/CertificadosPane';
import ChatPane from './components/ChatPane';
import NotificacoesCentralPane from './components/NotificacoesCentralPane';
import AlunoArea from './components/AlunoArea';
import ProfessoresPane from './components/ProfessoresPane';
import SolicitacoesPendentesPane from './components/SolicitacoesPendentesPane';
import ProfessoresCheckinPane from './components/ProfessoresCheckinPane';
import CompetitoresCheckinDashboard from './components/CompetitoresCheckinDashboard';
import ResetRequestsPane from './components/ResetRequestsPane';
import GoogleIntegrationsPane from './components/GoogleIntegrationsPane';
import OConfrontoModule from './components/OConfrontoModule';
import AiCentralModal from './components/AiCentralModal';
import AdminSupportPane from './components/AdminSupportPane';
import BirthdayConfetti from './components/BirthdayConfetti';
import CarteirinhaAdminPane from './components/CarteirinhaAdminPane';
import CarteirinhaCard from './components/CarteirinhaCard';
import AgendaAulasExperimentaisPane from './components/AgendaAulasExperimentaisPane';
import EvolucaoEmpresarialPane from './components/EvolucaoEmpresarialPane';
import PlacarModuleGuard from './components/PlacarModuleGuard';
import ProfessorUriCruzPane from './components/ProfessorUriCruzPane';
import CentralPublicidadePane from './components/CentralPublicidadePane';
import PublicCardVerificationModal from './components/PublicCardVerificationModal';
import { getCarteirinhaConfig, getUserCarteirinhaData } from './utils/carteirinhaUtils';

import { fetchFirestoreState, subscribeToFirestoreState, updateFirestoreStateKey } from './lib/firebase';
import {
  getUserScopedNotifications,
  getUserUnreadCount,
  markUserNotifsAsRead,
  deleteUserNotification,
  deleteAllUserNotifications,
  getUserKey,
} from './utils/notificationUtils';

// --- AUTOMATIC SCHEMA MIGRATION & BACKWARD COMPATIBILITY HELPERS ---
export function ensureUserSchema(u: any, alunos: Student[] = [], turmas: ClassUnit[] = []): User {
  if (!u || typeof u !== 'object') {
    return {
      id: Date.now(),
      nome: 'Usuário',
      email: '',
      senha: '123',
      tipo: 'aluno',
      aprovado: true,
      cpf: '',
      fotoPerfil: '',
      whatsapp: '',
      endereco: '',
      tipoSangue: '',
      alergico: 'Nenhum',
      dataNascimento: '',
      turma: '',
    };
  }

  const isMasterAdmin =
    u.tipo === 'admin' ||
    u.email === 'admin@admin.com' ||
    u.email === 'acbjj@acbjj.com.br' ||
    u.email === 'uricruz@gmail.com' ||
    u.email === 'yuricruz@gmail.com' ||
    (u.nome && (u.nome.toUpperCase().includes('ADMINISTRADOR') || u.nome.toUpperCase().includes('URI CRUZ') || u.nome.toUpperCase().includes('YURI CRUZ')));

  const tipo: UserRole = isMasterAdmin
    ? 'admin'
    : (u.tipo || 'aluno');

  // If approved is undefined or null, default to true for existing accounts so they are never locked out!
  const aprovado = isMasterAdmin ? true : (u.aprovado !== undefined && u.aprovado !== null ? Boolean(u.aprovado) : true);

  let userTurma = u.turma || u.turmaId || '';
  let userFaixa = u.faixa || u.graduacao || '';
  let userCpf = u.cpf || '';
  let userWhatsapp = u.whatsapp || '';

  // Cross-reference with alunos array if user is an aluno and missing turma/faixa/cpf
  if (tipo === 'aluno' && Array.isArray(alunos) && alunos.length > 0) {
    const matchingStudent = alunos.find((a) => {
      if (!a) return false;
      if (u.id && a.usuarioId && Number(a.usuarioId) === Number(u.id)) return true;
      if (userCpf && a.cpf && userCpf.replace(/\D/g, '') === a.cpf.replace(/\D/g, '')) return true;
      if (u.email && a.email && u.email.toLowerCase().trim() === a.email.toLowerCase().trim()) return true;
      if (u.nome && a.nome && u.nome.toUpperCase().trim() === a.nome.toUpperCase().trim()) return true;
      return false;
    });

    if (matchingStudent) {
      if (!userTurma) userTurma = matchingStudent.turma || matchingStudent.turmaId || '';
      if (!userFaixa) userFaixa = matchingStudent.faixa || matchingStudent.graduacao || '';
      if (!userCpf) userCpf = matchingStudent.cpf || '';
      if (!userWhatsapp) userWhatsapp = matchingStudent.whatsapp || '';
    }
  }

  const resUser = {
    ...u,
    id: getStableNumericId(u, 1000),
    nome: isMasterAdmin ? 'YURI CRUZ' : (u.nome || 'Usuário'),
    email: u.email || '',
    senha: u.senha || '123456',
    tipo,
    aprovado,
    fotoPerfil: u.fotoPerfil || '',
    whatsapp: userWhatsapp,
    endereco: u.endereco || '',
    tipoSangue: u.tipoSangue || '',
    alergico: u.alergico || 'Nenhum',
    dataNascimento: u.dataNascimento || '',
    cpf: isMasterAdmin ? '123.456.789-12' : userCpf,
    rg: u.rg || '',
    turma: userTurma,
    turmaId: u.turmaId || userTurma,
    graduacao: userFaixa,
    faixa: userFaixa,
    perfilLabel: u.perfilLabel || '',
    statusAnuidade: u.statusAnuidade || 'Em Dia',
    statusMensalidade: u.statusMensalidade || 'Em Dia',
    exameSaudeData: u.exameSaudeData || '',
    peso: u.peso || '',
    altura: u.altura || '',
    observacoesMedicas: u.observacoesMedicas || '',
    dataInscricao: u.dataInscricao || u.createdAt || '2025-01-01T00:00:00.000Z',
  };
  return JSON.parse(JSON.stringify(resUser));
}

export function ensureStudentSchema(a: any, usuarios: User[] = []): Student {
  if (!a || typeof a !== 'object') {
    return {
      id: Date.now(),
      usuarioId: null,
      nome: 'Aluno Sem Nome',
      email: '',
      cpf: '',
      whatsapp: '',
      faixa: 'Branca',
      graduacao: 'Branca',
      turma: '',
      turmaId: '',
      dataNascimento: '',
      idade: 18,
      endereco: '',
      tipoSangue: '',
      alergico: 'Nenhum',
      fotoPerfil: '',
      ativo: true,
      checkins: [],
      pontosCompeticao: 0,
      notaAvaliacao: null,
      mediaGeral: 0,
      medalhasOuro: 0,
      medalhasPrata: 0,
      medalhasBronze: 0,
      presencas: 0,
      historicoGraduacoes: [],
      createdAt: '2025-01-01T00:00:00.000Z',
    };
  }

  let usuarioId = a.usuarioId;
  let studentTurma = a.turma || a.turmaId || '';
  let studentCpf = a.cpf || '';
  let studentFaixa = a.faixa || a.graduacao || 'Branca';
  let studentWhatsapp = a.whatsapp || '';

  if (Array.isArray(usuarios) && usuarios.length > 0) {
    const matchingUser = usuarios.find((u) => {
      if (!u) return false;
      if (a.usuarioId && Number(u.id) === Number(a.usuarioId)) return true;
      if (studentCpf && u.cpf && studentCpf.replace(/\D/g, '') === u.cpf.replace(/\D/g, '')) return true;
      if (a.email && u.email && a.email.toLowerCase().trim() === u.email.toLowerCase().trim()) return true;
      if (a.nome && u.nome && a.nome.toUpperCase().trim() === u.nome.toUpperCase().trim()) return true;
      return false;
    });

    if (matchingUser) {
      if (!usuarioId) usuarioId = matchingUser.id;
      if (!studentTurma) studentTurma = matchingUser.turma || matchingUser.turmaId || '';
      if (!studentFaixa) studentFaixa = matchingUser.faixa || matchingUser.graduacao || 'Branca';
      if (!studentCpf) studentCpf = matchingUser.cpf || '';
      if (!studentWhatsapp) studentWhatsapp = matchingUser.whatsapp || '';
    }
  }

  const resStudent = {
    ...a,
    id: getStableNumericId(a, 2000),
    usuarioId: usuarioId ? Number(usuarioId) : (a.usuarioId ?? null),
    nome: a.nome || 'Aluno Sem Nome',
    email: a.email || '',
    cpf: studentCpf,
    whatsapp: studentWhatsapp,
    faixa: studentFaixa,
    graduacao: studentFaixa,
    turma: studentTurma,
    turmaId: a.turmaId || studentTurma,
    dataNascimento: a.dataNascimento || '',
    idade: typeof a.idade === 'number' ? a.idade : 18,
    endereco: a.endereco || '',
    tipoSangue: a.tipoSangue || '',
    alergico: a.alergico || 'Nenhum',
    fotoPerfil: a.fotoPerfil || '',
    ativo: a.ativo !== undefined ? Boolean(a.ativo) : true,
    checkins: Array.isArray(a.checkins) ? a.checkins : [],
    pontosCompeticao: typeof a.pontosCompeticao === 'number' ? a.pontosCompeticao : 0,
    notaAvaliacao: a.notaAvaliacao !== undefined ? a.notaAvaliacao : null,
    mediaGeral: typeof a.mediaGeral === 'number' ? a.mediaGeral : 0,
    medalhasOuro: typeof a.medalhasOuro === 'number' ? a.medalhasOuro : 0,
    medalhasPrata: typeof a.medalhasPrata === 'number' ? a.medalhasPrata : 0,
    medalhasBronze: typeof a.medalhasBronze === 'number' ? a.medalhasBronze : 0,
    presencas: typeof a.presencas === 'number' ? a.presencas : 0,
    historicoGraduacoes: Array.isArray(a.historicoGraduacoes) ? a.historicoGraduacoes : [],
    createdAt: a.createdAt || '2025-01-01T00:00:00.000Z',
  };
  return JSON.parse(JSON.stringify(resStudent));
}

export function ensureProfessorSchema(p: any, usuarios: User[] = []): Professor {
  if (!p || typeof p !== 'object') {
    return {
      id: Date.now(),
      nome: 'Professor Sem Nome',
      email: '',
      aprovado: true,
      cpf: '',
      whatsapp: '',
      faixa: 'Preta',
      grau: '1º Grau',
      turmasResponsaveis: [],
    };
  }

  let usuarioId = p.usuarioId;
  let profCpf = p.cpf || '';
  let profWhatsapp = p.whatsapp || '';

  if (Array.isArray(usuarios) && usuarios.length > 0) {
    const matchingUser = usuarios.find((u) => {
      if (!u) return false;
      if (p.usuarioId && Number(u.id) === Number(p.usuarioId)) return true;
      if (profCpf && u.cpf && profCpf.replace(/\D/g, '') === u.cpf.replace(/\D/g, '')) return true;
      if (p.email && u.email && p.email.toLowerCase().trim() === u.email.toLowerCase().trim()) return true;
      if (p.nome && u.nome && p.nome.toUpperCase().trim() === u.nome.toUpperCase().trim()) return true;
      return false;
    });

    if (matchingUser) {
      if (!usuarioId) usuarioId = matchingUser.id;
      if (!profCpf) profCpf = matchingUser.cpf || '';
      if (!profWhatsapp) profWhatsapp = matchingUser.whatsapp || '';
    }
  }

  const result = {
    ...p,
    id: getStableNumericId(p, 3000),
    nome: p.nome || 'Professor Sem Nome',
    email: p.email || '',
    cpf: profCpf,
    whatsapp: profWhatsapp,
    faixa: p.faixa || 'Preta',
    grau: p.grau || '1º Grau',
    usuarioId: usuarioId ? Number(usuarioId) : null,
    turmasResponsaveis: Array.isArray(p.turmasResponsaveis) ? p.turmasResponsaveis : [],
  };
  return JSON.parse(JSON.stringify(result));
}

import {
  LogOut,
  User as UserIcon,
  Shield,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Grid,
  Heart,
  AlertCircle,
  X,
  Plus,
  Trophy,
  Users,
  Bell,
  Trash2,
  Phone,
  Cake,
  MessageCircle,
  Newspaper,
  PlayCircle,
  FileText,
  Menu,
  CheckCircle,
  XCircle,
  KeyRound,
  ChevronRight,
  Bot,
  Ticket,
  CreditCard,
  ShieldAlert,
  Wallet,
  ShieldCheck,
  Edit2,
  Timer,
  GraduationCap,
  UserCheck,
  Megaphone,
  RefreshCw,
} from 'lucide-react';

export const maskPhone = (val: string) => {
  if (!val) return '';
  const clean = val.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
  }
  return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '');
};

export const maskCPF = (val: string) => {
  if (!val) return '';
  const clean = val.replace(/\D/g, '').slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export function formatDiasSemana(diasStr: string): string {
  if (!diasStr) return '';
  const dias = diasStr.split(', ');
  const formattedDays = dias.map(d => d.replace('-feira', ''));
  if (formattedDays.length === 1) return diasStr; // Keep full name if only 1 day, e.g. "Segunda-feira"
  const lastDay = formattedDays[formattedDays.length - 1];
  const otherDays = formattedDays.slice(0, -1);
  return `${otherDays.join(', ')} e ${lastDay}`;
}

export function sanitizeProfName(pName?: string): string {
  if (!pName) return 'PROFESSOR YURI CRUZ';
  let clean = pName.replace(/Y+URI/gi, 'YURI').replace(/\bURI\b/gi, 'YURI');
  if (clean.toUpperCase().includes('ADMINISTRADOR') || clean.toUpperCase() === 'ADMIN') {
    return 'PROFESSOR YURI CRUZ';
  }
  return clean;
}

export default function App() {
  const [publicVerificationCode, setPublicVerificationCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/verify/card/')) {
      const raw = decodeURIComponent(path.replace('/verify/card/', ''));
      return raw.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();
    }
    if (path.startsWith('/carteirinha/')) {
      const raw = decodeURIComponent(path.replace('/carteirinha/', ''));
      return raw.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('verify')) {
      return params.get('verify')!.trim();
    }
    if (params.get('code')) {
      return params.get('code')!.trim();
    }
    return null;
  });

  // --- REAL-TIME SYNC ENGINE ---
  const initialMountRef = useRef<{ [key: string]: boolean }>({});
  const hasInitialFetchedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratedRef = useRef(false);
  
  useEffect(() => {
    isHydratedRef.current = isHydrated;
  }, [isHydrated]);

  const syncIgnoreKeysRef = useRef<{ [key: string]: string }>({});
  const lastSyncedValueRef = useRef<{ [key: string]: string }>({});
  const lastLocalUpdateRef = useRef<{ [key: string]: number }>({});

  const syncState = async (key: string, value: any) => {
    if (!key || value === undefined) return;
    
    // CRITICAL: Prevent initial mount default state from overwriting Firestore/Cloud SQL before cloud hydration completes
    if (!isHydratedRef.current) {
      return;
    }

    const cleanVal = JSON.parse(JSON.stringify(value));
    const valueStr = stableStringify(cleanVal);
    
    // Ignore server echo if this exact payload was just received from a remote sync
    if (syncIgnoreKeysRef.current[key] === valueStr) {
      return;
    }

    if (lastSyncedValueRef.current[key] === valueStr) {
      return;
    }
    
    lastSyncedValueRef.current[key] = valueStr;
    lastLocalUpdateRef.current[key] = Date.now();

    // Always update Cloud SQL directly via HTTP API
    try {
      const res = await fetch('/api/update-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: cleanVal }),
      });
      if (!res.ok) {
        console.warn('HTTP api/update-state warning status:', res.status, key);
      }
    } catch (apiErr) {
      console.warn('HTTP api/update-state notice:', key, apiErr);
    }

    // Also update Firestore via SDK (forceImmediate = true)
    try {
      await updateFirestoreStateKey(key, cleanVal, true);
    } catch (e) {
      console.warn('Direct Firestore sync notice:', key, e);
    }
  };

  const processDataUpdate = (data: any, isInitialHydration = false) => {
    try {
      if (!data || typeof data !== 'object') return;

      // 1. UNIVERSAL SYNC FOR ALL FIRESTORE KEYS: Sync any incoming key to LocalStorage and dispatch window sync events
      Object.keys(data).forEach((key) => {
        const val = data[key];
        if (val !== undefined && val !== null) {
          try {
            const valStr = typeof val === 'string' ? val : JSON.stringify(val);
            if (localStorage.getItem(key) !== valStr) {
              localStorage.setItem(key, valStr);
            }
            if (key === 'themeKey') {
              localStorage.setItem('arena_theme_key', valStr);
            }
          } catch (e) {}
          window.dispatchEvent(new CustomEvent('arena_firestore_sync', { detail: { key, value: val } }));
          window.dispatchEvent(new Event('storage'));
        }
      });

      const safeSync = (key: string, value: any, setter: (val: any) => void) => {
        if (value === undefined || value === null) return;
        // CRITICAL: Do not overwrite local user state if a local update was performed in the last 5 seconds (except during initial hydration)
        if (!isInitialHydration && isHydratedRef.current && lastLocalUpdateRef.current[key] && Date.now() - lastLocalUpdateRef.current[key] < 5000) {
          return;
        }
        const cleanVal = JSON.parse(JSON.stringify(value));
        const valueStr = stableStringify(cleanVal);
        syncIgnoreKeysRef.current[key] = valueStr;
        lastSyncedValueRef.current[key] = valueStr;
        setter((prev: any) => {
          const prevStr = stableStringify(prev);
          if (prevStr !== valueStr) {
            return cleanVal;
          }
          return prev;
        });
      };

      if (data.usuarios) safeSync('usuarios', data.usuarios, setUsuarios);
      if (data.alunos) safeSync('alunos', data.alunos, setAlunos);
      if (data.professores) safeSync('professores', data.professores, setProfessores);
      if (data.checkinsPendentes) safeSync('checkinsPendentes', data.checkinsPendentes, setCheckinsPendentes);
      if (data.checkinsConfirmados) safeSync('checkinsConfirmados', data.checkinsConfirmados, setCheckinsConfirmados);
      if (data.professorCheckins) safeSync('professorCheckins', data.professorCheckins, setProfessorCheckins);
      if (data.notificacoes) safeSync('notificacoes', data.notificacoes, setNotificacoes);
      if (data.turmas) safeSync('turmas', data.turmas, setTurmas);
      if (data.carouselFotos) safeSync('carouselFotos', data.carouselFotos, setCarouselFotos);
      if (data.provasEnviadas) safeSync('provasEnviadas', data.provasEnviadas, setProvasEnviadas);
      if (data.noticias) safeSync('noticias', data.noticias, setNoticias);
      if (data.videos) safeSync('videos', data.videos, setVideos);
      if (data.liveStreams) safeSync('liveStreams', data.liveStreams, setLiveStreams);
      if (data.certificados) safeSync('certificados', data.certificados, setCertificados);
      if (data.logoApp !== undefined) safeSync('logoApp', data.logoApp, setLogoApp);
      if (data.trainingSchedules) safeSync('trainingSchedules', data.trainingSchedules, setTrainingSchedules);
      if (data.themeKey) safeSync('themeKey', data.themeKey, setThemeKey);
      if (data.publicidades) safeSync('publicidades', data.publicidades, setPublicidades);
      if (data.exibirPublicidadeAdmin !== undefined) safeSync('exibirPublicidadeAdmin', data.exibirPublicidadeAdmin, setExibirPublicidadeAdmin);
      if (data.justificativasFaltas) safeSync('justificativasFaltas', data.justificativasFaltas, setJustificativasFaltas);
      if (data.recuperacoesSenha) safeSync('recuperacoesSenha', data.recuperacoesSenha, setRecuperacoesSenha);
      if (data.publicidadePosicao !== undefined) safeSync('publicidadePosicao', data.publicidadePosicao, setPublicidadePosicao);
      if (data.confrontoInscricoes) safeSync('confrontoInscricoes', data.confrontoInscricoes, setConfrontoInscricoes);
      if (data.confrontoManutencao !== undefined) safeSync('confrontoManutencao', data.confrontoManutencao, setConfrontoManutencao);
      if (data.confrontoCampeonatos) safeSync('confrontoCampeonatos', data.confrontoCampeonatos, setConfrontoCampeonatos);
      if (data.auditLogs) safeSync('auditLogs', data.auditLogs, setAuditLogs);
      if (data.healthRecords) safeSync('healthRecords', data.healthRecords, setHealthRecords);
      if (data.antiEvasionAlerts) safeSync('antiEvasionAlerts', data.antiEvasionAlerts, setAntiEvasionAlerts);
      if (data.timelineEvents) safeSync('timelineEvents', data.timelineEvents, setTimelineEvents);
      if (data.teacherAiAnalyses) safeSync('teacherAiAnalyses', data.teacherAiAnalyses, setTeacherAiAnalyses);
      if (data.studentGoals) safeSync('studentGoals', data.studentGoals, setStudentGoals);
      if (data.studentAchievements) safeSync('studentAchievements', data.studentAchievements, setStudentAchievements);
      if (data.crmInteractions) safeSync('crmInteractions', data.crmInteractions, setCrmInteractions);
      if (data.digitalContracts) safeSync('digitalContracts', data.digitalContracts, setDigitalContracts);
      if (data.userDigitalDocuments) safeSync('userDigitalDocuments', data.userDigitalDocuments, setUserDigitalDocuments);
      if (data.backupRecords) safeSync('backupRecords', data.backupRecords, setBackupRecords);
      if (data.aulasExperimentais) safeSync('aulasExperimentais', data.aulasExperimentais, setAulasExperimentais);
      if (data.contratosOficiais) safeSync('contratosOficiais', data.contratosOficiais, setContratosOficiais);
      if (data.contratoAceites) safeSync('contratoAceites', data.contratoAceites, setContratoAceites);
      if (data.mensalidades) safeSync('mensalidades', data.mensalidades, setMensalidades);
    } catch (err) {
      console.warn('Error processing data update:', err);
    } finally {
      isHydratedRef.current = true;
      hasInitialFetchedRef.current = true;
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchLatestData = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        if (active && !isHydratedRef.current) {
          console.warn('Hydration timeout reached (3s), unblocking UI');
          isHydratedRef.current = true;
          setIsHydrated(true);
        }
      }, 3000);

      try {
        const response = await fetch('/api/data', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (active) {
            processDataUpdate(data, true);
          }
        } else {
          console.warn('HTTP fetch /api/data non-200 status:', response.status);
          if (active) {
            isHydratedRef.current = true;
            setIsHydrated(true);
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn('HTTP fetch /api/data notice:', err);
        if (active) {
          isHydratedRef.current = true;
          setIsHydrated(true);
        }
      }
    };

    fetchLatestData();

    // Real-time listener specifically for modules requiring instant updates (Central de Atendimento & Campeonatos)
    const realtimeKeys = [
      'notificacoes',
      'arena_support_protocols',
      'arena_admin_incidents',
      'arena_admin_audit_logs',
      'arena_ai_suggestions',
      'confrontoInscricoes',
      'confrontoManutencao',
      'confrontoCampeonatos',
      'confrontoPixKey',
      'confrontoModalidades',
      'confrontoCupons',
    ];

    const unsubscribeFirestore = subscribeToFirestoreState((data) => {
      if (active) {
        processDataUpdate(data, false);
      }
    }, realtimeKeys);

    return () => {
      active = false;
      unsubscribeFirestore();
    };
  }, []);

  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshingData(true);
    try {
      const data = await fetchFirestoreState();
      if (data) {
        processDataUpdate(data);
      }
    } catch (e) {
      console.warn('Manual refresh notice:', e);
    } finally {
      setTimeout(() => setIsRefreshingData(false), 600);
    }
  };

  // --- SAFE STORAGE HELPER ---
  function safeStorageParse<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      return parsed ?? fallback;
    } catch (e) {
      console.warn(`Notice parsing localStorage key "${key}":`, e);
      return fallback;
    }
  }

  // --- CORE STORAGE LOADING ---
  const [usuarios, setUsuarios] = useState<User[]>(() => {
    let list: User[] = safeStorageParse('arena_usuarios', INITIAL_USERS);
    if (!Array.isArray(list) || list.length === 0) list = INITIAL_USERS;

    const isUriOrAdmin = (u: User) => {
      if (!u) return false;
      return (
        u.tipo === 'admin' ||
        u.email === 'admin@admin.com' ||
        u.email === 'uricruz@gmail.com' ||
        u.email === 'yuricruz@gmail.com' ||
        u.email === 'acbjj@acbjj.com.br' ||
        (u.nome && (u.nome.toUpperCase().includes('ADMINISTRADOR') || u.nome.toUpperCase().includes('URI CRUZ') || u.nome.toUpperCase().includes('YURI CRUZ')))
      );
    };

    // Remove any user claiming to be 'aluno' if they are the admin/YURI CRUZ
    list = list.filter((u) => {
      if (u.tipo === 'aluno' && isUriOrAdmin(u)) return false;
      return true;
    });

    // Deduplicate admin accounts so there is only 1 master Admin account in list
    let seenAdmin = false;
    const cleanList: User[] = [];
    for (const u of list) {
      if (isUriOrAdmin(u)) {
        if (seenAdmin) continue; // Skip duplicate admin user
        seenAdmin = true;
      }
      cleanList.push(u);
    }

    const hasAdmin = cleanList.some((u) => u && isUriOrAdmin(u));
    if (!hasAdmin) {
      cleanList.push({
        id: 1,
        email: 'acbjj@acbjj.com.br',
        senha: '123',
        nome: 'YURI CRUZ',
        tipo: 'admin',
        aprovado: true,
        fotoPerfil: '',
        whatsapp: '(11) 98888-7777',
        endereco: 'Rua das Lutas, 450 - São Paulo',
        tipoSangue: 'A+',
        alergico: 'Nenhum',
        dataNascimento: '1980-01-01',
        cpf: '123.456.789-12',
      });
    }

    const rawAlunos = safeStorageParse<Student[]>('arena_alunos', INITIAL_STUDENTS);
    return cleanList.map((u) => ensureUserSchema(u, rawAlunos, []));
  });

  const [alunos, setAlunos] = useState<Student[]>(() => {
    const raw = safeStorageParse('arena_alunos', INITIAL_STUDENTS);
    if (!Array.isArray(raw)) return INITIAL_STUDENTS;
    const rawUsers = safeStorageParse<User[]>('arena_usuarios', INITIAL_USERS);
    return raw
      .filter((a) => {
        const isUriOrAdmin =
          (a.nome && (a.nome.toUpperCase().includes('URI CRUZ') || a.nome.toUpperCase().includes('YURI CRUZ') || a.nome.toUpperCase().includes('ADMINISTRADOR'))) ||
          (a.email && (a.email.includes('admin') || a.email.includes('uricruz') || a.email.includes('yuricruz') || a.email.includes('acbjj')));
        return !isUriOrAdmin;
      })
      .map((a) => ensureStudentSchema(a, rawUsers));
  });

  const [professores, setProfessores] = useState<Professor[]>(() => {
    const raw = safeStorageParse('arena_professores', INITIAL_PROFESSORS);
    if (!Array.isArray(raw)) return INITIAL_PROFESSORS;
    const rawUsers = safeStorageParse<User[]>('arena_usuarios', INITIAL_USERS);
    return raw.map((p) => ensureProfessorSchema(p, rawUsers));
  });

  const usuariosRef = useRef(usuarios);
  const alunosRef = useRef(alunos);

  useEffect(() => { usuariosRef.current = usuarios; }, [usuarios]);
  useEffect(() => { alunosRef.current = alunos; }, [alunos]);

  const [checkinsPendentes, setCheckinsPendentes] = useState<CheckinRequest[]>(() => safeStorageParse('arena_checkinsPendentes', []));

  const [checkinsConfirmados, setCheckinsConfirmados] = useState<CheckinRequest[]>(() => safeStorageParse('arena_checkinsConfirmados', []));

  const [professorCheckins, setProfessorCheckins] = useState<ProfessorCheckinRecord[]>(() => safeStorageParse('arena_professorCheckins', []));

  const [checkinSubTab, setCheckinSubTab] = useState<'competidores' | 'professores' | 'professorUriCruz'>('competidores');

  const [alertQueue, setAlertQueue] = useState<{ id: string; message: string }[]>([]);

  useEffect(() => {
    const customAlert = (msg: string) => {
      if (!msg) return;
      setAlertQueue((prev) => [...prev, { id: Math.random().toString(), message: String(msg) }]);
    };
    window.alert = customAlert;
  }, []);

  const [notificacoes, setNotificacoes] = useState<Notification[]>(() => safeStorageParse('arena_notificacoes', [
    {
      id: 'init-1',
      texto: 'Seja bem-vindo à Arena do Competidor! Aqui você acompanha seus treinos, graduações e notas das provas teóricas.',
      data: new Date().toLocaleString('pt-BR'),
      para: 'Enviar para todos',
      de: 'PROFESSOR YURI CRUZ',
    },
  ]));

  const [turmas, setTurmas] = useState<ClassUnit[]>(() => {
    const list = safeStorageParse<ClassUnit[]>('arena_turmas', INITIAL_TURMAS);
    return list.map((t) => ({ ...t, professorNome: sanitizeProfName(t.professorNome) }));
  });

  const turmasRef = useRef(turmas);
  useEffect(() => { turmasRef.current = turmas; }, [turmas]);

  const [carouselFotos, setCarouselFotos] = useState<string[]>(() => safeStorageParse('arena_carousel', INITIAL_CAROUSEL_FOTOS));

  const [carouselPaginas, setCarouselPaginas] = useState<string[]>(() => safeStorageParse('arena_carousel_paginas', ['inicio']));

  useEffect(() => {
    try {
      localStorage.setItem('arena_carousel_paginas', JSON.stringify(carouselPaginas));
    } catch (e) {
      console.warn(e);
    }
  }, [carouselPaginas]);

  const [provasEnviadas, setProvasEnviadas] = useState<SentExam[]>(() => safeStorageParse('arena_provas', []));

  const [noticias, setNoticias] = useState<NewsItem[]>(() => safeStorageParse('arena_noticias', INITIAL_NEWS));

  const [videos, setVideos] = useState<VideoItem[]>(() => safeStorageParse('arena_videos', INITIAL_VIDEOS));

  const [liveStreams, setLiveStreams] = useState<LiveStreamItem[]>(() => safeStorageParse('arena_live_streams', INITIAL_LIVE_STREAMS));

  const [certificados, setCertificados] = useState<CertificateItem[]>(() => safeStorageParse('arena_certificados', []));

  const [logoApp, setLogoApp] = useState<string>(() => {
    const saved = localStorage.getItem('arena_logo');
    if (!saved || (!saved.startsWith('data:image/') && !saved.startsWith('http://') && !saved.startsWith('https://') && !saved.startsWith('blob:'))) {
      return '';
    }
    return saved;
  });

  const [aulasExperimentais, setAulasExperimentais] = useState<AulaExperimental[]>(() => {
    const saved = localStorage.getItem('arena_aulas_experimentais');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return [
      {
        id: 'exp_1',
        nome: 'CARLOS EDUARDO SILVA',
        whatsapp: '(11) 98765-4321',
        email: 'carlos.eduardo@gmail.com',
        turma: 'Jiu-Jitsu Adulto',
        horario: '19:00 - 20:30',
        dataAula: new Date().toISOString().split('T')[0],
        status: 'Pendente',
        professorNome: 'Mestre Carlos Gracie',
        observacoes: 'Deseja conhecer a estrutura da academia.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp_2',
        nome: 'FERNANDA LIMA',
        whatsapp: '(11) 97654-3210',
        email: 'fernanda.lima@outlook.com',
        turma: 'Feminino',
        horario: '18:00 - 19:00',
        dataAula: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'Confirmado',
        professorNome: 'Mestre Carlos Gracie',
        observacoes: 'Iniciante, indicação de aluna.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp_3',
        nome: 'LUCAS GABRIEL SANTOS',
        whatsapp: '(11) 96543-2109',
        email: 'lucas.santos@hotmail.com',
        turma: 'Jiu-Jitsu Infantil',
        horario: '17:00 - 18:00',
        dataAula: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        status: 'Concluído',
        professorNome: 'Instrutor Rodrigo',
        observacoes: 'Participante da aula experimental infantil.',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('arena_aulas_experimentais', JSON.stringify(aulasExperimentais));
    } catch (e) {
      console.warn(e);
    }
    syncState('aulasExperimentais', aulasExperimentais);
  }, [aulasExperimentais]);

  // Auto-expire unconfirmed experimental class registrations & presence deadlines past 23:59 to "Justificado"
  useEffect(() => {
    const checkExpiredDeadlines = () => {
      const hojeStr = new Date().toISOString().split('T')[0];

      // Convert past unconfirmed 'Pendente' registrations to 'Justificado'
      setAulasExperimentais((prev) => {
        let changed = false;
        const updated = prev.map((aula) => {
          if (aula.status === 'Pendente' && aula.dataAula && aula.dataAula < hojeStr) {
            changed = true;
            return { ...aula, status: 'Justificado' as const };
          }
          return aula;
        });
        return changed ? updated : prev;
      });
    };

    checkExpiredDeadlines();
    const interval = setInterval(checkExpiredDeadlines, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const [trainingSchedules, setTrainingSchedules] = useState<TrainingSchedule[]>(() => {
    const saved = localStorage.getItem('arena_training_schedules');
    const parsed: TrainingSchedule[] = saved ? JSON.parse(saved) : [];
    return parsed.map((s) => ({
      ...s,
      professorNome: sanitizeProfName(s.professorNome),
    }));
  });

  // Keep turmas in sync with trainingSchedules so that Gestão de Horários & Turmas and Cronograma are always synchronized!
  useEffect(() => {
    if (!Array.isArray(trainingSchedules) || trainingSchedules.length === 0) return;
    const mapped = trainingSchedules.map((s) => ({
      id: s.id,
      nome: s.nomeTurma || 'Treino Geral',
      horario: s.horario,
      diaSemana: s.diaSemana,
      status: s.status,
      professorId: s.professorId,
      professorNome: sanitizeProfName(s.professorNome),
      locked: s.locked,
    }));
    const mappedStr = stableStringify(mapped);
    if (stableStringify(turmas) !== mappedStr) {
      setTurmas(mapped);
    }
  }, [trainingSchedules]);

  const [themeKey, setThemeKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('arena_theme_key') || localStorage.getItem('themeKey') || '';
    }
    return '';
  });

  const [headerLogoError, setHeaderLogoError] = useState(false);
  const [hydrationLogoError, setHydrationLogoError] = useState(false);

  useEffect(() => {
    setHeaderLogoError(false);
    setHydrationLogoError(false);
  }, [logoApp, themeKey]);

  const getHeaderLogoSrc = (theme: string) => {
    if (logoApp && (logoApp.startsWith('data:image/') || logoApp.startsWith('http://') || logoApp.startsWith('https://') || logoApp.startsWith('blob:'))) {
      return logoApp;
    }
    return theme === 'white' ? '/ARENADOCOMPETIDOR.png' : '/Logo%20branca.png';
  };

  const getHeaderLogoContainerStyle = (theme: string) => {
    switch (theme) {
      case 'blue':
        return 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/20 shadow-blue-500/10';
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/20 shadow-emerald-500/10';
      case 'purple':
        return 'bg-gradient-to-br from-purple-500 to-fuchsia-600 border-purple-400/20 shadow-purple-500/10';
      case 'red':
        return 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400/20 shadow-red-500/10';
      case 'yellow':
        return 'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-400/20 shadow-yellow-500/10';
      case 'cyan':
        return 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400/20 shadow-cyan-500/10';
      case 'rose':
        return 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400/20 shadow-rose-500/10';
      case 'fuchsia':
        return 'bg-gradient-to-br from-fuchsia-500 to-purple-600 border-fuchsia-400/20 shadow-fuchsia-500/10';
      case 'lime':
        return 'bg-gradient-to-br from-lime-500 to-emerald-600 border-lime-400/20 shadow-lime-500/10';
      case 'white':
        return 'bg-white border-neutral-200 shadow-neutral-200/10';
      case 'orange':
      default:
        return 'bg-gradient-to-br from-orange-500 to-red-600 border-orange-400/20 shadow-orange-500/10';
    }
  };

  const [currentModule, setCurrentModule] = useState<'arena' | 'confronto'>('arena');

  const [confrontoInscricoes, setConfrontoInscricoes] = useState<any[]>(() => safeStorageParse('arena_confronto_inscricoes', []));

  const [confrontoManutencao, setConfrontoManutencao] = useState<boolean>(() => {
    const saved = localStorage.getItem('arena_confronto_manutencao');
    return saved === 'true';
  });

  const [confrontoCampeonatos, setConfrontoCampeonatos] = useState<any[]>(() => {
    const defaults = [
      {
        id: 'ch-1',
        title: 'Copa Sul-Americana ACBJJ Pro 2026',
        subtitle: 'Edição Especial de Primavera',
        date: '15/11/2026',
        horario: '09:00',
        location: 'Arena Carioca 1',
        city: 'Rio de Janeiro - RJ',
        modalidades: ['Gi (Kimono)', 'No-Gi', 'Kids', 'Juvenil', 'Adulto', 'Master'],
        disputa: 'Absoluto Opcional',
        price: 150.00,
        status: 'Publicado', // Publicado, Oculto, Em preparação, Encerrado
        limitDate: '10/11/2026',
        maxInscritos: 200,
        whatsapp: '(98) 97014-9967',
        banner: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop'
      },
      {
        id: 'ch-2',
        title: 'Grand Slam Nacional ACBJJ Pro 2026',
        subtitle: 'O maior torneio nacional',
        date: '20/12/2026',
        horario: '10:00',
        location: 'Ginásio do Ibirapuera',
        city: 'São Paulo - SP',
        modalidades: ['Gi (Kimono)', 'No-Gi', 'Open Class'],
        disputa: 'Absoluto',
        price: 180.00,
        status: 'Publicado',
        limitDate: '15/12/2026',
        maxInscritos: 300,
        whatsapp: '(98) 97014-9967',
        banner: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=600&auto=format&fit=crop'
      }
    ];
    return safeStorageParse('arena_confronto_campeonatos', defaults);
  });

  useEffect(() => {
    try {
      localStorage.setItem('arena_confronto_inscricoes', JSON.stringify(confrontoInscricoes));
    } catch (e) {
      console.warn(e);
    }
  }, [confrontoInscricoes]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_confronto_manutencao', String(confrontoManutencao));
    } catch (e) {
      console.warn(e);
    }
    syncState('confrontoManutencao', confrontoManutencao);
  }, [confrontoManutencao]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_confronto_campeonatos', JSON.stringify(confrontoCampeonatos));
    } catch (e) {
      console.warn(e);
    }
  }, [confrontoCampeonatos]);

  const [publicidadePosicao, setPublicidadePosicao] = useState<'topo' | 'meio' | 'fim'>(() => {
    return (localStorage.getItem('arena_publicidade_posicao') as 'topo' | 'meio' | 'fim') || 'topo';
  });

  useEffect(() => {
    try {
      localStorage.setItem('arena_publicidade_posicao', publicidadePosicao);
    } catch (e) {
      console.warn(e);
    }
    syncState('publicidadePosicao', publicidadePosicao);
  }, [publicidadePosicao]);

  const [publicidades, setPublicidades] = useState<PublicidadeItem[]>(() => safeStorageParse('arena_publicidades', []));
  const [exibirPublicidadeAdmin, setExibirPublicidadeAdmin] = useState<boolean>(() => safeStorageParse('arena_exibirPublicidadeAdmin', true));

  useEffect(() => {
    try {
      localStorage.setItem('arena_exibirPublicidadeAdmin', JSON.stringify(exibirPublicidadeAdmin));
    } catch (e) {
      console.warn(e);
    }
    syncState('exibirPublicidadeAdmin', exibirPublicidadeAdmin);
  }, [exibirPublicidadeAdmin]);

  const handleToggleExibirPublicidadeAdmin = async (newVal: boolean) => {
    const prevVal = exibirPublicidadeAdmin;
    setExibirPublicidadeAdmin(newVal);
    try {
      localStorage.setItem('arena_exibirPublicidadeAdmin', JSON.stringify(newVal));
    } catch (e) {
      console.warn(e);
    }

    try {
      const res = await fetch('/api/update-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'exibirPublicidadeAdmin', data: newVal }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to update exibirPublicidadeAdmin in Cloud SQL:', err);
      setExibirPublicidadeAdmin(prevVal);
      try {
        localStorage.setItem('arena_exibirPublicidadeAdmin', JSON.stringify(prevVal));
      } catch (e) {}
      alert('⚠️ Falha ao salvar a configuração de visualização no servidor. O estado foi revertido.');
    }
  };

  const [justificativasFaltas, setJustificativasFaltas] = useState<JustificativaFalta[]>(() => safeStorageParse('arena_justificativasFaltas', []));

  const [recuperacoesSenha, setRecuperacoesSenha] = useState<RecuperacaoSenha[]>(() => safeStorageParse('arena_recuperacoes_senha', []));

  // Master Plan Structural States
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => safeStorageParse('arena_audit_logs', []));

  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(() => safeStorageParse('arena_health_records', []));

  const [antiEvasionAlerts, setAntiEvasionAlerts] = useState<AntiEvasionAlert[]>(() => safeStorageParse('arena_anti_evasion_alerts', []));

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => safeStorageParse('arena_timeline_events', []));

  const [teacherAiAnalyses, setTeacherAiAnalyses] = useState<TeacherAiAnalysis[]>(() => safeStorageParse('arena_teacher_ai_analyses', []));

  const [studentGoals, setStudentGoals] = useState<StudentGoal[]>(() => safeStorageParse('arena_student_goals', []));

  const [studentAchievements, setStudentAchievements] = useState<StudentAchievement[]>(() => safeStorageParse('arena_student_achievements', []));

  const [crmInteractions, setCrmInteractions] = useState<CrmInteraction[]>(() => safeStorageParse('arena_crm_interactions', []));

  const [digitalContracts, setDigitalContracts] = useState<DigitalContract[]>(() => safeStorageParse('arena_digital_contracts', []));

  const [userDigitalDocuments, setUserDigitalDocuments] = useState<UserDigitalDocument[]>(() => safeStorageParse('arena_user_digital_documents', []));

  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>(() => safeStorageParse('arena_backup_records', []));

  const [contratosOficiais, setContratosOficiais] = useState<OfficialContract[]>(() => safeStorageParse('arena_contratos_oficiais', CONTRATOS_INICIAIS));

  const [contratoAceites, setContratoAceites] = useState<ContractAcceptanceRecord[]>(() => {
    const saved = localStorage.getItem('arena_contrato_aceites');
    return saved ? JSON.parse(saved) : [];
  });

  const [mensalidades, setMensalidades] = useState<MensalidadeAluno[]>(() => safeStorageParse('arena_mensalidades', []));

  useEffect(() => {
    try {
      localStorage.setItem('arena_mensalidades', JSON.stringify(mensalidades));
    } catch (e) {
      console.warn(e);
    }
  }, [mensalidades]);

  // Financial REST handlers
  const handleSaveMensalidade = async (m: Partial<MensalidadeAluno>): Promise<MensalidadeAluno | null> => {
    try {
      const res = await fetch('/api/cloudsql/mensalidades/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensalidade: m }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar mensalidade');
      }
      const saved: MensalidadeAluno = data.mensalidade;
      setMensalidades((prev) => {
        const idx = prev.findIndex((item) => item.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });
      return saved;
    } catch (err: any) {
      console.error('Error saving mensalidade:', err);
      alert(`⚠️ ${err.message || 'Falha ao salvar mensalidade no Cloud SQL'}`);
      return null;
    }
  };

  const handleExcluirMensalidade = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/cloudsql/mensalidades/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir mensalidade');
      }
      setMensalidades((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting mensalidade:', err);
      alert(`⚠️ ${err.message || 'Falha ao excluir mensalidade no Cloud SQL'}`);
      return false;
    }
  };

  const handlePagarMensalidade = async (id: string, details: { metodoPagamento?: string; transactionId?: string; pixTxid?: string; observacao?: string }) => {
    try {
      const res = await fetch(`/api/cloudsql/mensalidades/${id}/pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar pagamento');
      }
      const updated: MensalidadeAluno = data.mensalidade;
      setMensalidades((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    } catch (err: any) {
      console.error('Error recording payment:', err);
      alert(`⚠️ ${err.message || 'Falha ao registrar pagamento no Cloud SQL'}`);
      return null;
    }
  };

  const handleCancelarMensalidade = async (id: string, observacao?: string) => {
    try {
      const res = await fetch(`/api/cloudsql/mensalidades/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacao }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cancelar mensalidade');
      }
      const updated: MensalidadeAluno = data.mensalidade;
      setMensalidades((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    } catch (err: any) {
      console.error('Error canceling mensalidade:', err);
      alert(`⚠️ ${err.message || 'Falha ao cancelar mensalidade no Cloud SQL'}`);
      return null;
    }
  };

  const handleEstornarMensalidade = async (id: string, observacao?: string) => {
    try {
      const res = await fetch(`/api/cloudsql/mensalidades/${id}/estornar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacao }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao estornar mensalidade');
      }
      const updated: MensalidadeAluno = data.mensalidade;
      setMensalidades((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    } catch (err: any) {
      console.error('Error refunding mensalidade:', err);
      alert(`⚠️ ${err.message || 'Falha ao estornar mensalidade no Cloud SQL'}`);
      return null;
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('arena_contratos_oficiais', JSON.stringify(contratosOficiais));
    } catch (e) {
      console.warn(e);
    }
    syncState('contratosOficiais', contratosOficiais);
  }, [contratosOficiais]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_contrato_aceites', JSON.stringify(contratoAceites));
    } catch (e) {
      console.warn(e);
    }
    syncState('contratoAceites', contratoAceites);
  }, [contratoAceites]);

  const handleSaveContract = (updated: OfficialContract) => {
    setContratosOficiais(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handlePublishContractVersion = (contractId: string, novaVersao: string, descricaoAlteracoes: string) => {
    setContratosOficiais(prev => prev.map(c => {
      if (c.id === contractId) {
        const hist = c.historicoVersoes || [];
        const newHist = [
          {
            versao: novaVersao,
            data: new Date().toLocaleDateString('pt-BR'),
            responsavel: usuarioLogado?.nome || 'Administrador',
            hash: c.hashSHA256 || 'HASH_INTEGRIDADE_OFICIAL',
            descricaoAlteracoes: descricaoAlteracoes || 'Atualização contratual de rotina.',
          },
          ...hist
        ];
        return {
          ...c,
          versao: novaVersao,
          status: 'publicado' as const,
          dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
          historicoVersoes: newHist
        };
      }
      return c;
    }));
  };

  const handleRegisterContractAcceptance = (record: Omit<ContractAcceptanceRecord, 'id'>) => {
    const newRecord: ContractAcceptanceRecord = {
      ...record,
      id: `aceite-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    setContratoAceites(prev => [newRecord, ...prev]);
  };

  // --- STATE PERSISTENCE TRIGGER ---
  useEffect(() => {
    try {
      localStorage.setItem('arena_recuperacoes_senha', JSON.stringify(recuperacoesSenha));
    } catch (e) {
      console.warn(e);
    }
    syncState('recuperacoesSenha', recuperacoesSenha);
  }, [recuperacoesSenha]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn(e);
    }
    syncState('auditLogs', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_health_records', JSON.stringify(healthRecords));
    } catch (e) {
      console.warn(e);
    }
    syncState('healthRecords', healthRecords);
  }, [healthRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_anti_evasion_alerts', JSON.stringify(antiEvasionAlerts));
    } catch (e) {
      console.warn(e);
    }
    syncState('antiEvasionAlerts', antiEvasionAlerts);
  }, [antiEvasionAlerts]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_timeline_events', JSON.stringify(timelineEvents));
    } catch (e) {
      console.warn(e);
    }
    syncState('timelineEvents', timelineEvents);
  }, [timelineEvents]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_teacher_ai_analyses', JSON.stringify(teacherAiAnalyses));
    } catch (e) {
      console.warn(e);
    }
    syncState('teacherAiAnalyses', teacherAiAnalyses);
  }, [teacherAiAnalyses]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_student_goals', JSON.stringify(studentGoals));
    } catch (e) {
      console.warn(e);
    }
    syncState('studentGoals', studentGoals);
  }, [studentGoals]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_student_achievements', JSON.stringify(studentAchievements));
    } catch (e) {
      console.warn(e);
    }
    syncState('studentAchievements', studentAchievements);
  }, [studentAchievements]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_crm_interactions', JSON.stringify(crmInteractions));
    } catch (e) {
      console.warn(e);
    }
    syncState('crmInteractions', crmInteractions);
  }, [crmInteractions]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_digital_contracts', JSON.stringify(digitalContracts));
    } catch (e) {
      console.warn(e);
    }
    syncState('digitalContracts', digitalContracts);
  }, [digitalContracts]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_user_digital_documents', JSON.stringify(userDigitalDocuments));
    } catch (e) {
      console.warn(e);
    }
    syncState('userDigitalDocuments', userDigitalDocuments);
  }, [userDigitalDocuments]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_backup_records', JSON.stringify(backupRecords));
    } catch (e) {
      console.warn(e);
    }
    syncState('backupRecords', backupRecords);
  }, [backupRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_publicidades', JSON.stringify(publicidades));
    } catch (e) {
      console.warn(e);
    }
    syncState('publicidades', publicidades);
  }, [publicidades]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_justificativasFaltas', JSON.stringify(justificativasFaltas));
    } catch (e) {
      console.warn(e);
    }
    syncState('justificativasFaltas', justificativasFaltas);
  }, [justificativasFaltas]);
  useEffect(() => {
    try {
      localStorage.setItem('arena_logo', logoApp);
    } catch (e) {
      console.warn(e);
    }
    syncState('logoApp', logoApp);
  }, [logoApp]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_training_schedules', JSON.stringify(trainingSchedules));
    } catch (e) {
      console.warn(e);
    }
    syncState('trainingSchedules', trainingSchedules);
  }, [trainingSchedules]);

  useEffect(() => {
    if (!themeKey) return;
    try {
      localStorage.setItem('arena_theme_key', themeKey);
      localStorage.setItem('themeKey', themeKey);
    } catch (e) {
      console.warn(e);
    }
  }, [themeKey]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_usuarios', JSON.stringify(usuarios));
    } catch (e) {
      console.warn(e);
    }
  }, [usuarios]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_alunos', JSON.stringify(alunos));
    } catch (e) {
      console.warn(e);
    }
  }, [alunos]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_professores', JSON.stringify(professores));
    } catch (e) {
      console.warn(e);
    }
    syncState('professores', professores);
  }, [professores]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_checkinsPendentes', JSON.stringify(checkinsPendentes));
    } catch (e) {
      console.warn(e);
    }
    syncState('checkinsPendentes', checkinsPendentes);
  }, [checkinsPendentes]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_checkinsConfirmados', JSON.stringify(checkinsConfirmados));
    } catch (e) {
      console.warn(e);
    }
    syncState('checkinsConfirmados', checkinsConfirmados);
  }, [checkinsConfirmados]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_professorCheckins', JSON.stringify(professorCheckins));
    } catch (e) {
      console.warn(e);
    }
    syncState('professorCheckins', professorCheckins);
  }, [professorCheckins]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_notificacoes', JSON.stringify(notificacoes));
    } catch (e) {
      console.warn(e);
    }
    syncState('notificacoes', notificacoes);
  }, [notificacoes]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_turmas', JSON.stringify(turmas));
    } catch (e) {
      console.warn(e);
    }
    syncState('turmas', turmas);
  }, [turmas]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_carousel', JSON.stringify(carouselFotos));
    } catch (e) {
      console.warn(e);
    }
    syncState('carouselFotos', carouselFotos);
  }, [carouselFotos]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_provas', JSON.stringify(provasEnviadas));
    } catch (e) {
      console.warn(e);
    }
    syncState('provasEnviadas', provasEnviadas);
  }, [provasEnviadas]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_noticias', JSON.stringify(noticias));
    } catch (e) {
      console.warn(e);
    }
  }, [noticias]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_videos', JSON.stringify(videos));
    } catch (e) {
      console.warn(e);
    }
  }, [videos]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_live_streams', JSON.stringify(liveStreams));
    } catch (e) {
      console.warn(e);
    }
  }, [liveStreams]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_certificados', JSON.stringify(certificados));
    } catch (e) {
      console.warn(e);
    }
    syncState('certificados', certificados);
  }, [certificados]);

  // --- ACTIVE SESSION ---
  const [usuarioLogado, setUsuarioLogado] = useState<User | null>(() => {
    try {
      const session = localStorage.getItem('arena_session') || sessionStorage.getItem('arena_session');
      if (session) {
        const u: User = JSON.parse(session);
        return ensureUserSchema(u, [], []);
      }
    } catch (e) {
      console.warn('Notice parsing session string:', e);
    }

    // Auto-login as Admin if opening a direct placar profile / display URL or cronômetro URL
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('placarProfile') ||
        params.get('placarTab') ||
        params.get('profile') ||
        params.get('cronoProfile') ||
        params.get('cronoTab') ||
        params.get('module') ||
        params.get('arena')
      ) {
        return {
          id: 1,
          nome: 'Administrador',
          email: 'admin@admin.com',
          tipo: 'admin',
          cpf: '123.456.789-12',
        };
      }
    } catch (e) {
      console.warn('Notice reading URL params:', e);
    }

    return null;
  });

  // Persist session changes across both localStorage and sessionStorage
  useEffect(() => {
    if (usuarioLogado) {
      try {
        const sessionStr = JSON.stringify(usuarioLogado);
        localStorage.setItem('arena_session', sessionStr);
        sessionStorage.setItem('arena_session', sessionStr);
      } catch (e) {
        console.warn('Error storing session:', e);
      }
    } else {
      localStorage.removeItem('arena_session');
      sessionStorage.removeItem('arena_session');
    }
  }, [usuarioLogado]);

  // Restore session when user returns from background / switches back to tab
  useEffect(() => {
    const restoreSessionIfNeeded = () => {
      try {
        const storedSession = localStorage.getItem('arena_session') || sessionStorage.getItem('arena_session');
        if (storedSession) {
          const parsed: User = JSON.parse(storedSession);
          if (parsed && parsed.id) {
            setUsuarioLogado((prev) => {
              if (!prev || Number(prev.id) !== Number(parsed.id)) {
                if (parsed.tipo === 'admin' || (parsed.email === 'admin@admin.com' && (parsed.nome === 'Mestre Uri Cruz' || parsed.nome === 'YURI CRUZ' || parsed.nome === 'URI CRUZ'))) {
                  parsed.nome = 'Administrador';
                  parsed.cpf = '123.456.789-12';
                }
                return parsed;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.warn('Error restoring session on focus:', e);
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        restoreSessionIfNeeded();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  // Keep active session user data seamlessly updated if usuarios data changes from sync
  useEffect(() => {
    if (!usuarioLogado) return;
    const matchingUser = usuarios.find((u) => Number(u.id) === Number(usuarioLogado.id));
    if (matchingUser) {
      if (JSON.stringify(matchingUser) !== JSON.stringify(usuarioLogado)) {
        setUsuarioLogado(matchingUser);
      }
    }
  }, [usuarios]);

  // --- UI CONTROLS ---
  const [activeAdminTab, setActiveAdminTab] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('placarProfile') ||
        params.get('placarTab') ||
        params.get('profile') ||
        params.get('cronoProfile') ||
        params.get('cronoTab') ||
        params.get('module') ||
        params.get('arena')
      ) {
        return 'placar';
      }
    } catch (e) {
      console.warn('Notice checking URL params for admin tab:', e);
    }
    return 'dashboard';
  });

  const [isAppFullscreen, setIsAppFullscreen] = useState<boolean>(() => !!document.fullscreenElement);

  useEffect(() => {
    const handleFsChange = () => {
      setIsAppFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const isTelaoRoute = React.useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('mod') === 'telao' ||
        params.get('route') === 'telao' ||
        window.location.pathname === '/placar/telao'
      );
    } catch (e) {
      return false;
    }
  }, []);

  const isStandaloneTelao = React.useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('placarTab') === 'exibicao' ||
        params.get('cronoTab') === 'exibicao' ||
        params.get('standalone') === 'true'
      );
    } catch (e) {
      return false;
    }
  }, []);

  // Auto-redirect restricted tabs for Instrutor role
  useEffect(() => {
    if (usuarioLogado?.tipo === 'instrutor') {
      if (activeAdminTab === 'chat') {
        setActiveAdminTab('dashboard');
      }
    }
  }, [usuarioLogado, activeAdminTab]);
  const [provasSubTab, setProvasSubTab] = useState<'provas' | 'avaliacoes'>('provas');
  const [professoresSubTab, setProfessoresSubTab] = useState<'solicitacoes' | 'professores' | 'turmas' | 'reset-requests'>('solicitacoes');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAdminBellNotificationsModal, setShowAdminBellNotificationsModal] = useState(false);
  const [showInternalAiCentral, setShowInternalAiCentral] = useState(false);
  const [notifStateVersion, setNotifStateVersion] = useState(0);
  const [confirmDeleteNotifId, setConfirmDeleteNotifId] = useState<string | null>(null);
  const [showConfirmDeleteAllNotifs, setShowConfirmDeleteAllNotifs] = useState(false);

  const adminUserKey = getUserKey(usuarioLogado);
  const scopedAdminNotifs = getUserScopedNotifications(notificacoes, usuarioLogado);
  const unreadAdminNotifCount = getUserUnreadCount(notificacoes, usuarioLogado);

  const isConfrontoAdmin = usuarioLogado && (
    usuarioLogado.email === 'admin@admin.com' ||
    usuarioLogado.cpf?.replace(/\D/g, '') === '12345678912'
  );

  // --- SEGURANÇA E VÍNCULO DE USUÁRIOS/ALUNOS ---
  useEffect(() => {
    if (!hasInitialFetchedRef.current) return;
    
    let modifiedAlunos = false;
    let nextAlunos = [...alunos];

    // Safe link check for all existing students (relies on matching existing user IDs or emails/CPFs/names)
    nextAlunos.forEach((a, idx) => {
      if (a.usuarioId != null) {
        const linkedUser = usuarios.find((u) => Number(u.id) === Number(a.usuarioId));
        if (!linkedUser) {
          const match = usuarios.find((u) =>
            (u.email && a.email && u.email.toLowerCase().trim() === a.email.toLowerCase().trim()) ||
            (u.cpf && a.cpf && u.cpf.replace(/\D/g, '') === a.cpf.replace(/\D/g, '')) ||
            (u.nome && a.nome && u.nome.toUpperCase().trim() === a.nome.toUpperCase().trim())
          );
          if (match) {
            nextAlunos[idx] = { ...a, usuarioId: Number(match.id) };
            modifiedAlunos = true;
          }
        }
      }
    });

    if (modifiedAlunos) {
      setAlunos(nextAlunos);
      try { localStorage.setItem('arena_alunos', JSON.stringify(nextAlunos)); } catch (e) {}
    }
  }, [usuarios, alunos]);

  const getThemeClasses = () => {
    switch (themeKey) {
      case 'blue':
        return {
          bg: 'from-blue-600 to-indigo-700',
          text: 'text-blue-500',
          shadow: 'shadow-blue-500/10',
          bgBtn: 'bg-blue-500',
          border: 'border-blue-500/20'
        };
      case 'emerald':
        return {
          bg: 'from-emerald-500 to-teal-600',
          text: 'text-emerald-500',
          shadow: 'shadow-emerald-500/10',
          bgBtn: 'bg-emerald-500',
          border: 'border-emerald-500/20'
        };
      case 'purple':
        return {
          bg: 'from-purple-600 to-fuchsia-700',
          text: 'text-purple-500',
          shadow: 'shadow-purple-500/10',
          bgBtn: 'bg-purple-500',
          border: 'border-purple-500/20'
        };
      case 'red':
        return {
          bg: 'from-red-600 to-rose-700',
          text: 'text-red-500',
          shadow: 'shadow-red-500/10',
          bgBtn: 'bg-red-500',
          border: 'border-red-500/20'
        };
      case 'yellow':
        return {
          bg: 'from-yellow-500 to-amber-600',
          text: 'text-yellow-500',
          shadow: 'shadow-yellow-500/10',
          bgBtn: 'bg-yellow-500',
          border: 'border-yellow-500/20'
        };
      case 'cyan':
        return {
          bg: 'from-cyan-500 to-blue-600',
          text: 'text-cyan-500',
          shadow: 'shadow-cyan-500/10',
          bgBtn: 'bg-cyan-500',
          border: 'border-cyan-500/20'
        };
      case 'rose':
        return {
          bg: 'from-rose-500 to-pink-600',
          text: 'text-rose-500',
          shadow: 'shadow-rose-500/10',
          bgBtn: 'bg-rose-500',
          border: 'border-rose-500/20'
        };
      case 'lime':
        return {
          bg: 'from-lime-500 to-emerald-600',
          text: 'text-lime-500',
          shadow: 'shadow-lime-500/10',
          bgBtn: 'bg-lime-500',
          border: 'border-lime-500/20'
        };
      case 'fuchsia':
        return {
          bg: 'from-fuchsia-500 to-purple-600',
          text: 'text-fuchsia-500',
          shadow: 'shadow-fuchsia-500/10',
          bgBtn: 'bg-fuchsia-500',
          border: 'border-fuchsia-500/20'
        };
      case 'white':
        return {
          bg: 'from-white to-neutral-200',
          text: 'text-white',
          shadow: 'shadow-white/10',
          bgBtn: 'bg-white',
          border: 'border-white/20'
        };
      case 'orange':
      default:
        return {
          bg: 'from-orange-500 to-red-600',
          text: 'text-orange-500',
          shadow: 'shadow-orange-500/10',
          bgBtn: 'bg-orange-500',
          border: 'border-orange-500/20'
        };
    }
  };

  const themeClasses = getThemeClasses();

  // Parabens Modal Control
  const [showParabensModal, setShowParabensModal] = useState(false);
  const [selectedParabensAlunoId, setSelectedParabensAlunoId] = useState<number | null>(null);
  const [parabensMensagem, setParabensMensagem] = useState('');

  // User's own birthday congrats modal
  const [showUserBirthdayCongrats, setShowUserBirthdayCongrats] = useState(false);

  useEffect(() => {
    if (usuarioLogado && usuarioLogado.dataNascimento) {
      const checkedSessionKey = `arena_bday_shown_${usuarioLogado.id}`;
      const alreadyShown = sessionStorage.getItem(checkedSessionKey);
      if (!alreadyShown) {
        const hoje = new Date();
        const dh = hoje.getDate();
        const mh = hoje.getMonth() + 1;
        const partes = usuarioLogado.dataNascimento.split('-');
        if (partes.length >= 3) {
          const bdayDay = parseInt(partes[2]);
          const bdayMonth = parseInt(partes[1]);
          if (bdayDay === dh && bdayMonth === mh) {
            setShowUserBirthdayCongrats(true);
            sessionStorage.setItem(checkedSessionKey, 'true');
          }
        }
      }
    }
  }, [usuarioLogado]);

  // Profile Edit Modal Control
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editEndereco, setEditEndereco] = useState('');
  const [editTipoSangue, setEditTipoSangue] = useState('');
  const [editAlergico, setEditAlergico] = useState('');
  const [editFotoBase64, setEditFotoBase64] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editDataNascimento, setEditDataNascimento] = useState('');
  const [editFaixa, setEditFaixa] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editContatoEmergenciaNome, setEditContatoEmergenciaNome] = useState('');
  const [editContatoEmergenciaTelefone, setEditContatoEmergenciaTelefone] = useState('');

  const handleOpenProfileModal = () => {
    if (!usuarioLogado) return;
    setEditNome(usuarioLogado.nome || '');
    setEditEmail(usuarioLogado.email || '');
    setEditWhatsapp(usuarioLogado.whatsapp || '');
    setEditSenha(usuarioLogado.senha || '');
    setEditEndereco(usuarioLogado.endereco || '');
    setEditTipoSangue(usuarioLogado.tipoSangue || '');
    setEditAlergico(usuarioLogado.alergico || '');
    setEditFotoBase64(usuarioLogado.fotoPerfil || '');
    setEditCpf(usuarioLogado.cpf || '');
    setEditDataNascimento(usuarioLogado.dataNascimento || '');
    setEditFaixa(usuarioLogado.faixa || '');
    setEditCargo(usuarioLogado.cargo || '');
    setEditContatoEmergenciaNome(usuarioLogado.contatoEmergenciaNome || '');
    setEditContatoEmergenciaTelefone(usuarioLogado.contatoEmergenciaTelefone || '');
    setShowProfileModal(true);
  };

  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioLogado) return;

    const userBirth = editDataNascimento || usuarioLogado.dataNascimento || '';
    const profileUserAge = (() => {
      if (!userBirth) return 99;
      const bDate = new Date(userBirth);
      if (isNaN(bDate.getTime())) return 99;
      const today = new Date();
      let age = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
      return age;
    })();
    const isProfileUserMinor = profileUserAge < 18 && profileUserAge >= 0;
    const userCpfValue = editCpf || usuarioLogado.cpf || '';
    const isProfileUserEditingWithProvisorio = userCpfValue.trim().toUpperCase().startsWith('INF-') || Boolean(usuarioLogado.isCpfProvisorio);
    const isProfileUserMinorProvisorio = isProfileUserMinor && isProfileUserEditingWithProvisorio;

    const cleanWa = editWhatsapp.replace(/\D/g, '');
    const cleanEmerg = editContatoEmergenciaTelefone.replace(/\D/g, '');

    if (!isProfileUserMinorProvisorio && cleanWa.length > 0 && cleanEmerg.length > 0 && cleanWa === cleanEmerg) {
      alert('Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato de emergência diferente.');
      return;
    }

    if (isProfileUserMinor && !isProfileUserEditingWithProvisorio) {
      if (!editContatoEmergenciaNome.trim() || !editContatoEmergenciaTelefone.trim()) {
        alert('Para menores de idade com CPF oficial, o Contato de Emergência (Nome e Telefone) é obrigatório!');
        return;
      }
    }

    const isAdmin = usuarioLogado.tipo === 'admin';

    const updatedUser: User = {
      ...usuarioLogado,
      nome: isAdmin ? (editNome.trim() || usuarioLogado.nome) : usuarioLogado.nome,
      email: editEmail.trim() || usuarioLogado.email,
      whatsapp: editWhatsapp,
      senha: editSenha.trim() || usuarioLogado.senha,
      endereco: editEndereco,
      tipoSangue: editTipoSangue,
      alergico: editAlergico,
      fotoPerfil: editFotoBase64 || usuarioLogado.fotoPerfil,
      cpf: isAdmin ? editCpf : usuarioLogado.cpf,
      dataNascimento: isAdmin ? editDataNascimento : usuarioLogado.dataNascimento,
      faixa: isAdmin ? editFaixa : usuarioLogado.faixa,
      cargo: isAdmin ? editCargo : usuarioLogado.cargo,
      contatoEmergenciaNome: editContatoEmergenciaNome,
      contatoEmergenciaTelefone: editContatoEmergenciaTelefone,
    };

    setUsuarioLogado(updatedUser);
    localStorage.setItem('arena_session', JSON.stringify(updatedUser));
    sessionStorage.setItem('arena_session', JSON.stringify(updatedUser));

    setUsuarios((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    const userCpfClean = updatedUser.cpf ? updatedUser.cpf.replace(/\D/g, '') : '';
    const userEmailClean = updatedUser.email ? updatedUser.email.trim().toLowerCase() : '';

    setAlunos((prev) =>
      prev.map((a) => {
        const matches = a.usuarioId === updatedUser.id;

        if (matches) {
          return {
            ...a,
            usuarioId: updatedUser.id,
            nome: updatedUser.nome,
            email: updatedUser.email,
            whatsapp: updatedUser.whatsapp,
            fotoPerfil: updatedUser.fotoPerfil || a.fotoPerfil,
            faixa: updatedUser.faixa || a.faixa,
            cpf: updatedUser.cpf || a.cpf,
            dataNascimento: updatedUser.dataNascimento || a.dataNascimento,
            contatoEmergenciaNome: updatedUser.contatoEmergenciaNome || a.contatoEmergenciaNome,
            contatoEmergenciaTelefone: updatedUser.contatoEmergenciaTelefone || a.contatoEmergenciaTelefone,
          };
        }
        return a;
      })
    );

    setProfessores((prev) =>
      prev.map((p) =>
        p.id === updatedUser.id
          ? {
              ...p,
              nome: updatedUser.nome,
              email: updatedUser.email,
            }
          : p
      )
    );

    setShowProfileModal(false);
    alert('✓ Cadastro pessoal atualizado com sucesso!');
  };

  const handleLoginSuccess = (user: User) => {
    const u = ensureUserSchema(user, alunos, turmas);
    setUsuarioLogado(u);
    localStorage.setItem('arena_session', JSON.stringify(u));
    sessionStorage.setItem('arena_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    localStorage.removeItem('arena_session');
    sessionStorage.removeItem('arena_session');
  };

  const handleRegister = (newUser: User, newStudent?: Student) => {
    setUsuarios((prev) => [...prev, newUser]);
    if (newStudent) {
      setAlunos((prev) => [...prev, newStudent]);
    }
    if (newUser.tipo === 'professor' || newUser.tipo === 'instrutor') {
      setProfessores((prev) => [...prev, { id: newUser.id, nome: newUser.nome, email: newUser.email, aprovado: false }]);
    }
  };

  const handleAgendarExperimental = (aula: any, notif: any) => {
    setAulasExperimentais((prev) => [aula, ...prev]);
    setNotificacoes((prev) => [notif, ...prev]);
  };

  // Aniversarios congratulator
  const handleOpenParabensModal = (alunoId: number) => {
    setSelectedParabensAlunoId(alunoId);
    setParabensMensagem('');
    setShowParabensModal(true);
  };

  const handleEnviarParabens = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParabensAlunoId || !usuarioLogado) return;
    const target = alunos.find((a) => a.id === selectedParabensAlunoId);
    if (!target) return;

    const customMsg =
      parabensMensagem.trim() ||
      `🎂 Parabéns, guerreiro! Desejo saúde, felicidade e muita evolução técnica nos tatames da Arena! Oss.`;

    const newNotification: Notification = {
      id: Date.now().toString(),
      texto: `🎂 ${usuarioLogado.nome} te enviou parabéns: "${customMsg}"`,
      data: new Date().toLocaleString('pt-BR'),
      para: target.nome,
      de: usuarioLogado.nome,
    };

    setNotificacoes((prev) => [newNotification, ...prev]);
    setShowParabensModal(false);
    alert(`Mensagem enviada com carinho para ${target.nome}!`);
  };

  // Admin / Professor: Checkin management
  const handleAprovarCheckin = (alunoId: number, dataStr?: string) => {
    const matchIdx = checkinsPendentes.findIndex((c) => {
      if (dataStr) {
        return Number(c.alunoId) === Number(alunoId) && c.data === dataStr;
      }
      return Number(c.alunoId) === Number(alunoId);
    });
    if (matchIdx !== -1) {
      const matched = checkinsPendentes[matchIdx];
      const checkinId = matched.id || `chk-aluno-${alunoId}-${matched.data}`;
      const confirmedCheckin: CheckinRequest = {
        ...matched,
        id: checkinId,
        status: 'confirmado',
        dataHora: matched.dataHora || new Date().toISOString(),
      };

      setCheckinsConfirmados((prev) => [...prev.filter(c => c.id !== checkinId), confirmedCheckin]);
      setCheckinsPendentes((prev) => prev.filter((_, i) => i !== matchIdx));

      let approvedStudent: Student | null = null;
      // Append checkin date to student record
      setAlunos((prev) =>
        prev.map((a) => {
          if (Number(a.id) === Number(alunoId)) {
            const updated = { ...a, checkins: Array.from(new Set([...(a.checkins || []), matched.data])) };
            approvedStudent = updated;
            return updated;
          }
          return a;
        })
      );

      lastLocalUpdateRef.current['alunos'] = Date.now();

      if (approvedStudent) {
        fetch('/api/cloudsql/students/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(approvedStudent),
        }).catch((err) => console.warn('Cloud SQL student checkin save notice:', err));
      }

      // Direct Cloud SQL persistence
      fetch('/api/cloudsql/checkins/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmedCheckin),
      }).catch((err) => console.error('Error persisting checkin approval:', err));

      alert('Presença aprovada com sucesso!');
    }
  };

  const handleRejeitarCheckinSingle = (alunoId: number, dataStr?: string) => {
    const matchIdx = checkinsPendentes.findIndex((c) => {
      if (dataStr) {
        return Number(c.alunoId) === Number(alunoId) && c.data === dataStr;
      }
      return Number(c.alunoId) === Number(alunoId);
    });
    if (matchIdx !== -1) {
      const matched = checkinsPendentes[matchIdx];
      const checkinId = matched.id || `chk-aluno-${alunoId}-${matched.data}`;

      setCheckinsPendentes((prev) => prev.filter((_, i) => i !== matchIdx));

      // Persist status as 'rejeitado' in Cloud SQL
      fetch('/api/cloudsql/checkins/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkinId, status: 'rejeitado' }),
      }).catch((err) => console.error('Error persisting checkin rejection:', err));

      alert('Solicitação de presença rejeitada.');
    }
  };

  const handleAprovarTodosCheckins = () => {
    if (!usuarioLogado) return;
    
    // Determine which students are visible to the current user
    const visibleAlunos = usuarioLogado.tipo === 'admin'
      ? alunos
      : alunos.filter((a) => a.professorResponsavelId === usuarioLogado.id);
      
    const visibleStudentIds = new Set(visibleAlunos.map(a => a.id));
    
    // Filter checkins to be approved (only those belonging to visible students)
    const toApprove = checkinsPendentes.filter(req => visibleStudentIds.has(req.alunoId));
    const toKeep = checkinsPendentes.filter(req => !visibleStudentIds.has(req.alunoId));
    
    if (toApprove.length === 0) return;

    const approvedList: CheckinRequest[] = toApprove.map(req => {
      const checkinId = req.id || `chk-aluno-${req.alunoId}-${req.data}`;
      return {
        ...req,
        id: checkinId,
        status: 'confirmado',
        dataHora: req.dataHora || new Date().toISOString(),
      };
    });
    
    setCheckinsConfirmados((prev) => [...prev, ...approvedList]);
    
    const updatedStudentsList: Student[] = [];
    setAlunos((prevAlunos) => {
      return prevAlunos.map((student) => {
        const approvalsForStudent = approvedList.filter(req => req.alunoId === student.id);
        if (approvalsForStudent.length > 0) {
          const datesToAdd = approvalsForStudent.map(req => req.data);
          const updated = {
            ...student,
            checkins: Array.from(new Set([...(student.checkins || []), ...datesToAdd]))
          };
          updatedStudentsList.push(updated);
          return updated;
        }
        return student;
      });
    });
    
    lastLocalUpdateRef.current['alunos'] = Date.now();

    for (const stu of updatedStudentsList) {
      fetch('/api/cloudsql/students/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stu),
      }).catch((err) => console.error('Error persisting updated student in batch approval:', err));
    }

    setCheckinsPendentes(toKeep);

    // Save all approved checkins to Cloud SQL
    for (const chk of approvedList) {
      fetch('/api/cloudsql/checkins/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chk),
      }).catch((err) => console.error('Error persisting batch checkin approval:', err));
    }

    alert(`${toApprove.length} presença(s) aprovada(s) com sucesso!`);
  };

  // Justificativas de Falta / Ausência
  const handleJustificarFalta = (
    alunoId: number,
    alunoNome: string,
    data: string,
    motivo: string,
    turma?: string,
    horario?: string,
    professorNome?: string,
    status: 'pendente' | 'aprovada' | 'rejeitada' = 'pendente'
  ) => {
    // Check if there is already a justification for this date
    if (justificativasFaltas.some(j => j.alunoId === alunoId && j.data === data)) {
      return;
    }
    const newJust: JustificativaFalta = {
      id: `just_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      alunoId,
      alunoNome,
      turma: turma || '',
      horario: horario || '',
      professorNome: professorNome || '',
      data,
      dataEnvio: new Date().toLocaleString('pt-BR'),
      motivo,
      status,
    };
    setJustificativasFaltas(prev => [newJust, ...prev]);

    if (status === 'pendente') {
      const notificationText = `⚠️ ALUNO(A) ${alunoNome.toUpperCase()} JUSTIFICOU AUSÊNCIA NO DIA ${data}: "${motivo}"`;
      const newNotif = {
        id: Date.now().toString(),
        de: 'Sistema de Frequência',
        texto: notificationText,
        data: new Date().toLocaleDateString('pt-BR'),
        para: professorNome || 'Enviar para todos',
        visualizada: false
      };
      setNotificacoes(prev => [newNotif, ...prev]);
    }
  };

  const handleAprovarJustificativa = (id: string, resposta?: string, analisadoPor?: string) => {
    const targetJust = justificativasFaltas.find(j => j.id === id);
    if (!targetJust) return;

    const nomeAnalista = analisadoPor || usuarioLogado?.nome || 'Administrador';

    setJustificativasFaltas(prev => prev.map(j => {
      if (j.id === id) {
        return {
          ...j,
          status: 'aprovada',
          resposta: resposta !== undefined ? resposta : j.resposta,
          analisadoPor: nomeAnalista,
          dataAnalise: new Date().toLocaleString('pt-BR')
        };
      }
      return j;
    }));

    // Auto-add presence to student checkins upon approval (Presença Justificada / Abono)
    setAlunos(prev => prev.map(a => {
      if (a.id === targetJust.alunoId && !a.checkins.includes(targetJust.data)) {
        return { ...a, checkins: [...a.checkins, targetJust.data] };
      }
      return a;
    }));

    // Notify student
    setNotificacoes(prev => [
      {
        id: Date.now().toString(),
        de: nomeAnalista,
        texto: `✅ Sua justificativa para a aula do dia ${targetJust.data} foi APROVADA por ${nomeAnalista}! Sua presença foi abonada.`,
        data: new Date().toLocaleString('pt-BR'),
        para: targetJust.alunoNome,
        visualizada: false
      },
      ...prev
    ]);
  };

  const handleRejeitarJustificativa = (id: string, resposta?: string, analisadoPor?: string) => {
    const targetJust = justificativasFaltas.find(j => j.id === id);
    if (!targetJust) return;

    const nomeAnalista = analisadoPor || usuarioLogado?.nome || 'Administrador';

    setJustificativasFaltas(prev => prev.map(j => {
      if (j.id === id) {
        return {
          ...j,
          status: 'rejeitada',
          resposta: resposta !== undefined ? resposta : j.resposta,
          analisadoPor: nomeAnalista,
          dataAnalise: new Date().toLocaleString('pt-BR')
        };
      }
      return j;
    }));

    // Notify student
    setNotificacoes(prev => [
      {
        id: Date.now().toString(),
        de: nomeAnalista,
        texto: `❌ Sua justificativa para a aula do dia ${targetJust.data} foi REJEITADA. A falta foi mantida nos registros.`,
        data: new Date().toLocaleString('pt-BR'),
        para: targetJust.alunoNome,
        visualizada: false
      },
      ...prev
    ]);
  };

  // Aluno: Checkin request
  const handleSolicitarCheckin = () => {
    if (!usuarioLogado) return;
    const currentStudent = alunos.find((a) => Number(a.usuarioId) === Number(usuarioLogado.id));
    if (!currentStudent) return;

    const hojeStr = new Date().toISOString().split('T')[0];
    const checkinId = `chk-aluno-${currentStudent.id}-${hojeStr}`;

    const jaSolicitado = checkinsPendentes.some((c) => c.id === checkinId || (Number(c.alunoId) === Number(currentStudent.id) && c.data === hojeStr));
    const jaConfirmado = checkinsConfirmados.some((c) => c.id === checkinId || (Number(c.alunoId) === Number(currentStudent.id) && c.data === hojeStr));

    if (jaSolicitado) {
      alert('Você já enviou uma solicitação de presença hoje! Aguarde a homologação.');
      return;
    }
    if (jaConfirmado) {
      alert('Sua presença de hoje já está confirmada nos registros!');
      return;
    }

    const newCheckin: CheckinRequest = {
      id: checkinId,
      alunoId: currentStudent.id,
      alunoNome: currentStudent.nome,
      data: hojeStr,
      dataHora: new Date().toISOString(),
      status: 'pendente',
      tipoCheckin: 'aluno',
      turma: currentStudent.turma,
      turmaId: currentStudent.turmaId,
      userId: String(usuarioLogado.id),
    };

    setCheckinsPendentes((prev) => [...prev, newCheckin]);

    // Save directly to Cloud SQL
    fetch('/api/cloudsql/checkins/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCheckin),
    }).catch((err) => console.error('Error persisting checkin request:', err));

    alert('✅ Solicitação de presença enviada! Aguarde a confirmação do seu professor.');
  };

  // Provas / exams answers submissions
  const handleSubmitProvaRespostas = (provaId: number, respostas: { [qIdx: number]: string }) => {
    if (!usuarioLogado) return;
    const currentStudent = alunos.find((a) => a.usuarioId === usuarioLogado.id);
    if (!currentStudent) return;

    setProvasEnviadas((prev) =>
      prev.map((p) => {
        if (p.id === provaId) {
          const updatedRespostas = { ...p.respostas, [currentStudent.id]: respostas };
          const updatedNotas = { ...p.notas };

          // Automatically grade objective tests
          if (p.tipo === 'objetiva') {
            let acertos = 0;
            p.questoes.forEach((q, idx) => {
              if (respostas[idx] === q.respostaCorreta) {
                acertos += q.pontuacao;
              }
            });
            updatedNotas[currentStudent.id] = acertos;

            // Also let's update student's general average grade
            setAlunos((currentAlunos) =>
              currentAlunos.map((a) => {
                if (a.id === currentStudent.id) {
                  const updatedStu = { ...a, notaAvaliacao: acertos, mediaGeral: acertos };
                  fetch('/api/cloudsql/students/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedStu),
                  }).catch((err) => console.error('Error saving student grade in Cloud SQL:', err));
                  return updatedStu;
                }
                return a;
              })
            );
          }

          fetch('/api/cloudsql/exams/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examId: provaId, alunoId: currentStudent.id, respostas }),
          }).catch((err) => console.error('Error submitting exam to Cloud SQL:', err));

          return { ...p, respostas: updatedRespostas, notas: updatedNotas };
        }
        return p;
      })
    );
  };

  // Admin: Student CRUD helpers
  const handleAddAluno = (
    fields: Omit<Student, 'id' | 'usuarioId' | 'checkins' | 'pontosCompeticao' | 'notaAvaliacao' | 'mediaGeral' | 'medalhasOuro' | 'medalhasPrata' | 'medalhasBronze'>,
    foto: string
  ) => {
    const novoId = Math.max(...alunos.map((a) => a.id), 0) + 1;
    const cleanCpf = fields.cpf && !fields.cpf.startsWith('INF-') ? fields.cpf.replace(/\D/g, '') : '';
    const cleanName = fields.nome ? fields.nome.trim().toUpperCase() : '';

    // Check if a User already exists with matching CPF or exact Name
    const existingUser = usuarios.find((u) => {
      const uCpfClean = u.cpf && !u.cpf.startsWith('INF-') ? u.cpf.replace(/\D/g, '') : '';
      const uName = u.nome ? u.nome.trim().toUpperCase() : '';

      // Different names cannot be the same person!
      if (cleanName && uName && cleanName !== uName) return false;

      if (cleanCpf && uCpfClean && cleanCpf === uCpfClean) return true;
      if (cleanName && uName && cleanName === uName) return true;
      return false;
    });

    let linkedUserId: number;

    if (existingUser) {
      linkedUserId = existingUser.id;
      setUsuarios((prev) =>
        prev.map((u) => (u.id === existingUser.id ? { ...u, aprovado: true, status: 'ativo' as const, tipo: 'aluno' } : u))
      );
    } else {
      linkedUserId = Math.max(...usuarios.map((u) => u.id), 0) + 1;
      const newUser: User = {
        id: linkedUserId,
        senha: '1234567',
        nome: fields.nome,
        email: fields.email || `aluno${novoId}@arena.com`,
        cpf: fields.cpf || '',
        dataNascimento: fields.dataNascimento || '',
        whatsapp: fields.whatsapp || '',
        fotoPerfil: foto || '',
        endereco: '',
        tipoSangue: '',
        alergico: '',
        faixa: fields.faixa || 'Faixa Branca',
        tipo: 'aluno',
        aprovado: true,
        contatoEmergenciaNome: fields.contatoEmergenciaNome || '',
        contatoEmergenciaTelefone: fields.contatoEmergenciaTelefone || '',
        professorResponsavelId: fields.professorResponsavelId,
        professorResponsavelNome: fields.professorResponsavelNome,
      };
      setUsuarios((prev) => [...prev, newUser]);
    }

    const novoAluno: Student = {
      ...fields,
      id: novoId,
      usuarioId: linkedUserId,
      fotoPerfil: foto,
      checkins: [],
      pontosCompeticao: 0,
      notaAvaliacao: null,
      mediaGeral: 0,
      medalhasOuro: 0,
      medalhasPrata: 0,
      medalhasBronze: 0,
      ativo: true,
    };
    setAlunos((prev) => [...prev, novoAluno]);

    // Persist to Cloud SQL
    fetch('/api/cloudsql/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoAluno),
    }).catch((err) => console.warn('Cloud SQL student save err:', err));

    if (!existingUser) {
      fetch('/api/cloudsql/users/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: linkedUserId,
          uid: String(linkedUserId),
          nome: fields.nome,
          email: fields.email || `aluno${novoId}@arena.com`,
          tipo: 'aluno',
          status: 'ativo',
          aprovado: true,
        }),
      }).catch((err) => console.warn('Cloud SQL user save err:', err));
    }
  };

  const handleToggleStatus = (id: number) => {
    const student = alunos.find((a) => a.id === id);
    if (!student) return;
    const newAtivo = !student.ativo;

    setAlunos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ativo: newAtivo, status: newAtivo ? 'ativo' : 'inativo' } : a))
    );

    fetch('/api/cloudsql/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...student, ativo: newAtivo, status: newAtivo ? 'ativo' : 'inativo' }),
    }).catch((err) => console.warn('Cloud SQL student toggle status err:', err));
  };

  const handleDeletarAluno = (id: number) => {
    const student = alunos.find((a) => a.id === id);
    if (student) {
      const linkedUser = usuarios.find(u => student.usuarioId != null && Number(u.id) === Number(student.usuarioId));
      if (linkedUser?.tipo === 'admin' || linkedUser?.email === 'admin@admin.com') {
        alert('A conta administradora é a conta base da plataforma e não pode ser excluída.');
        return;
      }
      
      const sNameNorm = student.nome ? student.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

      // 1. Remove student
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      
      // 2. Cascade delete linked user ONLY if strictly matching usuarioId or normalized name
      setUsuarios((prev) => prev.filter((u) => {
        if (student.usuarioId != null && Number(u.id) === Number(student.usuarioId)) return false;
        const uNameNorm = u.nome ? u.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
        if (sNameNorm && uNameNorm === sNameNorm && u.tipo === 'aluno') return false;
        return true;
      }));

      // 3. Delete from Cloud SQL
      fetch(`/api/cloudsql/students/${id}`, { method: 'DELETE' }).catch((err) => console.warn('Cloud SQL delete student err:', err));
      if (student.usuarioId != null) {
        fetch(`/api/cloudsql/users/${student.usuarioId}`, { method: 'DELETE' }).catch((err) => console.warn('Cloud SQL delete user err:', err));
      }

      // 4. Cascade delete all linked records
      setCheckinsPendentes((prev) => prev.filter(c => Number(c.alunoId) !== Number(id) && (!c.alunoNome || c.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== sNameNorm)));
      setCheckinsConfirmados((prev) => prev.filter(c => Number(c.alunoId) !== Number(id) && (!c.alunoNome || c.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== sNameNorm)));
      setNotificacoes((prev) => prev.filter(n => Number(n.usuarioId) !== Number(id) && Number(n.destinatarioId) !== Number(id)));
      setProvasEnviadas((prev) => prev.filter(p => Number(p.alunoId) !== Number(id) && (!p.alunoNome || p.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== sNameNorm)));
      setCertificados((prev) => prev.filter(cert => Number(cert.alunoId) !== Number(id) && (!cert.alunoNome || cert.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== sNameNorm)));
      setJustificativasFaltas((prev) => prev.filter(j => Number(j.alunoId) !== Number(id) && (!j.alunoNome || j.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== sNameNorm)));
      setConfrontoInscricoes((prev) => prev.filter(ci => Number(ci.atletaId) !== Number(id) && (!ci.atletaNome || ci.atletaNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== sNameNorm)));

      alert(`O cadastro de "${student.nome}" e seus registros vinculados foram excluídos com sucesso!`);
    }
  };

  const handleUpdateAluno = (id: number, updatedFields: Partial<Student> & { tipo?: UserRole }) => {
    // Standardize name to upper case if present
    const cleanedFields = { ...updatedFields };
    if (cleanedFields.nome) {
      cleanedFields.nome = cleanedFields.nome.trim().toUpperCase();
    }
    if (cleanedFields.contatoEmergenciaNome) {
      cleanedFields.contatoEmergenciaNome = cleanedFields.contatoEmergenciaNome.trim().toUpperCase();
    }

    const targetStudent = alunos.find((a) => Number(a.id) === Number(id));
    if (!targetStudent) return;

    const updatedStudentData = { ...targetStudent, ...cleanedFields };
    fetch('/api/cloudsql/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedStudentData),
    }).catch((err) => console.warn('Cloud SQL student update save notice:', err));

    const studentUsuarioId = targetStudent.usuarioId;
    const oldCpfClean = targetStudent.cpf ? targetStudent.cpf.replace(/\D/g, '') : '';
    const newCpfClean = cleanedFields.cpf ? cleanedFields.cpf.replace(/\D/g, '') : oldCpfClean;
    const oldEmailClean = targetStudent.email ? targetStudent.email.trim().toLowerCase() : '';
    const newEmailClean = cleanedFields.email ? cleanedFields.email.trim().toLowerCase() : oldEmailClean;
    const oldNameClean = targetStudent.nome ? targetStudent.nome.trim().toUpperCase() : '';

    // Find if a user already exists for this student using robust matching fallbacks
    const existingUser = usuarios.find((u) => {
      if (studentUsuarioId != null && Number(u.id) === Number(studentUsuarioId)) return true;
      if (Number(u.id) === Number(id)) return true;
      if (oldCpfClean && u.cpf && u.cpf.replace(/\D/g, '') === oldCpfClean) return true;
      if (oldEmailClean && u.email && u.email.trim().toLowerCase() === oldEmailClean) return true;
      if (oldNameClean && u.nome && u.nome.trim().toUpperCase() === oldNameClean) return true;
      return false;
    });

    let matchedUserId: number | null = existingUser ? existingUser.id : (studentUsuarioId || null);

    setAlunos((prev) => {
      const next = prev.map((aluno) => {
        if (Number(aluno.id) === Number(id)) {
          return {
            ...aluno,
            ...cleanedFields,
            usuarioId: matchedUserId || aluno.usuarioId || null,
            ativo: cleanedFields.ativo !== undefined ? cleanedFields.ativo : (aluno.ativo ?? true),
          };
        }
        return aluno;
      });
      try {
        localStorage.setItem('arena_alunos', JSON.stringify(next));
      } catch (err) {
        console.warn('Erro ao salvar arena_alunos no localStorage:', err);
      }
      return next;
    });

    if (existingUser) {
      setUsuarios((currentUsers) => {
        const next = currentUsers.map((u) => {
          if (Number(u.id) === Number(existingUser.id)) {
            const updatedUser: User = {
              ...u,
              nome: cleanedFields.nome !== undefined ? cleanedFields.nome : u.nome,
              email: cleanedFields.email !== undefined ? cleanedFields.email : u.email,
              cpf: cleanedFields.cpf !== undefined ? cleanedFields.cpf : u.cpf,
              isCpfProvisorio: cleanedFields.isCpfProvisorio !== undefined ? cleanedFields.isCpfProvisorio : u.isCpfProvisorio,
              cpfProvisorioSubstituidoEm: cleanedFields.cpfProvisorioSubstituidoEm !== undefined ? cleanedFields.cpfProvisorioSubstituidoEm : u.cpfProvisorioSubstituidoEm,
              cpfProvisorioSubstituidoPor: cleanedFields.cpfProvisorioSubstituidoPor !== undefined ? cleanedFields.cpfProvisorioSubstituidoPor : u.cpfProvisorioSubstituidoPor,
              dataNascimento: cleanedFields.dataNascimento !== undefined ? cleanedFields.dataNascimento : u.dataNascimento,
              whatsapp: cleanedFields.whatsapp !== undefined ? cleanedFields.whatsapp : u.whatsapp,
              faixa: cleanedFields.faixa !== undefined ? cleanedFields.faixa : u.faixa,
              tipo: cleanedFields.tipo !== undefined ? cleanedFields.tipo : u.tipo,
              contatoEmergenciaNome: cleanedFields.contatoEmergenciaNome !== undefined ? cleanedFields.contatoEmergenciaNome : u.contatoEmergenciaNome,
              contatoEmergenciaTelefone: cleanedFields.contatoEmergenciaTelefone !== undefined ? cleanedFields.contatoEmergenciaTelefone : u.contatoEmergenciaTelefone,
              professorResponsavelId: cleanedFields.professorResponsavelId !== undefined ? cleanedFields.professorResponsavelId : u.professorResponsavelId,
              professorResponsavelNome: cleanedFields.professorResponsavelNome !== undefined ? cleanedFields.professorResponsavelNome : u.professorResponsavelNome,
              aprovado: true,
              status: 'ativo' as const,
            };

            if (
              usuarioLogado &&
              (Number(usuarioLogado.id) === Number(u.id) ||
                (usuarioLogado.cpf && u.cpf && usuarioLogado.cpf.replace(/\D/g, '') === u.cpf.replace(/\D/g, '')))
            ) {
              setUsuarioLogado(updatedUser);
              localStorage.setItem('arena_session', JSON.stringify(updatedUser));
              sessionStorage.setItem('arena_session', JSON.stringify(updatedUser));
            }

            return updatedUser;
          }
          return u;
        });
        try {
          localStorage.setItem('arena_usuarios', JSON.stringify(next));
        } catch (err) {
          console.warn('Erro ao salvar arena_usuarios no localStorage:', err);
        }
        return next;
      });
    } else {
      const newUserId = Math.max(...usuarios.map((u) => u.id), 0) + 1;
      const newUser: User = {
        id: newUserId,
        senha: '1234567',
        nome: cleanedFields.nome || targetStudent.nome,
        email: cleanedFields.email || targetStudent.email || `aluno${id}@arena.com`,
        cpf: cleanedFields.cpf || targetStudent.cpf || '',
        dataNascimento: cleanedFields.dataNascimento || targetStudent.dataNascimento || '',
        whatsapp: cleanedFields.whatsapp || targetStudent.whatsapp || '',
        fotoPerfil: targetStudent.fotoPerfil || '',
        endereco: '',
        tipoSangue: '',
        alergico: '',
        faixa: cleanedFields.faixa || targetStudent.faixa || 'Faixa Branca',
        tipo: cleanedFields.tipo || 'aluno',
        aprovado: true,
        status: 'ativo',
        contatoEmergenciaNome: cleanedFields.contatoEmergenciaNome || targetStudent.contatoEmergenciaNome || '',
        contatoEmergenciaTelefone: cleanedFields.contatoEmergenciaTelefone || targetStudent.contatoEmergenciaTelefone || '',
        professorResponsavelId: cleanedFields.professorResponsavelId || targetStudent.professorResponsavelId,
        professorResponsavelNome: cleanedFields.professorResponsavelNome || targetStudent.professorResponsavelNome,
      };

      setAlunos((prev) =>
        prev.map((a) => (Number(a.id) === Number(id) ? { ...a, usuarioId: newUserId } : a))
      );

      setUsuarios((prev) => {
        const next = [...prev, newUser];
        try {
          localStorage.setItem('arena_usuarios', JSON.stringify(next));
        } catch (err) {
          console.warn('Erro ao salvar arena_usuarios no localStorage:', err);
        }
        return next;
      });
    }

    // Also update professores array if matching or if type changed to professor/instrutor
    setProfessores((prev) => {
      const next = prev.map((p) => {
        const matches =
          (matchedUserId && Number(p.id) === Number(matchedUserId)) ||
          Number(p.id) === Number(id) ||
          (oldEmailClean && p.email && p.email.toLowerCase().trim() === oldEmailClean) ||
          (oldNameClean && p.nome && p.nome.trim().toUpperCase() === oldNameClean);

        if (matches) {
          return {
            ...p,
            nome: cleanedFields.nome !== undefined ? cleanedFields.nome : p.nome,
            email: cleanedFields.email !== undefined ? cleanedFields.email : p.email,
            tipo: cleanedFields.tipo !== undefined ? cleanedFields.tipo : p.tipo,
            faixa: cleanedFields.faixa !== undefined ? cleanedFields.faixa : p.faixa,
          };
        }
        return p;
      });

      if (cleanedFields.tipo === 'professor' || cleanedFields.tipo === 'instrutor') {
        const exists = next.some((p) => (matchedUserId && Number(p.id) === Number(matchedUserId)) || Number(p.id) === Number(id));
        if (!exists) {
          next.push({
            id: matchedUserId || id,
            nome: cleanedFields.nome || targetStudent.nome,
            email: cleanedFields.email || targetStudent.email || '',
            tipo: cleanedFields.tipo,
            aprovado: true,
          });
        }
      }

      try {
        localStorage.setItem('arena_professores', JSON.stringify(next));
      } catch (err) {
        console.warn('Erro ao salvar arena_professores no localStorage:', err);
      }
      return next;
    });

    alert('Ficha do competidor atualizada com sucesso!');
  };

  const handleUpdateUsuario = (id: number, updatedFields: Partial<User>) => {
    const cleanedFields = { ...updatedFields };
    if (cleanedFields.nome) {
      cleanedFields.nome = cleanedFields.nome.trim().toUpperCase();
    }
    if (cleanedFields.contatoEmergenciaNome) {
      cleanedFields.contatoEmergenciaNome = cleanedFields.contatoEmergenciaNome.trim().toUpperCase();
    }

    const targetUser = usuarios.find((u) => Number(u.id) === Number(id));
    if (!targetUser) return;

    const updatedUserData = { ...targetUser, ...cleanedFields };
    fetch('/api/cloudsql/users/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUserData),
    }).catch((err) => console.warn('Cloud SQL user update save notice:', err));

    const oldCpfClean = targetUser.cpf ? targetUser.cpf.replace(/\D/g, '') : '';
    const newCpfClean = cleanedFields.cpf ? cleanedFields.cpf.replace(/\D/g, '') : oldCpfClean;
    const oldEmailClean = targetUser.email ? targetUser.email.trim().toLowerCase() : '';
    const newEmailClean = cleanedFields.email ? cleanedFields.email.trim().toLowerCase() : oldEmailClean;
    const oldNameClean = targetUser.nome ? targetUser.nome.trim().toUpperCase() : '';

    setUsuarios((prev) => {
      const next = prev.map((u) => {
        if (Number(u.id) === Number(id)) {
          const updated = { ...u, ...cleanedFields };

          if (
            usuarioLogado &&
            (Number(usuarioLogado.id) === Number(id) ||
              (usuarioLogado.email && u.email && usuarioLogado.email.toLowerCase() === u.email.toLowerCase()))
          ) {
            setUsuarioLogado(updated);
            localStorage.setItem('arena_session', JSON.stringify(updated));
            sessionStorage.setItem('arena_session', JSON.stringify(updated));
          }
          return updated;
        }
        return u;
      });
      try {
        localStorage.setItem('arena_usuarios', JSON.stringify(next));
      } catch (err) {
        console.warn('Erro ao salvar arena_usuarios no localStorage:', err);
      }
      return next;
    });

    // Keep matching student in sync using robust matching fallbacks
    setAlunos((prev) => {
      const next = prev.map((a) => {
        const matches =
          (a.usuarioId != null && Number(a.usuarioId) === Number(id)) ||
          Number(a.id) === Number(id) ||
          (oldCpfClean && a.cpf && a.cpf.replace(/\D/g, '') === oldCpfClean) ||
          (oldEmailClean && a.email && a.email.trim().toLowerCase() === oldEmailClean) ||
          (oldNameClean && a.nome && a.nome.trim().toUpperCase() === oldNameClean);

        if (matches) {
          return {
            ...a,
            usuarioId: id,
            nome: cleanedFields.nome !== undefined ? cleanedFields.nome : a.nome,
            email: cleanedFields.email !== undefined ? cleanedFields.email : a.email,
            cpf: cleanedFields.cpf !== undefined ? cleanedFields.cpf : a.cpf,
            dataNascimento: cleanedFields.dataNascimento !== undefined ? cleanedFields.dataNascimento : a.dataNascimento,
            whatsapp: cleanedFields.whatsapp !== undefined ? cleanedFields.whatsapp : a.whatsapp,
            faixa: cleanedFields.faixa !== undefined ? cleanedFields.faixa : a.faixa,
            contatoEmergenciaNome: cleanedFields.contatoEmergenciaNome !== undefined ? cleanedFields.contatoEmergenciaNome : a.contatoEmergenciaNome,
            contatoEmergenciaTelefone: cleanedFields.contatoEmergenciaTelefone !== undefined ? cleanedFields.contatoEmergenciaTelefone : a.contatoEmergenciaTelefone,
            professorResponsavelId: cleanedFields.professorResponsavelId !== undefined ? cleanedFields.professorResponsavelId : a.professorResponsavelId,
            professorResponsavelNome: cleanedFields.professorResponsavelNome !== undefined ? cleanedFields.professorResponsavelNome : a.professorResponsavelNome,
            ativo: cleanedFields.aprovado !== undefined ? cleanedFields.aprovado : a.ativo,
          };
        }
        return a;
      });
      try {
        localStorage.setItem('arena_alunos', JSON.stringify(next));
      } catch (err) {
        console.warn('Erro ao salvar arena_alunos no localStorage:', err);
      }
      return next;
    });

    setProfessores((prev) => {
      const next = prev.map((p) => {
        const matches =
          Number(p.id) === Number(id) ||
          (oldEmailClean && p.email && p.email.toLowerCase().trim() === oldEmailClean) ||
          (oldNameClean && p.nome && p.nome.trim().toUpperCase() === oldNameClean);

        if (matches) {
          return {
            ...p,
            nome: cleanedFields.nome !== undefined ? cleanedFields.nome : p.nome,
            email: cleanedFields.email !== undefined ? cleanedFields.email : p.email,
            aprovado: cleanedFields.aprovado !== undefined ? cleanedFields.aprovado : p.aprovado,
          };
        }
        return p;
      });
      try {
        localStorage.setItem('arena_professores', JSON.stringify(next));
      } catch (err) {
        console.warn('Erro ao salvar arena_professores no localStorage:', err);
      }
      return next;
    });

    alert('Cadastro atualizado com sucesso!');
  };

  const handleExcluirNoticia = async (id: number) => {
    try {
      await fetch(`/api/cloudsql/noticias/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Erro ao deletar notícia do servidor:', err);
    }
    setNoticias((prev) => prev.filter((n) => n.id !== id));
  };

  const handleExcluirVideo = async (id: number) => {
    try {
      await fetch(`/api/cloudsql/videos/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Erro ao deletar vídeo do servidor:', err);
    }
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdateLiveStreams = async (newList: LiveStreamItem[]) => {
    const oldMap = new Map<string | number, LiveStreamItem>(liveStreams.map((s) => [s.id, s]));
    const newMap = new Map<string | number, LiveStreamItem>(newList.map((s) => [s.id, s]));

    for (const [id] of oldMap) {
      if (!newMap.has(id)) {
        try {
          await fetch(`/api/cloudsql/live-streams/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
        } catch (err) {
          console.warn('Erro ao deletar live stream:', err);
        }
      }
    }

    for (const [id, item] of newMap) {
      const oldItem = oldMap.get(id);
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        try {
          await fetch('/api/cloudsql/live-streams/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ liveStream: item }),
          });
        } catch (err) {
          console.warn('Erro ao salvar live stream:', err);
        }
      }
    }

    setLiveStreams(newList);
  };

  const handleRemoverNotificacao = (id: string) => {
    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleRemoverVariasNotificacoes = (ids: string[]) => {
    const setIds = new Set(ids);
    setNotificacoes((prev) => prev.filter((n) => !setIds.has(n.id)));
  };

  const handleAtualizarNotificacao = (updated: Notification) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleZerarNotificacoes = () => {
    setNotificacoes([]);
  };

  // Admin: Medal adding helper
  const handleAdicionarMedalha = (alunoId: number, medalhaTipo: 'ouro' | 'prata' | 'bronze', evento: string) => {
    let pontos = 150; // bronze default
    if (medalhaTipo === 'ouro') pontos = 300;
    else if (medalhaTipo === 'prata') pontos = 200;

    let updatedStudent: Student | null = null;

    setAlunos((prev) =>
      prev.map((a) => {
        if (Number(a.id) === Number(alunoId)) {
          const updated: Student = {
            ...a,
            pontosCompeticao: (a.pontosCompeticao || 0) + pontos,
            medalhasOuro: medalhaTipo === 'ouro' ? (a.medalhasOuro || 0) + 1 : (a.medalhasOuro || 0),
            medalhasPrata: medalhaTipo === 'prata' ? (a.medalhasPrata || 0) + 1 : (a.medalhasPrata || 0),
            medalhasBronze: medalhaTipo === 'bronze' ? (a.medalhasBronze || 0) + 1 : (a.medalhasBronze || 0),
          };
          updatedStudent = updated;
          return updated;
        }
        return a;
      })
    );

    lastLocalUpdateRef.current['alunos'] = Date.now();

    if (updatedStudent) {
      fetch('/api/cloudsql/students/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      }).catch((err) => console.warn('Cloud SQL student medal update save notice:', err));
    }

    const targetObj = updatedStudent || alunos.find((a) => Number(a.id) === Number(alunoId));
    const studentName = targetObj?.nome || 'Atleta';
    const medalIcon = medalhaTipo === 'ouro' ? '🥇' : medalhaTipo === 'prata' ? '🥈' : '🥉';

    // Broadcast achievement
    setNotificacoes((prev) => [
      {
        id: Date.now().toString(),
        texto: `🏆 CONQUISTA NA ARENA! O atleta ${studentName} conquistou a medalha de ${medalIcon} ${medalhaTipo.toUpperCase()} no evento "${evento}" somando +${pontos} pontos no ranking! Parabéns! 🥋🔥`,
        data: new Date().toLocaleString('pt-BR'),
        para: 'Enviar para todos',
        de: 'PROFESSOR YURI CRUZ',
      },
      ...prev,
    ]);
  };

  // Admin: Saved evaluations saver
  const handleSaveAvaliacao = (alunoId: number, media: number, detalheAvaliacao?: any) => {
    setAlunos((prev) =>
      prev.map((a) => {
        if (a.id === alunoId) {
          const updated = { ...a, notaAvaliacao: media, mediaGeral: media };
          fetch('/api/cloudsql/students/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch((err) => console.error('Error updating student evaluation grade in Cloud SQL:', err));
          return updated;
        }
        return a;
      })
    );

    const alunoTarget = alunos.find((a) => a.id === alunoId);
    if (alunoTarget) {
      setNotificacoes((prev) => [
        {
          id: Date.now().toString(),
          texto: `🥋 AVALIAÇÃO DE TATAME CONCLUÍDA! Sua Média Geral de Tatame foi lançada: ${media.toFixed(2).replace('.', ',')}. Acesse o portal para ver os detalhes do seu desempenho!`,
          data: new Date().toLocaleString('pt-BR'),
          para: alunoTarget.nome,
          de: 'PROFESSOR YURI CRUZ',
        },
        ...prev,
      ]);
    }
  };

  // Professores & Instrutores Checkin Handlers
  const handleAddProfessorCheckin = (record: ProfessorCheckinRecord) => {
    const recordWithId: ProfessorCheckinRecord = {
      ...record,
      id: record.id || `prof_chk_${record.usuarioId}_${record.data}`,
    };
    setProfessorCheckins((prev) => [recordWithId, ...prev.filter(p => p.id !== recordWithId.id)]);

    fetch('/api/cloudsql/checkins/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...recordWithId,
        usuarioId: recordWithId.usuarioId,
        dataHora: `${recordWithId.data} ${recordWithId.hora}`,
        status: recordWithId.status || 'PENDENTE',
        tipoCheckin: 'professor',
      }),
    }).catch((err) => console.error('Error persisting professor checkin request:', err));
  };

  const handleAprovarProfessorCheckin = (id: string, adminNome: string, adminId: number) => {
    const dataConfirmacao = new Date().toLocaleString('pt-BR');
    let updatedRecord: ProfessorCheckinRecord | null = null;
    setProfessorCheckins((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedRecord = {
            ...c,
            status: 'CONFIRMADO',
            adminResponsavelNome: adminNome,
            adminResponsavelId: adminId,
            dataConfirmacao,
          };
          return updatedRecord;
        }
        return c;
      })
    );

    if (updatedRecord) {
      fetch('/api/cloudsql/checkins/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(updatedRecord as ProfessorCheckinRecord),
          usuarioId: (updatedRecord as ProfessorCheckinRecord).usuarioId,
          dataHora: `${(updatedRecord as ProfessorCheckinRecord).data} ${(updatedRecord as ProfessorCheckinRecord).hora}`,
          status: 'CONFIRMADO',
          tipoCheckin: 'professor',
        }),
      }).catch((err) => console.error('Error persisting professor checkin approval:', err));
    }
  };

  const handleRejeitarProfessorCheckin = (id: string, adminNome: string, adminId: number, motivo?: string) => {
    const dataConfirmacao = new Date().toLocaleString('pt-BR');
    let updatedRecord: ProfessorCheckinRecord | null = null;
    setProfessorCheckins((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedRecord = {
            ...c,
            status: 'REJEITADO',
            adminResponsavelNome: adminNome,
            adminResponsavelId: adminId,
            dataConfirmacao,
            motivoRejeicao: motivo || '',
          };
          return updatedRecord;
        }
        return c;
      })
    );

    if (updatedRecord) {
      fetch('/api/cloudsql/checkins/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(updatedRecord as ProfessorCheckinRecord),
          usuarioId: (updatedRecord as ProfessorCheckinRecord).usuarioId,
          dataHora: `${(updatedRecord as ProfessorCheckinRecord).data} ${(updatedRecord as ProfessorCheckinRecord).hora}`,
          status: 'REJEITADO',
          tipoCheckin: 'professor',
        }),
      }).catch((err) => console.error('Error persisting professor checkin rejection:', err));
    }
  };

  const handleDeleteProfessorCheckin = (id: string) => {
    setProfessorCheckins((prev) => prev.filter((c) => c.id !== id));

    fetch(`/api/cloudsql/checkins/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Error deleting professor checkin in Cloud SQL:', err));
  };

  // Admin: Provas/exams sender
  const handleEnviarProva = (novaProva: SentExam) => {
    setProvasEnviadas((prev) => [...prev, novaProva]);

    fetch('/api/cloudsql/exams/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaProva),
    }).catch((err) => console.error('Error saving exam to Cloud SQL:', err));

    const targetLabel = novaProva.alunoId === 'todos' ? 'Enviar para todos' : alunos.find((a) => a.id === novaProva.alunoId)?.nome || 'Atleta';
    setNotificacoes((prev) => [
      {
        id: Date.now().toString(),
        texto: `📋 NOVO DESAFIO TEÓRICO LANÇADO: "${novaProva.tituloProva}" (${novaProva.questoes.length} questões). Acesse a aba "Provas" para responder e obter sua outorga de faixa!`,
        data: new Date().toLocaleString('pt-BR'),
        para: targetLabel,
        de: novaProva.enviadoPor,
      },
      ...prev,
    ]);
  };

  const handleRemoverProva = (id: number) => {
    setProvasEnviadas((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/cloudsql/exams/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Error deleting exam in Cloud SQL:', err));
  };

  const handleLancarNotaProva = (provaId: number, alunoId: number, nota: number) => {
    setProvasEnviadas((prev) =>
      prev.map((p) => {
        if (p.id === provaId) {
          const updatedNotas = { ...p.notas, [alunoId]: nota };
          return { ...p, notas: updatedNotas };
        }
        return p;
      })
    );

    fetch('/api/cloudsql/exams/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: provaId, alunoId, nota }),
    }).catch((err) => console.error('Error grading exam in Cloud SQL:', err));
  };

  // Admin / Professor / Instrutor: Turmas management
  const handleAddTurma = (
    nome: string,
    horario: string,
    diaSemana?: string,
    professorId?: number,
    professorNome?: string
  ) => {
    const isInstrutor = usuarioLogado?.tipo === 'instrutor';
    const novaSchedule: TrainingSchedule = {
      id: Date.now().toString(),
      diaSemana: diaSemana || 'Segunda',
      horario,
      status: isInstrutor ? 'aguardando' : 'confirmado',
      professorId,
      professorNome,
      nomeTurma: nome,
    };
    setTrainingSchedules((prev) => [...prev, novaSchedule]);
  };

  const handleRemoveTurma = (id: string) => {
    setTrainingSchedules((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleLockTurma = (id: string) => {
    setTrainingSchedules((prev) =>
      prev.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t))
    );
  };

  // Admin: Graduation Belt promotion helper
  const handleGraduarAluno = (alunoId: number, faixaOutorgada: string) => {
    setAlunos((prev) =>
      prev.map((a) => {
        if (a.id === alunoId) {
          const updated = { ...a, faixa: faixaOutorgada, notaAvaliacao: null };
          fetch('/api/cloudsql/students/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch((err) => console.error('Error saving student graduation in Cloud SQL:', err));
          return updated;
        }
        return a;
      })
    );

    const studentName = alunos.find((a) => a.id === alunoId)?.nome || 'Atleta';
    setNotificacoes((prev) => [
      {
        id: Date.now().toString(),
        texto: `🥋🎉 SOLENIDADE DE GRADUAÇÃO! Com imensa honra, declaramos o atleta ${studentName} promovido para a Faixa ${faixaOutorgada.toUpperCase()}! Que essa nova etapa traga sabedoria e persistência. Oss! 🔴⚫`,
        data: new Date().toLocaleString('pt-BR'),
        para: 'Enviar para todos',
        de: 'PROFESSOR YURI CRUZ',
      },
      ...prev,
    ]);
  };

  // Admin: News publisher
  const handlePublicarNoticia = async (titulo: string, conteudo: string, tipo: 'noticia' | 'aviso' | 'urgente') => {
    const nova: NewsItem = {
      id: Date.now(),
      titulo,
      conteudo,
      tipo,
      data: new Date().toLocaleString('pt-BR'),
      autor: usuarioLogado?.nome || 'PROFESSOR YURI CRUZ',
    };
    try {
      await fetch('/api/cloudsql/noticias/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noticia: nova }),
      });
    } catch (err) {
      console.warn('Erro ao salvar notícia no servidor:', err);
    }
    setNoticias((prev) => [nova, ...prev]);
  };

  // Admin/Professor: Video adder
  const handleAddVideo = async (titulo: string, descricao: string, url: string, base64Local: string | null) => {
    let videoId: string | null = null;
    if (url) {
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || null;
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || null;
      }
    }

    const novo: VideoItem = {
      id: Date.now(),
      titulo,
      descricao,
      url,
      videoId,
      arquivoLocal: base64Local,
      tipoFonte: base64Local ? 'local' : 'youtube',
      data: new Date().toLocaleString('pt-BR'),
      autor: usuarioLogado?.nome || 'Mestre Carlos',
    };
    try {
      await fetch('/api/cloudsql/videos/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video: novo }),
      });
    } catch (err) {
      console.warn('Erro ao salvar vídeo no servidor:', err);
    }
    setVideos((prev) => [novo, ...prev]);
  };

  // Admin: Certificates attaching helper
  const handleAddCertificado = (alunoId: number, nomeArq: string, pdfBase64: string) => {
    const student = alunos.find((a) => a.id === alunoId);
    if (!student) return;

    const novo: CertificateItem = {
      id: Date.now(),
      alunoId,
      alunoNome: student.nome,
      nomeArquivo: nomeArq,
      arquivoPDF: pdfBase64,
      data: new Date().toLocaleString('pt-BR'),
      enviadoPor: usuarioLogado?.nome || 'Mestre Carlos Silva',
    };

    setCertificados((prev) => [...prev, novo]);

    // Send a message box alert specifically to that student
    setNotificacoes((prev) => [
      {
        id: Date.now().toString(),
        texto: `📜 CERTIFICADO EMITIDO: Um novo certificado oficial de graduação (${nomeArq}) foi anexado e está disponível para download na sua aba "Certificados".`,
        data: new Date().toLocaleString('pt-BR'),
        para: student.nome,
        de: usuarioLogado?.nome || 'Diretoria',
      },
      ...prev,
    ]);
  };

  const handleRemoverCertificado = (id: number) => {
    setCertificados((prev) => prev.filter((c) => c.id !== id));
  };

  // Chat: sending notifications custom dispatcher
  const handleEnviarNotificacao = (texto: string, para: string) => {
    const nova: Notification = {
      id: Date.now().toString(),
      texto,
      data: new Date().toLocaleString('pt-BR'),
      para,
      de: usuarioLogado?.nome || 'Administração',
    };
    setNotificacoes((prev) => [nova, ...prev]);
  };

  // Admin: Approve professor
  const handleAprovarProfessor = (profId: number) => {
    handleAprovarUsuario(profId);
    alert('Professor aprovado com sucesso! Agora ele tem permissão de acesso ao sistema.');
  };

  // Admin: Theme customization
  const handleThemeChange = (newThemeKey: string) => {
    setThemeKey(newThemeKey);
    try {
      localStorage.setItem('arena_theme_key', newThemeKey);
      localStorage.setItem('themeKey', newThemeKey);
    } catch (e) {
      console.warn(e);
    }
    if (isHydratedRef.current) {
      syncState('themeKey', newThemeKey);
    }
  };

  // Admin: Training schedules checklist
  const handleAddTrainingSchedule = (diaSemana: string, horario: string, status: 'aguardando' | 'confirmado' | 'cancelado') => {
    const newId = Date.now().toString();
    const newItem: TrainingSchedule = {
      id: newId,
      diaSemana,
      horario,
      status,
    };
    setTrainingSchedules((prev) => [...prev, newItem]);
  };

  const handleUpdateTrainingStatus = (id: string, newStatus: 'aguardando' | 'confirmado' | 'cancelado') => {
    setTrainingSchedules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleDeleteTrainingSchedule = (id: string) => {
    setTrainingSchedules((prev) => prev.filter((item) => item.id !== id));
  };

  // Admin: Approval of users (students/professors/instructors)
  const handleAprovarUsuario = (id: number) => {
    const targetUser = usuarios.find((u) => Number(u.id) === Number(id));
    if (!targetUser) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedUser: User = {
      ...targetUser,
      aprovado: true,
      status: 'ativo',
      dataAprovacao: todayStr,
    };

    setUsuarios((prev) =>
      prev.map((u) => {
        if (Number(u.id) === Number(id)) {
          // If approved user is a teacher or instructor, approve them in professors list as well
          if (u.tipo === 'professor' || u.tipo === 'instrutor') {
            setProfessores((profList) => {
              const exists = profList.some((p) => Number(p.id) === Number(id));
              if (exists) {
                return profList.map((p) => (Number(p.id) === Number(id) ? { ...p, aprovado: true } : p));
              } else {
                return [...profList, { id: u.id, nome: u.nome, email: u.email, aprovado: true }];
              }
            });
          }
          return updatedUser;
        }
        return u;
      })
    );

    // Persist approved status directly to Cloud SQL
    fetch('/api/cloudsql/users/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    }).catch((err) => console.warn('Cloud SQL user approve notice:', err));

    if (targetUser.tipo === 'aluno') {
      const existingStudent = alunos.find((a) => a.usuarioId != null && Number(a.usuarioId) === Number(id));
      if (existingStudent) {
        const updatedStudent = { ...existingStudent, ativo: true, status: 'ativo' as const, dataAprovacao: existingStudent.dataAprovacao || todayStr };
        fetch('/api/cloudsql/students/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent),
        }).catch((err) => console.warn('Cloud SQL student approve notice:', err));
      }

      setAlunos((prevAlunos) => {
        const hasExisting = prevAlunos.some(
          (a) => a.usuarioId != null && Number(a.usuarioId) === Number(id)
        );

        if (hasExisting) {
          return prevAlunos.map((a) => {
            if (a.usuarioId != null && Number(a.usuarioId) === Number(id)) {
              return {
                ...a,
                usuarioId: id,
                ativo: true,
                status: 'ativo' as const,
                dataAprovacao: a.dataAprovacao || todayStr,
                dataInicioTreino: a.dataInicioTreino || targetUser.dataInicioTreino || todayStr,
              };
            }
            return a;
          });
        } else {
          const newStudentId = Math.max(...prevAlunos.map((a) => a.id), 0) + 1;
          const newStudent: Student = {
            id: newStudentId,
            usuarioId: targetUser.id,
            nome: targetUser.nome,
            cpf: targetUser.cpf || '',
            dataNascimento: targetUser.dataNascimento || '',
            idade: targetUser.dataNascimento ? new Date().getFullYear() - new Date(targetUser.dataNascimento).getFullYear() : 20,
            faixa: targetUser.faixa || 'Faixa Branca',
            fotoPerfil: targetUser.fotoPerfil || '',
            ativo: true,
            status: 'ativo',
            endereco: targetUser.endereco || '',
            whatsapp: targetUser.whatsapp || '',
            tipoSangue: targetUser.tipoSangue || '',
            alergico: targetUser.alergico || '',
            checkins: [],
            pontosCompeticao: 0,
            notaAvaliacao: null,
            mediaGeral: 0,
            medalhasOuro: 0,
            medalhasPrata: 0,
            medalhasBronze: 0,
            professorResponsavelId: targetUser.professorResponsavelId,
            professorResponsavelNome: targetUser.professorResponsavelNome,
            dataInicioTreino: targetUser.dataInicioTreino || todayStr,
            dataCadastro: targetUser.dataCadastro || todayStr,
            dataAprovacao: todayStr,
            createdAt: targetUser.createdAt || new Date().toISOString(),
          };
          fetch('/api/cloudsql/students/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStudent),
          }).catch((err) => console.warn('Cloud SQL new student approve notice:', err));
          return [...prevAlunos, newStudent];
        }
      });
    }
  };

  const handleDeletarUsuario = (id: number) => {
    const user = usuarios.find((u) => u.id === id);
    if (!user) return;
    if (user.tipo === 'admin' || user.email === 'admin@admin.com') {
      alert('A conta administradora é a conta base da plataforma e não pode ser excluída.');
      return;
    }
    const userCpfClean = user.cpf && !user.cpf.startsWith('INF-') ? user.cpf.replace(/\D/g, '') : '';
    const userEmailClean = user.email ? user.email.trim().toLowerCase() : '';
    const uNameNorm = user.nome ? user.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    // Delete directly from Cloud SQL
    fetch(`/api/cloudsql/users/${id}`, { method: 'DELETE' }).catch((err) => console.warn('Cloud SQL user delete err:', err));
    fetch(`/api/cloudsql/students/${id}`, { method: 'DELETE' }).catch((err) => console.warn('Cloud SQL student delete err:', err));

    setUsuarios((prev) => prev.filter((u) => Number(u.id) !== Number(id)));
    setAlunos((prev) => prev.filter((a) => {
      if (a.usuarioId != null && Number(a.usuarioId) === Number(id)) return false;
      const aNameNorm = a.nome ? a.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      if (uNameNorm && aNameNorm === uNameNorm && user.tipo === 'aluno') return false;
      return true;
    }));
    setProfessores((prev) => prev.filter((p) => {
      if (Number(p.id) === Number(id)) return false;
      if (userEmailClean && p.email.trim().toLowerCase() === userEmailClean) return false;
      return true;
    }));

    // Cascade delete across check-ins, notifications, exams, certificates, justifications, password resets, subscriptions
    setCheckinsPendentes((prev) => prev.filter(c => Number(c.alunoId) !== Number(id) && (!c.alunoNome || c.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== uNameNorm)));
    setCheckinsConfirmados((prev) => prev.filter(c => Number(c.alunoId) !== Number(id) && (!c.alunoNome || c.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== uNameNorm)));
    setNotificacoes((prev) => prev.filter(n => Number(n.usuarioId) !== Number(id) && Number(n.destinatarioId) !== Number(id)));
    setProvasEnviadas((prev) => prev.filter(p => Number(p.alunoId) !== Number(id) && (!p.alunoNome || p.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== uNameNorm)));
    setCertificados((prev) => prev.filter(cert => Number(cert.alunoId) !== Number(id) && (!cert.alunoNome || cert.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== uNameNorm)));
    setJustificativasFaltas((prev) => prev.filter(j => Number(j.alunoId) !== Number(id) && (!j.alunoNome || j.alunoNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== uNameNorm)));
    setRecuperacoesSenha((prev) => prev.filter(r => Number(r.userId) !== Number(id) && (userEmailClean ? r.userEmail?.toLowerCase() !== userEmailClean : true)));
    setConfrontoInscricoes((prev) => prev.filter(ci => Number(ci.atletaId) !== Number(id) && (!ci.atletaNome || ci.atletaNome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== uNameNorm)));

    alert(`O cadastro de "${user.nome}" e seus registros vinculados foram excluídos com sucesso!`);
  };

  // Admin/User: Personal Profile updates
  const handleSaveAdminProfile = (updatedUser: User) => {
    let u = { ...updatedUser };
    if (!u.nome) {
      u.nome = 'Administrador';
    }
    setUsuarioLogado(u);
    localStorage.setItem('arena_session', JSON.stringify(u));
    sessionStorage.setItem('arena_session', JSON.stringify(u));
    setUsuarios((prev) => prev.map((usr) => (Number(usr.id) === Number(u.id) ? u : usr)));

    // Update associated student details if necessary
    setAlunos((prev) =>
      prev.map((a) =>
        Number(a.usuarioId) === Number(u.id)
          ? {
              ...a,
              nome: u.nome,
              whatsapp: u.whatsapp,
              endereco: u.endereco,
              tipoSangue: u.tipoSangue,
              alergico: u.alergico,
              fotoPerfil: u.fotoPerfil,
              faixa: u.faixa || a.faixa,
              contatoEmergenciaNome: u.contatoEmergenciaNome,
              contatoEmergenciaTelefone: u.contatoEmergenciaTelefone,
            }
          : a
      )
    );
  };

  // Admin: Change student password
  const handleChangeStudentPassword = (alunoId: number, novaSenha: string) => {
    const student = alunos.find((a) => a.id === alunoId);
    if (!student) return;

    const studentCpfClean = student.cpf ? student.cpf.replace(/\D/g, '') : '';
    const studentNameNormalized = student.nome ? student.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    const matchedUser = usuarios.find((u) => {
      if (student.usuarioId && Number(u.id) === Number(student.usuarioId)) return true;
      const uNameNormalized = u.nome ? u.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      if (uNameNormalized && uNameNormalized === studentNameNormalized && u.tipo === 'aluno') return true;
      return false;
    });

    if (!matchedUser) {
      alert('Este aluno não possui uma conta de usuário cadastrada.');
      return;
    }

    setUsuarios((prev) =>
      prev.map((u) => (Number(u.id) === Number(matchedUser.id) ? { ...u, senha: novaSenha.trim() } : u))
    );
  };

  // Admin: Change any user password
  const handleChangeUserPassword = (id: number, novaSenha: string) => {
    setUsuarios((prev) =>
      prev.map((u) => (Number(u.id) === Number(id) ? { ...u, senha: novaSenha.trim() } : u))
    );
  };

  // Password Recovery: User submits reset request
  const handleSubmitRecuperacao = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '');
    const matchedUser = usuarios.find(
      (u) => u.cpf && u.cpf.replace(/\D/g, '') === cleanCpf
    );

    if (recuperacoesSenha.some((r) => r.cpf.replace(/\D/g, '') === cleanCpf && r.status === 'pendente')) {
      alert('Já existe uma solicitação de redefinição pendente para este CPF.');
      return false;
    }

    const newRequest = {
      id: Date.now().toString(),
      cpf: cpf,
      email: matchedUser ? matchedUser.email : undefined,
      data: new Date().toLocaleString('pt-BR'),
      status: 'pendente' as const,
    };

    setRecuperacoesSenha((prev) => [...prev, newRequest]);
    return true;
  };

  // Password Recovery: Admin clicks "Resetar Senha"
  const handleResetarSenhaRecuperacao = (requestId: string) => {
    const request = recuperacoesSenha.find((r) => r.id === requestId);
    if (!request) return;

    const cleanReqCpf = request.cpf.replace(/\D/g, '');
    const userToReset = usuarios.find((u) => {
      const uCpfClean = u.cpf ? u.cpf.replace(/\D/g, '') : '';
      return uCpfClean && uCpfClean === cleanReqCpf;
    });

    if (!userToReset) {
      alert('Erro: Usuário correspondente a este CPF não foi encontrado.');
      return;
    }

    // Reset password to '1234567'
    setUsuarios((prev) =>
      prev.map((u) => (Number(u.id) === Number(userToReset.id) ? { ...u, senha: '1234567' } : u))
    );

    // Remove the request immediately from the list
    setRecuperacoesSenha((prev) =>
      prev.filter((r) => r.id !== requestId)
    );
  };

  // Password Recovery: Admin deletes a log
  const handleRemoverSolicitacaoRecuperacao = (requestId: string) => {
    setRecuperacoesSenha((prev) => prev.filter((r) => r.id !== requestId));
  };

  // Password Recovery: Force first-time login change
  const handleMandatoryPasswordChange = (userId: number, newSenha: string) => {
    setUsuarios((prev) =>
      prev.map((u) => (Number(u.id) === Number(userId) ? { ...u, senha: newSenha.trim() } : u))
    );
    // Sync active session if it matches the current user
    setUsuarioLogado((prev) => {
      if (prev && Number(prev.id) === Number(userId)) {
        const updated = { ...prev, senha: newSenha.trim() };
        localStorage.setItem('arena_session', JSON.stringify(updated));
        sessionStorage.setItem('arena_session', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Carousel Manage Handlers
  const handleAdicionarFotoCarrossel = (fotoBase64: string) => {
    setCarouselFotos((prev) => [...prev, fotoBase64]);
  };

  const handleRemoverUltimaFoto = () => {
    setCarouselFotos((prev) => prev.slice(0, -1));
  };

  // Publicidade Click & View Handlers
  const handleRegistrarCliquePublicidade = (campaignId: string, pagina: string) => {
    setPublicidades((prev) =>
      prev.map((pub) => {
        if (pub.id === campaignId) {
          const clicks = (pub.cliques || 0) + 1;
          const history = pub.historicoCliques || [];
          const newEntry = {
            dataHora: new Date().toLocaleString('pt-BR'),
            pagina,
          };
          return {
            ...pub,
            cliques: clicks,
            historicoCliques: [newEntry, ...history].slice(0, 100),
          };
        }
        return pub;
      })
    );
  };

  const handleRegistrarVisualizacaoPublicidade = (campaignId: string) => {
    setPublicidades((prev) =>
      prev.map((pub) => {
        if (pub.id === campaignId) {
          return {
            ...pub,
            visualizacoes: (pub.visualizacoes || 0) + 1,
          };
        }
        return pub;
      })
    );
  };

  // Renders the correct pane based on tab selection
  const renderAdminPane = () => {
    const visibleAlunos = alunos.filter((a) => {
      if (!usuarioLogado) return false;

      // 1. Exclude YURI CRUZ / Admin accounts from student lists
      const isUriOrAdmin =
        (a.nome && (a.nome.toUpperCase().includes('URI CRUZ') || a.nome.toUpperCase().includes('YURI CRUZ') || a.nome.toUpperCase().includes('ADMINISTRADOR'))) ||
        (a.email && (a.email.includes('admin') || a.email.includes('uricruz') || a.email.includes('yuricruz')));
      if (isUriOrAdmin) return false;

      // 2. Cross-check with linked user profile
      const matchedUser = usuarios.find((u) => {
        if (a.usuarioId && Number(u.id) === Number(a.usuarioId)) return true;
        return false;
      });

      if (matchedUser) {
        if (matchedUser.tipo === 'admin' || matchedUser.tipo === 'professor' || matchedUser.tipo === 'instrutor') {
          return false; // Exclude non-student user profiles
        }
      }

      // 3. For Professors/Instructors: filter by responsible teacher
      if (usuarioLogado.tipo !== 'admin') {
        const isProfResp =
          a.professorResponsavelId === usuarioLogado.id ||
          (a as any).professorId === usuarioLogado.id ||
          (Boolean(a.professorResponsavelNome) && Boolean(usuarioLogado.nome) && a.professorResponsavelNome!.trim().toLowerCase() === usuarioLogado.nome.trim().toLowerCase());
        if (!isProfResp) return false;
      }

      return true;
    });

    switch (activeAdminTab) {
      case 'dashboard':
        return (
          <DashboardPane
            user={usuarioLogado!}
            usuarios={usuarios}
            alunos={visibleAlunos}
            checkinsPendentes={checkinsPendentes}
            checkinsConfirmados={checkinsConfirmados}
            notificacoes={notificacoes}
            carouselFotos={carouselFotos}
            carouselPaginas={carouselPaginas}
            onUpdateCarouselPaginas={setCarouselPaginas}
            logoApp={logoApp}
            onAprovarCheckin={handleAprovarCheckin}
            onAprovarTodosCheckins={handleAprovarTodosCheckins}
            onAdicionarFotoCarrossel={handleAdicionarFotoCarrossel}
            onRemoverUltimaFoto={handleRemoverUltimaFoto}
            onOpenParabensModal={handleOpenParabensModal}
            onLogoChange={setLogoApp}
            onRemoverNotificacao={handleRemoverNotificacao}
            trainingSchedules={trainingSchedules}
            themeKey={themeKey}
            onThemeChange={handleThemeChange}
            onAddTrainingSchedule={handleAddTrainingSchedule}
            onUpdateTrainingStatus={handleUpdateTrainingStatus}
            onDeleteTrainingSchedule={handleDeleteTrainingSchedule}
            onAprovarUsuario={handleAprovarUsuario}
            onDeletarUsuario={handleDeletarUsuario}
            onSaveAdminProfile={handleSaveAdminProfile}
            publicidades={publicidades}
            exibirPublicidadeAdmin={exibirPublicidadeAdmin}
            onToggleExibirPublicidadeAdmin={handleToggleExibirPublicidadeAdmin}
            onAddPublicidade={(imagemUrl, paginas, slideNumero) => {
              setPublicidades((prev) => {
                const filtered = prev.filter((item) => item.slideNumero !== slideNumero);
                const newItem: PublicidadeItem = {
                  id: `slide-${slideNumero}-${Math.random().toString().slice(2, 6)}`,
                  imagemUrl,
                  paginas,
                  slideNumero
                };
                return [...filtered, newItem].sort((a, b) => (a.slideNumero || 0) - (b.slideNumero || 0));
              });
            }}
            onRemovePublicidade={(id) => {
              setPublicidades((prev) => prev.filter((item) => item.id !== id));
            }}
            onUpdatePublicidadePages={(id, paginas) => {
              setPublicidades((prev) =>
                prev.map((item) => (item.id === id ? { ...item, paginas } : item))
              );
            }}
            justificativasFaltas={justificativasFaltas}
            onAprovarJustificativa={handleAprovarJustificativa}
            onRejeitarJustificativa={handleRejeitarJustificativa}
            publicidadePosicao={publicidadePosicao}
            onUpdatePublicidadePosicao={setPublicidadePosicao}
            onRegistrarCliquePublicidade={handleRegistrarCliquePublicidade}
            onRegistrarVisualizacaoPublicidade={handleRegistrarVisualizacaoPublicidade}
            onOpenPlacar={() => window.open('https://arenadocompetidor.ai.studio', '_blank', 'noopener,noreferrer')}
          />
        );
      case 'alunos':
        return (
          <AlunosPane
            currentUser={usuarioLogado!}
            alunos={visibleAlunos}
            onAddAluno={handleAddAluno}
            onToggleStatus={handleToggleStatus}
            onDeletarAluno={handleDeletarAluno}
            onChangePassword={handleChangeStudentPassword}
            onDeletarUsuario={handleDeletarUsuario}
            onChangeUserPassword={handleChangeUserPassword}
            onAprovarUsuario={handleAprovarUsuario}
            isAdmin={usuarioLogado?.tipo === 'admin'}
            onUpdateAluno={handleUpdateAluno}
            onUpdateUsuario={handleUpdateUsuario}
            usuarios={usuarios}
          />
        );
      case 'checkin': {
        const myPendingCheckins = checkinsPendentes.filter(req => visibleAlunos.some(a => a.id === req.alunoId));
        const pendingProfessoresCount = professorCheckins.filter(c => c.status === 'PENDENTE').length;
        const isAdmin = usuarioLogado?.tipo === 'admin';

        return (
          <div className="space-y-6">
            {/* SUB-TAB SWITCHER FOR CHECK-IN MODULE */}
            <div className="flex flex-wrap gap-2 bg-[#141414] p-1.5 rounded-2xl border border-neutral-800 max-w-2xl text-left">
              <button
                type="button"
                onClick={() => setCheckinSubTab('competidores')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  checkinSubTab === 'competidores'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{isAdmin ? 'Competidores / Alunos' : 'Minhas Turmas (Alunos)'}</span>
                {myPendingCheckins.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] bg-amber-500 text-black font-black rounded-full">
                    {myPendingCheckins.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCheckinSubTab('professores')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  checkinSubTab === 'professores'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{isAdmin ? 'Professores e Instrutores' : 'Minha Presença & Histórico'}</span>
                {isAdmin && pendingProfessoresCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] bg-amber-500 text-black font-black rounded-full">
                    {pendingProfessoresCount}
                  </span>
                )}
              </button>

              {(isAdmin || usuarioLogado?.email === 'admin@admin.com') && (
                <button
                  type="button"
                  onClick={() => setCheckinSubTab('professorUriCruz')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                    checkinSubTab === 'professorUriCruz'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-orange-400" />
                  <span>PROFESSOR YURI CRUZ</span>
                </button>
              )}
            </div>

            {checkinSubTab === 'competidores' ? (
              <CompetitoresCheckinDashboard
                currentUser={usuarioLogado!}
                alunos={visibleAlunos}
                checkinsPendentes={checkinsPendentes}
                checkinsConfirmados={checkinsConfirmados}
                turmas={turmas}
                professores={professores}
                onAprovarCheckin={handleAprovarCheckin}
                onRejeitarCheckinSingle={handleRejeitarCheckinSingle}
                onAprovarTodosCheckins={handleAprovarTodosCheckins}
                isAdmin={isAdmin}
                justificativasFaltas={justificativasFaltas}
                onAprovarJustificativa={handleAprovarJustificativa}
                onRejeitarJustificativa={handleRejeitarJustificativa}
              />
            ) : checkinSubTab === 'professores' ? (
              <ProfessoresCheckinPane
                currentUser={usuarioLogado!}
                professorCheckins={professorCheckins}
                onAddCheckin={handleAddProfessorCheckin}
                onAprovarCheckin={handleAprovarProfessorCheckin}
                onRejeitarCheckin={handleRejeitarProfessorCheckin}
                onDeleteCheckin={handleDeleteProfessorCheckin}
                themeKey={themeKey}
              />
            ) : (
              <ProfessorUriCruzPane
                currentUser={usuarioLogado!}
                turmas={turmas}
                alunos={alunos}
                checkinsPendentes={checkinsPendentes}
                checkinsConfirmados={checkinsConfirmados}
                justificativasFaltas={justificativasFaltas}
                trainingSchedules={trainingSchedules}
                onAprovarCheckin={handleAprovarCheckin}
                onAprovarTodosCheckins={handleAprovarTodosCheckins}
                onAprovarJustificativa={handleAprovarJustificativa}
                onRejeitarJustificativa={handleRejeitarJustificativa}
                themeKey={themeKey}
              />
            )}
          </div>
        );
      }
      case 'rankings':
        return <RankingsPane alunos={visibleAlunos} currentUser={usuarioLogado} onAdicionarMedalha={handleAdicionarMedalha} />;
      case 'rankingPresenca':
        const sortedF = [...visibleAlunos].sort((a, b) => b.checkins.length - a.checkins.length);
        return (
          <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 mb-6 border-b border-neutral-900 pb-3 text-left">
              <Calendar className="w-5.5 h-5.5 text-orange-500" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Ranking por Presença</h3>
            </div>
            <div className="space-y-2 max-w-xl">
              {sortedF.map((a, idx) => (
                <div key={a.id} className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 flex justify-between items-center text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-neutral-500 w-5">#{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20" title="1º Colocado (Ouro)">
                          <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)] animate-pulse" />
                        </div>
                      )}
                      {idx === 1 && (
                        <div className="bg-neutral-400/10 p-1.5 rounded-lg border border-neutral-400/20" title="2º Colocado (Prata)">
                          <Trophy className="w-4 h-4 text-neutral-300" />
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="bg-amber-750/10 p-1.5 rounded-lg border border-amber-750/20" title="3º Colocado (Bronze)">
                          <Trophy className="w-4 h-4 text-amber-600" />
                        </div>
                      )}
                      <div>
                        <strong className="text-white text-sm block">{a.nome}</strong>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase block mt-0.5">{a.faixa}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-extrabold text-orange-500 text-sm">{a.checkins.length} treinos</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'avaliacoes':
      case 'provas':
        return (
          <ProvasEAvaliacoesModule
            currentUser={usuarioLogado!}
            alunos={visibleAlunos}
            turmas={turmas}
            usuarios={usuarios}
            checkinsConfirmados={checkinsConfirmados}
            provasEnviadas={provasEnviadas}
            onSaveAvaliacaoLegacy={handleSaveAvaliacao}
            onEnviarProva={handleEnviarProva}
            onRemoverProva={handleRemoverProva}
            onLancarNotaProva={handleLancarNotaProva}
          />
        );
      case 'aniversariantes':
        const aniversariantesMes = visibleAlunos
          .filter((a) => {
            if (!a.dataNascimento) return false;
            const partes = a.dataNascimento.split('-');
            return parseInt(partes[1]) === new Date().getMonth() + 1;
          })
          .sort((a, b) => {
            const dA = parseInt(a.dataNascimento.split('-')[2]);
            const dB = parseInt(b.dataNascimento.split('-')[2]);
            return dA - dB;
          });

        return (
          <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 mb-6 border-b border-neutral-900 pb-3 text-left">
              <Cake className="w-5.5 h-5.5 text-orange-500" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Aniversariantes do Mês</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Fique de olho e parabenize seus colegas atletas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aniversariantesMes.length > 0 ? (
                aniversariantesMes.map((a) => {
                  const partes = a.dataNascimento.split('-');
                  const dia = partes[2];
                  const mesNome = new Date(2026, parseInt(partes[1]) - 1, 1).toLocaleString('pt-BR', { month: 'long' });

                  return (
                    <div key={a.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-850 flex items-center justify-between text-left">
                      <div>
                        <strong className="text-white text-sm block">{a.nome}</strong>
                        <span className="text-xs text-neutral-400 block mt-0.5">Dia {dia} de {mesNome}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-10 opacity-50 text-sm">Nenhum aniversariante registrado neste mês.</div>
              )}
            </div>
          </div>
        );
      case 'noticias':
        return (
          <NoticiasPane
            user={usuarioLogado!}
            noticias={noticias}
            onPublicarNoticia={handlePublicarNoticia}
            onExcluirNoticia={handleExcluirNoticia}
          />
        );
      case 'videos':
        return (
          <VideosPane
            user={usuarioLogado!}
            videos={videos}
            onAddVideo={handleAddVideo}
            onExcluirVideo={handleExcluirVideo}
            liveStreams={liveStreams}
            onUpdateLiveStreams={handleUpdateLiveStreams}
            alunos={alunos}
            turmas={turmas}
            confrontoCampeonatos={confrontoCampeonatos}
            onAddNotification={(texto, para) => {
              const newNotif: Notification = {
                id: `notif-${Date.now()}-${Math.random()}`,
                texto,
                data: new Date().toISOString().slice(0, 10),
                para,
                de: usuarioLogado?.nome || 'Administrador',
              };
              setNotificacoes((prev) => [newNotif, ...prev]);
            }}
            themeKey={themeKey}
          />
        );
      case 'certificados':
        return (
          <CertificadosPane
            user={usuarioLogado!}
            alunos={visibleAlunos}
            certificados={certificados}
            onAddCertificado={handleAddCertificado}
            onRemoverCertificado={handleRemoverCertificado}
            contratosOficiais={contratosOficiais}
            aceitesContratos={contratoAceites}
            onSaveContract={handleSaveContract}
            onPublishContractVersion={handlePublishContractVersion}
          />
        );
      case 'turmas':
        return (
          <TurmasPane
            user={usuarioLogado!}
            turmas={turmas}
            alunos={visibleAlunos}
            onAddTurma={handleAddTurma}
            onRemoveTurma={handleRemoveTurma}
            onToggleLockTurma={handleToggleLockTurma}
            onAddAluno={handleAddAluno}
            onToggleStatus={handleToggleStatus}
            onDeletarAluno={handleDeletarAluno}
            onChangePassword={handleChangeStudentPassword}
            usuarios={usuarios}
            themeKey={themeKey}
          />
        );
      case 'chat':
      case 'notificacoes':
        return (
          <NotificacoesCentralPane
            user={usuarioLogado!}
            alunos={visibleAlunos}
            turmas={turmas}
            notificacoes={notificacoes}
            onEnviarNotificacao={(newNotif) => setNotificacoes((prev) => [newNotif, ...prev])}
            onRemoverNotificacao={handleRemoverNotificacao}
            onRemoverVariasNotificacoes={handleRemoverVariasNotificacoes}
            onAtualizarNotificacao={handleAtualizarNotificacao}
            onZerarNotificacoes={handleZerarNotificacoes}
          />
        );
      case 'agenda':
        if (usuarioLogado?.tipo !== 'admin' && usuarioLogado?.tipo !== 'professor' && usuarioLogado?.tipo !== 'instrutor') {
          return (
            <div className="bg-[#141414] border border-red-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 shadow-2xl animate-scale-in">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                O módulo <strong className="text-white">AGENDA / AULAS EXPERIMENTAIS</strong> é de uso restrito a Administradores e Professores/Instrutores.
              </p>
              <button
                onClick={() => setActiveAdminTab('dashboard')}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            </div>
          );
        }
        return (
          <AgendaAulasExperimentaisPane
            currentUser={usuarioLogado!}
            turmas={turmas}
            trainingSchedules={trainingSchedules}
            professores={professores}
            aulasExperimentais={aulasExperimentais}
            onUpdateAulasExperimentais={setAulasExperimentais}
            onUpdateSchedules={setTrainingSchedules}
          />
        );

      case 'professores': {
        const pendingUsersCount = usuarios.filter((u) => {
          if (u.aprovado) return false;
          if (usuarioLogado?.tipo !== 'admin') {
            return u.professorResponsavelId === usuarioLogado?.id;
          }
          return true;
        }).length;

        return (
          <div className="space-y-6">
            {/* Sub-tab Switcher for Mestres & Turmas */}
            <div className="flex flex-wrap gap-2 bg-[#141414] p-1.5 rounded-xl border border-neutral-800 max-w-3xl text-left">
              <button
                type="button"
                onClick={() => setProfessoresSubTab('solicitacoes')}
                className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                  professoresSubTab === 'solicitacoes'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Solicitações Pendentes</span>
                {pendingUsersCount > 0 && (
                  <span className="bg-amber-500 text-black text-[9px] font-black h-4 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                    {pendingUsersCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setProfessoresSubTab('professores')}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  professoresSubTab === 'professores'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Mestres & Instrutores</span>
              </button>
              <button
                type="button"
                onClick={() => setProfessoresSubTab('turmas')}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  professoresSubTab === 'turmas'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Turmas Cadastradas</span>
              </button>
              {usuarioLogado?.tipo === 'admin' && (
                <button
                  type="button"
                  onClick={() => setProfessoresSubTab('reset-requests')}
                  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                    professoresSubTab === 'reset-requests'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Solicitação de Reset</span>
                  {recuperacoesSenha.filter(r => r.status === 'pendente').length > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                      {recuperacoesSenha.filter(r => r.status === 'pendente').length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {professoresSubTab === 'solicitacoes' && (
              <SolicitacoesPendentesPane
                currentUser={usuarioLogado!}
                usuarios={usuarios}
                alunos={alunos}
                onAprovarUsuario={handleAprovarUsuario}
                onDeletarUsuario={handleDeletarUsuario}
              />
            )}
            {professoresSubTab === 'professores' && (
              <ProfessoresPane
                currentUser={usuarioLogado!}
                usuarios={usuarios}
                onAprovarUsuario={handleAprovarUsuario}
                onDeletarUsuario={handleDeletarUsuario}
                onChangeUserPassword={handleChangeUserPassword}
                onUpdateUsuario={handleUpdateUsuario}
              />
            )}
            {professoresSubTab === 'turmas' && (
              <TurmasPane
                user={usuarioLogado!}
                turmas={turmas}
                alunos={visibleAlunos}
                onAddTurma={handleAddTurma}
                onRemoveTurma={handleRemoveTurma}
                onToggleLockTurma={handleToggleLockTurma}
                onAddAluno={handleAddAluno}
                onToggleStatus={handleToggleStatus}
                onDeletarAluno={handleDeletarAluno}
                onChangePassword={handleChangeStudentPassword}
                usuarios={usuarios}
                themeKey={themeKey}
                onAprovarUsuario={handleAprovarUsuario}
                onUpdateAluno={handleUpdateAluno}
                onUpdateUsuario={handleUpdateUsuario}
              />
            )}
            {professoresSubTab === 'reset-requests' && (
              <ResetRequestsPane
                recuperacoesSenha={recuperacoesSenha}
                usuarios={usuarios}
                onResetarSenha={handleResetarSenhaRecuperacao}
                onRemoverRequest={handleRemoverSolicitacaoRecuperacao}
              />
            )}
          </div>
        );
      }
      case 'googleIntegrations':
        return <GoogleIntegrationsPane />;
      case 'confrontoAdmin':
        return (
          <div className="bg-[#141414] border border-neutral-850 p-6 rounded-3xl space-y-6 animate-fade-in text-left">
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                Administração do CAMPEONATOS / INSCRIÇÕES
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Painel de Controle e Gestão dos campeonatos, chaves, inscrições e logs do módulo CAMPEONATOS / INSCRIÇÕES.
              </p>
            </div>
            <div className="bg-[#0c0c0c] border border-neutral-850 rounded-2xl p-1 md:p-4">
              <OConfrontoModule
                onBack={() => setActiveAdminTab('dashboard')}
                isAdmin={true}
                confrontoInscricoes={confrontoInscricoes}
                onUpdateInscricoes={setConfrontoInscricoes}
                confrontoManutencao={confrontoManutencao}
                onUpdateManutencao={setConfrontoManutencao}
                confrontoCampeonatos={confrontoCampeonatos}
                onUpdateCampeonatos={setConfrontoCampeonatos}
                logoApp={logoApp}
                themeKey={themeKey}
              />
            </div>
          </div>
        );
      case 'centralAtendimento':
        if (usuarioLogado?.tipo !== 'admin') {
          return (
            <div className="bg-[#141414] border border-red-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 shadow-2xl animate-scale-in">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A Central de Inteligência e Gestão de Atendimento (Suporte IA & Protocolos) é de acesso exclusivo do perfil Administrador.
              </p>
              <button
                onClick={() => setActiveAdminTab('dashboard')}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            </div>
          );
        }
        return (
          <AdminSupportPane
            notificacoes={notificacoes}
            onUpdateNotificacoes={setNotificacoes}
            onClose={() => setActiveAdminTab('dashboard')}
          />
        );
      case 'centralPublicidade':
        if (usuarioLogado?.tipo !== 'admin') {
          return (
            <div className="bg-[#141414] border border-red-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 shadow-2xl animate-scale-in">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A Central de Publicidade Patrocinada é de acesso exclusivo do perfil Administrador.
              </p>
              <button
                onClick={() => setActiveAdminTab('dashboard')}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            </div>
          );
        }
        return (
          <CentralPublicidadePane
            publicidades={publicidades}
            exibirPublicidadeAdmin={exibirPublicidadeAdmin}
            onToggleExibirPublicidadeAdmin={handleToggleExibirPublicidadeAdmin}
            onAddPublicidade={(novaCampanha) => {
              setPublicidades((prev) => [...prev.filter((p) => p.id !== novaCampanha.id), novaCampanha]);
            }}
            onUpdatePublicidade={(campanhaAtualizada) => {
              setPublicidades((prev) =>
                prev.map((p) => (p.id === campanhaAtualizada.id ? campanhaAtualizada : p))
              );
            }}
            onRemovePublicidade={(id) => {
              setPublicidades((prev) => prev.filter((p) => p.id !== id));
            }}
            onArchivePublicidade={(id) => {
              setPublicidades((prev) =>
                prev.map((p) => (p.id === id ? { ...p, status: 'arquivada' } : p))
              );
            }}
            onRestorePublicidade={(id) => {
              setPublicidades((prev) =>
                prev.map((p) => (p.id === id ? { ...p, status: 'ativa' } : p))
              );
            }}
            onResetAllMetrics={() => {
              setPublicidades((prev) =>
                prev.map((p) => ({
                  ...p,
                  visualizacoes: 0,
                  cliques: 0,
                  historicoCliques: [],
                }))
              );
            }}
          />
        );
      case 'carteirinhaAdmin':
        if (usuarioLogado?.tipo !== 'admin') {
          return (
            <div className="bg-[#141414] border border-red-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 shadow-2xl animate-scale-in">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                O Módulo de Gestão das Carteiras Virtuais é de uso exclusivo do perfil Administrador.
              </p>
              <button
                onClick={() => setActiveAdminTab('dashboard')}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            </div>
          );
        }
        return (
          <CarteirinhaAdminPane
            usuarios={usuarios}
            alunos={alunos}
            currentUser={usuarioLogado}
          />
        );
      case 'placar':
        if (usuarioLogado?.tipo !== 'admin') {
          return (
            <div className="bg-[#141414] border border-red-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 shadow-2xl animate-scale-in">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                O Módulo de Placar e Cronômetro (CBJJ) é de uso exclusivo do perfil Administrador.
              </p>
              <button
                onClick={() => setActiveAdminTab('dashboard')}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Voltar ao Dashboard
              </button>
            </div>
          );
        }
        return <PlacarModuleGuard onBack={() => setActiveAdminTab('dashboard')} />;
      case 'minhaCarteirinha':
        return (
          <div className="space-y-6 animate-fade-in text-left max-w-xl mx-auto">
            <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
                <Wallet className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">💳 Carteira Digital ACBJJ</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Sua identificação oficial de {
                      usuarioLogado?.tipo === 'professor' ? 'Mestre / Professor' :
                      usuarioLogado?.tipo === 'instrutor' ? 'Instrutor' :
                      usuarioLogado?.tipo === 'arbitro' ? 'Árbitro' :
                      usuarioLogado?.tipo === 'admin' ? 'Administrador' :
                      'Atleta / Membro'
                    } da Arena do Competidor
                  </p>
                </div>
              </div>

              <CarteirinhaCard
                user={usuarioLogado!}
                student={alunos.find((a) => Number(a.usuarioId) === Number(usuarioLogado?.id)) || null}
                config={getCarteirinhaConfig()}
                userCardData={getUserCarteirinhaData(usuarioLogado!.id)}
                showPrintButton={true}
              />

              <div className="mt-4 text-center">
                <p className="text-[10px] text-neutral-500">
                  Apresente esta carteira digital na entrada da academia ou durante eventos oficiais ACBJJ.
                </p>
              </div>
            </div>
          </div>
        );
      case 'evolucaoEmpresarial':
        return (
          <EvolucaoEmpresarialPane
            user={usuarioLogado!}
            alunos={alunos}
            usuarios={usuarios}
            turmas={turmas}
            confrontoCampeonatos={confrontoCampeonatos}
            confrontoInscricoes={confrontoInscricoes}
            onUpdateInscricoes={setConfrontoInscricoes}
            onUpdateCampeonatos={setConfrontoCampeonatos}
            auditLogs={auditLogs}
            mensalidades={mensalidades}
            onSaveMensalidade={handleSaveMensalidade}
            onExcluirMensalidade={handleExcluirMensalidade}
            onPagarMensalidade={handlePagarMensalidade}
            onCancelarMensalidade={handleCancelarMensalidade}
            onEstornarMensalidade={handleEstornarMensalidade}
            onAddAuditLog={(acao, entidade, detalhes, dadosAnt, dadosNovos) => {
              const newLog: AuditLog = {
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date().toLocaleString('pt-BR'),
                userId: usuarioLogado?.id || 1,
                userNome: usuarioLogado?.nome || 'Admin',
                userTipo: usuarioLogado?.tipo || 'admin',
                acao,
                entidade,
                detalhes,
                dadosAnt,
                dadosNovos,
                ipAddress: '127.0.0.1 (Cloud Run)',
              };
              setAuditLogs((prev) => [newLog, ...prev]);
            }}
            healthRecords={healthRecords}
            onUpdateHealthRecord={(record) => {
              setHealthRecords((prev) => {
                const idx = prev.findIndex((h) => h.alunoId === record.alunoId);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = record;
                  return copy;
                }
                return [...prev, record];
              });
            }}
            antiEvasionAlerts={antiEvasionAlerts}
            onUpdateAntiEvasionAlert={(alertId, status, acaoObs) => {
              setAntiEvasionAlerts((prev) =>
                prev.map((a) => (a.id === alertId ? { ...a, status, observacaoAcao: acaoObs || a.observacaoAcao } : a))
              );
            }}
            timelineEvents={timelineEvents}
            onAddTimelineEvent={(event) => {
              const newEv: TimelineEvent = {
                ...event,
                id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              };
              setTimelineEvents((prev) => [newEv, ...prev]);
            }}
            teacherAiAnalyses={teacherAiAnalyses}
            onAddTeacherAiAnalysis={(analysis) => {
              const newAi: TeacherAiAnalysis = {
                ...analysis,
                id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              };
              setTeacherAiAnalyses((prev) => [newAi, ...prev]);
            }}
            studentGoals={studentGoals}
            onAddStudentGoal={(goal) => {
              const newGoal: StudentGoal = {
                ...goal,
                id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              };
              setStudentGoals((prev) => [...prev, newGoal]);
            }}
            onToggleGoalConcluido={(goalId) => {
              setStudentGoals((prev) =>
                prev.map((g) => (g.id === goalId ? { ...g, concluido: !g.concluido, progressoPercent: !g.concluido ? 100 : 0 } : g))
              );
            }}
            studentAchievements={studentAchievements}
            onAddAchievement={(ach) => {
              const newAch: StudentAchievement = {
                ...ach,
                id: `ach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              };
              setStudentAchievements((prev) => [...prev, newAch]);
            }}
            crmInteractions={crmInteractions}
            onAddCrmInteraction={(crm) => {
              const newCrm: CrmInteraction = {
                ...crm,
                id: `crm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              };
              setCrmInteractions((prev) => [newCrm, ...prev]);
            }}
            digitalContracts={digitalContracts}
            onSignContract={(contractId) => {
              setDigitalContracts((prev) =>
                prev.map((c) =>
                  c.id === contractId
                    ? {
                        ...c,
                        assinado: true,
                        dataAssinatura: new Date().toLocaleString('pt-BR'),
                        ipAssinatura: '127.0.0.1 (Cloud Run)',
                      }
                    : c
                )
              );
            }}
            userDigitalDocuments={userDigitalDocuments}
            onAddDigitalDocument={(doc) => {
              const newDoc: UserDigitalDocument = {
                ...doc,
                id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              };
              setUserDigitalDocuments((prev) => [newDoc, ...prev]);
            }}
            backupRecords={backupRecords}
            onCreateBackup={(tipo) => {
              const snapshotData = {
                usuarios,
                alunos,
                professores,
                turmas,
                checkinsConfirmados,
                notificacoes,
                provasEnviadas,
                liveStreams,
                auditLogs,
                healthRecords,
                timelineEvents,
                crmInteractions,
              };
              const jsonStr = JSON.stringify(snapshotData);
              const sizeKb = Math.round(jsonStr.length / 1024);
              const totalEnt =
                usuarios.length +
                alunos.length +
                professores.length +
                turmas.length +
                checkinsConfirmados.length +
                notificacoes.length;

              const newBackup: BackupRecord = {
                id: `bck_${Date.now()}`,
                dataCriacao: new Date().toLocaleString('pt-BR'),
                tipo,
                tamanhoKb: sizeKb,
                totalEntidades: totalEnt,
                jsonSnapshot: jsonStr,
                hashIntegridade: `sha256_${Date.now()}`,
              };
              setBackupRecords((prev) => [newBackup, ...prev]);
            }}
            onRestoreBackup={(backupId) => {
              const target = backupRecords.find((b) => b.id === backupId);
              if (!target) return;
              try {
                const parsed = JSON.parse(target.jsonSnapshot);
                if (parsed.usuarios) setUsuarios(parsed.usuarios);
                if (parsed.alunos) setAlunos(parsed.alunos);
                if (parsed.professores) setProfessores(parsed.professores);
                if (parsed.turmas) setTurmas(parsed.turmas);
                if (parsed.checkinsConfirmados) setCheckinsConfirmados(parsed.checkinsConfirmados);
                if (parsed.notificacoes) setNotificacoes(parsed.notificacoes);
              } catch (e) {
                console.warn(e);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  const getThemeColors = () => {
    const activeKey = themeKey || 'emerald';
    switch (activeKey) {
      case 'blue':
        return {
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          secondary: '#1d4ed8',
          secondaryHover: '#1e40af',
          contrastText: '#ffffff',
        };
      case 'emerald':
        return {
          primary: '#10b981',
          primaryHover: '#059669',
          secondary: '#047857',
          secondaryHover: '#065f46',
          contrastText: '#ffffff',
        };
      case 'purple':
        return {
          primary: '#a855f7',
          primaryHover: '#9333ea',
          secondary: '#701a75',
          secondaryHover: '#4a044e',
          contrastText: '#ffffff',
        };
      case 'red':
        return {
          primary: '#ef4444',
          primaryHover: '#dc2626',
          secondary: '#991b1b',
          secondaryHover: '#7f1d1d',
          contrastText: '#ffffff',
        };
      case 'yellow':
        return {
          primary: '#eab308',
          primaryHover: '#ca8a04',
          secondary: '#a16207',
          secondaryHover: '#854d0e',
          contrastText: '#141414',
        };
      case 'cyan':
        return {
          primary: '#06b6d4',
          primaryHover: '#0891b2',
          secondary: '#0e7490',
          secondaryHover: '#155e75',
          contrastText: '#ffffff',
        };
      case 'rose':
        return {
          primary: '#f43f5e',
          primaryHover: '#e11d48',
          secondary: '#be123c',
          secondaryHover: '#9f1239',
          contrastText: '#ffffff',
        };
      case 'lime':
        return {
          primary: '#84cc16',
          primaryHover: '#65a30d',
          secondary: '#4d7c0f',
          secondaryHover: '#3f6212',
          contrastText: '#141414',
        };
      case 'fuchsia':
        return {
          primary: '#d946ef',
          primaryHover: '#c026d3',
          secondary: '#a21caf',
          secondaryHover: '#86198f',
          contrastText: '#ffffff',
        };
      case 'white':
        return {
          primary: '#ffffff',
          primaryHover: '#e5e5e5',
          secondary: '#a3a3a3',
          secondaryHover: '#737373',
          contrastText: '#141414',
        };
      case 'orange':
      default:
        return {
          primary: '#f97316',
          primaryHover: '#ea580c',
          secondary: '#dc2626',
          secondaryHover: '#b91c1c',
          contrastText: '#ffffff',
        };
    }
  };

  const themeColors = getThemeColors();

  const getThemeStyleTag = () => {
    const p = themeColors.primary;
    const pHov = themeColors.primaryHover;
    const s = themeColors.secondary;
    const sHov = themeColors.secondaryHover;
    const cText = themeColors.contrastText;

    return `
      :root {
        --color-orange-500: ${p} !important;
        --color-orange-600: ${pHov} !important;
        --color-orange-400: ${p} !important;
        --color-orange-300: ${p}dd !important;
        --color-amber-500: ${p} !important;
        --color-amber-600: ${pHov} !important;
        --color-amber-400: ${p} !important;
        --color-red-600: ${s} !important;
        --color-red-700: ${sHov} !important;
      }

      .text-orange-300 { color: ${p}dd !important; }
      .text-orange-400 { color: ${p} !important; }
      .text-orange-500 { color: ${p} !important; }
      .text-orange-500\\/80 { color: ${p}cc !important; }
      .text-orange-500\\/30 { color: ${p}4d !important; }
      .text-orange-600 { color: ${pHov} !important; }
      .hover\\:text-orange-400:hover { color: ${p} !important; }
      .hover\\:text-orange-500:hover { color: ${p} !important; }
      .hover\\:text-orange-600:hover { color: ${pHov} !important; }
      .group-hover\\:text-orange-400 { color: ${p} !important; }
      .group-hover\\:text-orange-500 { color: ${p} !important; }

      .text-amber-400 { color: ${p} !important; }
      .text-amber-500 { color: ${p} !important; }
      .text-amber-500\\/80 { color: ${p}cc !important; }
      .text-amber-500\\/30 { color: ${p}4d !important; }
      .text-amber-600 { color: ${pHov} !important; }

      .bg-orange-400 { background-color: ${p} !important; }
      .bg-orange-500 { background-color: ${p} !important; color: ${cText} !important; }
      .bg-orange-500\\/5 { background-color: ${p}0d !important; }
      .bg-orange-500\\/10 { background-color: ${p}1a !important; }
      .bg-orange-500\\/15 { background-color: ${p}26 !important; }
      .bg-orange-500\\/20 { background-color: ${p}33 !important; }
      .bg-orange-600 { background-color: ${pHov} !important; color: ${cText} !important; }
      .hover\\:bg-orange-500:hover { background-color: ${p} !important; color: ${cText} !important; }
      .hover\\:bg-orange-600:hover { background-color: ${pHov} !important; color: ${cText} !important; }

      .bg-amber-500 { background-color: ${p} !important; }
      .bg-amber-500\\/10 { background-color: ${p}1a !important; }
      .bg-amber-500\\/20 { background-color: ${p}33 !important; }
      .bg-amber-600 { background-color: ${pHov} !important; }

      .border-orange-400\\/20 { border-color: ${p}33 !important; }
      .border-orange-500 { border-color: ${p} !important; }
      .border-orange-500\\/10 { border-color: ${p}1a !important; }
      .border-orange-500\\/20 { border-color: ${p}33 !important; }
      .border-orange-500\\/30 { border-color: ${p}4d !important; }
      .border-orange-500\\/40 { border-color: ${p}66 !important; }
      .border-orange-500\\/50 { border-color: ${p}80 !important; }
      .focus\\:border-orange-500:focus { border-color: ${p} !important; }
      .hover\\:border-orange-500:hover { border-color: ${p} !important; }
      .hover\\:border-orange-500\\/30:hover { border-color: ${p}4d !important; }

      .border-amber-500 { border-color: ${p} !important; }
      .border-amber-500\\/20 { border-color: ${p}33 !important; }
      .border-amber-500\\/40 { border-color: ${p}66 !important; }
      .border-amber-500\\/50 { border-color: ${p}80 !important; }

      .from-orange-500 {
        --tw-gradient-from: ${p} !important;
        --tw-gradient-to: ${p}00 !important;
        --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position, to right), var(--tw-gradient-from) var(--tw-gradient-from-position, 0%), var(--tw-gradient-to) var(--tw-gradient-to-position, 100%)) !important;
      }
      .from-orange-500\\/5 {
        --tw-gradient-from: ${p}0d !important;
        --tw-gradient-to: ${p}00 !important;
        --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position, to right), var(--tw-gradient-from) var(--tw-gradient-from-position, 0%), var(--tw-gradient-to) var(--tw-gradient-to-position, 100%)) !important;
      }
      .from-orange-500\\/10 {
        --tw-gradient-from: ${p}1a !important;
        --tw-gradient-to: ${p}00 !important;
        --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position, to right), var(--tw-gradient-from) var(--tw-gradient-from-position, 0%), var(--tw-gradient-to) var(--tw-gradient-to-position, 100%)) !important;
      }
      .from-orange-600 {
        --tw-gradient-from: ${pHov} !important;
        --tw-gradient-to: ${pHov}00 !important;
        --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position, to right), var(--tw-gradient-from) var(--tw-gradient-from-position, 0%), var(--tw-gradient-to) var(--tw-gradient-to-position, 100%)) !important;
      }
      .from-amber-500 {
        --tw-gradient-from: ${p} !important;
        --tw-gradient-to: ${p}00 !important;
        --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position, to right), var(--tw-gradient-from) var(--tw-gradient-from-position, 0%), var(--tw-gradient-to) var(--tw-gradient-to-position, 100%)) !important;
      }
      .from-amber-500\\/10 {
        --tw-gradient-from: ${p}1a !important;
        --tw-gradient-to: ${p}00 !important;
        --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position, to right), var(--tw-gradient-from) var(--tw-gradient-from-position, 0%), var(--tw-gradient-to) var(--tw-gradient-to-position, 100%)) !important;
      }

      .to-orange-500 { --tw-gradient-to: ${p} !important; }
      .to-orange-500\\/10 { --tw-gradient-to: ${p}1a !important; }
      .to-orange-600 { --tw-gradient-to: ${pHov} !important; }
      .to-amber-600 { --tw-gradient-to: ${s} !important; }
      .to-red-600 { --tw-gradient-to: ${s} !important; }
      .to-red-700 { --tw-gradient-to: ${sHov} !important; }

      .hover\\:from-orange-600:hover { --tw-gradient-from: ${pHov} !important; }
      .hover\\:to-red-700:hover { --tw-gradient-to: ${sHov} !important; }

      .shadow-orange-500 { box-shadow: 0 10px 15px -3px ${p}40 !important; }
      .shadow-orange-500\\/10 { --tw-shadow-color: ${p}1a !important; box-shadow: 0 10px 15px -3px ${p}1a !important; }
      .shadow-orange-500\\/15 { --tw-shadow-color: ${p}26 !important; box-shadow: 0 10px 15px -3px ${p}26 !important; }
      .shadow-orange-500\\/20 { --tw-shadow-color: ${p}33 !important; box-shadow: 0 10px 15px -3px ${p}33 !important; }
      .shadow-orange-500\\/25 { --tw-shadow-color: ${p}40 !important; box-shadow: 0 10px 15px -3px ${p}40 !important; }
      .shadow-red-600\\/15 { --tw-shadow-color: ${s}26 !important; box-shadow: 0 10px 15px -3px ${s}26 !important; }
      .shadow-red-600\\/20 { --tw-shadow-color: ${s}33 !important; box-shadow: 0 10px 15px -3px ${s}33 !important; }

      .selection\\:bg-orange-500::selection { background-color: ${p} !important; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: ${p} !important; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${pHov} !important; }

      .login-bg-glow {
        background-image: radial-gradient(circle at top, ${p}33 0%, transparent 70%) !important;
      }
    `;
  };

  const renderAdminTodayTrainingStatus = () => {
    const dayNamesPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const currentDayName = dayNamesPt[new Date().getDay()];
    const classesToday = trainingSchedules.filter((s) => s.diaSemana && s.diaSemana.includes(currentDayName));

    if (classesToday.length > 0) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5 text-left">
          <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-400">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Hoje é dia de treino! Aulas confirmadas no cronograma:</span>
          </div>
          <div className="pl-6 space-y-0.5 text-[11px] text-neutral-400">
            {classesToday.map((c, idx) => {
              const profFormatted = sanitizeProfName(c.professorNome);
              return (
                <div key={idx}>• {c.horario}{profFormatted ? ` - Docente Responsável: ${profFormatted}` : ''}</div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-neutral-900/60 border border-neutral-850 p-3.5 rounded-xl flex items-center gap-2.5 text-left">
        <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
        <span className="text-xs text-neutral-400 font-semibold">Hoje não há turmas ou treinos programados.</span>
      </div>
    );
  };

  const renderAdminProfileWelcomeBlock = () => {
    const unreadCount = unreadAdminNotifCount;
    return (
      <div className="bg-gradient-to-b from-[#1c1c1c] to-[#121212] border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-5 justify-between items-start md:items-stretch text-left">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left Section: Profile Info and Today's Training Status */}
        <div className="flex-1 space-y-4 w-full text-left">
          {/* Profile Header Row with Bell Icon */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-3.5">
              {/* Profile Circle */}
              <div className="w-12 h-12 rounded-full border-2 border-orange-500 overflow-hidden bg-neutral-900 flex items-center justify-center shrink-0 shadow-lg relative">
                {usuarioLogado?.fotoPerfil ? (
                  <img src={usuarioLogado.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white font-black text-lg uppercase">{(usuarioLogado?.nome || 'A').charAt(0)}</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                  Olá, {usuarioLogado?.nome || 'Usuário'}!
                </h2>
                <button
                  onClick={handleOpenProfileModal}
                  className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-orange-400 hover:text-white rounded-lg border border-neutral-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer w-fit"
                  title="Editar Cadastro Pessoal do Administrador"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>
              </div>
            </div>

            {/* Notification Bell next to profile name section */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowAdminBellNotificationsModal(true);
                  markUserNotifsAsRead(adminUserKey, scopedAdminNotifs.map((n) => n.id));
                  setNotifStateVersion((v) => v + 1);
                }}
                className="relative p-2.5 bg-neutral-900 hover:bg-neutral-850 text-orange-500 hover:text-white rounded-xl border border-neutral-800 transition active:scale-95 cursor-pointer group"
                title="Minhas Notificações"
              >
                <Bell className={`w-5 h-5 group-hover:rotate-12 transition-transform ${unreadCount > 0 ? 'animate-bounce text-orange-400' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-neutral-900" />
                )}
              </button>
            </div>
          </div>

          {/* Current Date & Training Status Section */}
          <div className="space-y-3">
            <div className="text-xs text-neutral-400 font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
              <span>
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {renderAdminTodayTrainingStatus()}
          </div>
        </div>

        {/* Right Section: Checklist Belt / Role Card */}
        <div className="w-full md:w-64 bg-neutral-950/60 border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between shrink-0">
          <div className="space-y-2.5 text-left">
            <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-wider block">Verificação de Credenciais</span>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-4 h-4 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 text-[10px] shrink-0 font-bold">✓</div>
                <span>Status do Perfil: <span className="text-emerald-400 font-extrabold inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>Ativo</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-4 h-4 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 text-[10px] shrink-0 font-bold">✓</div>
                <span className="capitalize">Tipo: {usuarioLogado?.tipo === 'admin' ? 'Administrador(a)' : usuarioLogado?.tipo === 'professor' ? 'Professor(a)' : 'Instrutor(a)'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-4 h-4 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 text-[10px] shrink-0 font-bold">✓</div>
                <span>Credencial: Mestre Homologado</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-neutral-900 text-left">
            {(() => {
              const userFaixa = usuarioLogado?.faixa || 'Faixa Preta';
              const f = userFaixa.toLowerCase();
              let mainColor = '#171717';
              let tipColor = '#000000';
              let textColor = 'text-white';

              if (f.includes('azul')) {
                mainColor = '#2563eb';
                textColor = 'text-white';
              } else if (f.includes('roxa') || f.includes('roxo')) {
                mainColor = '#7c3aed';
                textColor = 'text-white';
              } else if (f.includes('marrom')) {
                mainColor = '#78350f';
                textColor = 'text-white';
              } else if (f.includes('preta') || f.includes('preto')) {
                mainColor = '#171717';
                tipColor = '#dc2626';
                textColor = 'text-white';
              } else if (f.includes('branca') || f.includes('branco')) {
                mainColor = '#ffffff';
                textColor = 'text-neutral-900 font-extrabold';
              } else if (f.includes('amarela') || f.includes('amarelo')) {
                mainColor = '#eab308';
                textColor = 'text-neutral-950 font-extrabold';
              } else if (f.includes('laranja')) {
                mainColor = '#f97316';
                textColor = 'text-white';
              } else if (f.includes('verde')) {
                mainColor = '#10b981';
                textColor = 'text-white';
              } else if (f.includes('cinza')) {
                mainColor = '#9ca3af';
                textColor = 'text-neutral-900 font-extrabold';
              } else if (f.includes('coral') || f.includes('vermelha') || f.includes('vermelho')) {
                mainColor = '#dc2626';
                textColor = 'text-white';
              }

              const isWhiteBg = f.includes('branca') || f.includes('branco');
              const containerStyle = isWhiteBg
                ? 'bg-[#fafafa] border-neutral-400 border-2 shadow-[0_0_8px_rgba(150,150,150,0.4)]'
                : 'bg-[#eeeeee] border-white border-2 shadow-[0_0_8px_rgba(255,255,255,0.45)]';

              return (
                <div 
                  className={`w-full h-8 rounded-xl p-[2px] relative overflow-hidden flex items-center ${containerStyle}`} 
                  title={`Faixa: ${userFaixa}`}
                >
                  <div className="w-full h-full rounded-lg relative overflow-hidden flex">
                    <div className="w-full h-full flex items-center justify-between" style={{ backgroundColor: mainColor }}>
                      <span className={`text-[10px] uppercase font-black tracking-widest pl-3 flex items-center gap-1.5 ${textColor}`}>
                        <span>🥋 {userFaixa}</span>
                      </span>
                      <div className="flex h-full items-center shrink-0">
                        <div className="h-full w-[2px] bg-white opacity-40" />
                        <div className="h-full w-12 flex items-center justify-center font-bold text-[9px] text-white tracking-tighter shrink-0" style={{ backgroundColor: tipColor }}>
                          <div className="flex gap-[2px]">
                            <span className="w-[1.5px] h-3 bg-white/70" />
                            <span className="w-[1.5px] h-3 bg-white/70" />
                            <span className="w-[1.5px] h-3 bg-white/70" />
                            <span className="w-[1.5px] h-3 bg-white/70" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // Check if opening direct Telão/Display view
  const isDirectDisplayWindow = typeof window !== 'undefined' && (() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('cronoTab') === 'exibicao' || p.get('placarTab') === 'exibicao';
    } catch (e) {
      return false;
    }
  })();

  if (isDirectDisplayWindow) {
    return (
      <div className="w-screen h-screen bg-black overflow-hidden fixed inset-0 z-[999999]">
        <PlacarModuleGuard />
      </div>
    );
  }

  if (!isHydrated) {
    const logoSrc = getHeaderLogoSrc(themeKey || 'orange');
    const containerStyle = getHeaderLogoContainerStyle(themeKey || 'orange');
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center rounded-3xl overflow-hidden p-2 shadow-2xl border transition-all duration-300 ${containerStyle}`}>
            {!hydrationLogoError && logoSrc ? (
              <img
                src={logoSrc}
                alt="Arena do Competidor"
                onError={() => setHydrationLogoError(true)}
                className="w-full h-full object-contain animate-fade-in"
              />
            ) : (
              <Shield className="w-12 h-12 text-white animate-pulse" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold tracking-wider text-neutral-200">ARENA DO COMPETIDOR</h1>
            <p className="text-xs text-neutral-500 mt-1">Sincronizando dados com o servidor...</p>
          </div>
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200 flex flex-col font-sans selection:bg-orange-500 selection:text-white antialiased animate-slow-fade-in">
      <style>{getThemeStyleTag()}</style>
      {isTelaoRoute ? (
        <PlacarModuleGuard isTelao={true} />
      ) : currentModule === 'confronto' ? (
        <OConfrontoModule
          onBack={() => setCurrentModule('arena')}
          isAdmin={usuarioLogado?.tipo === 'admin'}
          confrontoInscricoes={confrontoInscricoes}
          onUpdateInscricoes={setConfrontoInscricoes}
          confrontoManutencao={confrontoManutencao}
          onUpdateManutencao={setConfrontoManutencao}
          confrontoCampeonatos={confrontoCampeonatos}
          onUpdateCampeonatos={setConfrontoCampeonatos}
          logoApp={logoApp}
          themeKey={themeKey}
          onRegisterAcceptance={handleRegisterContractAcceptance}
          contratosOficiais={contratosOficiais}
          liveStreams={liveStreams}
        />
      ) : usuarioLogado ? (
        isAppFullscreen || isStandaloneTelao ? (
          <div className="w-screen h-screen min-h-screen bg-black text-white p-0 m-0 overflow-hidden select-none fixed inset-0 z-[999999]">
            {renderAdminPane()}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
          {/* HEADER PRINCIPAL */}
          <header className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-neutral-850 z-50">
            <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 min-h-[4rem] py-2 flex items-center justify-between gap-1.5 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div 
                  className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden shrink-0 p-0.5 shadow-lg border transition-all duration-300 ${
                    getHeaderLogoContainerStyle(themeKey || 'emerald')
                  }`}
                >
                  {headerLogoError ? (
                    <Shield className={`w-5 h-5 sm:w-7 sm:h-7 ${(themeKey || 'emerald') === 'white' ? 'text-neutral-400' : 'text-white/90'}`} />
                  ) : (
                    <img 
                      src={getHeaderLogoSrc(themeKey || 'emerald')} 
                      alt="Logo" 
                      onError={() => setHeaderLogoError(true)}
                      className="w-full h-full object-contain animate-fade-in" 
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-sm font-black text-white tracking-wider leading-none truncate">ARENA DO COMPETIDOR</h1>
                  <span className={`text-[8px] sm:text-[9px] ${themeClasses.text} font-extrabold uppercase tracking-widest block mt-0.5 truncate`}>ACBJJ PRO</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Botão de Atualização Manual Sob Demanda */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshingData}
                  className="flex items-center gap-1 sm:gap-1.5 py-1.5 px-2 sm:px-3 bg-[#1a1a1a] hover:bg-neutral-800 border border-emerald-500/50 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 rounded-xl transition cursor-pointer text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm shrink-0 disabled:opacity-50"
                  title="Atualizar Dados Sob Demanda (Sem Listener Permanente)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 ${isRefreshingData ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>

                {/* Botão Central de Atendimento / Meus Tickets (Apenas Administrador) */}
                {usuarioLogado?.tipo === 'admin' && (
                  <button
                    onClick={() => setShowInternalAiCentral(true)}
                    className="flex items-center gap-1 sm:gap-1.5 py-1.5 px-2 sm:px-3 bg-[#1a1a1a] hover:bg-neutral-800 border border-orange-500/50 hover:border-orange-500 text-orange-400 hover:text-orange-300 rounded-xl transition cursor-pointer text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm group shrink-0"
                    title="Central de Atendimento / Meus Tickets"
                  >
                    <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="hidden sm:inline">Central de Atendimento</span>
                    <span className="sm:hidden">Tickets</span>
                  </button>
                )}

                {/* Profile Avatar Pill */}
                <div
                  className="flex items-center gap-1.5 border border-neutral-850 rounded-full py-1 px-2 sm:py-1.5 sm:px-3.5 bg-neutral-900/60 select-none text-left shrink-0"
                  title={usuarioLogado.nome}
                >
                  {usuarioLogado.fotoPerfil ? (
                    <img src={usuarioLogado.fotoPerfil} alt={usuarioLogado.nome} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-neutral-700 shrink-0" />
                  ) : (
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-neutral-300 hidden lg:inline-block max-w-[100px] truncate">
                    {usuarioLogado.nome}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-1 sm:gap-1.5 py-1.5 px-2.5 sm:px-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl transition cursor-pointer text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 ${themeClasses.text}`}
                  title="Sair da Arena"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </header>

          {/* MAIN BODY AREA */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full animate-fade-in">
            {usuarioLogado.tipo === 'aluno' ? (
              // RENDER ALUNO CORE COMPONENT
               <AlunoArea
                 user={usuarioLogado}
                 alunos={alunos}
                 provasEnviadas={provasEnviadas}
                 noticias={noticias}
                 videos={videos}
                 certificados={certificados}
                 contratosOficiais={contratosOficiais}
                 aceitesContratos={contratoAceites}
                 notificacoes={notificacoes}
                 carouselFotos={carouselFotos}
                 carouselPaginas={carouselPaginas}
                 onSolicitarCheckin={handleSolicitarCheckin}
                 onSubmitProvaRespostas={handleSubmitProvaRespostas}
                 onOpenParabensModal={handleOpenParabensModal}
                 trainingSchedules={trainingSchedules}
                 checkinsPendentes={checkinsPendentes}
                 checkinsConfirmados={checkinsConfirmados}
                 themeClasses={themeClasses}
                 publicidades={publicidades}
                 justificativasFaltas={justificativasFaltas}
                 onAddJustificativa={handleJustificarFalta}
                 onSaveProfile={handleSaveAdminProfile}
                 usuarios={usuarios}
                 publicidadePosicao={publicidadePosicao}
                 onOpenAiCentral={() => setShowInternalAiCentral(true)}
                 liveStreams={liveStreams}
                 onUpdateLiveStreams={handleUpdateLiveStreams}
                 turmas={turmas}
                 confrontoCampeonatos={confrontoCampeonatos}
                 onAddNotification={(texto, para) => {
                   const newNotif: Notification = {
                     id: `notif-${Date.now()}-${Math.random()}`,
                     texto,
                     data: new Date().toISOString().slice(0, 10),
                     para,
                     de: usuarioLogado?.nome || 'Administrador',
                   };
                   setNotificacoes((prev) => [newNotif, ...prev]);
                 }}
                 onRemoverNotificacao={handleRemoverNotificacao}
                 onRemoverVariasNotificacoes={handleRemoverVariasNotificacoes}
               />
            ) : (
              // RENDER ADMIN/PROFESSOR TABS STRUCTURE
              <div className="space-y-6">
                {/* TABS HEADER ADMIN - UNIVERSAL HAMBURGER BUTTON */}
                <div className="sticky top-[64px] z-40 bg-[#0c0c0c] py-2">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="w-full bg-[#141414] border border-neutral-800 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition cursor-pointer"
                  >
                    <Menu className="w-5 h-5 text-orange-500 shrink-0" />
                    <span className="text-sm font-black uppercase tracking-wider text-center flex-1">
                      {[
                        { id: 'dashboard', label: 'Dashboard' },
                        ...(usuarioLogado?.tipo === 'admin' ? [{ id: 'centralAtendimento', label: 'Central de Atendimento (Suporte IA & Protocolos)' }] : []),
                        ...(usuarioLogado?.tipo === 'admin' ? [{ id: 'centralPublicidade', label: 'Central de Publicidade Patrocinada' }] : []),
                        ...(usuarioLogado?.tipo === 'admin' ? [{ id: 'placar', label: 'Placar e Cronômetro (CBJJ)' }] : []),
                        { id: 'checkin', label: 'Check-in' },
                        { id: 'rankings', label: 'Rankings' },
                        { id: 'provas', label: 'Provas & Avaliações' },
                        { id: 'noticias', label: 'Notícias' },
                        { id: 'videos', label: 'VÍDEO AULAS / AO VIVO' },
                        { id: 'certificados', label: 'Certificados e Contratos' },
                        ...(usuarioLogado?.tipo === 'admin'
                          ? [{ id: 'carteirinhaAdmin', label: 'Gestão das Carteiras Virtuais' }]
                          : [{ id: 'minhaCarteirinha', label: 'Carteira Digital' }]),
                        ...(usuarioLogado?.tipo === 'instrutor' ? [] : [{ id: 'chat', label: 'Notificações' }]),
                        ...((usuarioLogado?.tipo === 'admin' || usuarioLogado?.tipo === 'professor' || usuarioLogado?.tipo === 'instrutor')
                          ? [{ id: 'agenda', label: 'AGENDA / AULAS EXPERIMENTAIS' }]
                          : []),
                        { id: 'professores', label: 'Mestres & Instrutores' },
                        { id: 'googleIntegrations', label: 'Conexão Google' },
                        ...(usuarioLogado?.tipo === 'admin' ? [{ id: 'evolucaoEmpresarial', label: 'Governança & Evolução (Plano Mestre)' }] : []),
                        ...(isConfrontoAdmin ? [{ id: 'confrontoAdmin', label: 'Administração CAMPEONATOS / INSCRIÇÕES' }] : []),
                      ].find((t) => t.id === activeAdminTab)?.label || 'Dashboard'}
                    </span>
                    <div className="w-5 h-5" />
                  </button>
                </div>

                {/* USER WELCOME HEADER BLOCK (O Bloco Geral) */}
                {renderAdminProfileWelcomeBlock()}

                {/* EXCLUSIVE ADMIN PROMINENT BUTTONS FOR CENTRAL DE ATENDIMENTO & CENTRAL DE PUBLICIDADE - ONLY ON DASHBOARD TAB */}
                {usuarioLogado.tipo === 'admin' && activeAdminTab === 'dashboard' && (
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveAdminTab('centralAtendimento')}
                      className="w-full py-4 px-6 rounded-2xl border-2 border-orange-500 bg-[#16120e] hover:bg-[#201810] text-orange-400 font-extrabold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(249,115,22,0.25)] transition-all transform active:scale-[0.99] cursor-pointer"
                    >
                      <Bot className="w-5 h-5 text-orange-500 animate-pulse" />
                      <span>CENTRAL DE ATENDIMENTO (SUPORTE IA)</span>
                    </button>

                    <button
                      onClick={() => setActiveAdminTab('centralPublicidade')}
                      className="w-full py-4 px-6 rounded-2xl border-2 border-amber-500 bg-[#19150d] hover:bg-[#221c10] text-amber-400 font-extrabold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all transform active:scale-[0.99] cursor-pointer"
                    >
                      <Megaphone className="w-5 h-5 text-amber-500" />
                      <span>CENTRAL DE PUBLICIDADE PATROCINADA</span>
                    </button>
                  </div>
                )}

                {/* MOBILE FULLSCREEN OVERLAY MENU */}
                {mobileMenuOpen && (
                  <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex flex-col justify-start p-6 overflow-y-auto animate-fade-in text-left">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-500" />
                        <span className="font-black text-white text-xs sm:text-sm tracking-widest uppercase">MÓDULO ARENA DO COMPETIDOR</span>
                      </div>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className={`py-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1 ${themeClasses.text}`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fechar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto w-full pt-4 pb-12">
                      {usuarioLogado?.tipo === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveAdminTab('centralAtendimento');
                              setMobileMenuOpen(false);
                            }}
                            className="col-span-2 sm:col-span-3 flex items-center justify-center p-4 rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:bg-orange-500/20 text-orange-400 font-extrabold text-xs uppercase tracking-wider gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                          >
                            <Bot className="w-5 h-5 text-orange-500 animate-pulse" />
                            <span>Central de Atendimento (Suporte IA & Protocolos)</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveAdminTab('centralPublicidade');
                              setMobileMenuOpen(false);
                            }}
                            className="col-span-2 sm:col-span-3 flex items-center justify-center p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:bg-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-wider gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                          >
                            <Megaphone className="w-5 h-5 text-amber-500" />
                            <span>Central de Publicidade Patrocinada</span>
                          </button>
                        </>
                      )}

                      {[
                        { id: 'dashboard', label: 'Dashboard', icon: Grid },
                        ...(usuarioLogado?.tipo === 'admin' ? [{ id: 'placar', label: 'Placar e Cronômetro (CBJJ)', icon: Timer }] : []),
                        { id: 'checkin', label: 'Check-in', icon: Clock },
                        { id: 'rankings', label: 'Rankings', icon: Trophy },
                        { id: 'provas', label: 'Provas & Avaliações', icon: BookOpen },
                        { id: 'noticias', label: 'Notícias', icon: Newspaper },
                        { id: 'videos', label: 'VÍDEO AULAS / AO VIVO', icon: PlayCircle },
                        { id: 'certificados', label: 'Certificados e Contratos', icon: FileText },
                        ...(usuarioLogado?.tipo === 'admin'
                          ? [{ id: 'carteirinhaAdmin', label: 'Gestão de Carteiras', icon: CreditCard }]
                          : [{ id: 'minhaCarteirinha', label: 'Carteira Digital', icon: Wallet }]),
                        ...(usuarioLogado?.tipo === 'instrutor' ? [] : [{ id: 'chat', label: 'Notificações', icon: Bell }]),
                        ...((usuarioLogado?.tipo === 'admin' || usuarioLogado?.tipo === 'professor' || usuarioLogado?.tipo === 'instrutor')
                          ? [{ id: 'agenda', label: 'AGENDA / AULAS EXPERIMENTAIS', icon: Calendar }]
                          : []),
                        ...(usuarioLogado.tipo !== 'aluno' ? [{ id: 'professores', label: 'Mestres & Instrutores', icon: Users }] : []),
                        { id: 'googleIntegrations', label: 'Conexão Google', icon: Calendar },
                        ...(usuarioLogado?.tipo === 'admin' ? [{ id: 'evolucaoEmpresarial', label: 'Governança & Evolução', icon: ShieldCheck }] : []),
                        ...(isConfrontoAdmin ? [{ id: 'confrontoAdmin', label: 'Admin CAMPEONATOS / INSCRIÇÕES', icon: Trophy }] : []),
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeAdminTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              if (tab.id === 'placar') {
                                window.open('https://arenadocompetidor.ai.studio', '_blank', 'noopener,noreferrer');
                              } else {
                                setActiveAdminTab(tab.id);
                              }
                              setMobileMenuOpen(false);
                            }}
                            className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all text-center gap-2.5 group active:scale-95 cursor-pointer ${
                              active
                                ? 'bg-gradient-to-br from-orange-500 to-red-600 border-transparent text-white shadow-lg shadow-orange-500/25'
                                : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white hover:bg-neutral-900'
                            }`}
                          >
                            <div className={`p-3 rounded-xl transition ${active ? 'bg-white/10' : 'bg-[#1a1a1a] group-hover:bg-[#222]'}`}>
                              <Icon className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="animate-fade-in">{renderAdminPane()}</div>
              </div>
            )}
          </main>

          <footer className="w-full py-8 mt-auto border-t border-neutral-900/60 text-center text-xs text-neutral-500 leading-relaxed font-sans bg-[#0c0c0c]">
            <p className="font-medium text-neutral-400">Desenvolvido e Elaborado por:</p>
            <p className="font-extrabold text-orange-500 text-sm tracking-wide">YURI CRUZ ©</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 mt-1">Versão Atualizada 2026</p>
          </footer>
        </div>
        )
      ) : (
        <LoginScreen
          usuarios={usuarios}
          alunos={alunos}
          logoApp={logoApp}
          turmas={turmas}
          onLoginSuccess={handleLoginSuccess}
          onRegister={handleRegister}
          onMandatoryPasswordChange={handleMandatoryPasswordChange}
          onSubmitRecuperacao={handleSubmitRecuperacao}
          onOpenConfronto={() => setCurrentModule('confronto')}
          activeTheme={themeKey || 'emerald'}
          onRegisterAcceptance={handleRegisterContractAcceptance}
          contratosOficiais={contratosOficiais}
          onAgendarExperimental={handleAgendarExperimental}
        />
      )}

      {/* MODAL ENVIAR PARABENS */}
      {showParabensModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => setShowParabensModal(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-yellow-500 mb-6 pb-2 border-b border-neutral-900">
              <Cake className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Enviar Parabéns de Aniversário</h2>
            </div>

            <form onSubmit={handleEnviarParabens} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Escreva sua Mensagem</label>
                <textarea
                  rows={4}
                  placeholder="Escreva algo inspirador para incentivar o guerreiro!"
                  value={parabensMensagem}
                  onChange={(e) => setParabensMensagem(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none transition min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowParabensModal(false)}
                  className="flex-1 border border-neutral-800 text-neutral-400 py-3 rounded-xl hover:text-white hover:border-neutral-700 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold py-3 rounded-xl transition cursor-pointer"
                >
                  🎂 Enviar Parabéns
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARABENS USUARIO (BIRTHDAY CONGRATS) */}
      {showUserBirthdayCongrats && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1200] flex items-center justify-center p-4 overflow-hidden">
          <BirthdayConfetti />
          <div className="bg-[#141414] rounded-3xl p-8 max-w-md w-full border border-yellow-500/40 shadow-2xl relative z-[1210] animate-scale-in text-center overflow-hidden">
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
            
            <button
              onClick={() => setShowUserBirthdayCongrats(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-6xl animate-bounce mb-4">🎂</span>
              <div className="inline-block px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                Dia de Festa na Arena!
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Feliz Aniversário, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{usuarioLogado?.nome.split(' ')[0]}</span>! 🎉
              </h2>
              <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                Hoje a nossa família celebra a sua vida! Que o seu novo ciclo seja repleto de conquistas, saúde, paz, e muitos treinos de Jiu-Jitsu. 
                <br /><br />
                A equipe <span className="text-orange-500 font-bold">ACBJJ PRO</span> se orgulha de ter você conosco nos tatames! OSS! 🥋
              </p>

              <button
                onClick={() => setShowUserBirthdayCongrats(false)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:brightness-110 text-black font-extrabold py-3.5 px-6 rounded-xl transition cursor-pointer shadow-lg shadow-yellow-500/20 active:scale-95"
              >
                Muito Obrigado! OSS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SINO NOTIFICACOES PARA ADM/PROFESSOR */}
      {showAdminBellNotificationsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => {
                setShowAdminBellNotificationsModal(false);
                setConfirmDeleteNotifId(null);
                setShowConfirmDeleteAllNotifs(false);
              }}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-orange-500 mb-6 pb-2 border-b border-neutral-900">
              <Bell className="w-6 h-6 animate-pulse" />
              <div>
                <h2 className="text-xl font-bold text-white">Quadro de Notificações</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Mensagens direcionadas ao seu perfil</p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
              {scopedAdminNotifs.length > 0 ? (
                scopedAdminNotifs.map((n) => (
                  <div
                    key={n.id}
                    className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 text-left space-y-2 hover:border-neutral-750 transition shadow-sm relative group"
                  >
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <span className="text-[10px] text-neutral-500 font-mono">📅 {n.data}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-orange-400 bg-orange-500/5 py-0.5 px-2 rounded border border-orange-500/10">
                          De: {n.de}
                        </span>
                        <button
                          onClick={() => setConfirmDeleteNotifId(confirmDeleteNotifId === n.id ? null : n.id)}
                          className="text-neutral-500 hover:text-red-400 p-1 rounded-lg transition cursor-pointer hover:bg-red-500/10 flex items-center gap-1"
                          title="Apagar Notificação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Apagar</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">{n.texto}</p>

                    {confirmDeleteNotifId === n.id && (
                      <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl space-y-2 mt-2 animate-fade-in">
                        <p className="text-xs text-red-300 font-semibold">Deseja realmente apagar esta notificação?</p>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setConfirmDeleteNotifId(null)}
                            className="px-2.5 py-1 text-[10px] bg-neutral-800 text-neutral-300 hover:text-white rounded-lg font-bold transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              deleteUserNotification(adminUserKey, n.id);
                              setConfirmDeleteNotifId(null);
                              setNotifStateVersion((v) => v + 1);
                            }}
                            className="px-2.5 py-1 text-[10px] bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition cursor-pointer"
                          >
                            Confirmar Exclusão
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-50 text-sm text-neutral-400">Sua caixa de notificações está limpa.</div>
              )}
            </div>

            {scopedAdminNotifs.length > 0 && (
              <div className="pt-3 border-t border-neutral-900 mt-4">
                {showConfirmDeleteAllNotifs ? (
                  <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl space-y-2 text-left animate-fade-in">
                    <p className="text-xs text-red-300 font-semibold">Deseja realmente apagar TODAS as suas notificações? Esta ação não pode ser desfeita.</p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowConfirmDeleteAllNotifs(false)}
                        className="px-3 py-1.5 text-xs bg-neutral-800 text-neutral-300 hover:text-white rounded-lg font-bold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          deleteAllUserNotifications(
                            adminUserKey,
                            scopedAdminNotifs.map((n) => n.id)
                          );
                          setShowConfirmDeleteAllNotifs(false);
                          setNotifStateVersion((v) => v + 1);
                        }}
                        className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition cursor-pointer"
                      >
                        Sim, Apagar Todas
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDeleteAllNotifs(true)}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Apagar Todas as Notificações</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setShowAdminBellNotificationsModal(false);
                setConfirmDeleteNotifId(null);
                setShowConfirmDeleteAllNotifs(false);
              }}
              className="mt-4 w-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-bold py-3 px-4 rounded-xl transition cursor-pointer"
            >
              Fechar Notificações
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL PESSOAL */}
      {showProfileModal && (() => {
        const userBirth = editDataNascimento || usuarioLogado?.dataNascimento || '';
        const profileUserAge = (() => {
          if (!userBirth) return 99;
          const bDate = new Date(userBirth);
          if (isNaN(bDate.getTime())) return 99;
          const today = new Date();
          let age = today.getFullYear() - bDate.getFullYear();
          const m = today.getMonth() - bDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
          return age;
        })();
        const isProfileUserMinor = profileUserAge < 18 && profileUserAge >= 0;
        const userCpfValue = editCpf || usuarioLogado?.cpf || '';
        const isProfileUserEditingWithProvisorio = userCpfValue.trim().toUpperCase().startsWith('INF-') || Boolean(usuarioLogado?.isCpfProvisorio);
        const isProfileUserMinorProvisorio = isProfileUserMinor && isProfileUserEditingWithProvisorio;

        const isPhoneEqual = Boolean(
          editWhatsapp && editContatoEmergenciaTelefone && editWhatsapp.replace(/\D/g, '') === editContatoEmergenciaTelefone.replace(/\D/g, '')
        );
        const showEmergencyError = !isProfileUserMinorProvisorio && isPhoneEqual;

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1150] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141414] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-neutral-800 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-left animate-scale-in">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-orange-500 mb-6 pb-2 border-b border-neutral-900">
                <UserIcon className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold text-white">Editar Cadastro Pessoal</h2>
                  <p className="text-xs text-neutral-400">
                    {usuarioLogado?.tipo === 'admin'
                      ? 'Alterações do Perfil de Administrador/Mestre Geral'
                      : 'Apenas dados autorizados podem ser editados'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveUserProfile} className="space-y-4 text-xs">
                {usuarioLogado?.tipo !== 'admin' && (
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                    <span>🔒 Nome Completo, CPF, Data de Nascimento, Faixa e Cargo são protegidos pela Administração.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Nome Completo</label>
                    <input
                      type="text"
                      required
                      disabled={usuarioLogado?.tipo !== 'admin'}
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value.toUpperCase())}
                      className={`w-full text-white border border-neutral-800 rounded-xl py-2.5 px-3 outline-none font-semibold uppercase ${
                        usuarioLogado?.tipo === 'admin'
                          ? 'bg-[#1a1a1a] focus:border-orange-500'
                          : 'bg-[#151515] text-neutral-400 cursor-not-allowed opacity-75'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">WhatsApp / Celular</label>
                    <input
                      type="text"
                      required
                      value={editWhatsapp}
                      onChange={(e) => {
                        const newPhone = maskPhone(e.target.value);
                        setEditWhatsapp(newPhone);
                        if (isProfileUserMinorProvisorio) {
                          setEditContatoEmergenciaTelefone(newPhone);
                        }
                      }}
                      placeholder="(98) 99999-9999"
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none font-mono ${
                        showEmergencyError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Email de Acesso</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Senha de Acesso</label>
                    <input
                      type="text"
                      required
                      value={editSenha}
                      onChange={(e) => setEditSenha(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">CPF</label>
                    <input
                      type="text"
                      disabled={usuarioLogado?.tipo !== 'admin'}
                      value={editCpf}
                      onChange={(e) => setEditCpf(maskCPF(e.target.value))}
                      className={`w-full text-white border border-neutral-800 rounded-xl py-2.5 px-3 outline-none font-mono ${
                        usuarioLogado?.tipo === 'admin'
                          ? 'bg-[#1a1a1a] focus:border-orange-500'
                          : 'bg-[#151515] text-neutral-400 cursor-not-allowed opacity-75'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Data de Nascimento</label>
                    <input
                      type="date"
                      disabled={usuarioLogado?.tipo !== 'admin'}
                      value={editDataNascimento}
                      onChange={(e) => setEditDataNascimento(e.target.value)}
                      className={`w-full text-white border border-neutral-800 rounded-xl py-2.5 px-3 outline-none ${
                        usuarioLogado?.tipo === 'admin'
                          ? 'bg-[#1a1a1a] focus:border-orange-500'
                          : 'bg-[#151515] text-neutral-400 cursor-not-allowed opacity-75'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Graduação (Faixa)</label>
                    <select
                      disabled={usuarioLogado?.tipo !== 'admin'}
                      value={editFaixa}
                      onChange={(e) => setEditFaixa(e.target.value)}
                      className={`w-full border border-neutral-800 rounded-xl py-2.5 px-3 outline-none ${
                        usuarioLogado?.tipo === 'admin'
                          ? 'bg-[#1a1a1a] text-white focus:border-orange-500 cursor-pointer'
                          : 'bg-[#151515] text-neutral-400 cursor-not-allowed opacity-75'
                      }`}
                    >
                      <option value="Faixa Branca">Faixa Branca</option>
                      <option value="Faixa Cinza">Faixa Cinza</option>
                      <option value="Faixa Amarela">Faixa Amarela</option>
                      <option value="Faixa Laranja">Faixa Laranja</option>
                      <option value="Faixa Verde">Faixa Verde</option>
                      <option value="Faixa Azul">Faixa Azul</option>
                      <option value="Faixa Roxa">Faixa Roxa</option>
                      <option value="Faixa Marrom">Faixa Marrom</option>
                      <option value="Faixa Preta">Faixa Preta</option>
                      <option value="Faixa Preta-Vermelha">Faixa Preta-Vermelha</option>
                      <option value="Faixa Vermelha-Branca">Faixa Vermelha-Branca</option>
                      <option value="Faixa Vermelha">Faixa Vermelha</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Endereço Residencial</label>
                    <input
                      type="text"
                      placeholder="Rua, número, bairro, cidade"
                      value={editEndereco}
                      onChange={(e) => setEditEndereco(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Tipo Sanguíneo</label>
                    <input
                      type="text"
                      placeholder="Ex: AB+, O-"
                      value={editTipoSangue}
                      onChange={(e) => setEditTipoSangue(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Alergias / Observações Médicas</label>
                  <input
                    type="text"
                    placeholder="Ex: Sem alergias"
                    value={editAlergico}
                    onChange={(e) => setEditAlergico(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Contato de Emergência (Nome) {isProfileUserMinor && !isProfileUserEditingWithProvisorio ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      placeholder="NOME DO CONTATO"
                      value={editContatoEmergenciaNome}
                      onChange={(e) => setEditContatoEmergenciaNome(e.target.value.toUpperCase())}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none uppercase font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Contato de Emergência (Telefone) {isProfileUserMinor && !isProfileUserEditingWithProvisorio ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      placeholder="(98) 99999-9999"
                      value={editContatoEmergenciaTelefone}
                      onChange={(e) => {
                        const newPhone = maskPhone(e.target.value);
                        setEditContatoEmergenciaTelefone(newPhone);
                        if (isProfileUserMinorProvisorio) {
                          setEditWhatsapp(newPhone);
                        }
                      }}
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none font-mono ${
                        showEmergencyError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                    {showEmergencyError && (
                      <p className="text-[11px] text-red-500 font-bold mt-1.5 bg-red-500/10 border border-red-500/30 p-2 rounded-lg leading-snug">
                        Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato de emergência diferente.
                      </p>
                    )}
                  </div>
                </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Foto de Perfil</label>
                <div className="flex items-center gap-3 bg-[#1a1a1a] p-2.5 rounded-xl border border-neutral-800">
                  {editFotoBase64 ? (
                    <img src={editFotoBase64} alt="Avatar" className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[8px] text-neutral-500 shrink-0 font-bold uppercase">Sem Foto</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setEditFotoBase64(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 text-[10px] text-neutral-400 focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[9px] file:bg-orange-500 file:text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-5 py-3 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition shadow-lg shadow-orange-500/15 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Salvar Alterações do Perfil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ); })()}

      {alertQueue.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${getThemeClasses().text}`}>
              <AlertCircle className="w-5 h-5 animate-pulse" />
              Arena do Competidor
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6 whitespace-pre-wrap">
              {alertQueue[0].message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setAlertQueue((prev) => prev.slice(1))}
                className={`${getThemeClasses().bgBtn} ${getThemeClasses().shadow} hover:brightness-110 text-white font-extrabold text-xs py-2 px-5 rounded-xl shadow-lg transition cursor-pointer`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showInternalAiCentral && (
        <AiCentralModal
          onClose={() => setShowInternalAiCentral(false)}
          currentUser={usuarioLogado}
        />
      )}

      {publicVerificationCode && (
        <PublicCardVerificationModal
          code={publicVerificationCode}
          onClose={() => {
            setPublicVerificationCode(null);
            if (typeof window !== 'undefined' && window.history) {
              window.history.replaceState({}, '', '/');
            }
          }}
          usuarios={usuarios}
          alunos={alunos}
          currentUser={usuarioLogado}
        />
      )}
    </div>
  );
}

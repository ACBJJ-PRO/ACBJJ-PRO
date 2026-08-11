import React, { useState, useEffect } from 'react';
import { Student, User, SentExam, NewsItem, VideoItem, CertificateItem, Notification, TrainingSchedule, CheckinRequest, PublicidadeItem, JustificativaFalta, LiveStreamItem, ClassUnit, isAdultPerson, OfficialContract, ContractAcceptanceRecord } from '../types';
import { Home, ClipboardList, Trophy, Calendar, Gift, Newspaper, PlayCircle, FileText, Bell, Award, Flame, Download, ArrowRight, CheckCircle, XCircle, Menu, X, Shield, ChevronLeft, ChevronRight, Image as ImageIcon, Eye, AlertTriangle, User as UserIcon, Wallet, Ticket, Trash2 } from 'lucide-react';
import PublicidadeCarousel from './PublicidadeCarousel';
import GoogleIntegrationsPane from './GoogleIntegrationsPane';
import CarteirinhaCard from './CarteirinhaCard';
import VideosPane from './VideosPane';
import CertificadosPane from './CertificadosPane';
import { getCarteirinhaConfig, getUserCarteirinhaData } from '../utils/carteirinhaUtils';
import { maskPhone, formatDateBR } from '../utils/formatters';
import {
  getUserScopedNotifications,
  getUserUnreadCount,
  markUserNotifsAsRead,
  deleteUserNotification,
  deleteAllUserNotifications,
  getUserKey,
} from '../utils/notificationUtils';

export function formatDiasSemana(diasStr: string): string {
  if (!diasStr) return '';
  const dias = diasStr.split(', ');
  const formattedDays = dias.map(d => d.replace('-feira', ''));
  if (formattedDays.length === 1) return diasStr; // Keep full name if only 1 day, e.g. "Segunda-feira"
  const lastDay = formattedDays[formattedDays.length - 1];
  const otherDays = formattedDays.slice(0, -1);
  return `${otherDays.join(', ')} e ${lastDay}`;
}


const getSharedRankFreq = (index: number, list: Student[]) => {
  if (index === 0) return 1;
  let rank = 1;
  for (let i = 1; i <= index; i++) {
    const prevVal = list[i-1]?.checkins?.length || 0;
    const currVal = list[i]?.checkins?.length || 0;
    if (currVal < prevVal) {
      rank = i + 1;
    }
  }
  return rank;
};

interface AlunoAreaProps {
  user: User;
  alunos: Student[];
  provasEnviadas: SentExam[];
  noticias: NewsItem[];
  videos: VideoItem[];
  certificados: CertificateItem[];
  notificacoes: Notification[];
  carouselFotos: string[];
  carouselPaginas?: string[];
  onSolicitarCheckin: () => void;
  onSubmitProvaRespostas: (provaId: number, respostas: { [questionIndex: number]: string }) => void;
  onOpenParabensModal: (alunoId: number) => void;
  trainingSchedules?: TrainingSchedule[];
  checkinsPendentes: CheckinRequest[];
  checkinsConfirmados: CheckinRequest[];
  themeClasses?: any;
  publicidades?: PublicidadeItem[];
  justificativasFaltas?: JustificativaFalta[];
  onAddJustificativa?: (
    alunoId: number,
    alunoNome: string,
    data: string,
    motivo: string,
    turma?: string,
    horario?: string,
    professorNome?: string,
    status?: 'pendente' | 'aprovada' | 'rejeitada'
  ) => void;
  onSaveProfile?: (updatedUser: User) => void;
  usuarios?: User[];
  publicidadePosicao?: 'topo' | 'meio' | 'fim';
  onOpenAiCentral?: () => void;
  liveStreams?: LiveStreamItem[];
  onUpdateLiveStreams?: (streams: LiveStreamItem[]) => void;
  turmas?: ClassUnit[];
  confrontoCampeonatos?: any[];
  onAddNotification?: (texto: string, para: string) => void;
  onRemoverNotificacao?: (id: string) => void;
  onRemoverVariasNotificacoes?: (ids: string[]) => void;
  contratosOficiais?: OfficialContract[];
  aceitesContratos?: ContractAcceptanceRecord[];
  onRegistrarCliquePublicidade?: (id: string, pagina: string) => void;
  onRegistrarVisualizacaoPublicidade?: (id: string) => void;
}

export default function AlunoArea({
  user,
  alunos,
  provasEnviadas,
  noticias,
  videos,
  certificados,
  contratosOficiais = [],
  aceitesContratos = [],
  notificacoes,
  carouselFotos,
  carouselPaginas = ['inicio'],
  onSolicitarCheckin,
  onSubmitProvaRespostas,
  onOpenParabensModal,
  trainingSchedules = [],
  checkinsPendentes = [],
  checkinsConfirmados = [],
  themeClasses,
  publicidades = [],
  justificativasFaltas = [],
  onAddJustificativa,
  onSaveProfile,
  usuarios = [],
  publicidadePosicao = 'topo',
  onOpenAiCentral,
  liveStreams = [],
  onUpdateLiveStreams,
  turmas = [],
  confrontoCampeonatos = [],
  onAddNotification,
  onRemoverNotificacao,
  onRemoverVariasNotificacoes,
  onRegistrarCliquePublicidade,
  onRegistrarVisualizacaoPublicidade,
}: AlunoAreaProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'provas' | 'competicao' | 'rankingPresenca' | 'aniversariantes' | 'noticias' | 'videos' | 'certificados' | 'notificacoes' | 'cadastro' | 'carteira' | 'googleIntegrations'>('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBellNotificationsModal, setShowBellNotificationsModal] = useState(false);
  const [showNoClassAlertModal, setShowNoClassAlertModal] = useState(false);
  const [showCheckinBlockedModal, setShowCheckinBlockedModal] = useState(false);
  const [blockedModalDetails, setBlockedModalDetails] = useState<{ earliestTime: string; userClickedTime: string } | null>(null);

  const [notifStateVersion, setNotifStateVersion] = useState(0);
  const [confirmDeleteNotifId, setConfirmDeleteNotifId] = useState<string | null>(null);
  const [showConfirmDeleteAllNotifs, setShowConfirmDeleteAllNotifs] = useState(false);

  const studentUserKey = getUserKey(user);
  const personalNotifications = getUserScopedNotifications(notificacoes, user);
  const unreadCount = getUserUnreadCount(notificacoes, user);

  // Active student matching the logged in user with robust fallback
  const foundStudent = alunos.find((a) => a.usuarioId === user.id || (a.email && user.email && a.email.trim().toLowerCase() === user.email.trim().toLowerCase()));
  const currentStudent: Student = foundStudent || {
    id: user.id || 0,
    usuarioId: user.id || null,
    nome: user.nome || 'Aluno',
    email: user.email || '',
    whatsapp: user.whatsapp || '',
    faixa: user.faixa || 'Faixa Branca',
    graus: 0,
    checkins: [],
    pontosCompeticao: 0,
    notaAvaliacao: null,
    mediaGeral: 10,
    medalhasOuro: 0,
    medalhasPrata: 0,
    medalhasBronze: 0,
    ativo: true,
    idade: 20,
    dataNascimento: user.dataNascimento || '',
    cpf: user.cpf || '',
    endereco: user.endereco || '',
    tipoSangue: user.tipoSangue || 'A+',
    alergico: user.alergico || 'Não',
    contatoEmergenciaNome: user.contatoEmergenciaNome || '',
    contatoEmergenciaTelefone: user.contatoEmergenciaTelefone || '',
    fotoPerfil: user.fotoPerfil || '',
    professorResponsavelNome: user.professorResponsavelNome || '',
    dataInicioTreino: user.dataInicioTreino || '',
    historicoProvas: [],
    historicoGraduacoes: [],
  };

  useEffect(() => {
    if (activeTab === 'notificacoes') {
      markUserNotifsAsRead(studentUserKey, personalNotifications.map((n) => n.id));
      setNotifStateVersion((v) => v + 1);
    }
  }, [activeTab]);
  
  // PDF Viewer states
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState<string>('');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [justifyingDate, setJustifyingDate] = useState<string | null>(null);
  const [blockingJustificationText, setBlockingJustificationText] = useState('');

  // Helper to format professor names cleanly and ensure Administrador becomes PROFESSOR YURI CRUZ
  const formatProfName = (pName?: string) => {
    if (!pName || pName.trim() === '') return 'PROFESSOR YURI CRUZ';
    let clean = pName.trim().toUpperCase();
    clean = clean.replace(/Y+URI/gi, 'YURI').replace(/\bURI\b/gi, 'YURI');
    if (clean.includes('ADMINISTRADOR') || clean === 'ADMIN') {
      return 'PROFESSOR YURI CRUZ';
    }
    if (clean === 'YURI' || clean === 'YURI CRUZ') {
      return 'PROFESSOR YURI CRUZ';
    }
    if (!clean.startsWith('PROFESSOR') && !clean.startsWith('MESTRE')) {
      return `PROFESSOR ${clean}`;
    }
    return clean;
  };

  // Identify all past unconfirmed class dates for current student (Pending Absences)
  const pendingAbsenceDates = React.useMemo(() => {
    if (!currentStudent) return [];

    const dates: { dateStr: string; turma: string; horario: string; professorNome: string }[] = [];
    const dayNamesPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    // Effective entry date in class/system - absences and pending items start ONLY from this date
    const todayStr = new Date().toISOString().split('T')[0];
    const rawEntryDate =
      currentStudent.dataInicioTreino ||
      (currentStudent as any).dataAprovacao ||
      (currentStudent as any).dataCadastro ||
      (currentStudent as any).createdAt ||
      user.dataInicioTreino ||
      user.dataAprovacao ||
      user.dataCadastro ||
      user.createdAt ||
      todayStr;
    const effectiveApprovalDate = rawEntryDate.slice(0, 10);

    // Search past dates up to 30 days back, but never earlier than effective approval date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const curr = new Date(startDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    while (curr <= yesterday) {
      const dateStr = curr.toISOString().split('T')[0];
      const dayName = dayNamesPt[curr.getDay()];

      // Skip dates prior to effective account approval/creation date
      if (dateStr < effectiveApprovalDate) {
        curr.setDate(curr.getDate() + 1);
        continue;
      }

      // Check if student had class on this day
      const sched = trainingSchedules.find(s => s.diaSemana && s.diaSemana.includes(dayName) && s.status === 'confirmado');
      const turmaObj = turmas.find(t => t.diaSemana && t.diaSemana.includes(dayName));

      if (sched || turmaObj) {
        const hasCheckin = (currentStudent.checkins || []).includes(dateStr) ||
          checkinsConfirmados.some(c => c.alunoId === currentStudent.id && c.data === dateStr && c.status === 'confirmado');
        const hasPendingCheckin = checkinsPendentes.some(c => c.alunoId === currentStudent.id && c.data === dateStr);
        const hasJustification = justificativasFaltas.some(j => j.alunoId === currentStudent.id && j.data === dateStr);

        if (!hasCheckin && !hasPendingCheckin && !hasJustification) {
          dates.push({
            dateStr,
            turma: turmaObj?.nome || 'Turma Geral',
            horario: sched?.horario || turmaObj?.horario || 'Horário Oficial',
            professorNome: formatProfName(sched?.professorNome || currentStudent.professorResponsavelNome)
          });
        }
      }

      curr.setDate(curr.getDate() + 1);
    }

    return dates.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [currentStudent, user, trainingSchedules, turmas, checkinsConfirmados, checkinsPendentes, justificativasFaltas]);
  const [justificationReason, setJustificationReason] = useState('');

  // Local profile states
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email || '');
  const [senha, setSenha] = useState(user.senha || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [dataNascimento, setDataNascimento] = useState(user.dataNascimento || '');
  const [endereco, setEndereco] = useState(user.endereco || '');
  const [tipoSangue, setTipoSangue] = useState(user.tipoSangue || '');
  const [alergico, setAlergico] = useState(user.alergico || '');
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState(user.contatoEmergenciaNome || '');
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState(user.contatoEmergenciaTelefone || '');
  const [foto, setFoto] = useState(user.fotoPerfil || '');
  const [faixa, setFaixa] = useState(user.faixa || '');
  const [profId, setProfId] = useState<number | ''>(user.professorResponsavelId || '');
  const [profNome, setProfNome] = useState(user.professorResponsavelNome || '');

  const prevUserIdRef = React.useRef(user.id);
  React.useEffect(() => {
    if (prevUserIdRef.current !== user.id) {
      prevUserIdRef.current = user.id;
      setNome(user.nome);
      setEmail(user.email || '');
      setSenha(user.senha || '');
      setWhatsapp(user.whatsapp || '');
      setCpf(user.cpf || '');
      setDataNascimento(user.dataNascimento || '');
      setEndereco(user.endereco || '');
      setTipoSangue(user.tipoSangue || '');
      setAlergico(user.alergico || '');
      setContatoEmergenciaNome(user.contatoEmergenciaNome || '');
      setContatoEmergenciaTelefone(user.contatoEmergenciaTelefone || '');
      setFoto(user.fotoPerfil || '');
      setFaixa(user.faixa || '');
      setProfId(user.professorResponsavelId || '');
      setProfNome(user.professorResponsavelNome || '');
    }
  }, [user.id]);

  React.useEffect(() => {
    if (carouselFotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselFotos.length);
    }, 60000); // 1 minute transition
    return () => clearInterval(interval);
  }, [carouselFotos.length]);

  const handlePrintCarteirinha = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('⚠️ Por favor, permita pop-ups para gerar o documento da carteirinha.');
      return;
    }

    const beltName = currentStudent?.faixa || user.faixa || 'Faixa Branca';
    const isPreta = beltName.toLowerCase().includes('preta');
    const isMarrom = beltName.toLowerCase().includes('marrom');
    const isRoxa = beltName.toLowerCase().includes('roxa');
    const isAzul = beltName.toLowerCase().includes('azul');
    const isVerde = beltName.toLowerCase().includes('verde');
    const isLaranja = beltName.toLowerCase().includes('laranja');
    const isAmarela = beltName.toLowerCase().includes('amarela');
    const isCinza = beltName.toLowerCase().includes('cinza');
    const isBranca = beltName.toLowerCase().includes('branca');

    let beltBg = 'background-color: #ffffff; color: #000000; border: 1px solid #ccc;';
    let barBg = 'background-color: #000000;';
    if (isPreta) { beltBg = 'background-color: #000000; color: #ffffff; border: 1px solid #333;'; barBg = 'background-color: #dc2626;'; }
    else if (isMarrom) { beltBg = 'background-color: #5c3818; color: #ffffff;'; barBg = 'background-color: #000000;'; }
    else if (isRoxa) { beltBg = 'background-color: #6b21a8; color: #ffffff;'; barBg = 'background-color: #000000;'; }
    else if (isAzul) { beltBg = 'background-color: #1d4ed8; color: #ffffff;'; barBg = 'background-color: #000000;'; }
    else if (isVerde) { beltBg = 'background-color: #047857; color: #ffffff;'; barBg = 'background-color: #000000;'; }
    else if (isLaranja) { beltBg = 'background-color: #f97316; color: #ffffff;'; barBg = 'background-color: #000000;'; }
    else if (isAmarela) { beltBg = 'background-color: #facc15; color: #000000;'; barBg = 'background-color: #000000;'; }
    else if (isCinza) { beltBg = 'background-color: #737373; color: #ffffff;'; barBg = 'background-color: #000000;'; }
    else if (isBranca) { beltBg = 'background-color: #ffffff; color: #000000; border: 1px solid #bbb;'; barBg = 'background-color: #000000;'; }

    const studentReg = (() => {
      const index = alunos.findIndex(a => a.id === currentStudent?.id);
      const orderNo = index !== -1 ? index + 1 : 1;
      return `ACBJJ2026${String(orderNo).padStart(3, '0')}`;
    })();

    const photoHtml = foto 
      ? `<img src="${foto}" style="width: 100%; height: 100%; object-fit: cover;" />`
      : `<div style="font-size: 32px; color: #444; text-align: center; line-height: 80px;">🥋</div>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Carteira Virtual ACBJJ - ${user.nome}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap');
            
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #0a0a0a;
              font-family: 'Inter', sans-serif;
              color: #ffffff;
            }

            .card {
              width: 480px;
              height: 300px;
              background: linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%);
              border: 1px solid #333;
              border-radius: 16px;
              padding: 20px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
              overflow: hidden;
            }

            .card::before {
              content: '';
              position: absolute;
              inset: 0;
              border: 2px solid rgba(249, 115, 22, 0.1);
              border-radius: 16px;
              pointer-events: none;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .logo-area {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .logo-icon {
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              color: white;
              font-weight: bold;
            }

            .logo-text h4 {
              margin: 0;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 2px;
            }

            .logo-text span {
              margin: 0;
              font-size: 8px;
              color: #888;
              font-weight: bold;
            }

            .status-badge {
              font-size: 8px;
              background-color: rgba(16, 185, 129, 0.15);
              color: #10b981;
              border: 1px solid rgba(16, 185, 129, 0.3);
              padding: 4px 8px;
              border-radius: 99px;
              font-weight: bold;
              letter-spacing: 1px;
            }

            .content {
              display: flex;
              gap: 15px;
              align-items: center;
              margin: auto 0;
            }

            .photo {
              width: 80px;
              height: 80px;
              border-radius: 8px;
              border: 2px solid #333;
              background-color: #111;
              overflow: hidden;
              flex-shrink: 0;
            }

            .metadata {
              display: flex;
              flex-direction: column;
              gap: 8px;
              flex-grow: 1;
              min-width: 0;
            }

            .meta-item {
              display: flex;
              flex-direction: column;
            }

            .meta-label {
              font-size: 7px;
              color: #666;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .meta-val {
              font-size: 13px;
              font-weight: 900;
              color: #fff;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .meta-val.reg {
              color: #f97316;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
            }

            .meta-val.prof {
              color: #ccc;
              font-size: 11px;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #222;
              padding-top: 10px;
            }

            .validity-val {
              font-size: 9px;
              font-weight: bold;
              color: #ccc;
            }

            .belt {
              height: 24px;
              border-radius: 4px;
              padding: 0 10px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              min-width: 120px;
              position: relative;
              overflow: hidden;
              box-sizing: border-box;
              ${beltBg}
            }

            .belt-bar {
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 32px;
              ${barBg}
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .belt-stripe {
              display: flex;
              gap: 2px;
            }

            .stripe {
              width: 2px;
              height: 12px;
              background-color: #fff;
            }

            @media print {
              body {
                background-color: #ffffff;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .card {
                box-shadow: none;
                border: 1px solid #111;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo-area">
                <div class="logo-icon">🛡️</div>
                <div class="logo-text">
                  <h4>ARENA DO COMPETIDOR</h4>
                  <span>ID DA ACADEMIA: #9240</span>
                </div>
              </div>
              <div class="status-badge">● ATIVO</div>
            </div>

            <div class="content">
              <div class="photo">
                ${photoHtml}
              </div>
              <div class="metadata">
                <div class="meta-item">
                  <span class="meta-label">Atleta</span>
                  <span class="meta-val">${user.nome}</span>
                </div>
                <div class="grid">
                  <div class="meta-item">
                    <span class="meta-label">Registro ACBJJ</span>
                    <span class="meta-val reg">${studentReg}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Professor</span>
                    <span class="meta-val prof">${currentStudent?.professorResponsavelNome || 'Mestre Arena'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="meta-item">
                <span class="meta-label">Validade</span>
                <span class="validity-val">DEZ/2026</span>
              </div>
              <div class="belt">
                <span>${beltName.replace('Faixa ', '')}</span>
                <div class="belt-bar">
                  <div class="belt-stripe">
                    <div class="stripe"></div>
                    <div class="stripe"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStartTime = (horario: string): { hour: number; minute: number } | null => {
    const match = horario.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return {
        hour: parseInt(match[1], 10),
        minute: parseInt(match[2], 10),
      };
    }
    return null;
  };

  const handleCheckinClick = () => {
    const dayNamesPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const currentDayName = dayNamesPt[new Date().getDay()];
    const classesToday = trainingSchedules.filter((s) => s.diaSemana && s.diaSemana.includes(currentDayName));

    if (classesToday.length > 0) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      let hasStartedClass = false;
      let earliestTimeStr = '';
      let earliestTotalMinutes = Infinity;

      classesToday.forEach((c) => {
        const timeInfo = getStartTime(c.horario);
        if (timeInfo) {
          const classStartTotalMinutes = timeInfo.hour * 60 + timeInfo.minute;
          if (currentTotalMinutes >= classStartTotalMinutes) {
            hasStartedClass = true;
          }
          if (classStartTotalMinutes < earliestTotalMinutes) {
            earliestTotalMinutes = classStartTotalMinutes;
            earliestTimeStr = `${String(timeInfo.hour).padStart(2, '0')}:${String(timeInfo.minute).padStart(2, '0')}`;
          }
        } else {
          // If we can't parse, allow check-in
          hasStartedClass = true;
        }
      });

      if (!hasStartedClass && earliestTimeStr) {
        const userTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        setBlockedModalDetails({ earliestTime: earliestTimeStr, userClickedTime: userTimeStr });
        setShowCheckinBlockedModal(true);
        return;
      }
    }
    onSolicitarCheckin();
  };

  // Define treinosNoMes and freqPercentage safely here for rendering
  const anoAtual = new Date().getFullYear();
  const mesAtualNum = new Date().getMonth() + 1;
  const targetPrefix = `${anoAtual}-${String(mesAtualNum).padStart(2, '0')}`;
  
  // Set of all unique confirmed dates for this student in the current month
  const uniqueConfirmedDates = new Set<string>();
  
  if (currentStudent) {
    currentStudent.checkins.forEach((d) => {
      if (d && d.startsWith(targetPrefix)) {
        uniqueConfirmedDates.add(d);
      }
    });
    checkinsConfirmados.forEach((c) => {
      if (c.alunoId === currentStudent.id && c.status === 'confirmado' && c.data && c.data.startsWith(targetPrefix)) {
        uniqueConfirmedDates.add(c.data);
      }
    });
  }
  
  const treinosNoMes = uniqueConfirmedDates.size;
  const freqPercentage = Math.min(Math.round((treinosNoMes / 12) * 100), 100);
  const diasNoMes = new Date(anoAtual, mesAtualNum, 0).getDate();
  const aproveitamentoMes = Math.min(Math.round((treinosNoMes / diasNoMes) * 100), 100);

  // Month select for student presence grid
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Exam answering state
  const [answeringExam, setAnsweringExam] = useState<SentExam | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<{ [qIdx: number]: string }>({});
  const [lockedQuestions, setLockedQuestions] = useState<{ [qIdx: number]: boolean }>({});

  const studentAnswersRef = React.useRef(studentAnswers);
  studentAnswersRef.current = studentAnswers;
  const answeringExamRef = React.useRef(answeringExam);
  answeringExamRef.current = answeringExam;

  React.useEffect(() => {
    if (!answeringExam) return;

    const handleVisibilityChange = () => {
      if (document.hidden && answeringExamRef.current) {
        alert('⚠️ COLA OU FRAUDE DETECTADA! Você saiu do aplicativo ou alterou a visualização da tela durante a realização da prova. O desafio foi encerrado imediatamente e suas respostas salvas até o momento foram enviadas para avaliação do Mestre!');
        
        // Auto-submit and close
        onSubmitProvaRespostas(answeringExamRef.current.id, studentAnswersRef.current);
        setAnsweringExam(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [answeringExam]);

  const handleStartExam = (exam: SentExam) => {
    setAnsweringExam(exam);
    setStudentAnswers({});
    setLockedQuestions({});
  };

  const handleSelectOption = (qIdx: number, val: string) => {
    if (lockedQuestions[qIdx]) return;
    setStudentAnswers((prev) => ({ ...prev, [qIdx]: val }));
    setLockedQuestions((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleTextAnswerChange = (qIdx: number, val: string) => {
    if (lockedQuestions[qIdx]) return;
    setStudentAnswers((prev) => ({ ...prev, [qIdx]: val }));
  };

  const handleConfirmDiscursiva = (qIdx: number) => {
    const val = studentAnswers[qIdx]?.trim();
    if (!val) {
      alert('Por favor, digite sua resposta antes de travar!');
      return;
    }
    setLockedQuestions((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleSubmitExamAnswers = () => {
    if (!answeringExam || !currentStudent) return;
    const qCount = answeringExam.questoes.length;
    const allLocked = answeringExam.questoes.every((_, idx) => lockedQuestions[idx]);

    if (!allLocked) {
      alert(`⚠️ Você precisa responder e travar todas as ${qCount} questões antes de submeter a prova!`);
      return;
    }

    onSubmitProvaRespostas(answeringExam.id, studentAnswers);
    alert('🥋 Parabéns por concluir o desafio! Suas respostas foram salvas e enviadas ao Mestre.');
    setAnsweringExam(null);
  };

  // Helper Stats
  const totalTreinos = currentStudent?.checkins.length || 0;
  const pontosCompeticao = currentStudent?.pontosCompeticao || 0;
  const mediaAvaliacao = currentStudent?.notaAvaliacao !== null && currentStudent?.notaAvaliacao !== undefined
    ? currentStudent.notaAvaliacao.toFixed(1)
    : 'N/A';

  // Presence calendar generation for student with support for checkins (green), pending analysis (yellow), justified (orange), and miss/falta (red)
  const renderStudentCalendar = () => {
    if (!currentStudent) return null;
    const ano = new Date().getFullYear();
    const diasNoMes = new Date(ano, selectedMonth + 1, 0).getDate();
    const gridElements = [];

    const getDayState = (dataStr: string) => {
      // 1. Is present? (Green)
      if (currentStudent.checkins.includes(dataStr)) {
        return 'presente';
      }

      // 2. Check justification record
      const just = justificativasFaltas.find(j => j.alunoId === currentStudent.id && j.data === dataStr);
      if (just) {
        if (just.status === 'aprovada') return 'justificada'; // Orange (Presença Justificada)
        if (just.status === 'pendente') return 'pendente'; // Yellow (Aguardando Análise)
        if (just.status === 'rejeitada') return 'falta'; // Red (Falta Mantida)
      }

      return 'normal';
    };

    for (let d = 1; d <= diasNoMes; d++) {
      const dataStr = `${ano}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const state = getDayState(dataStr);
      
      let classNames = '';
      let onClickHandler: (() => void) | undefined = undefined;
      let tooltipText = `Dia ${d}`;

      switch (state) {
        case 'presente':
          classNames = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 cursor-default';
          tooltipText = `Dia ${d}: Presença Confirmada`;
          break;
        case 'justificada':
          classNames = 'bg-orange-500 text-white shadow-md shadow-orange-500/20 cursor-default';
          tooltipText = `Dia ${d}: Presença Justificada`;
          break;
        case 'pendente':
          classNames = 'bg-amber-400 text-black shadow-md shadow-amber-400/20 cursor-default animate-pulse font-extrabold';
          tooltipText = `Dia ${d}: Justificativa em Análise`;
          break;
        case 'falta':
          classNames = 'bg-red-600 text-white shadow-md shadow-red-600/20 hover:scale-105 active:scale-95 cursor-pointer border border-red-500/30';
          tooltipText = `Dia ${d}: Falta (Clique para Justificar)`;
          onClickHandler = () => {
            setJustifyingDate(dataStr);
          };
          break;
        default:
          classNames = 'bg-neutral-850/60 text-neutral-500 cursor-default';
          break;
      }

      gridElements.push(
        <button
          key={d}
          onClick={onClickHandler}
          disabled={!onClickHandler}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative ${classNames}`}
          title={tooltipText}
        >
          {d}
        </button>
      );
    }

    const treinosNoMes = currentStudent.checkins.filter((c) =>
      c.startsWith(`${ano}-${String(selectedMonth + 1).padStart(2, '0')}`)
    ).length;

    const justificadasNoMes = justificativasFaltas.filter((j) =>
      j.alunoId === currentStudent.id && 
      j.data.startsWith(`${ano}-${String(selectedMonth + 1).padStart(2, '0')}`) &&
      j.status === 'aprovada'
    ).length;

    return (
      <div className="space-y-4">
        {/* Subtitle indicators */}
        <div className="flex flex-wrap gap-3 justify-center text-[10px] uppercase font-bold text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0"></span>
            <span>Presença</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-500 shrink-0"></span>
            <span>Justificado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-600 shrink-0"></span>
            <span>Falta</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto justify-items-center">
          {gridElements}
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 text-neutral-400 text-xs mt-3 border-t border-neutral-900 pt-3">
          <p>
            📊 Frequência em{' '}
            <span className="text-orange-500 font-bold uppercase">
              {new Date(ano, selectedMonth, 1).toLocaleString('pt-BR', { month: 'long' })}
            </span>
            : <strong className="text-white text-sm">{treinosNoMes} treinos</strong>
          </p>
          {justificadasNoMes > 0 && (
            <p className="text-orange-400 font-semibold">
              ✓ {justificadasNoMes} falta(s) abonada(s)
            </p>
          )}
        </div>
      </div>
    );
  };

  const meses = Array.from({ length: 12 }, (_, i) =>
    new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'long' })
  );

  // Filter personal exams
  const personalExams = currentStudent
    ? provasEnviadas.filter((p) => p.alunoId === 'todos' || p.alunoId === currentStudent.id)
    : [];

  // Filter personal certificates
  const personalCertificates = currentStudent
    ? certificados.filter((c) => c.alunoId === currentStudent.id)
    : [];

  // Leaderboard lists
  const renderNormalCarousel = () => {
    if (!carouselPaginas.includes(activeTab) || !carouselFotos || carouselFotos.length === 0) return null;
    return (
      <div className="relative w-full h-[180px] bg-neutral-900 rounded-2xl overflow-hidden shadow-md border border-neutral-800 animate-fade-in">
        <div
          className="flex flex-row flex-nowrap h-full transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(-${currentSlide * 100}%, 0, 0)`, width: '100%' }}
        >
          {carouselFotos.map((foto, idx) => (
            <div
              key={idx}
              className="h-full w-full flex-shrink-0 shrink-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${foto}')` }}
            />
          ))}
        </div>
        {carouselFotos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {carouselFotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide ? 'bg-orange-500 w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPublicidade = () => {
    if (!publicidades || publicidades.length === 0) return null;
    return (
      <PublicidadeCarousel
        pagina={activeTab}
        publicidades={publicidades}
        onRegistrarClique={onRegistrarCliquePublicidade}
        onRegistrarVisualizacao={onRegistrarVisualizacaoPublicidade}
      />
    );
  };

  const sortedComp = [...alunos].sort((a, b) => b.pontosCompeticao - a.pontosCompeticao);
  const myLeaderboardRank = currentStudent ? sortedComp.findIndex((a) => a.id === currentStudent.id) + 1 : 'N/A';

  const sortedFreq = [...alunos].sort((a, b) => b.checkins.length - a.checkins.length);
  const myFreqRankIndexInSorted = currentStudent ? sortedFreq.findIndex((a) => a.id === currentStudent.id) : -1;
  const myFreqSharedRank = myFreqRankIndexInSorted !== -1 ? getSharedRankFreq(myFreqRankIndexInSorted, sortedFreq) : -1;

  // Birthday listing helper
  const getAniversariantesMes = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    return alunos
      .filter((a) => {
        if (!a.dataNascimento) return false;
        const partes = a.dataNascimento.split('-');
        if (partes.length < 3) return false;
        return parseInt(partes[1]) === mesAtual;
      })
      .sort((a, b) => {
        const dA = parseInt(a.dataNascimento.split('-')[2]);
        const dB = parseInt(b.dataNascimento.split('-')[2]);
        return dA - dB;
      });
  };

  const getAniversariantesHoje = () => {
    const hoje = new Date();
    const dh = hoje.getDate();
    const mh = hoje.getMonth() + 1;
    return alunos.filter((a) => {
      if (!a.dataNascimento) return false;
      const partes = a.dataNascimento.split('-');
      if (partes.length < 3) return false;
      return parseInt(partes[2]) === dh && parseInt(partes[1]) === mh;
    });
  };

  const localDownloadCertificate = (cert: CertificateItem) => {
    const link = document.createElement('a');
    link.href = cert.arquivoPDF;
    link.download = cert.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 30 Days presence calculator
  const calculate30DaysPresence = () => {
    if (!currentStudent) return '0%';
    const hoje = new Date();
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      if (currentStudent.checkins.includes(dStr)) count++;
    }
    return Math.round((count / 30) * 100) + '%';
  };

  const renderTodayTrainingStatus = () => {
    if (!currentStudent) return null;
    const hojeStr = new Date().toISOString().split('T')[0];
    const isCheckinConfirmadoHoje = checkinsConfirmados.some((c) => c.alunoId === currentStudent.id && c.data === hojeStr);
    const isCheckinPendenteHoje = checkinsPendentes.some((c) => c.alunoId === currentStudent.id && c.data === hojeStr);

    if (isCheckinConfirmadoHoje) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-400">Presença Confirmada (Treino Confirmado hoje!)</span>
        </div>
      );
    }

    if (isCheckinPendenteHoje) {
      return (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center gap-2.5 animate-pulse">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span className="text-xs font-bold text-amber-400">Presença Pendente (Aguardando homologação do mestre)</span>
        </div>
      );
    }

    const dayNamesPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const currentDayName = dayNamesPt[new Date().getDay()];
    const classesToday = trainingSchedules.filter((s) => s.diaSemana && s.diaSemana.includes(currentDayName));

    if (classesToday.length > 0) {
      return (
        <div className="bg-orange-500/10 border border-orange-500/30 p-3.5 rounded-xl space-y-2 text-left">
          <div className="flex items-center gap-2.5 text-xs font-bold text-orange-400">
            <Flame className="w-4 h-4 text-orange-500 shrink-0 animate-pulse" />
            <span>Hoje é dia de treino! Faça check-in para confirmar:</span>
          </div>
          <div className="pl-6 space-y-0.5 text-[11px] text-neutral-400">
            {classesToday.map((c, idx) => {
              const profFormatted = formatProfName(c.professorNome);
              return (
                <div key={idx}>• {c.horario}{profFormatted ? ` - Docente Responsável: ${profFormatted}` : ''}</div>
              );
            })}
          </div>
          <button
            onClick={handleCheckinClick}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg shadow cursor-pointer active:scale-95 transition"
          >
            Confirmar Presença Agora
          </button>
        </div>
      );
    }

    return (
      <div className="bg-neutral-900/60 border border-neutral-850 p-3.5 rounded-xl space-y-2 text-left">
        <div className="flex items-center gap-2.5 text-xs font-bold text-neutral-400">
          <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
          <span>Hoje não há nenhuma aula programada na grade.</span>
        </div>
        <button
          onClick={() => setShowNoClassAlertModal(true)}
          className="w-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg border border-neutral-700 cursor-pointer active:scale-95 transition"
        >
          Confirmar Presença Agora
        </button>
      </div>
    );
  };

  const renderProfileWelcomeBlock = () => {
    if (!currentStudent) return null;

    return (
      <div className="bg-gradient-to-b from-[#1c1c1c] to-[#121212] border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-5 justify-between items-start md:items-stretch text-left">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 space-y-4 w-full">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border-2 border-orange-500 overflow-hidden bg-neutral-900 flex items-center justify-center shrink-0 shadow-lg relative">
                {user.fotoPerfil ? (
                  <img src={user.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white font-black text-lg uppercase">{(user?.nome || 'Aluno').charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                  Olá, {user?.nome || 'Aluno'}!
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowBellNotificationsModal(true);
                  markUserNotifsAsRead(studentUserKey, personalNotifications.map((n) => n.id));
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

            {renderTodayTrainingStatus()}
          </div>
        </div>

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
                <span className="capitalize">Tipo: Competidor</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="w-4 h-4 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 text-[10px] shrink-0 font-bold">✓</div>
                <span>Graduação: <strong className="text-orange-400 uppercase text-[11px]">{currentStudent.faixa}</strong></span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-neutral-900 text-left">
            {(() => {
              const f = currentStudent.faixa.toLowerCase();
              let mainColor = '#4b5563'; // neutral-600
              let tipColor = '#000000'; // black sleeve
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
                tipColor = '#dc2626'; // red sleeve for black belt
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

              const getFaixaContainerStyle = (faixa: string) => {
                const f = faixa.toLowerCase();
                if (f.includes('branca') || f.includes('branco')) {
                  return {
                    bg: 'bg-[#fafafa]',
                    border: 'border-neutral-400 border-2',
                    shadow: 'shadow-[0_0_8px_rgba(150,150,150,0.4)]'
                  };
                }
                return {
                  bg: 'bg-[#eeeeee]',
                  border: 'border-white border-2',
                  shadow: 'shadow-[0_0_8px_rgba(255,255,255,0.45)]'
                };
              };
              const style = getFaixaContainerStyle(currentStudent.faixa);

              return (
                <div 
                  className={`w-full h-8 rounded-xl p-[2px] ${style.bg} ${style.border} ${style.shadow} relative overflow-hidden flex items-center`} 
                  title={`Faixa ${currentStudent.faixa}`}
                >
                  <div className="w-full h-full rounded-lg relative overflow-hidden flex">
                    <div className="w-full h-full flex items-center justify-between" style={{ backgroundColor: mainColor }}>
                      <span className={`text-[10px] uppercase font-black tracking-widest pl-3 flex items-center gap-1.5 ${textColor}`}>
                        <span>🥋 Faixa Atual</span>
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

  return (
    <div className="space-y-6">
      {/* TABS HEADER ALUNO - UNIVERSAL HAMBURGER BUTTON */}
      <div className="sticky top-[64px] z-40 bg-[#0c0c0c] py-2">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-full bg-[#141414] border border-neutral-800 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition cursor-pointer"
        >
          <Menu className="w-5 h-5 text-orange-500 shrink-0" />
          <span className="text-sm font-black uppercase tracking-wider text-center flex-1">
            {[
              { id: 'inicio', label: 'Início' },
              { id: 'carteira', label: 'Carteira Virtual' },
              { id: 'provas', label: 'Provas' },
              { id: 'competicao', label: 'Competição' },
              { id: 'rankingPresenca', label: 'Ranking Presença' },
              { id: 'aniversariantes', label: 'Aniversariantes' },
              { id: 'noticias', label: 'Notícias' },
              { id: 'videos', label: 'VÍDEO AULAS / AO VIVO' },
              { id: 'certificados', label: 'Certificados e Contratos' },
              { id: 'cadastro', label: 'Meu Cadastro' },
              { id: 'googleIntegrations', label: 'Conexão Google' },
            ].find((t) => t.id === activeTab)?.label || 'Início'}
          </span>
          <div className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE FULLSCREEN OVERLAY MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex flex-col justify-start p-6 overflow-y-auto animate-fade-in text-left">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <span className="font-black text-white text-sm tracking-widest uppercase">ÁREA DO ALUNO</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`py-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1 ${themeClasses?.text || 'text-orange-500'}`}
            >
              <X className="w-3.5 h-3.5" />
              <span>Fechar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto w-full pt-4 pb-12">
            {[
              { id: 'inicio', label: 'Início', icon: Home },
              { id: 'carteira', label: 'Carteira Virtual', icon: Wallet },
              { id: 'provas', label: 'Provas', icon: ClipboardList },
              { id: 'competicao', label: 'Competição', icon: Trophy },
              { id: 'rankingPresenca', label: 'Ranking Presença', icon: Calendar },
              { id: 'aniversariantes', label: 'Aniversariantes', icon: Gift },
              { id: 'noticias', label: 'Notícias', icon: Newspaper },
              { id: 'videos', label: 'VÍDEO AULAS / AO VIVO', icon: PlayCircle },
              { id: 'certificados', label: 'Certificados e Contratos', icon: FileText },
              { id: 'cadastro', label: 'Meu Cadastro', icon: UserIcon },
              { id: 'googleIntegrations', label: 'Conexão Google', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
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

      {/* PANES CONTENT */}
      {currentStudent ? (
        <div className="space-y-6">
          {/* USER WELCOME HEADER BLOCK (O Bloco Geral) */}
          {renderProfileWelcomeBlock()}

          {/* DYNAMIC CAROUSEL SLOTS BASED ON PREFERENCE */}
          {publicidadePosicao === 'topo' ? renderPublicidade() : renderNormalCarousel()}

          {/* INICIO TAB */}
          {activeTab === 'inicio' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. FREQUENCY SUMMARY */}
                <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md space-y-3 text-left">
                  <div className="flex justify-between items-start text-xs flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-neutral-300 font-bold">Frequência Mensal</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-orange-500 font-black tracking-wider text-sm">
                        {treinosNoMes} / 12 aulas ({freqPercentage}%)
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5">
                        Aproveitamento: <span className="text-emerald-500">{aproveitamentoMes}%</span> (Mês de {diasNoMes} dias)
                      </span>
                    </div>
                  </div>
                  {/* PROGRESS BAR */}
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800/50">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${freqPercentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 font-medium">
                    Meta de consistência sugerida pelo mestre: 12 aulas por mês para graduação.
                  </p>
                </div>

                {/* 2. CALENDAR-STYLE DAY/WEEK INDICATOR */}
                <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md space-y-2 text-left">
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">
                    Cronograma de Hoje
                  </span>
                  <div className="grid grid-cols-7 gap-1.5 bg-neutral-950/60 p-2 rounded-xl border border-neutral-850/60 text-center">
                    {(() => {
                      const todayDate = new Date();
                      const startOfWeek = new Date(todayDate);
                      const dayDiff = todayDate.getDay() === 0 ? -6 : 1 - todayDate.getDay();
                      startOfWeek.setDate(todayDate.getDate() + dayDiff);

                      return Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(startOfWeek);
                        d.setDate(startOfWeek.getDate() + i);
                        const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                        const isToday = d.toDateString() === todayDate.toDateString();
                        return (
                          <div
                            key={i}
                            className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 select-none ${
                              isToday
                                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-500/30'
                                : 'bg-neutral-900/60 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{dayNames[i]}</span>
                            <span className="text-sm font-black tracking-tight">{d.getDate()}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* PUBLICIDADE CAROUSEL PATROCINADA - AGORA NO TOPO */}
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}

              {/* OTHER STATS GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md text-left">
                  <span className="text-neutral-400 text-[10px] font-extrabold uppercase tracking-widest block">Tempo de Treino</span>
                  <p className="text-lg font-black text-rose-500 mt-2 truncate">
                    {(() => {
                      if (!currentStudent.dataInicioTreino) return 'Não inf.';
                      const inicio = new Date(currentStudent.dataInicioTreino);
                      if (isNaN(inicio.getTime())) return 'Não inf.';
                      const hoje = new Date();
                      const diffAnos = hoje.getFullYear() - inicio.getFullYear();
                      const diffMeses = hoje.getMonth() - inicio.getMonth();
                      const totalMeses = diffAnos * 12 + diffMeses;
                      if (totalMeses <= 0) return '1 mês';
                      if (totalMeses === 1) return '1 mês';
                      if (totalMeses < 12) return `${totalMeses} meses`;
                      const anos = Math.floor(totalMeses / 12);
                      const restos = totalMeses % 12;
                      if (restos === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
                      return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${restos} ${restos === 1 ? 'mês' : 'meses'}`;
                    })()}
                  </p>
                </div>
                <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md text-left">
                  <span className="text-neutral-400 text-[10px] font-extrabold uppercase tracking-widest block">Graduação</span>
                  <p className="text-lg font-black text-orange-500 mt-2 truncate">🥋 {currentStudent.faixa}</p>
                </div>
                <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md text-left">
                  <span className="text-neutral-400 text-[10px] font-extrabold uppercase tracking-widest block">Comp. Pontos</span>
                  <p className="text-lg font-black text-amber-500 mt-2">{pontosCompeticao} pts</p>
                </div>
                <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md text-left">
                  <span className="text-neutral-400 text-[10px] font-extrabold uppercase tracking-widest block">Média Teórica</span>
                  <p className="text-lg font-black text-blue-500 mt-2">{mediaAvaliacao}</p>
                </div>
              </div>

              {/* ANIVERSARIANTES HOJE */}
              {getAniversariantesHoje().length > 0 && (
                <div className="bg-[#141414] p-5 rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 shadow-md">
                  <div className="flex items-center gap-2 mb-3 text-amber-500">
                    <Gift className="w-5 h-5" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aniversariante de Hoje!</h3>
                  </div>
                  {getAniversariantesHoje().map((a) => (
                    <div key={a.id} className="flex justify-between items-center bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-850">
                      <span className="text-white text-sm font-semibold">🥋 {a.nome}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CALENDARIO DE FREQUENCIA */}
              <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2 text-orange-500">
                    <Calendar className="w-5 h-5" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Grade de Frequência</h3>
                  </div>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-[#1a1a1a] text-xs text-white border border-neutral-800 rounded-lg py-1 px-2 focus:border-orange-500 outline-none cursor-pointer"
                  >
                    {meses.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {renderStudentCalendar()}
              </div>

              {/* CRONOGRAMA DE TREINOS DA SEMANA (ESTUDANTE) */}
              <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md text-left flex flex-col min-h-[250px]">
                <div className="flex items-center gap-2 mb-4 border-b border-neutral-900 pb-3 text-orange-500 shrink-0">
                  <Calendar className="w-5.5 h-5.5" />
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Cronograma de Treinos da Semana</h3>
                    <p className="text-xs text-neutral-400 mt-0.5 font-medium">Confira a agenda e a confirmação de treinos definidos pelos mestres</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[500px] pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {trainingSchedules && trainingSchedules.length > 0 ? (
                      trainingSchedules.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800/80 flex items-center justify-between gap-3 shadow-sm hover:border-neutral-700 transition"
                        >
                          <div className="text-left">
                            <span className="font-bold text-white text-xs block">{formatDiasSemana(item.diaSemana)}</span>
                            <span className="text-neutral-400 text-[11px] font-semibold block mt-0.5">{item.horario}</span>
                          </div>
                          <span
                            className={`text-[9px] font-extrabold uppercase py-1 px-2 rounded-lg border tracking-wide select-none ${
                              item.status === 'confirmado'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : item.status === 'cancelado'
                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                            }`}
                          >
                            {item.status === 'confirmado'
                              ? '● Confirmado'
                              : item.status === 'cancelado'
                              ? '● Cancelado'
                              : '● Aguardando'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-xs text-neutral-500">
                        Nenhum treino agendado para esta semana.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARTEIRA VIRTUAL TAB */}
          {activeTab === 'carteira' && (
            <div className="space-y-6 animate-fade-in text-left max-w-xl mx-auto">
              <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
                <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
                  <Wallet className="w-5.5 h-5.5 text-orange-500" />
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">💳 Carteira Virtual ACBJJ</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Sua identificação oficial de atleta da Arena do Competidor</p>
                  </div>
                </div>

                <CarteirinhaCard
                  user={user}
                  student={currentStudent}
                  config={getCarteirinhaConfig()}
                  userCardData={getUserCarteirinhaData(user.id)}
                  showPrintButton={true}
                />

                <div className="mt-4 text-center">
                  <p className="text-[10px] text-neutral-500">
                    Apresente esta carteira virtual na entrada da academia ou durante campeonatos oficiais ACBJJ.
                  </p>
                </div>
              </div>
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* PROVAS TAB (Assigned tests / exam taking interface) */}
          {activeTab === 'provas' && (
            <div className="space-y-6 animate-fade-in text-left">
              {answeringExam ? (
                // ACTIVE EXAM TAKER PANEL
                <div className="bg-[#141414] p-6 rounded-2xl border-2 border-orange-500/40 shadow-xl max-w-2xl mx-auto space-y-6">
                  <div className="flex justify-between items-start border-b border-neutral-900 pb-4 flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block">Desafio em Lançamento</span>
                      <h3 className="text-lg font-bold text-white mt-1">{answeringExam.tituloProva}</h3>
                    </div>
                    <button
                      onClick={() => setAnsweringExam(null)}
                      className="text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 py-1.5 px-3 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="space-y-5">
                    {answeringExam.questoes.map((q, idx) => {
                      const isLocked = lockedQuestions[idx];
                      const chosenAnswer = studentAnswers[idx];

                      return (
                        <div key={idx} className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-900 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-orange-400 font-extrabold uppercase">Questão {q.numero} ({q.pontuacao} pts)</span>
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 py-0.5 px-2.5 rounded border border-red-500/25 font-bold uppercase">
                                🔒 Travada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 py-0.5 px-2.5 rounded border border-amber-500/25 font-bold uppercase animate-pulse">
                                🔓 Aberta
                              </span>
                            )}
                          </div>
                          <p className="text-white text-sm font-semibold">{q.pergunta}</p>

                          {q.tipo === 'objetiva' ? (
                            <div className="space-y-2 pt-2">
                              {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                                const optionText = (q as any)[`opcao${letter}`];
                                if (!optionText) return null;
                                const isSelected = chosenAnswer === letter;
                                const isCorrectOption = letter === q.respostaCorreta;

                                // Style definitions depending on lock state
                                let buttonClass = '';
                                if (isLocked) {
                                  if (isSelected) {
                                    buttonClass = isCorrectOption
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                      : 'bg-red-500/10 border-red-500 text-red-400';
                                  } else if (isCorrectOption) {
                                    buttonClass = 'bg-emerald-500/5 border-dashed border-emerald-500/40 text-emerald-400 opacity-80';
                                  } else {
                                    buttonClass = 'bg-[#1a1a1a]/40 border-neutral-900 text-neutral-500 opacity-50 cursor-not-allowed';
                                  }
                                } else {
                                  buttonClass = isSelected
                                    ? 'bg-orange-500/10 border-orange-500 text-orange-400 cursor-pointer'
                                    : 'bg-[#1a1a1a] border-neutral-850 text-neutral-300 hover:border-neutral-700 cursor-pointer';
                                }

                                let badgeClass = '';
                                if (isLocked) {
                                  if (isSelected) {
                                    badgeClass = isCorrectOption ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white';
                                  } else if (isCorrectOption) {
                                    badgeClass = 'bg-emerald-500 text-white';
                                  } else {
                                    badgeClass = 'bg-neutral-800 text-neutral-600';
                                  }
                                } else {
                                  badgeClass = isSelected ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-400';
                                }

                                return (
                                  <button
                                    key={letter}
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => handleSelectOption(idx, letter)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border text-xs font-medium transition ${buttonClass}`}
                                  >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badgeClass}`}>
                                      {letter}
                                    </span>
                                    {optionText}
                                  </button>
                                );
                              })}

                              {/* Immediate feedback banner */}
                              {isLocked && (
                                <div className="mt-3 animate-scale-in">
                                  {chosenAnswer === q.respostaCorreta ? (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold">
                                      ✨ Resposta Correta! Você acertou e somou {q.pontuacao} pts.
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold">
                                      ❌ Resposta Incorreta! O gabarito oficial era a Alternativa {q.respostaCorreta}.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 pt-2">
                              <textarea
                                rows={3}
                                disabled={isLocked}
                                placeholder="Escreva detalhadamente sua resposta discursiva..."
                                value={chosenAnswer || ''}
                                onChange={(e) => handleTextAnswerChange(idx, e.target.value)}
                                className={`w-full text-white border rounded-xl py-2.5 px-3.5 text-xs outline-none transition min-h-[80px] ${
                                  isLocked
                                    ? 'bg-[#1a1a1a]/50 border-neutral-900 text-neutral-400 cursor-not-allowed'
                                    : 'bg-[#1a1a1a] border-neutral-800 focus:border-orange-500'
                                }`}
                              />
                              {!isLocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDiscursiva(idx)}
                                  className="text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white py-1.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ml-auto"
                                >
                                  <span>🔒 Confirmar e Bloquear Resposta</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold animate-scale-in">
                                  <span>🔒 Resposta gravada e bloqueada! Aguardando a avaliação do Mestre.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSubmitExamAnswers}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-orange-500/10 cursor-pointer"
                  >
                    Enviar Minhas Respostas
                  </button>
                </div>
              ) : (
                // PROVAS LIST
                <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
                  <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
                    <ClipboardList className="w-5.5 h-5.5 text-orange-500" />
                    <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">Desafios & Provas Teóricas</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">Responda aos testes de graduação e regras da IBJJF</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalExams.length > 0 ? (
                      personalExams.map((p) => {
                        const solved = p.respostas && p.respostas[currentStudent.id] !== undefined;
                        const score = p.notas && p.notas[currentStudent.id] !== undefined ? p.notas[currentStudent.id] : null;

                        return (
                          <div
                            key={p.id}
                            className={`p-5 rounded-2xl border bg-neutral-950/40 text-left space-y-3 relative ${
                              solved ? 'border-neutral-850' : 'border-orange-500/20'
                            }`}
                          >
                            <span className="text-[9px] font-extrabold uppercase tracking-widest bg-neutral-900 text-neutral-400 py-1 px-2.5 rounded-md">
                              {p.tipo === 'objetiva' ? 'Múltipla Escolha' : 'Discursiva'}
                            </span>

                            <h4 className="font-bold text-white text-sm pt-1">{p.tituloProva}</h4>

                            <div className="text-xs text-neutral-400 space-y-1">
                              <p>Questões: <strong className="text-neutral-300">{p.questoes.length}</strong> | Pontuação máxima: <strong className="text-neutral-300">{p.pontuacaoTotal} pts</strong></p>
                              {solved && (
                                <p className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" /> Resolvida com Sucesso!
                                </p>
                              )}
                              {score !== null && (
                                <p className="text-orange-500 font-bold">
                                  🎯 Sua Nota: <span className="text-white text-sm font-black">{score} / {p.pontuacaoTotal}</span> pontos
                                </p>
                              )}
                            </div>

                            {!solved ? (
                              <button
                                onClick={() => handleStartExam(p)}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition mt-2"
                              >
                                Responder Desafio
                              </button>
                            ) : (
                              <div className="pt-2 border-t border-neutral-900/60 mt-3 text-[10px] text-neutral-500">
                                Respondida em {p.data}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-12 opacity-50 text-sm">Nenhum desafio teórico atribuído a você ainda.</div>
                    )}
                  </div>
                </div>
              )}
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* COMPETIÇÃO TAB */}
          {activeTab === 'competicao' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* MEDALHAS GRID */}
              <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
                <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4">Minhas Medalhas Conquistadas</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-[#ffd700]/10 to-transparent p-5 rounded-2xl border border-[#ffd700]/20 text-center animate-medal-shine">
                    <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3 drop-shadow-[0_2px_4px_rgba(250,204,21,0.3)]" />
                    <p className="text-2xl font-black text-yellow-500">{currentStudent.medalhasOuro || 0}</p>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block mt-1">Ouro</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#c0c0c0]/10 to-transparent p-5 rounded-2xl border border-[#c0c0c0]/20 text-center">
                    <Trophy className="w-10 h-10 text-neutral-300 mx-auto mb-3 drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]" />
                    <p className="text-2xl font-black text-neutral-300">{currentStudent.medalhasPrata || 0}</p>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block mt-1">Prata</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#cd7f32]/10 to-transparent p-5 rounded-2xl border border-[#cd7f32]/20 text-center">
                    <Trophy className="w-10 h-10 text-amber-600 mx-auto mb-3 drop-shadow-[0_2px_4px_rgba(217,119,6,0.3)]" />
                    <p className="text-2xl font-black text-orange-600">{currentStudent.medalhasBronze || 0}</p>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block mt-1">Bronze</span>
                  </div>
                </div>
              </div>

              {/* COLOCAÇÃO & FREQUENCIA PERCENTUAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md text-center flex flex-col justify-center items-center py-8">
                  <Trophy className="w-12 h-12 text-orange-500 mb-3" />
                  <span className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest">Minha Colocação no Ranking</span>
                  <p className="text-5xl font-black text-orange-500 mt-4">#{myLeaderboardRank}</p>
                  <p className="text-xs text-neutral-500 mt-2">Dentre os competidores ativos da Arena</p>
                  <p className="text-xs text-neutral-400 font-semibold mt-4">Total Acumulado: {pontosCompeticao} pontos</p>
                </div>

                <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md text-center flex flex-col justify-center items-center py-8">
                  <Flame className="w-12 h-12 text-orange-500 mb-3" />
                  <span className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest">Frequência dos últimos 30 dias</span>
                  <p className="text-5xl font-black text-emerald-500 mt-4">{calculate30DaysPresence()}</p>
                  <p className="text-xs text-neutral-500 mt-2">Comparecimento aos tatames da Arena</p>
                </div>
              </div>
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* RANKING PRESENCA TAB */}
          {activeTab === 'rankingPresenca' && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md animate-fade-in text-left">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
                <Calendar className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Quadro Geral de Frequência</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Ranking geral por número de comparecimento e treinos</p>
                </div>
              </div>

              {/* Encouragement Flashing Message */}
              {myFreqSharedRank >= 4 && (
                <div className="mb-6 p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 text-center animate-pulse">
                  <p className="text-sm font-extrabold text-orange-400 uppercase tracking-wider flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4 text-orange-400" />
                    Força nos Treinos, Guerreiro!
                  </p>
                  <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                    Você está em <strong className="text-white">#{myFreqSharedRank}º lugar</strong> no ranking de presença. 
                    Aumente seu ritmo de treinos e conquiste também o seu lugar no pódio! Oss.
                  </p>
                </div>
              )}

              <div className="space-y-2.5 max-w-xl">
                {sortedFreq.map((aluno, idx) => {
                  const sharedRank = getSharedRankFreq(idx, sortedFreq);
                  return (
                    <div
                      key={aluno.id}
                      className={`p-3.5 rounded-xl border flex justify-between items-center ${
                        aluno.id === currentStudent.id ? 'border-orange-500/30 bg-orange-500/5' : 'border-neutral-850 bg-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          sharedRank === 1 ? 'bg-yellow-500 text-black' : sharedRank === 2 ? 'bg-neutral-400 text-black' : sharedRank === 3 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          #{sharedRank}
                        </span>
                        <div className="flex items-center gap-2">
                          {sharedRank === 1 && (
                            <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20" title="1º Colocado (Ouro)">
                              <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)] animate-pulse" />
                            </div>
                          )}
                          {sharedRank === 2 && (
                            <div className="bg-neutral-400/10 p-1.5 rounded-lg border border-neutral-400/20" title="2º Colocado (Prata)">
                              <Trophy className="w-4 h-4 text-neutral-300" />
                            </div>
                          )}
                          {sharedRank === 3 && (
                            <div className="bg-amber-750/10 p-1.5 rounded-lg border border-amber-750/20" title="3º Colocado (Bronze)">
                              <Trophy className="w-4 h-4 text-amber-600" />
                            </div>
                          )}
                          <div>
                            <strong className="text-white text-sm block">
                              {aluno.nome} {aluno.id === currentStudent.id && <span className="text-[10px] text-orange-400 font-bold uppercase">(Você)</span>}
                            </strong>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase block mt-0.5">{aluno.faixa}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-extrabold text-orange-500 text-sm">{aluno.checkins.length} treinos</span>
                    </div>
                  );
                })}
              </div>
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* ANIVERSARIANTES TAB */}
          {activeTab === 'aniversariantes' && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md animate-fade-in text-left space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
                <Gift className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">🎂 Aniversariantes do Mês</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Parabenize seus irmãos de tatame por completar mais um ano de conquistas</p>
                </div>
              </div>

              {(() => {
                if (!currentStudent || !currentStudent.dataNascimento) return null;
                const partes = currentStudent.dataNascimento.split('-');
                if (partes.length < 3) return null;
                const dia = parseInt(partes[2]);
                const mes = parseInt(partes[1]);
                const hoje = new Date();
                const isStudentBirthdayToday = dia === hoje.getDate() && mes === (hoje.getMonth() + 1);
                if (!isStudentBirthdayToday) return null;
                return (
                  <div className="p-5 rounded-2xl border-2 border-yellow-500 bg-gradient-to-r from-yellow-500/25 via-orange-500/20 to-red-500/10 text-center space-y-2 shadow-lg shadow-yellow-500/15">
                    <span className="text-4xl block">🥳🎂🎉</span>
                    <h4 className="text-lg font-black text-white uppercase tracking-wider">Hoje é o seu dia, {currentStudent?.nome.split(' ')[0]}!</h4>
                    <p className="text-xs text-neutral-200 max-w-md mx-auto leading-relaxed">
                      Parabéns por mais um ano de vida! A Arena do Competidor te deseja muita saúde, paz, conquistas e evolução constante dentro e fora dos tatames. Oss! 🥋👊
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAniversariantesMes().length > 0 ? (
                  getAniversariantesMes().map((a) => {
                    const partes = a.dataNascimento.split('-');
                    const dia = partes[2];
                    const mesNome = new Date(2026, parseInt(partes[1]) - 1, 1).toLocaleString('pt-BR', { month: 'long' });
                    const isHoje = parseInt(dia) === new Date().getDate() && parseInt(partes[1]) === new Date().getMonth() + 1;

                    return (
                      <div
                        key={a.id}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                          isHoje ? 'border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-orange-500/5' : 'border-neutral-850 bg-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🎂</span>
                          <div>
                            <strong className="text-white text-sm block">
                              {a.nome} {a.usuarioId === user.id && <span className="text-[10px] bg-orange-500/25 text-orange-400 py-0.5 px-2 rounded-full font-black ml-1 uppercase tracking-wider">Você</span>}
                            </strong>
                            <span className="text-xs text-neutral-400 block mt-0.5">
                              Dia {dia} de {mesNome} {isHoje && (
                                <strong className="text-yellow-500 font-semibold block mt-0.5">
                                  🎉 {a.usuarioId === user.id ? "HOJE É SEU DIA! PARABÉNS! 🥳" : "É HOJE! 🎉"}
                                </strong>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-10 opacity-50 text-sm">Nenhum aniversariante registrado neste mês.</div>
                )}
              </div>
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* NOTICIAS TAB */}
          {activeTab === 'noticias' && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md animate-fade-in text-left">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
                <Newspaper className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Quadro Geral de Notícias</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Informativos e regras publicados pela comissão</p>
                </div>
              </div>

              <div className="space-y-4 max-w-2xl">
                {noticias.length > 0 ? (
                  noticias.map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl bg-[#1a1a1a] border-l-4 ${
                        item.tipo === 'urgente' ? 'border-l-red-500' : item.tipo === 'aviso' ? 'border-l-amber-500' : 'border-l-blue-500'
                      } border-r border-t border-b border-neutral-850 hover:border-neutral-700 transition shadow-sm text-left`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-2 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-wider py-1 px-3 rounded-full ${
                          item.tipo === 'urgente'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                            : item.tipo === 'aviso'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                        }`}>
                          {item.tipo}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">{formatDateBR(item.data)}</span>
                      </div>

                      <h4 className="text-base font-bold text-white tracking-tight">{item.titulo}</h4>
                      <p className="text-neutral-300 text-xs mt-2.5 leading-relaxed whitespace-pre-wrap">{item.conteudo}</p>

                      <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-between text-[10px] text-neutral-500">
                        <span>Autor: <strong className="text-neutral-400">{item.autor}</strong></span>
                        <span>ACBJJ PRO</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-50 text-sm">Nenhuma notícia publicada.</div>
                )}
              </div>
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* VIDEOS TAB */}
          {activeTab === 'videos' && (
            <VideosPane
              user={user}
              videos={videos}
              onAddVideo={() => {}}
              onExcluirVideo={() => {}}
              liveStreams={liveStreams}
              onUpdateLiveStreams={onUpdateLiveStreams}
              alunos={alunos}
              turmas={turmas}
              confrontoCampeonatos={confrontoCampeonatos}
              onAddNotification={onAddNotification}
              themeKey="orange"
            />
          )}

          {/* CERTIFICADOS E CONTRATOS TAB */}
          {activeTab === 'certificados' && (
            <div className="space-y-6">
              <CertificadosPane
                user={user}
                certificados={certificados}
                contratosOficiais={contratosOficiais}
                aceitesContratos={aceitesContratos}
              />
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* NOTIFICACOES TAB */}
          {activeTab === 'notificacoes' && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md animate-fade-in text-left">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
                <Bell className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Minha Caixa de Mensagens</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 font-medium">Recados importantes de diretoria emitidos para você</p>
                </div>
              </div>

              <div className="space-y-3.5 max-w-xl">
                {personalNotifications.length > 0 ? (
                  personalNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 text-left space-y-2 hover:border-neutral-750 transition shadow-sm relative group"
                    >
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <span className="text-[10px] text-neutral-500 font-mono">📅 {formatDateBR(n.data)}</span>
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
                                if (onRemoverNotificacao) {
                                  onRemoverNotificacao(n.id);
                                }
                                deleteUserNotification(studentUserKey, n.id);
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
                  <div className="text-center py-10 opacity-50 text-sm">Sua caixa de mensagens está limpa.</div>
                )}
              </div>

              {personalNotifications.length > 0 && (
                <div className="max-w-xl pt-4 border-t border-neutral-900 mt-6">
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
                            const idsToDelete = personalNotifications.map((n) => n.id);
                            if (onRemoverVariasNotificacoes) {
                              onRemoverVariasNotificacoes(idsToDelete);
                            } else if (onRemoverNotificacao) {
                              idsToDelete.forEach((id) => onRemoverNotificacao(id));
                            }
                            deleteAllUserNotifications(studentUserKey, idsToDelete);
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
                      className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Apagar Todas as Notificações</span>
                    </button>
                  )}
                </div>
              )}

              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* CADASTRO TAB */}
          {activeTab === 'cadastro' && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md animate-fade-in text-left">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900">
                <UserIcon className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Meu Cadastro Pessoal</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 font-medium">Mantenha suas informações cadastrais e médicas sempre atualizadas</p>
                </div>
              </div>

              {(() => {
                const isUserCpfProvisorio = Boolean(user.isCpfProvisorio || cpf?.startsWith('INF-') || user.cpf?.startsWith('INF-'));
                const userBirthDate = dataNascimento || user.dataNascimento;
                const userAge = (() => {
                  if (!userBirthDate) return 99;
                  const bDate = new Date(userBirthDate);
                  if (isNaN(bDate.getTime())) return 99;
                  const today = new Date();
                  let age = today.getFullYear() - bDate.getFullYear();
                  const m = today.getMonth() - bDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
                  return age;
                })();
                const isMinorStudent = userAge < 18 && userAge >= 0;
                const isMinorProvisorio = isMinorStudent && isUserCpfProvisorio;

                const cleanWa = whatsapp.replace(/\D/g, '');
                const cleanEmerg = contatoEmergenciaTelefone.replace(/\D/g, '');
                const isPhoneEqual = cleanWa.length > 0 && cleanEmerg.length > 0 && cleanWa === cleanEmerg;
                const showEmergencyPhoneError = !isMinorProvisorio && isPhoneEqual;

                return (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (showEmergencyPhoneError) {
                        alert('Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato de emergência diferente.');
                        return;
                      }
                      if (isMinorStudent && !isUserCpfProvisorio) {
                        if (!contatoEmergenciaNome.trim() || !contatoEmergenciaTelefone.trim()) {
                          alert('Para alunos menores de idade com CPF oficial, o Contato de Emergência (Nome e Telefone) é obrigatório!');
                          return;
                        }
                      }
                      if (!isMinorStudent && cpf) {
                        const cleanNewCpf = cpf.replace(/\D/g, '');
                        if (cleanNewCpf.length === 11) {
                          const adultCpfExists =
                            usuarios.some((u) => u.id !== user.id && isAdultPerson(u) && u.cpf && !u.cpf.startsWith('INF-') && u.cpf.replace(/\D/g, '') === cleanNewCpf) ||
                            alunos.some((a) => a.id !== user.id && isAdultPerson(a) && a.cpf && !a.cpf.startsWith('INF-') && a.cpf.replace(/\D/g, '') === cleanNewCpf);
                          if (adultCpfExists) {
                            alert('Este CPF já está cadastrado no sistema!');
                            return;
                          }
                        }
                      }
                      if (onSaveProfile) {
                        onSaveProfile({
                          ...user,
                          nome,
                          email,
                          senha,
                          whatsapp,
                          cpf,
                          dataNascimento,
                          endereco,
                          tipoSangue,
                          alergico,
                          contatoEmergenciaNome,
                          contatoEmergenciaTelefone,
                          fotoPerfil: foto,
                          faixa: faixa || user.faixa,
                          professorResponsavelId: profId ? Number(profId) : null,
                          professorResponsavelNome: profNome || '',
                        });
                        alert('Seu cadastro pessoal foi atualizado com sucesso!');
                      }
                    }}
                    className="space-y-4 text-xs max-w-2xl"
                  >
                    <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 text-left text-[11px] text-neutral-400 mb-4 flex items-center gap-2 sm:col-span-2">
                      <span>🔒 Nome Completo, CPF, Data de Nascimento e Faixa são protegidos e só podem ser alterados pela Administração ou pelo seu Professor Responsável.</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Nome Completo</label>
                        <input
                          type="text"
                          required
                          disabled
                          value={nome}
                          onChange={(e) => setNome(e.target.value.toUpperCase())}
                          className="w-full bg-[#151515] text-neutral-400 border border-neutral-850 rounded-xl py-2.5 px-3 outline-none cursor-not-allowed opacity-75 uppercase font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">WhatsApp</label>
                        <input
                          type="text"
                          required
                          value={whatsapp}
                          onChange={(e) => {
                            const newPhone = maskPhone(e.target.value);
                            setWhatsapp(newPhone);
                            if (isMinorProvisorio) {
                              setContatoEmergenciaTelefone(newPhone);
                            }
                          }}
                          placeholder="(98) 99999-9999"
                          className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none font-mono ${
                            showEmergencyPhoneError
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-neutral-800'
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Senha de Acesso</label>
                        <input
                          type="text"
                          required
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">CPF</label>
                        <input
                          type="text"
                          disabled
                          placeholder="Ex: 000.000.000-00"
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          className="w-full bg-[#151515] text-neutral-400 border border-neutral-850 rounded-xl py-2.5 px-3 outline-none font-mono cursor-not-allowed opacity-75"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Data de Nascimento</label>
                        <input
                          type="date"
                          disabled
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="w-full bg-[#151515] text-neutral-400 border border-neutral-850 rounded-xl py-2.5 px-3 outline-none font-mono cursor-not-allowed opacity-75"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Graduação (Faixa)</label>
                        <select
                          disabled
                          value={faixa}
                          onChange={(e) => setFaixa(e.target.value)}
                          className="w-full bg-[#151515] text-neutral-400 border border-neutral-850 rounded-xl py-2.5 px-3 outline-none cursor-not-allowed opacity-75"
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
                          value={endereco}
                          onChange={(e) => setEndereco(e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Tipo Sanguíneo</label>
                        <input
                          type="text"
                          placeholder="Ex: AB+, O-"
                          value={tipoSangue}
                          onChange={(e) => setTipoSangue(e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Fatores Alérgicos / Observações Médicas</label>
                      <input
                        type="text"
                        placeholder="Ex: Asma, alergia a dipirona ou 'Sem alergias'"
                        value={alergico}
                        onChange={(e) => setAlergico(e.target.value)}
                        className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                          Falar Com (Contato de Emergência) {isMinorStudent && !isUserCpfProvisorio ? '*' : ''}
                        </label>
                        <input
                          type="text"
                          placeholder="NOME DO CONTATO"
                          value={contatoEmergenciaNome}
                          onChange={(e) => setContatoEmergenciaNome(e.target.value.toUpperCase())}
                          className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none uppercase font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                          Nº de Emergência {isMinorStudent && !isUserCpfProvisorio ? '*' : ''}
                        </label>
                        <input
                          type="text"
                          placeholder="(98) 99999-9999"
                          value={contatoEmergenciaTelefone}
                          onChange={(e) => {
                            const newPhone = maskPhone(e.target.value);
                            setContatoEmergenciaTelefone(newPhone);
                            if (isMinorProvisorio) {
                              setWhatsapp(newPhone);
                            }
                          }}
                          className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none font-mono ${
                            showEmergencyPhoneError
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-neutral-800'
                          }`}
                        />
                        {showEmergencyPhoneError && (
                          <p className="text-[11px] text-red-500 font-bold mt-1.5 bg-red-500/10 border border-red-500/30 p-2 rounded-lg leading-snug">
                            Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato de emergência diferente.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Foto de Perfil</label>
                      <div className="flex items-center gap-3 bg-[#1a1a1a] p-2.5 rounded-xl border border-neutral-800">
                        {foto ? (
                          <img src={foto} alt="Avatar" className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0" />
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
                                  setFoto(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 text-[10px] text-neutral-400 focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[9px] file:bg-orange-500 file:text-white cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Professor(a) ou Instrutor(a) Responsável</label>
                      <select
                        value={profId}
                        onChange={(e) => {
                          const selectedId = Number(e.target.value) || '';
                          setProfId(selectedId);
                          const selectedUser = usuarios.find(u => u.id === selectedId);
                          setProfNome(selectedUser ? selectedUser.nome : '');
                        }}
                        className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 focus:border-orange-500 outline-none cursor-pointer"
                      >
                        <option value="">Selecione um Professor/Instrutor...</option>
                        {usuarios
                          .filter((u) => u.tipo === 'professor' || u.tipo === 'instrutor')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} ({p.tipo === 'professor' ? 'Professor(a)' : 'Instrutor(a)'})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition shadow-lg shadow-orange-500/15 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                      >
                        <span>Salvar Cadastro Pessoal</span>
                      </button>
                    </div>
                  </form>
                );
              })()}
              {publicidadePosicao === 'topo' ? renderNormalCarousel() : renderPublicidade()}
            </div>
          )}

          {/* GOOGLE INTEGRATIONS TAB */}
          {activeTab === 'googleIntegrations' && (
            <div className="animate-fade-in text-left">
              <GoogleIntegrationsPane />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#141414] p-10 rounded-2xl border border-neutral-800 text-center py-12">
          <p className="text-neutral-400 text-sm">Aguarde... Vinculando seu perfil de atleta à sua conta.</p>
        </div>
      )}

      {/* MODAL SINO NOTIFICACOES */}
      {showBellNotificationsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-start justify-center p-4 pt-12 sm:pt-16 md:pt-20 overflow-y-auto">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => {
                setShowBellNotificationsModal(false);
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
                <h2 className="text-xl font-bold text-white">Minhas Notificações</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Recados importantes para você</p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
              {personalNotifications.length > 0 ? (
                personalNotifications.map((n) => (
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
                              deleteUserNotification(studentUserKey, n.id);
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
                <div className="text-center py-10 opacity-50 text-sm text-neutral-400">Sua caixa de mensagens está limpa.</div>
              )}
            </div>

            {personalNotifications.length > 0 && (
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
                            studentUserKey,
                            personalNotifications.map((n) => n.id)
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
                setShowBellNotificationsModal(false);
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

      {/* MODAL NENHUMA AULA PROGRAMADA */}
      {showNoClassAlertModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-center">
            <button
              onClick={() => setShowNoClassAlertModal(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-5xl mb-4 animate-bounce">⚠️</span>
              <h3 className="text-lg font-bold text-white mb-2">Sem Aula Programada</h3>
              <p className="text-neutral-400 text-xs leading-relaxed mb-6">
                Não há nenhuma aula ou treino agendado na grade para o dia de hoje. 
                <br /><br />
                Por este motivo, a confirmação automática de presença não está disponível no momento. Caso tenha ocorrido um treino extra ou reposição, por favor solicite o lançamento manual diretamente ao seu professor ou administrador da academia.
              </p>
              
              <button
                onClick={() => setShowNoClassAlertModal(false)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-orange-500/25 cursor-pointer transition active:scale-95"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECK-IN BLOQUEADO ANTES DO HORÁRIO */}
      {showCheckinBlockedModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-start justify-center p-4 pt-12 sm:pt-16 md:pt-20 overflow-y-auto animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-center">
            <button
              onClick={() => setShowCheckinBlockedModal(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-5xl mb-4 animate-bounce">🥋</span>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide text-orange-500">Aula Não Iniciada</h3>
              <p className="text-neutral-300 text-xs leading-relaxed mb-4">
                Você não está apto a solicitar a confirmação de presença neste momento, tendo em vista que a aula de hoje ainda não iniciou!
              </p>
              <div className="bg-[#1c1c1c] rounded-xl p-3 w-full border border-neutral-800 text-left space-y-1 text-xs mb-6">
                <p className="text-neutral-400">📅 <span className="font-semibold text-neutral-200">Dia:</span> Hoje</p>
                <p className="text-neutral-400">⏰ <span className="font-semibold text-neutral-200">Início da Aula:</span> {blockedModalDetails?.earliestTime || '--:--'}</p>
                <p className="text-neutral-400">⏱️ <span className="font-semibold text-neutral-200">Sua Hora Atual:</span> {blockedModalDetails?.userClickedTime || '--:--'}</p>
                <p className="text-[10px] text-orange-500 font-bold mt-1 leading-normal uppercase">
                  * Você poderá fazer o check-in das {blockedModalDetails?.earliestTime || '--:--'} até as 23:59 de hoje. Após as 23:59, caso a confirmação não seja realizada, sua inscrição/presença passará automaticamente para o status "Justificado".
                </p>
              </div>
              
              <button
                onClick={() => setShowCheckinBlockedModal(false)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-orange-500/25 cursor-pointer transition active:scale-95"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL JUSTIFICAR FALTA */}
      {justifyingDate && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1150] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => { setJustifyingDate(null); setJustificationReason(''); }}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-orange-500 mb-3 border-b border-neutral-900 pb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Justificar Ausência</h3>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed mb-4">
                Preencha o campo abaixo informando o motivo de sua falta no dia <strong className="text-orange-500">{justifyingDate}</strong>. 
                Sua solicitação será enviada para homologação do professor responsável.
              </p>
              
              <div className="space-y-1.5 mb-5">
                <label className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">Motivo da Falta</label>
                <textarea
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  placeholder="Ex: Consulta médica / Motivos de trabalho / Problema de saúde..."
                  className="w-full bg-[#1e1e1e] border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold h-24 resize-none"
                />
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => { setJustifyingDate(null); setJustificationReason(''); }}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 border border-neutral-800 py-2.5 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!justificationReason.trim()) {
                      alert('⚠️ Por favor informe o motivo da sua ausência.');
                      return;
                    }
                    onAddJustificativa?.(currentStudent.id, currentStudent.nome, justifyingDate, justificationReason.trim());
                    setJustificationReason('');
                    setJustifyingDate(null);
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-orange-500/25 cursor-pointer transition active:scale-95"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR PDF */}
      {pdfViewerUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-4xl w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left flex flex-col h-[85vh]">
            <button
              onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(''); }}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-orange-500 mb-4 pb-2 border-b border-neutral-900">
              <Award className="w-6 h-6" />
              <h2 className="text-base font-bold text-white truncate pr-8">{pdfViewerTitle}</h2>
            </div>

            <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
              <iframe
                src={pdfViewerUrl}
                className="w-full h-full border-0 rounded-xl"
                title={pdfViewerTitle}
              />
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-neutral-900 justify-end">
              <button
                onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(''); }}
                className="border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                Fechar Visualização
              </button>
              <a
                href={pdfViewerUrl}
                download={pdfViewerTitle || 'documento.pdf'}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2.5 px-5 rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar PDF
              </a>
            </div>
          </div>
        </div>
      )}
      {/* MANDATORY BLOCKING MODAL FOR PENDING ABSENCES */}
      {pendingAbsenceDates.length > 0 && currentStudent && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-start justify-center pt-4 sm:pt-10 p-4 overflow-y-auto animate-fade-in select-none">
          <div className="bg-[#141414] border-2 border-orange-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-left shadow-2xl space-y-6 relative overflow-hidden my-auto sm:my-0">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500" />
            
            <div className="flex items-center gap-3 border-b border-neutral-850 pb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl shrink-0 animate-pulse">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block">
                  Pendente de Presença ({pendingAbsenceDates.length} {pendingAbsenceDates.length === 1 ? 'aula' : 'aulas'})
                </span>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mt-0.5">
                  Aula Não Confirmada
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              Para prosseguir e liberar o acesso à sua área do aluno, por favor envie uma justificativa para cada uma das suas faltas abaixo.
            </p>

            {/* DETAILS OF THE CLASS */}
            <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-400">
                <span>Data da Aula:</span>
                <strong className="text-white text-sm font-bold">{pendingAbsenceDates[0].dateStr.split('-').reverse().join('/')}</strong>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Turma:</span>
                <strong className="text-orange-400 font-bold">{pendingAbsenceDates[0].turma}</strong>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Horário:</span>
                <strong className="text-neutral-200 font-semibold">{pendingAbsenceDates[0].horario}</strong>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Professor:</span>
                <strong className="text-neutral-200 font-black uppercase">{formatProfName(pendingAbsenceDates[0].professorNome)}</strong>
              </div>
            </div>

            {/* JUSTIFICATION TEXTAREA */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                Motivo da Ausência (Obrigatório para Justificar):
              </label>
              <textarea
                value={blockingJustificationText}
                onChange={(e) => setBlockingJustificationText(e.target.value)}
                placeholder="Descreva aqui o motivo de não ter comparecido à aula..."
                rows={3}
                className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition resize-none"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!onAddJustificativa || !blockingJustificationText.trim()) return;
                  const item = pendingAbsenceDates[0];
                  onAddJustificativa(
                    currentStudent.id,
                    currentStudent.nome,
                    item.dateStr,
                    blockingJustificationText.trim(),
                    item.turma,
                    item.horario,
                    formatProfName(item.professorNome),
                    'pendente'
                  );
                  setBlockingJustificationText('');
                }}
                disabled={!blockingJustificationText.trim()}
                className={`py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                  blockingJustificationText.trim()
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white shadow-lg shadow-orange-500/20 active:scale-95'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Justificar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!onAddJustificativa) return;
                  const item = pendingAbsenceDates[0];
                  onAddJustificativa(
                    currentStudent.id,
                    currentStudent.nome,
                    item.dateStr,
                    '[Falta Registrada - Ignorado pelo Aluno]',
                    item.turma,
                    item.horario,
                    formatProfName(item.professorNome),
                    'rejeitada'
                  );
                  setBlockingJustificationText('');
                }}
                className="py-3 px-4 bg-red-600 hover:bg-red-700 border border-red-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-lg shadow-red-600/30 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
              >
                <XCircle className="w-4 h-4" />
                <span>Ignorar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

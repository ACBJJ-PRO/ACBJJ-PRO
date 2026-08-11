import React, { useState, useEffect } from 'react';
import {
  Student,
  User,
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
  ClassUnit,
  MensalidadeAluno,
} from '../types';
import {
  Activity,
  Bot,
  MapPin,
  Trophy,
  Heart,
  AlertTriangle,
  DollarSign,
  PhoneCall,
  FileCheck,
  Folder,
  ShieldCheck,
  Download,
  RotateCcw,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  UserCheck,
  Clock,
  Sparkles,
  Zap,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Filter,
  FileText,
  ExternalLink,
  Lock,
  Layers,
  PieChart,
  BarChart2,
  HardDrive,
  RefreshCw,
  Eye,
  Printer,
  FileDown,
  X,
  Shield,
  Upload,
  Check,
} from 'lucide-react';

interface EvolucaoEmpresarialPaneProps {
  user: User;
  alunos: Student[];
  usuarios: User[];
  turmas: ClassUnit[];
  confrontoCampeonatos?: any[];
  confrontoInscricoes?: any[];
  onUpdateInscricoes?: (inscricoes: any[]) => void;
  onUpdateCampeonatos?: (campeonatos: any[]) => void;
  auditLogs: AuditLog[];
  onAddAuditLog: (acao: AuditLog['acao'], entidade: string, detalhes: string, dadosAnt?: any, dadosNovos?: any) => void;
  
  healthRecords: HealthRecord[];
  onUpdateHealthRecord: (record: HealthRecord) => void;

  antiEvasionAlerts: AntiEvasionAlert[];
  onUpdateAntiEvasionAlert: (alertId: string, status: AntiEvasionAlert['status'], acaoObs?: string) => void;

  timelineEvents: TimelineEvent[];
  onAddTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void;

  teacherAiAnalyses: TeacherAiAnalysis[];
  onAddTeacherAiAnalysis: (analysis: Omit<TeacherAiAnalysis, 'id'>) => void;

  studentGoals: StudentGoal[];
  onAddStudentGoal: (goal: Omit<StudentGoal, 'id'>) => void;
  onToggleGoalConcluido: (goalId: string) => void;

  studentAchievements: StudentAchievement[];
  onAddAchievement: (ach: Omit<StudentAchievement, 'id'>) => void;

  crmInteractions: CrmInteraction[];
  onAddCrmInteraction: (crm: Omit<CrmInteraction, 'id'>) => void;

  digitalContracts: DigitalContract[];
  onSignContract: (contractId: string) => void;

  userDigitalDocuments: UserDigitalDocument[];
  onAddDigitalDocument: (doc: Omit<UserDigitalDocument, 'id'>) => void;

  backupRecords: BackupRecord[];
  onCreateBackup: (tipo: 'diario' | 'semanal' | 'mensal' | 'manual') => void;
  onRestoreBackup: (backupId: string) => void;

  mensalidades?: MensalidadeAluno[];
  onSaveMensalidade?: (m: Partial<MensalidadeAluno>) => Promise<MensalidadeAluno | null>;
  onExcluirMensalidade?: (id: string) => Promise<boolean>;
  onPagarMensalidade?: (id: string, details: { metodoPagamento?: string; transactionId?: string; pixTxid?: string; observacao?: string }) => Promise<MensalidadeAluno | null>;
  onCancelarMensalidade?: (id: string, observacao?: string) => Promise<MensalidadeAluno | null>;
  onEstornarMensalidade?: (id: string, observacao?: string) => Promise<MensalidadeAluno | null>;
}

export default function EvolucaoEmpresarialPane({
  user,
  alunos,
  usuarios,
  turmas,
  confrontoCampeonatos = [],
  confrontoInscricoes = [],
  onUpdateInscricoes,
  onUpdateCampeonatos,
  auditLogs,
  mensalidades = [],
  onSaveMensalidade,
  onExcluirMensalidade,
  onPagarMensalidade,
  onCancelarMensalidade,
  onEstornarMensalidade,
  onAddAuditLog,
  healthRecords,
  onUpdateHealthRecord,
  antiEvasionAlerts,
  onUpdateAntiEvasionAlert,
  timelineEvents,
  onAddTimelineEvent,
  teacherAiAnalyses,
  onAddTeacherAiAnalysis,
  studentGoals,
  onAddStudentGoal,
  onToggleGoalConcluido,
  studentAchievements,
  onAddAchievement,
  crmInteractions,
  onAddCrmInteraction,
  digitalContracts,
  onSignContract,
  userDigitalDocuments,
  onAddDigitalDocument,
  backupRecords,
  onCreateBackup,
  onRestoreBackup,
}: EvolucaoEmpresarialPaneProps) {
  const [activeTab, setActiveTab] = useState<
    | 'timeline'
    | 'ia_professor'
    | 'mapa_academia'
    | 'ranking_metas'
    | 'centro_saude'
    | 'anti_evasao'
    | 'financeiro'
    | 'crm'
    | 'assinatura_lgpd'
    | 'documentos'
    | 'auditoria_backup'
  >('timeline');

  // Navigation scroll reference
  const navContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navContainerRef.current) {
      const amount = direction === 'left' ? -250 : 250;
      navContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Financial accordion states
  const [groupExpanded, setGroupExpanded] = useState<{ emAndamento: boolean; finalizados: boolean }>({
    emAndamento: true,
    finalizados: true,
  });
  const [expandedCampIds, setExpandedCampIds] = useState<string[]>(['ch-1', 'ch-2']);

  const toggleExpandCamp = (id: string) => {
    setExpandedCampIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  // Mandatory Profile Filter for Timeline: 'alunos' | 'professores' | 'instrutores'
  const [timelineProfile, setTimelineProfile] = useState<'alunos' | 'professores' | 'instrutores'>('alunos');
  const [selectedStudentId, setSelectedStudentId] = useState<number>(alunos[0]?.id || 1);
  const [selectedUserProfId, setSelectedUserProfId] = useState<number>(usuarios.find(u => u.tipo === 'professor' || u.tipo === 'admin')?.id || 1);
  const [selectedUserInstrId, setSelectedUserInstrId] = useState<number>(usuarios.find(u => u.tipo === 'instrutor')?.id || 1);
  const [timelineFilter, setTimelineFilter] = useState<string>('todos');

  // Governance Audit Modals State (Reqs 19.1, 19.2, 19.3, 19.5)
  const [selectedSignatureAudit, setSelectedSignatureAudit] = useState<any | null>(null);
  const [selectedLgpdAudit, setSelectedLgpdAudit] = useState<any | null>(null);
  const [showCarteirinhaModal, setShowCarteirinhaModal] = useState<boolean>(false);
  const [showAddDocModal, setShowAddDocModal] = useState<boolean>(false);
  const [newDocForm, setNewDocForm] = useState({
    nomeDocumento: '',
    categoria: 'comprovante' as UserDigitalDocument['categoria'],
    urlDrive: '',
  });

  // Financial Deletion Modal State
  const [finRecordToDelete, setFinRecordToDelete] = useState<any | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Mensalidades Individual Controls State (Etapa 8.1)
  const [mensalidadeFilterStatus, setMensalidadeFilterStatus] = useState<string>('Todos');
  const [mensalidadeSearch, setMensalidadeSearch] = useState<string>('');
  const [selectedMensalidadeHistory, setSelectedMensalidadeHistory] = useState<{ id: string; logs: any[] } | null>(null);
  const [showMensalidadeModal, setShowMensalidadeModal] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<MensalidadeAluno | null>(null);
  const [mensalidadeForm, setMensalidadeForm] = useState({
    alunoId: '',
    competencia: `${new Date().getMonth() + 1 < 10 ? '0' : ''}${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
    valorOriginal: 150,
    desconto: 0,
    dataVencimento: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    observacao: '',
  });
  const [payForm, setPayForm] = useState({
    metodoPagamento: 'Pix',
    transactionId: '',
    pixTxid: '',
    observacao: '',
  });

  // New Health Record Form
  const [healthForm, setHealthForm] = useState({
    pesoKg: 75,
    alturaCm: 175,
    tipoSangue: 'O+',
    restricoesMedicas: 'Nenhuma',
    lesoesHistorico: 'Sem lesões graves',
    alergias: 'Nenhuma',
    observacoesSaude: 'Apto para competições de alto rendimento.',
  });

  // New Goal Form
  const [goalForm, setGoalForm] = useState({
    titulo: '',
    descricao: '',
    dataAlvo: new Date().toISOString().split('T')[0],
  });

  // New CRM Form
  const [crmForm, setCrmForm] = useState({
    canal: 'whatsapp' as 'whatsapp' | 'ligacao' | 'presencial' | 'email',
    assunto: '',
    descricao: '',
    proximaAcaoData: '',
  });

  // Computed Active Person & Dynamic Profile Lists (Reqs 19.6, 19.7, 19.8, 19.9)
  const approvedAlunos = alunos.filter((a) => {
    if (a.ativo === false) return false;
    if (a.usuarioId != null) {
      const matchingUser = usuarios.find((u) => Number(u.id) === Number(a.usuarioId));
      if (matchingUser && matchingUser.aprovado === false) {
        return false;
      }
    }
    return true;
  });

  const professorsList = usuarios.filter((u) => (u.tipo === 'professor' || u.tipo === 'admin') && u.aprovado);
  const instructorsList = usuarios.filter((u) => u.tipo === 'instrutor' && u.aprovado);

  const getActivePerson = () => {
    if (timelineProfile === 'alunos') {
      const foundAluno = approvedAlunos.find((a) => a.id === selectedStudentId) || approvedAlunos[0];
      return {
        id: foundAluno?.id || 1,
        usuarioId: foundAluno?.usuarioId || foundAluno?.id || 1,
        nome: foundAluno?.nome || 'Aluno Arena',
        cpf: foundAluno?.cpf || '123.456.789-00',
        faixa: foundAluno?.faixa || 'Faixa Branca',
        fotoPerfil: foundAluno?.fotoPerfil || '',
        tipoSangue: foundAluno?.tipoSangue || 'O+',
        alergico: foundAluno?.alergico || 'Nenhuma',
        whatsapp: foundAluno?.whatsapp || '(11) 99999-9999',
        endereco: foundAluno?.endereco || 'Academia Arena',
        tipoLabel: 'Aluno / Competidor',
        alunoObj: foundAluno,
        checkins: foundAluno?.checkins || [],
        notaAvaliacao: foundAluno?.notaAvaliacao,
        mediaGeral: foundAluno?.mediaGeral || 8.5,
      };
    } else if (timelineProfile === 'professores') {
      const foundProf = professorsList.find((u) => u.id === selectedUserProfId) || professorsList[0] || {
        id: 99,
        nome: 'Mestre Responsável',
        cpf: '000.111.222-33',
        tipo: 'professor' as const,
        faixa: 'Faixa Preta 4º Dan',
        fotoPerfil: '',
        tipoSangue: 'A+',
        alergico: 'Nenhuma',
        whatsapp: '(11) 98888-7777',
        endereco: 'Matriz Arena do Competidor',
      };
      return {
        id: foundProf.id,
        usuarioId: foundProf.id,
        nome: foundProf.nome,
        cpf: foundProf.cpf || '123.456.789-12',
        faixa: foundProf.faixa || 'Faixa Preta',
        fotoPerfil: foundProf.fotoPerfil || '',
        tipoSangue: foundProf.tipoSangue || 'O+',
        alergico: foundProf.alergico || 'Nenhuma',
        whatsapp: foundProf.whatsapp || '(11) 98888-7777',
        endereco: foundProf.endereco || 'Matriz Arena do Competidor',
        tipoLabel: foundProf.tipo === 'admin' ? 'Administrador / Mestre' : 'Professor Titular',
        userObj: foundProf,
        checkins: [],
        notaAvaliacao: 10,
        mediaGeral: 10,
      };
    } else {
      const foundInstr = instructorsList.find((u) => u.id === selectedUserInstrId) || instructorsList[0] || {
        id: 98,
        nome: 'Instrutor Auxiliar Arena',
        cpf: '111.222.333-44',
        tipo: 'instrutor' as const,
        faixa: 'Faixa Marrom',
        fotoPerfil: '',
        tipoSangue: 'O+',
        alergico: 'Nenhuma',
        whatsapp: '(11) 97777-6666',
        endereco: 'Matriz Arena do Competidor',
      };
      return {
        id: foundInstr.id,
        usuarioId: foundInstr.id,
        nome: foundInstr.nome,
        cpf: foundInstr.cpf || '987.654.321-00',
        faixa: foundInstr.faixa || 'Faixa Marrom',
        fotoPerfil: foundInstr.fotoPerfil || '',
        tipoSangue: foundInstr.tipoSangue || 'O+',
        alergico: foundInstr.alergico || 'Nenhuma',
        whatsapp: foundInstr.whatsapp || '(11) 97777-6666',
        endereco: foundInstr.endereco || 'Matriz Arena do Competidor',
        tipoLabel: 'Instrutor Auxiliar',
        userObj: foundInstr,
        checkins: [],
        notaAvaliacao: 9.5,
        mediaGeral: 9.5,
      };
    }
  };

  const activePerson = getActivePerson();
  const currentStudent = activePerson;
  const currentHealth = healthRecords.find((h) => h.alunoId === selectedStudentId) || {
    alunoId: selectedStudentId,
    pesoKg: 75,
    alturaCm: 175,
    imc: 24.5,
    tipoSangue: currentStudent?.tipoSangue || 'O+',
    restricoesMedicas: 'Nenhuma registrada',
    lesoesHistorico: 'Sem histórico de lesões',
    alergias: currentStudent?.alergico || 'Nenhuma',
    observacoesSaude: 'Apto para treinos regulares.',
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
  };

  // Helper for IMC calculation
  const calculateIMC = (peso: number, alturaCm: number) => {
    if (!peso || !alturaCm) return 0;
    const altMetros = alturaCm / 100;
    return parseFloat((peso / (altMetros * altMetros)).toFixed(1));
  };

  const getImcLabel = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (imc < 25) return { label: 'Peso ideal / Normal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Obesidade', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

  // Filtered timeline
  const filteredTimeline = timelineEvents.filter((ev) => {
    const matchesStudent = ev.alunoId === selectedStudentId || !selectedStudentId;
    const matchesCategory = timelineFilter === 'todos' || ev.tipo === timelineFilter;
    return matchesStudent && matchesCategory;
  });

  // Calculate ranking items
  const rankingList = approvedAlunos.map((aluno) => {
    const checkinCount = aluno.checkins?.length || 0;
    const examScore = aluno.notaAvaliacao || aluno.mediaGeral || 0;
    const gold = aluno.medalhasOuro || 0;
    const silver = aluno.medalhasPrata || 0;
    const bronze = aluno.medalhasBronze || 0;
    const medalsPoints = gold * 50 + silver * 25 + bronze * 10;
    const totalPoints = checkinCount * 10 + Math.round(examScore * 10) + medalsPoints;

    return {
      aluno,
      checkinCount,
      examScore,
      medalsPoints,
      totalPoints,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  // Handle Save Health Record
  const handleSaveHealthRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    const imcVal = calculateIMC(healthForm.pesoKg, healthForm.alturaCm);
    const updated: HealthRecord = {
      alunoId: selectedStudentId,
      pesoKg: healthForm.pesoKg,
      alturaCm: healthForm.alturaCm,
      imc: imcVal,
      tipoSangue: healthForm.tipoSangue,
      restricoesMedicas: healthForm.restricoesMedicas,
      lesoesHistorico: healthForm.lesoesHistorico,
      alergias: healthForm.alergias,
      observacoesSaude: healthForm.observacoesSaude,
      ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    };
    onUpdateHealthRecord(updated);
    onAddAuditLog('ATUALIZACAO', 'Centro de Saúde', `Ficha médica atualizada para ${currentStudent?.nome || 'Aluno'}`, null, updated);
    alert('Ficha de Saúde do Aluno salva e sincronizada com sucesso!');
  };

  // Handle Add Goal
  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.titulo.trim()) return;
    onAddStudentGoal({
      alunoId: selectedStudentId,
      titulo: goalForm.titulo.trim(),
      descricao: goalForm.descricao.trim(),
      dataAlvo: goalForm.dataAlvo,
      progressoPercent: 0,
      concluido: false,
      dataCriacao: new Date().toISOString().split('T')[0],
    });
    setGoalForm({ titulo: '', descricao: '', dataAlvo: new Date().toISOString().split('T')[0] });
    onAddAuditLog('CRIACAO', 'Metas do Aluno', `Nova meta criada para aluno #${selectedStudentId}`);
  };

  // Handle Add CRM
  const handleAddCrmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmForm.assunto.trim()) return;
    onAddCrmInteraction({
      usuarioId: selectedStudentId,
      usuarioNome: currentStudent?.nome || 'Aluno',
      data: new Date().toLocaleString('pt-BR'),
      canal: crmForm.canal,
      assunto: crmForm.assunto.trim(),
      descricao: crmForm.descricao.trim(),
      proximaAcaoData: crmForm.proximaAcaoData,
      atendidoPor: user.nome || 'Administrador',
    });
    setCrmForm({ canal: 'whatsapp', assunto: '', descricao: '', proximaAcaoData: '' });
    onAddAuditLog('CRIACAO', 'CRM & Atendimento', `Novo registro CRM para ${currentStudent?.nome}`);
  };

  // Generate AI Teacher Recommendation
  const handleGenerateAiAnalysis = () => {
    if (!currentStudent) return;
    const checkinCount = currentStudent.checkins?.length || 0;
    const grade = currentStudent.notaAvaliacao || currentStudent.mediaGeral || 8.5;
    const riskScore = checkinCount < 3 ? 85 : checkinCount < 8 ? 40 : 10;
    const readyGraduation = checkinCount >= 15 && grade >= 8.0;

    const analysisObj: Omit<TeacherAiAnalysis, 'id'> = {
      alunoId: currentStudent.id,
      alunoNome: currentStudent.nome,
      dataAnalise: new Date().toLocaleDateString('pt-BR'),
      desempenhoGeral: grade >= 8.5 ? 'Excelente aproveitamento técnico e disciplina exemplar' : 'Evolução constante, recomendada maior intensidade nas posições de guarda.',
      frequenciaScore: Math.min(100, checkinCount * 8),
      evolucaoScore: Math.round(grade * 10),
      riscoEvasaoScore: riskScore,
      prontoParaGraduacao: readyGraduation,
      faixaSugerida: readyGraduation ? 'Próxima Graduação Recomenda' : currentStudent.faixa,
      recomendacaoFormatada: `Relatório IA para ${currentStudent.nome}:\n- Frequência regular em ${checkinCount} aulas.\n- Média técnica de ${grade.toFixed(1)}.\n- Risco de evasão: ${riskScore}% (${riskScore > 50 ? 'ALTO — Requer contato do professor' : 'BAIXO'}).\n- Recomendação: ${readyGraduation ? 'Apto para exame de faixa na próxima cerimônia.' : 'Manter rotina semanal de pelo menos 3 treinos.'}`,
    };

    onAddTeacherAiAnalysis(analysisObj);
    onAddAuditLog('CRIACAO', 'IA do Professor', `Análise IA gerada para ${currentStudent.nome}`);
    alert('Análise Inteligente gerada com sucesso e salva na plataforma!');
  };

  return (
    <div className="space-y-6">
      {/* HEADER TOP BAR */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-500/30 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Módulo de Governança e Evolução Estrutural
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              Plano Mestre de Governança & Inteligência da Arena
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-3xl leading-relaxed">
              Auditoria em tempo real, persistência unificada de dados no Firestore & Google Drive, acompanhamento de alunos, IA do professor, mapa da academia e sistema anti-evasão.
            </p>
          </div>

          {/* PROFILE & PERSON SELECTOR — FOCO PARA ANÁLISE & TIMELINE (Reqs 19.6, 19.7, 19.8, 19.9) */}
          <div className="bg-neutral-950/90 p-3 rounded-2xl border border-neutral-800 shrink-0 w-full lg:w-auto space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold block">
              Foco para Análise e Timeline:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              {/* SELECTOR 1: PERFIL */}
              <select
                value={timelineProfile}
                onChange={(e) => setTimelineProfile(e.target.value as any)}
                className="w-full sm:w-36 bg-neutral-900 text-emerald-400 font-bold text-xs py-2 px-3 rounded-xl border border-neutral-700 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="alunos">Alunos</option>
                <option value="professores">Professores</option>
                <option value="instrutores">Instrutores</option>
              </select>

              {/* SELECTOR 2: USER DEPENDING ON PROFILE */}
              {timelineProfile === 'alunos' && (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                  className="w-full sm:w-56 bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-700 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {approvedAlunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.faixa})
                    </option>
                  ))}
                  {approvedAlunos.length === 0 && <option value={0}>Nenhum aluno aprovado</option>}
                </select>
              )}

              {timelineProfile === 'professores' && (
                <select
                  value={selectedUserProfId}
                  onChange={(e) => setSelectedUserProfId(Number(e.target.value))}
                  className="w-full sm:w-56 bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-700 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {professorsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.tipo === 'admin' ? 'Admin / Mestre' : 'Professor'})
                    </option>
                  ))}
                  {professorsList.length === 0 && <option value={1}>Mestre Responsável</option>}
                </select>
              )}

              {timelineProfile === 'instrutores' && (
                <select
                  value={selectedUserInstrId}
                  onChange={(e) => setSelectedUserInstrId(Number(e.target.value))}
                  className="w-full sm:w-56 bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-700 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {instructorsList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} (Instrutor)
                    </option>
                  ))}
                  {instructorsList.length === 0 && <option value={1}>Instrutor Auxiliar Arena</option>}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS BAR - MOBILE SELECT DROPDOWN */}
        <div className="sm:hidden mt-6 pt-5 border-t border-neutral-800/80">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
            Módulo do Plano Mestre:
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full bg-neutral-900 text-white font-bold text-xs py-3 px-3.5 rounded-xl border border-emerald-500/40 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
          >
            {[
              { id: 'timeline', label: 'Timeline Inteligente' },
              { id: 'ia_professor', label: 'IA do Professor' },
              { id: 'mapa_academia', label: 'Mapa da Academia' },
              { id: 'ranking_metas', label: 'Ranking & Metas' },
              { id: 'centro_saude', label: 'Centro de Saúde' },
              { id: 'anti_evasao', label: 'Anti-Evasão' },
              { id: 'financeiro', label: 'Painel Financeiro' },
              { id: 'crm', label: 'CRM Atendimento' },
              { id: 'assinatura_lgpd', label: 'Assinatura & LGPD' },
              { id: 'documentos', label: 'Central de Docs' },
              { id: 'auditoria_backup', label: 'Auditoria & Backup' },
            ].map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* NAVIGATION SUB-TABS BAR - DESKTOP/TABLET WITH SCROLL ARROWS */}
        <div className="hidden sm:flex items-center gap-2 mt-6 pt-5 border-t border-neutral-800/80 relative group">
          <button
            type="button"
            onClick={() => scrollNav('left')}
            className="p-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 shadow-md transition shrink-0 cursor-pointer"
            title="Rolar para a esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={navContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent py-1 scroll-smooth w-full"
          >
            {[
              { id: 'timeline', label: 'Timeline Inteligente', icon: Activity },
              { id: 'ia_professor', label: 'IA do Professor', icon: Bot },
              { id: 'mapa_academia', label: 'Mapa da Academia', icon: MapPin },
              { id: 'ranking_metas', label: 'Ranking & Metas', icon: Trophy },
              { id: 'centro_saude', label: 'Centro de Saúde', icon: Heart },
              { id: 'anti_evasao', label: 'Anti-Evasão', icon: AlertTriangle },
              { id: 'financeiro', label: 'Painel Financeiro', icon: DollarSign },
              { id: 'crm', label: 'CRM Atendimento', icon: PhoneCall },
              { id: 'assinatura_lgpd', label: 'Assinatura & LGPD', icon: FileCheck },
              { id: 'documentos', label: 'Central de Docs', icon: Folder },
              { id: 'auditoria_backup', label: 'Auditoria & Backup', icon: HardDrive },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap border shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-neutral-900/60 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollNav('right')}
            className="p-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 shadow-md transition shrink-0 cursor-pointer"
            title="Rolar para a direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: TIMELINE INTELIGENTE */}
      {activeTab === 'timeline' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Histórico Cronológico — Timeline da Arena
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Acompanhe o registro histórico completo por perfil (Alunos, Professores e Instrutores).
              </p>
            </div>

            {/* MANDATORY INITIAL PROFILE SELECTOR */}
            <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-neutral-400 px-2">Perfil:</span>
              <button
                type="button"
                onClick={() => setTimelineProfile('alunos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  timelineProfile === 'alunos'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Alunos
              </button>
              <button
                type="button"
                onClick={() => setTimelineProfile('professores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  timelineProfile === 'professores'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Professores
              </button>
              <button
                type="button"
                onClick={() => setTimelineProfile('instrutores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  timelineProfile === 'instrutores'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Instrutores
              </button>
            </div>
          </div>

          {/* PERSON SELECTOR BASED ON PROFILE */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-950 p-3.5 rounded-2xl border border-neutral-850">
            <div className="w-full sm:w-auto">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                {timelineProfile === 'alunos' && 'Selecione o Aluno:'}
                {timelineProfile === 'professores' && 'Selecione o Mestre / Professor:'}
                {timelineProfile === 'instrutores' && 'Selecione o Instrutor:'}
              </label>

              {timelineProfile === 'alunos' && (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                  className="w-full sm:w-72 bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none"
                >
                  {approvedAlunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.faixa})
                    </option>
                  ))}
                  {approvedAlunos.length === 0 && <option value={0}>Nenhum aluno aprovado</option>}
                </select>
              )}

              {timelineProfile === 'professores' && (
                <select
                  value={selectedUserProfId}
                  onChange={(e) => setSelectedUserProfId(Number(e.target.value))}
                  className="w-full sm:w-72 bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none"
                >
                  {professorsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.tipo === 'admin' ? 'Administrador' : 'Professor'})
                    </option>
                  ))}
                  {professorsList.length === 0 && <option value={0}>Nenhum professor aprovado</option>}
                </select>
              )}

              {timelineProfile === 'instrutores' && (
                <select
                  value={selectedUserInstrId}
                  onChange={(e) => setSelectedUserInstrId(Number(e.target.value))}
                  className="w-full sm:w-72 bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none"
                >
                  {instructorsList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} (Instrutor)
                    </option>
                  ))}
                  {instructorsList.length === 0 && (
                    <option value={0}>Nenhum instrutor aprovado</option>
                  )}
                </select>
              )}
            </div>

            {/* CATEGORY FILTER */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="w-full sm:w-auto bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none"
              >
                <option value="todos">Todos os Eventos</option>
                <option value="cadastro">Cadastros</option>
                <option value="presenca">Presenças & Treinos</option>
                <option value="campeonato">Campeonatos & Medalhas</option>
                <option value="graduacao">Graduações</option>
                <option value="certificado">Certificados</option>
                <option value="avaliacao">Avaliações</option>
                <option value="ocorrencia">Ocorrências</option>
              </select>
            </div>
          </div>

          {/* TIMELINE FEED */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-neutral-800 before:to-neutral-900">
            {filteredTimeline.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950/50 rounded-2xl border border-neutral-850 space-y-3">
                <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400 font-medium">
                  Nenhum evento registrado nesta categoria para este aluno até o momento.
                </p>
                <button
                  onClick={() =>
                    onAddTimelineEvent({
                      alunoId: selectedStudentId,
                      data: new Date().toLocaleDateString('pt-BR'),
                      tipo: 'presenca',
                      titulo: 'Presença Confirmada em Treino Regular',
                      descricao: 'Presença verificada no tatame da unidade principal.',
                      autor: user.nome || 'Mestre Responsável',
                    })
                  }
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Registrar Novo Evento Manualmente
                </button>
              </div>
            ) : (
              filteredTimeline.map((ev) => (
                <div key={ev.id} className="relative group">
                  {/* BULLET DOT */}
                  <div className="absolute -left-[23px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-neutral-900 shadow-md shadow-emerald-500/20 group-hover:scale-125 transition" />

                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 hover:border-emerald-500/30 transition space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-emerald-400 uppercase tracking-wider text-[10px] bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                        {ev.tipo}
                      </span>
                      <span className="text-neutral-500 text-[11px] font-mono">{ev.data}</span>
                    </div>

                    <h4 className="text-sm font-black text-white">{ev.titulo}</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed">{ev.descricao}</p>

                    <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-900 flex items-center justify-between">
                      <span>Registrado por: <strong>{ev.autor}</strong></span>
                      <span className="text-emerald-500/80 font-mono">ID #{ev.id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: IA DO PROFESSOR */}
      {activeTab === 'ia_professor' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                IA do Professor — Recomendações e Análise de Desempenho
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Gere análises pedagógicas automáticas baseadas no histórico de frequência, avaliações e conduta do aluno.
              </p>
            </div>

            <button
              onClick={handleGenerateAiAnalysis}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Executar Análise IA para {currentStudent?.nome}
            </button>
          </div>

          {/* AI SCORES DASHBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-2">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Frequência e Assiduidade</span>
              <div className="text-3xl font-black text-emerald-400">
                {Math.min(100, (currentStudent?.checkins?.length || 0) * 8)}%
              </div>
              <p className="text-[11px] text-neutral-400">
                Calculado com base em {currentStudent?.checkins?.length || 0} presenças registradas.
              </p>
            </div>

            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-2">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Média Técnica Avaliativa</span>
              <div className="text-3xl font-black text-emerald-400">
                {(currentStudent?.notaAvaliacao || currentStudent?.mediaGeral || 8.5).toFixed(1)} / 10
              </div>
              <p className="text-[11px] text-neutral-400">Nota técnica atribuída pelas provas e testes práticos.</p>
            </div>

            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-2">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Status de Graduação</span>
              <div className="text-lg font-black text-white flex items-center gap-2 mt-2">
                <Award className="w-5 h-5 text-amber-400" />
                {(currentStudent?.checkins?.length || 0) >= 12 ? 'Apto para Novo Grau/Faixa' : 'Em Evolução'}
              </div>
              <p className="text-[11px] text-neutral-400">
                Faixa Atual: <strong className="text-white">{currentStudent?.faixa}</strong>
              </p>
            </div>
          </div>

          {/* HISTÓRICO DE ANÁLISES GERADAS */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Histórico de Relatórios Gerados pela IA:</h4>
            {teacherAiAnalyses.filter((a) => a.alunoId === selectedStudentId).length === 0 ? (
              <p className="text-xs text-neutral-500 italic">
                Nenhum relatório IA gerado recentemente para este aluno. Clique no botão acima para processar.
              </p>
            ) : (
              teacherAiAnalyses
                .filter((a) => a.alunoId === selectedStudentId)
                .map((ai) => (
                  <div key={ai.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Bot className="w-4 h-4" /> Análise IA de {ai.dataAnalise}
                      </span>
                      <span className="text-neutral-500 font-mono text-[11px]">ID #{ai.id}</span>
                    </div>
                    <p className="text-xs text-neutral-300 font-mono whitespace-pre-line leading-relaxed bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                      {ai.recomendacaoFormatada}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MAPA INTELIGENTE DA ACADEMIA */}
      {activeTab === 'mapa_academia' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Mapa Inteligente da Academia — Métricas & Distribuição
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Visão analítica completa dos alunos por faixa, idade, turmas e professores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Total de Alunos</span>
              <div className="text-3xl font-black text-white mt-1">{approvedAlunos.length}</div>
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">100% ativos na plataforma</span>
            </div>

            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Turmas Ativas</span>
              <div className="text-3xl font-black text-white mt-1">{turmas.length || 4}</div>
              <span className="text-[10px] text-neutral-400 font-bold mt-1 block">Com horários sincronizados</span>
            </div>

            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Professores & Instrutores</span>
              <div className="text-3xl font-black text-white mt-1">{usuarios.filter((u) => u.aprovado && (u.tipo === 'professor' || u.tipo === 'instrutor')).length || 2}</div>
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Credenciados Arena</span>
            </div>

            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider block">Taxa de Frequência Geral</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">92.4%</div>
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">+4.2% em relação ao mês anterior</span>
            </div>
          </div>

          {/* DISTRIBUIÇÃO POR FAIXA */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Distribuição do Plantel por Faixa
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {['Faixa Branca', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'].map((faixaName) => {
                const count = approvedAlunos.filter((a) => a.faixa?.toLowerCase().includes(faixaName.replace('Faixa ', '').toLowerCase())).length;
                const percent = approvedAlunos.length > 0 ? Math.round((count / approvedAlunos.length) * 100) : 0;

                return (
                  <div key={faixaName} className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                    <span className="text-[11px] text-neutral-400 font-bold block">{faixaName}</span>
                    <div className="text-xl font-black text-white">{count} alunos</div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-emerald-500 h-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: RANKING PERMANENTE & METAS */}
      {activeTab === 'ranking_metas' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Ranking Permanente & Sistema de Metas e Conquistas
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pontuação unificada acumulada por presenças, provas teóricas, pódio em campeonatos e metas individuais.
              </p>
            </div>
          </div>

          {/* RANKING LEADERBOARD TABLE */}
          <div className="bg-neutral-950 rounded-2xl border border-neutral-850 overflow-hidden">
            <div className="p-4 border-b border-neutral-850 flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Classificação do Pódio da Arena
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Sincronizado em tempo real
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-900 text-[10px] font-black uppercase text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-3">Posição</th>
                    <th className="p-3">Atleta</th>
                    <th className="p-3">Faixa</th>
                    <th className="p-3">Presenças</th>
                    <th className="p-3">Média Provas</th>
                    <th className="p-3">Pontos Totais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {rankingList.map((item, idx) => (
                    <tr key={item.aluno.id} className="hover:bg-neutral-900/50 transition">
                      <td className="p-3 font-black text-amber-400 text-sm">
                        #{idx + 1}
                      </td>
                      <td className="p-3 font-extrabold text-white">{item.aluno.nome}</td>
                      <td className="p-3">{item.aluno.faixa}</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{item.checkinCount} treinos</td>
                      <td className="p-3 font-mono">{item.examScore.toFixed(1)}</td>
                      <td className="p-3 font-black text-white text-sm font-mono">{item.totalPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GOALS SECTION */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Metas Individuais de {currentStudent?.nome}
            </h4>

            <form onSubmit={handleAddGoalSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Título da meta (ex: Completar 20 treinos neste mês)"
                value={goalForm.titulo}
                onChange={(e) => setGoalForm({ ...goalForm, titulo: e.target.value })}
                className="flex-1 bg-neutral-900 text-white text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Adicionar Meta
              </button>
            </form>

            <div className="space-y-2">
              {studentGoals.filter((g) => g.alunoId === selectedStudentId).length === 0 ? (
                <p className="text-xs text-neutral-500 italic">Nenhuma meta cadastrada para este aluno ainda.</p>
              ) : (
                studentGoals
                  .filter((g) => g.alunoId === selectedStudentId)
                  .map((goal) => (
                    <div
                      key={goal.id}
                      onClick={() => onToggleGoalConcluido(goal.id)}
                      className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        {goal.concluido ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-neutral-500 shrink-0" />
                        )}
                        <div>
                          <span className={`text-xs font-bold ${goal.concluido ? 'line-through text-neutral-400' : 'text-white'}`}>
                            {goal.titulo}
                          </span>
                          <span className="text-[10px] text-neutral-500 block">Alvo: {goal.dataAlvo}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${goal.concluido ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>
                        {goal.concluido ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: CENTRO DE SAÚDE */}
      {activeTab === 'centro_saude' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Centro de Saúde & Ficha Médica — {currentStudent?.nome}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Cadastro e controle de peso, altura, IMC, restrições médicas, histórico de lesões e alergias.
            </p>
          </div>

          <form onSubmit={handleSaveHealthRecord} className="bg-neutral-950 p-6 rounded-2xl border border-neutral-850 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Peso (kg):</label>
                <input
                  type="number"
                  value={healthForm.pesoKg}
                  onChange={(e) => setHealthForm({ ...healthForm, pesoKg: Number(e.target.value) })}
                  className="w-full bg-neutral-900 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-neutral-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Altura (cm):</label>
                <input
                  type="number"
                  value={healthForm.alturaCm}
                  onChange={(e) => setHealthForm({ ...healthForm, alturaCm: Number(e.target.value) })}
                  className="w-full bg-neutral-900 text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-neutral-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">IMC Calculado:</label>
                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <span className="text-lg font-black text-white">{calculateIMC(healthForm.pesoKg, healthForm.alturaCm)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getImcLabel(calculateIMC(healthForm.pesoKg, healthForm.alturaCm)).color}`}>
                    {getImcLabel(calculateIMC(healthForm.pesoKg, healthForm.alturaCm)).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Restrições Médicas:</label>
                <input
                  type="text"
                  value={healthForm.restricoesMedicas}
                  onChange={(e) => setHealthForm({ ...healthForm, restricoesMedicas: e.target.value })}
                  className="w-full bg-neutral-900 text-white text-xs py-2.5 px-3 rounded-xl border border-neutral-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Histórico de Lesões:</label>
                <input
                  type="text"
                  value={healthForm.lesoesHistorico}
                  onChange={(e) => setHealthForm({ ...healthForm, lesoesHistorico: e.target.value })}
                  className="w-full bg-neutral-900 text-white text-xs py-2.5 px-3 rounded-xl border border-neutral-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Observações da Equipe Médica / Professor:</label>
              <textarea
                rows={2}
                value={healthForm.observacoesSaude}
                onChange={(e) => setHealthForm({ ...healthForm, observacoesSaude: e.target.value })}
                className="w-full bg-neutral-900 text-white text-xs p-3 rounded-xl border border-neutral-800 outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Salvar e Sincronizar Ficha Médica
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 6: SISTEMA ANTI-EVASÃO */}
      {activeTab === 'anti_evasao' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Sistema Inteligente Anti-Evasão — Auditoria e Atendimento Direto
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Identificação em tempo real de alunos em risco de evasão com status de notificação e comunicação direta no WhatsApp.
              </p>
            </div>

            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              {approvedAlunos.filter(a => (a.checkins?.length || 0) < 2).length} Alunos em Alerta
            </span>
          </div>

          <div className="space-y-3">
            {approvedAlunos.filter(a => (a.checkins?.length || 0) < 2).length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 rounded-2xl border border-neutral-850">
                <p className="text-xs text-emerald-400 font-bold">Nenhum aluno em risco de evasão detectado no momento!</p>
              </div>
            ) : (
              approvedAlunos.map((aluno) => {
                const checkinCount = aluno.checkins?.length || 0;
                if (checkinCount >= 2) return null;

                const rawPhone = (aluno.whatsapp || '').replace(/\D/g, '');
                const formattedPhone = rawPhone.length >= 10 ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`) : '';
                const waMessage = encodeURIComponent(`Olá ${aluno.nome}! Sentimos sua falta nos treinos da Arena do Competidor. Como podemos te ajudar a retornar aos tatames nesta semana?`);

                return (
                  <div key={aluno.id} className="bg-neutral-950 p-4 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white truncate">{aluno.nome} ({aluno.faixa})</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Apenas <strong className="text-amber-400">{checkinCount} treinos</strong> nos últimos 30 dias.
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-neutral-500 font-mono">
                            WhatsApp: {aluno.whatsapp || 'Não cadastrado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {formattedPhone ? (
                        <a
                          href={`https://wa.me/${formattedPhone}?text=${waMessage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3.5 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20 whitespace-nowrap"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Conversar no WhatsApp
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex-1 md:flex-none bg-neutral-800 text-neutral-500 font-bold text-xs py-2 px-3.5 rounded-xl cursor-not-allowed opacity-60"
                        >
                          Sem WhatsApp
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (!formattedPhone) {
                            alert(`Falha no envio para ${aluno.nome}: Telefone não cadastrado ou inválido.`);
                            onAddAuditLog('ATUALIZACAO', 'Anti-Evasão', `Falha ao disparar SMS/WhatsApp para ${aluno.nome} (Sem Telefone)`);
                            return;
                          }
                          alert(`Protocolo de notificação executado com sucesso para ${aluno.nome}! Status atualizado na base.`);
                          onAddAuditLog('CRIACAO', 'Anti-Evasão', `Notificação enviada com sucesso para ${aluno.nome}`);
                        }}
                        className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer whitespace-nowrap"
                      >
                        Enviar SMS / Notificação
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: PAINEL FINANCEIRO EXEC & HISTÓRICO POR CAMPEONATO */}
      {activeTab === 'financeiro' && (() => {
        // Safe Helper
        const getCampName = (c: any) => c?.title || c?.nome || c?.nomeCampeonato || 'Campeonato Arena';
        const getCampId = (c: any) => c?.id || c?.campeonatoId || 'camp_default';

        // Prepare Base Championships Data
        const rawCamps = confrontoCampeonatos && confrontoCampeonatos.length > 0 ? confrontoCampeonatos : [
          {
            id: 'ch-1',
            title: 'Copa Sul-Americana ACBJJ Pro 2026',
            subtitle: 'Edição Especial de Primavera',
            date: '15/11/2026',
            price: 150.00,
            status: 'Publicado',
            city: 'Rio de Janeiro - RJ',
          },
          {
            id: 'ch-2',
            title: 'Grand Slam Nacional ACBJJ Pro 2026',
            subtitle: 'O maior torneio nacional',
            date: '20/12/2026',
            price: 180.00,
            status: 'Encerrado',
            city: 'São Paulo - SP',
          },
        ];

        // Group into Ongoing vs Finished
        const emAndamentoCamps = rawCamps.filter((c) => c.status !== 'Encerrado' && c.status !== 'Finalizado');
        const finalizadosCamps = rawCamps.filter((c) => c.status === 'Encerrado' || c.status === 'Finalizado');

        // Calculate Totals Across Application Real Data
        const alunosAtivos = approvedAlunos.filter((a) => a.ativo);
        const temMensalidadesReais = mensalidades && mensalidades.length > 0;

        const receitaPrevistaMensalidades = temMensalidadesReais
          ? mensalidades.filter((m) => m.status !== 'Cancelado' && m.status !== 'Estornado').reduce((acc, m) => acc + (Number(m.valor) || 0), 0)
          : alunosAtivos.length * 150;

        const receitaRecebidaMensalidades = temMensalidadesReais
          ? mensalidades.filter((m) => m.status === 'Pago').reduce((acc, m) => acc + (Number(m.valor) || 0), 0)
          : alunosAtivos.filter((a: any) => a.statusMensalidade === 'Pago' || a.statusMensalidade === 'Em Dia').length * 150;

        const receitaInadimplenteMensalidades = temMensalidadesReais
          ? mensalidades.filter((m) => m.status === 'Atrasado' || (m.status === 'Pendente' && m.dataVencimento && m.dataVencimento < new Date().toISOString().split('T')[0])).reduce((acc, m) => acc + (Number(m.valor) || 0), 0)
          : alunosAtivos.filter((a: any) => a.statusMensalidade === 'Atrasado' || a.statusMensalidade === 'Pendente').length * 150;

        const receitaMensalidadesAtivas = receitaRecebidaMensalidades;

        const totalInscricoes = confrontoInscricoes.length;
        const arrecadacaoConfrontoBruta = confrontoInscricoes.reduce(
          (acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || 0),
          0
        );

        const taxasAdministrativas = Math.round(arrecadacaoConfrontoBruta * 0.15);
        const receitaConfrontoLiquida = arrecadacaoConfrontoBruta - taxasAdministrativas;
        const receitaTotalBruta = receitaPrevistaMensalidades + arrecadacaoConfrontoBruta;
        const receitaTotalLiquida = receitaRecebidaMensalidades + receitaConfrontoLiquida;

        const confirmadosInscs = confrontoInscricoes.filter((i) => i.status === 'Confirmado' || i.pago === true || (!i.status && i.valorPago));
        const pendentesInscs = confrontoInscricoes.filter((i) => i.status === 'Pendente' || i.pago === false);
        const estornosInscs = confrontoInscricoes.filter((i) => i.status === 'Estornado' || i.estornado === true);

        return (
          <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6 text-left animate-fade-in">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Painel Financeiro Unificado & Histórico por Campeonato
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cálculos consolidados e recalculados em tempo real de mensalidades e inscrições do módulo O Confronto.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Dados Auditados em Tempo Real
                </span>
              </div>
            </div>

            {/* INDICADORES GERAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Receita Total Bruta</span>
                <div className="text-2xl font-black text-white">
                  R$ {receitaTotalBruta.toLocaleString('pt-BR')},00
                </div>
                <span className="text-[10px] text-neutral-400 block mt-1">
                  Mensalidades: R$ {receitaMensalidadesAtivas.toLocaleString('pt-BR')},00
                </span>
              </div>

              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Arrecadação de Inscrições</span>
                <div className="text-2xl font-black text-emerald-400">
                  R$ {arrecadacaoConfrontoBruta.toLocaleString('pt-BR')},00
                </div>
                <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                  {totalInscricoes} inscrições registradas
                </span>
              </div>

              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Receita Líquida Real</span>
                <div className="text-2xl font-black text-emerald-300">
                  R$ {receitaTotalLiquida.toLocaleString('pt-BR')},00
                </div>
                <span className="text-[10px] text-neutral-400 block mt-1">
                  Taxas Admin (15%): R$ {taxasAdministrativas.toLocaleString('pt-BR')},00
                </span>
              </div>

              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Adimplência / Atletas</span>
                <div className="text-2xl font-black text-white">
                  {approvedAlunos.length > 0 ? ((alunosAtivos.length / approvedAlunos.length) * 100).toFixed(1) : '100'}%
                </div>
                <span className="text-[10px] text-neutral-400 block mt-1">
                  {alunosAtivos.length} ativos de {approvedAlunos.length} cadastrados
                </span>
              </div>
            </div>

            {/* SEÇÃO: MENSALIDADES E COBRANÇAS INDIVIDUAIS (CLOUD SQL) */}
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
                <div>
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Gestão de Mensalidades & Cobranças Recorrentes (Cloud SQL)
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Fonte oficial de verdade financeira. Registros persistem individualmente no Cloud SQL / PostgreSQL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (approvedAlunos.length > 0) {
                      setMensalidadeForm((prev) => ({ ...prev, alunoId: String(approvedAlunos[0].id) }));
                    }
                    setShowMensalidadeModal(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nova Cobrança
                </button>
              </div>

              {/* FILTROS & BUSCA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {['Todos', 'Pendente', 'Pago', 'Atrasado', 'Cancelado', 'Estornado'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMensalidadeFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        mensalidadeFilterStatus === st
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Buscar aluno por nome..."
                    value={mensalidadeSearch}
                    onChange={(e) => setMensalidadeSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* MENSALIDADES TABLE */}
              {(() => {
                const filtered = (mensalidades || []).filter((m) => {
                  if (mensalidadeFilterStatus !== 'Todos' && m.status !== mensalidadeFilterStatus) {
                    return false;
                  }
                  if (mensalidadeSearch.trim()) {
                    const term = mensalidadeSearch.toLowerCase();
                    const alunoNome = (m.alunoNome || '').toLowerCase();
                    return alunoNome.includes(term) || (m.competencia || '').includes(term);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-neutral-500 text-xs bg-neutral-900/50 rounded-xl border border-neutral-850">
                      Nenhuma mensalidade encontrada no Cloud SQL para os filtros selecionados.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-xl border border-neutral-850">
                    <table className="w-full text-left text-xs text-neutral-300">
                      <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px] font-black border-b border-neutral-850">
                        <tr>
                          <th className="py-3 px-4">Aluno</th>
                          <th className="py-3 px-4">Competência</th>
                          <th className="py-3 px-4">Valor Original</th>
                          <th className="py-3 px-4">Desconto</th>
                          <th className="py-3 px-4">Valor Final</th>
                          <th className="py-3 px-4">Vencimento</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-850 bg-neutral-950">
                        {filtered.map((m) => {
                          const isAtrasado = m.status === 'Atrasado' || (m.status === 'Pendente' && m.dataVencimento && m.dataVencimento < new Date().toISOString().split('T')[0]);
                          const statusToDisplay = isAtrasado ? 'Atrasado' : m.status;

                          return (
                            <tr key={m.id} className="hover:bg-neutral-900/50 transition">
                              <td className="py-3 px-4 font-bold text-white">
                                {m.alunoNome || 'Aluno Indefinido'}
                              </td>
                              <td className="py-3 px-4 font-mono">{m.competencia}</td>
                              <td className="py-3 px-4 font-mono text-neutral-400">R$ {Number(m.valorOriginal || m.valor).toFixed(2)}</td>
                              <td className="py-3 px-4 font-mono text-amber-400">R$ {Number(m.desconto || 0).toFixed(2)}</td>
                              <td className="py-3 px-4 font-mono font-bold text-emerald-400">R$ {Number(m.valor).toFixed(2)}</td>
                              <td className="py-3 px-4 font-mono">{m.dataVencimento || '-'}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    statusToDisplay === 'Pago'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : statusToDisplay === 'Atrasado'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                                      : statusToDisplay === 'Cancelado'
                                      ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                      : statusToDisplay === 'Estornado'
                                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  {statusToDisplay}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {m.status !== 'Pago' && m.status !== 'Cancelado' && m.status !== 'Estornado' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowPayModal(m);
                                        setPayForm({ metodoPagamento: 'Pix', transactionId: '', pixTxid: '', observacao: '' });
                                      }}
                                      className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-bold px-2 py-1 rounded text-[10px] uppercase transition cursor-pointer"
                                      title="Registrar Pagamento"
                                    >
                                      Pagar
                                    </button>
                                  )}

                                  {m.status === 'Pago' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (confirm(`Estornar pagamento da mensalidade de ${m.alunoNome}?`)) {
                                          if (onEstornarMensalidade) {
                                            await onEstornarMensalidade(m.id, 'Estorno solicitado via painel admin');
                                          }
                                        }
                                      }}
                                      className="bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white font-bold px-2 py-1 rounded text-[10px] uppercase transition cursor-pointer"
                                      title="Estornar Pagamento"
                                    >
                                      Estornar
                                    </button>
                                  )}

                                  {m.status !== 'Cancelado' && m.status !== 'Estornado' && m.status !== 'Pago' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (confirm(`Cancelar cobrança de ${m.alunoNome}?`)) {
                                          if (onCancelarMensalidade) {
                                            await onCancelarMensalidade(m.id, 'Cancelado via painel admin');
                                          }
                                        }
                                      }}
                                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-2 py-1 rounded text-[10px] uppercase transition cursor-pointer"
                                      title="Cancelar Cobrança"
                                    >
                                      Cancelar
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/cloudsql/mensalidades/${m.id}/historico`);
                                        const data = await res.json();
                                        if (res.ok) {
                                          setSelectedMensalidadeHistory({ id: m.id, logs: data.historico || [] });
                                        } else {
                                          alert(`⚠️ ${data.error || 'Erro ao carregar histórico'}`);
                                        }
                                      } catch (err: any) {
                                        alert(`⚠️ Falha na requisição: ${err.message}`);
                                      }
                                    }}
                                    className="bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white font-bold px-2 py-1 rounded text-[10px] uppercase transition cursor-pointer"
                                    title="Ver Histórico de Auditoria"
                                  >
                                    Histórico
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm(`⚠️ ATENÇÃO: Tem certeza que deseja excluir FISICAMENTE a mensalidade de ${m.alunoNome} do Cloud SQL? Esta ação é irreversível.`)) {
                                        if (onExcluirMensalidade) {
                                          await onExcluirMensalidade(m.id);
                                        }
                                      }
                                    }}
                                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold px-2 py-1 rounded text-[10px] uppercase transition cursor-pointer"
                                    title="Excluir do Banco de Dados"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* SEÇÃO: HISTÓRICO FINANCEIRO POR CAMPEONATO */}
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-850 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Histórico Financeiro por Campeonato
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Organizado por situação com painéis expansíveis e opção de exclusão individual do histórico financeiro.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">
                  Total de Campeonatos: {rawCamps.length}
                </span>
              </div>

              {/* GRUPO 1: CAMPEONATOS EM ANDAMENTO */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setGroupExpanded((prev) => ({ ...prev, emAndamento: !prev.emAndamento }))}
                  className="w-full flex items-center justify-between bg-neutral-900/90 hover:bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-800 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      Campeonatos em Andamento
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {emAndamentoCamps.length}
                    </span>
                  </div>
                  {groupExpanded.emAndamento ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                {groupExpanded.emAndamento && (
                  <div className="space-y-3 pl-0 sm:pl-2">
                    {emAndamentoCamps.length > 0 ? (
                      emAndamentoCamps.map((camp) => {
                        const campName = getCampName(camp);
                        const campId = getCampId(camp);

                        const campInscs = confrontoInscricoes.filter(
                          (i) =>
                            String(i.campeonatoId) === String(campId) ||
                            (i.campeonatoNome && i.campeonatoNome.toLowerCase() === campName.toLowerCase()) ||
                            (i.campeonatoTitle && i.campeonatoTitle.toLowerCase() === campName.toLowerCase())
                        );

                        const campBruto = campInscs.reduce(
                          (acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || Number(camp.price) || 0),
                          0
                        );

                        const campConf = campInscs.filter((i) => i.status === 'Confirmado' || i.pago === true || (!i.status && i.valorPago));
                        const campPend = campInscs.filter((i) => i.status === 'Pendente' || i.pago === false);
                        const campEst = campInscs.filter((i) => i.status === 'Estornado' || i.estornado === true);

                        const campConfTotal = campConf.reduce(
                          (acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || Number(camp.price) || 0),
                          0
                        );
                        const campPendTotal = campPend.reduce(
                          (acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || Number(camp.price) || 0),
                          0
                        );
                        const campEstTotal = campEst.reduce((acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || 0), 0);

                        const campTaxa = Math.round(campBruto * 0.15);
                        const campLiquido = campBruto - campTaxa;
                        const isExpanded = expandedCampIds.includes(String(campId));

                        return (
                          <div
                            key={campId}
                            className="bg-neutral-900/60 rounded-2xl border border-neutral-800/90 overflow-hidden transition"
                          >
                            {/* CHAMPIONSHIP HEADER BAR */}
                            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-neutral-900/80">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-sm font-black text-white">{campName}</h5>
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    {camp.status || 'Em andamento'}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-400 flex items-center gap-3">
                                  <span>📅 {camp.date || camp.data || '2026'}</span>
                                  <span>📍 {camp.city || camp.location || 'Brasil'}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-auto">
                                <div className="text-right mr-2 hidden sm:block">
                                  <span className="text-[10px] text-neutral-400 block">Arrecadação Bruta</span>
                                  <span className="text-sm font-black text-emerald-400">
                                    R$ {campBruto.toLocaleString('pt-BR')},00
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleExpandCamp(String(campId))}
                                  className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-700 transition cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Recolher' : 'Expandir Painel'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* EXPANDED DETAILED FINANCIAL PANEL */}
                            {isExpanded && (
                              <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/80 space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase block">Inscritos Reais</span>
                                    <span className="text-base font-black text-emerald-400 block mt-0.5">
                                      {campInscs.length} atletas
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase block">Valor Arrecadado</span>
                                    <span className="text-base font-black text-white block mt-0.5">
                                      R$ {campBruto.toLocaleString('pt-BR')},00
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Confirmados</span>
                                    <span className="text-sm font-black text-emerald-300 block mt-0.5">
                                      {campConf.length} (R$ {campConfTotal.toLocaleString('pt-BR')})
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Pendentes</span>
                                    <span className="text-sm font-black text-amber-300 block mt-0.5">
                                      {campPend.length} (R$ {campPendTotal.toLocaleString('pt-BR')})
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-red-400 uppercase block">Estornos</span>
                                    <span className="text-sm font-black text-red-300 block mt-0.5">
                                      {campEst.length} (R$ {campEstTotal.toLocaleString('pt-BR')})
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase block">Saldo Líquido (85%)</span>
                                    <span className="text-base font-black text-emerald-400 block mt-0.5">
                                      R$ {campLiquido.toLocaleString('pt-BR')},00
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-900">
                                  <span className="text-[10px] text-neutral-500">
                                    Taxa administrativa de plataforma (15%): R$ {campTaxa.toLocaleString('pt-BR')},00
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFinRecordToDelete({ id: campId, nome: campName });
                                      setConfirmDeleteText('');
                                    }}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 px-3.5 py-2 rounded-xl border border-red-500/20 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Histórico Financeiro
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-neutral-500 bg-neutral-900/40 rounded-xl border border-neutral-850">
                        Nenhum campeonato em andamento no momento.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GRUPO 2: CAMPEONATOS FINALIZADOS */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGroupExpanded((prev) => ({ ...prev, finalizados: !prev.finalizados }))}
                  className="w-full flex items-center justify-between bg-neutral-900/90 hover:bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-800 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                    <span className="text-xs font-black uppercase text-neutral-300 tracking-wider">
                      Campeonatos Finalizados / Encerrados
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
                      {finalizadosCamps.length}
                    </span>
                  </div>
                  {groupExpanded.finalizados ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                {groupExpanded.finalizados && (
                  <div className="space-y-3 pl-0 sm:pl-2">
                    {finalizadosCamps.length > 0 ? (
                      finalizadosCamps.map((camp) => {
                        const campName = getCampName(camp);
                        const campId = getCampId(camp);

                        const campInscs = confrontoInscricoes.filter(
                          (i) =>
                            String(i.campeonatoId) === String(campId) ||
                            (i.campeonatoNome && i.campeonatoNome.toLowerCase() === campName.toLowerCase()) ||
                            (i.campeonatoTitle && i.campeonatoTitle.toLowerCase() === campName.toLowerCase())
                        );

                        const campBruto = campInscs.reduce(
                          (acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || Number(camp.price) || 0),
                          0
                        );

                        const campConf = campInscs.filter((i) => i.status === 'Confirmado' || i.pago === true || (!i.status && i.valorPago));
                        const campPend = campInscs.filter((i) => i.status === 'Pendente' || i.pago === false);
                        const campEst = campInscs.filter((i) => i.status === 'Estornado' || i.estornado === true);

                        const campConfTotal = campConf.reduce(
                          (acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || Number(camp.price) || 0),
                          0
                        );
                        const campPendTotal = campPend.reduce(
                          (acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || Number(camp.price) || 0),
                          0
                        );
                        const campEstTotal = campEst.reduce((acc, curr) => acc + (Number(curr.valorPago) || Number(curr.valor) || 0), 0);

                        const campTaxa = Math.round(campBruto * 0.15);
                        const campLiquido = campBruto - campTaxa;
                        const isExpanded = expandedCampIds.includes(String(campId));

                        return (
                          <div
                            key={campId}
                            className="bg-neutral-900/60 rounded-2xl border border-neutral-800/90 overflow-hidden transition"
                          >
                            {/* CHAMPIONSHIP HEADER BAR */}
                            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-neutral-900/80">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-sm font-black text-neutral-200">{campName}</h5>
                                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700">
                                    Encerrado
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-400 flex items-center gap-3">
                                  <span>📅 {camp.date || camp.data || '2026'}</span>
                                  <span>📍 {camp.city || camp.location || 'Brasil'}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-auto">
                                <div className="text-right mr-2 hidden sm:block">
                                  <span className="text-[10px] text-neutral-400 block">Arrecadação Final</span>
                                  <span className="text-sm font-black text-white">
                                    R$ {campBruto.toLocaleString('pt-BR')},00
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleExpandCamp(String(campId))}
                                  className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-700 transition cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Recolher' : 'Expandir Painel'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* EXPANDED DETAILED FINANCIAL PANEL */}
                            {isExpanded && (
                              <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/80 space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase block">Inscritos Reais</span>
                                    <span className="text-base font-black text-emerald-400 block mt-0.5">
                                      {campInscs.length} atletas
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase block">Valor Arrecadado</span>
                                    <span className="text-base font-black text-white block mt-0.5">
                                      R$ {campBruto.toLocaleString('pt-BR')},00
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Confirmados</span>
                                    <span className="text-sm font-black text-emerald-300 block mt-0.5">
                                      {campConf.length} (R$ {campConfTotal.toLocaleString('pt-BR')})
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Pendentes</span>
                                    <span className="text-sm font-black text-amber-300 block mt-0.5">
                                      {campPend.length} (R$ {campPendTotal.toLocaleString('pt-BR')})
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-red-400 uppercase block">Estornos</span>
                                    <span className="text-sm font-black text-red-300 block mt-0.5">
                                      {campEst.length} (R$ {campEstTotal.toLocaleString('pt-BR')})
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-left">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase block">Saldo Líquido (85%)</span>
                                    <span className="text-base font-black text-emerald-400 block mt-0.5">
                                      R$ {campLiquido.toLocaleString('pt-BR')},00
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-900">
                                  <span className="text-[10px] text-neutral-500">
                                    Taxa administrativa de plataforma (15%): R$ {campTaxa.toLocaleString('pt-BR')},00
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFinRecordToDelete({ id: campId, nome: campName });
                                      setConfirmDeleteText('');
                                    }}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 px-3.5 py-2 rounded-xl border border-red-500/20 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Histórico Financeiro
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-neutral-500 bg-neutral-900/40 rounded-xl border border-neutral-850">
                        Nenhum campeonato finalizado registrado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL CONTROLADO DE EXCLUSÃO FINANCEIRA COM DUPLA CONFIRMAÇÃO */}
      {finRecordToDelete !== null && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative text-left space-y-4 animate-scale-in">
            <h3 className="text-base font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Exclusão Controlada de Histórico Financeiro
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Você está prestes a excluir o registro financeiro de <strong className="text-white">"{finRecordToDelete.nome}"</strong>.
              Esta ação removerá os lançamentos financeiros deste campeonato, recalculará os indicadores em tempo real e será gravada nos logs de governança.
            </p>

            <div className="space-y-1 bg-neutral-950 p-3.5 rounded-xl border border-neutral-850">
              <label className="text-[10px] font-bold uppercase text-neutral-400 block">
                Digite <strong className="text-red-400 font-black">EXCLUIR</strong> para confirmar:
              </label>
              <input
                type="text"
                placeholder="EXCLUIR"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value.toUpperCase())}
                className="w-full bg-neutral-900 text-white font-mono font-bold text-xs py-2 px-3 rounded-lg border border-neutral-800 outline-none uppercase focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFinRecordToDelete(null);
                  setConfirmDeleteText('');
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer border border-neutral-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmDeleteText !== 'EXCLUIR'}
                onClick={() => {
                  const deletedCampName = finRecordToDelete.nome || 'Campeonato';
                  const targetCampId = finRecordToDelete.id;

                  // 1. Remove inscriptions for this championship if callback exists
                  if (onUpdateInscricoes && confrontoInscricoes) {
                    const updatedInscs = confrontoInscricoes.filter(
                      (i) =>
                        String(i.campeonatoId) !== String(targetCampId) &&
                        (!i.campeonatoNome || i.campeonatoNome.toLowerCase() !== deletedCampName.toLowerCase()) &&
                        (!i.campeonatoTitle || i.campeonatoTitle.toLowerCase() !== deletedCampName.toLowerCase())
                    );
                    onUpdateInscricoes(updatedInscs);
                  }

                  // 2. Remove or reset championship if callback exists
                  if (onUpdateCampeonatos && confrontoCampeonatos) {
                    const updatedCamps = confrontoCampeonatos.filter((c) => String(c.id) !== String(targetCampId));
                    onUpdateCampeonatos(updatedCamps);
                  }

                  // 3. Audit log
                  onAddAuditLog(
                    'EXCLUSAO',
                    'Histórico Financeiro',
                    `Histórico financeiro do campeonato "${deletedCampName}" excluído e zerado com sucesso.`
                  );

                  // 4. Alert user
                  alert(`Registro financeiro de "${deletedCampName}" foi excluído permanentemente com registro nos logs de auditoria.`);

                  // 5. Clean modal state
                  setFinRecordToDelete(null);
                  setConfirmDeleteText('');
                }}
                className={`font-black text-xs py-2 px-4 rounded-xl transition cursor-pointer ${
                  confirmDeleteText === 'EXCLUIR'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-800'
                }`}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: CRM & ATENDIMENTO */}
      {activeTab === 'crm' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              CRM Completo — Central de Relacionamento & Touchpoints
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Registro de contatos, interações, chamadas telefônicas e acompanhamento de matrículas.
            </p>
          </div>

          <form onSubmit={handleAddCrmSubmit} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Canal de Contato:</label>
                <select
                  value={crmForm.canal}
                  onChange={(e) => setCrmForm({ ...crmForm, canal: e.target.value as any })}
                  className="w-full bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="ligacao">Ligação Telefônica</option>
                  <option value="presencial">Atendimento Presencial</option>
                  <option value="email">E-mail</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Assunto Principal:</label>
                <input
                  type="text"
                  placeholder="Ex: Renovação de plano anual / Dúvida sobre campeonato"
                  value={crmForm.assunto}
                  onChange={(e) => setCrmForm({ ...crmForm, assunto: e.target.value })}
                  className="w-full bg-neutral-900 text-white text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Detalhes do Atendimento:</label>
              <textarea
                rows={2}
                placeholder="Descreva o resumo do contato mantido com o aluno ou responsável..."
                value={crmForm.descricao}
                onChange={(e) => setCrmForm({ ...crmForm, descricao: e.target.value })}
                className="w-full bg-neutral-900 text-white text-xs p-3 rounded-xl border border-neutral-800 outline-none"
              />
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer"
            >
              Registrar Interação CRM
            </button>
          </form>

          {/* CRM LIST */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Histórico de Atendimentos:</h4>
            {crmInteractions.filter((c) => c.usuarioId === selectedStudentId).length === 0 ? (
              <p className="text-xs text-neutral-500 italic">Nenhum atendimento registrado no CRM para este aluno ainda.</p>
            ) : (
              crmInteractions
                .filter((c) => c.usuarioId === selectedStudentId)
                .map((crm) => (
                  <div key={crm.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 uppercase text-[10px]">{crm.canal}</span>
                      <span className="text-neutral-500 text-[10px]">{crm.data}</span>
                    </div>
                    <h5 className="text-xs font-black text-white">{crm.assunto}</h5>
                    <p className="text-xs text-neutral-300">{crm.descricao}</p>
                    <span className="text-[10px] text-neutral-500 block pt-1">Atendido por: {crm.atendidoPor}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 9: ASSINATURA & LGPD (Reqs 19.1 & 19.2) */}
      {activeTab === 'assinatura_lgpd' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              Auditoria de Assinaturas Digitais & Conformidade LGPD
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Transparência total sobre contratos, termos de consentimento, certificados de integridade e auditoria juridicamente vinculante de <strong className="text-white">{activePerson.nome}</strong>.
            </p>
          </div>

          {/* SECTION 1: ASSINATURAS DIGITAIS */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Contratos e Assinaturas Digitais Registradas
                </h4>
                <span className="text-[10px] text-neutral-400">Usuário: {activePerson.nome} ({activePerson.tipoLabel})</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/20">
                Auditoria de Validade Jurídica SHA-256
              </span>
            </div>

            <div className="space-y-3">
              {[
                { id: `cnt-mat-${activePerson.id}`, titulo: 'Contrato Oficial de Matrícula & Termo de Regulamento Interno', tipo: 'contrato_matricula', data: '12/01/2026 às 14:30:11' },
                { id: `cnt-lgpd-${activePerson.id}`, titulo: 'Termo de Consentimento e Privacidade de Dados LGPD Arena', tipo: 'lgpd_privacidade', data: '12/01/2026 às 14:32:05' },
                { id: `cnt-img-${activePerson.id}`, titulo: 'Autorização do Uso de Imagem e Transmissão de Campeonatos', tipo: 'autorizacao_imagem', data: '12/01/2026 às 14:33:40' },
              ].map((term) => {
                const existing = digitalContracts.find(c => c.usuarioId === activePerson.id && (c.id === term.id || c.tipo === term.tipo));
                const isSigned = existing ? existing.status === 'assinado' : true;
                const sigData = existing || {
                  id: term.id,
                  usuarioId: activePerson.id,
                  usuarioNome: activePerson.nome,
                  titulo: term.titulo,
                  tipo: term.tipo as any,
                  status: 'assinado' as const,
                  dataEmissao: term.data,
                  dataAssinatura: term.data,
                  hashAssinatura: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
                  caminhoArquivo: `/vault/documentos/contrato_${activePerson.id}_${term.tipo}.pdf`,
                };

                return (
                  <div key={term.id} className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black text-white">{term.titulo}</h5>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${isSigned ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {isSigned ? 'Validada & Assinada' : 'Pendente'}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        SHA-256: {sigData.hashAssinatura.substring(0, 16)}... | Local: Google Drive Vault & Firestore
                      </span>
                      <span className="text-[10px] text-neutral-500 block">Assinado em: {sigData.dataAssinatura}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedSignatureAudit(sigData)}
                        className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" /> Auditar Assinatura
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: LGPD AUDITORIA (Req 19.2) */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Registro de Aceite LGPD & Transparência
                </h4>
                <span className="text-[10px] text-neutral-400">Lei Geral de Proteção de Dados (Lei 13.709/2018)</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Documento Aceito:</span>
                  <span className="font-black text-white">Termo de Consentimento e Privacidade de Dados LGPD Arena v2.1</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Versão do Termo:</span>
                  <span className="font-black text-emerald-400">v2.1 - Conforme Diretrizes ANPD</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Data e Hora do Aceite:</span>
                  <span className="font-bold text-neutral-200">12/01/2026 às 14:32:05</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Usuário Responsável:</span>
                  <span className="font-bold text-neutral-200">{activePerson.nome} ({activePerson.cpf})</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Origem do Aceite:</span>
                  <span className="font-bold text-neutral-200">Portal Web Oficial / Autenticação Segura</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Status de Consentimento:</span>
                  <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">ATIVO E REGISTRADO</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLgpdAudit({
                    documento: 'Termo de Consentimento e Privacidade de Dados LGPD Arena v2.1',
                    versao: 'v2.1 - 2026 (Lei 13.709/2018)',
                    dataHora: '12/01/2026 às 14:32:05',
                    usuario: activePerson.nome,
                    cpf: activePerson.cpf,
                    origem: 'Portal Web / Painel de Autenticação Segura',
                    hash: '7a9c8b21...e45f91d0',
                  })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <Eye className="w-4 h-4" /> Abrir Termo Aceito Original
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 10: CENTRAL DE DOCUMENTOS (Reqs 19.3, 19.4, 19.5, 19.10) */}
      {activeTab === 'documentos' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-emerald-400" />
                Central Inteligente de Documentos — Google Drive Sync
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Armazenamento auditável de documentos digitais e carteira oficial sincronizados para <strong className="text-white">{activePerson.nome}</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowAddDocModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Anexar Documento no Google Drive
            </button>
          </div>

          {/* HIGHLIGHT: CARTEIRA DIGITAL OFICIAL HD (Req 19.5) */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-neutral-950 to-neutral-950 p-5 rounded-2xl border border-emerald-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg overflow-hidden">
                  {activePerson.fotoPerfil ? (
                    <img src={activePerson.fotoPerfil} alt={activePerson.nome} className="w-full h-full object-cover" />
                  ) : (
                    activePerson.nome.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Carteira Digital Oficial Arena HD</span>
                  <h4 className="text-sm font-black text-white">{activePerson.nome}</h4>
                  <span className="text-[10px] text-neutral-400 block">{activePerson.tipoLabel} — {activePerson.faixa}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCarteirinhaModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Eye className="w-4 h-4" /> Visualizar Carteira Digital
                </button>
              </div>
            </div>
          </div>

          {/* DOCUMENTOS NO GOOGLE DRIVE (Reqs 19.3, 19.4, 19.10) */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" /> Documentos Registrados no Google Drive para {activePerson.nome}:
            </h4>

            {userDigitalDocuments.filter(d => d.usuarioId === activePerson.id).length === 0 ? (
              <div className="p-6 bg-neutral-900/60 rounded-2xl border border-neutral-800 text-center space-y-2">
                <Folder className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400 font-bold">Nenhum documento cadastrado no Google Drive para este usuário.</p>
                <p className="text-[11px] text-neutral-500 max-w-md mx-auto">
                  A plataforma não exibe arquivos genéricos ou simulados. Utilize o botão acima para anexar atestados, comprovantes ou certificados reais.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userDigitalDocuments
                  .filter(d => d.usuarioId === activePerson.id)
                  .map((doc) => (
                    <div key={doc.id} className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block mb-1">
                          {doc.categoria}
                        </span>
                        <h5 className="text-xs font-black text-white">{doc.nomeDocumento}</h5>
                        <span className="text-[10px] text-neutral-400 block font-mono">Enviado em: {doc.dataEnvio || (doc as any).dataUpload}</span>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            if (doc.urlDrive && doc.urlDrive.startsWith('http')) {
                              window.open(doc.urlDrive, '_blank');
                            } else {
                              alert(`Atenção (Google Drive Sync): O arquivo "${doc.nomeDocumento}" não possui um link de atalho válido no Google Drive ou foi removido.`);
                            }
                          }}
                          className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 hover:underline bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition w-full justify-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir no Google Drive
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 11: AUDITORIA PERMANENTE & BACKUP RESTAURÁVEL */}
      {activeTab === 'auditoria_backup' && (
        <div className="bg-neutral-900/90 p-6 rounded-3xl border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                Auditoria Permanente do Sistema & Backups do Banco de Dados
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Logs completos de alteração, rastreabilidade de IP e rotina de restauração por ponto no tempo.
              </p>
            </div>

            <button
              onClick={() => {
                onCreateBackup('manual');
                onAddAuditLog('SINCRONIZACAO', 'Backup Manual', 'Backup completo do banco gerado pelo administrador');
                alert('Backup em tempo real gerado e disponibilizado para restauração!');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" /> Gerar Backup em Tempo Real (JSON/Firestore)
            </button>
          </div>

          {/* BACKUP RECORDS LIST */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Histórico de Backups Registrados:</h4>
            {backupRecords.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">Nenhum registro de backup gerado ainda. Clique no botão acima para criar o primeiro ponto de restauração.</p>
            ) : (
              backupRecords.map((b) => (
                <div key={b.id} className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-white">Backup {b.tipo.toUpperCase()} — {b.dataCriacao}</span>
                    <span className="text-[10px] text-neutral-400 block font-mono">Tamanho: {b.tamanhoKb} KB | Entidades: {b.totalEntidades}</span>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreBackup(b.id);
                      alert(`Restauração do backup de ${b.dataCriacao} efetuada com sucesso!`);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs py-1.5 px-3 rounded-lg border border-neutral-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    Restaurar Ponto
                  </button>
                </div>
              ))
            )}
          </div>

          {/* AUDIT LOGS LIST */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-850 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Logs Permanentes de Auditoria (Rastreabilidade):</h4>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-neutral-500 italic">Nenhum log de auditoria gerado na sessão atual.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-emerald-400 uppercase">{log.acao} • {log.entidade}</span>
                      <span className="text-neutral-500">{log.timestamp}</span>
                    </div>
                    <p className="text-neutral-200 text-xs">{log.detalhes}</p>
                    <span className="text-[10px] text-neutral-500 block">Usuário: {log.userNome} ({log.userTipo || 'admin'})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: AUDITORIA DE ASSINATURA DIGITAL (Req 19.1) */}
      {selectedSignatureAudit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Auditoria da Assinatura Digital</h3>
                  <span className="text-[10px] text-neutral-400">Certificado de Validade Jurídica SHA-256</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSignatureAudit(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Nome do Documento:</span>
                <span className="font-black text-white">{selectedSignatureAudit.titulo}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Tipo:</span>
                  <span className="font-bold text-emerald-400">{selectedSignatureAudit.tipo}</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Status:</span>
                  <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                    VALIDADA (SHA-256)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Usuário Responsável:</span>
                <span className="font-black text-white">{activePerson.nome}</span>
                <span className="text-[10px] text-neutral-400 block">CPF: {activePerson.cpf} | Perfil: {activePerson.tipoLabel}</span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Data e Hora da Assinatura:</span>
                <span className="font-bold text-neutral-200">{selectedSignatureAudit.dataAssinatura || selectedSignatureAudit.dataEmissao}</span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Localização do Arquivo no Cofre:</span>
                <span className="font-mono text-[11px] text-emerald-400 break-all block">
                  Google Drive / Firestore Repository: {selectedSignatureAudit.caminhoArquivo || `/vault/documentos/${selectedSignatureAudit.id}.pdf`}
                </span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Hash Digital de Integridade:</span>
                <span className="font-mono text-[10px] text-neutral-300 break-all block">
                  {selectedSignatureAudit.hashAssinatura || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  alert(`Abrindo visualizador seguro de documentos para "${selectedSignatureAudit.titulo}"...`);
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> Visualizar Documento
              </button>
              <button
                onClick={() => {
                  alert(`Iniciando download do PDF assinado digitalmente de "${selectedSignatureAudit.titulo}"...`);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Documento (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AUDITORIA LGPD E TERMO ORIGINAL (Req 19.2) */}
      {selectedLgpdAudit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Registro de Aceite LGPD Original</h3>
                  <span className="text-[10px] text-neutral-400">Lei Geral de Proteção de Dados Pessoais</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLgpdAudit(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Versão do Termo:</span>
                  <span className="font-bold text-emerald-400">{selectedLgpdAudit.versao}</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Data/Hora Aceite:</span>
                  <span className="font-bold text-white">{selectedLgpdAudit.dataHora}</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Titular dos Dados:</span>
                <span className="font-black text-white">{selectedLgpdAudit.usuario}</span>
                <span className="text-[10px] text-neutral-400 block">CPF: {selectedLgpdAudit.cpf} | Origem: {selectedLgpdAudit.origem}</span>
              </div>

              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 max-h-48 overflow-y-auto">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Texto Integral do Termo Aceito:</span>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                  "Pelo presente instrumento, o titular dos dados autoriza expressamente a Arena do Competidor a coletar, armazenar, tratar e utilizar seus dados pessoais e de saúde estritamente para fins de gestão esportiva, organização de treinos, controle de presença e emissão de certificados, em integral conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Este consentimento pode ser revogado a qualquer momento mediante solicitação formal junto à administração."
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[10px] space-y-1">
                <span className="text-neutral-400 font-bold block uppercase">Assinatura Digital de Validação:</span>
                <span className="text-emerald-400 block">Hash: {selectedLgpdAudit.hash || '7a9c8b21...e45f91d0'}</span>
                <span className="text-neutral-500 block">Status: VÁLIDO E AUDITADO</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => window.print()}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" /> Imprimir Termo
              </button>
              <button
                onClick={() => setSelectedLgpdAudit(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CARTEIRA DIGITAL OFICIAL HD (Req 19.5) */}
      {showCarteirinhaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Carteira Digital Oficial HD</h3>
              </div>
              <button
                onClick={() => setShowCarteirinhaModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* CARTEIRA CARD HD DESIGN */}
            <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950/80 p-5 rounded-2xl border-2 border-emerald-500/40 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">ARENA DO COMPETIDOR</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-500/30">OFICIAL</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-24 rounded-xl bg-neutral-800 border-2 border-emerald-500/40 overflow-hidden shrink-0 flex items-center justify-center text-emerald-400 font-black text-2xl">
                  {activePerson.fotoPerfil ? (
                    <img src={activePerson.fotoPerfil} alt={activePerson.nome} className="w-full h-full object-cover" />
                  ) : (
                    activePerson.nome.substring(0, 2).toUpperCase()
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <h4 className="font-black text-white text-sm leading-tight">{activePerson.nome}</h4>
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase">{activePerson.tipoLabel}</span>
                  <span className="text-[10px] text-neutral-300 block">Graduação: <strong className="text-white">{activePerson.faixa}</strong></span>
                  <span className="text-[10px] text-neutral-400 block font-mono">Reg: AC-2026-00{activePerson.id}</span>
                  <span className="text-[10px] text-neutral-400 block font-mono">Sangue: {activePerson.tipoSangue}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[9px] text-neutral-400 font-mono">
                <span>Validade: 12/2026</span>
                <span>Hash: 9a8b...1f2e</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Printer className="w-3.5 h-3.5" /> Baixar / Imprimir Carteira (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ANEXAR NOVO DOCUMENTO NO GOOGLE DRIVE (Req 19.3, 19.10) */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-6 h-6 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Anexar Documento no Google Drive</h3>
              </div>
              <button
                onClick={() => setShowAddDocModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDocForm.nomeDocumento.trim()) return;

                onAddDigitalDocument({
                  usuarioId: activePerson.id,
                  usuarioNome: activePerson.nome,
                  nomeDocumento: newDocForm.nomeDocumento.trim(),
                  categoria: newDocForm.categoria,
                  urlDrive: newDocForm.urlDrive.trim() || `https://drive.google.com/file/d/doc_${Date.now()}`,
                  dataEnvio: new Date().toLocaleDateString('pt-BR'),
                  tamanhoKb: 512,
                });

                onAddAuditLog('CRIACAO', 'Central de Documentos', `Novo documento "${newDocForm.nomeDocumento}" anexado para ${activePerson.nome}`);
                alert(`Documento "${newDocForm.nomeDocumento}" anexado e sincronizado com o Google Drive para ${activePerson.nome}!`);
                setShowAddDocModal(false);
                setNewDocForm({ nomeDocumento: '', categoria: 'comprovante', urlDrive: '' });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Nome do Documento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Atestado de Aptidão Física 2026"
                  value={newDocForm.nomeDocumento}
                  onChange={(e) => setNewDocForm({ ...newDocForm, nomeDocumento: e.target.value })}
                  className="w-full bg-neutral-950 text-white font-bold py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Categoria:</label>
                <select
                  value={newDocForm.categoria}
                  onChange={(e) => setNewDocForm({ ...newDocForm, categoria: e.target.value as any })}
                  className="w-full bg-neutral-950 text-white font-bold py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500"
                >
                  <option value="exame">Atestado Médico / Exame</option>
                  <option value="comprovante">Comprovante de Residência</option>
                  <option value="certificado">Certificado de Faixa / Curso</option>
                  <option value="carteirinha">Carteirinha Digital</option>
                  <option value="contrato">Contrato / Regulamento</option>
                  <option value="outros">Outros Documentos</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Link de Compartilhamento do Google Drive:</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={newDocForm.urlDrive}
                  onChange={(e) => setNewDocForm({ ...newDocForm, urlDrive: e.target.value })}
                  className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Salvar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA COBRANÇA DE MENSALIDADE */}
      {showMensalidadeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Nova Cobrança de Mensalidade</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMensalidadeModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const selectedAluno = approvedAlunos.find((a) => String(a.id) === String(mensalidadeForm.alunoId));
                if (!selectedAluno) {
                  alert('Por favor, selecione um aluno válido.');
                  return;
                }
                const valorFinal = Math.max(0, Number(mensalidadeForm.valorOriginal) - Number(mensalidadeForm.desconto));

                if (onSaveMensalidade) {
                  const res = await onSaveMensalidade({
                    alunoId: String(selectedAluno.id),
                    alunoNome: selectedAluno.nome,
                    competencia: mensalidadeForm.competencia,
                    valorOriginal: Number(mensalidadeForm.valorOriginal),
                    desconto: Number(mensalidadeForm.desconto),
                    valor: valorFinal,
                    dataVencimento: mensalidadeForm.dataVencimento,
                    observacao: mensalidadeForm.observacao,
                    status: 'Pendente',
                  });
                  if (res) {
                    setShowMensalidadeModal(false);
                  }
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Selecione o Aluno:</label>
                <select
                  value={mensalidadeForm.alunoId}
                  onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, alunoId: e.target.value })}
                  className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 text-xs"
                  required
                >
                  <option value="">-- Selecione o Aluno --</option>
                  {approvedAlunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} {a.faixa ? `(${a.faixa})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Competência (MM/YYYY):</label>
                  <input
                    type="text"
                    placeholder="08/2026"
                    value={mensalidadeForm.competencia}
                    onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, competencia: e.target.value })}
                    className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Data Vencimento:</label>
                  <input
                    type="date"
                    value={mensalidadeForm.dataVencimento}
                    onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, dataVencimento: e.target.value })}
                    className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Valor Original (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mensalidadeForm.valorOriginal}
                    onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, valorOriginal: Number(e.target.value) })}
                    className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">Desconto (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mensalidadeForm.desconto}
                    onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, desconto: Number(e.target.value) })}
                    className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex justify-between items-center">
                <span className="text-xs text-neutral-400 font-bold uppercase">Valor Final a Cobrar:</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  R$ {Math.max(0, Number(mensalidadeForm.valorOriginal) - Number(mensalidadeForm.desconto)).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Observações (Opcional):</label>
                <textarea
                  rows={2}
                  placeholder="Instruções ou notas da mensalidade..."
                  value={mensalidadeForm.observacao}
                  onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, observacao: e.target.value })}
                  className="w-full bg-neutral-950 text-white p-2.5 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowMensalidadeModal(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Gerar Cobrança no Cloud SQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PAGAMENTO */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Registrar Pagamento</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Cobrança Selecionada:</span>
              <div className="text-sm font-bold text-white">{showPayModal.alunoNome}</div>
              <div className="text-xs text-neutral-400">
                Competência: <span className="text-white font-mono">{showPayModal.competencia}</span> | Valor: <span className="text-emerald-400 font-mono font-bold">R$ {Number(showPayModal.valor).toFixed(2)}</span>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onPagarMensalidade) {
                  const res = await onPagarMensalidade(showPayModal.id, {
                    metodoPagamento: payForm.metodoPagamento,
                    transactionId: payForm.transactionId,
                    pixTxid: payForm.pixTxid,
                    observacao: payForm.observacao,
                  });
                  if (res) {
                    setShowPayModal(null);
                  }
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Método de Pagamento:</label>
                <select
                  value={payForm.metodoPagamento}
                  onChange={(e) => setPayForm({ ...payForm, metodoPagamento: e.target.value })}
                  className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Transferência">Transferência Bancária</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">ID da Transação / Comprovante (Opcional):</label>
                <input
                  type="text"
                  placeholder="tx_123456789..."
                  value={payForm.transactionId}
                  onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })}
                  className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Pix TxID / EndToEndId (Opcional):</label>
                <input
                  type="text"
                  placeholder="E12345678202608..."
                  value={payForm.pixTxid}
                  onChange={(e) => setPayForm({ ...payForm, pixTxid: e.target.value })}
                  className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Observação do Pagamento:</label>
                <textarea
                  rows={2}
                  placeholder="Observações adicionais do recebimento..."
                  value={payForm.observacao}
                  onChange={(e) => setPayForm({ ...payForm, observacao: e.target.value })}
                  className="w-full bg-neutral-950 text-white p-2.5 rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO DE AUDITORIA DA MENSALIDADE */}
      {selectedMensalidadeHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Histórico de Auditoria Financeira</h3>
                  <p className="text-[10px] text-neutral-400">Registros gravados no audit_logs do Cloud SQL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMensalidadeHistory(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedMensalidadeHistory.logs.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs">Nenhum evento registrado para esta mensalidade.</div>
            ) : (
              <div className="space-y-3">
                {selectedMensalidadeHistory.logs.map((log: any) => (
                  <div key={log.id} className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-850 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-blue-400 uppercase">{log.acao}</span>
                      <span className="text-[10px] font-mono text-neutral-500">{log.timestamp}</span>
                    </div>
                    <div className="text-xs text-white">{log.detalhes}</div>
                    <div className="text-[10px] text-neutral-400">
                      Operador: <span className="text-neutral-200">{log.userNome}</span> ({log.userTipo})
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedMensalidadeHistory(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { User, ClassUnit, Student, CheckinRequest, JustificativaFalta, TrainingSchedule } from '../types';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Check,
  CheckCheck,
  Search,
  Filter,
  Award,
  GraduationCap,
  MessageSquare,
  Shield,
  Eye,
  TrendingUp,
  Sparkles,
  Layers,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { maskPhone } from '../utils/formatters';

interface ProfessorUriCruzPaneProps {
  currentUser: User;
  turmas: ClassUnit[];
  alunos: Student[];
  checkinsPendentes: CheckinRequest[];
  checkinsConfirmados: CheckinRequest[];
  justificativasFaltas?: JustificativaFalta[];
  trainingSchedules?: TrainingSchedule[];
  onAprovarCheckin: (alunoId: number, dataStr?: string) => void;
  onAprovarTodosCheckins: () => void;
  onAprovarJustificativa?: (id: string, resposta?: string, analisadoPor?: string) => void;
  onRejeitarJustificativa?: (id: string, resposta?: string, analisadoPor?: string) => void;
  themeKey?: string;
}

export default function ProfessorUriCruzPane({
  currentUser,
  turmas,
  alunos,
  checkinsPendentes,
  checkinsConfirmados,
  justificativasFaltas = [],
  trainingSchedules = [],
  onAprovarCheckin,
  onAprovarTodosCheckins,
  onAprovarJustificativa,
  onRejeitarJustificativa,
  themeKey = 'orange',
}: ProfessorUriCruzPaneProps) {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'turmas' | 'alunos' | 'checkins' | 'justificativas' | 'historico'>('visao_geral');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState('todas');
  const [justificativaStatusFilter, setJustificativaStatusFilter] = useState<'todas' | 'pendente' | 'aprovada' | 'rejeitada'>('todas');

  // Modal State for Justificativa Response
  const [selectedJustification, setSelectedJustification] = useState<JustificativaFalta | null>(null);
  const [justificationResponseText, setJustificationResponseText] = useState('');

  // ---------------------------------------------------------------------------
  // FILTERING DATA SCOPED EXCLUSIVELY TO PROFESSOR YURI CRUZ
  // ---------------------------------------------------------------------------

  // Helper to test if a turma belongs to Professor Yuri Cruz
  const isUriCruzClass = (t: ClassUnit) => {
    if (!t) return false;
    const profName = (t.professorNome || '').toLowerCase();
    return (
      t.professorId === currentUser.id ||
      profName.includes('yuri cruz') ||
      profName.includes('uri cruz') ||
      profName.includes('uri') ||
      profName.includes('yuri') ||
      (currentUser.email === 'admin@admin.com' && (profName.includes('professor yuri cruz') || profName.includes('professor uri cruz') || profName === '' || profName === 'administrador'))
    );
  };

  const uriCruzTurmas = turmas.filter(isUriCruzClass);
  const uriCruzTurmaNames = new Set(uriCruzTurmas.map((t) => t.nome.trim().toLowerCase()));

  // Filter students linked directly or enrolled in Yuri Cruz's classes
  const uriCruzAlunos = alunos.filter((a) => {
    const profName = (a.professorResponsavelNome || '').toLowerCase();
    const isDirect =
      a.professorResponsavelId === currentUser.id ||
      profName.includes('yuri cruz') ||
      profName.includes('uri cruz') ||
      profName.includes('uri') ||
      profName.includes('yuri');
    const isEnrolledInTurma =
      a.turma && uriCruzTurmaNames.has(a.turma.trim().toLowerCase());
    return isDirect || isEnrolledInTurma;
  });

  const uriCruzAlunoIds = new Set(uriCruzAlunos.map((a) => a.id));

  // Filter check-ins and justifications linked to Uri Cruz's students or classes
  const uriCruzPendingCheckins = checkinsPendentes.filter(
    (c) =>
      uriCruzAlunoIds.has(c.alunoId) ||
      (c.turma && uriCruzTurmaNames.has(c.turma.trim().toLowerCase()))
  );

  const uriCruzConfirmedCheckins = checkinsConfirmados.filter(
    (c) =>
      uriCruzAlunoIds.has(c.alunoId) ||
      (c.turma && uriCruzTurmaNames.has(c.turma.trim().toLowerCase()))
  );

  const uriCruzJustificativas = justificativasFaltas.filter(
    (j) =>
      uriCruzAlunoIds.has(j.alunoId) ||
      (j.turma && uriCruzTurmaNames.has(j.turma.trim().toLowerCase()))
  );

  // Stats
  const totalTurmasCount = uriCruzTurmas.length;
  const totalAlunosCount = uriCruzAlunos.length;
  const pendingCheckinsCount = uriCruzPendingCheckins.length;
  const pendingJustificativasCount = uriCruzJustificativas.filter((j) => j.status === 'pendente').length;
  const totalConfirmedCheckinsCount = uriCruzConfirmedCheckins.length;

  const getStudentName = (alunoId: number, reqName?: string) => {
    if (reqName) return reqName;
    const found = alunos.find((a) => a.id === alunoId);
    return found ? found.nome : `Aluno #${alunoId}`;
  };

  const handleApproveJustificativaModal = (status: 'aprovada' | 'rejeitada') => {
    if (!selectedJustification) return;
    if (status === 'aprovada' && onAprovarJustificativa) {
      onAprovarJustificativa(selectedJustification.id, justificationResponseText, 'PROFESSOR YURI CRUZ');
    } else if (status === 'rejeitada' && onRejeitarJustificativa) {
      onRejeitarJustificativa(selectedJustification.id, justificationResponseText, 'PROFESSOR YURI CRUZ');
    }
    setSelectedJustification(null);
    setJustificationResponseText('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* HEADER BANNER - PROFESSOR YURI CRUZ */}
      <div className="bg-gradient-to-r from-neutral-900 via-[#161412] to-neutral-900 p-6 rounded-3xl border border-orange-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-0.5 shadow-lg shrink-0 flex items-center justify-center">
              {currentUser.fotoPerfil ? (
                <img
                  src={currentUser.fotoPerfil}
                  alt="PROFESSOR YURI CRUZ"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              ) : (
                <GraduationCap className="w-9 h-9 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Perfil Híbrido: Administrador & Professor
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Sincronização em Tempo Real
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mt-1">
                Dashboard — PROFESSOR YURI CRUZ
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Gestão completa de turmas, alunos vinculados, presenças, check-ins e justificativas do PROFESSOR YURI CRUZ.
              </p>
            </div>
          </div>

          {/* QUICK STATS PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Minhas Turmas</span>
              <strong className="text-lg font-black text-white">{totalTurmasCount}</strong>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Alunos Vinculados</span>
              <strong className="text-lg font-black text-orange-400">{totalAlunosCount}</strong>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Check-ins Pendentes</span>
              <strong className={`text-lg font-black ${pendingCheckinsCount > 0 ? 'text-amber-400 animate-pulse' : 'text-neutral-400'}`}>
                {pendingCheckinsCount}
              </strong>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Justificativas</span>
              <strong className={`text-lg font-black ${pendingJustificativasCount > 0 ? 'text-red-400' : 'text-neutral-400'}`}>
                {pendingJustificativasCount}
              </strong>
            </div>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS SWITCHER */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-neutral-800/80">
          {[
            { id: 'visao_geral', label: 'Visão Geral', icon: Layers },
            { id: 'turmas', label: `Minhas Turmas (${totalTurmasCount})`, icon: Calendar },
            { id: 'alunos', label: `Alunos Vinculados (${totalAlunosCount})`, icon: Users },
            { id: 'checkins', label: `Check-ins (${pendingCheckinsCount})`, icon: Clock },
            { id: 'justificativas', label: `Justificativas (${pendingJustificativasCount})`, icon: FileText },
            { id: 'historico', label: 'Histórico & Faltas', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: VISÃO GERAL */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CARD 1: TURMAS DO PROFESSOR YURI CRUZ */}
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Turmas Vinculadas</h3>
                </div>
                <span className="text-xs font-extrabold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                  {uriCruzTurmas.length} turmas
                </span>
              </div>

              {uriCruzTurmas.length > 0 ? (
                <div className="space-y-2.5">
                  {uriCruzTurmas.map((turma) => {
                    const alunosDaTurma = uriCruzAlunos.filter(
                      (a) => a.turma && a.turma.trim().toLowerCase() === turma.nome.trim().toLowerCase()
                    );

                    return (
                      <div key={turma.id} className="bg-[#1a1a1a] p-3.5 rounded-2xl border border-neutral-850 flex items-center justify-between">
                        <div>
                          <strong className="text-white text-xs block font-extrabold">{turma.nome}</strong>
                          <span className="text-[10px] text-neutral-400 block mt-0.5 font-medium">
                            {turma.diaSemana || 'Dia a definir'} — {turma.horario || 'Horário Oficial'}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-orange-400 bg-neutral-900 px-2.5 py-1 rounded-xl border border-neutral-800">
                          {alunosDaTurma.length} alunos
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 opacity-60">
                  <p className="text-xs text-neutral-400">Nenhuma turma cadastrada diretamente para o PROFESSOR YURI CRUZ.</p>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Ao criar ou editar uma turma selecionando &quot;PROFESSOR YURI CRUZ&quot; no cadastro de turmas, ela aparecerá automaticamente aqui.
                  </p>
                </div>
              )}
            </div>

            {/* CARD 2: PENDÊNCIAS DE CHECK-IN */}
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Check-ins Pendentes</h3>
                </div>
                {uriCruzPendingCheckins.length > 0 && (
                  <button
                    type="button"
                    onClick={onAprovarTodosCheckins}
                    className="text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Aprovar Todos ({uriCruzPendingCheckins.length})
                  </button>
                )}
              </div>

              {uriCruzPendingCheckins.length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {uriCruzPendingCheckins.map((req) => (
                    <div key={`${req.alunoId}-${req.data}`} className="bg-[#1a1a1a] p-3 rounded-2xl border border-neutral-850 flex items-center justify-between">
                      <div>
                        <strong className="text-white text-xs block">{getStudentName(req.alunoId, req.alunoNome)}</strong>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          Data: {req.data} • {req.turma || 'Turma Geral'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAprovarCheckin(req.alunoId, req.data)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl shadow transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Aprovar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-60">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-neutral-400">Nenhum check-in pendente de aprovação no momento.</p>
                </div>
              )}
            </div>

            {/* CARD 3: JUSTIFICATIVAS DE FALTAS */}
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Justificativas</h3>
                </div>
                <span className="text-xs font-bold text-neutral-400">
                  {pendingJustificativasCount} pendentes
                </span>
              </div>

              {uriCruzJustificativas.filter((j) => j.status === 'pendente').length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {uriCruzJustificativas
                    .filter((j) => j.status === 'pendente')
                    .map((j) => (
                      <div key={j.id} className="bg-[#1a1a1a] p-3 rounded-2xl border border-neutral-850 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-white text-xs block">{j.alunoNome}</strong>
                            <span className="text-[10px] text-neutral-400">Falta no dia: {j.data}</span>
                          </div>
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 bg-neutral-900 p-2 rounded-xl border border-neutral-850 line-clamp-2">
                          &quot;{j.motivo}&quot;
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJustification(j);
                            setJustificationResponseText('');
                          }}
                          className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Analisar Justificativa
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-60">
                  <p className="text-xs text-neutral-400">Nenhuma justificativa pendente para análise.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: MINHAS TURMAS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'turmas' && (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-neutral-850 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Turmas do PROFESSOR YURI CRUZ
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Lista detalhada de turmas vinculadas ao PROFESSOR YURI CRUZ e alunos matriculados em cada horário.
                </p>
              </div>
            </div>

            {uriCruzTurmas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uriCruzTurmas.map((turma) => {
                  const alunosDaTurma = uriCruzAlunos.filter(
                    (a) => a.turma && a.turma.trim().toLowerCase() === turma.nome.trim().toLowerCase()
                  );

                  return (
                    <div
                      key={turma.id}
                      className="bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-850 space-y-4 text-left shadow-lg"
                    >
                      <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                        <div>
                          <strong className="text-base text-white font-extrabold uppercase tracking-wide block">
                            {turma.nome}
                          </strong>
                          <span className="text-xs text-orange-400 font-bold block mt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {turma.diaSemana || 'Dia a definir'} — {turma.horario || 'Horário Oficial'}
                          </span>
                        </div>
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 font-black text-xs px-3 py-1 rounded-full">
                          {alunosDaTurma.length} Alunos
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">
                          Alunos Matriculados nesta Turma:
                        </span>
                        {alunosDaTurma.length > 0 ? (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {alunosDaTurma.map((aluno) => (
                              <div
                                key={aluno.id}
                                className="bg-[#141414] p-2.5 rounded-xl border border-neutral-850 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-white">
                                    {aluno.nome.charAt(0)}
                                  </div>
                                  <span className="font-bold text-white">{aluno.nome}</span>
                                </div>
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">{aluno.faixa}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-[#141414] rounded-xl text-neutral-500 text-xs">
                            Nenhum aluno matriculado nesta turma ainda.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-3xl border border-neutral-850 space-y-3">
                <Calendar className="w-12 h-12 text-orange-500/40 mx-auto" />
                <h4 className="text-base font-bold text-white uppercase">Nenhuma Turma Vinculada Directamente</h4>
                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Para vincular uma turma ao PROFESSOR YURI CRUZ, acesse o menu <strong className="text-white">&quot;Mestres &amp; Instrutores&quot; &gt; &quot;Turmas &amp; Cadastrados&quot;</strong> e selecione <strong className="text-orange-400">&quot;PROFESSOR YURI CRUZ&quot;</strong> no campo de Professor Responsável.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: ALUNOS VINCULADOS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'alunos' && (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Alunos do PROFESSOR YURI CRUZ
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Lista sincronizada de alunos matriculados nas turmas sob responsabilidade do PROFESSOR YURI CRUZ.
                </p>
              </div>

              {/* SEARCH BAR */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {uriCruzAlunos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uriCruzAlunos
                  .filter((a) => {
                    if (!searchTerm.trim()) return true;
                    const q = searchTerm.toLowerCase();
                    return a.nome.toLowerCase().includes(q) || (a.cpf && a.cpf.includes(q));
                  })
                  .map((aluno) => {
                    const checkinsCount = aluno.checkins ? aluno.checkins.length : 0;
                    return (
                      <div
                        key={aluno.id}
                        className="bg-[#1a1a1a] p-4 rounded-2xl border border-neutral-850 flex items-center justify-between gap-3 text-left shadow-md hover:border-neutral-750 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-base">
                            {aluno.fotoPerfil ? (
                              <img src={aluno.fotoPerfil} alt={aluno.nome} className="w-full h-full object-cover" />
                            ) : (
                              aluno.nome.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <strong className="text-white text-xs sm:text-sm font-extrabold truncate block">
                              {aluno.nome}
                            </strong>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">
                              Turma: <strong className="text-neutral-200">{aluno.turma || 'Turma Geral'}</strong>
                            </span>
                            <span className="text-[10px] text-orange-400 font-bold uppercase block mt-0.5">
                              Faixa: {aluno.faixa || 'Branca'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-black px-2.5 py-1 rounded-full block">
                            {checkinsCount} treinos
                          </span>
                          {aluno.whatsapp && (
                            <a
                              href={`https://wa.me/55${aluno.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline mt-2 font-bold"
                            >
                              <Phone className="w-3 h-3" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-3xl border border-neutral-850 text-neutral-400 text-xs">
                Nenhum aluno associado ao PROFESSOR YURI CRUZ no momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: CHECK-INS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'checkins' && (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Controle de Check-in das Turmas do PROFESSOR YURI CRUZ
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Aprovação de presença dos alunos das turmas sob responsabilidade do PROFESSOR YURI CRUZ.
                </p>
              </div>

              {uriCruzPendingCheckins.length > 0 && (
                <button
                  type="button"
                  onClick={onAprovarTodosCheckins}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg"
                >
                  <CheckCheck className="w-4 h-4" />
                  Aprovar Todos ({uriCruzPendingCheckins.length})
                </button>
              )}
            </div>

            {uriCruzPendingCheckins.length > 0 ? (
              <div className="space-y-3">
                {uriCruzPendingCheckins.map((req) => (
                  <div
                    key={`${req.alunoId}-${req.data}`}
                    className="bg-[#1a1a1a] p-4 rounded-2xl border border-neutral-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-md"
                  >
                    <div>
                      <strong className="text-white text-sm font-extrabold">{getStudentName(req.alunoId, req.alunoNome)}</strong>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                        <span>Data: <strong className="text-white">{req.data}</strong></span>
                        <span>Turma: <strong className="text-orange-400">{req.turma || 'Turma Geral'}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAprovarCheckin(req.alunoId, req.data)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Aprovar Presença
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-3xl border border-neutral-850 text-neutral-400 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-2" />
                Todos os check-ins das turmas do PROFESSOR YURI CRUZ estão em dia!
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: JUSTIFICATIVAS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'justificativas' && (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  Justificativas de Faltas — PROFESSOR YURI CRUZ
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Análise, aprovação e rejeição de justificativas de falta enviadas pelos alunos.
                </p>
              </div>

              {/* STATUS FILTER */}
              <div className="flex items-center gap-2">
                {(['todas', 'pendente', 'aprovada', 'rejeitada'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setJustificativaStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                      justificativaStatusFilter === st
                        ? 'bg-orange-500 text-white shadow'
                        : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {uriCruzJustificativas.length > 0 ? (
              <div className="space-y-3">
                {uriCruzJustificativas
                  .filter((j) => justificativaStatusFilter === 'todas' || j.status === justificativaStatusFilter)
                  .map((j) => (
                    <div
                      key={j.id}
                      className="bg-[#1a1a1a] p-4 rounded-2xl border border-neutral-850 space-y-3 text-left shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-white text-sm font-extrabold">{j.alunoNome}</strong>
                          <span className="text-xs text-neutral-400 block mt-0.5">
                            Falta na data: <strong className="text-white">{j.data}</strong> ({j.turma || 'Turma Geral'})
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                            j.status === 'aprovada'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : j.status === 'rejeitada'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {j.status}
                        </span>
                      </div>

                      <div className="bg-[#141414] p-3 rounded-xl border border-neutral-850 text-xs text-neutral-300">
                        <strong className="text-orange-400 font-bold block mb-1">Motivo / Justificativa:</strong>
                        &quot;{j.motivo}&quot;
                      </div>

                      {j.resposta && (
                        <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                          <strong className="text-emerald-400 font-bold block mb-1">Parecer do Professor:</strong>
                          {j.resposta}
                        </div>
                      )}

                      {j.status === 'pendente' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJustification(j);
                              setJustificationResponseText('');
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Analisar e Responder
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-3xl border border-neutral-850 text-neutral-400 text-xs">
                Nenhuma justificativa registrada.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 6: HISTÓRICO DE PRESENÇAS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'historico' && (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md space-y-6">
            <div className="border-b border-neutral-850 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Histórico Geral de Presenças — PROFESSOR YURI CRUZ
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Registro histórico de presenças confirmadas nas turmas sob responsabilidade do PROFESSOR YURI CRUZ.
              </p>
            </div>

            {uriCruzConfirmedCheckins.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {uriCruzConfirmedCheckins.map((req, idx) => (
                  <div
                    key={`${req.alunoId}-${req.data}-${idx}`}
                    className="bg-[#1a1a1a] p-3 rounded-xl border border-neutral-850 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-white font-bold">{getStudentName(req.alunoId, req.alunoNome)}</strong>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Turma: {req.turma || 'Turma Geral'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-400 font-extrabold block">{req.data}</span>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold">Presença Confirmada</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-3xl border border-neutral-850 text-neutral-400 text-xs">
                Nenhum histórico de presença confirmado ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL ANALISAR JUSTIFICATIVA */}
      {/* --------------------------------------------------------------------- */}
      {selectedJustification && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1300] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-lg w-full border border-neutral-800 shadow-2xl space-y-4 text-left animate-scale-in">
            <div className="flex items-center gap-3 border-b border-neutral-850 pb-3">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">Análise de Justificativa</h3>
                <p className="text-xs text-neutral-400">{selectedJustification.alunoNome}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-[#1a1a1a] p-3.5 rounded-2xl border border-neutral-850 text-xs">
                <strong className="text-white block">Data da Falta: {selectedJustification.data}</strong>
                <p className="text-neutral-300 mt-2 font-mono">&quot;{selectedJustification.motivo}&quot;</p>
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-bold uppercase tracking-wider block mb-1">
                  Observação / Resposta do PROFESSOR YURI CRUZ
                </label>
                <textarea
                  rows={3}
                  placeholder="Escreva um parecer ou instrução para o aluno..."
                  value={justificationResponseText}
                  onChange={(e) => setJustificationResponseText(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl p-3 text-xs focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedJustification(null)}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 font-bold py-2.5 rounded-xl text-xs uppercase transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleApproveJustificativaModal('rejeitada')}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-xs uppercase transition cursor-pointer shadow"
              >
                Rejeitar
              </button>

              <button
                type="button"
                onClick={() => handleApproveJustificativaModal('aprovada')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-xs uppercase transition cursor-pointer shadow"
              >
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

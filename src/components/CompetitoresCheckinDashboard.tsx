import React, { useState } from 'react';
import { User, Student, CheckinRequest, ClassUnit, Professor, JustificativaFalta } from '../types';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Search,
  Filter,
  Calendar,
  Sparkles,
  ChevronRight,
  BarChart3,
  ListFilter,
  Check,
  CheckCheck,
  GraduationCap,
  Trophy,
  AlertTriangle,
  FileText,
  XCircle,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface CompetitoresCheckinDashboardProps {
  currentUser: User;
  alunos: Student[];
  checkinsPendentes: CheckinRequest[];
  checkinsConfirmados: CheckinRequest[];
  turmas?: ClassUnit[];
  professores?: Professor[];
  onAprovarCheckin: (alunoId: number, data: string) => void;
  onRejeitarCheckinSingle?: (alunoId: number, data: string) => void;
  onAprovarTodosCheckins: () => void;
  isAdmin: boolean;
  justificativasFaltas?: JustificativaFalta[];
  onAprovarJustificativa?: (id: string, resposta?: string, analisadoPor?: string) => void;
  onRejeitarJustificativa?: (id: string, resposta?: string, analisadoPor?: string) => void;
}

export default function CompetitoresCheckinDashboard({
  currentUser,
  alunos,
  checkinsPendentes,
  checkinsConfirmados,
  turmas = [],
  professores = [],
  onAprovarCheckin,
  onRejeitarCheckinSingle,
  onAprovarTodosCheckins,
  isAdmin,
  justificativasFaltas = [],
  onAprovarJustificativa,
  onRejeitarJustificativa,
}: CompetitoresCheckinDashboardProps) {
  // Current Dates
  const hojeStr = new Date().toISOString().split('T')[0];
  const anoMesStr = hojeStr.substring(0, 7);
  const anoStr = hojeStr.substring(0, 4);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfessor, setFilterProfessor] = useState<string>('todos');
  const [filterFaixa, setFilterFaixa] = useState<string>('todas');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'presente_hoje' | 'ausente_hoje' | 'pendente'>('todos');
  const [filterData, setFilterData] = useState<string>('');
  const [selectedTabSection, setSelectedTabSection] = useState<'visao_geral' | 'aprovaCoes' | 'ranking' | 'historico' | 'justificativas'>('visao_geral');

  // Justificativas Filters State
  const [justSearchName, setJustSearchName] = useState('');
  const [justFilterStatus, setJustFilterStatus] = useState<'todas' | 'pendente' | 'aprovada' | 'rejeitada'>('todas');
  const [justFilterTurma, setJustFilterTurma] = useState('todas');
  const [justFilterProfessor, setJustFilterProfessor] = useState('todos');
  const [justDataInicio, setJustDataInicio] = useState('');
  const [justDataFim, setJustDataFim] = useState('');

  // Justificativa Details Modal State
  const [selectedJustification, setSelectedJustification] = useState<JustificativaFalta | null>(null);
  const [replyObservation, setReplyObservation] = useState('');

  // Filtered Students List according to controls (ONLY APPROVED/ACTIVE)
  const filteredAlunos = alunos.filter((aluno) => {
    // Exclude unapproved/pending registrations
    if (aluno.ativo === false) return false;

    // Search Name / CPF
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchNome = aluno.nome.toLowerCase().includes(q);
      const matchCpf = aluno.cpf.includes(q);
      if (!matchNome && !matchCpf) return false;
    }

    // Filter Professor
    if (isAdmin && filterProfessor !== 'todos') {
      if (filterProfessor === 'sem_professor') {
        if (aluno.professorResponsavelId) return false;
      } else {
        if (String(aluno.professorResponsavelId) !== String(filterProfessor)) return false;
      }
    }

    // Filter Faixa
    if (filterFaixa !== 'todas') {
      if (aluno.faixa?.toLowerCase() !== filterFaixa.toLowerCase()) return false;
    }

    // Filter Status
    if (filterStatus === 'presente_hoje') {
      const temPresencaHoje = (aluno.checkins || []).includes(hojeStr);
      if (!temPresencaHoje) return false;
    } else if (filterStatus === 'ausente_hoje') {
      const temPresencaHoje = (aluno.checkins || []).includes(hojeStr);
      if (temPresencaHoje) return false;
    } else if (filterStatus === 'pendente') {
      const temPendente = checkinsPendentes.some((p) => Number(p.alunoId) === Number(aluno.id));
      if (!temPendente) return false;
    }

    // Filter Specific Date checkin
    if (filterData.trim()) {
      const temNaData = (aluno.checkins || []).includes(filterData.trim());
      if (!temNaData) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalAlunos = alunos.length;
  const alunosPresentesHoje = alunos.filter((a) => (a.checkins || []).includes(hojeStr));
  const totalPresentesHoje = alunosPresentesHoje.length;
  const totalAusentesHoje = Math.max(0, totalAlunos - totalPresentesHoje);

  // Relevant pending checkins for visible students
  const pendingCheckinsForVisibleStudents = checkinsPendentes.filter((req) =>
    alunos.some((a) => Number(a.id) === Number(req.alunoId))
  );

  // Calculate total confirmados accumulated
  const totalCheckinsConfirmadosAcumulado = alunos.reduce((acc, a) => acc + (a.checkins ? a.checkins.length : 0), 0);

  // Frequency average
  const mediaPresencasPorAluno = totalAlunos > 0 ? (totalCheckinsConfirmadosAcumulado / totalAlunos).toFixed(1) : '0';

  // Ranking of top students
  const rankingAlunos = [...alunos]
    .sort((a, b) => (b.checkins?.length || 0) - (a.checkins?.length || 0))
    .slice(0, 10);

  // Unique list of belts for filter dropdown
  const faixasDisponiveis = Array.from(new Set(alunos.map((a) => a.faixa).filter(Boolean)));

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* TOP TITLE BAR */}
      <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-2xl text-orange-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Dashboard de Presença dos Competidores (Alunos)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isAdmin
                ? 'Gestão centralizada e estatísticas completas de frequência de todas as turmas'
                : `Painel de frequência dos alunos das suas turmas (${currentUser.nome})`}
            </p>
          </div>
        </div>

        {/* SECTION NAVIGATION BUTTONS */}
        <div className="flex flex-wrap gap-2 bg-[#1a1a1a] p-1.5 rounded-xl border border-neutral-850 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTabSection('visao_geral')}
            className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedTabSection === 'visao_geral'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTabSection('aprovaCoes')}
            className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedTabSection === 'aprovaCoes'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Aprovações</span>
            {pendingCheckinsForVisibleStudents.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-black rounded-full">
                {pendingCheckinsForVisibleStudents.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedTabSection('ranking')}
            className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedTabSection === 'ranking'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Ranking</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTabSection('historico')}
            className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedTabSection === 'historico'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Lista & Histórico</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTabSection('justificativas')}
            className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedTabSection === 'justificativas'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Justificativas de Ausência</span>
            {justificativasFaltas.filter((j) => j.status === 'pendente').length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] font-black rounded-full animate-pulse">
                {justificativasFaltas.filter((j) => j.status === 'pendente').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Alunos */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Total de Alunos</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{totalAlunos}</div>
          <p className="text-[9px] text-neutral-400 mt-1 font-semibold">Alunos cadastrados</p>
        </div>

        {/* Presentes Hoje */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-emerald-500/30 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Presentes Hoje</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{totalPresentesHoje}</div>
          <p className="text-[9px] text-emerald-400/80 mt-1 font-semibold">Data: {hojeStr}</p>
        </div>

        {/* Ausentes Hoje */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-red-500/30 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Ausentes Hoje</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{totalAusentesHoje}</div>
          <p className="text-[9px] text-red-400/80 mt-1 font-semibold">Sem check-in hoje</p>
        </div>

        {/* Pendentes */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-amber-500/30 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Pendentes</span>
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white">{pendingCheckinsForVisibleStudents.length}</div>
          <p className="text-[9px] text-amber-400/80 mt-1 font-semibold">Aguardando treino</p>
        </div>

        {/* Total Confirmações Acumuladas */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-orange-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Treinos</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{totalCheckinsConfirmadosAcumulado}</div>
          <p className="text-[9px] text-neutral-400 mt-1 font-semibold">Presenças validadas</p>
        </div>

        {/* Frequência Média */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Média / Aluno</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{mediaPresencasPorAluno}</div>
          <p className="text-[9px] text-neutral-400 mt-1 font-semibold">Treinos por praticante</p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow-md space-y-3">
        <div className="text-xs font-bold text-neutral-300 flex items-center gap-2 border-b border-neutral-850 pb-2">
          <Filter className="w-4 h-4 text-orange-500" />
          <span>Filtros e Pesquisa de Presenças de Alunos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by Name */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar aluno por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-orange-500 outline-none transition"
            />
          </div>

          {/* Filter Professor (Admin Only) */}
          {isAdmin ? (
            <select
              value={filterProfessor}
              onChange={(e) => setFilterProfessor(e.target.value)}
              className="bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
            >
              <option value="todos">Todos os Professores</option>
              {professores.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome}
                </option>
              ))}
              <option value="sem_professor">Sem Professor Vinculado</option>
            </select>
          ) : (
            <div className="bg-[#1a1a1a] text-neutral-300 border border-neutral-800 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="truncate">Suas Turmas / Alunos</span>
            </div>
          )}

          {/* Filter Faixa */}
          <select
            value={filterFaixa}
            onChange={(e) => setFilterFaixa(e.target.value)}
            className="bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
          >
            <option value="todas">Todas as Faixas</option>
            {faixasDisponiveis.map((faixa) => (
              <option key={faixa} value={faixa}>
                Faixa {faixa}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="presente_hoje">Presentes Hoje ({hojeStr})</option>
            <option value="ausente_hoje">Ausentes Hoje</option>
            <option value="pendente">Com Solicitação Pendente</option>
          </select>

          {/* Filter Data */}
          <input
            type="date"
            value={filterData}
            onChange={(e) => setFilterData(e.target.value)}
            className="bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
            title="Filtrar presenças em data específica"
          />
        </div>
      </div>

      {/* DYNAMIC SECTION CONTENTS */}

      {/* SECTION 1: VISÃO GERAL */}
      {selectedTabSection === 'visao_geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: PENDING APPROVALS SUMMARY & QUICK ACTIONS */}
          <div className="lg:col-span-2 bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Fila de Aprovação de Treinos ({pendingCheckinsForVisibleStudents.length})
                </h3>
              </div>
              {pendingCheckinsForVisibleStudents.length > 0 && (
                <button
                  type="button"
                  onClick={onAprovarTodosCheckins}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs py-1.5 px-3.5 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Aprovar Todos</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {pendingCheckinsForVisibleStudents.length > 0 ? (
                pendingCheckinsForVisibleStudents.map((req, idx) => {
                  const student = alunos.find((a) => Number(a.id) === Number(req.alunoId));
                  return (
                    <div
                      key={idx}
                      className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 text-left hover:border-neutral-750 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">🥋 {student?.nome || `Aluno #${req.alunoId}`}</span>
                          {student?.faixa && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                              {student.faixa}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400 block font-mono">
                          📅 Data solicitada: <strong className="text-neutral-200">{req.data}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onRejeitarCheckinSingle && (
                          <button
                            type="button"
                            onClick={() => onRejeitarCheckinSingle(req.alunoId, req.data)}
                            className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold text-xs py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 shadow active:scale-95"
                            title="Rejeitar solicitação"
                          >
                            <span>Recusar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onAprovarCheckin(req.alunoId, req.data)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprovar Treino</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-50 text-xs text-neutral-400 bg-[#1a1a1a] rounded-xl border border-neutral-850">
                  Nenhuma solicitação de treino aguardando aprovação na fila.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: MINI RANKING FREQUÊNCIA */}
          <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-850 pb-3 text-amber-500">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top 5 Alunos Mais Frequentes</h3>
            </div>

            <div className="space-y-2.5">
              {rankingAlunos.slice(0, 5).map((aluno, idx) => (
                <div
                  key={aluno.id}
                  className="bg-[#1a1a1a] p-3 rounded-xl border border-neutral-850 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-yellow-500 text-black'
                          : idx === 1
                          ? 'bg-slate-300 text-black'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-white block font-bold leading-tight">{aluno.nome}</strong>
                      <span className="text-[10px] text-neutral-400">{aluno.faixa || 'Iniciante'}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <strong className="text-orange-400 font-extrabold text-sm">
                      {aluno.checkins ? aluno.checkins.length : 0}
                    </strong>
                    <span className="text-[9px] text-neutral-500 block">treinos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FILA DE APROVAÇÕES EXCLUSIVA */}
      {selectedTabSection === 'aprovaCoes' && (
        <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-850 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-amber-500">
              <Clock className="w-5 h-5 animate-pulse" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Gerenciamento de Solicitações Pendentes de Alunos
              </h3>
            </div>
            {pendingCheckinsForVisibleStudents.length > 0 && (
              <button
                type="button"
                onClick={onAprovarTodosCheckins}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 shadow active:scale-95"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Aprovar Todos os Pendentes ({pendingCheckinsForVisibleStudents.length})</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {pendingCheckinsForVisibleStudents.length > 0 ? (
              pendingCheckinsForVisibleStudents.map((req, idx) => {
                const student = alunos.find((a) => Number(a.id) === Number(req.alunoId));
                return (
                  <div
                    key={idx}
                    className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <span className="font-bold text-white text-sm block">🥋 {student?.nome || `Aluno ID #${req.alunoId}`}</span>
                      <span className="text-xs text-neutral-400 block mt-0.5 font-mono">
                        Disparou solicitação de presença para: <strong className="text-white">{req.data}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {onRejeitarCheckinSingle && (
                        <button
                          type="button"
                          onClick={() => onRejeitarCheckinSingle(req.alunoId, req.data)}
                          className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow active:scale-95"
                          title="Rejeitar solicitação"
                        >
                          <span>Recusar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onAprovarCheckin(req.alunoId, req.data)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 shadow active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovar Treino</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-neutral-850 opacity-60">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Todas as solicitações de alunos já foram homologadas!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: RANKING DE FREQUÊNCIA COMPLETO */}
      {selectedTabSection === 'ranking' && (
        <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
          <div className="border-b border-neutral-850 pb-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Ranking Geral de Frequência e Treinos Concluídos
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Classificação por quantidade de check-ins homologados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rankingAlunos.map((aluno, idx) => (
              <div
                key={aluno.id}
                className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 flex items-center justify-between text-left hover:border-neutral-750 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      idx === 0
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                        : idx === 1
                        ? 'bg-slate-300 text-black'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <strong className="text-white font-bold text-sm block">{aluno.nome}</strong>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span>Faixa: <strong className="text-neutral-200">{aluno.faixa || 'Iniciante'}</strong></span>
                      {aluno.professorResponsavelNome && (
                        <span>• Prof: {aluno.professorResponsavelNome}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <span className="text-lg font-black text-orange-400">
                    {aluno.checkins ? aluno.checkins.length : 0}
                  </span>
                  <span className="text-[10px] text-neutral-400 block uppercase font-sans font-bold">Aulas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: HISTÓRICO & LISTAGEM COMPLETA DE ALUNOS */}
      {selectedTabSection === 'historico' && (
        <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
          <div className="border-b border-neutral-850 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-orange-500" />
                Histórico Geral de Presença por Aluno ({filteredAlunos.length})
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Consulte a frequência detalhada e as últimas datas registradas de cada praticante
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlunos.length > 0 ? (
              filteredAlunos.map((aluno) => {
                const totalTreinos = aluno.checkins ? aluno.checkins.length : 0;
                const presenteHoje = (aluno.checkins || []).includes(hojeStr);
                const temPendente = checkinsPendentes.some((p) => Number(p.alunoId) === Number(aluno.id));
                const ultimasDatas = (aluno.checkins || []).slice(-3).reverse();

                return (
                  <div
                    key={aluno.id}
                    className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 hover:border-neutral-750 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-white text-sm font-bold">{aluno.nome}</strong>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Faixa {aluno.faixa || 'Iniciante'}
                        </span>
                        {presenteHoje ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Presente Hoje</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-500 border border-neutral-800">
                            Ausente Hoje
                          </span>
                        )}

                        {temPendente && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>Aguardando Treino</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                        <span>Total treinos: <strong className="text-orange-400">{totalTreinos}</strong></span>
                        {aluno.professorResponsavelNome && (
                          <span>Professor: <strong className="text-neutral-300">{aluno.professorResponsavelNome}</strong></span>
                        )}
                        {ultimasDatas.length > 0 && (
                          <span className="text-neutral-500">
                            Últimos: {ultimasDatas.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right font-mono">
                      <span className="text-xs text-neutral-400 block font-sans">Aproveitamento</span>
                      <strong className="text-sm text-white">
                        {totalTreinos > 0 ? `${totalTreinos} presenças` : 'Nenhuma'}
                      </strong>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-neutral-850 opacity-60">
                <Users className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-neutral-300">Nenhum aluno encontrado com os filtros selecionados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: JUSTIFICATIVAS DE AUSÊNCIA */}
      {selectedTabSection === 'justificativas' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* SEARCH & FILTER BAR FOR JUSTIFICATIONS */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" />
                <span>Filtros de Justificativa</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setJustSearchName('');
                  setJustFilterStatus('todas');
                  setJustFilterTurma('todas');
                  setJustFilterProfessor('todos');
                  setJustDataInicio('');
                  setJustDataFim('');
                }}
                className="text-xs text-neutral-400 hover:text-white transition underline"
              >
                Limpar Filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              {/* Search Name */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Buscar Aluno
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    value={justSearchName}
                    onChange={(e) => setJustSearchName(e.target.value)}
                    placeholder="Nome do aluno..."
                    className="w-full bg-[#1a1a1a] border border-neutral-800 focus:border-orange-500 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={justFilterStatus}
                  onChange={(e) => setJustFilterStatus(e.target.value as any)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 focus:border-orange-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="todas">Todos os Status</option>
                  <option value="pendente">⏳ Aguardando Análise</option>
                  <option value="aprovada">✅ Presença Justificada</option>
                  <option value="rejeitada">❌ Falta Mantida</option>
                </select>
              </div>

              {/* Turma */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Turma
                </label>
                <select
                  value={justFilterTurma}
                  onChange={(e) => setJustFilterTurma(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 focus:border-orange-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="todas">Todas as Turmas</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.nome}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Professor */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Professor
                </label>
                <select
                  value={justFilterProfessor}
                  onChange={(e) => setJustFilterProfessor(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 focus:border-orange-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="todos">Todos os Professores</option>
                  {professores.map((p) => (
                    <option key={p.id} value={p.nome}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Início */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={justDataInicio}
                  onChange={(e) => setJustDataInicio(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 focus:border-orange-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={justDataFim}
                  onChange={(e) => setJustDataFim(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 focus:border-orange-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* LIST OF JUSTIFICATIONS */}
          <div className="space-y-3">
            {(() => {
              const list = justificativasFaltas.filter((just) => {
                if (justSearchName.trim()) {
                  if (!just.alunoNome.toLowerCase().includes(justSearchName.toLowerCase().trim())) {
                    return false;
                  }
                }
                if (justFilterStatus !== 'todas' && just.status !== justFilterStatus) {
                  return false;
                }
                if (justFilterTurma !== 'todas' && just.turma !== justFilterTurma) {
                  return false;
                }
                if (justFilterProfessor !== 'todos' && just.professorNome !== justFilterProfessor) {
                  return false;
                }
                if (justDataInicio && just.data < justDataInicio) {
                  return false;
                }
                if (justDataFim && just.data > justDataFim) {
                  return false;
                }
                return true;
              });

              if (list.length === 0) {
                return (
                  <div className="text-center py-12 bg-[#141414] rounded-2xl border border-neutral-800 opacity-60">
                    <FileText className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-neutral-300">
                      Nenhuma justificativa encontrada para os filtros selecionados.
                    </p>
                  </div>
                );
              }

              return list.map((just) => {
                const dateFormatted = just.data.split('-').reverse().join('/');

                return (
                  <div
                    key={just.id}
                    className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 hover:border-neutral-750 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-white text-sm font-bold">{just.alunoNome}</strong>
                        {just.status === 'pendente' && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>Aguardando Análise</span>
                          </span>
                        )}
                        {just.status === 'aprovada' && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Presença Justificada</span>
                          </span>
                        )}
                        {just.status === 'rejeitada' && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Falta (Rejeitada)</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                        <span>Aula: <strong className="text-white">{dateFormatted}</strong></span>
                        {just.turma && <span>Turma: <strong className="text-orange-400">{just.turma}</strong></span>}
                        {just.horario && <span>Horário: <strong className="text-neutral-300">{just.horario}</strong></span>}
                        {just.professorNome && <span>Prof: <strong className="text-neutral-300">{just.professorNome}</strong></span>}
                      </div>

                      <p className="text-xs text-neutral-300 line-clamp-1 italic bg-[#1a1a1a] p-2 rounded-lg border border-neutral-850 mt-1">
                        "{just.motivo}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJustification(just);
                        setReplyObservation(just.resposta || '');
                      }}
                      className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 hover:border-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0"
                    >
                      <Eye className="w-4 h-4 text-orange-500" />
                      <span>Detalhes / Analisar</span>
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* DETAILS & ANALYSIS MODAL FOR JUSTIFICATION */}
      {selectedJustification && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Análise de Justificativa
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Detalhes do envio e validação pela equipe
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJustification(null)}
                className="text-neutral-500 hover:text-white transition cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* DETAILS BODY */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Aluno:</span>
                  <strong className="text-white text-sm font-bold">{selectedJustification.alunoNome}</strong>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span>Data da Aula:</span>
                  <strong className="text-orange-400 font-bold">{selectedJustification.data.split('-').reverse().join('/')}</strong>
                </div>
                {selectedJustification.turma && (
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Turma:</span>
                    <strong className="text-neutral-200 font-semibold">{selectedJustification.turma}</strong>
                  </div>
                )}
                {selectedJustification.horario && (
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Horário:</span>
                    <strong className="text-neutral-200 font-semibold">{selectedJustification.horario}</strong>
                  </div>
                )}
                {selectedJustification.dataEnvio && (
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Enviado em:</span>
                    <strong className="text-neutral-400 font-mono">{selectedJustification.dataEnvio}</strong>
                  </div>
                )}
              </div>

              {/* MOTIVO BOX */}
              <div className="space-y-1.5">
                <span className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider block">
                  Motivo Informado pelo Aluno:
                </span>
                <div className="bg-[#0d0d0d] border border-neutral-800 rounded-2xl p-4 text-neutral-200 leading-relaxed font-sans text-xs">
                  "{selectedJustification.motivo}"
                </div>
              </div>

              {/* IF ALREADY ANALYZED */}
              {selectedJustification.analisadoPor && (
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-3 space-y-1 text-[11px] text-neutral-400">
                  <div>Analisado por: <strong className="text-white">{selectedJustification.analisadoPor}</strong></div>
                  {selectedJustification.dataAnalise && <div>Data da análise: <strong className="text-white">{selectedJustification.dataAnalise}</strong></div>}
                </div>
              )}

              {/* OBSERVATION TEXTAREA */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider block">
                  Observação / Resposta da Equipe (Opcional):
                </label>
                <textarea
                  value={replyObservation}
                  onChange={(e) => setReplyObservation(e.target.value)}
                  placeholder="Ex: Justificativa aceita / Motivo insuficiente..."
                  rows={2}
                  className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition resize-none"
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onAprovarJustificativa) {
                    onAprovarJustificativa(
                      selectedJustification.id,
                      replyObservation.trim(),
                      currentUser.nome || 'Administrador'
                    );
                    setSelectedJustification(null);
                    alert('✅ Justificativa aprovada com sucesso! A presença do aluno foi abonada.');
                  }
                }}
                className="py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprovar (Presença)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onRejeitarJustificativa) {
                    onRejeitarJustificativa(
                      selectedJustification.id,
                      replyObservation.trim(),
                      currentUser.nome || 'Administrador'
                    );
                    setSelectedJustification(null);
                    alert('❌ Justificativa rejeitada. A falta foi mantida nos registros.');
                  }
                }}
                className="py-3 px-4 bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-500/50 text-neutral-400 hover:text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>Rejeitar (Falta)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

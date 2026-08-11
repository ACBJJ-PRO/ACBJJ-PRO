import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  ShieldAlert,
  ArrowRightLeft,
  X,
  Filter,
  Info,
  CalendarCheck,
  UserCheck,
  UserX,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import { User as UserType, ClassUnit, TrainingSchedule, Professor, AulaExperimental } from '../types';

interface AgendaAulasExperimentaisPaneProps {
  currentUser: UserType;
  turmas: ClassUnit[];
  trainingSchedules: TrainingSchedule[];
  professores: Professor[];
  aulasExperimentais: AulaExperimental[];
  onUpdateAulasExperimentais: (newAulas: AulaExperimental[]) => void;
  onUpdateSchedules?: (newSchedules: TrainingSchedule[]) => void;
}

export default function AgendaAulasExperimentaisPane({
  currentUser,
  turmas,
  trainingSchedules,
  professores,
  aulasExperimentais,
  onUpdateAulasExperimentais,
  onUpdateSchedules,
}: AgendaAulasExperimentaisPaneProps) {
  const isAdmin = currentUser.tipo === 'admin';
  const isProfessor = currentUser.tipo === 'professor' || currentUser.tipo === 'instrutor';

  // Permission Guard
  if (!isAdmin && !isProfessor) {
    return (
      <div className="bg-[#141414] border border-red-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 shadow-2xl animate-scale-in">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
        <p className="text-xs text-neutral-400 leading-relaxed">
          O módulo <strong className="text-white">Agenda / Aulas Experimentais</strong> é de uso restrito a Administradores e Professores/Instrutores autorizados.
        </p>
      </div>
    );
  }

  // Active Tab: 'experimentais' | 'grade'
  const [activeTab, setActiveTab] = useState<'experimentais' | 'grade'>('experimentais');

  // Search & Filters for Experimentais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [turmaFilter, setTurmaFilter] = useState<string>('todos');
  const [professorFilter, setProfessorFilter] = useState<string>('todos');
  const [dataFilter, setDataFilter] = useState<string>('todos'); // 'todos' | 'hoje' | 'semana' | YYYY-MM-DD

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<AulaExperimental | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AulaExperimental | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<AulaExperimental | null>(null);

  // Form state for New Registration
  const [newNome, setNewNome] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTurma, setNewTurma] = useState('');
  const [newHorario, setNewHorario] = useState('19:00 - 20:30');
  const [newDataAula, setNewDataAula] = useState(new Date().toISOString().split('T')[0]);
  const [newObservacoes, setNewObservacoes] = useState('');

  // Form state for Move/Edit
  const [moveTurma, setMoveTurma] = useState('');
  const [moveHorario, setMoveHorario] = useState('');
  const [moveDataAula, setMoveDataAula] = useState('');
  const [moveObservacoes, setMoveObservacoes] = useState('');

  // Filtered List based on User Role & Search/Filter parameters
  const filteredAulas = useMemo(() => {
    let list = [...aulasExperimentais];

    // Role-based filtering for Professors
    if (isProfessor && !isAdmin) {
      // Find matching professor name or ID
      const userClean = currentUser.nome.toLowerCase().trim();
      list = list.filter((aula) => {
        const profMatch = aula.professorNome?.toLowerCase().includes(userClean);
        const userProfMatch = currentUser.nome.toLowerCase().includes(aula.professorNome?.toLowerCase() || '');
        // Check if teacher is assigned to the turma
        const turmaMatch = turmas.some(
          (t) => t.nome.toLowerCase() === aula.turma.toLowerCase() && (t.professorNome?.toLowerCase().includes(userClean) || String(t.professorId) === String(currentUser.id))
        );
        return profMatch || userProfMatch || turmaMatch;
      });
    }

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.nome.toLowerCase().includes(term) ||
          a.whatsapp.toLowerCase().includes(term) ||
          (a.email && a.email.toLowerCase().includes(term)) ||
          a.turma.toLowerCase().includes(term)
      );
    }

    // Status Filter
    if (statusFilter !== 'todos') {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Turma Filter
    if (turmaFilter !== 'todos') {
      list = list.filter((a) => a.turma.toLowerCase() === turmaFilter.toLowerCase());
    }

    // Professor Filter
    if (professorFilter !== 'todos' && isAdmin) {
      list = list.filter((a) => a.professorNome?.toLowerCase() === professorFilter.toLowerCase());
    }

    // Data Filter
    const todayStr = new Date().toISOString().split('T')[0];
    if (dataFilter === 'hoje') {
      list = list.filter((a) => a.dataAula === todayStr);
    } else if (dataFilter === 'semana') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      list = list.filter((a) => a.dataAula >= todayStr && a.dataAula <= nextWeekStr);
    } else if (dataFilter !== 'todos') {
      list = list.filter((a) => a.dataAula === dataFilter);
    }

    // Sort newest first or by date
    return list.sort((a, b) => (b.dataAula || '').localeCompare(a.dataAula || ''));
  }, [aulasExperimentais, searchTerm, statusFilter, turmaFilter, professorFilter, dataFilter, currentUser, isAdmin, isProfessor, turmas]);

  // Statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const totalInscritos = filteredAulas.length;
  const pendentesCount = filteredAulas.filter((a) => a.status === 'Pendente').length;
  const hojeCount = filteredAulas.filter((a) => a.dataAula === todayStr).length;
  const concluidosCount = filteredAulas.filter((a) => a.status === 'Concluído' || a.status === 'Confirmado').length;
  const taxaPresenca = totalInscritos > 0 ? Math.round((concluidosCount / totalInscritos) * 100) : 0;

  // Handlers for Status Change (Admin)
  const handleUpdateStatus = (id: string, newStatus: AulaExperimental['status']) => {
    if (!isAdmin) return;
    const updated = aulasExperimentais.map((aula) => {
      if (aula.id === id) {
        return { ...aula, status: newStatus };
      }
      return aula;
    });
    onUpdateAulasExperimentais(updated);
  };

  // Handlers for Adding New Registration (Admin)
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newNome.trim() || !newWhatsapp.trim() || !newTurma) {
      alert('Por favor, preencha o Nome, WhatsApp e selecione uma Turma!');
      return;
    }

    // Find assigned professor if available
    const matchedTurma = turmas.find((t) => t.nome.toLowerCase() === newTurma.toLowerCase());

    const newItem: AulaExperimental = {
      id: 'exp_' + Date.now().toString(),
      nome: newNome.trim().toUpperCase(),
      whatsapp: newWhatsapp.trim(),
      email: newEmail.trim() || undefined,
      turma: newTurma,
      horario: newHorario || matchedTurma?.horario || '19:00 - 20:30',
      dataAula: newDataAula || todayStr,
      status: 'Pendente',
      professorId: matchedTurma?.professorId,
      professorNome: matchedTurma?.professorNome || 'Mestre Responsável',
      observacoes: newObservacoes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onUpdateAulasExperimentais([newItem, ...aulasExperimentais]);

    // Reset Form
    setNewNome('');
    setNewWhatsapp('');
    setNewEmail('');
    setNewObservacoes('');
    setShowAddModal(false);
  };

  // Handlers for Move/Edit Registration (Admin)
  const handleOpenMoveModal = (item: AulaExperimental) => {
    setShowMoveModal(item);
    setMoveTurma(item.turma);
    setMoveHorario(item.horario);
    setMoveDataAula(item.dataAula);
    setMoveObservacoes(item.observacoes || '');
  };

  const handleSaveMove = () => {
    if (!showMoveModal || !isAdmin) return;
    const matchedTurma = turmas.find((t) => t.nome.toLowerCase() === moveTurma.toLowerCase());

    const updated = aulasExperimentais.map((aula) => {
      if (aula.id === showMoveModal.id) {
        return {
          ...aula,
          turma: moveTurma,
          horario: moveHorario,
          dataAula: moveDataAula,
          observacoes: moveObservacoes || undefined,
          professorId: matchedTurma?.professorId || aula.professorId,
          professorNome: matchedTurma?.professorNome || aula.professorNome,
        };
      }
      return aula;
    });

    onUpdateAulasExperimentais(updated);
    setShowMoveModal(null);
  };

  // Handlers for Delete Registration (Admin)
  const handleDeleteConfirm = () => {
    if (!showDeleteModal || !isAdmin) return;
    const updated = aulasExperimentais.filter((a) => a.id !== showDeleteModal.id);
    onUpdateAulasExperimentais(updated);
    setShowDeleteModal(null);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* HEADER SECTION */}
      <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <CalendarCheck className="w-32 h-32 text-orange-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-2xl text-orange-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  AGENDA / AULAS EXPERIMENTAIS
                </h2>
                <span className="text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {isAdmin ? 'Módulo Administrativo' : 'Visão do Professor'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {isAdmin
                  ? 'Gerenciamento completo das inscrições, horários, turmas e presenças das Aulas Experimentais.'
                  : 'Acompanhamento exclusivo dos alunos inscritos nas suas turmas e aulas experimentais.'}
              </p>
            </div>
          </div>

          {/* Action Buttons for Admin */}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black py-3 px-5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Inscrição Experimental</span>
            </button>
          )}
        </div>

        {/* TABS SWITCHER */}
        <div className="flex border-b border-neutral-850 mt-6 gap-2">
          <button
            onClick={() => setActiveTab('experimentais')}
            className={`py-3 px-4 font-extrabold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'experimentais'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Aulas Experimentais ({aulasExperimentais.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('grade')}
            className={`py-3 px-4 font-extrabold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'grade'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Grade Horária e Turmas</span>
          </button>
        </div>
      </div>

      {/* PROFESSOR OPERATIONAL NOTICE */}
      {isProfessor && !isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-white text-sm">Modo de Consulta Operacional (Professor/Instrutor)</span>
            <p className="mt-0.5 text-neutral-300">
              Você está visualizando apenas os agendamentos atribuídos às suas turmas e aulas. Para alterar horários, mover participantes ou efetuar ações administrativas, procure o perfil Administrador.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: AULAS EXPERIMENTAIS */}
      {activeTab === 'experimentais' && (
        <div className="space-y-6">
          {/* STATS METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total de Inscritos</span>
                <Users className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-white">{totalInscritos}</p>
              <p className="text-[10px] text-neutral-500 mt-1">Registros de visitantes</p>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Aguardando</span>
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-black text-yellow-400">{pendentesCount}</p>
              <p className="text-[10px] text-neutral-500 mt-1">Status pendente</p>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Aulas Hoje</span>
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{hojeCount}</p>
              <p className="text-[10px] text-neutral-500 mt-1">{todayStr}</p>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Taxa de Presença</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-blue-400">{taxaPresenca}%</p>
              <p className="text-[10px] text-neutral-500 mt-1">Concluídos e confirmados</p>
            </div>
          </div>

          {/* SEARCH & FILTERS PANEL */}
          <div className="bg-[#141414] p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, WhatsApp ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-white placeholder-neutral-500 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-auto shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Justificado">Justificado (Auto 23h59)</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              {/* Turma Filter */}
              <div className="w-full sm:w-auto shrink-0">
                <select
                  value={turmaFilter}
                  onChange={(e) => setTurmaFilter(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="todos">Todas as Turmas</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.nome}>
                      {t.nome}
                    </option>
                  ))}
                  <option value="Jiu-Jitsu Adulto">Jiu-Jitsu Adulto</option>
                  <option value="Jiu-Jitsu Infantil">Jiu-Jitsu Infantil</option>
                  <option value="No-Gi / Submission">No-Gi / Submission</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>

              {/* Data Filter */}
              <div className="w-full sm:w-auto shrink-0">
                <select
                  value={dataFilter}
                  onChange={(e) => setDataFilter(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="todos">Todas as Datas</option>
                  <option value="hoje">Aulas de Hoje</option>
                  <option value="semana">Próximos 7 Dias</option>
                </select>
              </div>
            </div>
          </div>

          {/* PARTICIPANTS TABLE / LIST */}
          <div className="bg-[#141414] rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-neutral-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Participantes Cadastrados ({filteredAulas.length})
                </h3>
              </div>
            </div>

            {filteredAulas.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <UserX className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-neutral-300">Nenhuma aula experimental encontrada</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Não há registros para os filtros selecionados. Tente alterar a busca ou cadastre um novo visitante.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#181818] text-neutral-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-neutral-850">
                      <th className="py-3.5 px-4">Participante / Contato</th>
                      <th className="py-3.5 px-4">Turma & Horário</th>
                      <th className="py-3.5 px-4">Data Agendada</th>
                      <th className="py-3.5 px-4">Professor Responsável</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850/60">
                    {filteredAulas.map((aula) => {
                      const cleanPhone = aula.whatsapp.replace(/\D/g, '');
                      return (
                        <tr key={aula.id} className="hover:bg-neutral-900/50 transition">
                          {/* Participant info */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-sm">{aula.nome}</div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                              <span className="flex items-center gap-1 font-mono text-orange-400">
                                <Phone className="w-3 h-3 text-orange-500" />
                                {aula.whatsapp}
                              </span>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(aula.nome)},%20sou%20da%20Arena%20do%20Competidor%20sobre%20sua%20aula%20experimental!`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition text-[10px] font-bold inline-flex items-center gap-1"
                                  title="Enviar mensagem via WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                            {aula.email && (
                              <div className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-[180px]">
                                {aula.email}
                              </div>
                            )}
                          </td>

                          {/* Turma & Horario */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-neutral-200 block">{aula.turma}</span>
                            <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-orange-500 shrink-0" />
                              {aula.horario}
                            </span>
                          </td>

                          {/* Data Agendada */}
                          <td className="py-4 px-4">
                            <div className="font-mono font-bold text-neutral-300">
                              {aula.dataAula ? new Date(aula.dataAula + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir'}
                            </div>
                            {aula.dataAula === todayStr && (
                              <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                HOJE
                              </span>
                            )}
                          </td>

                          {/* Professor */}
                          <td className="py-4 px-4">
                            <span className="text-neutral-300 font-medium block">
                              {aula.professorNome || 'Mestre Responsável'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                aula.status === 'Confirmado' || aula.status === 'Concluído'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : aula.status === 'Pendente'
                                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                  : aula.status === 'Justificado'
                                  ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                                  : aula.status === 'Ausente'
                                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                              }`}
                            >
                              {aula.status === 'Confirmado' || aula.status === 'Concluído' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : aula.status === 'Pendente' ? (
                                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                              ) : aula.status === 'Justificado' ? (
                                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span>{aula.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Details Button */}
                              <button
                                onClick={() => setShowDetailModal(aula)}
                                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
                                title="Ver Detalhes"
                              >
                                <Info className="w-4 h-4" />
                              </button>

                              {/* Admin Exclusive Control Actions */}
                              {isAdmin && (
                                <>
                                  {/* Presença Quick Toggle */}
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(
                                        aula.id,
                                        aula.status === 'Concluído' ? 'Pendente' : 'Concluído'
                                      )
                                    }
                                    className={`p-2 rounded-xl border transition cursor-pointer ${
                                      aula.status === 'Concluído'
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                        : 'bg-neutral-900 hover:bg-emerald-500/10 border-neutral-800 text-neutral-400 hover:text-emerald-400'
                                    }`}
                                    title={aula.status === 'Concluído' ? 'Marcar como Pendente' : 'Confirmar Presença (Concluído)'}
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>

                                  {/* Mover / Alterar Horario */}
                                  <button
                                    onClick={() => handleOpenMoveModal(aula)}
                                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-orange-400 transition cursor-pointer"
                                    title="Mover de Turma ou Alterar Horário"
                                  >
                                    <ArrowRightLeft className="w-4 h-4" />
                                  </button>

                                  {/* Excluir Inscrição */}
                                  <button
                                    onClick={() => setShowDeleteModal(aula)}
                                    className="p-2 rounded-xl bg-neutral-900 hover:bg-red-500/20 border border-neutral-800 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                                    title="Excluir Inscrição"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GRADE HORÁRIA E TURMAS */}
      {activeTab === 'grade' && (
        <div className="space-y-6">
          <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-850">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Grade Horária das Aulas da Academia
                </h3>
              </div>
              <p className="text-xs text-neutral-400">
                Aulas e horários sincronizados com a Gestão de Turmas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingSchedules && trainingSchedules.length > 0 ? (
                trainingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-[#1a1a1a] p-4 rounded-2xl border border-neutral-800 flex flex-col justify-between gap-3 hover:border-neutral-700 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-black text-orange-400 uppercase tracking-wider block">
                          {schedule.diaSemana}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          {schedule.nomeTurma || 'Turma Geral Jiu-Jitsu'}
                        </h4>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold uppercase py-1 px-2 rounded-md border ${
                          schedule.status === 'confirmado'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : schedule.status === 'cancelado'
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                        }`}
                      >
                        {schedule.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-neutral-850 text-xs text-neutral-300">
                      <div className="flex items-center gap-2 font-mono text-neutral-200 font-bold">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>{schedule.horario}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Professor: {(schedule.professorNome || 'PROFESSOR YURI CRUZ').replace(/Y+URI/gi, 'YURI').replace(/\bURI\b/gi, 'YURI')}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-neutral-500 text-xs">
                  Nenhuma aula agendada na grade no momento.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW EXPERIMENTAL CLASS (ADMIN ONLY) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-lg w-full border border-neutral-800 shadow-2xl relative animate-scale-in space-y-4 text-left">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Nova Inscrição Experimental
                </h3>
                <p className="text-xs text-neutral-400">Cadastre um visitante para aula experimental</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Nome Completo do Visitante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: JOÃO DA SILVA"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="visitante@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Turma *
                  </label>
                  <select
                    value={newTurma}
                    onChange={(e) => setNewTurma(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.nome}>
                        {t.nome}
                      </option>
                    ))}
                    <option value="Jiu-Jitsu Adulto">Jiu-Jitsu Adulto</option>
                    <option value="Jiu-Jitsu Infantil">Jiu-Jitsu Infantil</option>
                    <option value="No-Gi / Submission">No-Gi / Submission</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Horário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="19:00 - 20:30"
                    value={newHorario}
                    onChange={(e) => setNewHorario(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                    Data da Aula *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDataAula}
                    onChange={(e) => setNewDataAula(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Observações Gerais
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Experiência prévia em judô, indicação de amigo..."
                  value={newObservacoes}
                  onChange={(e) => setNewObservacoes(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
                >
                  Salvar Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MOVE / EDIT PARTICIPANT (ADMIN ONLY) */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in space-y-4 text-left">
            <button
              onClick={() => setShowMoveModal(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Mover / Alterar Horário
                </h3>
                <p className="text-xs text-neutral-400">{showMoveModal.nome}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Nova Turma
                </label>
                <select
                  value={moveTurma}
                  onChange={(e) => setMoveTurma(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none cursor-pointer"
                >
                  {turmas.map((t) => (
                    <option key={t.id} value={t.nome}>
                      {t.nome}
                    </option>
                  ))}
                  <option value="Jiu-Jitsu Adulto">Jiu-Jitsu Adulto</option>
                  <option value="Jiu-Jitsu Infantil">Jiu-Jitsu Infantil</option>
                  <option value="No-Gi / Submission">No-Gi / Submission</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Horário
                </label>
                <input
                  type="text"
                  value={moveHorario}
                  onChange={(e) => setMoveHorario(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Data da Aula
                </label>
                <input
                  type="date"
                  value={moveDataAula}
                  onChange={(e) => setMoveDataAula(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 uppercase mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={moveObservacoes}
                  onChange={(e) => setMoveObservacoes(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-neutral-800 text-white text-xs rounded-xl p-3 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(null)}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMove}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION (ADMIN ONLY) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in space-y-4 text-left">
            <button
              onClick={() => setShowDeleteModal(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Excluir Inscrição
                </h3>
                <p className="text-xs text-neutral-400">{showDeleteModal.nome}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800">
              Tem certeza de que deseja remover permanentemente a inscrição de aula experimental para{' '}
              <strong className="text-white">{showDeleteModal.nome}</strong>? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in space-y-4 text-left">
            <button
              onClick={() => setShowDetailModal(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Ficha do Agendamento
                </h3>
                <p className="text-xs text-neutral-400">{showDetailModal.nome}</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-neutral-850 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Nome:</span>
                <span className="font-bold text-white">{showDetailModal.nome}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">WhatsApp:</span>
                <span className="font-mono text-orange-400 font-bold">{showDetailModal.whatsapp}</span>
              </div>
              {showDetailModal.email && (
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">E-mail:</span>
                  <span className="text-neutral-200">{showDetailModal.email}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Turma:</span>
                <span className="font-bold text-neutral-200">{showDetailModal.turma}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Horário:</span>
                <span className="font-bold text-neutral-200">{showDetailModal.horario}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Data Agendada:</span>
                <span className="font-mono text-neutral-200 font-bold">
                  {showDetailModal.dataAula
                    ? new Date(showDetailModal.dataAula + 'T00:00:00').toLocaleDateString('pt-BR')
                    : 'A definir'}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Professor:</span>
                <span className="text-neutral-200">{showDetailModal.professorNome || 'Mestre Responsável'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Status:</span>
                <span className="font-bold text-orange-400 uppercase">{showDetailModal.status}</span>
              </div>
              {showDetailModal.observacoes && (
                <div className="pt-1">
                  <span className="text-neutral-400 block mb-1">Observações:</span>
                  <p className="text-neutral-300 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                    {showDetailModal.observacoes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowDetailModal(null)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
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

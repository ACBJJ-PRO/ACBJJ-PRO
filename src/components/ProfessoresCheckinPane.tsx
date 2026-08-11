import React, { useState } from 'react';
import { User, ProfessorCheckinRecord } from '../types';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Award,
  Users,
  Eye,
  History,
  Check,
  X,
  Plus,
  ChevronDown,
  Shield,
  FileText,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface ProfessoresCheckinPaneProps {
  currentUser: User;
  professorCheckins: ProfessorCheckinRecord[];
  onAddCheckin: (record: ProfessorCheckinRecord) => void;
  onAprovarCheckin: (id: string, adminNome: string, adminId: number) => void;
  onRejeitarCheckin: (id: string, adminNome: string, adminId: number, motivo?: string) => void;
  onDeleteCheckin?: (id: string) => void;
  themeKey?: string;
}

export default function ProfessoresCheckinPane({
  currentUser,
  professorCheckins,
  onAddCheckin,
  onAprovarCheckin,
  onRejeitarCheckin,
  onDeleteCheckin,
  themeKey = 'orange',
}: ProfessoresCheckinPaneProps) {
  const isAdmin =
    currentUser.tipo === 'admin' ||
    (currentUser.tipo as string) === 'administrador' ||
    currentUser.email === 'admin@admin.com';

  // Local Filter & Search States
  const [searchName, setSearchName] = useState('');
  const [filterCargo, setFilterCargo] = useState<'todos' | 'professor' | 'instrutor'>('todos');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO'>('todos');
  const [filterData, setFilterData] = useState('');
  const [sortOrder, setSortOrder] = useState<'recentes' | 'antigos'>('recentes');

  // Modals States
  const [selectedDetails, setSelectedDetails] = useState<ProfessorCheckinRecord | null>(null);
  const [selectedUserHistory, setSelectedUserHistory] = useState<{ userId: number; nome: string } | null>(null);
  const [rejectingCheckinId, setRejectingCheckinId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletingRecord, setDeletingRecord] = useState<ProfessorCheckinRecord | null>(null);

  // Current Date / Time details
  const hojeStr = new Date().toISOString().split('T')[0];
  const anoMesStr = hojeStr.substring(0, 7);

  // Check if current user already registered checkin today
  const userCheckinHoje = professorCheckins.find(
    (c) => Number(c.usuarioId) === Number(currentUser.id) && c.data === hojeStr
  );

  // Registration Handler
  const handleRegistrarMinhaPresenca = () => {
    if (userCheckinHoje) {
      alert(`⚠️ Você já registrou sua presença hoje (${hojeStr})!\nStatus atual: ${userCheckinHoje.status}`);
      return;
    }

    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-BR');

    let cargoStr: 'professor' | 'instrutor' = 'professor';
    if (currentUser.tipo === 'instrutor' || currentUser.perfilLabel?.toLowerCase().includes('instrutor')) {
      cargoStr = 'instrutor';
    }

    const newRecord: ProfessorCheckinRecord = {
      id: `prof_chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      usuarioId: currentUser.id,
      nome: currentUser.nome,
      cargo: cargoStr,
      data: hojeStr,
      hora: horaFormatada,
      timestamp: Date.now(),
      status: 'PENDENTE',
    };

    onAddCheckin(newRecord);
    alert('✓ Presença registrada com sucesso!\nSua solicitação foi enviada ao Administrador Principal para homologação.');
  };

  // Rejection Submission Handler
  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCheckinId) return;
    onRejeitarCheckin(
      rejectingCheckinId,
      currentUser.nome || 'Administrador',
      currentUser.id,
      rejectionReason.trim()
    );
    setRejectingCheckinId(null);
    setRejectionReason('');
    alert('Presença rejeitada e registrada com sucesso.');
  };

  const handleDeleteRecord = (record: ProfessorCheckinRecord) => {
    setDeletingRecord(record);
  };

  const confirmDelete = () => {
    if (deletingRecord && onDeleteCheckin) {
      onDeleteCheckin(deletingRecord.id);
      if (selectedDetails?.id === deletingRecord.id) {
        setSelectedDetails(null);
      }
      setDeletingRecord(null);
    }
  };

  // Calculations for Metrics Dashboard
  const totalPendentes = professorCheckins.filter((c) => c.status === 'PENDENTE').length;
  const totalConfirmadas = professorCheckins.filter((c) => c.status === 'CONFIRMADO').length;
  const totalRejeitadas = professorCheckins.filter((c) => c.status === 'REJEITADO').length;
  const totalGeral = professorCheckins.length;
  const presencasHoje = professorCheckins.filter((c) => c.data === hojeStr).length;
  const presencasMes = professorCheckins.filter((c) => c.data && c.data.startsWith(anoMesStr)).length;

  // Filtered List for Admin View
  const filteredList = professorCheckins
    .filter((record) => {
      // Search Name
      if (searchName.trim()) {
        const query = searchName.toLowerCase().trim();
        if (!record.nome.toLowerCase().includes(query)) return false;
      }
      // Filter Cargo
      if (filterCargo !== 'todos') {
        if (record.cargo !== filterCargo) return false;
      }
      // Filter Status
      if (filterStatus !== 'todos') {
        if (record.status !== filterStatus) return false;
      }
      // Filter Data
      if (filterData.trim()) {
        if (record.data !== filterData.trim()) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'recentes') {
        return b.timestamp - a.timestamp;
      }
      return a.timestamp - b.timestamp;
    });

  // User's Own History List
  const userOwnHistory = professorCheckins
    .filter((c) => Number(c.usuarioId) === Number(currentUser.id))
    .sort((a, b) => b.timestamp - a.timestamp);

  // User History Modal Data
  const targetUserHistoryList = selectedUserHistory
    ? professorCheckins
        .filter((c) => Number(c.usuarioId) === Number(selectedUserHistory.userId))
        .sort((a, b) => b.timestamp - a.timestamp)
    : [];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* HEADER BAR */}
      <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-2xl text-orange-500">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Controle de Presença - Professores e Instrutores
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Registro autônomo de presença diária e painel de homologação do Administrador Principal
            </p>
          </div>
        </div>

        {/* Action Button to Register Presence - Only available for Teachers / Instructors (Not Admin) */}
        {!isAdmin && (
          <button
            type="button"
            onClick={handleRegistrarMinhaPresenca}
            disabled={Boolean(userCheckinHoje)}
            className={`py-3 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95 ${
              userCheckinHoje
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white shadow-orange-500/20'
            }`}
          >
            {userCheckinHoje ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Presença Hoje ({userCheckinHoje.status})</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 shrink-0" />
                <span>Registrar Minha Presença de Hoje</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* METRICS DASHBOARD - EXCLUSIVE/AVAILABLE TO ADMIN OR DISPLAY SUMMARY */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Pendentes */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-amber-500/30 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Pendentes</span>
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-white">{totalPendentes}</div>
            <p className="text-[9px] text-amber-400/80 mt-1 font-semibold">Aguardando análise</p>
          </div>

          {/* Confirmadas */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-emerald-500/30 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-emerald-500 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Confirmadas</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{totalConfirmadas}</div>
            <p className="text-[9px] text-emerald-400/80 mt-1 font-semibold">Presenças validadas</p>
          </div>

          {/* Rejeitadas */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-red-500/30 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-red-500 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Rejeitadas</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{totalRejeitadas}</div>
            <p className="text-[9px] text-red-400/80 mt-1 font-semibold">Indeferidas</p>
          </div>

          {/* Presenças Hoje */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-orange-500 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Presenças Hoje</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{presencasHoje}</div>
            <p className="text-[9px] text-neutral-400 mt-1 font-semibold">Data: {hojeStr}</p>
          </div>

          {/* Presenças no Mês */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-purple-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Neste Mês</span>
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{presencasMes}</div>
            <p className="text-[9px] text-neutral-400 mt-1 font-semibold">Competência mensal</p>
          </div>

          {/* Total Geral */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-blue-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Geral</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{totalGeral}</div>
            <p className="text-[9px] text-neutral-400 mt-1 font-semibold">Registros acumulados</p>
          </div>
        </div>
      )}

      {/* DASHBOARD LISTING FOR ADMIN */}
      {isAdmin ? (
        <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                Painel Geral de Solicitações e Histórico
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Aprovação, recusa e histórico consolidado dos docentes da academia
              </p>
            </div>

            {/* Quick Filter Counters */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('todos')}
                className={`py-1.5 px-3 rounded-lg font-bold border transition ${
                  filterStatus === 'todos'
                    ? 'bg-neutral-800 border-neutral-700 text-white'
                    : 'bg-[#1a1a1a] border-neutral-850 text-neutral-400 hover:text-white'
                }`}
              >
                Todos ({professorCheckins.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PENDENTE')}
                className={`py-1.5 px-3 rounded-lg font-bold border transition ${
                  filterStatus === 'PENDENTE'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-[#1a1a1a] border-neutral-850 text-neutral-400 hover:text-white'
                }`}
              >
                Pendentes ({totalPendentes})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('CONFIRMADO')}
                className={`py-1.5 px-3 rounded-lg font-bold border transition ${
                  filterStatus === 'CONFIRMADO'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-[#1a1a1a] border-neutral-850 text-neutral-400 hover:text-white'
                }`}
              >
                Confirmados ({totalConfirmadas})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('REJEITADO')}
                className={`py-1.5 px-3 rounded-lg font-bold border transition ${
                  filterStatus === 'REJEITADO'
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-[#1a1a1a] border-neutral-850 text-neutral-400 hover:text-white'
                }`}
              >
                Rejeitados ({totalRejeitadas})
              </button>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850">
            {/* Search Name */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Pesquisar por nome..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full bg-[#121212] text-white border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-orange-500 outline-none transition"
              />
            </div>

            {/* Filter Cargo */}
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value as any)}
              className="bg-[#121212] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
            >
              <option value="todos">Todos os Cargos</option>
              <option value="professor">Professor</option>
              <option value="instrutor">Instrutor</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-[#121212] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="PENDENTE">Status: PENDENTE</option>
              <option value="CONFIRMADO">Status: CONFIRMADO</option>
              <option value="REJEITADO">Status: REJEITADO</option>
            </select>

            {/* Filter Date */}
            <input
              type="date"
              value={filterData}
              onChange={(e) => setFilterData(e.target.value)}
              className="bg-[#121212] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
              title="Filtrar por data específica"
            />

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#121212] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-orange-500 outline-none transition cursor-pointer"
            >
              <option value="recentes">Mais Recentes Primeiro</option>
              <option value="antigos">Mais Antigos Primeiro</option>
            </select>
          </div>

          {/* LIST TABLE */}
          <div className="space-y-3">
            {filteredList.length > 0 ? (
              filteredList.map((record) => {
                const isPendente = record.status === 'PENDENTE';
                const isConfirmado = record.status === 'CONFIRMADO';
                const isRejeitado = record.status === 'REJEITADO';

                return (
                  <div
                    key={record.id}
                    className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 hover:border-neutral-750 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left"
                  >
                    {/* Left Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-white text-sm font-bold">{record.nome}</strong>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {record.cargo === 'instrutor' ? 'Instrutor' : 'Professor'}
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            isPendente
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : isConfirmado
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {isPendente && <Clock className="w-3 h-3 animate-pulse" />}
                          {isConfirmado && <CheckCircle className="w-3 h-3" />}
                          {isRejeitado && <XCircle className="w-3 h-3" />}
                          <span>{record.status}</span>
                        </span>
                      </div>

                      <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                        <span>📅 Data: <strong className="text-white">{record.data}</strong></span>
                        <span>⏰ Hora: <strong className="text-white">{record.hora}</strong></span>
                        {record.adminResponsavelNome && (
                          <span className="text-neutral-300 font-sans">
                            Avaliador: <strong className="text-orange-400">{record.adminResponsavelNome}</strong>
                          </span>
                        )}
                        {record.dataConfirmacao && (
                          <span className="text-neutral-500">({record.dataConfirmacao})</span>
                        )}
                      </div>

                      {record.motivoRejeicao && (
                        <div className="text-xs text-red-400/90 bg-red-950/20 border border-red-500/20 p-2 rounded-lg mt-1 leading-relaxed">
                          ⚠️ <strong>Motivo da Recusa:</strong> "{record.motivoRejeicao}"
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-neutral-850">
                      {isPendente && (
                        <>
                          <button
                            type="button"
                            onClick={() => onAprovarCheckin(record.id, currentUser.nome || 'Administrador', currentUser.id)}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                            title="Confirmar presença deste professor"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRejectingCheckinId(record.id);
                              setRejectionReason('');
                            }}
                            className="py-1.5 px-3 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                            title="Rejeitar solicitação"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rejeitar</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedDetails(record)}
                        className="py-1.5 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Ver Detalhes do Registro"
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-500" />
                        <span className="hidden sm:inline">Detalhes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedUserHistory({ userId: record.usuarioId, nome: record.nome })}
                        className="py-1.5 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Ver histórico de presença deste professor"
                      >
                        <History className="w-3.5 h-3.5 text-blue-400" />
                        <span className="hidden sm:inline">Histórico</span>
                      </button>

                      {isAdmin && onDeleteCheckin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(record)}
                          className="py-1.5 px-2.5 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Excluir este registro de presença"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-neutral-850 opacity-60 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-neutral-500" />
                <p className="text-sm font-semibold text-neutral-300">Nenhum registro de presença encontrado.</p>
                <p className="text-xs text-neutral-500">Ajuste os filtros de pesquisa ou aguarde novos check-ins.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TEACHER / INSTRUCTOR PERSONAL VIEW */
        <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-6">
          <div className="border-b border-neutral-900 pb-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              Meu Histórico de Presenças
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Registro completo de todas as suas solicitações de presença e seus respectivos status
            </p>
          </div>

          <div className="space-y-3">
            {userOwnHistory.length > 0 ? (
              userOwnHistory.map((record) => {
                const isPendente = record.status === 'PENDENTE';
                const isConfirmado = record.status === 'CONFIRMADO';
                const isRejeitado = record.status === 'REJEITADO';

                return (
                  <div
                    key={record.id}
                    className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">📅 {record.data}</span>
                        <span className="text-xs text-neutral-400 font-mono">⏰ {record.hora}</span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            isPendente
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : isConfirmado
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>

                      {record.adminResponsavelNome && (
                        <p className="text-xs text-neutral-400">
                          Homologado por: <strong className="text-neutral-200">{record.adminResponsavelNome}</strong> em {record.dataConfirmacao}
                        </p>
                      )}

                      {record.motivoRejeicao && (
                        <p className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-2 rounded-lg mt-1">
                          Motivo da Recusa: "{record.motivoRejeicao}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 opacity-50 text-xs">
                Você ainda não registrou nenhuma presença. Clique em "Registrar Minha Presença de Hoje" no topo!
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REJEITAR PRESENÇA (MOTIVO OPCIONAL) */}
      {rejectingCheckinId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => setRejectingCheckinId(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-500 mb-5 pb-2 border-b border-neutral-900">
              <XCircle className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold text-white">Rejeitar Presença</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Informe o motivo da recusa (opcional)</p>
              </div>
            </div>

            <form onSubmit={handleConfirmRejection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-semibold block">Motivo da Rejeição (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Não compareceu à aula / horário divergente / justificativa pendente..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-red-500 outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setRejectingCheckinId(null)}
                  className="flex-1 border border-neutral-800 text-neutral-400 py-2.5 rounded-xl text-xs hover:text-white hover:border-neutral-700 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR DETALHES COMPLETOS DO REGISTRO */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-lg w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => setSelectedDetails(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-orange-500 mb-5 pb-3 border-b border-neutral-900">
              <FileText className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-extrabold text-white">Detalhes do Registro de Presença</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">ID: {selectedDetails.id}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Nome do Docente:</span>
                  <strong className="text-white font-bold">{selectedDetails.nome}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Cargo:</span>
                  <strong className="text-orange-400 font-bold uppercase">{selectedDetails.cargo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Status da Solicitação:</span>
                  <strong
                    className={
                      selectedDetails.status === 'CONFIRMADO'
                        ? 'text-emerald-400 font-bold'
                        : selectedDetails.status === 'REJEITADO'
                        ? 'text-red-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {selectedDetails.status}
                  </strong>
                </div>
              </div>

              <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Data do Check-in:</span>
                  <span className="text-white font-bold">{selectedDetails.data}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Hora do Check-in:</span>
                  <span className="text-white font-bold">{selectedDetails.hora}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Timestamp Unix:</span>
                  <span className="text-neutral-300">{selectedDetails.timestamp}</span>
                </div>
              </div>

              {selectedDetails.adminResponsavelNome && (
                <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Administrador Responsável:</span>
                    <strong className="text-white font-bold">{selectedDetails.adminResponsavelNome}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Data/Hora da Análise:</span>
                    <span className="text-neutral-300 font-mono">{selectedDetails.dataConfirmacao}</span>
                  </div>
                </div>
              )}

              {selectedDetails.motivoRejeicao && (
                <div className="bg-red-950/20 border border-red-500/30 p-3.5 rounded-xl space-y-1">
                  <span className="text-red-400 font-bold block">Motivo da Rejeição:</span>
                  <p className="text-red-300 leading-relaxed">{selectedDetails.motivoRejeicao}</p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-5 border-t border-neutral-900 flex items-center justify-between">
              {isAdmin && onDeleteCheckin ? (
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteRecord(selectedDetails);
                  }}
                  className="bg-red-950/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Registro</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO COMPLETO DO PROFESSOR */}
      {selectedUserHistory && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-2xl w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left flex flex-col max-h-[85vh]">
            <button
              onClick={() => setSelectedUserHistory(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-blue-400 mb-4 pb-3 border-b border-neutral-900">
              <History className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-extrabold text-white">Histórico Completo de Presenças</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Docente: <strong className="text-white">{selectedUserHistory.nome}</strong>
                </p>
              </div>
            </div>

            {/* Quick Stats bar inside history modal */}
            <div className="grid grid-cols-4 gap-2 mb-4 bg-[#1a1a1a] p-3 rounded-xl border border-neutral-850 text-center">
              <div>
                <span className="text-[9px] text-neutral-400 block font-bold uppercase">Total</span>
                <span className="text-base font-black text-white">{targetUserHistoryList.length}</span>
              </div>
              <div>
                <span className="text-[9px] text-emerald-400 block font-bold uppercase">Aprovados</span>
                <span className="text-base font-black text-emerald-400">
                  {targetUserHistoryList.filter((c) => c.status === 'CONFIRMADO').length}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-amber-400 block font-bold uppercase">Pendentes</span>
                <span className="text-base font-black text-amber-400">
                  {targetUserHistoryList.filter((c) => c.status === 'PENDENTE').length}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-red-400 block font-bold uppercase">Rejeitados</span>
                <span className="text-base font-black text-red-400">
                  {targetUserHistoryList.filter((c) => c.status === 'REJEITADO').length}
                </span>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {targetUserHistoryList.length > 0 ? (
                targetUserHistoryList.map((record) => (
                  <div
                    key={record.id}
                    className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">📅 {record.data}</span>
                        <span className="text-neutral-400 font-mono">⏰ {record.hora}</span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            record.status === 'CONFIRMADO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : record.status === 'REJEITADO'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                      {record.adminResponsavelNome && (
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Avaliador: {record.adminResponsavelNome} ({record.dataConfirmacao})
                        </p>
                      )}
                      {record.motivoRejeicao && (
                        <p className="text-[11px] text-red-400 mt-0.5 font-sans">
                          Recusa: "{record.motivoRejeicao}"
                        </p>
                      )}
                    </div>

                    {isAdmin && onDeleteCheckin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(record)}
                        className="py-1 px-2.5 bg-red-950/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                        title="Excluir este registro"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-50 text-xs">Nenhum histórico registrado para este docente.</div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-900 text-right">
              <button
                type="button"
                onClick={() => setSelectedUserHistory(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE REGISTRO DE PRESENÇA */}
      {deletingRecord && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl relative animate-scale-in text-left space-y-4">
            <button
              type="button"
              onClick={() => setDeletingRecord(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-500 border-b border-neutral-850 pb-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Confirmar Exclusão</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Excluir registro de presença permanente</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Tem certeza que deseja excluir permanentemente o registro de presença de <strong className="text-white">{deletingRecord.nome}</strong>?
            </p>

            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-400">Docente:</span>
                <span className="text-white font-bold">{deletingRecord.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cargo:</span>
                <span className="text-neutral-300 capitalize">{deletingRecord.cargo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Data / Hora:</span>
                <span className="text-white">{deletingRecord.data} às {deletingRecord.hora}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Status Atual:</span>
                <span className={`font-bold uppercase ${
                  deletingRecord.status === 'CONFIRMADO'
                    ? 'text-emerald-400'
                    : deletingRecord.status === 'REJEITADO'
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}>
                  {deletingRecord.status}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
              ⚠️ Esta ação não pode ser desfeita. O registro será removido e os indicadores/gráficos do Dashboard serão recalculados automaticamente.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="py-2.5 px-5 bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-red-600/20 active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

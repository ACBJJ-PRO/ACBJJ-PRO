import React, { useState, useMemo } from 'react';
import { Notification, Student, User, ClassUnit } from '../types';
import {
  Bell,
  Send,
  Users,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Eye,
  Archive,
  RotateCcw,
  Settings,
  Sparkles,
  ShieldAlert,
  Inbox,
  BarChart3,
  Edit3,
  Tag,
  MessageSquare,
  AlertOctagon,
  Check,
  X,
  Layers,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  getUserKey,
  markUserNotifsAsRead,
  markNotificationViewed
} from '../utils/notificationUtils';

interface NotificacoesCentralPaneProps {
  user: User;
  alunos: Student[];
  turmas?: ClassUnit[];
  notificacoes: Notification[];
  onEnviarNotificacao: (newNotif: Notification) => void;
  onRemoverNotificacao: (notifId: string) => void;
  onRemoverVariasNotificacoes: (notifIds: string[]) => void;
  onAtualizarNotificacao: (updatedNotif: Notification) => void;
  onZerarNotificacoes: () => void;
}

export default function NotificacoesCentralPane({
  user,
  alunos = [],
  turmas = [],
  notificacoes = [],
  onEnviarNotificacao,
  onRemoverNotificacao,
  onRemoverVariasNotificacoes,
  onAtualizarNotificacao,
  onZerarNotificacoes,
}: NotificacoesCentralPaneProps) {
  const [activeTab, setActiveTab] = useState<
    'transmissao' | 'historico' | 'recebidas' | 'agendadas' | 'arquivadas' | 'limpeza' | 'configuracoes'
  >('historico');

  // Transmissao / Nova Form state
  const [targetType, setTargetType] = useState<
    'todos' | 'individual' | 'turma' | 'faixa' | 'administradores' | 'professores'
  >('todos');
  const [selectedStudentId, setSelectedStudentId] = useState<number>(alunos[0]?.id || 0);
  const [selectedTurma, setSelectedTurma] = useState<string>(turmas[0]?.nome || '');
  const [selectedFaixa, setSelectedFaixa] = useState<string>('Faixa Branca');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [categoria, setCategoria] = useState<
    'Aula' | 'Evento' | 'Campeonato' | 'Aviso' | 'Financeiro' | 'Sistema' | 'IA' | 'Suporte' | 'Personalizado'
  >('Aviso');
  const [prioridade, setPrioridade] = useState<'Normal' | 'Importante' | 'Urgente'>('Normal');
  const [isAgendada, setIsAgendada] = useState(false);
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');

  // History Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [filterPriority, setFilterPriority] = useState<string>('Todas');
  const [filterPeriod, setFilterPeriod] = useState<'todos' | 'hoje' | 'semana' | 'mes'>('todos');
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);

  // Modals state
  const [viewNotifModal, setViewNotifModal] = useState<Notification | null>(null);
  const [editNotifModal, setEditNotifModal] = useState<Notification | null>(null);
  const [deleteNotifId, setDeleteNotifId] = useState<string | null>(null);
  const [showZerarModal, setShowZerarModal] = useState(false);
  const [zerarConfirmText, setZerarConfirmText] = useState('');

  // Maintenance Bulk Selection State
  const [bulkCategory, setBulkCategory] = useState<string>('Aviso');
  const [bulkDays, setBulkDays] = useState<number>(30);

  const adminKey = getUserKey(user);

  // Top Metrics Calculation
  const metrics = useMemo(() => {
    const total = notificacoes.length;
    const hoje = new Date().toISOString().slice(0, 10);
    const emitidasHoje = notificacoes.filter((n) => n.data === hoje).length;
    const agendadas = notificacoes.filter((n) => n.agendadaPara || n.status === 'Agendada').length;
    const arquivadas = notificacoes.filter((n) => n.arquivada).length;
    const urgentes = notificacoes.filter((n) => n.prioridade === 'Urgente').length;

    const byCat: { [key: string]: number } = {};
    notificacoes.forEach((n) => {
      const c = n.categoria || 'Aviso';
      byCat[c] = (byCat[c] || 0) + 1;
    });

    return { total, emitidasHoje, agendadas, arquivadas, urgentes, byCat };
  }, [notificacoes]);

  // Filtered Notifications List for History Tab
  const filteredHistory = useMemo(() => {
    return notificacoes.filter((n) => {
      if (n.arquivada) return false;
      if (n.agendadaPara && new Date(n.agendadaPara) > new Date()) return false;

      // Category filter
      if (filterCategory !== 'Todas' && (n.categoria || 'Aviso') !== filterCategory) {
        return false;
      }

      // Priority filter
      if (filterPriority !== 'Todas' && (n.prioridade || 'Normal') !== filterPriority) {
        return false;
      }

      // Period filter
      if (filterPeriod !== 'todos') {
        const itemDateStr = n.data;
        if (itemDateStr) {
          const itemDate = new Date(itemDateStr);
          const now = new Date();
          if (filterPeriod === 'hoje') {
            if (itemDateStr !== now.toISOString().slice(0, 10)) return false;
          } else if (filterPeriod === 'semana') {
            const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays > 7) return false;
          } else if (filterPeriod === 'mes') {
            const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays > 30) return false;
          }
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = (n.texto || '').toLowerCase().includes(q);
        const titleMatch = (n.titulo || '').toLowerCase().includes(q);
        const deMatch = (n.de || '').toLowerCase().includes(q);
        const paraMatch = (n.para || '').toLowerCase().includes(q);
        if (!textMatch && !titleMatch && !deMatch && !paraMatch) return false;
      }

      return true;
    });
  }, [notificacoes, filterCategory, filterPriority, filterPeriod, searchQuery]);

  // Scheduled List
  const scheduledList = useMemo(() => {
    return notificacoes.filter((n) => !n.arquivada && (n.agendadaPara || n.status === 'Agendada'));
  }, [notificacoes]);

  // Archived List
  const archivedList = useMemo(() => {
    return notificacoes.filter((n) => n.arquivada);
  }, [notificacoes]);

  // Received / System Notifications List
  const receivedList = useMemo(() => {
    return notificacoes.filter(
      (n) =>
        n.tipo === 'recebida' ||
        n.tipo === 'sistema' ||
        n.categoria === 'Suporte' ||
        n.categoria === 'IA' ||
        n.categoria === 'Sistema'
    );
  }, [notificacoes]);

  // Send Notification Handler
  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) {
      alert('Por favor, informe a mensagem da notificação.');
      return;
    }

    let targetName = 'Todos os alunos';
    if (targetType === 'individual') {
      const student = alunos.find((a) => a.id === selectedStudentId);
      if (!student) {
        alert('Selecione um atleta válido.');
        return;
      }
      targetName = student.nome;
    } else if (targetType === 'turma') {
      targetName = `Turma: ${selectedTurma || 'Geral'}`;
    } else if (targetType === 'faixa') {
      targetName = `Atletas: ${selectedFaixa}`;
    } else if (targetType === 'administradores') {
      targetName = 'Administradores';
    } else if (targetType === 'professores') {
      targetName = 'Professores e Instrutores';
    }

    const now = new Date();
    const dataStr = now.toISOString().slice(0, 10);
    const horaStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let agendadaParaStr: string | undefined = undefined;
    if (isAgendada && dataAgendamento) {
      agendadaParaStr = `${dataAgendamento}T${horaAgendamento || '08:00'}:00`;
    }

    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      titulo: titulo.trim() || `Notificação de ${categoria}`,
      texto: mensagem.trim(),
      data: dataStr,
      hora: horaStr,
      para: targetName,
      de: user.nome || 'Administrador',
      categoria,
      prioridade,
      status: agendadaParaStr ? 'Agendada' : 'Enviada',
      visualizacoes: 0,
      lidaPor: [adminKey],
      arquivada: false,
      agendadaPara: agendadaParaStr,
      turma: targetType === 'turma' ? selectedTurma : '',
      faixaTarget: targetType === 'faixa' ? selectedFaixa : '',
      tipo: 'enviada',
    };

    onEnviarNotificacao(newNotif);

    alert(
      agendadaParaStr
        ? `Notificação agendada com sucesso para ${dataAgendamento} ${horaAgendamento}!`
        : 'Notificação transmitida e enviada com sucesso!'
    );

    // Reset Form
    setTitulo('');
    setMensagem('');
    setIsAgendada(false);
    setDataAgendamento('');
    setHoraAgendamento('');
  };

  // Bulk deletion handlers
  const handleBulkDeleteByCategory = () => {
    const toDelete = notificacoes
      .filter((n) => (n.categoria || 'Aviso') === bulkCategory)
      .map((n) => n.id);

    if (toDelete.length === 0) {
      alert(`Nenhuma notificação encontrada na categoria "${bulkCategory}".`);
      return;
    }

    if (confirm(`Deseja excluir permanentemente ${toDelete.length} notificações da categoria "${bulkCategory}"?`)) {
      onRemoverVariasNotificacoes(toDelete);
      alert(`${toDelete.length} notificações removidas com sucesso.`);
    }
  };

  const handleBulkDeleteByDays = () => {
    const now = Date.now();
    const cutoffMs = bulkDays * 24 * 60 * 60 * 1000;

    const toDelete = notificacoes
      .filter((n) => {
        if (!n.data) return false;
        const d = Date.parse(n.data);
        return !isNaN(d) && now - d > cutoffMs;
      })
      .map((n) => n.id);

    if (toDelete.length === 0) {
      alert(`Nenhuma notificação encontrada com mais de ${bulkDays} dias.`);
      return;
    }

    if (confirm(`Deseja excluir permanentemente ${toDelete.length} notificações com mais de ${bulkDays} dias?`)) {
      onRemoverVariasNotificacoes(toDelete);
      alert(`${toDelete.length} notificações antigas foram excluídas.`);
    }
  };

  // Select all history items for batch actions
  const handleToggleSelectAll = () => {
    if (selectedNotifIds.length === filteredHistory.length) {
      setSelectedNotifIds([]);
    } else {
      setSelectedNotifIds(filteredHistory.map((n) => n.id));
    }
  };

  const handleToggleSelectNotif = (id: string) => {
    if (selectedNotifIds.includes(id)) {
      setSelectedNotifIds(selectedNotifIds.filter((i) => i !== id));
    } else {
      setSelectedNotifIds([...selectedNotifIds, id]);
    }
  };

  const handleBatchDeleteSelected = () => {
    if (selectedNotifIds.length === 0) return;
    if (confirm(`Excluir permanentemente ${selectedNotifIds.length} notificações selecionadas?`)) {
      onRemoverVariasNotificacoes(selectedNotifIds);
      setSelectedNotifIds([]);
    }
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'Urgente':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-red-400 animate-pulse" /> Urgente
          </span>
        );
      case 'Importante':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Importante
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
            Normal
          </span>
        );
    }
  };

  const getCategoryBadge = (c?: string) => {
    const cat = c || 'Aviso';
    let color = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (cat === 'Aula') color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (cat === 'Evento') color = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (cat === 'Campeonato') color = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    if (cat === 'Financeiro') color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (cat === 'IA' || cat === 'Suporte') color = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${color}`}>
        {cat}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* HEADER TITLE BLOCK */}
      <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-orange-500">
            <Bell className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              Central de Gerenciamento de Notificações
            </h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Gestão inteligente de transmissões, alertas automatizados, logs de leitura e manutenção da base de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('transmissao')}
            className="py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Nova Transmissão
          </button>
        </div>
      </div>

      {/* TOP DASHBOARD METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total de Transmissões</span>
            <Layers className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-2xl font-black text-white block">{metrics.total}</span>
          <span className="text-[10px] text-neutral-500 block">Registradas na base</span>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Emitidas Hoje</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 block">{metrics.emitidasHoje}</span>
          <span className="text-[10px] text-neutral-500 block">Nas últimas 24 horas</span>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Agendadas</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-cyan-400 block">{metrics.agendadas}</span>
          <span className="text-[10px] text-neutral-500 block">Aguardando disparo</span>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Urgentes</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-black text-red-400 block">{metrics.urgentes}</span>
          <span className="text-[10px] text-neutral-500 block">Alta prioridade</span>
        </div>

        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Arquivadas</span>
            <Archive className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-purple-400 block">{metrics.arquivadas}</span>
          <span className="text-[10px] text-neutral-500 block">Fora do fluxo ativo</span>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-neutral-850 no-scrollbar">
        {[
          { id: 'historico', label: 'Histórico Geral', icon: Layers, count: filteredHistory.length },
          { id: 'transmissao', label: 'Nova Notificação', icon: Send },
          { id: 'recebidas', label: 'Recebidas & Sistema', icon: Inbox, count: receivedList.length },
          { id: 'agendadas', label: 'Agendadas', icon: Clock, count: scheduledList.length },
          { id: 'arquivadas', label: 'Arquivadas', icon: Archive, count: archivedList.length },
          { id: 'limpeza', label: 'Gerenciamento & Limpeza', icon: Trash2 },
          { id: 'configuracoes', label: 'Configurações', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-[#141414] text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    isActive ? 'bg-black/30 text-white' : 'bg-neutral-800 text-orange-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: HISTÓRICO GERAL DE NOTIFICAÇÕES --- */}
      {activeTab === 'historico' && (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md space-y-6">
          {/* SEARCH & FILTERS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por título, conteúdo, remetente ou destino..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="Todas">📁 Todas as Categorias</option>
                <option value="Aula">🥋 Aula</option>
                <option value="Evento">🎉 Evento</option>
                <option value="Campeonato">🏆 Campeonato</option>
                <option value="Aviso">📢 Aviso Geral</option>
                <option value="Financeiro">💰 Financeiro</option>
                <option value="Sistema">⚙️ Sistema</option>
                <option value="IA">🤖 IA & Análises</option>
                <option value="Suporte">🎫 Suporte</option>
              </select>
            </div>

            <div>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="todos">📅 Todo o Período</option>
                <option value="hoje">☀️ Apenas Hoje</option>
                <option value="semana">🗓️ Últimos 7 Dias</option>
                <option value="mes">📆 Últimos 30 Dias</option>
              </select>
            </div>
          </div>

          {/* BATCH ACTIONS BAR */}
          {selectedNotifIds.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl flex items-center justify-between gap-4 animate-fade-in">
              <span className="text-xs font-bold text-orange-400">
                {selectedNotifIds.length} notificações selecionadas
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBatchDeleteSelected}
                  className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Selecionadas
                </button>
                <button
                  onClick={() => setSelectedNotifIds([])}
                  className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* HISTORY TABLE / CARDS */}
          {filteredHistory.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-500 font-mono px-1">
                <span>Exibindo {filteredHistory.length} notificações</span>
                <button
                  onClick={handleToggleSelectAll}
                  className="hover:text-orange-400 transition cursor-pointer font-bold"
                >
                  {selectedNotifIds.length === filteredHistory.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              </div>

              {filteredHistory.map((n) => {
                const isSelected = selectedNotifIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    className={`bg-[#1a1a1a] p-4 rounded-xl border transition shadow-sm space-y-3 ${
                      isSelected ? 'border-orange-500 bg-orange-500/5' : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectNotif(n.id)}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getCategoryBadge(n.categoria)}
                            {getPriorityBadge(n.prioridade)}
                            <span className="text-[10px] text-neutral-500 font-mono">
                              📅 {n.data} {n.hora ? `às ${n.hora}` : ''}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">
                            {n.titulo || 'Notificação sem título'}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          Para: <span className="text-orange-400">{n.para}</span>
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          De: <span className="text-white">{n.de}</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed bg-black/20 p-3 rounded-lg border border-neutral-850">
                      {n.texto}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-850 text-xs text-neutral-400">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-neutral-400" title="Visualizações registradas">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> {n.visualizacoes || 0} visualizações
                        </span>
                        {n.lidaPor && n.lidaPor.length > 0 && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Lida por {n.lidaPor.length} destinatários
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setViewNotifModal(n);
                            onAtualizarNotificacao({
                              ...n,
                              visualizacoes: (n.visualizacoes || 0) + 1,
                            });
                          }}
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Detalhes & Estatísticas"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> Ver Detalhes
                        </button>

                        <button
                          onClick={() => setEditNotifModal(n)}
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Editar Conteúdo"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Editar
                        </button>

                        <button
                          onClick={() => {
                            onAtualizarNotificacao({
                              ...n,
                              arquivada: true,
                              status: 'Arquivada',
                            });
                          }}
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Arquivar Notificação"
                        >
                          <Archive className="w-3.5 h-3.5 text-purple-400" /> Arquivar
                        </button>

                        <button
                          onClick={() => setDeleteNotifId(n.id)}
                          className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Excluir Definitivamente da Base"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 opacity-60 space-y-2">
              <Inbox className="w-10 h-10 text-neutral-500 mx-auto" />
              <p className="text-sm font-bold text-neutral-300">Nenhuma notificação encontrada no histórico.</p>
              <p className="text-xs text-neutral-500">Tente ajustar os filtros de busca ou crie uma nova transmissão.</p>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: NOVA TRANSMISSÃO DE NOTIFICAÇÃO --- */}
      {activeTab === 'transmissao' && (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md max-w-3xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
            <Send className="w-5.5 h-5.5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Nova Transmissão</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Dispare mensagens direcionadas ou alertas para a academia</p>
            </div>
          </div>

          <form onSubmit={handleSendSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400 uppercase block">Destinatário / Canal *</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="todos">📢 Todos os Alunos e Atletas</option>
                  <option value="individual">👤 Atleta Específico (Individual)</option>
                  <option value="turma">🥋 Turma Específica</option>
                  <option value="faixa">🥋 Por Graduação / Faixa</option>
                  <option value="administradores">🛡️ Apenas Administradores</option>
                  <option value="professores">👨‍🏫 Professores e Instrutores</option>
                </select>
              </div>

              {targetType === 'individual' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase block">Selecionar Atleta *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                  >
                    {alunos.map((a) => (
                      <option key={a.id} value={a.id}>
                        🥋 {a.nome} ({a.faixa})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'turma' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase block">Selecionar Turma *</label>
                  <select
                    value={selectedTurma}
                    onChange={(e) => setSelectedTurma(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                  >
                    {turmas.length > 0 ? (
                      turmas.map((t) => (
                        <option key={t.id} value={t.nome}>
                          {t.nome} ({t.horario})
                        </option>
                      ))
                    ) : (
                      <option value="Turma Geral">Turma Geral de Jiu-Jitsu</option>
                    )}
                  </select>
                </div>
              )}

              {targetType === 'faixa' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase block">Selecionar Faixa *</label>
                  <select
                    value={selectedFaixa}
                    onChange={(e) => setSelectedFaixa(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="Faixa Branca">Faixa Branca</option>
                    <option value="Faixa Azul">Faixa Azul</option>
                    <option value="Faixa Roxa">Faixa Roxa</option>
                    <option value="Faixa Marrom">Faixa Marrom</option>
                    <option value="Faixa Preta">Faixa Preta</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400 uppercase block">Categoria *</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="Aviso">📢 Aviso Geral</option>
                  <option value="Aula">🥋 Treinos e Aulas</option>
                  <option value="Evento">🎉 Evento / Seminário</option>
                  <option value="Campeonato">🏆 Campeonato / Torneio</option>
                  <option value="Financeiro">💰 Financeiro / Mensalidade</option>
                  <option value="Sistema">⚙️ Comunicado do Sistema</option>
                  <option value="Personalizado">✏️ Personalizado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400 uppercase block">Nível de Nivelamento / Prioridade *</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as any)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="Normal">🟢 Normal (Aviso de Rotina)</option>
                  <option value="Importante">🟡 Importante (Destaque Visual)</option>
                  <option value="Urgente">🔴 Urgente (Alerta Prioritário)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-400 uppercase block">Título da Notificação Opcional</label>
              <input
                type="text"
                placeholder="Ex: Mudança no Horário de Treino / Aviso de Feriado"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-400 uppercase block">Mensagem *</label>
              <textarea
                required
                rows={5}
                placeholder="Escreva a mensagem técnica, aviso de feriado ou convocação para torneio..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none min-h-[120px]"
              />
            </div>

            {/* SCHEDULING TOGGLE */}
            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-300">
                <input
                  type="checkbox"
                  checked={isAgendada}
                  onChange={(e) => setIsAgendada(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span>Agendar Envio Futuro (Data e Hora)</span>
              </label>

              {isAgendada && (
                <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Data do Envio</label>
                    <input
                      type="date"
                      value={dataAgendamento}
                      onChange={(e) => setDataAgendamento(e.target.value)}
                      className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Hora do Envio</label>
                    <input
                      type="time"
                      value={horaAgendamento}
                      onChange={(e) => setHoraAgendamento(e.target.value)}
                      className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isAgendada ? 'Confirmar Agendamento' : 'Transmitir Notificação Agora'}</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 3: RECEBIDAS & SISTEMA --- */}
      {activeTab === 'recebidas' && (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
            <Inbox className="w-5.5 h-5.5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Notificações Recebidas e do Sistema</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Mensagens de suporte, diagnósticos da IA e alertas automáticos</p>
            </div>
          </div>

          {receivedList.length > 0 ? (
            <div className="space-y-3">
              {receivedList.map((n) => (
                <div key={n.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(n.categoria)}
                      <span className="text-[10px] text-neutral-500 font-mono">📅 {n.data}</span>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400">De: {n.de}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{n.titulo || 'Alerta de Sistema'}</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed bg-black/20 p-3 rounded-lg">{n.texto}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 opacity-60 text-xs">Nenhum aviso de sistema ou mensagem recebida registrada.</div>
          )}
        </div>
      )}

      {/* --- TAB 4: AGENDADAS --- */}
      {activeTab === 'agendadas' && (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
            <Clock className="w-5.5 h-5.5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Notificações Agendadas</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Transmissões programadas para disparar em datas futuras</p>
            </div>
          </div>

          {scheduledList.length > 0 ? (
            <div className="space-y-3">
              {scheduledList.map((n) => (
                <div key={n.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-extrabold rounded">
                        🕒 Programado para {n.agendadaPara ? new Date(n.agendadaPara).toLocaleString('pt-BR') : 'Data futura'}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoverNotificacao(n.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar Agendamento
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white">{n.titulo}</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed bg-black/20 p-3 rounded-lg">{n.texto}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 opacity-60 text-xs">Nenhuma notificação agendada para datas futuras.</div>
          )}
        </div>
      )}

      {/* --- TAB 5: ARQUIVADAS --- */}
      {activeTab === 'arquivadas' && (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
            <Archive className="w-5.5 h-5.5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Notificações Arquivadas</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Registros removidos do fluxo ativo mas armazenados para auditoria</p>
            </div>
          </div>

          {archivedList.length > 0 ? (
            <div className="space-y-3">
              {archivedList.map((n) => (
                <div key={n.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 space-y-2 opacity-80">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-neutral-500">📅 Arquivada | {n.data}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onAtualizarNotificacao({
                            ...n,
                            arquivada: false,
                            status: 'Enviada',
                          })
                        }
                        className="py-1 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-400" /> Restaurar
                      </button>
                      <button
                        onClick={() => onRemoverNotificacao(n.id)}
                        className="py-1 px-2 bg-red-950/50 text-red-400 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white">{n.titulo || 'Notificação'}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{n.texto}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 opacity-60 text-xs">Nenhuma notificação arquivada.</div>
          )}
        </div>
      )}

      {/* --- TAB 6: GERENCIAMENTO & LIMPEZA EM MASSA --- */}
      {activeTab === 'limpeza' && (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
            <Trash2 className="w-5.5 h-5.5 text-red-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Gerenciamento e Limpeza Definitiva</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Ferramentas de expurgo para otimizar o banco de dados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LIMPEZA POR CATEGORIA */}
            <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-800 space-y-4">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" /> Limpeza por Categoria
              </h4>
              <p className="text-xs text-neutral-400">Exclua todas as notificações pertencentes a um grupo específico.</p>

              <div className="space-y-3">
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs"
                >
                  <option value="Aviso">📢 Aviso Geral</option>
                  <option value="Aula">🥋 Treinos e Aulas</option>
                  <option value="Evento">🎉 Evento</option>
                  <option value="Campeonato">🏆 Campeonato</option>
                  <option value="Financeiro">💰 Financeiro</option>
                  <option value="Sistema">⚙️ Sistema</option>
                </select>

                <button
                  onClick={handleBulkDeleteByCategory}
                  className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Categoria "{bulkCategory}"
                </button>
              </div>
            </div>

            {/* LIMPEZA POR TEMPO / IDADE */}
            <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-800 space-y-4">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" /> Expulso por Antiguidade
              </h4>
              <p className="text-xs text-neutral-400">Remova automaticamente mensagens antigas do banco de dados.</p>

              <div className="space-y-3">
                <select
                  value={bulkDays}
                  onChange={(e) => setBulkDays(parseInt(e.target.value))}
                  className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs"
                >
                  <option value={7}>Mais de 7 dias</option>
                  <option value={30}>Mais de 30 dias</option>
                  <option value={90}>Mais de 90 dias</option>
                  <option value={365}>Mais de 1 ano</option>
                </select>

                <button
                  onClick={handleBulkDeleteByDays}
                  className="w-full py-2.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Notificações &gt; {bulkDays} Dias
                </button>
              </div>
            </div>
          </div>

          {/* DANGER ZONE: ZERAR NOTIFICAÇÕES */}
          <div className="p-5 rounded-2xl border-2 border-red-500/40 bg-gradient-to-r from-red-950/30 via-neutral-900 to-black space-y-4 mt-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-sm font-black text-red-400 uppercase tracking-wider">
                  ⚠️ ZERAR BASE DE NOTIFICAÇÕES (LIMPEZA TOTAL)
                </h4>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Esta ação excluirá DEFINITIVAMENTE TODAS as notificações do sistema, apagando registros do banco de dados e do histórico de todos os usuários.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowZerarModal(true)}
              className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition cursor-pointer"
            >
              ZERAR TODAS AS NOTIFICAÇÕES
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 7: CONFIGURAÇÕES & PREFERÊNCIAS --- */}
      {activeTab === 'configuracoes' && (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md max-w-2xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
            <Settings className="w-5.5 h-5.5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Configurações de Transmissão</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Defina comportamentos padrão do canal de notificações</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#1a1a1a] rounded-xl border border-neutral-800 space-y-2">
              <label className="font-bold text-white block">Prioridade Padrão de Disparo</label>
              <select className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-lg p-2 text-xs">
                <option value="Normal">🟢 Normal (Recomendado)</option>
                <option value="Importante">🟡 Importante</option>
              </select>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-xl border border-neutral-800 space-y-2">
              <label className="font-bold text-white block">Regra de Expiração Automática</label>
              <select className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-lg p-2 text-xs">
                <option value="off">Desativada (Manter todas)</option>
                <option value="60">Auto-arquivar após 60 dias</option>
                <option value="180">Auto-excluir após 180 dias</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALHES E ESTATÍSTICAS DA NOTIFICAÇÃO */}
      {viewNotifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 max-w-lg w-full space-y-4 animate-scale-in text-left">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Detalhes da Notificação</h3>
              </div>
              <button onClick={() => setViewNotifModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Título</span>
                <h4 className="text-sm font-bold text-white">{viewNotifModal.titulo || 'Sem Título'}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">Data & Hora</span>
                  <span className="text-neutral-200 font-bold">{viewNotifModal.data} {viewNotifModal.hora}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-mono block">Destinatário</span>
                  <span className="text-orange-400 font-bold">{viewNotifModal.para}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Mensagem</span>
                <p className="text-xs text-neutral-200 bg-black/40 p-3 rounded-lg border border-neutral-800 leading-relaxed">
                  {viewNotifModal.texto}
                </p>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" /> Estatísticas de Visualização
                </span>
                <p className="text-xs text-neutral-300">
                  Total de Impressões / Visualizações: <strong className="text-white">{viewNotifModal.visualizacoes || 0}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setViewNotifModal(null)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR NOTIFICAÇÃO */}
      {editNotifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Editar Notificação</h3>
              <button onClick={() => setEditNotifModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Título</label>
                <input
                  type="text"
                  value={editNotifModal.titulo || ''}
                  onChange={(e) => setEditNotifModal({ ...editNotifModal, titulo: e.target.value })}
                  className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Mensagem</label>
                <textarea
                  rows={4}
                  value={editNotifModal.texto}
                  onChange={(e) => setEditNotifModal({ ...editNotifModal, texto: e.target.value })}
                  className="w-full bg-neutral-900 text-white border border-neutral-800 rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditNotifModal(null)}
                className="flex-1 py-2 bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onAtualizarNotificacao(editNotifModal);
                  setEditNotifModal(null);
                  alert('Notificação atualizada com sucesso!');
                }}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO INDIVIDUAL */}
      {deleteNotifId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-red-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 text-left animate-scale-in">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm uppercase">
              <AlertTriangle className="w-5 h-5" /> Excluir Notificação
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Deseja realmente excluir esta notificação? Esta operação é definitiva e removerá o registro de toda a base de dados.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteNotifId(null)}
                className="flex-1 py-2 bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRemoverNotificacao(deleteNotifId);
                  setDeleteNotifId(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ZERAR BASE COMPLETA */}
      {showZerarModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-red-600 rounded-2xl p-6 max-w-md w-full space-y-4 text-left animate-scale-in">
            <div className="flex items-center gap-2 text-red-500 font-black text-base uppercase">
              <ShieldAlert className="w-6 h-6 animate-bounce" /> Confirmação de Segurança
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Você está prestes a <strong className="text-red-400">EXCLUIR TODA A BASE DE NOTIFICAÇÕES</strong> da Arena do Competidor.
            </p>
            <p className="text-xs text-neutral-400">
              Digite <strong className="text-white font-mono">ZERAR</strong> abaixo para confirmar:
            </p>

            <input
              type="text"
              placeholder="Digite ZERAR para prosseguir"
              value={zerarConfirmText}
              onChange={(e) => setZerarConfirmText(e.target.value)}
              className="w-full bg-black text-red-400 border border-red-500/50 rounded-xl p-3 text-sm font-mono text-center uppercase tracking-widest"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowZerarModal(false);
                  setZerarConfirmText('');
                }}
                className="flex-1 py-2.5 bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={zerarConfirmText.trim().toUpperCase() !== 'ZERAR'}
                onClick={() => {
                  onZerarNotificacoes();
                  setShowZerarModal(false);
                  setZerarConfirmText('');
                  alert('A base de notificações foi completamente zerada!');
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition shadow-lg"
              >
                ZERAR TUDO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

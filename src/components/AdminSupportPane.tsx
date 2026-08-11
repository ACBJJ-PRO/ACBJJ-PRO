import React, { useState, useEffect } from 'react';
import { updateFirestoreStateKey } from '../lib/firebase';

const savePersistentState = (key: string, data: any, forceImmediate = false) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('arena_firestore_sync', { detail: { key, value: data } }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
  updateFirestoreStateKey(key, data, forceImmediate);
};
import {
  Bot,
  Shield,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  MessageSquare,
  Send,
  UserCheck,
  X,
  Inbox,
  ArrowLeft,
  RefreshCw,
  Lock,
  User,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Download,
  Star,
  Users,
  Check,
  Filter,
  Calendar,
  Activity,
  Zap,
  ThumbsUp,
  ShieldAlert,
  Cpu,
  Settings,
  Plus,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  Copy,
  Trash2,
  Eye,
  Archive,
  Edit3
} from 'lucide-react';

export interface ProtocolResponse {
  autor: string;
  data: string;
  mensagem: string;
  novoStatus?: string;
}

export interface CSATFeedback {
  nota: number; // 1 a 5
  resolvido: 'Sim' | 'Parcialmente' | 'Não';
  comentario?: string;
  data: string;
}

export interface ProtocolItem {
  id: string;
  texto: string;
  data: string;
  para: string;
  de: string;
  protocol: string;
  status: string; // Aberto, Em Análise, Resolvido, Encerrado
  solicitante: string;
  solicitanteRole: string;
  contato: string;
  modulo: string;
  prioridade: string; // Baixa, Média, Alta, Crítica
  descricao: string;
  aiDiagnosis: string;
  respostas: ProtocolResponse[];
  csat?: CSATFeedback;
}

export interface AuditLogItem {
  id: string;
  data: string;
  usuario: string;
  protocolo?: string;
  acao: string;
  detalhes: string;
  categoria: 'Atendimento' | 'Sistema' | 'Relatório' | 'Incidente';
}

export interface IncidentItem {
  id: string;
  protocoloCode?: string;
  titulo: string;
  severidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  dataInicio: string;
  dataFim?: string;
  dataArquivamento?: string;
  responsavelArquivamento?: string;
  modulosAfetados: string[];
  usuariosImpactados: number;
  status: 'Investigando' | 'Identificado' | 'Mitigado' | 'Resolvido' | 'Arquivado';
  causaRaiz: string;
  solucaoAplicada: string;
  tempoRecuperacao: string;
}

interface AdminSupportPaneProps {
  notificacoes: any[];
  onUpdateNotificacoes?: (newNotifs: any[]) => void;
  onClose?: () => void;
}

export default function AdminSupportPane({ notificacoes, onUpdateNotificacoes, onClose }: AdminSupportPaneProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gestao' | 'relatorios' | 'incidentes' | 'auditoria' | 'pesquisa'>('dashboard');
  const [protocols, setProtocols] = useState<ProtocolItem[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolItem | null>(null);
  
  // Filters for Protocol Management
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPriority, setFilterPriority] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form state for admin response
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('Em Análise');
  const [newPriority, setNewPriority] = useState<string>('Média');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>('todos');

  // Incidents State
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [showIncidentForm, setShowIncidentForm] = useState<boolean>(false);
  const [showArchivedIncidents, setShowArchivedIncidents] = useState<boolean>(false);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<IncidentItem | null>(null);

  // Delete confirmation modals (Regra 1 & Regra 2)
  const [ticketToDelete, setTicketToDelete] = useState<ProtocolItem | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<IncidentItem | null>(null);

  const handleConfirmDeleteTicket = () => {
    if (!ticketToDelete) return;
    const targetCode = ticketToDelete.protocol;
    const targetId = ticketToDelete.id;

    // 1. Add targetCode and targetId to persistent deleted list in localStorage
    let deletedList: string[] = [];
    try {
      deletedList = JSON.parse(localStorage.getItem('arena_deleted_protocols') || '[]');
    } catch {
      deletedList = [];
    }
    if (targetCode && !deletedList.includes(targetCode)) deletedList.push(targetCode);
    if (targetId && !deletedList.includes(targetId)) deletedList.push(targetId);
    try {
      savePersistentState('arena_deleted_protocols', deletedList, true);
    } catch (e) {
      console.warn('Error saving arena_deleted_protocols:', e);
    }

    // 2. Filter local protocols state
    setProtocols((prev) => {
      const updated = prev.filter(
        (p) => p.protocol !== targetCode && p.id !== targetId && p.id !== targetCode
      );
      try {
        savePersistentState('arena_support_protocols', updated, true);
      } catch (e) {
        console.warn('Error saving arena_support_protocols:', e);
      }
      return updated;
    });

    // 3. Remove matching notification from localStorage & App state
    const currentNotifs = JSON.parse(localStorage.getItem('arena_notificacoes') || '[]');
    const updatedNotifs = currentNotifs.filter((n: any) => {
      let protCode = n.protocol;
      if (!protCode && n.texto) {
        const match = n.texto.match(/PROT-\d{4}-\d{4}/);
        if (match) protCode = match[0];
      }
      if (
        (targetCode && protCode === targetCode) ||
        (targetId && n.id === targetId) ||
        (targetCode && n.id === targetCode) ||
        (targetCode && n.texto && n.texto.includes(targetCode))
      ) {
        return false;
      }
      return true;
    });

    try {
      savePersistentState('arena_notificacoes', updatedNotifs, true);
      if (onUpdateNotificacoes) {
        onUpdateNotificacoes(updatedNotifs);
      }
    } catch (e) {
      console.warn('Error updating notificacoes on delete:', e);
    }

    // 4. Record in audit log
    addAuditLog(
      'Exclusão Definitiva de Protocolo',
      `O protocolo #${targetCode} (Solicitante: ${ticketToDelete.solicitante}) foi excluído definitivamente do sistema pelo administrador.`,
      targetCode,
      'Atendimento'
    );

    // 5. Unselect protocol if currently selected
    if (
      selectedProtocol &&
      (selectedProtocol.protocol === targetCode || selectedProtocol.id === targetId)
    ) {
      setSelectedProtocol(null);
    }

    setTicketToDelete(null);
  };

  const handleConfirmDeleteIncident = () => {
    if (!incidentToDelete) return;
    const updated = incidents.filter((i) => i.id !== incidentToDelete.id);
    setIncidents(updated);
    savePersistentState('arena_admin_incidents', updated, true);
    setIncidentToDelete(null);
  };
  const [incidentForm, setIncidentForm] = useState({
    titulo: '',
    severidade: 'Alta' as 'Baixa' | 'Média' | 'Alta' | 'Crítica',
    modulosAfetados: 'Inscrições em Campeonatos, Autenticação',
    usuariosImpactados: 12,
    causaRaiz: '',
    solucaoAplicada: ''
  });

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    id: string;
    modulo: string;
    titulo: string;
    textoTecnico: string;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  }>>([]);
  const [selectedSuggestionView, setSelectedSuggestionView] = useState<any | null>(null);
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);
  const [deleteConfirmSuggestion, setDeleteConfirmSuggestion] = useState<any | null>(null);

  // Load AI Suggestions
  useEffect(() => {
    const savedSugs = localStorage.getItem('arena_ai_suggestions');
    if (savedSugs) {
      try {
        setAiSuggestions(JSON.parse(savedSugs));
      } catch (e) {
        console.warn('Error loading AI suggestions:', e);
      }
    } else {
      const defaultSugs = [
        {
          id: 'sug-1',
          modulo: 'Módulo de Inscrição em Campeonatos',
          titulo: 'Tutorial Interativo no Checkout e Aprovação em Lote',
          textoTecnico: 'A inclusão de um tutorial explicativo em vídeo no checkout reduz em 65% as dúvidas sobre comprovante de faixa. Adicionalmente, liberar opção de aprovação temporária em lote pela secretaria.',
          status: 'Pendente' as const
        },
        {
          id: 'sug-2',
          modulo: 'Módulo de Autenticação & Acesso',
          titulo: 'Otimização do Fluxo de Recuperação e Envio de SMS',
          textoTecnico: 'Destacar o botão "Esqueci minha senha" na interface de login mobile e otimizar as rotinas de re-tentativa do serviço Firebase Auth para envio de códigos SMS de validação.',
          status: 'Pendente' as const
        },
        {
          id: 'sug-3',
          modulo: 'Sincronização de Treinos e Frequência',
          titulo: 'Rotina Automática de Re-sincronização de Presença',
          textoTecnico: 'Executar agendamento automático de sincronização a cada 6 horas para reconciliar divergências na contagem de treinos entre o aplicativo móvel e o banco Firestore central.',
          status: 'Pendente' as const
        }
      ];
      setAiSuggestions(defaultSugs);
      savePersistentState('arena_ai_suggestions', defaultSugs);
    }
  }, []);

  const handleSaveSuggestions = (updated: any[]) => {
    setAiSuggestions(updated);
    try {
      savePersistentState('arena_ai_suggestions', updated, true);
    } catch (e) {
      console.warn('Error saving AI suggestions:', e);
    }
  };

  const handleApproveSuggestion = (sug: any) => {
    const updated = aiSuggestions.map((s) => (s.id === sug.id ? { ...s, status: 'Aprovado' as const } : s));
    handleSaveSuggestions(updated);
    handleDownloadTxtReport(sug);
    alert(`Sugestão "${sug.titulo}" aprovada com sucesso! O arquivo de especificação .TXT foi gerado.`);
  };

  const handleRejectSuggestion = (sug: any) => {
    const updated = aiSuggestions.map((s) => (s.id === sug.id ? { ...s, status: 'Rejeitado' as const } : s));
    handleSaveSuggestions(updated);
  };

  const handleDeleteSuggestion = (sug: any) => {
    setDeleteConfirmSuggestion(sug);
  };

  const confirmDeleteSuggestion = (sug: any) => {
    const filtered = aiSuggestions.filter((s) => s.id !== sug.id);
    
    // Auto-generate replacement proposal
    const pool = [
      {
        modulo: 'Módulo de Sincronização & Resiliência',
        titulo: 'Rotina Automática de Re-sincronização de Presença e Treinos',
        textoTecnico: 'Executar agendamento automático de sincronização a cada 6 horas para reconciliar divergências na contagem de treinos entre o aplicativo móvel e o banco Firestore central.'
      },
      {
        modulo: 'Módulo de Ranking Público',
        titulo: 'Algoritmo Dinâmico de Bonificação por Vitórias Consecutivas',
        textoTecnico: 'Implementação de multiplicador automático de pontos no ranking oficial para atletas com mais de 3 vitórias seguidas em etapas estaduais.'
      },
      {
        modulo: 'Módulo de Check-in Off-line',
        titulo: 'Validação de Presença por QR-Code Criptografado',
        textoTecnico: 'Geração de QR-Code estático diário por turma permitindo que professores registrem presença mesmo sem sinal de internet na academia.'
      },
      {
        modulo: 'Módulo de Certificados',
        titulo: 'Geração e Assinatura Digital de Diplomas de Faixa em PDF',
        textoTecnico: 'Geração automática de diplomas com marca d\'água oficial da Arena e código de verificação autêntico para consulta pública.'
      },
      {
        modulo: 'Módulo de Auditoria & LGPD',
        titulo: 'Anonimização Automática de Logs e Rastreabilidade de Acesso',
        textoTecnico: 'Mascara dados sensíveis de usuários em relatórios e registra cada consulta a informações de terceiros com hash de integridade.'
      }
    ];

    const currentTitles = new Set(filtered.map((s) => s.titulo));
    const available = pool.filter((p) => !currentTitles.has(p.titulo));
    const selectedPool = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[Math.floor(Math.random() * pool.length)];

    const newSug = {
      id: `sug-${Date.now()}`,
      modulo: selectedPool.modulo,
      titulo: selectedPool.titulo,
      textoTecnico: selectedPool.textoTecnico,
      status: 'Pendente' as const
    };

    const nextList = [...filtered, newSug];
    handleSaveSuggestions(nextList);
    setDeleteConfirmSuggestion(null);
  };

  const handleDownloadTxtReport = (sug: any) => {
    const content = `====================================================
SUGESTÃO DE MELHORIA TÉCNICA - IA ARENA DO COMPETIDOR
====================================================
ID: ${sug.id}
Módulo: ${sug.modulo}
Título: ${sug.titulo}
Status: ${sug.status}
Data de Emissão: ${new Date().toLocaleString('pt-BR')}

ESPECIFICAÇÃO TÉCNICA DA MELHORIA:
----------------------------------------------------
${sug.textoTecnico}

AÇÕES RECOMENDADAS PARA A EQUIPE DE DESENVOLVIMENTO:
- Analisar impacto nas tabelas/coleções relacionadas.
- Executar testes automatizados no ambiente de homologação.
- Atualizar a base de conhecimento do Assistente IA.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sugestao_Melhoria_Arena_IA_${sug.id}.txt`;
    link.click();
  };

  // Report Period Filter
  const [reportPeriod, setReportPeriod] = useState<'7d' | '30d' | 'mes' | 'todos'>('30d');

  // Team Access Control Toggles
  const [permissions, setPermissions] = useState({
    verRelatorios: true,
    alterarStatus: true,
    gerenciarIncidentes: true,
    exportarDados: true,
    acessarLogs: true
  });

  // Load audit logs and incidents from localStorage or set realistic defaults
  useEffect(() => {
    // 1. Audit Logs Initial Load
    const savedLogs = localStorage.getItem('arena_admin_audit_logs');
    if (savedLogs) {
      try {
        setAuditLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.warn('Error parsing saved audit logs', e);
      }
    } else {
      const defaultLogs: AuditLogItem[] = [
        {
          id: 'log-1',
          data: '23/07/2026 11:30',
          usuario: 'Administrador (Mestre Reinaldo)',
          protocolo: 'PROT-2026-8912',
          acao: 'Atualização de Protocolo',
          detalhes: 'Status alterado para "Em Análise". Resposta enviada sobre verificação de faixa.',
          categoria: 'Atendimento'
        },
        {
          id: 'log-2',
          data: '23/07/2026 10:45',
          usuario: 'Sistema IA Arena',
          protocolo: 'PROT-2026-8912',
          acao: 'Diagnóstico Automático Gerado',
          detalhes: 'IA identificou pendência de aprovação da graduação na secretaria.',
          categoria: 'Sistema'
        },
        {
          id: 'log-3',
          data: '23/07/2026 09:15',
          usuario: 'Administrador (Secretaria)',
          acao: 'Exportação de Relatório',
          detalhes: 'Relatório Gerencial de Atendimentos do mês de Julho/2026 gerado.',
          categoria: 'Relatório'
        },
        {
          id: 'log-4',
          data: '22/07/2026 17:30',
          usuario: 'Administrador',
          protocolo: 'PROT-2026-1102',
          acao: 'Encerramento de Chamado',
          detalhes: 'Protocolo encerrado com sucesso após sincronização de presença.',
          categoria: 'Atendimento'
        }
      ];
      setAuditLogs(defaultLogs);
      savePersistentState('arena_admin_audit_logs', defaultLogs);
    }

    // 2. Incidents Initial Load
    const savedIncidents = localStorage.getItem('arena_admin_incidents');
    if (savedIncidents) {
      try {
        setIncidents(JSON.parse(savedIncidents));
      } catch (e) {
        console.warn('Error parsing saved incidents', e);
      }
    } else {
      const defaultIncidents: IncidentItem[] = [
        {
          id: 'inc-1',
          titulo: 'Oscilação Temporária na Sincronização de Frequências em Lote',
          severidade: 'Média',
          dataInicio: '21/07/2026 14:00',
          dataFim: '21/07/2026 15:30',
          modulosAfetados: ['Frequência e Presença', 'Firestore'],
          usuariosImpactados: 28,
          status: 'Resolvido',
          causaRaiz: 'Atraso na resposta de atualização do cache local durante horários de pico.',
          solucaoAplicada: 'Otimização dos índices no Firestore e limpeza de cache expirado.',
          tempoRecuperacao: '1h 30min'
        },
        {
          id: 'inc-2',
          titulo: 'Dificuldade de Validação de Faixa na Inscrição de Campeonatos',
          severidade: 'Alta',
          dataInicio: '23/07/2026 08:30',
          modulosAfetados: ['Campeonatos e Inscrições', 'Cadastro de Alunos'],
          usuariosImpactados: 14,
          status: 'Mitigado',
          causaRaiz: 'Falta de atrelamento da foto do certificado ao perfil do competidor no momento da pré-inscrição.',
          solucaoAplicada: 'Inclusão de regra automática de checagem prévia e alerta ao organizador.',
          tempoRecuperacao: 'Em monitoramento'
        }
      ];
      setIncidents(defaultIncidents);
      savePersistentState('arena_admin_incidents', defaultIncidents);
    }
  }, []);

  // Parse notifications into single protocol tickets
  useEffect(() => {
    const parseAndDeduplicate = (rawNotifs: any[]): ProtocolItem[] => {
      let deletedList: string[] = [];
      try {
        deletedList = JSON.parse(localStorage.getItem('arena_deleted_protocols') || '[]');
      } catch {
        deletedList = [];
      }

      const protocolMap = new Map<string, ProtocolItem>();

      rawNotifs.forEach((n) => {
        let protCode = n.protocol;
        if (!protCode && n.texto) {
          const match = n.texto.match(/PROT-\d{4}-\d{4}/);
          if (match) protCode = match[0];
        }

        if (!protCode && !n.texto?.includes('TICKET OFICIAL')) return;
        if (!protCode) protCode = `PROT-${n.id || '0000'}`;

        // Skip if protocol or ID is in deleted list
        if (
          deletedList.includes(protCode) ||
          (n.id && deletedList.includes(n.id)) ||
          (n.texto && deletedList.some((d) => d && d.startsWith('PROT-') && n.texto.includes(d)))
        ) {
          return;
        }

        const existing = protocolMap.get(protCode);

        let desc = n.descricao;
        if (!desc && n.texto) {
          if (n.texto.includes('Descrição do Problema:')) {
            desc = n.texto.split('Descrição do Problema:')[1]?.trim();
          } else {
            desc = n.texto;
          }
        }

        if (!existing) {
          protocolMap.set(protCode, {
            id: n.id || String(Date.now()),
            texto: n.texto || '',
            data: n.data || new Date().toLocaleString('pt-BR'),
            para: n.para || 'Administrador',
            de: n.de || 'Central de Atendimento',
            protocol: protCode,
            status: n.status || 'Aberto',
            solicitante: n.solicitante || 'Usuário Arena',
            solicitanteRole: n.solicitanteRole || 'Usuário',
            contato: n.contato || 'Não informado',
            modulo: n.modulo || 'Geral / Suporte Técnico',
            prioridade: n.prioridade || 'Média',
            descricao: desc || 'Solicitação registrada no sistema.',
            aiDiagnosis: n.aiDiagnosis || 'Diagnóstico IA: Solicitação aberta para análise administrativa.',
            respostas: Array.isArray(n.respostas) ? [...n.respostas] : [],
            csat: n.csat || undefined
          });
        } else {
          const currentRespostas = [...existing.respostas];
          if (Array.isArray(n.respostas)) {
            n.respostas.forEach((r: ProtocolResponse) => {
              if (!currentRespostas.some((cr) => cr.data === r.data && cr.mensagem === r.mensagem)) {
                currentRespostas.push(r);
              }
            });
          }

          if (n.status) existing.status = n.status;
          if (n.prioridade) existing.prioridade = n.prioridade;
          if (n.csat) existing.csat = n.csat;
          if (n.solicitante && existing.solicitante === 'Usuário Arena') existing.solicitante = n.solicitante;
          if (desc && (!existing.descricao || existing.descricao.includes('ATUALIZAÇÃO DE PROTOCOLO'))) {
            existing.descricao = desc;
          }

          existing.respostas = currentRespostas;
        }
      });

      return Array.from(protocolMap.values());
    };

    let deletedList: string[] = [];
    try {
      deletedList = JSON.parse(localStorage.getItem('arena_deleted_protocols') || '[]');
    } catch {
      deletedList = [];
    }

    const parsedList = parseAndDeduplicate(notificacoes);

    if (parsedList.length === 0) {
      const demoProtocols: ProtocolItem[] = [
        {
          id: 'demo-1',
          protocol: 'PROT-2026-8912',
          data: '23/07/2026 10:15',
          para: 'Administrador',
          de: 'Central de Atendimento (PROT-2026-8912)',
          texto: 'Inscrição no Campeonato Estadual pendente de confirmação de faixa.',
          solicitante: 'Carlos Eduardo Mota',
          solicitanteRole: 'ALUNO',
          contato: '(11) 98765-4321',
          modulo: 'Campeonatos e Inscrições',
          prioridade: 'Alta',
          status: 'Aberto',
          descricao: 'Iniciei minha inscrição na categoria Faixa Roxa Adulto Meio-Pesado, mas recebi o aviso de aprovação de graduação pendente. Gostaria de confirmar a liberação.',
          aiDiagnosis: 'Diagnóstico IA: Verificação do histórico de graduações e vínculo com o Mestre. Requer aprovação da secretaria no módulo de cadastros.',
          respostas: [],
          csat: {
            nota: 5,
            resolvido: 'Sim' as const,
            comentario: 'Atendimento muito rápido e eficiente da equipe!',
            data: '23/07/2026 11:20'
          }
        },
        {
          id: 'demo-2',
          protocol: 'PROT-2026-4420',
          data: '23/07/2026 09:30',
          para: 'Administrador',
          de: 'Central de Atendimento (PROT-2026-4420)',
          texto: 'Solicitação de adição de nova turma no cronograma.',
          solicitante: 'Prof. Reinaldo Silva',
          solicitanteRole: 'PROFESSOR',
          contato: 'reinaldo.prof@arena.com',
          modulo: 'Turmas e Cronograma',
          prioridade: 'Média',
          status: 'Em Análise',
          descricao: 'Gostaria de solicitar a criação da turma de Jiu-Jitsu Infantil às terças e quintas, 18h30 na Unidade Central.',
          aiDiagnosis: 'Diagnóstico IA: Solicitação de permissão de criação de turma por professor responsável. Requer liberação do painel admin.',
          respostas: [
            {
              autor: 'Administração Arena',
              data: '23/07/2026 11:00',
              mensagem: 'Recebido Mestre. Estamos adequando a capacidade da sala e confirmaremos até o final do dia.',
              novoStatus: 'Em Análise'
            }
          ]
        },
        {
          id: 'demo-3',
          protocol: 'PROT-2026-1102',
          data: '22/07/2026 16:45',
          para: 'Administrador',
          de: 'Central de Atendimento (PROT-2026-1102)',
          texto: 'Ajuste no lançamento de frequências de treino.',
          solicitante: 'Marcos Vinicius',
          solicitanteRole: 'ALUNO',
          contato: '(21) 97123-9988',
          modulo: 'Frequência e Presença',
          prioridade: 'Baixa',
          status: 'Resolvido',
          descricao: 'Minha presença de ontem não contabilizou no ranking geral.',
          aiDiagnosis: 'Diagnóstico IA: Registro de presença sincronizado com o servidor após atualização de cache local.',
          respostas: [
            {
              autor: 'Administração Arena',
              data: '22/07/2026 17:30',
              mensagem: 'Presença re-sincronizada com sucesso! Seu ranking foi recalculado.',
              novoStatus: 'Resolvido'
            }
          ],
          csat: {
            nota: 5,
            resolvido: 'Sim' as const,
            comentario: 'Problema solucionado no mesmo dia, excelente suporte!',
            data: '22/07/2026 17:40'
          }
        },
        {
          id: 'demo-4',
          protocol: 'PROT-2026-3390',
          data: '21/07/2026 14:10',
          para: 'Administrador',
          de: 'Central de Atendimento (PROT-2026-3390)',
          texto: 'Dificuldade para redefinir senha do aplicativo.',
          solicitante: 'Luciana Ferreira',
          solicitanteRole: 'ALUNO',
          contato: 'luciana@email.com',
          modulo: 'Login e Autenticação',
          prioridade: 'Média',
          status: 'Resolvido',
          descricao: 'Não estava recebendo o e-mail de redefinição de senha.',
          aiDiagnosis: 'Diagnóstico IA: Verificação do envio via Firebase Auth. Reenviado link direto.',
          respostas: [
            {
              autor: 'Administração Arena',
              data: '21/07/2026 14:30',
              mensagem: 'Link de redefinição re-enviado para o seu e-mail cadastrado.',
              novoStatus: 'Resolvido'
            }
          ],
          csat: {
            nota: 4,
            resolvido: 'Sim' as const,
            comentario: 'Demorou um pouquinho mas deu tudo certo.',
            data: '21/07/2026 15:00'
          }
        }
      ].filter((p) => !deletedList.includes(p.protocol) && !deletedList.includes(p.id));
      setProtocols(demoProtocols);
    } else {
      setProtocols(parsedList);
    }
  }, [notificacoes]);

  // Real-time Firestore sync listener for Admin Support Pane
  useEffect(() => {
    const handleAdminSync = (e: Event) => {
      const customEv = e as CustomEvent<{ key: string; value: any }>;
      const key = customEv.detail?.key;
      const val = customEv.detail?.value;

      if (!key) return;

      if (key === 'arena_admin_incidents' && Array.isArray(val)) {
        setIncidents(val);
      } else if (key === 'arena_admin_audit_logs' && Array.isArray(val)) {
        setAuditLogs(val);
      } else if (key === 'arena_ai_suggestions' && Array.isArray(val)) {
        setAiSuggestions(val);
      } else if (key === 'arena_support_protocols' && Array.isArray(val)) {
        setProtocols(val);
      }
    };

    window.addEventListener('arena_firestore_sync', handleAdminSync);
    window.addEventListener('storage', handleAdminSync);
    return () => {
      window.removeEventListener('arena_firestore_sync', handleAdminSync);
      window.removeEventListener('storage', handleAdminSync);
    };
  }, []);

  // Record action into audit log
  const addAuditLog = (acao: string, detalhes: string, protocolo?: string, categoria: 'Atendimento' | 'Sistema' | 'Relatório' | 'Incidente' = 'Atendimento') => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      data: new Date().toLocaleString('pt-BR'),
      usuario: 'Administrador (Sessão Ativa)',
      protocolo,
      acao,
      detalhes,
      categoria
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    try {
      savePersistentState('arena_admin_audit_logs', updatedLogs, true);
    } catch (e) {
      console.warn('Failed to save audit log', e);
    }
  };

  const cleanStr = (s: any) => String(s ?? '').replace(/#/g, '').trim().toLowerCase();

  // Filtered Protocols List
  const filteredProtocols = protocols.filter((p) => {
    if (filterStatus !== 'todos' && p.status?.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    if (filterPriority !== 'todas' && p.prioridade?.toLowerCase() !== filterPriority.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const term = cleanStr(searchTerm);
      const protCode = cleanStr(p.protocol);
      const matchProt = protCode && (protCode.includes(term) || term.includes(protCode));
      const matchSol = p.solicitante?.toLowerCase().includes(term);
      const matchDesc = p.descricao?.toLowerCase().includes(term);
      const matchMod = p.modulo?.toLowerCase().includes(term);
      if (!matchProt && !matchSol && !matchDesc && !matchMod) return false;
    }
    return true;
  });

  // Key Metrics Calculations
  const totalCount = protocols.length;
  const abertosCount = protocols.filter((p) => p.status === 'Aberto').length;
  const emAnaliseCount = protocols.filter((p) => p.status === 'Em Análise').length;
  const criticosCount = protocols.filter((p) => (p.prioridade === 'Crítica' || p.prioridade === 'Alta') && (p.status === 'Aberto' || p.status === 'Em Análise')).length;
  const resolvidosCount = protocols.filter((p) => p.status === 'Resolvido' || p.status === 'Encerrado').length;
  
  // Taxa de Resolução
  const taxaResolucao = totalCount > 0 ? Math.round((resolvidosCount / totalCount) * 100) : 100;

  // CSAT Average
  const csatItems = protocols.filter((p) => p.csat && p.csat.nota);
  const csatAvg = csatItems.length > 0 
    ? (csatItems.reduce((acc, curr) => acc + (curr.csat?.nota || 0), 0) / csatItems.length).toFixed(1)
    : '4.9';

  // Category distribution analysis
  const categoriesMap: Record<string, number> = {
    'Campeonatos e Inscrições': 0,
    'Login e Autenticação': 0,
    'Cadastro e Perfil': 0,
    'Turmas e Cronograma': 0,
    'Frequência e Presença': 0,
    'Financeiro e Mensalidades': 0,
    'Firebase e Infraestrutura': 0
  };

  protocols.forEach((p) => {
    const mod = p.modulo || 'Outros';
    if (categoriesMap[mod] !== undefined) {
      categoriesMap[mod] += 1;
    } else {
      categoriesMap['Login e Autenticação'] += 1;
    }
  });

  const handleOpenProtocol = (p: ProtocolItem) => {
    setSelectedProtocol(p);
    setNewStatus(p.status || 'Em Análise');
    setNewPriority(p.prioridade || 'Média');
    setReplyMessage('');
  };

  const handleSaveResponse = () => {
    if (!selectedProtocol) return;

    const timestamp = new Date().toLocaleString('pt-BR');
    const msgText = replyMessage.trim() || `Status do protocolo alterado para ${newStatus}.`;

    const newReply: ProtocolResponse = {
      autor: 'Administração Arena do Competidor',
      data: timestamp,
      mensagem: msgText,
      novoStatus: newStatus
    };

    const updatedResponses = [...(selectedProtocol.respostas || []), newReply];

    const updatedProtocol: ProtocolItem = {
      ...selectedProtocol,
      status: newStatus,
      prioridade: newPriority,
      respostas: updatedResponses
    };

    setProtocols((prev) =>
      prev.map((p) => (p.protocol === selectedProtocol.protocol ? updatedProtocol : p))
    );
    setSelectedProtocol(updatedProtocol);

    // Save in localStorage & global notifications
    const currentNotifs = JSON.parse(localStorage.getItem('arena_notificacoes') || '[]');
    let foundInNotifs = false;

    const cleanedNotifs = currentNotifs.filter((n: any) => {
      let protCode = n.protocol;
      if (!protCode && n.texto) {
        const match = n.texto.match(/PROT-\d{4}-\d{4}/);
        if (match) protCode = match[0];
      }
      if (protCode === selectedProtocol.protocol && n.texto?.includes('ATUALIZAÇÃO DE PROTOCOLO')) {
        return false;
      }
      return true;
    });

    const updatedNotifs = cleanedNotifs.map((n: any) => {
      let protCode = n.protocol;
      if (!protCode && n.texto) {
        const match = n.texto.match(/PROT-\d{4}-\d{4}/);
        if (match) protCode = match[0];
      }

      if (protCode === selectedProtocol.protocol || n.id === selectedProtocol.id) {
        foundInNotifs = true;
        return {
          ...n,
          status: newStatus,
          prioridade: newPriority,
          respostas: updatedResponses
        };
      }
      return n;
    });

    if (!foundInNotifs) {
      updatedNotifs.unshift({
        id: selectedProtocol.id || Date.now().toString(),
        texto: `🎟️ TICKET OFICIAL DE SUPORTE (${selectedProtocol.protocol})\n\nSolicitante: ${selectedProtocol.solicitante}\nContato: ${selectedProtocol.contato}\nMódulo: ${selectedProtocol.modulo}\nPrioridade: ${newPriority}\n\nDescrição do Problema:\n${selectedProtocol.descricao}`,
        data: selectedProtocol.data,
        para: 'Administrador',
        de: `Central de Atendimento (${selectedProtocol.protocol})`,
        protocol: selectedProtocol.protocol,
        status: newStatus,
        solicitante: selectedProtocol.solicitante,
        solicitanteRole: selectedProtocol.solicitanteRole,
        contato: selectedProtocol.contato,
        modulo: selectedProtocol.modulo,
        prioridade: newPriority,
        descricao: selectedProtocol.descricao,
        aiDiagnosis: selectedProtocol.aiDiagnosis,
        respostas: updatedResponses
      });
    }

    try {
      savePersistentState('arena_notificacoes', updatedNotifs, true);
      if (onUpdateNotificacoes) {
        onUpdateNotificacoes(updatedNotifs);
      }
    } catch (e) {
      console.warn('LocalStorage save notice:', e);
    }

    // Add Audit Log
    addAuditLog(
      `Resposta & Atualização em Protocolo #${selectedProtocol.protocol}`,
      `Novo Status: ${newStatus} | Prioridade: ${newPriority} | Mensagem: "${msgText.substring(0, 50)}..."`,
      selectedProtocol.protocol,
      'Atendimento'
    );

    alert(`Atendimento do Protocolo #${selectedProtocol.protocol} salvo com sucesso! Status: ${newStatus}`);
    setReplyMessage('');
  };

  const handleReopenTicket = () => {
    if (!selectedProtocol) return;

    const timestamp = new Date().toLocaleString('pt-BR');
    const reopenReply: ProtocolResponse = {
      autor: 'Administração Arena do Competidor',
      data: timestamp,
      mensagem: '🔓 Chamado reaberto pelo Administrador para continuidade do atendimento.',
      novoStatus: 'Em Análise'
    };

    const updatedResponses = [...(selectedProtocol.respostas || []), reopenReply];
    const newStatusVal = 'Em Análise';

    const updatedProtocol: ProtocolItem = {
      ...selectedProtocol,
      status: newStatusVal,
      respostas: updatedResponses
    };

    setProtocols((prev) =>
      prev.map((p) => (p.protocol === selectedProtocol.protocol ? updatedProtocol : p))
    );
    setSelectedProtocol(updatedProtocol);
    setNewStatus(newStatusVal);

    const currentNotifs = JSON.parse(localStorage.getItem('arena_notificacoes') || '[]');
    const updatedNotifs = currentNotifs.map((n: any) => {
      let protCode = n.protocol;
      if (!protCode && n.texto) {
        const match = n.texto.match(/PROT-\d{4}-\d{4}/);
        if (match) protCode = match[0];
      }
      if (protCode === selectedProtocol.protocol || n.id === selectedProtocol.id) {
        return {
          ...n,
          status: newStatusVal,
          respostas: updatedResponses
        };
      }
      return n;
    });

    try {
      savePersistentState('arena_notificacoes', updatedNotifs, true);
      if (onUpdateNotificacoes) {
        onUpdateNotificacoes(updatedNotifs);
      }
    } catch (e) {
      console.warn('LocalStorage save notice:', e);
    }

    addAuditLog(
      `Reabertura de Chamado #${selectedProtocol.protocol}`,
      `Protocolo reaberto pelo administrador para análise contínua.`,
      selectedProtocol.protocol,
      'Atendimento'
    );

    alert(`Protocolo #${selectedProtocol.protocol} reaberto com sucesso!`);
  };

  // Export CSV Report Functionality
  const handleExportCSVReport = (tipoReport: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (tipoReport === 'atendimento') {
      csvContent += "Protocolo;Data;Solicitante;Perfil;Modulo;Prioridade;Status;CSAT_Nota\n";
      protocols.forEach((p) => {
        csvContent += `${p.protocol};${p.data};${p.solicitante};${p.solicitanteRole};${p.modulo};${p.prioridade};${p.status};${p.csat?.nota || 'N/A'}\n`;
      });
    } else if (tipoReport === 'tecnico') {
      csvContent += "ID_Incidente;Titulo;Severidade;DataInicio;ModulosImpactados;Status;Recuperacao\n";
      incidents.forEach((inc) => {
        csvContent += `${inc.id};${inc.titulo};${inc.severidade};${inc.dataInicio};"${inc.modulosAfetados.join(', ')}";${inc.status};${inc.tempoRecuperacao}\n`;
      });
    } else {
      csvContent += "Perfil;TotalChamados;PrincipaisModulos;SatisfacaoMedia\n";
      csvContent += `ALUNOS;${protocols.filter(p=>p.solicitanteRole==='ALUNO').length};Campeonatos, Frequência;4.9/5\n`;
      csvContent += `PROFESSORES;${protocols.filter(p=>p.solicitanteRole==='PROFESSOR').length};Turmas, Cronograma;5.0/5\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Arena_${tipoReport}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog(
      `Exportação de Relatório (${tipoReport.toUpperCase()})`,
      `Relatório CSV gerado e baixado com sucesso. Período: ${reportPeriod}.`,
      undefined,
      'Relatório'
    );
  };

  // Handle Create New Incident
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.titulo.trim()) return;

    const newInc: IncidentItem = {
      id: `inc-${Date.now()}`,
      titulo: incidentForm.titulo,
      severidade: incidentForm.severidade,
      dataInicio: new Date().toLocaleString('pt-BR'),
      modulosAfetados: incidentForm.modulosAfetados.split(',').map(s=>s.trim()),
      usuariosImpactados: Number(incidentForm.usuariosImpactados) || 1,
      status: 'Investigando',
      causaRaiz: incidentForm.causaRaiz || 'Análise de logs e Firestore em andamento.',
      solucaoAplicada: incidentForm.solucaoAplicada || 'Aguardando diagnóstico técnico.',
      tempoRecuperacao: 'Em investigação'
    };

    const updatedIncidents = [newInc, ...incidents];
    setIncidents(updatedIncidents);
    localStorage.setItem('arena_admin_incidents', JSON.stringify(updatedIncidents));

    addAuditLog(
      `Registro de Incidente: ${newInc.titulo}`,
      `Severidade: ${newInc.severidade} | Usuários Impactados: ${newInc.usuariosImpactados}`,
      undefined,
      'Incidente'
    );

    setShowIncidentForm(false);
    setIncidentForm({
      titulo: '',
      severidade: 'Alta',
      modulosAfetados: 'Inscrições em Campeonatos, Autenticação',
      usuariosImpactados: 12,
      causaRaiz: '',
      solucaoAplicada: ''
    });

    alert('Novo incidente registrado com sucesso na Central de Gestão!');
  };

  const getPriorityBadge = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'crítica':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'alta':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'média':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'aberto':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'em análise':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'resolvido':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'encerrado':
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const isFinalizado =
    selectedProtocol?.status === 'Resolvido' || selectedProtocol?.status === 'Encerrado';

  // RENDER SINGLE SELECTED PROTOCOL DETAIL VIEW
  if (selectedProtocol) {
    return (
      <div className="bg-[#121212] border border-orange-500/40 rounded-3xl p-5 md:p-8 shadow-2xl space-y-6 text-left animate-fade-in relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5 relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProtocol(null)}
              className="p-2.5 bg-[#1a1a1a] hover:bg-neutral-800 text-orange-400 hover:text-orange-300 rounded-2xl border border-neutral-800 transition cursor-pointer flex items-center gap-2 group shrink-0"
              title="Voltar para a Lista de Protocolos"
            >
              <ArrowLeft className="w-5 h-5 text-orange-500 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">VOLTAR</span>
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-orange-400 text-base md:text-lg tracking-widest uppercase">
                  PROTOCOLO #{selectedProtocol.protocol}
                </span>
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(selectedProtocol.status || 'Aberto')}`}>
                  {selectedProtocol.status}
                </span>
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPriorityBadge(selectedProtocol.prioridade || 'Média')}`}>
                  Prioridade {selectedProtocol.prioridade}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium mt-1">
                Análise Detalhada, Histórico de Diálogo & Atendimento Oficial
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedProtocol(null)}
            className="self-end sm:self-auto py-2.5 px-4 bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-neutral-800 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
          >
            <X className="w-4 h-4 text-orange-500" />
            <span>FECHAR PROTOCOLO</span>
          </button>
        </div>

        {/* PROTOCOL SUMMARY INFO CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#181818] p-4 md:p-5 rounded-2xl border border-neutral-850 text-xs">
          <div>
            <span className="text-neutral-500 font-bold block uppercase text-[10px] tracking-wider">Solicitante</span>
            <span className="font-extrabold text-white text-sm block mt-0.5">{selectedProtocol.solicitante}</span>
          </div>
          <div>
            <span className="text-neutral-500 font-bold block uppercase text-[10px] tracking-wider">Perfil / Contato</span>
            <span className="font-extrabold text-orange-400 block mt-0.5">{selectedProtocol.solicitanteRole}</span>
            <span className="block text-[11px] text-neutral-400 mt-0.5">{selectedProtocol.contato}</span>
          </div>
          <div>
            <span className="text-neutral-500 font-bold block uppercase text-[10px] tracking-wider">Módulo Afetado</span>
            <span className="font-extrabold text-white text-sm block mt-0.5">{selectedProtocol.modulo}</span>
          </div>
          <div>
            <span className="text-neutral-500 font-bold block uppercase text-[10px] tracking-wider">Data de Abertura</span>
            <span className="font-extrabold text-neutral-300 block mt-0.5">{selectedProtocol.data}</span>
          </div>
        </div>

        {/* THREAD CONVERSATION STREAM */}
        <div className="space-y-4 bg-[#181818] p-5 rounded-2xl border border-neutral-850">
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            Histórico Completo do Atendimento & Diálogo
          </h4>

          <div className="space-y-3">
            <div className="bg-[#121212] p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <span className="font-extrabold text-white text-xs">{selectedProtocol.solicitante}</span>
                  <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-bold uppercase">
                    {selectedProtocol.solicitanteRole}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">{selectedProtocol.data}</span>
              </div>
              <p className="text-xs md:text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-line pl-1">
                {selectedProtocol.descricao}
              </p>
            </div>

            {selectedProtocol.aiDiagnosis && (
              <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 rounded-2xl border border-orange-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-orange-400 uppercase tracking-wider">
                  <Bot className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>Análise e Diagnóstico da IA</span>
                </div>
                <p className="text-xs text-neutral-300 italic leading-relaxed font-sans">
                  "{selectedProtocol.aiDiagnosis}"
                </p>
              </div>
            )}

            {selectedProtocol.respostas && selectedProtocol.respostas.length > 0 && (
              selectedProtocol.respostas.map((r, idx) => (
                <div key={idx} className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-orange-500" />
                      <span className="font-extrabold text-orange-400 text-xs">{r.autor}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">{r.data}</span>
                  </div>

                  <p className="text-xs md:text-sm text-neutral-200 leading-relaxed">{r.mensagem}</p>

                  {r.novoStatus && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
                        📌 Status atualizado para: <strong className="text-orange-400">{r.novoStatus}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}

            {selectedProtocol.csat && (
              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    <span>Avaliação de Satisfação Registrada pelo Usuário (CSAT)</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < selectedProtocol.csat!.nota ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                      />
                    ))}
                  </div>
                </div>
                {selectedProtocol.csat.comentario && (
                  <p className="text-xs text-neutral-300 italic">"{selectedProtocol.csat.comentario}"</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RESPONSE & UPDATE FORM */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 space-y-4">
          <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-orange-500" />
            Atualização Administrativa do Chamado
          </h4>

          {isFinalizado ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wider">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span>Atendimento Finalizado ({selectedProtocol.status})</span>
              </div>
              <p className="text-xs text-neutral-300 max-w-lg mx-auto leading-relaxed">
                Este chamado foi marcado como <strong className="text-white">{selectedProtocol.status}</strong> e as interações foram encerradas. Se necessitar dar continuidade ao atendimento ou enviar novas instruções, clique no botão abaixo para reabrir o chamado.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleReopenTicket}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>🔓 REABRIR CHAMADO</span>
                </button>

                {selectedProtocol.status?.toLowerCase() === 'encerrado' && (
                  <button
                    type="button"
                    onClick={() => setTicketToDelete(selectedProtocol)}
                    className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/80 font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>🗑 Excluir Definitivamente</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                    Atualizar Status do Chamado
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-neutral-800 rounded-xl py-3 px-3.5 text-xs font-bold focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Resolvido">Resolvido</option>
                    <option value="Encerrado">Encerrado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                    Atualizar Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-neutral-800 rounded-xl py-3 px-3.5 text-xs font-bold focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                  Resposta / Observações do Administrador
                </label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Escreva a orientação oficial para o usuário..."
                  className="w-full bg-[#121212] text-white border border-neutral-800 rounded-xl p-4 text-xs md:text-sm focus:border-orange-500 outline-none resize-none placeholder-neutral-600 leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSaveResponse}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>SALVAR ATUALIZAÇÃO E NOTIFICAR USUÁRIO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketToDelete(selectedProtocol)}
                  className="bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800/80 font-black text-xs uppercase tracking-wider py-4 px-5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-98 shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>🗑 EXCLUIR</span>
                </button>

                <button
                  onClick={() => setSelectedProtocol(null)}
                  className="bg-[#121212] hover:bg-neutral-800 text-neutral-300 hover:text-white font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-xl border border-neutral-800 hover:border-neutral-700 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-orange-500" />
                  <span>VOLTAR</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD & HUB
  return (
    <div className="bg-[#121212] border border-orange-500/30 rounded-3xl p-5 md:p-8 shadow-2xl space-y-6 text-left animate-fade-in relative overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER OFFICIAL MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#141414] rounded-[14px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-orange-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                CENTRAL DE INTELIGÊNCIA E GESTÃO DE ATENDIMENTO
              </h2>
              <span className="bg-orange-500 text-black font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md">
                ADMINISTRATIVO MESTRE
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">
              Métricas Estratégicas, Análise de Padrões por IA, Relatórios, Incidentes & Auditoria
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end md:self-auto p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* STRATEGIC NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-neutral-850 pb-4 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>DASHBOARD IA & MÉTRICAS</span>
        </button>

        <button
          onClick={() => setActiveTab('gestao')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'gestao'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>GESTÃO DE PROTOCOLOS ({protocols.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('relatorios')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'relatorios'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>RELATÓRIOS GERENCIAIS</span>
        </button>

        <button
          onClick={() => setActiveTab('incidentes')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'incidentes'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>INCIDENTES ({incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'auditoria'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>AUDITORIA & LOGS ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pesquisa')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'pesquisa'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>CSAT ({csatAvg}★)</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD IA & MÉTRICAS ESTRATÉGICAS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* INDICADORES PRINCIPAIS (8 CARDS ESTRATÉGICOS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Totais</span>
                <FileText className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <p className="text-xl font-black text-white">{totalCount}</p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Abertos</span>
                <Clock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xl font-black text-blue-400">{abertosCount}</p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Em Análise</span>
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-xl font-black text-purple-400">{emAnaliseCount}</p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-red-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Críticos</span>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <p className="text-xl font-black text-red-400">{criticosCount}</p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Resolvidos</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xl font-black text-emerald-400">{resolvidosCount}</p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Tempo Resposta</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xl font-black text-white">~14 min</p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Tempo Resolução</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-xl font-black text-white">~2.2 horas</p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Taxa Solução</span>
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <p className="text-xl font-black text-orange-400">{taxaResolucao}%</p>
            </div>
          </div>

          {/* ALERTA INTELIGENTE BANNER DE CRITICIDADE */}
          {protocols.some((p) => (p.prioridade === 'Crítica' || p.prioridade === 'Alta') && (p.status === 'Aberto' || p.status === 'Em Análise')) && (
            <div className="bg-gradient-to-r from-red-950/60 via-orange-950/40 to-neutral-900 border border-red-500/40 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 shrink-0 animate-pulse">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-red-400 text-xs uppercase tracking-widest bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500/30">
                      ALERTA INTELIGENTE DETECTADO PELA IA
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">23/07/2026</span>
                  </div>
                  <p className="text-xs md:text-sm text-neutral-200 font-medium mt-1">
                    "Identificado crescimento atípico de chamados de prioridade Alta/Crítica relacionados à <strong>confirmação de graduação ou autenticação</strong>. Recomenda-se analisar as ocorrências."
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('gestao')}
                className="bg-red-500 hover:bg-red-600 text-black font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition cursor-pointer shrink-0"
              >
                Analisar Ocorrências
              </button>
            </div>
          )}

          {/* ANÁLISE POR CATEGORIA E MAPA DE PROBLEMAS FREQUENTES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRÁFICO / BARRAS DE VOLUME POR CATEGORIA */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  Volume de Atendimento por Categoria & Módulo
                </h3>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Proporção Real</span>
              </div>

              <div className="space-y-3 pt-1">
                {Object.entries(categoriesMap).map(([cat, count]) => {
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 15;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-neutral-300">{cat}</span>
                        <span className="text-orange-400">{count} chamados ({pct}%)</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MAPA DE PADRÕES FREQUENTES & DETECÇÃO IA */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-orange-500" />
                  Mapa de Problemas Frequentes & Detecção de Padrões
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  IA ATIVA
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-[#121212] p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-black text-orange-400">
                    <span>1. Inscrição em Campeonatos & Validação</span>
                    <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded">Alta Frequência</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Usuários relatam dúvida sobre como comprovar a faixa durante a inscrição para os eventos estaduais.
                  </p>
                </div>

                <div className="bg-[#121212] p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-black text-amber-400">
                    <span>2. Recuperação de Senha & Login Mobile</span>
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">Frequência Média</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Alguns alunos relatam não visualizar imediatamente o botão de esqueci minha senha no app móvel.
                  </p>
                </div>

                <div className="bg-[#121212] p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-black text-blue-400">
                    <span>3. Registro de Presença em Treinos</span>
                    <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">Frequência Baixa</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Divergências pontuais entre o check-in do professor e a atualização do ranking público de frequência.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INTELIGÊNCIA DE MELHORIA CONTÍNUA */}
          <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Inteligência de Melhoria Contínua (Recomendações da IA)
              </h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Ações Preventivas Sugeridas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiSuggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="bg-[#121212] p-4 rounded-xl border border-neutral-800 space-y-3 flex flex-col justify-between hover:border-neutral-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        {sug.modulo}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          sug.status === 'Aprovado'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : sug.status === 'Rejeitado'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}
                      >
                        {sug.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1">{sug.titulo}</h4>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed italic bg-[#0b0b0b] p-2.5 rounded-lg border border-neutral-850">
                      "{sug.textoTecnico}"
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-neutral-850">
                    <div className="flex gap-1.5">
                      {sug.status !== 'Aprovado' && (
                        <button
                          onClick={() => handleApproveSuggestion(sug)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-[10px] uppercase py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadTxtReport(sug)}
                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-[10px] uppercase py-2 rounded-lg border border-neutral-800 transition cursor-pointer flex items-center justify-center gap-1"
                        title="Baixar especificação em .TXT"
                      >
                        <Download className="w-3.5 h-3.5 text-orange-400" />
                        <span>.TXT</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sug.textoTecnico);
                          setCopiedSuggestionId(sug.id);
                          setTimeout(() => setCopiedSuggestionId(null), 2000);
                        }}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 p-2 rounded-lg border border-neutral-800 transition cursor-pointer"
                        title="Copiar texto técnico"
                      >
                        {copiedSuggestionId === sug.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      {sug.status === 'Pendente' && (
                        <button
                          onClick={() => handleRejectSuggestion(sug)}
                          className="flex-1 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/40 text-[10px] font-bold uppercase py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Rejeitar
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteSuggestion(sug)}
                        className="flex-1 border border-neutral-800 text-neutral-500 hover:text-red-400 hover:border-red-500/40 text-[10px] font-bold uppercase py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Apagar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTÃO DE PROTOCOLO E RESPOSTAS */}
      {activeTab === 'gestao' && (
        <div className="space-y-4 animate-fade-in">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-[#161616] border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por protocolo, solicitante, módulo..."
                className="w-full bg-[#101010] border border-neutral-800 text-white placeholder-neutral-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                <span>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#101010] text-white border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="todos">Todos</option>
                  <option value="aberto">Aberto</option>
                  <option value="em análise">Em Análise</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="encerrado">Encerrado</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                <span>Prioridade:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-[#101010] text-white border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="todas">Todas</option>
                  <option value="baixa">Baixa</option>
                  <option value="média">Média</option>
                  <option value="alta">Alta</option>
                  <option value="crítica">Crítica</option>
                </select>
              </div>
            </div>
          </div>

          {/* PROTOCOLS LIST */}
          <div className="space-y-3">
            {filteredProtocols.length === 0 ? (
              <div className="bg-[#161616] border border-neutral-850 rounded-2xl p-12 text-center space-y-3">
                <Inbox className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-sm font-bold text-neutral-400">Nenhum protocolo encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              filteredProtocols.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenProtocol(p)}
                  className="bg-[#181818] hover:bg-[#202020] border border-neutral-800 hover:border-orange-500/50 rounded-2xl p-4 md:p-5 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-orange-500 text-xs sm:text-sm tracking-widest uppercase bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-lg">
                        #{p.protocol}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(p.status || 'Aberto')}`}>
                        {p.status}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadge(p.prioridade || 'Média')}`}>
                        Prioridade {p.prioridade}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-medium ml-auto md:ml-0">
                        {p.data}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-extrabold text-white text-sm">{p.solicitante}</span>
                      <span className="text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md uppercase">
                        {p.solicitanteRole}
                      </span>
                      <span className="text-xs text-neutral-400">• Módulo: <strong className="text-neutral-300">{p.modulo}</strong></span>
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {p.descricao}
                    </p>

                    {p.respostas && p.respostas.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-orange-400 font-bold">
                        <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                        <span>{p.respostas.length} {p.respostas.length === 1 ? 'resposta registrada' : 'respostas registradas'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button className="bg-neutral-900 group-hover:bg-orange-500 text-neutral-300 group-hover:text-black font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl border border-neutral-800 group-hover:border-orange-500 transition">
                      {p.status?.toLowerCase() === 'encerrado' ? 'Analisar' : 'Analisar & Responder'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTicketToDelete(p);
                      }}
                      className="bg-red-950/80 hover:bg-red-900 text-red-400 hover:text-red-200 border border-red-800/70 font-extrabold text-[11px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 w-full shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>🗑 Excluir Definitivamente</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RELATÓRIOS GERENCIAIS E EXPORTAÇÃO */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6 animate-fade-in">
          {/* HEADER DE RELATÓRIOS & PERÍODO */}
          <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Geração & Emissão de Relatórios Gerenciais
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Exporte dados completos de atendimento, estatísticas técnicas e diagnóstico de perfis de usuários.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase">Período:</span>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="bg-[#121212] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="7d">Últimos 7 Dias</option>
                <option value="30d">Últimos 30 Dias</option>
                <option value="mes">Mês Atual (Julho/2026)</option>
                <option value="todos">Todo o Histórico</option>
              </select>
            </div>
          </div>

          {/* TRÊS CARDS DE RELATÓRIOS OFICIAIS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. RELATÓRIO DE ATENDIMENTO */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-black text-xs text-orange-400 uppercase tracking-wider">1. Relatório de Atendimento</span>
                  <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Visão executiva com total de chamados, prazos de solução, SLA de resposta, prioridades e taxa de resolução por categoria.
                </p>
                <div className="bg-[#121212] p-3 rounded-xl border border-neutral-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Total Analisados:</span>
                    <strong className="text-white">{totalCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Taxa de Resolução:</span>
                    <strong className="text-emerald-400">{taxaResolucao}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">SLA Médio:</span>
                    <strong className="text-orange-400">98.4% no prazo</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExportCSVReport('atendimento')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xs uppercase py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Atendimento (CSV)</span>
              </button>
            </div>

            {/* 2. RELATÓRIO TÉCNICO & INCIDENTES */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-black text-xs text-orange-400 uppercase tracking-wider">2. Relatório Técnico e Módulos</span>
                  <Cpu className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Mapeamento detalhado de erros identificados, módulos afetados, causas-raiz, histórico de correções e estabilidade geral.
                </p>
                <div className="bg-[#121212] p-3 rounded-xl border border-neutral-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Incidentes Registrados:</span>
                    <strong className="text-amber-400">{incidents.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Módulo Mais Solicitado:</span>
                    <strong className="text-white">Inscrições</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Causa Raiz Mais Comum:</span>
                    <strong className="text-orange-400">Validação de Faixa</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExportCSVReport('tecnico')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xs uppercase py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Relatório Técnico (CSV)</span>
              </button>
            </div>

            {/* 3. RELATÓRIO DE USUÁRIOS E PERFIS */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-black text-xs text-orange-400 uppercase tracking-wider">3. Relatório por Perfil de Usuário</span>
                  <Users className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Distribuição de solicitações dividida por perfil de usuário (Alunos, Professores, Secretários), perfil com mais chamados e satisfação.
                </p>
                <div className="bg-[#121212] p-3 rounded-xl border border-neutral-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Alunos:</span>
                    <strong className="text-white">{protocols.filter(p=>p.solicitanteRole==='ALUNO').length} chamados</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Professores:</span>
                    <strong className="text-white">{protocols.filter(p=>p.solicitanteRole==='PROFESSOR').length} chamados</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">CSAT Geral:</span>
                    <strong className="text-amber-400">{csatAvg} / 5.0 ★</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExportCSVReport('usuarios')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xs uppercase py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Exportar por Perfis (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GESTÃO DE INCIDENTES (MAJOR INCIDENTS) */}
      {activeTab === 'incidentes' && (
        <div className="space-y-6 animate-fade-in">
          {/* INCIDENT TABS & CONTROLS */}
          <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Gestão de Incidentes Críticos e Eventos de Sistema
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Acompanhe indisponibilidades, correções de grande escala e tempo total de recuperação da plataforma.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowArchivedIncidents(!showArchivedIncidents)}
                className={`py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 border ${
                  showArchivedIncidents
                    ? 'bg-orange-500 text-black border-orange-500 shadow-md'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>
                  {showArchivedIncidents
                    ? 'VER INCIDENTES ATIVOS'
                    : `INCIDENTES ARQUIVADOS (${incidents.filter((i) => i.status === 'Arquivado').length})`}
                </span>
              </button>

              <button
                onClick={() => setShowIncidentForm(!showIncidentForm)}
                className="bg-red-500 hover:bg-red-600 text-black font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{showIncidentForm ? 'FECHAR FORMULÁRIO' : 'REGISTRAR NOVO INCIDENTE'}</span>
              </button>
            </div>
          </div>

          {/* FORMULÁRIO DE REGISTRO DE INCIDENTE */}
          {showIncidentForm && (
            <form onSubmit={handleCreateIncident} className="bg-[#161616] p-5 rounded-2xl border border-red-500/40 space-y-4 animate-fade-in">
              <h4 className="text-xs font-black text-red-400 uppercase tracking-wider">
                🚨 Novo Registro de Incidente Administrativo
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Título do Incidente</label>
                  <input
                    type="text"
                    value={incidentForm.titulo}
                    onChange={(e) => setIncidentForm({...incidentForm, titulo: e.target.value})}
                    placeholder="Ex: Lentidão na consulta de chaves de campeonato"
                    required
                    className="w-full bg-[#101010] border border-neutral-800 text-white rounded-xl p-3 text-xs focus:border-red-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Severidade</label>
                  <select
                    value={incidentForm.severidade}
                    onChange={(e) => setIncidentForm({...incidentForm, severidade: e.target.value as any})}
                    className="w-full bg-[#101010] border border-neutral-800 text-white rounded-xl p-3 text-xs focus:border-red-500 outline-none cursor-pointer"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Módulos Afetados (Separados por vírgula)</label>
                  <input
                    type="text"
                    value={incidentForm.modulosAfetados}
                    onChange={(e) => setIncidentForm({...incidentForm, modulosAfetados: e.target.value})}
                    placeholder="Campeonatos, Inscrições"
                    className="w-full bg-[#101010] border border-neutral-800 text-white rounded-xl p-3 text-xs focus:border-red-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400">Estimativa de Usuários Impactados</label>
                  <input
                    type="number"
                    value={incidentForm.usuariosImpactados}
                    onChange={(e) => setIncidentForm({...incidentForm, usuariosImpactados: Number(e.target.value)})}
                    className="w-full bg-[#101010] border border-neutral-800 text-white rounded-xl p-3 text-xs focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400">Causa Raiz Identificada</label>
                <textarea
                  rows={2}
                  value={incidentForm.causaRaiz}
                  onChange={(e) => setIncidentForm({...incidentForm, causaRaiz: e.target.value})}
                  placeholder="Explicação técnica da causa do incidente..."
                  className="w-full bg-[#101010] border border-neutral-800 text-white rounded-xl p-3 text-xs focus:border-red-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase py-3.5 rounded-xl transition cursor-pointer shadow-lg"
              >
                REGISTRAR INCIDENTE & NOTIFICAR AUDITORIA
              </button>
            </form>
          )}

          {/* LISTA DE INCIDENTES REGISTRADOS */}
          <div className="space-y-3">
            {incidents.filter((i) => showArchivedIncidents ? i.status === 'Arquivado' : i.status !== 'Arquivado').length === 0 ? (
              <div className="bg-[#161616] p-8 rounded-2xl border border-neutral-850 text-center space-y-2">
                <ShieldAlert className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-xs font-bold text-neutral-400">
                  {showArchivedIncidents
                    ? 'Nenhum incidente arquivado encontrado.'
                    : 'Nenhum incidente ativo no momento. Todos os serviços estão operando normalmente.'}
                </p>
              </div>
            ) : (
              incidents
                .filter((i) => showArchivedIncidents ? i.status === 'Arquivado' : i.status !== 'Arquivado')
                .map((inc) => (
                  <div key={inc.id} className="bg-[#181818] p-5 rounded-2xl border border-neutral-800 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{inc.titulo}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border ${getPriorityBadge(inc.severidade)}`}>
                          Severidade {inc.severidade}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                          inc.status === 'Arquivado'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-neutral-500 font-mono">
                        <div>Criado: <strong className="text-neutral-400">{inc.dataInicio}</strong></div>
                        {inc.dataArquivamento && (
                          <div className="text-orange-400">Arquivado: <strong>{inc.dataArquivamento}</strong></div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#121212] p-3 rounded-xl border border-neutral-850">
                      <div>
                        <span className="text-neutral-500 block font-bold uppercase text-[9px]">Módulos Afetados</span>
                        <span className="text-neutral-200 font-extrabold">{inc.modulosAfetados.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block font-bold uppercase text-[9px]">Impacto Estimado</span>
                        <span className="text-orange-400 font-extrabold">{inc.usuariosImpactados} Usuários</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block font-bold uppercase text-[9px]">
                          {inc.status === 'Arquivado' ? 'Responsável pelo Arquivamento' : 'Tempo de Recuperação'}
                        </span>
                        <span className="text-cyan-400 font-extrabold">
                          {inc.status === 'Arquivado' ? (inc.responsavelArquivamento || 'Administrador') : inc.tempoRecuperacao}
                        </span>
                      </div>
                    </div>

                    <p className="text-neutral-300 leading-relaxed">
                      <strong>Causa Raiz:</strong> {inc.causaRaiz}
                    </p>
                    <p className="text-neutral-300 leading-relaxed">
                      <strong>Solução Aplicada:</strong> {inc.solucaoAplicada}
                    </p>

                    {/* INCIDENT ACTIONS */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-850">
                      <button
                        onClick={() => setSelectedIncidentDetail(inc)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 transition cursor-pointer flex items-center gap-1.5 text-[11px] font-bold uppercase"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Visualizar</span>
                      </button>

                      <button
                        onClick={() => {
                          const isArch = inc.status === 'Arquivado';
                          const updated = incidents.map((i) =>
                            i.id === inc.id
                              ? {
                                  ...i,
                                  status: (isArch ? 'Resolvido' : 'Arquivado') as any,
                                  dataArquivamento: isArch ? undefined : new Date().toLocaleString('pt-BR'),
                                  responsavelArquivamento: isArch ? undefined : 'Administrador'
                                }
                              : i
                          );
                          setIncidents(updated);
                          localStorage.setItem('arena_admin_incidents', JSON.stringify(updated));
                        }}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 transition cursor-pointer flex items-center gap-1.5 text-[11px] font-bold uppercase"
                      >
                        <Archive className="w-3.5 h-3.5 text-orange-400" />
                        <span>{inc.status === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}</span>
                      </button>

                      <button
                        onClick={() => setIncidentToDelete(inc)}
                        className="bg-neutral-900 hover:bg-red-950 text-neutral-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-red-500/40 transition cursor-pointer flex items-center gap-1.5 text-[11px] font-bold uppercase"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDITORIA ADMINISTRATIVA & LOGS */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#181818] p-5 rounded-2xl border border-neutral-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Auditoria Administrativa & Histórico Transacional
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Registro rigoroso de todas as alterações, respostas enviadas, relatórios exportados e ações do sistema.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase">Filtrar Categoria:</span>
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="bg-[#121212] text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="todos">Todas as Categoria</option>
                <option value="Atendimento">Atendimento</option>
                <option value="Sistema">Sistema</option>
                <option value="Relatório">Relatórios</option>
                <option value="Incidente">Incidentes</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs
              .filter((log) => auditFilter === 'todos' || log.categoria === auditFilter)
              .map((log) => (
                <div key={log.id} className="bg-[#181818] p-4 rounded-2xl border border-neutral-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-orange-400 text-xs">{log.acao}</span>
                      {log.protocolo && (
                        <span className="font-mono text-[10px] bg-orange-500/10 text-orange-500 border border-orange-500/30 px-2 py-0.5 rounded">
                          #{log.protocolo}
                        </span>
                      )}
                      <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded uppercase font-bold">
                        {log.categoria}
                      </span>
                    </div>
                    <p className="text-neutral-300 font-medium">{log.detalhes}</p>
                    <span className="text-[10px] text-neutral-500 font-mono">Executado por: <strong className="text-neutral-400">{log.usuario}</strong></span>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-500 shrink-0">{log.data}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 6: PESQUISA DE SATISFAÇÃO CSAT */}
      {activeTab === 'pesquisa' && (
        <div className="space-y-6 animate-fade-in">
          {/* CSAT BANNER METRICS */}
          <div className="bg-[#181818] p-6 rounded-2xl border border-neutral-850 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest block">
                ÍNDICE DE SATISFAÇÃO DO CLIENTE (CSAT)
              </span>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-4xl font-black text-white">{csatAvg}</span>
                <div>
                  <div className="flex items-center text-amber-400 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">Baseado em avaliações de usuários</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-[#121212] p-4 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Taxa de Resolução de 1ª Instância</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">94.2%</span>
              </div>
              <div className="bg-[#121212] p-4 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Índice Recomendação</span>
                <span className="text-xl font-black text-orange-400 mt-1 block">98.5%</span>
              </div>
            </div>
          </div>

          {/* LISTA DE AVALIAÇÕES INDIVIDUAIS */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Comentários e Notas dos Usuários
            </h4>

            {csatItems.length === 0 ? (
              <div className="bg-[#181818] p-8 rounded-2xl border border-neutral-850 text-center text-neutral-400 text-xs font-bold">
                Nenhuma pesquisa de satisfação submetida recentemente.
              </div>
            ) : (
              csatItems.map((p) => (
                <div key={p.id} className="bg-[#181818] p-4 rounded-2xl border border-neutral-850 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{p.solicitante}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">#{p.protocol}</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < (p.csat?.nota || 0) ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {p.csat?.comentario && (
                    <p className="text-neutral-300 italic bg-[#121212] p-3 rounded-xl border border-neutral-800">
                      "{p.csat.comentario}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1">
                    <span>Problema Resolvido: <strong className="text-emerald-400">{p.csat?.resolvido}</strong></span>
                    <span>{p.csat?.data}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTROLE DE ACESSO DO DASHBOARD */}
      <div className="bg-[#161616] p-4 rounded-2xl border border-neutral-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <span className="font-black text-white uppercase tracking-wider block">Permissões de Acesso e Segurança da Central</span>
            <span className="text-neutral-400 text-[11px]">Gerencie os privilégios da equipe administrativa para a visualização dos relatórios.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-bold">
            <input
              type="checkbox"
              checked={permissions.verRelatorios}
              onChange={(e) => setPermissions({...permissions, verRelatorios: e.target.checked})}
              className="accent-orange-500 rounded"
            />
            <span>Relatórios</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-bold">
            <input
              type="checkbox"
              checked={permissions.exportarDados}
              onChange={(e) => setPermissions({...permissions, exportarDados: e.target.checked})}
              className="accent-orange-500 rounded"
            />
            <span>Exportação CSV</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-bold">
            <input
              type="checkbox"
              checked={permissions.gerenciarIncidentes}
              onChange={(e) => setPermissions({...permissions, gerenciarIncidentes: e.target.checked})}
              className="accent-orange-500 rounded"
            />
            <span>Incidentes</span>
          </label>
        </div>
      </div>

      {/* INCIDENT DETAIL MODAL OVERLAY */}
      {selectedIncidentDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1300] flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-6 max-w-lg w-full space-y-4 animate-scale-in text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-black text-white uppercase">{selectedIncidentDetail.titulo}</h3>
              </div>
              <button
                onClick={() => setSelectedIncidentDetail(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase">Status:</span>
                <span className={`px-2 py-0.5 rounded font-black uppercase border ${
                  selectedIncidentDetail.status === 'Arquivado'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {selectedIncidentDetail.status}
                </span>
                <span className="text-neutral-500 font-bold uppercase ml-auto">Severidade:</span>
                <span className="text-red-400 font-black uppercase">{selectedIncidentDetail.severidade}</span>
              </div>

              <div className="bg-[#101010] p-3 rounded-xl border border-neutral-850 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Data de Criação:</span>
                  <strong className="text-white font-mono">{selectedIncidentDetail.dataInicio}</strong>
                </div>
                {selectedIncidentDetail.dataArquivamento && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-orange-400">Data de Arquivamento:</span>
                    <strong className="text-orange-400 font-mono">{selectedIncidentDetail.dataArquivamento}</strong>
                  </div>
                )}
                {selectedIncidentDetail.responsavelArquivamento && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-400">Responsável pelo Arquivamento:</span>
                    <strong className="text-cyan-400">{selectedIncidentDetail.responsavelArquivamento}</strong>
                  </div>
                )}
              </div>

              <div className="bg-[#101010] p-3 rounded-xl border border-neutral-850 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">Módulos Impactados</span>
                <span className="text-white font-bold">{selectedIncidentDetail.modulosAfetados.join(', ')}</span>
              </div>

              <div className="bg-[#101010] p-3 rounded-xl border border-neutral-850 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">Análise de Causa Raiz</span>
                <p className="text-neutral-300 leading-relaxed">{selectedIncidentDetail.causaRaiz}</p>
              </div>

              <div className="bg-[#101010] p-3 rounded-xl border border-neutral-850 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">Solução Técnica & Ações Corretivas</span>
                <p className="text-neutral-300 leading-relaxed">{selectedIncidentDetail.solucaoAplicada}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedIncidentDetail(null)}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase py-3 rounded-xl border border-neutral-800 transition cursor-pointer"
            >
              FECHAR DETALHES
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL FOR AI SUGGESTIONS */}
      {deleteConfirmSuggestion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1300] flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4 animate-scale-in text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-black text-white uppercase">Confirmar Exclusão</h3>
              </div>
              <button
                onClick={() => setDeleteConfirmSuggestion(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-200 font-bold leading-relaxed">
                Deseja realmente apagar esta sugestão da Inteligência de Melhoria Contínua?
              </p>

              <div className="bg-[#101010] p-3 rounded-xl border border-neutral-850 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">{deleteConfirmSuggestion.modulo}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    deleteConfirmSuggestion.status === 'Aprovado'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : deleteConfirmSuggestion.status === 'Rejeitado'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  }`}>
                    {deleteConfirmSuggestion.status}
                  </span>
                </div>
                <h4 className="text-xs font-black text-white">{deleteConfirmSuggestion.titulo}</h4>
              </div>

              <p className="text-[11px] text-neutral-400 leading-normal italic">
                Ao confirmar, a sugestão será removida e a Inteligência Artificial gerará automaticamente uma nova recomendação para ocupar este espaço.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmSuggestion(null)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase py-3 rounded-xl border border-neutral-800 transition cursor-pointer"
              >
                Não
              </button>
              <button
                onClick={() => confirmDeleteSuggestion(deleteConfirmSuggestion)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase py-3 rounded-xl transition cursor-pointer shadow-lg shadow-red-950/50"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGRA 1: MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE TICKET ENCERRADO */}
      {ticketToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1300] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-red-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Excluir Ticket Definitivamente</h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              Têm certeza que deseja excluir definitivamente este ticket? Esta ação não poderá ser desfeita.
            </p>
            <div className="p-3 bg-[#181818] rounded-xl border border-neutral-800 text-left text-xs font-mono space-y-1">
              <span className="text-orange-400 font-bold">#{ticketToDelete.protocol}</span>
              <p className="text-neutral-300 font-sans font-semibold">{ticketToDelete.solicitante} — {ticketToDelete.modulo}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setTicketToDelete(null)}
                className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs uppercase border border-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteTicket}
                className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold text-xs uppercase shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGRA 2: MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE INCIDENTE */}
      {incidentToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1300] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-red-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Excluir Incidente</h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              Deseja realmente excluir este incidente?
            </p>
            <div className="p-3 bg-[#181818] rounded-xl border border-neutral-800 text-left text-xs space-y-1">
              <span className="text-white font-bold">{incidentToDelete.titulo}</span>
              <p className="text-neutral-400 text-[11px]">Severidade: {incidentToDelete.severidade}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIncidentToDelete(null)}
                className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs uppercase border border-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteIncident}
                className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold text-xs uppercase shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

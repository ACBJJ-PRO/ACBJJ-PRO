import React, { useState, useRef, useEffect } from 'react';
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
  Send,
  X,
  Shield,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  FileText,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  User,
  UserCheck,
  Search,
  Plus,
  Clock,
  Lock,
  Copy,
  Check,
  Star,
  ShieldAlert
} from 'lucide-react';

interface ProtocolResponse {
  autor: string;
  data: string;
  mensagem: string;
  novoStatus?: string;
}

interface ProtocolItem {
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
  isPublic?: boolean;
  solicitanteId?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: string;
}

interface AiCentralModalProps {
  onClose: () => void;
  currentUser?: any;
}

export default function AiCentralModal({ onClose, currentUser }: AiCentralModalProps) {
  const isAuth = !!currentUser;
  const userRoleDisplay = currentUser?.tipo
    ? currentUser.tipo.toUpperCase()
    : currentUser?.role
    ? currentUser.role.toUpperCase()
    : 'VISITANTE';

  const cleanStr = (s: any) => String(s ?? '').replace(/#/g, '').trim().toLowerCase();
  const isAdmin = currentUser?.tipo === 'admin' || currentUser?.role === 'admin' || userRoleDisplay === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
        <div className="bg-[#141414] border border-red-500/30 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl relative animate-scale-in">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            A Central de Inteligência e Gestão de Atendimento (Suporte IA & Protocolos) é de acesso exclusivo do perfil Administrador.
          </p>
          <button
            onClick={onClose}
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'tickets' | 'chat'>('chat');
  const [protocols, setProtocols] = useState<ProtocolItem[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolItem | null>(null);
  const [userReplyText, setUserReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Confirmation modal after ticket creation
  const [createdProtocolCode, setCreatedProtocolCode] = useState<string | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);

  // CSAT Survey state
  const [csatNota, setCsatNota] = useState<number>(5);
  const [csatResolvido, setCsatResolvido] = useState<'Sim' | 'Parcialmente' | 'Não'>('Sim');
  const [csatComentario, setCsatComentario] = useState<string>('');

  // AI Chat state
  const initialWelcomeText = isAuth
    ? `Olá, **${currentUser.nome}**! Bem-vindo à **Central de Atendimento**.

Identifiquei que você está autenticado como **${userRoleDisplay}**${currentUser.unidade || currentUser.faixa ? ` (${currentUser.faixa || currentUser.unidade})` : ''}.

O seu contexto de usuário, permissões e chamados estão sincronizados. Como posso ajudar você hoje?`
    : `Olá! Eu sou a **Central Oficial de Atendimento da Arena do Competidor**.

Estou aqui como o seu suporte técnico para tirar dúvidas sobre cadastros, recuperação de senha, campeonatos e chamados.`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: initialWelcomeText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticket Creation Form state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketNome, setTicketNome] = useState(currentUser?.nome || '');
  const [ticketContato, setTicketContato] = useState(currentUser?.whatsapp || currentUser?.telefone || currentUser?.email || '');
  const [ticketModulo, setTicketModulo] = useState('Geral / Suporte Técnico');
  const [ticketPrioridade, setTicketPrioridade] = useState('Média');
  const [ticketDescricao, setTicketDescricao] = useState('');

  const handleOpenTicketForm = () => {
    setTicketNome(currentUser?.nome || '');
    setTicketContato(currentUser?.whatsapp || currentUser?.telefone || currentUser?.email || '');
    setShowTicketForm(true);
  };

  // Load & deduplicate protocols from localStorage
  const loadProtocolsFromStorage = () => {
    try {
      const deletedList: string[] = (() => {
        try {
          return JSON.parse(localStorage.getItem('arena_deleted_protocols') || '[]');
        } catch {
          return [];
        }
      })();

      const rawNotifs = JSON.parse(localStorage.getItem('arena_notificacoes') || '[]');
      const protocolMap = new Map<string, ProtocolItem>();

      rawNotifs.forEach((n: any) => {
        let protCode = n.protocol;
        if (!protCode && n.texto) {
          const match = n.texto.match(/PROT-\d{4}-\d{4}/);
          if (match) protCode = match[0];
        }

        if (!protCode && !n.texto?.includes('TICKET OFICIAL')) return;
        if (!protCode) protCode = `PROT-${n.id || '0000'}`;

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

        const isPub = typeof n.isPublic === 'boolean'
          ? n.isPublic
          : (n.solicitanteRole === 'VISITANTE' || n.solicitanteRole === 'Visitante' || n.solicitanteRole === 'VISITANTE / PÚBLICO' || n.solicitanteId === 'visitante');

        if (!existing) {
          protocolMap.set(protCode, {
            id: n.id || String(Date.now()),
            texto: n.texto || '',
            data: n.data || new Date().toLocaleString('pt-BR'),
            para: n.para || 'Administrador',
            de: n.de || 'Central de Atendimento',
            protocol: protCode,
            status: n.status || 'Aberto',
            solicitante: n.solicitante || (isPub ? 'Visitante' : (currentUser?.nome || 'Usuário Arena')),
            solicitanteRole: n.solicitanteRole || (isPub ? 'VISITANTE' : (userRoleDisplay || 'Usuário')),
            contato: n.contato || currentUser?.whatsapp || currentUser?.email || 'Não informado',
            modulo: n.modulo || 'Geral / Suporte Técnico',
            prioridade: n.prioridade || 'Média',
            descricao: desc || 'Solicitação registrada no sistema.',
            aiDiagnosis: n.aiDiagnosis || 'Diagnóstico IA: Solicitação aberta para análise administrativa.',
            respostas: Array.isArray(n.respostas) ? [...n.respostas] : [],
            isPublic: isPub,
            solicitanteId: n.solicitanteId || (isPub ? 'visitante' : (currentUser?.id || currentUser?.cpf || currentUser?.email || currentUser?.nome || 'user'))
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
          if (desc && (!existing.descricao || existing.descricao.includes('ATUALIZAÇÃO DE PROTOCOLO'))) {
            existing.descricao = desc;
          }

          existing.respostas = currentRespostas;
        }
      });

      const parsedList = Array.from(protocolMap.values());

      // If list is empty, inject default user ticket for testing
      if (parsedList.length === 0 && currentUser) {
        const demoTickets: ProtocolItem[] = [
          {
            id: 'demo-u1',
            protocol: 'PROT-2026-8912',
            data: '23/07/2026 10:15',
            para: 'Administrador',
            de: `Central de Atendimento (PROT-2026-8912)`,
            texto: 'Dúvida quanto ao status de verificação de graduação.',
            solicitante: currentUser.nome,
            solicitanteRole: userRoleDisplay,
            contato: currentUser.whatsapp || currentUser.email || '(11) 98765-4321',
            modulo: 'Graduações e Certificados',
            prioridade: 'Alta',
            status: 'Em Análise',
            descricao: 'Gostaria de verificar a liberação da minha graduação e confirmação para o próximo campeonato.',
            aiDiagnosis: 'Diagnóstico IA: Solicitação em acompanhamento com a secretaria e departamento de graduações.',
            respostas: [
              {
                autor: 'Administração Arena do Competidor',
                data: '23/07/2026 11:30',
                mensagem: 'Olá! Recebemos a sua solicitação. Os documentos estão sob análise da secretaria e responderemos em breve.',
                novoStatus: 'Em Análise'
              }
            ],
            isPublic: false,
            solicitanteId: currentUser.id || currentUser.cpf || currentUser.email || currentUser.nome
          }
        ].filter((p) => !deletedList.includes(p.protocol) && !deletedList.includes(p.id));
        setProtocols(demoTickets);
      } else {
        setProtocols(parsedList);
      }
    } catch (e) {
      console.warn('Error loading protocols in user pane:', e);
    }
  };

  const prevCurrentUserIdRef = useRef(currentUser?.id || currentUser?.cpf || 'visitor');
  useEffect(() => {
    const curId = currentUser?.id || currentUser?.cpf || 'visitor';
    if (prevCurrentUserIdRef.current !== curId) {
      prevCurrentUserIdRef.current = curId;
      setActiveTab('chat');
      loadProtocolsFromStorage();
    } else {
      loadProtocolsFromStorage();
    }
  }, [currentUser?.id, currentUser?.cpf]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, loading, activeTab]);

  // User Tickets Filtering (Filter tickets belonging to currentUser or show relevant tickets)
  const userProtocols = protocols.filter((p) => {
    const pIsPublic = p.isPublic === true || p.solicitanteRole === 'VISITANTE' || p.solicitanteRole === 'Visitante' || p.solicitanteRole === 'VISITANTE / PÚBLICO' || p.solicitanteId === 'visitante';

    // 1. PUBLIC AREA (Unauthenticated visitor: !isAuth)
    if (!isAuth) {
      // RULE: Research MUST be restricted exclusively to protocols created in the public area.
      // CANNOT locate protocols created by authenticated users, even if exact protocol number is typed.
      if (!pIsPublic) {
        return false;
      }

      const term = cleanStr(searchTerm);
      if (!term) return false;

      const protCode = cleanStr(p.protocol);
      const matchProt = protCode && (protCode.includes(term) || term.includes(protCode));
      return matchProt;
    }

    // 2. AUTHENTICATED USER (!isAdmin)
    if (!isAdmin) {
      // CANNOT view public area tickets or other users' tickets
      if (pIsPublic) return false;

      const curUserId = cleanStr(currentUser?.id || '');
      const curUserCpf = cleanStr(currentUser?.cpf || '');
      const curUserEmail = cleanStr(currentUser?.email || '');
      const curUserName = cleanStr(currentUser?.nome || '');

      const ticketSolId = cleanStr(p.solicitanteId || '');
      const ticketSolName = cleanStr(p.solicitante || '');
      const ticketSolContact = cleanStr(p.contato || '');

      const isMyTicket =
        (curUserId && ticketSolId && curUserId === ticketSolId) ||
        (curUserEmail && (ticketSolId === curUserEmail || ticketSolContact.includes(curUserEmail))) ||
        (curUserCpf && (ticketSolId === curUserCpf || ticketSolContact.includes(curUserCpf))) ||
        (curUserName && ticketSolName && (ticketSolName.includes(curUserName) || curUserName.includes(ticketSolName)));

      if (!isMyTicket) {
        // BLOCKED! User cannot see another user's protocol even if searching exact code.
        return false;
      }

      if (filterStatus !== 'todos' && p.status?.toLowerCase() !== filterStatus.toLowerCase()) {
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
    }

    // 3. ADMIN USER in AiCentralModal
    if (filterStatus !== 'todos' && p.status?.toLowerCase() !== filterStatus.toLowerCase()) {
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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userRole: currentUser?.tipo || currentUser?.role || 'Visitante',
          userName: currentUser?.nome || 'Visitante',
          userCpf: currentUser?.cpf,
          userFaixa: currentUser?.faixa,
          userUnidade: currentUser?.unidade,
          userEmail: currentUser?.email,
          isAuth,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        'Desculpe, ocorreu um problema ao processar sua solicitação. Por favor, tente novamente ou abra um ticket ao administrador.';

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error sending message to AI:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `### Diagnóstico\nFalha de conexão temporária com a Central de Atendimento.\n\n### Solução\nPor favor, utilize a opção "Gerar Ticket" para encaminhar um chamado diretamente à Administração.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNome || !ticketDescricao) {
      alert('Por favor, preencha seu nome e a descrição do problema.');
      return;
    }

    const protocol = `PROT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toLocaleString('pt-BR');
    const isPublicTicket = !isAuth;
    const roleForTicket = isAuth ? userRoleDisplay : 'VISITANTE';
    const solId = isAuth ? (currentUser?.id || currentUser?.cpf || currentUser?.email || currentUser?.nome || 'user') : 'visitante';
    const notificationText = `🎟️ TICKET OFICIAL DE SUPORTE (${protocol})\n\nSolicitante: ${ticketNome} (${roleForTicket})\nContato: ${ticketContato || 'Não informado'}\nMódulo: ${ticketModulo}\nPrioridade: ${ticketPrioridade}\n\nDescrição do Problema:\n${ticketDescricao}`;

    const newTicket: ProtocolItem = {
      id: Date.now().toString(),
      texto: notificationText,
      data: timestamp,
      para: 'Administrador',
      de: `Central de Atendimento (${protocol})`,
      protocol: protocol,
      status: 'Aberto',
      solicitante: ticketNome,
      solicitanteRole: roleForTicket,
      contato: ticketContato || 'Não informado',
      modulo: ticketModulo,
      prioridade: ticketPrioridade,
      descricao: ticketDescricao,
      aiDiagnosis: `Diagnóstico IA: Solicitação registrada pelo usuário em ${timestamp}. Módulo afetado: ${ticketModulo}. Analisar histórico e conceder orientação ou ajuste operacional.`,
      respostas: [],
      isPublic: isPublicTicket,
      solicitanteId: solId
    };

    try {
      const currentNotifs = JSON.parse(localStorage.getItem('arena_notificacoes') || '[]');
      const updatedNotifs = [newTicket, ...currentNotifs];
      savePersistentState('arena_notificacoes', updatedNotifs, true);
    } catch (e) {
      console.warn('LocalStorage ticket save:', e);
    }

    setProtocols((prev) => [newTicket, ...prev]);
    setSelectedProtocol(newTicket);
    setShowTicketForm(false);
    setTicketDescricao('');
    setActiveTab('tickets');
    setCreatedProtocolCode(`#${protocol}`);
    setCopiedProtocol(false);
  };

  const handleSendUserReply = () => {
    if (!selectedProtocol || !userReplyText.trim()) return;

    const timestamp = new Date().toLocaleString('pt-BR');
    const replyMsgText = userReplyText.trim();

    // If ticket was resolved/closed, reopen as "Em Análise"
    const nextStatus =
      selectedProtocol.status === 'Resolvido' || selectedProtocol.status === 'Encerrado'
        ? 'Em Análise'
        : selectedProtocol.status;

    const userReply: ProtocolResponse = {
      autor: currentUser?.nome || selectedProtocol.solicitante || 'Usuário Arena',
      data: timestamp,
      mensagem: replyMsgText,
      novoStatus: nextStatus
    };

    const updatedResponses = [...(selectedProtocol.respostas || []), userReply];

    const updatedProtocol: ProtocolItem = {
      ...selectedProtocol,
      status: nextStatus,
      respostas: updatedResponses
    };

    setSelectedProtocol(updatedProtocol);
    setProtocols((prev) =>
      prev.map((p) => (p.protocol === selectedProtocol.protocol ? updatedProtocol : p))
    );

    // Save to storage & sync with server
    try {
      const currentNotifs = JSON.parse(localStorage.getItem('arena_notificacoes') || '[]');
      let foundInNotifs = false;

      const updatedNotifs = currentNotifs.map((n: any) => {
        let protCode = n.protocol;
        if (!protCode && n.texto) {
          const match = n.texto.match(/PROT-\d{4}-\d{4}/);
          if (match) protCode = match[0];
        }

        if (protCode === selectedProtocol.protocol || n.id === selectedProtocol.id) {
          foundInNotifs = true;
          return {
            ...n,
            status: nextStatus,
            respostas: updatedResponses
          };
        }
        return n;
      });

      if (!foundInNotifs) {
        updatedNotifs.unshift({
          ...selectedProtocol,
          status: nextStatus,
          respostas: updatedResponses
        });
      }

      savePersistentState('arena_notificacoes', updatedNotifs, true);
    } catch (e) {
      console.warn('LocalStorage save notice:', e);
    }

    setUserReplyText('');
    alert(`Sua resposta foi enviada no Protocolo #${selectedProtocol.protocol}!`);
  };

  const handleSaveCsat = () => {
    if (!selectedProtocol) return;

    const csatObj = {
      nota: csatNota,
      resolvido: csatResolvido,
      comentario: csatComentario.trim(),
      data: new Date().toLocaleString('pt-BR')
    };

    const updatedProtocol: ProtocolItem = {
      ...selectedProtocol,
      csat: csatObj
    };

    setSelectedProtocol(updatedProtocol);
    setProtocols((prev) =>
      prev.map((p) => (p.protocol === selectedProtocol.protocol ? updatedProtocol : p))
    );

    try {
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
            csat: csatObj
          };
        }
        return n;
      });

      savePersistentState('arena_notificacoes', updatedNotifs, true);
    } catch (e) {
      console.warn('LocalStorage save CSAT notice:', e);
    }

    alert('Sua avaliação de satisfação foi enviada com sucesso! Agradecemos seu feedback.');
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

  const formatAiMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        const title = line.replace('### ', '');
        let badgeBg = 'bg-neutral-800 text-neutral-300';
        if (title.toLowerCase().includes('diagnóstico')) badgeBg = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
        if (title.toLowerCase().includes('análise')) badgeBg = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
        if (title.toLowerCase().includes('solução')) badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

        return (
          <div key={idx} className={`inline-block px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider my-1.5 ${badgeBg}`}>
            {title}
          </div>
        );
      }

      const formattedParts = line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-white font-extrabold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return <p key={idx} className="my-1 text-xs sm:text-sm text-neutral-200 leading-relaxed">{formattedParts}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1200] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#141414] rounded-3xl max-w-3xl w-full border border-neutral-800 shadow-2xl flex flex-col h-[90vh] max-h-[780px] relative overflow-hidden animate-scale-in text-left">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1a1a1a] via-[#161616] to-[#121212] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                  CENTRAL DE ATENDIMENTO
                </h2>
                {isAuth && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    {userRoleDisplay}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                {isAuth
                  ? `Suporte e Acompanhamento de Tickets - ${currentUser.nome}`
                  : 'Central Oficial de Atendimento & Suporte Técnico'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition cursor-pointer"
            title="Fechar Central de Atendimento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TAB BAR */}
        <div className="px-4 py-2.5 bg-[#0f0f0f] border-b border-neutral-850 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>ASSISTENTE IA</span>
            </button>

            {!isAdmin && (
              <button
                onClick={() => {
                  setActiveTab('tickets');
                  setSelectedProtocol(null);
                }}
                className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'tickets'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>{!isAuth ? 'BUSCAR PROTOCOLO' : `MEUS TICKETS ${userProtocols.length > 0 ? `(${userProtocols.length})` : ''}`}</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB CONTENT: TICKETS VIEW */}
        {activeTab === 'tickets' && (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#0c0c0c]/80 text-left">
            {selectedProtocol ? (
              /* SINGLE PROTOCOL THREAD VIEW */
              <div className="space-y-5 animate-fade-in">
                {/* Back button & protocol header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedProtocol(null)}
                      className="p-2 bg-[#1a1a1a] hover:bg-neutral-800 text-orange-400 rounded-xl border border-neutral-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-extrabold uppercase shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-orange-500" />
                      <span>VOLTAR</span>
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-orange-400 text-sm md:text-base tracking-widest uppercase">
                          #{selectedProtocol.protocol}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(selectedProtocol.status || 'Aberto')}`}>
                          {selectedProtocol.status}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadge(selectedProtocol.prioridade || 'Média')}`}>
                          Prioridade {selectedProtocol.prioridade}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Módulo: <strong className="text-neutral-200">{selectedProtocol.modulo}</strong> • Abertura: {selectedProtocol.data}
                      </p>
                    </div>
                  </div>
                </div>

                {/* THREAD CONVERSATION STREAM */}
                <div className="space-y-3 bg-[#161616] p-4 rounded-2xl border border-neutral-850">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                    Histórico do Atendimento & Interações
                  </h4>

                  {/* Initial Problem Description */}
                  <div className="bg-[#121212] p-4 rounded-2xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-500" />
                        <span className="font-extrabold text-white text-xs">{selectedProtocol.solicitante}</span>
                        <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-bold uppercase">
                          {selectedProtocol.solicitanteRole}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">{selectedProtocol.data}</span>
                    </div>
                    <p className="text-xs md:text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-line pl-1">
                      {selectedProtocol.descricao}
                    </p>
                  </div>

                  {/* AI Diagnosis */}
                  {selectedProtocol.aiDiagnosis && (
                    <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-3.5 rounded-2xl border border-orange-500/30 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-black text-orange-400 uppercase tracking-wider">
                        <Bot className="w-3.5 h-3.5 text-orange-500" />
                        <span>Diagnóstico Automático da IA</span>
                      </div>
                      <p className="text-xs text-neutral-300 italic leading-relaxed">
                        "{selectedProtocol.aiDiagnosis}"
                      </p>
                    </div>
                  )}

                  {/* Conversation Replies Stream */}
                  {selectedProtocol.respostas && selectedProtocol.respostas.length > 0 && (
                    selectedProtocol.respostas.map((r, idx) => {
                      const isAdmin = r.autor.includes('Administração') || r.autor.includes('Admin');
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border space-y-1.5 ${
                            isAdmin
                              ? 'bg-[#181818] border-orange-500/30 text-neutral-200'
                              : 'bg-[#121212] border-neutral-800 text-neutral-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isAdmin ? (
                                <UserCheck className="w-4 h-4 text-orange-500" />
                              ) : (
                                <User className="w-4 h-4 text-neutral-400" />
                              )}
                              <span className={`font-extrabold text-xs ${isAdmin ? 'text-orange-400' : 'text-white'}`}>
                                {r.autor}
                              </span>
                              {isAdmin && (
                                <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-md font-bold uppercase">
                                  ADMINISTRADOR
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500">{r.data}</span>
                          </div>

                          <p className="text-xs md:text-sm text-neutral-200 leading-relaxed font-sans">{r.mensagem}</p>

                          {r.novoStatus && (
                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                                Status atualizado para: <strong className="text-orange-400">{r.novoStatus}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* CSAT PESQUISA DE SATISFAÇÃO (QUANDO RESOLVIDO / ENCERRADO) */}
                {(selectedProtocol.status === 'Resolvido' || selectedProtocol.status === 'Encerrado') && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          Pesquisa de Satisfação do Atendimento (CSAT)
                        </h4>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full">
                        {selectedProtocol.csat ? 'Avaliação Registrada' : 'Pendente de Avaliação'}
                      </span>
                    </div>

                    {selectedProtocol.csat ? (
                      <div className="space-y-2 bg-[#121212]/80 p-4 rounded-xl border border-neutral-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-300 font-bold">Nota do Atendimento:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= selectedProtocol.csat!.nota ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                              />
                            ))}
                            <span className="text-xs font-black text-amber-400 ml-1.5">{selectedProtocol.csat.nota}/5</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Problema Solucionado?</span>
                          <span className="font-extrabold text-emerald-400">{selectedProtocol.csat.resolvido}</span>
                        </div>
                        {selectedProtocol.csat.comentario && (
                          <p className="text-xs text-neutral-300 italic pt-1 border-t border-neutral-800">
                            "{selectedProtocol.csat.comentario}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Seu chamado foi concluído pela administração. Como você avalia a solução e o tempo de resposta?
                        </p>

                        <div className="flex items-center justify-between bg-[#101010] p-3 rounded-xl border border-neutral-800">
                          <span className="text-xs font-bold text-neutral-400">Nota de 1 a 5:</span>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setCsatNota(star)}
                                className="p-1 hover:scale-125 transition cursor-pointer"
                              >
                                <Star
                                  className={`w-6 h-6 ${star <= csatNota ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-[#101010] p-3 rounded-xl border border-neutral-800 text-xs">
                          <span className="font-bold text-neutral-400">O problema foi resolvido?</span>
                          <div className="flex items-center gap-2">
                            {(['Sim', 'Parcialmente', 'Não'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setCsatResolvido(opt)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase transition cursor-pointer ${
                                  csatResolvido === opt
                                    ? 'bg-amber-500 text-black font-black'
                                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={csatComentario}
                          onChange={(e) => setCsatComentario(e.target.value)}
                          placeholder="Comentário opcional sobre o atendimento..."
                          className="w-full bg-[#101010] border border-neutral-800 text-white placeholder-neutral-600 rounded-xl p-3 text-xs focus:border-amber-500 outline-none resize-none"
                        />

                        <button
                          onClick={handleSaveCsat}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
                        >
                          <Star className="w-4 h-4 fill-black text-black" />
                          <span>ENVIAR PESQUISA DE SATISFAÇÃO</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* USER REPLY FORM BOX */}
                <div className="bg-[#161616] p-4 rounded-2xl border border-neutral-850 space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-orange-500" />
                    Enviar Resposta / Mensagem no Protocolo
                  </h4>

                  <textarea
                    rows={3}
                    value={userReplyText}
                    onChange={(e) => setUserReplyText(e.target.value)}
                    placeholder="Escreva sua mensagem ou complemento de informação para a Administração..."
                    className="w-full bg-[#101010] text-white border border-neutral-800 rounded-xl p-3.5 text-xs focus:border-orange-500 outline-none resize-none placeholder-neutral-600 leading-relaxed"
                  />

                  <button
                    onClick={handleSendUserReply}
                    disabled={!userReplyText.trim()}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98 shadow-md shadow-orange-500/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>ENVIAR RESPOSTA AO ATENDIMENTO</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TICKETS LIST VIEW */
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="bg-[#161616] border border-neutral-850 p-3.5 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar número de protocolo (ex: #PROT-2026-8912)..."
                      className="w-full bg-[#101010] border border-neutral-800 text-white placeholder-neutral-500 text-xs rounded-xl pl-9 pr-3 py-2 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Status:</span>
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

                    {!isAdmin && (
                      <button
                        onClick={handleOpenTicketForm}
                        className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 ml-2"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>GERAR TICKET</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tickets Cards Stream */}
                {userProtocols.length === 0 ? (
                  <div className="bg-[#161616] border border-neutral-850 rounded-2xl p-8 text-center space-y-3">
                    <FileText className="w-10 h-10 text-neutral-600 mx-auto" />
                    <p className="text-xs font-bold text-neutral-400 max-w-md mx-auto leading-relaxed">
                      {!isAuth
                        ? !searchTerm.trim()
                          ? "Digite o número exato do protocolo (ex: #PROT-2026-8912 ou PROT-2026-8912) na busca acima para consultar seu chamado criado na área pública."
                          : "Nenhum protocolo público localizado para esta pesquisa. Certifique-se de que o código esteja correto e que tenha sido gerado na área pública."
                        : "Nenhum protocolo encontrado registrado para a sua conta."}
                    </p>
                    {!isAdmin && (
                      <button
                        onClick={handleOpenTicketForm}
                        className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition cursor-pointer inline-flex items-center gap-2 shadow-md active:scale-95"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>GERAR TICKET</span>
                      </button>
                    )}
                  </div>
                ) : (
                  userProtocols.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProtocol(p)}
                      className="bg-[#181818] hover:bg-[#202020] border border-neutral-800 hover:border-orange-500/50 rounded-2xl p-4 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-orange-500 text-xs tracking-widest uppercase bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-lg">
                            #{p.protocol}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(p.status || 'Aberto')}`}>
                            {p.status}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadge(p.prioridade || 'Média')}`}>
                            {p.prioridade}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-medium ml-auto sm:ml-0">
                            {p.data}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white">
                          Módulo: <span className="text-orange-400">{p.modulo}</span>
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {p.descricao}
                        </p>

                        {p.respostas && p.respostas.length > 0 && (
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-orange-400 font-bold">
                            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                            <span>
                              {p.respostas.length} {p.respostas.length === 1 ? 'resposta registrada' : 'respostas registradas'}
                            </span>
                          </div>
                        )}
                      </div>

                      <button className="bg-neutral-900 group-hover:bg-orange-500 text-neutral-300 group-hover:text-black font-bold text-xs uppercase py-2 px-3.5 rounded-xl border border-neutral-800 group-hover:border-orange-500 transition shrink-0">
                        Ver & Responder
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: CHAT VIEW */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* CHIP ATALHOS RÁPIDOS */}
            <div className="px-4 py-2.5 bg-[#0f0f0f] border-b border-neutral-850 flex items-center gap-2 overflow-x-auto text-left custom-scrollbar shrink-0 pb-3">
              <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Atalhos:
              </span>

              {[
                { label: '🔑 Dúvida sobre Login / Senha', query: 'Estou com dúvida sobre como fazer login ou recuperar minha senha.' },
                { label: '🥋 Campeonatos & Inscrições', query: 'Como funcionam os campeonatos e como realizar minha inscrição?' },
                { label: '📝 Como funciona o Check-in?', query: 'Como registrar minha presença e faltas no treino?' },
                { label: '🏆 Ranking & Medalhas', query: 'Como é calculada a pontuação do ranking e as medalhas?' },
                ...(!isAdmin ? [{ label: '🎟️ Gerar Ticket de Suporte', action: 'ticket' }] : []),
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.action === 'ticket') {
                      handleOpenTicketForm();
                    } else if (item.query) {
                      handleSendMessage(item.query);
                    }
                  }}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/50 text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition cursor-pointer active:scale-95 shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* CHAT MESSAGES STREAM */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#0c0c0c]/80 text-left">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {msg.sender === 'ai' ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider">
                          Central Oficial
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        {currentUser?.nome || 'Você'}
                      </span>
                    )}
                    <span className="text-[9px] text-neutral-600 font-mono">({msg.timestamp})</span>
                  </div>

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-left shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-tr-none'
                        : 'bg-[#181818] border border-neutral-800 text-neutral-200 rounded-tl-none space-y-1'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      formatAiMessage(msg.text)
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex flex-col items-start animate-fade-in">
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <Bot className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                    <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider">
                      Analisando Diagnóstico...
                    </span>
                  </div>
                  <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2 text-xs text-neutral-400">
                    <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                    <span>Consultando regras de negócios e arquitetura da Arena...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT BAR */}
            <div className="p-3 sm:p-4 bg-[#141414] border-t border-neutral-800 flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {!isAdmin && (
                  <button
                    onClick={handleOpenTicketForm}
                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/60 text-orange-500 p-3 rounded-2xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
                    title="Abrir Ticket com Administrador"
                  >
                    <Ticket className="w-4 h-4" />
                    <span className="hidden sm:inline">Gerar Ticket</span>
                  </button>
                )}

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder="Descreva seu problema ou dúvida técnica..."
                    className="w-full bg-[#1c1c1c] text-white border border-neutral-800 rounded-2xl py-3 pl-4 pr-12 text-xs sm:text-sm focus:border-orange-500 outline-none transition"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || loading}
                    className="absolute right-2 top-2 p-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-white rounded-xl disabled:opacity-40 transition cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CRIAR NOVO TICKET */}
        {showTicketForm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1300] flex items-center justify-center p-4">
            <div className="bg-[#161616] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
              <button
                onClick={() => setShowTicketForm(false)}
                className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-orange-500 mb-5 pb-3 border-b border-neutral-850">
                <Ticket className="w-6 h-6" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Registrar Ticket ao Administrador
                  </h3>
                  <p className="text-xs text-neutral-400">
                    O protocolo será gravado e acompanhado no painel oficial.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Seu Nome / Solicitante *</label>
                    {isAuth && <span className="text-[10px] text-orange-400 font-bold uppercase">(Dados do Perfil)</span>}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isAuth}
                    value={ticketNome}
                    onChange={(e) => setTicketNome(e.target.value.toUpperCase())}
                    placeholder="NOME COMPLETO DO USUÁRIO"
                    className={`w-full bg-[#1f1f1f] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none uppercase font-semibold ${
                      isAuth ? 'opacity-70 cursor-not-allowed bg-[#181818]' : ''
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Contato (Telefone/WhatsApp)</label>
                    <input
                      type="text"
                      disabled={isAuth}
                      value={ticketContato}
                      onChange={(e) => setTicketContato(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={`w-full bg-[#1f1f1f] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none ${
                        isAuth ? 'opacity-70 cursor-not-allowed bg-[#181818]' : ''
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">E-mail Cadastrado</label>
                    <input
                      type="email"
                      disabled={isAuth}
                      value={currentUser?.email || 'contato@arenadocompetidor.com.br'}
                      readOnly
                      placeholder="seuemail@dominio.com"
                      className="w-full bg-[#181818] text-neutral-300 border border-neutral-800 rounded-xl py-2.5 px-4 text-xs opacity-70 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Módulo / Categoria *</label>
                    <select
                      value={ticketModulo}
                      onChange={(e) => setTicketModulo(e.target.value)}
                      className="w-full bg-[#1f1f1f] text-white border border-neutral-800 rounded-xl py-2.5 px-2 text-xs focus:border-orange-500 outline-none cursor-pointer"
                    >
                      <option value="Login / Autenticação">Login / Autenticação</option>
                      <option value="Campeonatos e Inscrições">Campeonatos e Inscrições</option>
                      <option value="Check-in e Frequência">Check-in e Frequência</option>
                      <option value="Cadastro / Dados">Cadastro / Dados</option>
                      <option value="Graduações e Certificados">Graduações e Certificados</option>
                      <option value="Financeiro e Pagamentos">Financeiro e Pagamentos</option>
                      <option value="Geral / Suporte Técnico">Geral / Suporte Técnico</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Prioridade *</label>
                    <select
                      value={ticketPrioridade}
                      onChange={(e) => setTicketPrioridade(e.target.value)}
                      className="w-full bg-[#1f1f1f] text-white border border-neutral-800 rounded-xl py-2.5 px-2 text-xs focus:border-orange-500 outline-none cursor-pointer"
                    >
                      <option value="Baixa">Baixa (Dúvida Operacional)</option>
                      <option value="Média">Média (Ajuste Parcial)</option>
                      <option value="Alta">Alta (Indisponibilidade)</option>
                      <option value="Crítica">Crítica (Urgente / Impeditivo)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Descrição Detalhada da Ocorrência *</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketDescricao}
                    onChange={(e) => setTicketDescricao(e.target.value)}
                    placeholder="Descreva detalhadamente a dúvida ou problema encontrado para auxílio imediato..."
                    className="w-full bg-[#1f1f1f] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-neutral-850">
                  <button
                    type="button"
                    onClick={() => setShowTicketForm(false)}
                    className="flex-1 border border-neutral-800 text-neutral-400 py-2.5 rounded-xl text-xs font-semibold hover:text-white transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Gerar e Enviar Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAÇÃO DE PROTOCOLO GERADO */}
        {createdProtocolCode && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1400] flex items-center justify-center p-4">
            <div className="bg-[#161616] rounded-3xl p-6 max-w-md w-full border border-orange-500/50 shadow-2xl relative animate-scale-in text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {isAuth ? 'Seu protocolo foi criado com sucesso!' : 'Solicitação registrada com sucesso!'}
                </h3>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                  {isAuth
                    ? 'Este protocolo já está disponível no seu histórico da Central de Atendimento.'
                    : 'Seu atendimento foi criado e recebeu o seguinte protocolo:'}
                </p>
              </div>

              <div className="bg-[#101010] p-4 rounded-2xl border border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Número Oficial do Protocolo
                </span>
                <p className="text-2xl font-black text-orange-400 font-mono tracking-widest my-1">
                  {createdProtocolCode}
                </p>

                {!isAuth && (
                  <p className="text-[11px] text-neutral-400 leading-normal px-2 pt-1 border-t border-neutral-850">
                    Guarde este número. Ele será necessário para acompanhar o andamento do seu atendimento pela opção <strong className="text-orange-400">Meus Tickets (Buscar Protocolo)</strong>.
                  </p>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdProtocolCode);
                    setCopiedProtocol(true);
                    setTimeout(() => setCopiedProtocol(false), 3000);
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs uppercase py-2.5 rounded-xl border border-neutral-800 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {copiedProtocol ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Protocolo copiado com sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-orange-500" />
                      <span>Copiar Protocolo</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setCreatedProtocolCode(null)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-white font-extrabold text-xs uppercase py-3 rounded-xl shadow-lg transition cursor-pointer"
              >
                {isAuth ? 'ENTENDIDO / PROSSEGUIR' : 'CONCLUIR / ENTENDI'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { User, Student, CarteirinhaConfig, UserCarteirinhaData } from '../types';
import {
  Wallet,
  Settings,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  RotateCcw,
  Eye,
  FileText,
  Upload,
  Palette,
  Sliders,
  Sparkles,
  Check,
  History,
  X,
  Search,
  Printer,
  Calendar,
  Trash2,
  Loader2,
  Image as ImageIcon,
  ShieldAlert,
  QrCode,
} from 'lucide-react';
import CarteirinhaCard from './CarteirinhaCard';
import CarteirinhaAuthenticator from './CarteirinhaAuthenticator';
import {
  getCarteirinhaConfig,
  saveCarteirinhaConfig,
  DEFAULT_CARTEIRINHA_CONFIG,
  getUserCarteirinhaDataMap,
  getUserCarteirinhaData,
  updateUserCarteirinhaStatus,
  renewUserCarteirinhaValidade,
  issueNewViaUserCarteirinha,
  getPerfilCarteirinhaLabel,
} from '../utils/carteirinhaUtils';

interface CarteirinhaAdminPaneProps {
  usuarios: User[];
  alunos: Student[];
  currentUser?: User | null;
}

export default function CarteirinhaAdminPane({ usuarios, alunos, currentUser }: CarteirinhaAdminPaneProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'personalizacao' | 'usuarios' | 'validacao'>('dashboard');

  // Config state
  const [config, setConfig] = useState<CarteirinhaConfig>(getCarteirinhaConfig);

  // Loading & Action States
  const [isSavingVisuals, setIsSavingVisuals] = useState(false);
  const [isSavingWatermark, setIsSavingWatermark] = useState(false);
  const [isResettingWatermark, setIsResettingWatermark] = useState(false);
  const [isResettingVisuals, setIsResettingVisuals] = useState(false);

  // Action-Specific Centered Inline Messages State
  const [inlineFeedback, setInlineFeedback] = useState<{
    slot: 'visual' | 'watermark' | 'bottom';
    text: string;
    type: 'success' | 'error';
    id: number;
  } | null>(null);

  const showInlineFeedback = (
    slot: 'visual' | 'watermark' | 'bottom',
    text: string,
    type: 'success' | 'error' = 'success'
  ) => {
    const id = Date.now();
    setInlineFeedback({ slot, text, type, id });
    setTimeout(() => {
      setInlineFeedback((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  };

  // Image File Input Ref
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // User Map State
  const [userMapVersion, setUserMapVersion] = useState(0);

  // User filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  // Guard check: Non-admins cannot access administration of carteirinhas
  if (currentUser?.tipo !== 'admin') {
    return (
      <div className="bg-[#141414] border border-red-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 shadow-2xl animate-scale-in">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Acesso Negado</h3>
        <p className="text-xs text-neutral-400 leading-relaxed">
          O Módulo de Gestão das Carteiras Virtuais é de uso exclusivo do perfil Administrador.
        </p>
      </div>
    );
  }

  // Modal State for Emission History
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);

  // Modal State for Custom Renewal
  const [selectedUserForRenewal, setSelectedUserForRenewal] = useState<User | null>(null);
  const [customValidade, setCustomValidade] = useState('DEZ/2027');

  // Modal State for Confirmation (Cancel / Nova Via)
  const [confirmModal, setConfirmModal] = useState<{
    type: 'cancel' | 'nova_via';
    user: User;
    title: string;
    message: string;
  } | null>(null);

  // Reference User for Real-Time Preview (Uses Logged-in Admin / Academy Account)
  const referenceUser: User = currentUser || usuarios.find((u) => u.tipo === 'admin') || usuarios[0] || {
    id: 1,
    senha: '',
    nome: 'PROFESSOR YURI CRUZ',
    email: 'admin@arenadocompetidor.com.br',
    tipo: 'admin',
    aprovado: true,
    fotoPerfil: '',
    whatsapp: '(98) 99999-9999',
    endereco: 'São Luís / MA',
    tipoSangue: 'O+',
    alergico: 'Não',
    dataNascimento: '1985-05-20',
    perfilLabel: 'Administrador',
    faixa: 'Faixa Preta'
  };

  const referenceStudent: Student | null = null;
  const referenceCardData = getUserCarteirinhaData(`user-${referenceUser.id}`);

  // Handlers
  const handleSaveVisuals = async () => {
    setIsSavingVisuals(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      saveCarteirinhaConfig(config);
      showInlineFeedback('bottom', 'Alterações visuais aplicadas com sucesso!');
    } catch (err) {
      showInlineFeedback('bottom', 'Não foi possível aplicar as alterações.', 'error');
    } finally {
      setIsSavingVisuals(false);
    }
  };

  const handleSaveWatermark = async () => {
    setIsSavingWatermark(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      saveCarteirinhaConfig(config);
      showInlineFeedback('watermark', "Configurações da marca d'água salvas com sucesso.");
    } catch (err) {
      showInlineFeedback('watermark', "Não foi possível aplicar as alterações.", 'error');
    } finally {
      setIsSavingWatermark(false);
    }
  };

  const handleResetWatermark = async () => {
    setIsResettingWatermark(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const resetWatermarkConfig = {
        ...config,
        textoMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.textoMarcaDagua,
        fonteMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.fonteMarcaDagua,
        tamanhoFonteMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.tamanhoFonteMarcaDagua,
        opacidadeMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.opacidadeMarcaDagua,
        offsetXMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.offsetXMarcaDagua,
        offsetYMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.offsetYMarcaDagua,
        rotacaoMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.rotacaoMarcaDagua,
        posicaoMarcaDagua: DEFAULT_CARTEIRINHA_CONFIG.posicaoMarcaDagua,
      };
      setConfig(resetWatermarkConfig);
      saveCarteirinhaConfig(resetWatermarkConfig);
      showInlineFeedback('watermark', "Configurações padrão da marca d'água restauradas com sucesso.");
    } catch (err) {
      showInlineFeedback('watermark', "Não foi possível restaurar a marca d'água.", 'error');
    } finally {
      setIsResettingWatermark(false);
    }
  };

  const handleResetVisualIdentity = async () => {
    setIsResettingVisuals(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const restoredConfig: CarteirinhaConfig = {
        ...config,
        corPrincipal: '#0f0f0f',
        corSecundaria: '#1a1a1a',
        usarGradient: true,
        logoPrincipalUrl: '',
        logoUsarBranca: false,
      };
      setConfig(restoredConfig);
      saveCarteirinhaConfig(restoredConfig);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
      showInlineFeedback('visual', 'Padrões visuais restaurados com sucesso!');
    } catch (err) {
      showInlineFeedback('visual', 'Não foi possível restaurar a identidade visual.', 'error');
    } finally {
      setIsResettingVisuals(false);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      showInlineFeedback('visual', 'Formato de imagem inválido. Utilize PNG, JPG, JPEG ou SVG.', 'error');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showInlineFeedback('visual', 'A imagem excede o limite de tamanho de 4MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const newConfig = { ...config, logoPrincipalUrl: result };
        setConfig(newConfig);
        saveCarteirinhaConfig(newConfig);
        showInlineFeedback('visual', 'Logomarca enviada e salva com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    const newConfig = { ...config, logoPrincipalUrl: '' };
    setConfig(newConfig);
    saveCarteirinhaConfig(newConfig);
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = '';
    }
    showInlineFeedback('visual', 'Logomarca removida. Padrão Arena do Competidor reativado.');
  };

  // User status updates
  const handleToggleUserStatus = (user: User, currentStatus: string) => {
    const nextStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    updateUserCarteirinhaStatus(user.id, nextStatus as any, `Alterado via Painel Administrativo`);
    setUserMapVersion((v) => v + 1);
  };

  const handleRenewUser = (user: User, novaValidade: string) => {
    renewUserCarteirinhaValidade(user.id, novaValidade, `Renovação efetuada no Painel Administrativo`);
    setUserMapVersion((v) => v + 1);
    setSelectedUserForRenewal(null);
  };

  const handleIssueNewVia = (user: User) => {
    setConfirmModal({
      type: 'nova_via',
      user,
      title: 'Emitir Nova Via',
      message: `Deseja emitir uma nova via da carteirinha para ${user.nome}? Uma nova via será adicionada ao histórico do atleta/professor.`,
    });
  };

  const handleCancelCard = (user: User) => {
    setConfirmModal({
      type: 'cancel',
      user,
      title: 'Cancelar Carteirinha',
      message: `Tem certeza que deseja CANCELAR a carteirinha de ${user.nome}? O documento ficará com status CANCELADO na plataforma.`,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'cancel') {
      updateUserCarteirinhaStatus(confirmModal.user.id, 'cancelado', 'Carteirinha cancelada pelo administrador');
      setUserMapVersion((v) => v + 1);
      showInlineFeedback('bottom', `Carteirinha de ${confirmModal.user.nome} cancelada com sucesso!`, 'success');
    } else if (confirmModal.type === 'nova_via') {
      issueNewViaUserCarteirinha(confirmModal.user.id, 'Reemissão solicitada pelo administrador');
      setUserMapVersion((v) => v + 1);
      showInlineFeedback('bottom', `Nova via emitida com sucesso para ${confirmModal.user.nome}!`, 'success');
    }
    setConfirmModal(null);
  };

  // Helper to identify administrative accounts (including hybrid URI CRUZ)
  const isAdminAccount = (u: User) => {
    return (
      u.tipo === 'admin' ||
      u.email === 'admin@admin.com' ||
      u.email === 'uricruz@gmail.com' ||
      u.email === 'smerelatorios@gmail.com' ||
      u.email === 'acbjj@acbjj.com.br' ||
      (u.nome && (u.nome.toUpperCase().includes('ADMINISTRADOR') || u.nome.toUpperCase().includes('URI CRUZ') || u.nome.toUpperCase().includes('YURI CRUZ')))
    );
  };

  // Only APPROVED users have active carteirinhas issued
  // Exclude fake/duplicate student records for URI CRUZ / Admin
  const validApprovedUsers = React.useMemo(() => {
    const approved = usuarios.filter((u) => {
      if (!u.aprovado) return false;
      // URI CRUZ / Admin can NEVER be an 'aluno'
      if (u.tipo === 'aluno' && isAdminAccount(u)) return false;
      return true;
    });

    // Deduplicate admin accounts so only 1 master Admin is counted
    const clean: User[] = [];
    let seenAdmin = false;
    for (const u of approved) {
      if (isAdminAccount(u)) {
        if (seenAdmin) continue;
        seenAdmin = true;
      }
      clean.push(u);
    }
    return clean;
  }, [usuarios]);

  // Dashboard calculations
  const allUsersCount = validApprovedUsers.length;
  let totalEmitidas = 0;
  let ativasCount = 0;
  let inativasCount = 0;
  let canceladasCount = 0;
  let proximasVencimentoCount = 0;

  const currentYear = new Date().getFullYear();
  const expiringUsers: { user: User; data: UserCarteirinhaData }[] = [];

  validApprovedUsers.forEach((u) => {
    const cardData = getUserCarteirinhaData(u.id);
    totalEmitidas += cardData.viasEmitidas || 1;
    if (cardData.status === 'ativo') ativasCount++;
    else if (cardData.status === 'inativo') inativasCount++;
    else if (cardData.status === 'cancelado') canceladasCount++;

    // Check expiration date
    if (cardData.validade.includes(String(currentYear)) || cardData.status === 'inativo') {
      proximasVencimentoCount++;
      expiringUsers.push({ user: u, data: cardData });
    }
  });

  // Profile counts (Only approved users, strictly valid operational/admin profiles)
  const roleCounts = {
    aluno: validApprovedUsers.filter((u) => !isAdminAccount(u) && u.tipo === 'aluno').length,
    professor: validApprovedUsers.filter((u) => !isAdminAccount(u) && u.tipo === 'professor').length,
    instrutor: validApprovedUsers.filter((u) => !isAdminAccount(u) && u.tipo === 'instrutor').length,
    admin: validApprovedUsers.filter((u) => isAdminAccount(u)).length,
  };

  // Filtered Users List (ONLY APPROVED & VALID CARTEIRINHAS)
  const filteredUsers = validApprovedUsers.filter((u) => {
    const matchSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.cpf && u.cpf.includes(searchTerm));
    const matchRole = filterRole === 'todos' || u.tipo === filterRole;
    const cardData = getUserCarteirinhaData(u.id);
    const matchStatus = filterStatus === 'todos' || cardData.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-neutral-900 via-[#181818] to-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-800 shadow-xl flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
              Módulo de Gestão das Carteiras Virtuais
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Administração completa, personalização sem código e controle de validade
            </p>
          </div>
        </div>

        {/* SUB-TABS SELECTOR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-950 p-2 rounded-2xl border border-neutral-800 w-full xl:w-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 text-center ${
              activeSubTab === 'dashboard'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Painel & Métricas</span>
          </button>
          <button
            onClick={() => setActiveSubTab('personalizacao')}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 text-center ${
              activeSubTab === 'personalizacao'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Personalização</span>
          </button>
          <button
            onClick={() => setActiveSubTab('usuarios')}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 text-center ${
              activeSubTab === 'usuarios'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Atletas e Emissões</span>
          </button>
          <button
            onClick={() => setActiveSubTab('validacao')}
            className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 text-center ${
              activeSubTab === 'validacao'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="whitespace-nowrap">Validar QR Code</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DASHBOARD & METRICS */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider block">
                Total de Carteirinhas
              </span>
              <div className="text-2xl font-black text-white">{allUsersCount}</div>
              <span className="text-[9px] text-neutral-400 block">{totalEmitidas} vias registradas</span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-1 border-l-4 border-l-emerald-500">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">
                Ativas
              </span>
              <div className="text-2xl font-black text-emerald-400">{ativasCount}</div>
              <span className="text-[9px] text-neutral-400 block">Válidas para acesso</span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-1 border-l-4 border-l-amber-500">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">
                Inativas
              </span>
              <div className="text-2xl font-black text-amber-400">{inativasCount}</div>
              <span className="text-[9px] text-neutral-400 block">Bloqueadas temporariamente</span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-1 border-l-4 border-l-red-500">
              <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider block">
                Vencidas / Alerta
              </span>
              <div className="text-2xl font-black text-red-400">{proximasVencimentoCount}</div>
              <span className="text-[9px] text-neutral-400 block">Exigem renovação</span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-1 border-l-4 border-l-neutral-600">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">
                Canceladas
              </span>
              <div className="text-2xl font-black text-neutral-300">{canceladasCount}</div>
              <span className="text-[9px] text-neutral-400 block">Invalidadas</span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 space-y-1 border-l-4 border-l-orange-500">
              <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider block">
                Validade Média
              </span>
              <div className="text-lg font-black text-orange-400">12 Meses</div>
              <span className="text-[9px] text-neutral-400 block">Padrão anual ACBJJ</span>
            </div>
          </div>

          {/* DISTRIBUTION BY PROFILE */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              <span>Distribuição de Carteirinhas por Perfil de Usuário</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 font-extrabold uppercase block">Atletas / Alunos</span>
                <span className="text-xl font-black text-white">{roleCounts.aluno}</span>
              </div>
              <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-orange-400 font-extrabold uppercase block">Professores</span>
                <span className="text-xl font-black text-white">{roleCounts.professor}</span>
              </div>
              <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-blue-400 font-extrabold uppercase block">Instrutores</span>
                <span className="text-xl font-black text-white">{roleCounts.instrutor}</span>
              </div>
              <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase block">Administradores</span>
                <span className="text-xl font-black text-white">{roleCounts.admin}</span>
              </div>
            </div>
          </div>

          {/* EXPIRING CARDS QUICK RENEWAL ALERT */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />
                <span>Carteirinhas com Vencimento Próximo ou Exigindo Renovação ({expiringUsers.length})</span>
              </h3>
            </div>

            {expiringUsers.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {expiringUsers.map(({ user, data }) => (
                  <div
                    key={user.id}
                    className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-white text-xs overflow-hidden shrink-0">
                        {user.fotoPerfil ? (
                          <img src={user.fotoPerfil} alt={user.nome} className="w-full h-full object-cover" />
                        ) : (
                          user.nome.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{user.nome}</span>
                          <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                            {user.tipo || 'aluno'}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 block">
                          Validade Atual: <strong className="text-white">{data.validade}</strong> | Status:{' '}
                          <span className={data.status === 'ativo' ? 'text-emerald-400' : 'text-amber-400'}>
                            {data.status.toUpperCase()}
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedUserForRenewal(user)}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Renovar Validade (+1 Ano)</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-neutral-500">
                Todas as carteirinhas estão com validades vigentes e regulares.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CENTRAL DE PERSONALIZAÇÃO VISUAL (SEM CÓDIGO) */}
      {activeSubTab === 'personalizacao' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* LEFT COLUMN: SETTINGS FORM */}
          <div className="lg:col-span-7 bg-[#141414] p-5 sm:p-6 rounded-3xl border border-neutral-800 space-y-6">
            <div className="flex flex-col border-b border-neutral-900 pb-3 gap-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-orange-500" />
                  <span>Personalização Visual da Carteirinha Virtual</span>
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isResettingVisuals}
                    onClick={handleResetVisualIdentity}
                    className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 hover:text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1.5 border border-neutral-700 active:scale-95"
                    title="Restaurar padrão oficial (#0F0F0F / #1A1A1A)"
                  >
                    {isResettingVisuals ? (
                      <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                    )}
                    <span>Restaurar Padrão Visual</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSavingVisuals}
                    onClick={handleSaveVisuals}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    {isSavingVisuals ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Salvar</span>
                  </button>
                </div>
              </div>

              {/* Centered Inline Feedback for Visual Actions */}
              {inlineFeedback?.slot === 'visual' && (
                <div key={inlineFeedback.id} className="w-full flex justify-center pt-2 pb-1 animate-fade-in">
                  <div className={`px-6 py-2 rounded-full text-xs font-black flex items-center justify-center gap-2.5 border shadow-lg transition-all ${
                    inlineFeedback.type === 'error'
                      ? 'bg-red-950/90 border-red-500/60 text-red-200 shadow-red-950/50'
                      : 'bg-[#042016] border border-emerald-500/80 text-emerald-300 shadow-emerald-950/50'
                  }`}>
                    {inlineFeedback.type === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span>{inlineFeedback.text}</span>
                  </div>
                </div>
              )}
            </div>

            {/* COLOR SETTINGS */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">
                1. Cores e Fundo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Cor Principal (Predominante)
                  </label>
                  <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                    <input
                      type="color"
                      value={config.corPrincipal}
                      onChange={(e) => setConfig({ ...config, corPrincipal: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.corPrincipal}
                      onChange={(e) => setConfig({ ...config, corPrincipal: e.target.value })}
                      className="bg-transparent text-white font-mono text-xs w-full outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Cor Secundária (Gradiente)
                  </label>
                  <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                    <input
                      type="color"
                      value={config.corSecundaria}
                      onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.corSecundaria}
                      onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })}
                      className="bg-transparent text-white font-mono text-xs w-full outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={config.usarGradient}
                  onChange={(e) => setConfig({ ...config, usarGradient: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 w-4 h-4"
                />
                <span>Utilizar Efeito de Gradiente de Cores</span>
              </label>
            </div>

            {/* LOGO SETTINGS WITH IMAGE UPLOAD */}
            <div className="space-y-3 pt-3 border-t border-neutral-900">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-orange-500" />
                <span>2. Logomarca e Identidade Visual</span>
              </h4>

              <div className="bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <label className="text-[10px] text-neutral-300 font-extrabold uppercase block">
                  Enviar Imagem da Logomarca (PNG, JPG, JPEG, SVG)
                </label>

                {/* File Upload Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:border-orange-500 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-orange-500" />
                    <span>Selecionar Arquivo</span>
                  </button>

                  {config.logoPrincipalUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-3 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Remover Logomarca</span>
                    </button>
                  )}
                </div>

                {/* Uploaded Thumbnail Preview */}
                {config.logoPrincipalUrl ? (
                  <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <div className="w-16 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
                      <img
                        src={config.logoPrincipalUrl}
                        alt="Pré-visualização da Logomarca"
                        className={`max-h-full max-w-full object-contain ${
                          config.logoUsarBranca ? 'brightness-0 invert' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Logomarca Personalizada Ativa
                      </span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Salva diretamente no sistema e refletida instantaneamente na pré-visualização ao vivo.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-500 italic">
                    Nenhuma imagem enviada. Utilizando o escudo institucional padrão da Arena do Competidor.
                  </p>
                )}

                {/* URL Direct Link Alternative */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-850">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Ou insira uma URL externa da imagem (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="https://exemplo.com/logo.png"
                    value={config.logoPrincipalUrl.startsWith('data:') ? '' : config.logoPrincipalUrl}
                    onChange={(e) => setConfig({ ...config, logoPrincipalUrl: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-orange-500 font-mono transition"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.logoUsarBranca}
                      onChange={(e) => setConfig({ ...config, logoUsarBranca: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 w-4 h-4"
                    />
                    <span>Utilizar Versão Branca / Invertida (Alto Contraste)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* WATERMARK SETTINGS */}
            <div className="space-y-4 pt-4 border-t border-neutral-900">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span>3. Marca-d'Água Institucional (Configuração Avançada)</span>
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Ajuste fonte, tamanho, opacidade, posição X/Y e rotação em graus com atualização automática.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isResettingWatermark}
                      onClick={handleResetWatermark}
                      className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 hover:text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1.5 border border-neutral-700 active:scale-95"
                      title="Restaurar padrão oficial da marca d'água"
                    >
                      {isResettingWatermark ? (
                        <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                      )}
                      <span>Restaurar Padrão</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSavingWatermark}
                      onClick={handleSaveWatermark}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      {isSavingWatermark ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>

                {/* Centered Inline Feedback for Watermark Actions */}
                {inlineFeedback?.slot === 'watermark' && (
                  <div key={inlineFeedback.id} className="w-full flex justify-center pt-2 pb-1 animate-fade-in">
                    <div className={`px-6 py-2 rounded-full text-xs font-black flex items-center justify-center gap-2.5 border shadow-lg transition-all ${
                      inlineFeedback.type === 'error'
                        ? 'bg-red-950/90 border-red-500/60 text-red-200 shadow-red-950/50'
                        : 'bg-[#042016] border border-emerald-500/80 text-emerald-300 shadow-emerald-950/50'
                    }`}>
                      {inlineFeedback.type === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span>{inlineFeedback.text}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 space-y-4">
                {/* LINE 1: Texto & Fonte */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-300 font-extrabold uppercase block mb-1 flex items-center justify-between">
                      <span>Texto da Marca-d'Água</span>
                      <span className="text-[9px] text-neutral-500 font-normal">Ex: ACBJJ, CERTIFICADO</span>
                    </label>
                    <input
                      type="text"
                      value={config.textoMarcaDagua}
                      onChange={(e) => setConfig({ ...config, textoMarcaDagua: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-orange-500 font-bold font-mono tracking-wider"
                      placeholder="ACBJJ"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-300 font-extrabold uppercase block mb-1 flex items-center justify-between">
                      <span>Fonte da Marca-d'Água</span>
                      <span className="text-[9px] font-mono text-orange-400">{config.fonteMarcaDagua || 'JetBrains Mono'}</span>
                    </label>
                    <select
                      value={config.fonteMarcaDagua || 'JetBrains Mono'}
                      onChange={(e) => setConfig({ ...config, fonteMarcaDagua: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs px-3 py-2.5 rounded-xl outline-none focus:border-orange-500 font-bold cursor-pointer"
                    >
                      <option value="JetBrains Mono">JetBrains Mono (Padrão Oficial)</option>
                      <option value="Inter">Inter (Sans-serif Moderno)</option>
                      <option value="Impact">Impact (Display Condensado / Forte)</option>
                      <option value="Arial">Arial (Padrão Limpo)</option>
                      <option value="Trebuchet MS">Trebuchet MS (Geométrico)</option>
                      <option value="Georgia">Georgia (Serif Clássico)</option>
                      <option value="Courier New">Courier New (Teletype / Rústico)</option>
                      <option value="Montserrat">Montserrat (Elegante)</option>
                      <option value="Cinzel">Cinzel (Titular / Nobre)</option>
                      <option value="Playfair Display">Playfair Display (Premium)</option>
                    </select>
                  </div>
                </div>

                {/* LINE 2: Tamanho da Fonte & Opacidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-850">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-neutral-300 font-extrabold uppercase">
                        Tamanho da Fonte
                      </label>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        {config.tamanhoFonteMarcaDagua ?? 120}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="220"
                      step="5"
                      value={config.tamanhoFonteMarcaDagua ?? 120}
                      onChange={(e) => setConfig({ ...config, tamanhoFonteMarcaDagua: parseInt(e.target.value) })}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500 font-bold mt-0.5">
                      <span>40px (Pequeno)</span>
                      <span>120px (Oficial)</span>
                      <span>220px (Gigante)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-neutral-300 font-extrabold uppercase">
                        Transparência (Opacidade)
                      </label>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        {Math.round((config.opacidadeMarcaDagua ?? 0.06) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.50"
                      step="0.01"
                      value={config.opacidadeMarcaDagua ?? 0.06}
                      onChange={(e) => setConfig({ ...config, opacidadeMarcaDagua: parseFloat(e.target.value) })}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500 font-bold mt-0.5">
                      <span>1% (Discreto)</span>
                      <span>6% (Oficial)</span>
                      <span>50% (Marcante)</span>
                    </div>
                  </div>
                </div>

                {/* LINE 3: Offset X, Offset Y & Rotação */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-850">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-neutral-300 font-extrabold uppercase">
                        Posição Horizontal (X)
                      </label>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        {(config.offsetXMarcaDagua ?? 55) > 0 ? `+${config.offsetXMarcaDagua ?? 55}` : config.offsetXMarcaDagua ?? 55}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="5"
                      value={config.offsetXMarcaDagua ?? 55}
                      onChange={(e) => setConfig({ ...config, offsetXMarcaDagua: parseInt(e.target.value) })}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500 font-bold mt-0.5">
                      <span>Esquerda (-150)</span>
                      <span>55px (Oficial)</span>
                      <span>Direita (+150)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-neutral-300 font-extrabold uppercase">
                        Posição Vertical (Y)
                      </label>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        {(config.offsetYMarcaDagua ?? 30) > 0 ? `+${config.offsetYMarcaDagua ?? 30}` : config.offsetYMarcaDagua ?? 30}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="5"
                      value={config.offsetYMarcaDagua ?? 30}
                      onChange={(e) => setConfig({ ...config, offsetYMarcaDagua: parseInt(e.target.value) })}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500 font-bold mt-0.5">
                      <span>Cima (-150)</span>
                      <span>30px (Oficial)</span>
                      <span>Baixo (+150)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-neutral-300 font-extrabold uppercase">
                        Rotação (Ângulo)
                      </label>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        {config.rotacaoMarcaDagua ?? 0}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="5"
                      value={config.rotacaoMarcaDagua ?? 0}
                      onChange={(e) => setConfig({ ...config, rotacaoMarcaDagua: parseInt(e.target.value) })}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500 font-bold mt-0.5">
                      <span>Anti-horário (-180°)</span>
                      <span>0° (Sem Rotação)</span>
                      <span>Horário (+180°)</span>
                    </div>
                  </div>
                </div>

                {/* ATALHOS RÁPIDOS DE ALINHAMENTO */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400 border-t border-neutral-850">
                  <span className="font-extrabold uppercase">Atalhos rápidos de alinhamento:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, offsetXMarcaDagua: 55, offsetYMarcaDagua: 30, rotacaoMarcaDagua: 0, opacidadeMarcaDagua: 0.06, tamanhoFonteMarcaDagua: 120, fonteMarcaDagua: 'JetBrains Mono' })}
                      className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-2.5 py-1 rounded-lg border border-orange-500/30 transition cursor-pointer font-bold"
                    >
                      Padrão Oficial (55px, 30px, 0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, offsetXMarcaDagua: 0, offsetYMarcaDagua: 0, rotacaoMarcaDagua: -12 })}
                      className="bg-neutral-950 hover:bg-neutral-800 text-neutral-300 px-2 py-1 rounded-lg border border-neutral-800 transition cursor-pointer font-bold"
                    >
                      Centro Diagonal (-12°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, offsetXMarcaDagua: 0, offsetYMarcaDagua: 0, rotacaoMarcaDagua: 0 })}
                      className="bg-neutral-950 hover:bg-neutral-800 text-neutral-300 px-2 py-1 rounded-lg border border-neutral-800 transition cursor-pointer font-bold"
                    >
                      Centro (0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, offsetXMarcaDagua: 0, offsetYMarcaDagua: 0, rotacaoMarcaDagua: -45 })}
                      className="bg-neutral-950 hover:bg-neutral-800 text-neutral-300 px-2 py-1 rounded-lg border border-neutral-800 transition cursor-pointer font-bold"
                    >
                      Diagonal Acentuada (-45°)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LOCATION & INSTITUTIONAL TEXTS */}
            <div className="space-y-3 pt-3 border-t border-neutral-900">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">
                4. Localização e Textos Institucionais
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Nome da Entidade / Instituição
                  </label>
                  <input
                    type="text"
                    value={config.nomeInstituicao}
                    onChange={(e) => setConfig({ ...config, nomeInstituicao: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Identificação Territorial
                  </label>
                  <input
                    type="text"
                    value={config.localizacaoTexto}
                    onChange={(e) => setConfig({ ...config, localizacaoTexto: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={config.exibirBandeiraBrasil}
                  onChange={(e) => setConfig({ ...config, exibirBandeiraBrasil: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 w-4 h-4"
                />
                <span>Exibir Bandeira do Brasil ao lado da localização</span>
              </label>
            </div>

            {/* FIELD VISIBILITY CHECKBOXES */}
            <div className="space-y-3 pt-3 border-t border-neutral-900">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">
                5. Configuração Exibição dos Campos da Carteirinha
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/60">
                {[
                  { key: 'exibirFoto', label: 'Foto de Perfil' },
                  { key: 'exibirNome', label: 'Nome do Atleta/Usuário' },
                  { key: 'exibirRegistro', label: 'Registro ACBJJ' },
                  { key: 'exibirProfessor', label: 'Professor' },
                  { key: 'exibirTurma', label: 'Turma' },
                  { key: 'exibirGraduacao', label: 'Faixa e Graduação' },
                  { key: 'exibirValidade', label: 'Validade' },
                  { key: 'exibirLocalizacao', label: 'Localização' },
                  { key: 'exibirMarcaDagua', label: "Marca-d'água" },
                  { key: 'exibirStatus', label: 'Badge de Status' },
                  { key: 'exibirNumeroAcademia', label: 'ID da Academia' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(config as any)[item.key]}
                      onChange={(e) => setConfig({ ...config, [item.key]: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 w-3.5 h-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* VERSO CONFIGURATION SECTION */}
            <div className="space-y-4 pt-3 border-t border-neutral-900">
              <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>6. Personalização do Verso da Carteirinha</span>
              </h4>

              {/* Verso Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/60">
                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Cor Principal do Verso
                  </label>
                  <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                    <input
                      type="color"
                      value={config.versoCorPrincipal || '#0f0f0f'}
                      onChange={(e) => setConfig({ ...config, versoCorPrincipal: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.versoCorPrincipal || '#0f0f0f'}
                      onChange={(e) => setConfig({ ...config, versoCorPrincipal: e.target.value })}
                      className="bg-transparent text-white font-mono text-xs w-full outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Cor Secundária do Verso (Gradiente)
                  </label>
                  <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                    <input
                      type="color"
                      value={config.versoCorSecundaria || '#1c1c1c'}
                      onChange={(e) => setConfig({ ...config, versoCorSecundaria: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.versoCorSecundaria || '#1c1c1c'}
                      onChange={(e) => setConfig({ ...config, versoCorSecundaria: e.target.value })}
                      className="bg-transparent text-white font-mono text-xs w-full outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.versoUsarGradient ?? true}
                      onChange={(e) => setConfig({ ...config, versoUsarGradient: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 w-4 h-4"
                    />
                    <span>Utilizar Efeito de Gradiente de Cores no Verso</span>
                  </label>
                </div>
              </div>

              {/* Custom Texts for Verso */}
              <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/60">
                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Texto de Marca-d'água do Verso
                  </label>
                  <input
                    type="text"
                    value={config.versoTextoMarcaDagua ?? 'ACBJJ AUTÊNTICO'}
                    onChange={(e) => setConfig({ ...config, versoTextoMarcaDagua: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xl outline-none font-bold font-mono"
                    placeholder="ACBJJ AUTÊNTICO"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-extrabold uppercase block mb-1">
                    Texto do Regulamento / Termos de Uso do Verso
                  </label>
                  <textarea
                    rows={2}
                    value={config.versoTextoRegulamento ?? 'Documento de identificação atlética individual e intransferível. Válido em todo território nacional sob apresentação do documento original com foto.'}
                    onChange={(e) => setConfig({ ...config, versoTextoRegulamento: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs p-3 rounded-xl outline-none font-medium leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Verso Element Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/60">
                {[
                  { key: 'versoExibirQrCode', label: 'Exibir QR Code' },
                  { key: 'versoExibirCodigoAuth', label: 'Exibir Código de Autenticação' },
                  { key: 'versoExibirAssinatura', label: 'Exibir Assinatura Digital' },
                  { key: 'versoExibirTermosUso', label: 'Exibir Regulamento' },
                  { key: 'versoExibirInformacoesContato', label: 'Exibir Contatos da Academia' },
                  { key: 'versoExibirTipagemSanguinea', label: 'Exibir Tipo Sangüíneo/Alergias' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(config as any)[item.key] ?? true}
                      onChange={(e) => setConfig({ ...config, [item.key]: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 w-3.5 h-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingVisuals}
              onClick={handleSaveVisuals}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-95"
            >
              {isSavingVisuals ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Aplicando Alterações Visuais...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar e Aplicar Alterações Visuais</span>
                </>
              )}
            </button>

            {/* Centered Inline Feedback for Bottom Action */}
            {inlineFeedback?.slot === 'bottom' && (
              <div className="w-full flex justify-center pt-2 animate-fade-in">
                <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border shadow-lg ${
                  inlineFeedback.type === 'error'
                    ? 'bg-red-950/90 border-red-500/50 text-red-200 shadow-red-950/50'
                    : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-emerald-950/50'
                }`}>
                  {inlineFeedback.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{inlineFeedback.text}</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: REAL-TIME LIVE PREVIEW CARD */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#141414] p-5 rounded-3xl border border-neutral-800 space-y-4 sticky top-24 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-500" />
                  <span>Pré-visualização em Tempo Real</span>
                </span>
                <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                  Ao vivo
                </span>
              </div>

              {/* Logged Administrator / Academy Account Indicator */}
              <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow">
                    {referenceUser.nome.charAt(0)}
                  </div>
                  <div className="truncate">
                    <span className="text-white font-extrabold block truncate">{referenceUser.nome}</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase block">
                      {getPerfilCarteirinhaLabel(referenceUser.tipo, referenceUser.perfilLabel)}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-mono font-bold shrink-0">
                  Conta Logada
                </span>
              </div>

              {/* Card Component Live Render (Simulated Avatar for Neutral Preview) */}
              <CarteirinhaCard
                user={referenceUser}
                student={referenceStudent}
                config={config}
                userCardData={referenceCardData}
                showPrintButton={true}
                isSimulatedAvatar={true}
              />

              <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                Esta pré-visualização em tempo real utiliza como referência a identidade da conta administrativa/academia logada e representa exatamente como a carteirinha e os documentos serão gerados no sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ATLETAS E GERENCIAMENTO DE CARTEIRINHAS */}
      {activeSubTab === 'usuarios' && (
        <div className="bg-[#141414] p-5 sm:p-6 rounded-3xl border border-neutral-800 space-y-5 animate-fade-in">
          {/* SEARCH AND FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:border-orange-500 transition"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2.5 rounded-2xl outline-none"
              >
                <option value="todos">Todos os Perfis</option>
                <option value="aluno">Atleta / Aluno</option>
                <option value="professor">Professor</option>
                <option value="instrutor">Instrutor</option>
                <option value="admin">Administrador</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2.5 rounded-2xl outline-none"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
          </div>

          {/* USERS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider">
                  <th className="py-3 px-3">Usuário / Atleta</th>
                  <th className="py-3 px-3">Perfil</th>
                  <th className="py-3 px-3">Validade</th>
                  <th className="py-3 px-3">Via / Emissões</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Ações de Gerenciamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const cardData = getUserCarteirinhaData(u.id);
                    const isAtivo = cardData.status === 'ativo';

                    return (
                      <tr key={u.id} className="hover:bg-neutral-900/60 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                              {u.fotoPerfil ? (
                                <img src={u.fotoPerfil} alt={u.nome} className="w-full h-full object-cover" />
                              ) : (
                                u.nome.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white">{u.nome}</div>
                              <div className="text-[10px] text-neutral-500">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                            {u.tipo || 'aluno'}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-white">{cardData.validade}</td>

                        <td className="py-3 px-3 font-bold text-neutral-300">
                          {cardData.viasEmitidas || 1}ª Via
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                              cardData.status === 'ativo'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : cardData.status === 'inativo'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            ● {cardData.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleToggleUserStatus(u, cardData.status)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                isAtivo
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                              title={isAtivo ? 'Inativar Carteirinha' : 'Ativar Carteirinha'}
                            >
                              {isAtivo ? 'Inativar' : 'Ativar'}
                            </button>

                            <button
                              onClick={() => setSelectedUserForRenewal(u)}
                              className="px-2.5 py-1 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Renovar Validade"
                            >
                              Renovar
                            </button>

                            <button
                              onClick={() => handleIssueNewVia(u)}
                              className="px-2.5 py-1 bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Emitir Nova Via"
                            >
                              Nova Via
                            </button>

                            <button
                              onClick={() => setSelectedUserForHistory(u)}
                              className="p-1 text-neutral-400 hover:text-white transition cursor-pointer"
                              title="Ver Histórico de Emissões"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {cardData.status !== 'cancelado' && (
                              <button
                                onClick={() => handleCancelCard(u)}
                                className="p-1 text-neutral-500 hover:text-red-400 transition cursor-pointer"
                                title="Cancelar Carteirinha"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 opacity-50 text-neutral-400">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VALIDATION BY QR CODE AND MANUAL CODE */}
      {activeSubTab === 'validacao' && (
        <div className="animate-fade-in">
          <CarteirinhaAuthenticator usuarios={usuarios} alunos={alunos} currentUser={currentUser} />
        </div>
      )}

      {/* MODAL: CUSTOM RENEWAL */}
      {selectedUserForRenewal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left space-y-4">
            <button
              onClick={() => setSelectedUserForRenewal(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-orange-500">
              <RotateCw className="w-6 h-6 animate-spin-slow" />
              <div>
                <h3 className="text-base font-black text-white">Renovar Validade da Carteirinha</h3>
                <p className="text-xs text-neutral-400">{selectedUserForRenewal.nome}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] text-neutral-400 font-extrabold uppercase block">
                Selecione ou digite a nova validade:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['DEZ/2026', 'DEZ/2027', 'DEZ/2028', 'DEZ/2029'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setCustomValidade(v)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      customValidade === v
                        ? 'bg-orange-500 text-white border-orange-400'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customValidade}
                onChange={(e) => setCustomValidade(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2.5 rounded-xl outline-none font-bold"
                placeholder="Ex: DEZ/2027"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForRenewal(null)}
                className="flex-1 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRenewUser(selectedUserForRenewal, customValidade)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg"
              >
                Confirmar Renovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMISSION HISTORY */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-lg w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left space-y-4">
            <button
              onClick={() => setSelectedUserForHistory(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-orange-500">
              <History className="w-6 h-6" />
              <div>
                <h3 className="text-base font-black text-white">Histórico de Emissões e Alterações</h3>
                <p className="text-xs text-neutral-400">{selectedUserForHistory.nome}</p>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {getUserCarteirinhaData(selectedUserForHistory.id).historicoEmissoes.map((h) => (
                <div key={h.id} className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                    <span>📅 {h.data}</span>
                    <span className="text-orange-400 font-bold">ACBJJ</span>
                  </div>
                  <div className="text-xs font-bold text-white">{h.acao}</div>
                  {h.motivo && <div className="text-[10px] text-neutral-400 italic">{h.motivo}</div>}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedUserForHistory(null)}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
            >
              Fechar Histórico
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM CONFIRMATION (CANCEL & NOVA VIA) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left space-y-4">
            <button
              onClick={() => setConfirmModal(null)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl flex items-center justify-center ${
                  confirmModal.type === 'cancel'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                    : 'bg-orange-500/10 border border-orange-500/20 text-orange-500'
                }`}
              >
                {confirmModal.type === 'cancel' ? (
                  <XCircle className="w-7 h-7" />
                ) : (
                  <Wallet className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">{confirmModal.title}</h3>
                <p className="text-xs text-neutral-400 font-semibold">{confirmModal.user.nome}</p>
              </div>
            </div>

            <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800">
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Não, Voltar
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg uppercase tracking-wider ${
                  confirmModal.type === 'cancel'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                    : 'bg-orange-500 hover:bg-orange-400 text-black shadow-orange-950/30'
                }`}
              >
                Sim, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

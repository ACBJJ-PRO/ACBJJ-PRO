import React, { useState } from 'react';
import { PublicidadeItem } from '../types';
import {
  Megaphone,
  Plus,
  BarChart3,
  MousePointer,
  Eye,
  Archive,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  Layers,
  Globe,
  Building,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Award,
  Settings
} from 'lucide-react';

interface CentralPublicidadePaneProps {
  publicidades: PublicidadeItem[];
  exibirPublicidadeAdmin?: boolean;
  onToggleExibirPublicidadeAdmin?: (value: boolean) => void;
  onAddPublicidade: (item: PublicidadeItem) => void;
  onUpdatePublicidade: (item: PublicidadeItem) => void;
  onRemovePublicidade: (id: string) => void;
  onArchivePublicidade: (id: string) => void;
  onRestorePublicidade: (id: string) => void;
  onResetAllMetrics?: () => void;
}

export const PAGE_OPTIONS = [
  { id: 'inicio', label: 'Início (Área do Aluno / Admin)' },
  { id: 'carteira', label: 'Carteirinha Digital' },
  { id: 'provas', label: 'Desafios & Provas' },
  { id: 'competicao', label: 'Campeonatos / Confronte' },
  { id: 'rankingPresenca', label: 'Ranking Presença' },
  { id: 'aniversariantes', label: 'Aniversariantes' },
  { id: 'noticias', label: 'Mural de Notícias' },
  { id: 'videos', label: 'Biblioteca de Vídeos' },
  { id: 'certificados', label: 'Certificados e Contratos' },
  { id: 'notificacoes', label: 'Caixa de Mensagens' },
  { id: 'todas', label: 'Todas as Páginas (Geral)' },
];

export default function CentralPublicidadePane({
  publicidades,
  exibirPublicidadeAdmin = true,
  onToggleExibirPublicidadeAdmin,
  onAddPublicidade,
  onUpdatePublicidade,
  onRemovePublicidade,
  onArchivePublicidade,
  onRestorePublicidade,
  onResetAllMetrics,
}: CentralPublicidadePaneProps) {
  const [activeTab, setActiveTab] = useState<'ativas' | 'arquivadas'>('ativas');
  const [showWizard, setShowWizard] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedMetricsCampaign, setSelectedMetricsCampaign] = useState<PublicidadeItem | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<PublicidadeItem | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // New campaign state for the 6-step wizard
  const [newCompany, setNewCompany] = useState('');
  const [newPages, setNewPages] = useState<string[]>(['inicio', 'dashboard_aluno']);
  const [newLink, setNewLink] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newSlide, setNewSlide] = useState<number>(1);

  // Filter lists
  const activeCampaigns = publicidades.filter((p) => p.status !== 'arquivada');
  const archivedCampaigns = publicidades.filter((p) => p.status === 'arquivada');

  // Overall metrics calculations
  const totalActive = activeCampaigns.length;
  const totalArchived = archivedCampaigns.length;
  const totalViews = publicidades.reduce((acc, p) => acc + (p.visualizacoes || 0), 0);
  const totalClicks = publicidades.reduce((acc, p) => acc + (p.cliques || 0), 0);

  // Top clicked campaign
  const mostClicked = [...publicidades].sort((a, b) => (b.cliques || 0) - (a.cliques || 0))[0];

  // Most recent campaign
  const mostRecent = [...publicidades].sort((a, b) => {
    const da = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
    const db = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
    return db - da;
  })[0];

  const resetWizardForm = () => {
    setNewCompany('');
    setNewPages(['inicio', 'dashboard_aluno']);
    setNewLink('');
    setNewImage('');
    setNewSlide(activeCampaigns.length + 1);
    setWizardStep(1);
    setShowWizard(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem é muito grande. Escolha uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePageSelection = (pageId: string) => {
    if (pageId === 'todas') {
      if (newPages.includes('todas')) {
        setNewPages([]);
      } else {
        setNewPages(PAGE_OPTIONS.map((p) => p.id));
      }
      return;
    }

    setNewPages((prev) => {
      if (prev.includes(pageId)) {
        return prev.filter((p) => p !== pageId && p !== 'todas');
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleFinishWizard = () => {
    if (!newCompany.trim()) {
      alert('Por favor, informe o nome do patrocinador ou empresa.');
      setWizardStep(1);
      return;
    }
    if (newPages.length === 0) {
      alert('Por favor, selecione ao menos uma página onde a publicidade irá aparecer.');
      setWizardStep(2);
      return;
    }
    if (!newImage) {
      alert('Por favor, faça o upload da imagem da campanha.');
      setWizardStep(4);
      return;
    }

    const nowStr = new Date().toLocaleString('pt-BR');
    const newCamp: PublicidadeItem = {
      id: `pub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nomeEmpresa: newCompany.trim(),
      paginas: newPages,
      linkUrl: newLink.trim(),
      imagemUrl: newImage,
      slideNumero: newSlide,
      status: 'ativa',
      dataCriacao: nowStr,
      dataUltimaEdicao: nowStr,
      visualizacoes: 0,
      cliques: 0,
      historicoCliques: [],
    };

    onAddPublicidade(newCamp);
    resetWizardForm();
    setSuccessBanner('Publicidade publicada com sucesso.');
    setTimeout(() => setSuccessBanner(null), 8000);
  };

  const handleSaveEdit = () => {
    if (!editingCampaign) return;
    const updated: PublicidadeItem = {
      ...editingCampaign,
      dataUltimaEdicao: new Date().toLocaleString('pt-BR'),
    };
    onUpdatePublicidade(updated);
    setEditingCampaign(null);
    setSuccessBanner('Campanha atualizada com sucesso.');
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* SUCCESS NOTIFICATION BANNER */}
      {successBanner && (
        <div className="bg-emerald-950/80 border-2 border-emerald-500/60 p-4 rounded-2xl flex items-center justify-between shadow-xl text-emerald-300 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">{successBanner}</h4>
              <p className="text-xs text-emerald-400/90 mt-0.5">As alterações já foram sincronizadas e estão ativas na plataforma.</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-emerald-900/50 rounded-lg transition text-emerald-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-2xl shrink-0">
            <Megaphone className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                MÓDULO DE GESTÃO EXCLUSIVO
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider uppercase">Central de Publicidade Patrocinada</h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Gestão inteligente de campanhas publicitárias, métricas de engajamento, acompanhamento de patrocinadores e controle de exibição nos dashboards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-3.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-neutral-200 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition cursor-pointer border border-neutral-750 flex items-center justify-center gap-2 shadow-md hover:border-neutral-600"
            title="Configurações e Limpeza de Métricas da Central"
          >
            <Settings className="w-4 h-4 text-orange-500" />
            <span>Configurações</span>
          </button>

          <button
            onClick={() => {
              setWizardStep(1);
              setShowWizard(true);
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition cursor-pointer shadow-lg shadow-orange-500/25 shrink-0 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>NOVA CAMPANHA PUBLICITÁRIA</span>
          </button>
        </div>
      </div>

      {/* CHAVE GLOBAL DE VISUALIZAÇÃO DE PUBLICIDADES PARA O ADMINISTRADOR */}
      <div className="bg-[#141414] p-5 sm:p-6 rounded-3xl border border-neutral-800 shadow-2xl space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-850">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl shrink-0 border ${
              exibirPublicidadeAdmin
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                  CONTROLE GLOBAL DE VISUALIZAÇÃO
                </span>
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Exibir publicidades para o administrador
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                {exibirPublicidadeAdmin
                  ? 'O administrador visualiza as publicidades da mesma forma que os usuários cadastrados.'
                  : 'O administrador não visualizará as publicidades.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                if (onToggleExibirPublicidadeAdmin) {
                  onToggleExibirPublicidadeAdmin(!exibirPublicidadeAdmin);
                }
              }}
              className={`relative inline-flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer border shadow-lg ${
                exibirPublicidadeAdmin
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-red-950/80 hover:bg-red-900 border-red-500/50 text-red-300 shadow-red-500/10'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${exibirPublicidadeAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <span>{exibirPublicidadeAdmin ? '🟢 ATIVADO' : '🔴 DESATIVADO'}</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-neutral-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-orange-500 shrink-0" />
          <span>
            Esta chave afeta apenas a exibição no perfil do administrador. Os alunos e usuários cadastrados continuam visualizando as campanhas normalmente.
          </span>
        </div>
      </div>

      {/* DASHBOARD DE MÉTRICAS GERAIS (KPI CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* CARD 1: CAMPANHAS ATIVAS */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Campanhas Ativas</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-500">{totalActive}</p>
          <p className="text-[10px] text-neutral-500 mt-1 font-medium">Anúncios em exibição</p>
        </div>

        {/* CARD 2: CAMPANHAS ARQUIVADAS */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Arquivadas</span>
            <Archive className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-500">{totalArchived}</p>
          <p className="text-[10px] text-neutral-500 mt-1 font-medium">Histórico preservado</p>
        </div>

        {/* CARD 3: VISUALIZAÇÕES */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Visualizações</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-500">{totalViews.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-neutral-500 mt-1 font-medium">Impressões totais</p>
        </div>

        {/* CARD 4: CLIQUES TOTAIS */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Cliques Totais</span>
            <MousePointer className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-orange-500">{totalClicks.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-neutral-500 mt-1 font-medium">Engajamento de usuários</p>
        </div>

        {/* CARD 5: MAIS CLICADA */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Top Campanha</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-sm font-extrabold text-purple-400 truncate mt-1">
            {mostClicked?.nomeEmpresa || 'Sem registros'}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 font-medium">
            {mostClicked ? `${mostClicked.cliques || 0} cliques obtidos` : 'Aguardando cliques'}
          </p>
        </div>

        {/* CARD 6: ÚLTIMA PUBLICADA */}
        <div className="bg-[#141414] p-4.5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Último Lançamento</span>
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-sm font-extrabold text-cyan-400 truncate mt-1">
            {mostRecent?.nomeEmpresa || 'Nenhuma'}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 font-medium">
            {mostRecent?.dataCriacao ? mostRecent.dataCriacao.split(',')[0] : 'Indisponível'}
          </p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-3 border-b border-neutral-850 pb-3">
        <button
          onClick={() => setActiveTab('ativas')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'ativas'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
              : 'bg-[#141414] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Campanhas Ativas</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'ativas' ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {activeCampaigns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('arquivadas')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'arquivadas'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#141414] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Campanhas Arquivadas</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'arquivadas' ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {archivedCampaigns.length}
          </span>
        </button>
      </div>

      {/* LIST CONTENT */}
      {activeTab === 'ativas' ? (
        <div className="space-y-4">
          {activeCampaigns.length === 0 ? (
            <div className="bg-[#141414] p-12 rounded-3xl border border-neutral-850 text-center space-y-4">
              <Megaphone className="w-12 h-12 text-neutral-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Nenhuma campanha ativa no momento</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Clique no botão acima "NOVA CAMPANHA PUBLICITÁRIA" para cadastrar um novo patrocinador ou parceiro.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeCampaigns.map((pub) => {
                const ctr = ((pub.cliques || 0) / Math.max(pub.visualizacoes || 0, 1) * 100).toFixed(1);
                return (
                  <div
                    key={pub.id}
                    className="bg-[#141414] rounded-2xl border border-neutral-800 overflow-hidden shadow-lg hover:border-neutral-700 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* BANNER PREVIEW HEADER */}
                      <div className="relative aspect-[16/9] bg-neutral-950 border-b border-neutral-850 overflow-hidden group">
                        <img
                          src={pub.imagemUrl}
                          alt={pub.nomeEmpresa || 'Banner'}
                          className="w-full h-full object-contain bg-neutral-950 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-700 text-[10px] font-black text-orange-400 uppercase tracking-wider flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Slide {pub.slideNumero || 1}</span>
                        </div>
                        <div className="absolute top-2 right-2 bg-emerald-500/20 backdrop-blur-md text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">
                          Ativa
                        </div>
                      </div>

                      {/* CARD CONTENT */}
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 block">
                            Patrocinador / Empresa
                          </span>
                          <h3 className="text-base font-black text-white truncate">
                            {pub.nomeEmpresa || 'Empresa Patrocinadora'}
                          </h3>
                        </div>

                        {/* TARGET PAGES TAGS */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                              Páginas de Exibição ({pub.paginas?.length || 0})
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingCampaign(pub)}
                              className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1 cursor-pointer"
                              title="Marcar ou desmarcar páginas de exibição"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Editar Páginas</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {!pub.paginas || pub.paginas.length === 0 ? (
                              <span className="text-[10px] italic text-neutral-500">Nenhuma página selecionada</span>
                            ) : pub.paginas.includes('todas') || pub.paginas.length >= PAGE_OPTIONS.length - 1 ? (
                              <button
                                type="button"
                                onClick={() => setEditingCampaign(pub)}
                                className="text-[10px] font-black bg-orange-500/10 border border-orange-500/30 hover:border-orange-500 text-orange-400 px-2.5 py-1 rounded-lg transition cursor-pointer"
                              >
                                🌐 Exibição em Todas as Páginas
                              </button>
                            ) : (
                              pub.paginas.map((pId) => {
                                const opt = PAGE_OPTIONS.find((o) => o.id === pId);
                                const label = opt?.label.split(' ')[0] || pId;
                                return (
                                  <button
                                    key={pId}
                                    type="button"
                                    onClick={() => setEditingCampaign(pub)}
                                    className="text-[9px] font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md transition cursor-pointer"
                                    title="Clique para editar as páginas de exibição"
                                  >
                                    {opt?.label || pId}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* METRICS SUMMARY */}
                        <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 text-center">
                          <div>
                            <span className="text-[9px] text-neutral-500 uppercase font-bold block">Views</span>
                            <span className="text-xs font-black text-blue-400">{pub.visualizacoes || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-500 uppercase font-bold block">Cliques</span>
                            <span className="text-xs font-black text-orange-400">{pub.cliques || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-500 uppercase font-bold block">CTR %</span>
                            <span className="text-xs font-black text-emerald-400">{ctr}%</span>
                          </div>
                        </div>

                        {pub.linkUrl && (
                          <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1.5 bg-neutral-900/60 p-2 rounded-lg border border-neutral-850">
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <a
                              href={pub.linkUrl.startsWith('http') ? pub.linkUrl : `https://${pub.linkUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-orange-400 transition truncate underline"
                            >
                              {pub.linkUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CARD FOOTER ACTIONS */}
                    <div className="p-4 pt-0 border-t border-neutral-850/60 mt-3 flex items-center justify-between gap-2 pt-3">
                      <button
                        onClick={() => setSelectedMetricsCampaign(pub)}
                        className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 text-orange-400 border border-orange-500/30 hover:border-orange-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Métricas</span>
                      </button>

                      <button
                        onClick={() => setEditingCampaign(pub)}
                        className="p-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 rounded-xl transition cursor-pointer"
                        title="Editar Campanha"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          onArchivePublicidade(pub.id);
                          setSuccessBanner(`Campanha "${pub.nomeEmpresa || 'Anúncio'}" arquivada.`);
                          setTimeout(() => setSuccessBanner(null), 5000);
                        }}
                        className="p-2 bg-neutral-900 hover:bg-amber-950/40 text-amber-500 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition cursor-pointer"
                        title="Arquivar Campanha (Preserva histórico)"
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingCampaignId(pub.id)}
                        className="p-2 bg-neutral-900 hover:bg-red-950/40 text-red-500 border border-neutral-800 hover:border-red-500/40 rounded-xl transition cursor-pointer"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ARCHIVED CAMPAIGNS TAB */
        <div className="space-y-4">
          {archivedCampaigns.length === 0 ? (
            <div className="bg-[#141414] p-12 rounded-3xl border border-neutral-850 text-center space-y-4">
              <Archive className="w-12 h-12 text-neutral-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Nenhuma campanha arquivada</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Campanhas desativadas são armazenadas aqui com todo o seu histórico de métricas preservado.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {archivedCampaigns.map((pub) => {
                const ctr = ((pub.cliques || 0) / Math.max(pub.visualizacoes || 0, 1) * 100).toFixed(1);
                return (
                  <div
                    key={pub.id}
                    className="bg-[#141414] rounded-2xl border border-neutral-800/80 opacity-90 hover:opacity-100 overflow-hidden shadow-lg transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/9] bg-neutral-950 border-b border-neutral-850 overflow-hidden">
                        <img
                          src={pub.imagemUrl}
                          alt={pub.nomeEmpresa || 'Banner'}
                          className="w-full h-full object-contain bg-neutral-950 grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-amber-500/20 backdrop-blur-md text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">
                          Arquivada
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 block">
                            Patrocinador (Histórico)
                          </span>
                          <h3 className="text-base font-black text-white truncate">
                            {pub.nomeEmpresa || 'Empresa Patrocinadora'}
                          </h3>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 text-center">
                          <div>
                            <span className="text-[9px] text-neutral-500 uppercase font-bold block">Views</span>
                            <span className="text-xs font-black text-blue-400">{pub.visualizacoes || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-500 uppercase font-bold block">Cliques</span>
                            <span className="text-xs font-black text-orange-400">{pub.cliques || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-500 uppercase font-bold block">CTR %</span>
                            <span className="text-xs font-black text-emerald-400">{ctr}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-neutral-850/60 mt-3 flex items-center justify-between gap-2 pt-3">
                      <button
                        onClick={() => setSelectedMetricsCampaign(pub)}
                        className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-850 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Métricas</span>
                      </button>

                      <button
                        onClick={() => {
                          onRestorePublicidade(pub.id);
                          setSuccessBanner(`Campanha "${pub.nomeEmpresa || 'Anúncio'}" restaurada e ativada.`);
                          setTimeout(() => setSuccessBanner(null), 5000);
                        }}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reativar</span>
                      </button>

                      <button
                        onClick={() => setDeletingCampaignId(pub.id)}
                        className="p-2 bg-neutral-900 hover:bg-red-950/40 text-red-500 border border-neutral-800 hover:border-red-500/40 rounded-xl transition cursor-pointer"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: WIZARD DE CRIAÇÃO EM 6 ETAPAS */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border-2 border-orange-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left animate-scale-in my-8">
            {/* WIZARD HEADER */}
            <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    PASSO {wizardStep} DE 6
                  </span>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">
                    {wizardStep === 1 && '1. Identificação do Patrocinador'}
                    {wizardStep === 2 && '2. Páginas de Exibição'}
                    {wizardStep === 3 && '3. URL de Destino'}
                    {wizardStep === 4 && '4. Upload da Imagem & Slide'}
                    {wizardStep === 5 && '5. Resumo da Campanha'}
                    {wizardStep === 6 && '6. Confirmação & Publicação'}
                  </h2>
                </div>
              </div>

              <button
                onClick={resetWizardForm}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mb-8">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-300"
                style={{ width: `${(wizardStep / 6) * 100}%` }}
              />
            </div>

            {/* STEP 1: PATROCINADOR / EMPRESA */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Nome da Empresa / Patrocinador *
                  </label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Ex: Kimonos Atama, Academias BJJ, Suplementos Pro..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-2xl px-4 py-3.5 text-sm text-white outline-none transition"
                    autoFocus
                  />
                </div>

                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 flex items-start gap-3 text-xs text-neutral-400">
                  <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-white">Uso exclusivamente interno:</strong> Este nome é utilizado na Central para organização, relatórios e controle de métricas. Ele não será exibido em texto público dentro dos banners.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: PÁGINAS DE EXIBIÇÃO */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Selecione onde o banner será exibido
                  </span>
                  <button
                    onClick={() => {
                      if (newPages.length === PAGE_OPTIONS.length) {
                        setNewPages([]);
                      } else {
                        setNewPages(PAGE_OPTIONS.map((p) => p.id));
                      }
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    {newPages.length === PAGE_OPTIONS.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {PAGE_OPTIONS.map((page) => {
                    const isSelected = newPages.includes(page.id) || newPages.includes('todas');
                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => togglePageSelection(page.id)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-orange-400'
                            : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-750'
                        }`}
                      >
                        <span>{page.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: URL DE DESTINO */}
            {wizardStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    URL / Link de Destino da Publicidade (Opcional)
                  </label>
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://instagram.com/patrocinador ou https://siteoficial.com.br"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-2xl px-4 py-3.5 text-sm text-white outline-none transition"
                  />
                </div>

                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 text-xs text-neutral-400 space-y-2">
                  <p className="font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-500" />
                    Destinos aceitos:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-400">
                    <li>Sites, Lojas Virtuais, Landing Pages</li>
                    <li>Perfis de Instagram, Facebook, LinkedIn</li>
                    <li>Links diretos do WhatsApp Business</li>
                    <li>Canais do YouTube ou Vídeos Promocionais</li>
                  </ul>
                  <p className="text-[10px] text-neutral-500 pt-1">
                    * Ao clicar em qualquer parte do banner, o usuário será direcionado para este link em uma nova guia.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: UPLOAD DA IMAGEM & SLIDE */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Upload da Imagem do Banner *
                  </label>
                  <div className="border-2 border-dashed border-neutral-800 hover:border-orange-500/60 rounded-2xl p-6 text-center bg-neutral-950 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {newImage ? (
                      <div className="space-y-3">
                        <img
                          src={newImage}
                          alt="Preview"
                          className="max-h-40 mx-auto rounded-xl object-contain border border-neutral-800"
                        />
                        <span className="text-xs text-orange-400 font-bold block">Clique para alterar a imagem</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Megaphone className="w-10 h-10 text-neutral-600 mx-auto" />
                        <p className="text-xs font-bold text-neutral-300">Arraste ou selecione a imagem da campanha</p>
                        <p className="text-[10px] text-neutral-500">Formatos aceitos: PNG, JPG, WEBP (Ideal: 16:9 ou banner retangular)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Posição do Slide no Carrossel
                  </label>
                  <select
                    value={newSlide}
                    onChange={(e) => setNewSlide(parseInt(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-xs outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        Slide {num} {num === 1 ? '(Primeiro Anúncio)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 5: RESUMO DA CAMPANHA */}
            {wizardStep === 5 && (
              <div className="space-y-4">
                <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                    <span className="text-xs font-black uppercase text-orange-400 tracking-wider">Resumo da Campanha</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                      Pronta para Publicação
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-neutral-500 font-bold block">Patrocinador:</span>
                      <span className="text-white font-extrabold text-sm">{newCompany || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-bold block">Slide Alocado:</span>
                      <span className="text-white font-extrabold text-sm">Slide {newSlide}</span>
                    </div>
                  </div>

                  {newImage && (
                    <div>
                      <span className="text-neutral-500 font-bold text-xs block mb-1">Pré-visualização do Banner:</span>
                      <div className="aspect-[16/9] bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800">
                        <img src={newImage} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-neutral-500 font-bold text-xs block mb-1">Páginas de Exibição ({newPages.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {newPages.map((pId) => {
                        const opt = PAGE_OPTIONS.find((o) => o.id === pId);
                        return (
                          <span key={pId} className="text-[10px] bg-neutral-900 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded-md">
                            {opt?.label || pId}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {newLink && (
                    <div>
                      <span className="text-neutral-500 font-bold text-xs block mb-0.5">URL de Destino:</span>
                      <span className="text-orange-400 text-xs font-mono break-all">{newLink}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: CONFIRMAÇÃO E PUBLICAÇÃO */}
            {wizardStep === 6 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Tudo pronto para publicar!</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
                    A campanha para <strong className="text-white">{newCompany}</strong> será ativada imediatamente nas páginas selecionadas.
                  </p>
                </div>

                <button
                  onClick={handleFinishWizard}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-sm uppercase tracking-widest rounded-2xl transition cursor-pointer shadow-xl shadow-emerald-500/20"
                >
                  CONFIRMAR PUBLICAÇÃO DA CAMPANHA
                </button>
              </div>
            )}

            {/* WIZARD NAVIGATION FOOTER */}
            {wizardStep < 6 && (
              <div className="flex items-center justify-between border-t border-neutral-850 pt-6 mt-6">
                <button
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                  disabled={wizardStep === 1}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  onClick={() => {
                    if (wizardStep === 1 && !newCompany.trim()) {
                      alert('Informe o nome da empresa patrocinadora.');
                      return;
                    }
                    if (wizardStep === 2 && newPages.length === 0) {
                      alert('Selecione ao menos uma página.');
                      return;
                    }
                    if (wizardStep === 4 && !newImage) {
                      alert('Faça o upload da imagem.');
                      return;
                    }
                    setWizardStep((prev) => Math.min(6, prev + 1));
                  }}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: INDIVIDUAL CAMPAIGN METRICS DASHBOARD */}
      {selectedMetricsCampaign && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border-2 border-neutral-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left animate-scale-in my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    DASHBOARD DE DESEMPENHO INDIVIDUAL
                  </span>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">
                    {selectedMetricsCampaign.nomeEmpresa || 'Campanha Publicitária'}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedMetricsCampaign(null)}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BANNER PREVIEW */}
            <div className="aspect-[16/9] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-850 relative">
              <img src={selectedMetricsCampaign.imagemUrl} alt="Banner" className="w-full h-full object-contain" />
            </div>

            {/* METRICS CARDS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 text-center">
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">Visualizações</span>
                <span className="text-xl font-black text-blue-400 mt-1 block">
                  {selectedMetricsCampaign.visualizacoes || 0}
                </span>
              </div>
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 text-center">
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">Cliques Recebidos</span>
                <span className="text-xl font-black text-orange-400 mt-1 block">
                  {selectedMetricsCampaign.cliques || 0}
                </span>
              </div>
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 text-center">
                <span className="text-[10px] text-neutral-500 font-bold uppercase block">Taxa de Cliques (CTR)</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  {((selectedMetricsCampaign.cliques || 0) / Math.max(selectedMetricsCampaign.visualizacoes || 0, 1) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* DETAILS */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-850 space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-900 pb-2">
                <span className="text-neutral-500 font-bold">Data de Criação:</span>
                <span className="text-white font-mono">{selectedMetricsCampaign.dataCriacao || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-2">
                <span className="text-neutral-500 font-bold">Última Edição:</span>
                <span className="text-white font-mono">{selectedMetricsCampaign.dataUltimaEdicao || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-2">
                <span className="text-neutral-500 font-bold">Status Atual:</span>
                <span className={`font-bold uppercase ${selectedMetricsCampaign.status === 'arquivada' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedMetricsCampaign.status || 'Ativa'}
                </span>
              </div>
              {selectedMetricsCampaign.linkUrl && (
                <div className="flex justify-between pt-1">
                  <span className="text-neutral-500 font-bold">Link da Publicidade:</span>
                  <a
                    href={selectedMetricsCampaign.linkUrl.startsWith('http') ? selectedMetricsCampaign.linkUrl : `https://${selectedMetricsCampaign.linkUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 hover:underline truncate max-w-[250px]"
                  >
                    {selectedMetricsCampaign.linkUrl}
                  </a>
                </div>
              )}
            </div>

            {/* CLICK HISTORY LOG */}
            <div>
              <h4 className="text-xs font-black uppercase text-neutral-300 tracking-wider mb-2">Histórico Recente de Cliques</h4>
              <div className="bg-neutral-950 rounded-2xl border border-neutral-850 max-h-36 overflow-y-auto p-3 text-xs">
                {selectedMetricsCampaign.historicoCliques && selectedMetricsCampaign.historicoCliques.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedMetricsCampaign.historicoCliques.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-neutral-900 pb-1 text-[11px]">
                        <span className="text-neutral-400 font-mono">{log.dataHora}</span>
                        <span className="text-orange-400 font-bold uppercase">{log.pagina}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-neutral-500 py-4 text-xs">Nenhum clique registrado até o momento.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIÇÃO DE CAMPANHA */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border-2 border-neutral-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-left animate-scale-in my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" />
                <span>Editar Campanha Publicitária</span>
              </h3>
              <button
                onClick={() => setEditingCampaign(null)}
                className="p-2 bg-neutral-900 text-neutral-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Nome do Patrocinador / Empresa
              </label>
              <input
                type="text"
                value={editingCampaign.nomeEmpresa || ''}
                onChange={(e) => setEditingCampaign({ ...editingCampaign, nomeEmpresa: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                URL da Publicidade (Link de Destino)
              </label>
              <input
                type="url"
                value={editingCampaign.linkUrl || ''}
                onChange={(e) => setEditingCampaign({ ...editingCampaign, linkUrl: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Slide Alocado
              </label>
              <select
                value={editingCampaign.slideNumero || 1}
                onChange={(e) => setEditingCampaign({ ...editingCampaign, slideNumero: parseInt(e.target.value) })}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-2.5 text-xs outline-none focus:border-orange-500 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    Slide {n}
                  </option>
                ))}
              </select>
            </div>

            {/* PÁGINAS DE EXIBIÇÃO (MARCAR E DESMARCAR) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Páginas de Exibição ({editingCampaign.paginas?.length || 0} Selecionadas)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCampaign({
                        ...editingCampaign,
                        paginas: PAGE_OPTIONS.map((p) => p.id),
                      })
                    }
                    className="text-[10px] font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    Marcar Todas
                  </button>
                  <span className="text-neutral-600 text-[10px]">|</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCampaign({
                        ...editingCampaign,
                        paginas: [],
                      })
                    }
                    className="text-[10px] font-bold text-neutral-400 hover:underline cursor-pointer"
                  >
                    Desmarcar Todas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 max-h-56 overflow-y-auto">
                {PAGE_OPTIONS.map((opt) => {
                  const currentPages = editingCampaign.paginas || [];
                  const isChecked = currentPages.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                        isChecked
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
                          : 'bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (opt.id === 'todas') {
                            if (isChecked) {
                              setEditingCampaign({ ...editingCampaign, paginas: [] });
                            } else {
                              setEditingCampaign({ ...editingCampaign, paginas: PAGE_OPTIONS.map((p) => p.id) });
                            }
                          } else {
                            if (isChecked) {
                              setEditingCampaign({
                                ...editingCampaign,
                                paginas: currentPages.filter((p) => p !== opt.id && p !== 'todas'),
                              });
                            } else {
                              setEditingCampaign({
                                ...editingCampaign,
                                paginas: [...currentPages, opt.id],
                              });
                            }
                          }
                        }}
                        className="rounded border-neutral-700 bg-neutral-900 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 w-3.5 h-3.5 shrink-0"
                      />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-850">
              <button
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 bg-neutral-900 text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase rounded-xl transition cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÕES DA CENTRAL DE PUBLICIDADE */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-neutral-800 shadow-2xl text-left space-y-6 animate-scale-in relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-850 pb-4">
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-2xl">
                <Settings className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Configurações da Publicidade</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Gestão de estatísticas e parâmetros administrativos</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* CONFIG ITEM 1: VISIBILIDADE GLOBAL ADMIN */}
              <div className="bg-[#181818] p-4 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-orange-500" />
                      <span>Exibir publicidades para o administrador</span>
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      {exibirPublicidadeAdmin
                        ? 'O administrador visualiza as publicidades nas áreas de exibição.'
                        : 'O administrador não visualizará as publicidades.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleExibirPublicidadeAdmin) {
                        onToggleExibirPublicidadeAdmin(!exibirPublicidadeAdmin);
                      }
                    }}
                    className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                      exibirPublicidadeAdmin
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-red-950/80 border-red-500/50 text-red-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${exibirPublicidadeAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span>{exibirPublicidadeAdmin ? '🟢 ATIVADO' : '🔴 DESATIVADO'}</span>
                  </button>
                </div>
              </div>

              {/* CONFIG ITEM 2: LIMPAR MÉTRICAS */}
              <div className="bg-[#181818] p-4 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-500" />
                      <span>Limpar Histórico de Métricas</span>
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Zera permanentemente os contadores acumulados de <strong>visualizações</strong>, <strong>cliques</strong> e o <strong>histórico de interações</strong> de todas as campanhas (ativas e arquivadas).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl text-[11px] text-orange-400 font-medium leading-relaxed">
                  🔒 <strong>Aviso de Segurança:</strong> As campanhas, imagens, links, empresas e configurações de exibição <strong>NÃO</strong> serão apagadas. Somente os contadores numéricos serão zerados.
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmModal(true)}
                    className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar Métricas</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE LIMPEZA DE MÉTRICAS */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border-2 border-red-500/40 shadow-2xl text-left space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">Atenção! Confirmação Obrigatória</h3>
                <p className="text-[11px] text-red-400 font-bold">Ação Irreversível</p>
              </div>
            </div>

            <p className="text-neutral-200 text-xs leading-relaxed bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              Tem certeza que deseja apagar todas as métricas da Central de Publicidade?
              <br /><br />
              <strong className="text-white block">Esta ação não poderá ser desfeita.</strong>
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetAllMetrics) {
                    onResetAllMetrics();
                  } else {
                    // Fallback to resetting individually via onUpdatePublicidade
                    publicidades.forEach((p) => {
                      onUpdatePublicidade({
                        ...p,
                        visualizacoes: 0,
                        cliques: 0,
                        historicoCliques: [],
                      });
                    });
                  }
                  setShowResetConfirmModal(false);
                  setShowConfigModal(false);
                  setSuccessBanner('Métricas da Central de Publicidade zeradas com sucesso!');
                  setTimeout(() => setSuccessBanner(null), 5000);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-red-600/30 transition cursor-pointer uppercase tracking-wider"
              >
                Sim, Limpar Métricas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingCampaignId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl text-left space-y-4 animate-scale-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Excluir Campanha
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed">
              Tem certeza que deseja excluir esta campanha permanentemente? Se desejar apenas ocultá-la mantendo suas métricas, escolha <strong className="text-amber-400">Arquivar</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingCampaignId(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRemovePublicidade(deletingCampaignId);
                  setDeletingCampaignId(null);
                  setSuccessBanner('Campanha removida permanentemente.');
                  setTimeout(() => setSuccessBanner(null), 4000);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/20 transition cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

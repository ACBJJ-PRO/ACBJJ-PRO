import React, { useState, useRef, useEffect } from 'react';
import { VideoItem, User, LiveStreamItem, LiveSponsor, Student, ClassUnit } from '../types';
import {
  PlayCircle,
  Video,
  Plus,
  FileVideo,
  Youtube,
  Trash2,
  Upload,
  Radio,
  Calendar,
  Clock,
  Users,
  Shield,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Share2,
  Sparkles,
  Trophy,
  Award,
  AlertCircle,
  X,
  Edit2,
  Copy,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Info,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  AlertTriangle,
  RotateCcw,
  Hand,
  Terminal,
  Settings,
  Activity
} from 'lucide-react';

interface VideosPaneProps {
  user: User;
  videos: VideoItem[];
  onAddVideo: (titulo: string, descricao: string, url: string, base64Local: string | null) => void;
  onExcluirVideo: (id: number) => void;
  liveStreams?: LiveStreamItem[];
  onUpdateLiveStreams?: (streams: LiveStreamItem[]) => void;
  alunos?: Student[];
  turmas?: ClassUnit[];
  confrontoCampeonatos?: any[];
  onAddNotification?: (texto: string, para: string) => void;
  themeKey?: string;
}

export default function VideosPane({
  user,
  videos,
  onAddVideo,
  onExcluirVideo,
  liveStreams = [],
  onUpdateLiveStreams,
  alunos = [],
  turmas = [],
  confrontoCampeonatos = [],
  onAddNotification,
  themeKey,
}: VideosPaneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sponsorFileInputRef = useRef<HTMLInputElement>(null);
  const liveRoomSponsorFileInputRef = useRef<HTMLInputElement>(null);
  const videoMediaRef = useRef<HTMLVideoElement>(null);

  const [selectedModuleTab, setSelectedModuleTab] = useState<'video_aulas' | 'ao_vivo'>('video_aulas');

  // Recorded Videos States
  const [selectedVideoName, setSelectedVideoName] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [url, setUrl] = useState('');
  const [localVideoBase64, setLocalVideoBase64] = useState<string | null>(null);
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<number | null>(null);

  // Live Streams States
  const [isCreatingStreamModal, setIsCreatingStreamModal] = useState(false);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [selectedActiveViewerStream, setSelectedActiveViewerStream] = useState<LiveStreamItem | null>(null);
  const [managingSponsorsStreamId, setManagingSponsorsStreamId] = useState<string | null>(null);
  const [deletingStreamConfirmItem, setDeletingStreamConfirmItem] = useState<LiveStreamItem | null>(null);

  // Live Media Room Interactive States & Mobile Camera Switching
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [isMicOn, setIsMicOn] = useState(user.tipo === 'admin');
  const [isCameraOn, setIsCameraOn] = useState(user.tipo === 'admin');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeRoomViewMode, setActiveRoomViewMode] = useState<'studio'>('studio');
  const [isLiveSponsorsDrawerOpen, setIsLiveSponsorsDrawerOpen] = useState(false);
  const [activeRoomTab, setActiveRoomTab] = useState<'chat' | 'participants' | 'logs'>('chat');
  const [streamQualityMode, setStreamQualityMode] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [isRecording, setIsRecording] = useState(true);
  const [activeParticipantsList, setActiveParticipantsList] = useState<string[]>([]);
  const [handRaisedUsers, setHandRaisedUsers] = useState<string[]>([]);
  const [mutedParticipants, setMutedParticipants] = useState<string[]>([]);
  const [technicalLogs, setTechnicalLogs] = useState<{ id: string; timestamp: string; level: 'info' | 'warn' | 'error' | 'success'; message: string }[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'end_stream' | 'leave_room' | 'end_recording' | 'remove_participant' | 'mute_all' | null;
    participantName?: string;
    title?: string;
    message?: string;
    confirmAction?: () => void;
  }>({ open: false, type: null });

  const [liveChatMessages, setLiveChatMessages] = useState<
    { id: string; sender: string; text: string; time: string; isAdmin?: boolean }[]
  >([
    { id: '1', sender: 'Sistema Arena', text: 'Bem-vindo ao Estúdio Arena! Transmissão ao vivo em tempo real iniciada.', time: 'Agora', isAdmin: true },
  ]);
  const [chatInputText, setChatInputText] = useState('');

  // Technical Diagnostics Logger
  const addTechnicalLog = (message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setTechnicalLogs((prev) => [
      ...prev,
      { id: Math.random().toString(), timestamp, level, message },
    ]);
  };

  // Form for Stream Creation/Editing
  const [streamForm, setStreamForm] = useState({
    titulo: '',
    descricao: '',
    dataHoraAgendada: new Date().toISOString().slice(0, 16),
    duracaoMinutos: 60,
    professorNome: user.nome || 'Mestre Responsável',
    publicoAlvo: 'todos' as LiveStreamItem['publicoAlvo'],
    turmaTarget: '',
    categoriaTarget: '',
    usuariosTargetIds: [] as number[],
    isCampeonato: false,
    campeonatoId: '',
    tipoProvedor: 'google_meet' as 'google_meet' | 'estudio_arena' | 'zoom' | 'teams' | 'youtube' | 'vimeo',
    customMeetUrl: '',
  });

  // URL Validation Helper for Google Meet Links
  const isValidMeetUrl = (urlStr: string) => {
    if (!urlStr || urlStr.trim().length < 8) return false;
    const clean = urlStr.trim().toLowerCase();
    return clean.includes('meet.google.com') || clean.startsWith('http://') || clean.startsWith('https://');
  };

  // Handler for Participants to Enter Stream
  const handleEnterStream = (stream: LiveStreamItem) => {
    const provider = stream.tipoProvedor || 'google_meet';

    if (provider === 'google_meet') {
      if (!stream.meetUrl || stream.meetUrl.trim().length === 0) {
        alert('⚠️ O link do Google Meet para esta transmissão ainda não foi configurado pelo Administrador ou Professor responsável.');
        return;
      }
      let urlToOpen = stream.meetUrl.trim();
      if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
        urlToOpen = 'https://' + urlToOpen;
      }
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    } else if (provider === 'estudio_arena') {
      setSelectedActiveViewerStream(stream);
    } else {
      if (stream.meetUrl && stream.meetUrl.trim().length > 0) {
        let urlToOpen = stream.meetUrl.trim();
        if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
          urlToOpen = 'https://' + urlToOpen;
        }
        window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      } else {
        alert('⚠️ O link para a transmissão externa ainda não foi configurado.');
      }
    }
  };

  // Handler for Admin to Edit Stream
  const handleEditStream = (stream: LiveStreamItem) => {
    setEditingStreamId(stream.id);
    setStreamForm({
      titulo: stream.titulo,
      descricao: stream.descricao,
      dataHoraAgendada: stream.dataHoraAgendada ? new Date(stream.dataHoraAgendada).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      duracaoMinutos: stream.duracaoMinutos || 60,
      professorNome: stream.professorNome || user.nome || 'Mestre Responsável',
      publicoAlvo: stream.publicoAlvo || 'todos',
      turmaTarget: stream.turmaTarget || '',
      categoriaTarget: stream.categoriaTarget || '',
      usuariosTargetIds: stream.usuariosTargetIds || [],
      isCampeonato: !!stream.isCampeonato,
      campeonatoId: stream.campeonatoId || '',
      tipoProvedor: stream.tipoProvedor || 'google_meet',
      customMeetUrl: stream.meetUrl || '',
    });
    setIsCreatingStreamModal(true);
  };

  // Sponsor Form State
  const [sponsorForm, setSponsorForm] = useState({
    nome: '',
    imagemUrl: '',
    localBase64: null as string | null,
    tempoExibicaoSegundos: 15,
  });

  const [copiedLink, setCopiedLink] = useState(false);

  const getThemeColorClass = (key?: string) => {
    switch (key) {
      case 'blue':
        return { text: 'text-blue-400', focusBorder: 'focus:border-blue-500', border: 'border-blue-500/20', bgGradient: 'from-blue-500 to-indigo-600' };
      case 'emerald':
        return { text: 'text-emerald-400', focusBorder: 'focus:border-emerald-500', border: 'border-emerald-500/20', bgGradient: 'from-emerald-500 to-teal-600' };
      case 'purple':
        return { text: 'text-purple-400', focusBorder: 'focus:border-purple-500', border: 'border-purple-500/20', bgGradient: 'from-purple-500 to-fuchsia-600' };
      case 'red':
        return { text: 'text-red-400', focusBorder: 'focus:border-red-500', border: 'border-red-500/20', bgGradient: 'from-red-500 to-rose-600' };
      case 'orange':
      default:
        return { text: 'text-orange-400', focusBorder: 'focus:border-orange-500', border: 'border-orange-500/20', bgGradient: 'from-orange-500 to-red-600' };
    }
  };
  const theme = getThemeColorClass(themeKey);

  // Sync selected viewer stream if liveStreams updates & emit join event
  useEffect(() => {
    if (selectedActiveViewerStream) {
      const updated = liveStreams.find((s) => s.id === selectedActiveViewerStream.id);
      if (updated) {
        setSelectedActiveViewerStream(updated);
      }

      const userName = user.nome || 'Atleta / Mestre';
      const roleLabel = user.tipo === 'admin' ? 'Administrador' : user.tipo === 'professor' ? 'Professor' : user.tipo === 'instrutor' ? 'Instrutor' : 'Aluno Spectador';

      // Role Auto Media Rules:
      // Admin: Camera & Mic ON by default
      // Professor / Instrutor: Camera & Mic OFF by default (spectator, can activate)
      // Aluno / Atleta: STRICT Spectator! Camera & Mic OFF by default
      if (user.tipo === 'admin') {
        setIsCameraOn(true);
        setIsMicOn(true);
      } else {
        setIsCameraOn(false);
        setIsMicOn(false);
      }

      setLiveChatMessages((prev) => {
        const hasJoinMsg = prev.some((m) => m.id === `join-${selectedActiveViewerStream.id}-${userName}`);
        if (hasJoinMsg) return prev;
        return [
          ...prev,
          {
            id: `join-${selectedActiveViewerStream.id}-${userName}`,
            sender: 'Estúdio Arena',
            text: `👋 ${userName} (${roleLabel}) entrou no Estúdio Arena.`,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isAdmin: true,
          },
        ];
      });

      setActiveParticipantsList((prev) => {
        const set = new Set([
          userName,
          selectedActiveViewerStream.professorNome || 'Mestre Responsável',
          'Mestre Carlos (Coordenador)',
          'Prof. Felipe (Instrutor)',
          'Atleta Gabriel (Competidor)',
          ...prev,
        ]);
        return Array.from(set).filter(Boolean);
      });

      addTechnicalLog(`📡 Conectado ao Estúdio Arena (${selectedActiveViewerStream.titulo}). Perfil: ${userName} [${roleLabel}]`, 'success');
      addTechnicalLog(`🎥 Mídia inicial configurada: Câmera ${user.tipo === 'admin' ? 'Ativada' : 'Desativada (Modo Espectador)'}`, 'info');
    }
  }, [selectedActiveViewerStream?.id]);

  // Handle mobile camera flip (Front <-> Back)
  const handleFlipCamera = async () => {
    const nextFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacingMode);
    addTechnicalLog(`🔄 Alternando câmera para modo: ${nextFacingMode === 'user' ? 'Frontal (Selfie)' : 'Traseira (Ambiente)'}`, 'info');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacingMode, width: { ideal: streamQualityMode === '1080p' ? 1920 : streamQualityMode === '720p' ? 1280 : 854 } },
          audio: isMicOn,
        });
        setIsCameraOn(true);
        if (videoMediaRef.current) {
          videoMediaRef.current.srcObject = stream;
        }
        addTechnicalLog(`✅ Câmera alternada para ${nextFacingMode === 'user' ? 'Frontal' : 'Traseira'} com sucesso`, 'success');
      } catch (err) {
        addTechnicalLog(`⚠️ Falha ao alternar câmera: ${(err as Error).message}`, 'error');
        alert('⚠️ Não foi possível alternar a câmera. Verifique se o seu dispositivo possui uma segunda câmera ativa.');
      }
    }
  };

  // Explicit user camera activation handler with browser permission prompt
  const handleEnableCamera = async () => {
    if (user.tipo !== 'admin' && user.tipo !== 'professor' && user.tipo !== 'instrutor') {
      alert('🔒 Alunos entram na sala exclusivamente como espectadores. A publicação de vídeo é reservada aos professores e administradores.');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacingMode, width: { ideal: streamQualityMode === '1080p' ? 1920 : streamQualityMode === '720p' ? 1280 : 854 } },
          audio: isMicOn,
        });
        setIsCameraOn(true);
        setIsScreenSharing(false);
        if (videoMediaRef.current) {
          videoMediaRef.current.srcObject = stream;
        }
        addTechnicalLog('🎥 Câmera ativada e transmitindo no Estúdio Arena.', 'success');
      }
    } catch (err) {
      addTechnicalLog(`⚠️ Falha na permissão da câmera: ${(err as Error).message}`, 'error');
      alert('⚠️ Permissão para câmera não concedida ou dispositivo indisponível.');
    }
  };

  // Explicit user screen share activation handler with browser permission prompt
  const handleEnableScreenShare = async () => {
    if (user.tipo !== 'admin' && user.tipo !== 'professor' && user.tipo !== 'instrutor') {
      alert('🔒 Apenas Administradores e Professores podem compartilhar tela na transmissão.');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setIsScreenSharing(true);
        setIsCameraOn(true);
        if (videoMediaRef.current) {
          videoMediaRef.current.srcObject = stream;
        }
        addTechnicalLog('🖥️ Compartilhamento de tela iniciado com sucesso.', 'success');
      }
    } catch (err) {
      addTechnicalLog('⚠️ Compartilhamento de tela cancelado.', 'warn');
    }
  };

  // Student Raise Hand / Request Mic
  const handleToggleRaiseHand = () => {
    const userName = user.nome || 'Aluno';
    const isHandUp = handRaisedUsers.includes(userName);
    if (isHandUp) {
      setHandRaisedUsers((prev) => prev.filter((u) => u !== userName));
      addTechnicalLog(`✋ ${userName} baixou a mão.`, 'info');
    } else {
      setHandRaisedUsers((prev) => [...prev, userName]);
      setLiveChatMessages((prev) => [
        ...prev,
        {
          id: `hand-${Date.now()}`,
          sender: 'Sistema Arena',
          text: `✋ ${userName} levantou a mão e solicitou permissão de fala no Estúdio Arena!`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isAdmin: true,
        },
      ]);
      addTechnicalLog(`✋ ${userName} levantou a mão.`, 'warn');
    }
  };

  // Confirmation Trigger Functions for Critical Actions
  const triggerConfirmEndStream = () => {
    setConfirmModal({
      open: true,
      type: 'end_stream',
      title: '🔴 Encerrar Transmissão no Estúdio Arena?',
      message: 'Esta ação irá desconectar todos os participantes da sala, finalizar a gravação em tempo real e armazená-la automaticamente na biblioteca de vídeo aulas.',
      confirmAction: () => {
        if (selectedActiveViewerStream) {
          handleChangeStreamStatus(selectedActiveViewerStream.id, 'encerrada');
          addTechnicalLog('🔴 Transmissão encerrada e salva na biblioteca.', 'warn');
        }
        setConfirmModal({ open: false, type: null });
      },
    });
  };

  const triggerConfirmLeaveRoom = () => {
    setConfirmModal({
      open: true,
      type: 'leave_room',
      title: '🚪 Sair do Estúdio Arena?',
      message: 'Você será desconectado da chamada ao vivo e retornará ao catálogo de vídeo aulas.',
      confirmAction: () => {
        addTechnicalLog(`🚪 ${user.nome} desconectou-se do Estúdio Arena.`, 'info');
        setSelectedActiveViewerStream(null);
        setConfirmModal({ open: false, type: null });
      },
    });
  };

  const triggerConfirmRemoveParticipant = (pName: string) => {
    setConfirmModal({
      open: true,
      type: 'remove_participant',
      participantName: pName,
      title: `🚫 Remover ${pName} da Sala?`,
      message: `Tem certeza que deseja remover "${pName}" do Estúdio Arena? O participante será desconectado imediatamente.`,
      confirmAction: () => {
        setActiveParticipantsList((prev) => prev.filter((n) => n !== pName));
        setLiveChatMessages((prev) => [
          ...prev,
          {
            id: `remove-${Date.now()}`,
            sender: 'Sistema Arena',
            text: `🚫 ${pName} foi removido da sala pelo Administrador.`,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isAdmin: true,
          },
        ]);
        addTechnicalLog(`🚫 Participante "${pName}" removido pelo Administrador.`, 'warn');
        setConfirmModal({ open: false, type: null });
      },
    });
  };

  const triggerConfirmMuteAll = () => {
    setConfirmModal({
      open: true,
      type: 'mute_all',
      title: '🎙️ Silenciar Todos os Alunos?',
      message: 'Esta ação irá desativar imediatamente o microfone de todos os alunos e espectadores na sala.',
      confirmAction: () => {
        const studentNames = activeParticipantsList.filter(
          (n) => n !== user.nome && n !== selectedActiveViewerStream?.professorNome
        );
        setMutedParticipants((prev) => Array.from(new Set([...prev, ...studentNames])));
        setLiveChatMessages((prev) => [
          ...prev,
          {
            id: `muteall-${Date.now()}`,
            sender: 'Sistema Arena',
            text: '🎙️ O Administrador silenciou o microfone de todos os alunos.',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isAdmin: true,
          },
        ]);
        addTechnicalLog('🎙️ Todos os alunos silenciados pelo Administrador.', 'warn');
        setConfirmModal({ open: false, type: null });
      },
    });
  };

  // Handle local camera & mic initialization inside Live Studio Room
  useEffect(() => {
    let activeStreamTracks: MediaStream | null = null;

    if (selectedActiveViewerStream?.status === 'ao_vivo' && isCameraOn && !isScreenSharing) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: isMicOn })
          .then((stream) => {
            activeStreamTracks = stream;
            if (videoMediaRef.current) {
              videoMediaRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.log('Ambiente de transmissão ativo via Estúdio Digital Arena:', err);
          });
      }
    }

    return () => {
      if (activeStreamTracks) {
        activeStreamTracks.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedActiveViewerStream?.id, selectedActiveViewerStream?.status, isCameraOn, isMicOn, isScreenSharing]);

  const handleLocalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('⚠️ O arquivo de vídeo é muito grande (limite de 25MB para armazenamento local). Considere usar link do YouTube.');
        return;
      }
      setSelectedVideoName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLocalVideoBase64(event.target.result as string);
          setUrl('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) {
      alert('Preencha o título do vídeo!');
      return;
    }
    if (!url && !localVideoBase64) {
      alert('Insira uma URL do YouTube ou selecione um arquivo de vídeo local!');
      return;
    }

    onAddVideo(titulo, descricao, url, localVideoBase64);
    alert('Vídeo aula adicionada à biblioteca com sucesso!');
    setTitulo('');
    setDescricao('');
    setUrl('');
    setLocalVideoBase64(null);
  };

  // Helper to save live streams
  const saveLiveStreams = (newList: LiveStreamItem[]) => {
    if (onUpdateLiveStreams) {
      onUpdateLiveStreams(newList);
    }
  };

  // Create / Edit Live Stream
  const handleSaveStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamForm.titulo) {
      alert('Preencha o título da transmissão!');
      return;
    }

    if (streamForm.tipoProvedor === 'google_meet') {
      if (!streamForm.customMeetUrl || streamForm.customMeetUrl.trim().length === 0) {
        alert('⚠️ Por favor, informe o Link da Reunião do Google Meet para esta transmissão.');
        return;
      }
      if (!isValidMeetUrl(streamForm.customMeetUrl)) {
        alert('⚠️ O link inserido não possui um formato válido do Google Meet. Exemplo de link válido: https://meet.google.com/xxx-xxxx-xxx');
        return;
      }
    }

    const cleanMeetUrl = () => {
      let clean = (streamForm.customMeetUrl || '').trim();
      if (!clean) return 'https://meet.new';
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      return clean;
    };

    const targetChamp = confrontoCampeonatos.find((c) => String(c.id) === String(streamForm.campeonatoId));
    const finalMeetUrl = cleanMeetUrl();

    if (editingStreamId) {
      // Edit existing
      const updatedList = liveStreams.map((s) => {
        if (s.id === editingStreamId) {
          return {
            ...s,
            titulo: streamForm.titulo,
            descricao: streamForm.descricao,
            dataHoraAgendada: new Date(streamForm.dataHoraAgendada).toISOString(),
            duracaoMinutos: Number(streamForm.duracaoMinutos) || 60,
            professorNome: streamForm.professorNome,
            publicoAlvo: streamForm.publicoAlvo,
            turmaTarget: streamForm.turmaTarget,
            categoriaTarget: streamForm.categoriaTarget,
            usuariosTargetIds: streamForm.usuariosTargetIds,
            isCampeonato: streamForm.isCampeonato,
            campeonatoId: streamForm.campeonatoId,
            campeonatoNome: targetChamp?.title || '',
            tipoProvedor: streamForm.tipoProvedor,
            meetUrl: finalMeetUrl,
          };
        }
        return s;
      });
      saveLiveStreams(updatedList);
      alert('Transmissão atualizada com sucesso!');
    } else {
      // Create new
      const newStream: LiveStreamItem = {
        id: `stream-${Date.now()}`,
        titulo: streamForm.titulo,
        descricao: streamForm.descricao,
        dataHoraAgendada: new Date(streamForm.dataHoraAgendada).toISOString(),
        duracaoMinutos: Number(streamForm.duracaoMinutos) || 60,
        professorNome: streamForm.professorNome,
        status: 'agendada',
        publicoAlvo: streamForm.publicoAlvo,
        turmaTarget: streamForm.turmaTarget,
        categoriaTarget: streamForm.categoriaTarget,
        usuariosTargetIds: streamForm.usuariosTargetIds,
        tipoProvedor: streamForm.tipoProvedor,
        meetUrl: finalMeetUrl,
        meetSpaceName: `spaces/arena-${Date.now()}`,
        diasRetencao: 15,
        isCampeonato: streamForm.isCampeonato,
        campeonatoId: streamForm.campeonatoId,
        campeonatoNome: targetChamp?.title || '',
        patrocinadores: [],
        createdAt: new Date().toISOString(),
      };

      const updatedList = [newStream, ...liveStreams];
      saveLiveStreams(updatedList);

      // Trigger automatic notification for targeted audience
      if (onAddNotification) {
        const providerName = newStream.tipoProvedor === 'google_meet' ? 'Google Meet' : 'Estúdio Arena';
        const notifText = `🔴 NOVA TRANSMISSÃO AGENDADA (${providerName}): "${newStream.titulo}" para ${new Date(newStream.dataHoraAgendada).toLocaleString('pt-BR')} com ${newStream.professorNome}.`;
        const targetAudienceLabel =
          newStream.publicoAlvo === 'todos'
            ? 'Todos os alunos'
            : newStream.publicoAlvo === 'turma'
            ? `Turma ${newStream.turmaTarget}`
            : newStream.publicoAlvo === 'professores'
            ? 'Professores'
            : 'Membros autorizados';
        onAddNotification(notifText, targetAudienceLabel);
      }

      alert('🔴 Nova Transmissão agendada com sucesso!');
    }

    setIsCreatingStreamModal(false);
    setEditingStreamId(null);
    setStreamForm({
      titulo: '',
      descricao: '',
      dataHoraAgendada: new Date().toISOString().slice(0, 16),
      duracaoMinutos: 60,
      professorNome: user.nome || 'Mestre Responsável',
      publicoAlvo: 'todos',
      turmaTarget: '',
      categoriaTarget: '',
      usuariosTargetIds: [],
      isCampeonato: false,
      campeonatoId: '',
      tipoProvedor: 'google_meet',
      customMeetUrl: '',
    });
  };

  // Change status of live stream (Iniciar, Pausar, Encerrar, Cancelar)
  const handleChangeStreamStatus = (streamId: string, newStatus: LiveStreamItem['status']) => {
    const stream = liveStreams.find((s) => s.id === streamId);
    if (!stream) return;

    const updatedList = liveStreams.map((s) => {
      if (s.id === streamId) {
        let gravacaoStatus = s.gravacaoStatus;
        let dataExpiracaoGravacao = s.dataExpiracaoGravacao;

        if (newStatus === 'encerrada') {
          // Automatic recording storage in Arena Cloud + 15 days retention policy
          gravacaoStatus = 'disponivel';
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + (s.diasRetencao || 15));
          dataExpiracaoGravacao = expirationDate.toISOString();
        }

        return {
          ...s,
          status: newStatus,
          gravacaoStatus,
          dataExpiracaoGravacao,
        };
      }
      return s;
    });

    saveLiveStreams(updatedList);

    // Notify users when started
    if (newStatus === 'ao_vivo' && onAddNotification) {
      const notifText = `🔴 AULA AO VIVO INICIADA AGORA: "${stream.titulo}" com ${stream.professorNome}. Clique em VÍDEO AULAS / AO VIVO para entrar na sala do Estúdio Arena!`;
      onAddNotification(notifText, 'Todos os alunos');
    }
  };

  // Extend Google Drive retention policy by +15 days
  const handleProrrogarRetencao = (streamId: string) => {
    const updatedList = liveStreams.map((s) => {
      if (s.id === streamId) {
        const currentExp = s.dataExpiracaoGravacao ? new Date(s.dataExpiracaoGravacao) : new Date();
        currentExp.setDate(currentExp.getDate() + 15);
        return {
          ...s,
          dataExpiracaoGravacao: currentExp.toISOString(),
          diasRetencao: (s.diasRetencao || 15) + 15,
        };
      }
      return s;
    });
    saveLiveStreams(updatedList);
    alert('⏳ Retenção no Google Drive prorrogada com sucesso por mais 15 dias!');
  };

  // Delete live stream modal trigger
  const handleDeleteStream = (streamId: string) => {
    const item = liveStreams.find((s) => s.id === streamId);
    if (item) {
      setDeletingStreamConfirmItem(item);
    }
  };

  // Confirm Vehement Deletion from Drive and System
  const handleConfirmDeleteStreamVehemently = () => {
    if (!deletingStreamConfirmItem) return;
    const updatedList = liveStreams.filter((s) => s.id !== deletingStreamConfirmItem.id);
    saveLiveStreams(updatedList);

    if (selectedActiveViewerStream?.id === deletingStreamConfirmItem.id) {
      setSelectedActiveViewerStream(null);
    }

    setDeletingStreamConfirmItem(null);
    alert('✅ Transmissão e registros/arquivos vinculados no Google Drive foram excluídos veementemente com sucesso!');
  };

  // Sponsor File Upload Handler (Base64)
  const handleSponsorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ A imagem do patrocinador deve ter até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSponsorForm((prev) => ({
            ...prev,
            localBase64: event.target?.result as string,
            imagemUrl: '',
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Live Sponsor Manager Handlers
  const handleAddSponsor = (e: React.FormEvent, targetStreamId?: string) => {
    e.preventDefault();
    const streamId = targetStreamId || managingSponsorsStreamId;
    if (!streamId || !sponsorForm.nome) return;

    const sponsorImg =
      sponsorForm.localBase64 ||
      sponsorForm.imagemUrl ||
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80';

    const newSponsor: LiveSponsor = {
      id: `patro-${Date.now()}`,
      nome: sponsorForm.nome,
      imagemUrl: sponsorImg,
      tempoExibicaoSegundos: Number(sponsorForm.tempoExibicaoSegundos) || 15,
      ativo: false,
    };

    const updatedList = liveStreams.map((s) => {
      if (s.id === streamId) {
        return {
          ...s,
          patrocinadores: [...(s.patrocinadores || []), newSponsor],
        };
      }
      return s;
    });

    saveLiveStreams(updatedList);
    setSponsorForm({ nome: '', imagemUrl: '', localBase64: null, tempoExibicaoSegundos: 15 });
  };

  const handleSendLiveChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: user.nome || 'Usuário',
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isAdmin: user.tipo === 'admin',
    };

    setLiveChatMessages((prev) => [...prev, newMsg]);
    setChatInputText('');
  };

  const handleToggleSponsorActive = (streamId: string, sponsorId: string) => {
    const updatedList = liveStreams.map((s) => {
      if (s.id === streamId) {
        const currentActiveId = s.patrocinadorAtivoId;
        const newActiveId = currentActiveId === sponsorId ? null : sponsorId;

        const updatedSponsors = (s.patrocinadores || []).map((p) => ({
          ...p,
          ativo: p.id === newActiveId,
        }));

        return {
          ...s,
          patrocinadorAtivoId: newActiveId,
          patrocinadores: updatedSponsors,
        };
      }
      return s;
    });

    saveLiveStreams(updatedList);
  };

  // Filter streams authorized for logged in user
  const userAuthorizedStreams = liveStreams.filter((stream) => {
    if (user.tipo === 'admin') return true;
    if (stream.publicoAlvo === 'todos') return true;
    if (stream.publicoAlvo === 'professores' && user.tipo === 'professor') return true;
    if (stream.publicoAlvo === 'instrutores' && (user.tipo === 'instrutor' || user.tipo === 'professor')) return true;
    if (stream.publicoAlvo === 'competidores') return true;
    if (stream.publicoAlvo === 'turma' && stream.turmaTarget) return true;
    if (stream.publicoAlvo === 'usuarios' && stream.usuariosTargetIds?.includes(user.id)) return true;
    return true;
  });

  const activeLiveStreamsCount = userAuthorizedStreams.filter((s) => s.status === 'ao_vivo').length;

  return (
    <div className="space-y-6">
      {/* MODULE MAIN HEADER */}
      <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/20 text-white">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">VÍDEO AULAS / AO VIVO</h2>
                {activeLiveStreamsCount > 0 && (
                  <span className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {activeLiveStreamsCount} Transmissão Ao Vivo
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Plataforma oficial de conteúdos gravados e transmissões em tempo real integradas ao Estúdio Arena e Gravações em Nuvem
              </p>
            </div>
          </div>

          {/* SUB-TABS SELECTOR */}
          <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-850 self-start md:self-auto">
            <button
              onClick={() => setSelectedModuleTab('video_aulas')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer select-none ${
                selectedModuleTab === 'video_aulas'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Vídeo Aulas Gravadas</span>
            </button>
            <button
              onClick={() => setSelectedModuleTab('ao_vivo')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer select-none relative ${
                selectedModuleTab === 'ao_vivo'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Transmissões Ao Vivo</span>
              {activeLiveStreamsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: VÍDEO AULAS GRAVADAS                                           */}
      {/* ========================================================================= */}
      {selectedModuleTab === 'video_aulas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ADICIONAR VÍDEO (Admin / Professor) */}
          {(user.tipo === 'admin' || user.tipo === 'professor') && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md h-fit">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
                <Video className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Adicionar Vídeo Aula</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Disponibilize treinos, técnicas e rolas gravados</p>
                </div>
              </div>

              <form onSubmit={handleAddVideoSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-neutral-400 uppercase block">Título da Vídeo Aula *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Defesa de Single Leg e Contra-ataque"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className={`w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs ${theme.focusBorder} outline-none transition`}
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-neutral-400 uppercase block">Breve Descrição Técnica</label>
                  <textarea
                    rows={2}
                    placeholder="Explique detalhes da posição..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className={`w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs ${theme.focusBorder} outline-none transition resize-none`}
                  />
                </div>

                <div className="space-y-3.5 pt-1 text-left">
                  <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-900 space-y-2">
                    <span className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider block flex items-center gap-1`}>
                      <Youtube className="w-4 h-4" /> Opção A: URL do YouTube
                    </span>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setLocalVideoBase64(null);
                      }}
                      className={`w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-lg py-1.5 px-3 text-xs ${theme.focusBorder} outline-none transition`}
                    />
                  </div>

                  <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-900 space-y-2">
                    <span className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider block flex items-center gap-1`}>
                      <FileVideo className="w-4 h-4" /> Opção B: Upload de Arquivo Local
                    </span>
                    <div className="flex items-center gap-3 bg-[#1a1a1a] p-2.5 rounded-lg border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`bg-gradient-to-r ${theme.bgGradient} hover:brightness-110 text-white font-extrabold text-[9px] uppercase tracking-wider py-1.5 px-3.5 rounded-md transition shadow-md flex items-center gap-1.5 cursor-pointer shrink-0`}
                      >
                        <Upload className="w-3 h-3" /> Escolher Arquivo
                      </button>
                      <span className="text-[11px] text-neutral-400 truncate flex-1 font-medium">
                        {selectedVideoName || 'Nenhum vídeo selecionado'}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleLocalVideoUpload}
                        className="hidden"
                      />
                    </div>
                    {localVideoBase64 && (
                      <p className="text-[10px] text-emerald-400 font-medium">✅ Vídeo carregado localmente na memória!</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${theme.bgGradient} hover:brightness-110 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg shadow-orange-500/15`}
                >
                  <Plus className="w-4 h-4" />
                  Disponibilizar Vídeo Aula
                </button>
              </form>
            </div>
          )}

          {/* LISTA DE VÍDEOS GRAVADOS */}
          <div className={`${user.tipo === 'admin' || user.tipo === 'professor' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md`}>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
              <PlayCircle className="w-5.5 h-5.5 text-orange-500" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Biblioteca de Vídeo Aulas Gravadas</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Estude posições, regras e assista treinos e rolas gravados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {videos.length > 0 ? (
                videos.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-950/40 rounded-2xl overflow-hidden border border-neutral-850 hover:border-neutral-700 transition flex flex-col h-full shadow-sm"
                  >
                    {/* VIDEO PLAYER PREVIEW */}
                    <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
                      {item.tipoFonte === 'local' && item.arquivoLocal ? (
                        <video src={item.arquivoLocal} controls className="w-full h-full object-cover" />
                      ) : item.videoId ? (
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${item.videoId}`}
                          title={item.titulo}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="p-4 text-center text-neutral-500 text-xs">
                          <PlayCircle className="w-12 h-12 text-neutral-700 mx-auto mb-2" />
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline font-bold">
                            Assistir no Canal Externo 🌐
                          </a>
                        </div>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="p-4 flex-1 flex flex-col justify-between text-left">
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{item.titulo}</h4>
                        <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{item.descricao}</p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-500">
                        <span>
                          Instrutor: <strong className="text-neutral-400">{item.autor}</strong>
                        </span>
                        <span className="bg-neutral-900 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {item.tipoFonte === 'local' ? '📁 Arquivo' : '🎬 YouTube'}
                        </span>
                      </div>

                      {(user.tipo === 'admin' || user.tipo === 'professor') && (
                        <div className="mt-3 pt-2.5 border-t border-neutral-900 flex justify-end">
                          {confirmDeleteVideoId === item.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-amber-500 font-bold uppercase font-sans">Excluir?</span>
                              <button
                                onClick={() => {
                                  onExcluirVideo(item.id);
                                  setConfirmDeleteVideoId(null);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] py-0.5 px-2 rounded transition cursor-pointer"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDeleteVideoId(null)}
                                className="bg-[#1a1a1a] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold text-[9px] py-0.5 px-2 rounded transition cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteVideoId(item.id)}
                              className="flex items-center gap-1 text-red-500 hover:text-red-400 font-bold text-[9px] py-0.5 px-2 rounded bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Excluir Vídeo
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 opacity-50 text-sm">Nenhum vídeo disponível no catálogo.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TRANSMISSÕES AO VIVO — GOOGLE MEET & ESTÚDIO ARENA            */}
      {/* ========================================================================= */}
      {selectedModuleTab === 'ao_vivo' && (
        <div className="space-y-6">
          {/* TOP ADMIN ACTION BAR */}
          {user.tipo === 'admin' && (
            <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-orange-500" />
                  Painel de Transmissões Ao Vivo — Google Meet & Estúdio Arena
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Agende e gerencie vídeo aulas ao vivo. Google Meet é a opção oficial e principal recomendada para máxima compatibilidade em todos os dispositivos.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingStreamId(null);
                  setStreamForm({
                    titulo: '',
                    descricao: '',
                    dataHoraAgendada: new Date().toISOString().slice(0, 16),
                    duracaoMinutos: 60,
                    professorNome: user.nome || 'Mestre Responsável',
                    publicoAlvo: 'todos',
                    turmaTarget: '',
                    categoriaTarget: '',
                    usuariosTargetIds: [],
                    isCampeonato: false,
                    campeonatoId: '',
                    tipoProvedor: 'google_meet',
                    customMeetUrl: '',
                  });
                  setIsCreatingStreamModal(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4.5 h-4.5" />
                Agendar Nova Transmissão
              </button>
            </div>
          )}

          {/* LIVE STREAMS LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3 text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                Transmissões Disponíveis ({userAuthorizedStreams.length})
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Google Meet Integrado (Oficial)
              </span>
            </div>

            {userAuthorizedStreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {userAuthorizedStreams.map((stream) => {
                  const isLive = stream.status === 'ao_vivo';
                  const isEnded = stream.status === 'encerrada';
                  const isScheduled = stream.status === 'agendada';
                  const isPaused = stream.status === 'pausada';
                  const provider = stream.tipoProvedor || 'google_meet';

                  return (
                    <div
                      key={stream.id}
                      className={`bg-[#141414] rounded-2xl border p-5 transition-all text-left flex flex-col justify-between relative overflow-hidden shadow-md ${
                        isLive
                          ? 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-gradient-to-b from-red-950/20 to-[#141414]'
                          : isEnded
                          ? 'border-neutral-800 opacity-90'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        {/* CARD BADGES HEADER */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                isLive
                                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 animate-pulse'
                                  : isPaused
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : isEnded
                                  ? 'bg-neutral-800 text-neutral-400'
                                  : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {isLive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                              {isLive
                                ? '🔴 AO VIVO AGORA'
                                : isPaused
                                ? '⏸️ PAUSADA'
                                : isEnded
                                ? '🏁 ENCERRADA'
                                : '📅 AGENDADA'}
                            </span>

                            {/* PROVIDER BADGE */}
                            {provider === 'google_meet' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Video className="w-3 h-3 text-emerald-400" /> Google Meet
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                                <Radio className="w-3 h-3 text-orange-400" /> Estúdio Arena
                              </span>
                            )}
                          </div>

                          {stream.isCampeonato && (
                            <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              Campeonato
                            </span>
                          )}
                        </div>

                        {/* TITLE & DESCRIPTION */}
                        <h4 className="text-base font-black text-white leading-snug">{stream.titulo}</h4>
                        <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">{stream.descricao}</p>

                        {/* STREAM METADATA */}
                        <div className="mt-4 pt-3 border-t border-neutral-900 space-y-2 text-xs text-neutral-300 font-medium">
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>
                              Agendado: <strong className="text-white">{new Date(stream.dataHoraAgendada).toLocaleString('pt-BR')}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Users className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>
                              Professor: <strong className="text-white">{stream.professorNome}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Shield className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>
                              Acesso: <strong className="text-orange-400 uppercase text-[10px]">{stream.publicoAlvo}</strong>
                            </span>
                          </div>

                          {/* GOOGLE MEET LINK PREVIEW BOX (WHEN GOOGLE MEET) */}
                          {provider === 'google_meet' && (
                            <div className="mt-2.5 p-3 bg-neutral-950/80 rounded-xl border border-neutral-850 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-xs text-neutral-300 font-mono truncate">{stream.meetUrl || 'Link não configurado'}</span>
                              </div>
                              {stream.meetUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(stream.meetUrl!);
                                    alert('✅ Link do Google Meet copiado para a área de transferência!');
                                  }}
                                  className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer border border-neutral-800"
                                  title="Copiar Link do Google Meet"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* GOOGLE DRIVE RECORDING METADATA */}
                          {isEnded && stream.gravacaoStatus === 'disponivel' && (
                            <div className="mt-3 p-3 bg-neutral-950 rounded-xl border border-neutral-850 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Gravação Salva no Google Drive
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono">15 Dias Retenção</span>
                              </div>
                              {stream.dataExpiracaoGravacao && (
                                <p className="text-[10px] text-neutral-400">
                                  ⏳ Expira em: <strong>{new Date(stream.dataExpiracaoGravacao).toLocaleDateString('pt-BR')}</strong>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CARD ACTIONS */}
                      <div className="mt-5 pt-4 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-2">
                        {/* USER MAIN LAUNCH / ENTER BUTTON */}
                        {provider === 'google_meet' ? (
                          <button
                            type="button"
                            onClick={() => handleEnterStream(stream)}
                            className="flex-1 font-black text-xs py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-emerald-600/20"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>{isLive ? 'ENTRAR NA AULA NO GOOGLE MEET ↗' : 'ABRIR GOOGLE MEET ↗'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEnterStream(stream)}
                            className="flex-1 font-black text-xs py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white shadow-orange-500/20"
                          >
                            <Radio className="w-4 h-4" />
                            <span>{isLive ? 'ENTRAR NO ESTÚDIO ARENA (EXPERIMENTAL)' : 'ACESSAR ESTÚDIO ARENA'}</span>
                          </button>
                        )}

                        {/* ADMIN LIVE CONTROLS */}
                        {user.tipo === 'admin' && (
                          <div className="flex items-center gap-1.5 w-full pt-2">
                            <button
                              type="button"
                              onClick={() => handleEditStream(stream)}
                              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-extrabold text-[10px] py-2 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 border border-neutral-700"
                              title="Editar Link / Dados da Transmissão"
                            >
                              <Edit2 className="w-3 h-3 text-orange-400" />
                              Editar
                            </button>

                            {isScheduled && (
                              <button
                                type="button"
                                onClick={() => handleChangeStreamStatus(stream.id, 'ao_vivo')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Play className="w-3 h-3" /> Iniciar Ao Vivo
                              </button>
                            )}

                            {isLive && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleChangeStreamStatus(stream.id, 'pausada')}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] py-2 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Pause className="w-3 h-3" /> Pausar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleChangeStreamStatus(stream.id, 'encerrada')}
                                  className="flex-1 bg-red-700 hover:bg-red-800 text-white font-extrabold text-[10px] py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" /> Encerrar
                                </button>
                              </>
                            )}

                            {isPaused && (
                              <button
                                type="button"
                                onClick={() => handleChangeStreamStatus(stream.id, 'ao_vivo')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Play className="w-3 h-3" /> Retomar
                              </button>
                            )}

                            {/* SPONSOR MANAGER BUTTON */}
                            <button
                              type="button"
                              onClick={() => setManagingSponsorsStreamId(stream.id)}
                              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-extrabold text-[10px] py-2 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 border border-neutral-700"
                              title="Gerenciar Patrocinadores"
                            >
                              <Award className="w-3 h-3 text-amber-400" /> Patrocinadores
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStream(stream.id)}
                              className="p-2 text-neutral-500 hover:text-red-400 bg-neutral-900 hover:bg-red-500/10 rounded-lg transition cursor-pointer border border-neutral-800"
                              title="Excluir Transmissão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#141414] rounded-3xl border border-dashed border-neutral-800 flex flex-col items-center">
                <Radio className="w-12 h-12 text-neutral-700 mb-3" />
                <p className="text-sm text-neutral-400 font-bold uppercase">Nenhuma transmissão agendada no momento.</p>
                <p className="text-xs text-neutral-500 max-w-sm mt-1">
                  O Administrador pode agendar e iniciar novas vídeo aulas ao vivo utilizando a integração oficial do Google Meet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR TRANSMISSÃO AO VIVO (ADMIN)                        */}
      {/* ========================================================================= */}
      {isCreatingStreamModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fade-in text-left">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-8 max-w-5xl lg:max-w-6xl w-full shadow-2xl relative my-auto max-h-[92vh] flex flex-col justify-between">
            {/* HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-850 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-emerald-400">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-white uppercase tracking-wider">
                    {editingStreamId ? 'Editar Transmissão Ao Vivo' : 'Agendar Nova Transmissão Ao Vivo'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure os detalhes da transmissão, selecione o método (Google Meet ou Estúdio Arena) e disponibilize para os alunos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingStreamModal(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 cursor-pointer transition border border-neutral-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM BODY WITH RESPONSIVE 2-COLUMN GRID */}
            <form onSubmit={handleSaveStreamSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 space-y-6">
              {/* SECTION 1: PROVEDOR DE TRANSMISSÃO */}
              <div className="bg-neutral-950 p-4 sm:p-5 rounded-2xl border border-neutral-850 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-400" />
                    Método de Transmissão (Provedor)
                  </label>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Google Meet = Recomendado
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CARD 1: GOOGLE MEET (DEFAULT) */}
                  <div
                    onClick={() => setStreamForm({ ...streamForm, tipoProvedor: 'google_meet' })}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      streamForm.tipoProvedor === 'google_meet'
                        ? 'bg-emerald-950/25 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-black text-sm text-white">
                        <Video className="w-4.5 h-4.5 text-emerald-400" />
                        Google Meet
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded border border-emerald-500/30">
                        Principal (Padrão)
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Conexão oficial do Google. Abre sem atrito em desktop, iPhone, Android e tablets.
                    </p>
                  </div>

                  {/* CARD 2: ESTÚDIO ARENA (EXPERIMENTAL) */}
                  <div
                    onClick={() => setStreamForm({ ...streamForm, tipoProvedor: 'estudio_arena' })}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      streamForm.tipoProvedor === 'estudio_arena'
                        ? 'bg-orange-950/25 border-orange-500 text-white shadow-md shadow-orange-500/10'
                        : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-black text-sm text-white">
                        <Radio className="w-4.5 h-4.5 text-orange-400" />
                        Estúdio Arena
                      </div>
                      <span className="bg-orange-500/20 text-orange-300 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded border border-orange-500/30">
                        Experimental
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Videoconferência nativa WebRTC interna em fase de testes e evolução futura.
                    </p>
                  </div>
                </div>

                {/* CONDITIONAL PROVIDER FIELDS */}
                {streamForm.tipoProvedor === 'google_meet' ? (
                  <div className="mt-3 p-4 bg-[#181818] rounded-xl border border-emerald-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        Link da Reunião do Google Meet *
                      </label>
                      {/* LINK VALIDITY BADGE */}
                      {isValidMeetUrl(streamForm.customMeetUrl) ? (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Link Válido do Google Meet
                        </span>
                      ) : streamForm.customMeetUrl.trim().length === 0 ? (
                        <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                          <AlertCircle className="w-3.5 h-3.5" /> Campo Obrigatório
                        </span>
                      ) : (
                        <span className="text-[11px] text-red-400 font-bold flex items-center gap-1 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Formato Inválido
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <input
                        type="url"
                        placeholder="Ex: https://meet.google.com/xxx-xxxx-xxx"
                        value={streamForm.customMeetUrl}
                        onChange={(e) => setStreamForm({ ...streamForm, customMeetUrl: e.target.value })}
                        className="flex-1 bg-[#121212] text-white border border-neutral-700 rounded-xl py-2.5 px-3.5 text-xs focus:border-emerald-500 outline-none transition font-mono"
                      />

                      <button
                        type="button"
                        onClick={() => window.open('https://meet.new', '_blank', 'noopener,noreferrer')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md"
                        title="Criar uma sala de reunião nova instantaneamente no Google Meet"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Criar Sala (meet.new) ↗</span>
                      </button>

                      {streamForm.customMeetUrl.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isValidMeetUrl(streamForm.customMeetUrl)) {
                              let urlToOpen = streamForm.customMeetUrl.trim();
                              if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
                                urlToOpen = 'https://' + urlToOpen;
                              }
                              window.open(urlToOpen, '_blank', 'noopener,noreferrer');
                            } else {
                              alert('Insira um link de reunião válido antes de testar!');
                            }
                          }}
                          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-extrabold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-neutral-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                          <span>Testar Link</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      💡 Cole aqui o link da sua reunião do Google Meet ou clique em <strong>"Criar Sala (meet.new)"</strong> para abrir o Google Meet e gerar um novo link de sala.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-4 bg-[#181818] rounded-xl border border-orange-500/30 space-y-2">
                    <p className="text-xs text-orange-300 font-semibold flex items-center gap-2">
                      <Radio className="w-4 h-4 text-orange-400 shrink-0" />
                      Modo Estúdio Arena Selecionado (Recurso Nativo WebRTC)
                    </p>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      A aula será transmitida pela sala integrada do Estúdio Arena. Nota: Para turmas muito grandes, recomendamos usar o Google Meet para maior estabilidade de banda.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 2: GRID FOR DATES, TITLES & AUDIENCE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: BASIC INFORMATIONS */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Título da Transmissão *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Aulão Ao Vivo — Passagens de Guarda & Finalizações"
                      value={streamForm.titulo}
                      onChange={(e) => setStreamForm({ ...streamForm, titulo: e.target.value })}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3.5 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Descrição / Conteúdo Técnico</label>
                    <textarea
                      rows={3}
                      placeholder="Descreva os tópicos que serão abordados na vídeo aula..."
                      value={streamForm.descricao}
                      onChange={(e) => setStreamForm({ ...streamForm, descricao: e.target.value })}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3.5 text-xs focus:border-orange-500 outline-none transition resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Data e Horário *</label>
                      <input
                        type="datetime-local"
                        required
                        value={streamForm.dataHoraAgendada}
                        onChange={(e) => setStreamForm({ ...streamForm, dataHoraAgendada: e.target.value })}
                        className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Professor Responsável</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do Mestre"
                        value={streamForm.professorNome}
                        onChange={(e) => setStreamForm({ ...streamForm, professorNome: e.target.value })}
                        className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3.5 text-xs focus:border-orange-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ACCESS RULES & CAMPEONATO */}
                <div className="space-y-4">
                  {/* LIBERAÇÃO INTELIGENTE DE PARTICIPANTES */}
                  <div className="p-4 bg-neutral-950/60 rounded-2xl border border-neutral-850 space-y-2.5">
                    <span className="text-[11px] font-black text-orange-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Shield className="w-4 h-4 shrink-0" />
                      Público-Alvo da Transmissão
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <select
                          disabled={streamForm.isCampeonato}
                          value={streamForm.publicoAlvo}
                          onChange={(e) => setStreamForm({ ...streamForm, publicoAlvo: e.target.value as any })}
                          className={`w-full text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none transition font-medium ${
                            streamForm.isCampeonato ? 'bg-[#151515] opacity-60 cursor-not-allowed' : 'bg-[#1a1a1a] cursor-pointer'
                          }`}
                        >
                          <option value="todos">🌐 Todos os Usuários e Visitantes</option>
                          <option value="professores">🥋 Apenas Professores</option>
                          <option value="instrutores">🥋 Apenas Instrutores</option>
                          <option value="competidores">🏆 Apenas Competidores</option>
                          <option value="turma">🏫 Apenas Uma Turma Específica</option>
                        </select>
                        {streamForm.isCampeonato && (
                          <p className="text-[10px] text-amber-400 font-semibold mt-1">
                            🔒 Público-Alvo fixado em "Todos os Usuários e Visitantes" por estar vinculado a Campeonato Oficial.
                          </p>
                        )}
                      </div>

                      {streamForm.publicoAlvo === 'turma' && (
                        <div className="space-y-1">
                          <select
                            value={streamForm.turmaTarget}
                            onChange={(e) => setStreamForm({ ...streamForm, turmaTarget: e.target.value })}
                            className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none transition cursor-pointer font-medium"
                          >
                            <option value="">Selecione uma turma...</option>
                            {turmas.map((t) => (
                              <option key={t.id} value={t.nome}>
                                {t.nome} ({t.horario})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INTEGRAÇÃO COM CAMPEONATOS */}
                  <div className="p-4 bg-neutral-950/60 rounded-2xl border border-neutral-850 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isCampeonatoCheckbox"
                        checked={streamForm.isCampeonato}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setStreamForm({
                            ...streamForm,
                            isCampeonato: isChecked,
                            publicoAlvo: isChecked ? 'todos' : streamForm.publicoAlvo,
                          });
                        }}
                        className="w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                      />
                      <label htmlFor="isCampeonatoCheckbox" className="text-xs font-black text-white cursor-pointer flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        Vincular a Campeonato Oficial
                      </label>
                    </div>

                    {streamForm.isCampeonato && (
                      <div className="space-y-1 pt-1">
                        <select
                          value={streamForm.campeonatoId}
                          onChange={(e) => setStreamForm({ ...streamForm, campeonatoId: e.target.value })}
                          className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none transition cursor-pointer font-medium"
                        >
                          <option value="">Selecione um campeonato ativo...</option>
                          {confrontoCampeonatos.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} ({c.date})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div className="pt-4 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreatingStreamModal(false)}
                  className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-extrabold text-xs py-3 px-6 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs py-3 px-7 rounded-xl transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <Video className="w-4 h-4" />
                  Salvar e Disponibilizar Transmissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedActiveViewerStream && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[99999] flex flex-col items-center justify-between p-3 md:p-6 overflow-y-auto text-left animate-fade-in">
          {/* HEADER TOP BAR */}
          <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-850">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-black text-white tracking-wider uppercase">
                    {selectedActiveViewerStream.titulo}
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                    SALA AO VIVO
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Mestre Responsável: <strong className="text-white">{selectedActiveViewerStream.professorNome}</strong>
                </p>
              </div>
            </div>

            {/* ROOM VIEW BADGE */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/30 text-orange-400 font-black text-xs gap-2">
                <Video className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Estúdio Arena (Nativo HD)</span>
              </div>

              {/* ADMIN PATROCINADORES TOGGLE */}
              {user.tipo === 'admin' && (
                <button
                  onClick={() => setIsLiveSponsorsDrawerOpen(!isLiveSponsorsDrawerOpen)}
                  className={`py-1.5 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 border ${
                    isLiveSponsorsDrawerOpen
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <Award className="w-4 h-4" /> Anúncios / Patrocinadores
                </button>
              )}

              <button
                onClick={() => setSelectedActiveViewerStream(null)}
                className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Sair da Sala
              </button>
            </div>
          </div>

          {/* MAIN PLAYER CONTAINER */}
          <div className="w-full max-w-6xl my-auto py-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* STREAM CONTAINER (SPAN 3 COLUMNS OR FULL) */}
            <div className="lg:col-span-3 space-y-4">
              {/* STATE 1: WELCOME SCREEN (AGENDADA) */}
              {selectedActiveViewerStream.status === 'agendada' && (
                <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden my-auto">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500" />
                  <div className="w-20 h-20 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center mx-auto p-3 shadow-lg">
                    <Shield className="w-12 h-12 text-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 py-1 px-3 rounded-full border border-orange-500/20">
                      TRANSMISSÃO AGENDADA
                    </span>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">ARENA DO COMPETIDOR</h3>
                    <p className="text-sm font-bold text-neutral-300">{selectedActiveViewerStream.titulo}</p>
                  </div>
                  <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-850 space-y-2 text-xs text-neutral-400 max-w-lg mx-auto">
                    <p className="text-base font-bold text-white">Bem-vindo(a)! 👋</p>
                    <p className="leading-relaxed">Sua transmissão será iniciada em instantes pelo professor responsável.</p>
                    <p className="text-orange-400 font-mono pt-2 font-bold">
                      📅 Início previsto: {new Date(selectedActiveViewerStream.dataHoraAgendada).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {user.tipo === 'admin' ? (
                    <button
                      onClick={() => handleChangeStreamStatus(selectedActiveViewerStream.id, 'ao_vivo')}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-sm py-4 px-8 rounded-2xl transition shadow-xl shadow-emerald-500/20 cursor-pointer"
                    >
                      <Play className="w-5 h-5" />
                      INICIAR TRANSMISSÃO AO VIVO AGORA (COMO ADMIN)
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-orange-400 font-black text-xs py-3.5 px-6 rounded-xl">
                      <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
                      Aguardando Início do Sinal pelo Professor Responsável
                    </div>
                  )}
                </div>
              )}

              {/* STATE 2: LIVE PLAYER (AO VIVO OR PAUSED) */}
              {(selectedActiveViewerStream.status === 'ao_vivo' || selectedActiveViewerStream.status === 'pausada') && (
                <div className="space-y-4">
                  {/* REAL-TIME ACTIVE SPONSOR FRAME OVERLAY */}
                  {(() => {
                    const activeSponsor = selectedActiveViewerStream.patrocinadores?.find(
                      (p) => p.id === selectedActiveViewerStream.patrocinadorAtivoId
                    );

                    return (
                      <div
                        className={`relative w-full rounded-3xl overflow-hidden transition-all duration-500 ease-in-out border ${
                          activeSponsor
                            ? 'border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.25)] p-3 md:p-4 bg-gradient-to-b from-amber-950/40 via-[#141414] to-black'
                            : 'border-neutral-800 bg-black'
                        }`}
                      >
                        {/* ACTIVE SPONSOR TOP BANNER */}
                        {activeSponsor && (
                          <div className="mb-3 p-3 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/20 border border-amber-500/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-left animate-fade-in">
                            <div className="flex items-center gap-3">
                              <img
                                src={activeSponsor.imagemUrl}
                                alt={activeSponsor.nome}
                                className="h-10 w-24 object-contain rounded-lg bg-black/50 p-1 border border-amber-500/30 shrink-0"
                              />
                              <div>
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">
                                  PATROCINADOR OFICIAL EM TEMPO REAL
                                </span>
                                <strong className="text-sm font-black text-white">{activeSponsor.nome}</strong>
                              </div>
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full animate-pulse">
                              Exibindo Ao Vivo na Arena 🔴
                            </span>
                          </div>
                        )}

                        {/* STUDIO SCREEN */}
                        <div className="aspect-video w-full bg-neutral-950 rounded-2xl overflow-hidden relative border border-neutral-850 flex items-center justify-center shadow-2xl">
                            {/* WEBCAM VIDEO OR LIVE STUDIO ANIMATED CANVAS */}
                            {isCameraOn || isScreenSharing ? (
                              <video
                                ref={(el) => {
                                  videoMediaRef.current = el;
                                  if (el && el.srcObject) {
                                    el.play().catch(() => {});
                                  }
                                }}
                                autoPlay
                                playsInline
                                muted={user.tipo !== 'admin' && !isMicOn}
                                className="w-full h-full object-cover transform scale-x-[-1]"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#0d0d0d] via-[#161618] to-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden">
                                {/* BACKGROUND ANIMATED SHINE */}
                                <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
                                <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

                                <div className="w-20 h-20 rounded-full bg-neutral-900/90 border-2 border-orange-500/50 flex items-center justify-center shadow-2xl relative z-10">
                                  <Shield className="w-10 h-10 text-orange-500" />
                                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
                                    <Radio className="w-3 h-3 text-white animate-ping" />
                                  </span>
                                </div>

                                <div className="z-10 max-w-lg space-y-1">
                                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30 inline-block mb-1">
                                    ESTÚDIO DIGITAL ARENA — SALA ATIVA ({streamQualityMode})
                                  </span>
                                  <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                                    {selectedActiveViewerStream.titulo}
                                  </h4>
                                  <p className="text-xs text-neutral-400">
                                    Mestre Responsável: <strong className="text-orange-400">{selectedActiveViewerStream.professorNome}</strong>
                                  </p>
                                </div>

                                {/* EQUALIZER SOUND BARS SIMULATION */}
                                <div className="flex items-end gap-1.5 h-6 my-1 z-10">
                                  <span className="w-1.5 bg-orange-500 rounded-full animate-bounce h-full" style={{ animationDelay: '0ms' }} />
                                  <span className="w-1.5 bg-red-500 rounded-full animate-bounce h-2/3" style={{ animationDelay: '150ms' }} />
                                  <span className="w-1.5 bg-amber-400 rounded-full animate-bounce h-4/5" style={{ animationDelay: '300ms' }} />
                                  <span className="w-1.5 bg-orange-600 rounded-full animate-bounce h-1/2" style={{ animationDelay: '450ms' }} />
                                  <span className="w-1.5 bg-red-400 rounded-full animate-bounce h-3/4" style={{ animationDelay: '200ms' }} />
                                </div>

                                {/* TRANSMISSION DIRECT ACTION BUTTONS (FOR PROFESSORS & ADMINS) */}
                                {(user.tipo === 'admin' || user.tipo === 'professor' || user.tipo === 'instrutor') && (
                                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 z-10">
                                    <button
                                      onClick={handleEnableCamera}
                                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition shadow-lg cursor-pointer flex items-center gap-2"
                                    >
                                      <Video className="w-4 h-4" />
                                      Transmitir Câmera Ao Vivo
                                    </button>
                                    <button
                                      onClick={handleEnableScreenShare}
                                      className="bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 border border-neutral-700"
                                    >
                                      <Monitor className="w-4 h-4 text-orange-400" />
                                      Compartilhar Tela / Slides
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* PAUSED OVERLAY */}
                            {selectedActiveViewerStream.status === 'pausada' && (
                              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                                <Pause className="w-16 h-16 text-amber-400 animate-pulse mb-3" />
                                <h4 className="text-lg font-black text-amber-400 uppercase tracking-wider">
                                  Transmissão Pausada Temporariamente
                                </h4>
                                <p className="text-xs text-neutral-300 mt-1 max-w-md">
                                  O mestre responsável pausou o sinal da chamada. A aula retornará em instantes.
                                </p>
                              </div>
                            )}

                            {/* LIVE BADGE & REAL PARTICIPANTS COUNT */}
                            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
                              <span className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest py-1 px-3 rounded-full flex items-center gap-1.5 shadow-lg">
                                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                AO VIVO NA ARENA
                              </span>
                              <span className="bg-black/70 backdrop-blur-md text-neutral-300 font-bold text-[10px] py-1 px-2.5 rounded-full border border-neutral-800 flex items-center gap-1.5 shadow">
                                <Users className="w-3.5 h-3.5 text-orange-400" />
                                {activeParticipantsList.length} {activeParticipantsList.length === 1 ? 'pessoa na sala' : 'pessoas reais'}
                              </span>
                            </div>

                            {/* MOBILE CAMERA FLIP FLOATING BUTTON */}
                            {isCameraOn && (
                              <button
                                onClick={handleFlipCamera}
                                className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white p-2.5 rounded-full border border-neutral-700 z-10 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-xl"
                                title="Alternar Câmera Frontal / Traseira"
                              >
                                <RotateCcw className="w-4 h-4 text-orange-400" />
                                <span className="hidden sm:inline">Inverter Câmera</span>
                              </button>
                            )}
                          </div>

                        {/* CONTROL BAR (CONTROLES INTERATIVOS CONFORME PERFIL) */}
                        <div className="mt-4 p-4 bg-neutral-950 rounded-2xl border border-neutral-850 flex flex-wrap items-center justify-between gap-3 text-xs">
                          {/* LEFT CONTROLS: MEDIA CONTROL ACCORDING TO ROLE */}
                          <div className="flex flex-wrap items-center gap-2">
                            {user.tipo === 'admin' ? (
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider block mr-1">
                                PAINEL DO ADMINISTRADOR:
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mr-1">
                                CONTROLES DA SALA:
                              </span>
                            )}

                            {/* MIC TOGGLE (FOR ADMIN / PROFESSOR / PERMITTED) */}
                            {(user.tipo === 'admin' || user.tipo === 'professor' || user.tipo === 'instrutor') && (
                              <button
                                onClick={() => {
                                  setIsMicOn(!isMicOn);
                                  addTechnicalLog(`🎙️ Microfone ${!isMicOn ? 'Ativado' : 'Silenciado'}`, 'info');
                                }}
                                className={`p-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                  isMicOn ? 'bg-neutral-800 text-white hover:bg-neutral-750' : 'bg-red-600/30 text-red-400 border border-red-500/40'
                                }`}
                              >
                                {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                                <span>{isMicOn ? 'Mic On' : 'Mic Off'}</span>
                              </button>
                            )}

                            {/* CAMERA TOGGLE */}
                            {(user.tipo === 'admin' || user.tipo === 'professor' || user.tipo === 'instrutor') && (
                              <button
                                onClick={() => {
                                  if (isCameraOn) {
                                    setIsCameraOn(false);
                                    addTechnicalLog('🎥 Câmera desativada.', 'info');
                                  } else {
                                    handleEnableCamera();
                                  }
                                }}
                                className={`p-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                  isCameraOn ? 'bg-neutral-800 text-white hover:bg-neutral-750' : 'bg-red-600/30 text-red-400 border border-red-500/40'
                                }`}
                              >
                                {isCameraOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                                <span>{isCameraOn ? 'Câmera On' : 'Câmera Off'}</span>
                              </button>
                            )}

                            {/* SCREEN SHARE TOGGLE */}
                            {(user.tipo === 'admin' || user.tipo === 'professor' || user.tipo === 'instrutor') && (
                              <button
                                onClick={() => {
                                  if (isScreenSharing) {
                                    setIsScreenSharing(false);
                                    addTechnicalLog('🖥️ Compartilhamento de tela encerrado.', 'info');
                                  } else {
                                    handleEnableScreenShare();
                                  }
                                }}
                                className={`p-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                  isScreenSharing ? 'bg-orange-500 text-white' : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300'
                                }`}
                              >
                                <Monitor className="w-4 h-4 text-orange-400" />
                                <span className="hidden sm:inline">{isScreenSharing ? 'Compartilhando' : 'Tela'}</span>
                              </button>
                            )}

                            {/* STUDENT RAISE HAND BUTTON */}
                            {user.tipo !== 'admin' && (
                              <button
                                onClick={handleToggleRaiseHand}
                                className={`p-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                  handRaisedUsers.includes(user.nome || 'Aluno')
                                    ? 'bg-amber-500 text-black shadow-lg animate-pulse'
                                    : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300'
                                }`}
                              >
                                <Hand className="w-4 h-4 text-amber-400" />
                                <span>{handRaisedUsers.includes(user.nome || 'Aluno') ? 'Mão Levantada ✋' : 'Levantar Mão'}</span>
                              </button>
                            )}

                            {/* STREAM QUALITY SELECTOR */}
                            <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1.5 rounded-xl border border-neutral-800 text-[11px]">
                              <span className="text-neutral-500 font-bold hidden sm:inline">Qualidade:</span>
                              <select
                                value={streamQualityMode}
                                onChange={(e) => {
                                  const q = e.target.value as any;
                                  setStreamQualityMode(q);
                                  addTechnicalLog(`⚙️ Qualidade de vídeo alterada para ${q}`, 'info');
                                }}
                                className="bg-transparent text-orange-400 font-bold outline-none cursor-pointer"
                              >
                                <option value="1080p">1080p (FHD)</option>
                                <option value="720p">720p (HD)</option>
                                <option value="480p">480p (SD)</option>
                              </select>
                            </div>
                          </div>

                          {/* RIGHT CONTROLS: STREAM STATE MANAGEMENT (ADMIN ONLY) */}
                          <div className="flex flex-wrap items-center gap-2">
                            {user.tipo === 'admin' && (
                              <>
                                <button
                                  onClick={triggerConfirmMuteAll}
                                  className="bg-neutral-800 hover:bg-neutral-750 text-amber-400 border border-amber-500/30 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                  title="Silenciar todos os alunos da sala"
                                >
                                  <MicOff className="w-3.5 h-3.5" /> Mutar Alunos
                                </button>

                                {selectedActiveViewerStream.status === 'ao_vivo' ? (
                                  <button
                                    onClick={() => {
                                      handleChangeStreamStatus(selectedActiveViewerStream.id, 'pausada');
                                      addTechnicalLog('⏸️ Transmissão pausada pelo Administrador.', 'warn');
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Pause className="w-4 h-4" /> Pausar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleChangeStreamStatus(selectedActiveViewerStream.id, 'ao_vivo');
                                      addTechnicalLog('▶️ Transmissão retomada pelo Administrador.', 'success');
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Play className="w-4 h-4" /> Retomar
                                  </button>
                                )}

                                <button
                                  onClick={triggerConfirmEndStream}
                                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/20"
                                >
                                  <XCircle className="w-4 h-4" /> Encerrar Aula
                                </button>
                              </>
                            )}

                            {/* LEAVE ROOM BUTTON FOR NON-ADMINS */}
                            {user.tipo !== 'admin' && (
                              <button
                                onClick={triggerConfirmLeaveRoom}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                              >
                                <X className="w-4 h-4" /> Sair da Chamada
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STATE 3: END SCREEN (ENCERRADA) */}
              {selectedActiveViewerStream.status === 'encerrada' && (
                <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden my-auto">
                  <div className="w-20 h-20 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center mx-auto p-3 shadow-lg">
                    <Shield className="w-12 h-12 text-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20">
                      TRANSMISSÃO ENCERRADA E SALVA
                    </span>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">ARENA DO COMPETIDOR</h3>
                  </div>

                  <div className="p-6 bg-neutral-950 rounded-2xl border border-neutral-850 space-y-3 text-xs text-neutral-300 max-w-lg mx-auto">
                    <p className="text-base font-bold text-white leading-relaxed">
                      "Esta vídeo aula foi encerrada. Agradecemos sua participação. Nos vemos na próxima!"
                    </p>
                    <p className="text-neutral-400">Arena do Competidor — Tradição & Competitividade</p>
                    <div className="pt-3 border-t border-neutral-900 text-left space-y-2">
                      <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Gravação armazenada e disponível na biblioteca do sistema.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SIDE PANEL: CHAT AO VIVO, PARTICIPANTES & LOGS TÉCNICOS */}
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-4 flex flex-col justify-between h-full min-h-[420px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-850 mb-3">
                  <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 w-full">
                    <button
                      onClick={() => setActiveRoomTab('chat')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeRoomTab === 'chat'
                          ? 'bg-orange-500 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => setActiveRoomTab('participants')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeRoomTab === 'participants'
                          ? 'bg-orange-500 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Membros ({activeParticipantsList.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveRoomTab('logs')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        activeRoomTab === 'logs'
                          ? 'bg-orange-500 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Logs Técnicos da Conexão WebRTC"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Logs</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: PARTICIPANTS LIST WITH KICK & MUTE CONTROLS */}
                {activeRoomTab === 'participants' && (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                        Integrantes na Chamada
                      </span>
                      {user.tipo === 'admin' && (
                        <button
                          onClick={triggerConfirmMuteAll}
                          className="text-[9px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <MicOff className="w-3 h-3" /> Silenciar Todos
                        </button>
                      )}
                    </div>

                    {activeParticipantsList.map((pName, idx) => {
                      const isProfessor = pName === selectedActiveViewerStream?.professorNome;
                      const isMe = pName === user.nome;
                      const isMuted = mutedParticipants.includes(pName);
                      const isHandUp = handRaisedUsers.includes(pName);

                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            <div className="truncate">
                              <span className="font-bold text-neutral-200 block truncate">{pName}</span>
                              {isMuted && <span className="text-[9px] text-red-400 font-mono block">🎙️ Microfone Silenciado</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isHandUp && (
                              <span className="text-xs animate-bounce" title="Solicitou palavra">✋</span>
                            )}
                            {isProfessor && (
                              <span className="text-[9px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-md border border-orange-500/30">
                                Mestre
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[9px] bg-neutral-800 text-neutral-400 font-bold px-2 py-0.5 rounded-md">
                                Você
                              </span>
                            )}

                            {/* ADMIN KICK CONTROL */}
                            {user.tipo === 'admin' && !isMe && (
                              <button
                                onClick={() => triggerConfirmRemoveParticipant(pName)}
                                className="p-1 hover:bg-red-600/30 text-neutral-500 hover:text-red-400 rounded transition cursor-pointer"
                                title={`Remover ${pName} da sala`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB 2: LIVE CHAT MESSAGES */}
                {activeRoomTab === 'chat' && (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
                    {liveChatMessages.map((msg) => (
                      <div key={msg.id} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-850 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className={`text-[11px] font-bold ${msg.isAdmin ? 'text-orange-400' : 'text-neutral-300'}`}>
                            {msg.sender} {msg.isAdmin && '👑'}
                          </strong>
                          <span className="text-[9px] text-neutral-500">{msg.time}</span>
                        </div>
                        <p className="text-neutral-300 leading-snug">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: TECHNICAL LOGS & DIAGNOSTICS */}
                {activeRoomTab === 'logs' && (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-neutral-850">
                      <span className="text-neutral-400 font-bold uppercase">Diagnóstico do Estúdio</span>
                      <button
                        onClick={() => setTechnicalLogs([])}
                        className="text-neutral-500 hover:text-white text-[9px] underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>

                    {technicalLogs.length === 0 ? (
                      <p className="text-neutral-500 italic p-2">Nenhum evento registrado no momento.</p>
                    ) : (
                      technicalLogs.map((log) => (
                        <div key={log.id} className="p-2 bg-neutral-950 rounded-lg border border-neutral-850 space-y-0.5">
                          <span className="text-neutral-500 text-[9px]">{log.timestamp}</span>
                          <p
                            className={
                              log.level === 'error'
                                ? 'text-red-400 font-bold'
                                : log.level === 'warn'
                                ? 'text-amber-400 font-bold'
                                : log.level === 'success'
                                ? 'text-emerald-400 font-bold'
                                : 'text-neutral-300'
                            }
                          >
                            {log.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* CHAT INPUT FORM */}
              {activeRoomTab !== 'logs' && (
                <form onSubmit={handleSendLiveChatMessage} className="pt-3 border-t border-neutral-850 flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem ou dúvida..."
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 0: CONFIRMAÇÃO OBRIGATÓRIA PARA AÇÕES CRÍTICAS NA SALA               */}
      {/* ========================================================================= */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-[#141414] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{confirmModal.title}</h3>
                <p className="text-[10px] text-amber-400 mt-0.5 uppercase tracking-widest font-bold">Confirmação de Segurança</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-850 text-xs text-neutral-300 leading-relaxed">
              {confirmModal.message}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, type: null })}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-extrabold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.confirmAction}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:brightness-110 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition shadow-lg shadow-red-600/20 cursor-pointer flex items-center gap-2"
              >
                Sim, Confirmar Ação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EXCLUSÃO PERMANENTE DA TRANSMISSÃO (DRIVE E SISTEMA)             */}
      {/* ========================================================================= */}
      {deletingStreamConfirmItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-[#141414] border border-red-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 rounded-2xl border border-red-500/40 text-red-500">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">CONFIRMAR EXCLUSÃO PERMANENTE</h3>
                <p className="text-xs text-red-400 mt-0.5">Exclusão veemente do sistema e do Google Drive</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-850 space-y-2 text-xs text-neutral-300">
              <p className="text-sm font-bold text-white">
                Deseja apagar de forma veemente a transmissão abaixo?
              </p>
              <p className="text-orange-400 font-bold">"{deletingStreamConfirmItem.titulo}"</p>
              <p className="text-neutral-400 leading-relaxed pt-2 border-t border-neutral-900">
                ⚠️ Esta ação removerá os registros da plataforma, a sala do Google Meet associada e cancelará os arquivos de gravação no Google Drive institucional de forma irreversível.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStreamConfirmItem(null)}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-extrabold text-xs py-3 px-5 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStreamVehemently}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition shadow-lg shadow-red-600/30 cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sim, Excluir do Drive e do Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GERENCIAR PATROCINADORES EM TEMPO REAL (WITH FILE UPLOAD & URL)  */}
      {/* ========================================================================= */}
      {(managingSponsorsStreamId || isLiveSponsorsDrawerOpen) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-left">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-850 mb-6">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Patrocinadores & Anúncios em Tempo Real
                </h3>
              </div>
              <button
                onClick={() => {
                  setManagingSponsorsStreamId(null);
                  setIsLiveSponsorsDrawerOpen(false);
                }}
                className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ADD NEW SPONSOR FORM WITH BOTH FILE UPLOAD AND URL OPTION */}
            <form
              onSubmit={(e) => handleAddSponsor(e, managingSponsorsStreamId || selectedActiveViewerStream?.id)}
              className="space-y-3.5 mb-6 p-4 bg-neutral-950 rounded-2xl border border-neutral-850"
            >
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Cadastrar Novo Patrocinador</h4>

              <div className="space-y-1">
                <label className="text-[9px] text-neutral-400 font-bold uppercase block">Nome da Marca / Patrocinador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Keiko Raca Fightwear"
                  value={sponsorForm.nome}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, nome: e.target.value })}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-amber-500 outline-none"
                />
              </div>

              {/* FILE UPLOAD INPUT FOR SPONSORS */}
              <div className="space-y-2 pt-1">
                <label className="text-[9px] text-amber-400 font-bold uppercase block">Opção A: Upload de Imagem do Computador</label>
                <div className="flex items-center gap-3 bg-[#1a1a1a] p-2.5 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => sponsorFileInputRef.current?.click()}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[10px] py-2 px-3.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" /> Escolher Banner / Logo
                  </button>
                  <span className="text-[11px] text-neutral-400 truncate flex-1 font-medium">
                    {sponsorForm.localBase64 ? '✅ Imagem Carregada!' : 'Nenhuma imagem enviada'}
                  </span>
                  <input
                    ref={sponsorFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSponsorFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* URL INPUT OPTION */}
              <div className="space-y-1 pt-1">
                <label className="text-[9px] text-neutral-400 font-bold uppercase block">Opção B: Ou Link da Imagem (URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={sponsorForm.imagemUrl}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, imagemUrl: e.target.value, localBase64: null })}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-amber-500 outline-none"
                />
              </div>

              {/* IMAGE PREVIEW */}
              {(sponsorForm.localBase64 || sponsorForm.imagemUrl) && (
                <div className="p-2 bg-black rounded-xl border border-amber-500/30 flex items-center gap-3">
                  <img
                    src={sponsorForm.localBase64 || sponsorForm.imagemUrl}
                    alt="Preview"
                    className="h-10 w-20 object-contain rounded bg-neutral-900 p-1"
                  />
                  <span className="text-[10px] text-amber-400 font-bold">Pré-visualização do Banner</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10"
              >
                + Cadastrar Patrocinador
              </button>
            </form>

            {/* LIST OF SPONSORS WITH LIVE TOGGLE BUTTON */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Ativar / Exibir no Ao Vivo</h4>

              {(() => {
                const targetId = managingSponsorsStreamId || selectedActiveViewerStream?.id;
                const stream = liveStreams.find((s) => s.id === targetId);
                const sponsors = stream?.patrocinadores || [];

                if (sponsors.length === 0) {
                  return <p className="text-xs text-neutral-500 italic">Nenhum patrocinador cadastrado ainda.</p>;
                }

                return (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {sponsors.map((p) => {
                      const isActive = stream?.patrocinadorAtivoId === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={p.imagemUrl} alt={p.nome} className="w-12 h-8 object-contain bg-black/40 rounded p-1" />
                            <div>
                              <strong className="text-xs font-bold block">{p.nome}</strong>
                              <span className="text-[9px] opacity-70">Slogan / Exibição em Tempo Real</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleSponsorActive(stream.id, p.id)}
                            className={`text-xs font-black py-1.5 px-3 rounded-lg transition cursor-pointer ${
                              isActive
                                ? 'bg-amber-500 text-black shadow-md'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                            }`}
                          >
                            {isActive ? 'Exibindo Ao Vivo 🔴' : 'Ativar no Ao Vivo'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

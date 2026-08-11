import React, { useState, useEffect, useMemo } from 'react';
import { Student, CheckinRequest, Notification, User, TrainingSchedule, PublicidadeItem, JustificativaFalta, ClassUnit } from '../types';
import { Users, UserCheck, Clock, CheckCircle2, ChevronLeft, ChevronRight, Calendar, Bell, Gift, Image, Trash2, Plus, Shield, Phone, Palette, Settings, AlertTriangle, Check, Link2, Upload, Timer, Trophy, Info } from 'lucide-react';
import PublicidadeCarousel from './PublicidadeCarousel';

export function formatDiasSemana(diasStr: string): string {
  if (!diasStr) return '';
  const dias = diasStr.split(', ');
  const formattedDays = dias.map(d => d.replace('-feira', ''));
  if (formattedDays.length === 1) return diasStr; // Keep full name if only 1 day, e.g. "Segunda-feira"
  const lastDay = formattedDays[formattedDays.length - 1];
  const otherDays = formattedDays.slice(0, -1);
  return `${otherDays.join(', ')} e ${lastDay}`;
}

export const THEME_COLORS = [
  { key: 'orange', name: 'Laranja Elétrico', hex: '#f97316', text: 'text-orange-500', bg: 'bg-orange-500', fromColor: '#f97316', toColor: '#ea580c' },
  { key: 'red', name: 'Vermelho Combate', hex: '#ef4444', text: 'text-red-500', bg: 'bg-red-500', fromColor: '#ef4444', toColor: '#dc2626' },
  { key: 'blue', name: 'Azul Tatame', hex: '#3b82f6', text: 'text-blue-500', bg: 'bg-blue-500', fromColor: '#3b82f6', toColor: '#2563eb' },
  { key: 'emerald', name: 'Verde Saúde', hex: '#10b981', text: 'text-emerald-500', bg: 'bg-emerald-500', fromColor: '#10b981', toColor: '#059669' },
  { key: 'purple', name: 'Roxo Graduação', hex: '#a855f7', text: 'text-purple-500', bg: 'bg-purple-500', fromColor: '#a855f7', toColor: '#9333ea' },
  { key: 'yellow', name: 'Amarelo Ouro', hex: '#eab308', text: 'text-yellow-500', bg: 'bg-yellow-500', fromColor: '#eab308', toColor: '#ca8a04' },
  { key: 'cyan', name: 'Azul Glacial', hex: '#06b6d4', text: 'text-cyan-500', bg: 'bg-cyan-500', fromColor: '#06b6d4', toColor: '#0891b2' },
  { key: 'rose', name: 'Rosa Combate', hex: '#f43f5e', text: 'text-rose-500', bg: 'bg-rose-500', fromColor: '#f43f5e', toColor: '#e11d48' },
  { key: 'lime', name: 'Verde Limão', hex: '#84cc16', text: 'text-lime-500', bg: 'bg-lime-500', fromColor: '#84cc16', toColor: '#65a30d' },
  { key: 'fuchsia', name: 'Fúcsia Dinâmico', hex: '#d946ef', text: 'text-fuchsia-500', bg: 'bg-fuchsia-500', fromColor: '#d946ef', toColor: '#c026d3' },
  { key: 'white', name: 'Branco Clássico', hex: '#ffffff', text: 'text-white', bg: 'bg-white', fromColor: '#ffffff', toColor: '#e5e5e5' },
];

interface DashboardPaneProps {
  user: User;
  alunos: Student[];
  checkinsPendentes: CheckinRequest[];
  checkinsConfirmados: CheckinRequest[];
  notificacoes: Notification[];
  carouselFotos: string[];
  logoApp: string;
  onAprovarCheckin: (alunoId: number, dataStr?: string) => void;
  onAprovarTodosCheckins: () => void;
  onAdicionarFotoCarrossel: (fotoBase64: string) => void;
  onRemoverUltimaFoto: () => void;
  onOpenParabensModal: (alunoId: number) => void;
  onLogoChange: (logoBase64: string) => void;
  onRemoverNotificacao: (id: string) => void;
  // New props
  usuarios: User[];
  onAprovarUsuario: (id: number) => void;
  onDeletarUsuario: (id: number) => void;
  trainingSchedules: TrainingSchedule[];
  onAddTrainingSchedule: (diaSemana: string, horario: string, status: 'aguardando' | 'confirmado' | 'cancelado', professorId?: number, professorNome?: string) => void;
  onUpdateTrainingStatus: (id: string, status: 'aguardando' | 'confirmado' | 'cancelado') => void;
  onDeleteTrainingSchedule: (id: string) => void;
  themeKey: string;
  onThemeChange: (key: string) => void;
  onSaveAdminProfile: (updatedUser: User) => void;
  publicidades: PublicidadeItem[];
  exibirPublicidadeAdmin?: boolean;
  onToggleExibirPublicidadeAdmin?: (val: boolean) => void;
  onAddPublicidade: (imagemUrl: string, paginas: string[], slideNumero: number) => void;
  onRemovePublicidade: (id: string) => void;
  onUpdatePublicidadePages?: (id: string, paginas: string[]) => void;
  justificativasFaltas?: JustificativaFalta[];
  onAprovarJustificativa?: (id: string, resposta?: string) => void;
  onRejeitarJustificativa?: (id: string, resposta?: string) => void;
  carouselPaginas?: string[];
  onUpdateCarouselPaginas?: (paginas: string[]) => void;
  publicidadePosicao?: 'topo' | 'meio' | 'fim';
  onUpdatePublicidadePosicao?: (posicao: 'topo' | 'meio' | 'fim') => void;
  onRegistrarCliquePublicidade?: (id: string, pagina: string) => void;
  onRegistrarVisualizacaoPublicidade?: (id: string) => void;
  recuperacoesSenha?: any[];
  onResetarSenhaRecuperacao?: (recId: string, userId: number, userNome: string) => void;
  onRemoverSolicitacaoRecuperacao?: (recId: string) => void;
  onOpenPlacar?: () => void;
  turmas?: ClassUnit[];
}

export default function DashboardPane({
  user,
  alunos,
  checkinsPendentes,
  checkinsConfirmados,
  notificacoes,
  carouselFotos,
  logoApp,
  onAprovarCheckin,
  onAprovarTodosCheckins,
  onAdicionarFotoCarrossel,
  onRemoverUltimaFoto,
  onOpenParabensModal,
  onLogoChange,
  onRemoverNotificacao,
  usuarios,
  onAprovarUsuario,
  onDeletarUsuario,
  trainingSchedules,
  onAddTrainingSchedule,
  onUpdateTrainingStatus,
  onDeleteTrainingSchedule,
  themeKey,
  onThemeChange,
  onSaveAdminProfile,
  publicidades = [],
  exibirPublicidadeAdmin = false,
  onToggleExibirPublicidadeAdmin,
  onAddPublicidade,
  onRemovePublicidade,
  onUpdatePublicidadePages,
  justificativasFaltas = [],
  onAprovarJustificativa,
  onRejeitarJustificativa,
  carouselPaginas = ['inicio'],
  onUpdateCarouselPaginas,
  publicidadePosicao = 'topo',
  onUpdatePublicidadePosicao,
  onRegistrarCliquePublicidade,
  onRegistrarVisualizacaoPublicidade,
  recuperacoesSenha = [],
  onResetarSenhaRecuperacao,
  onRemoverSolicitacaoRecuperacao,
  onOpenPlacar,
  turmas = [],
}: DashboardPaneProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedStudentId, setSelectedStudentId] = useState<number>(alunos[0]?.id || 0);

  // Training Schedule States
  const [newDiaSemana, setNewDiaSemana] = useState('Segunda-feira');
  const [newHorario, setNewHorario] = useState('19:00');
  const [newStatus, setNewStatus] = useState<'aguardando' | 'confirmado' | 'cancelado'>('aguardando');
  const [newProfId, setNewProfId] = useState<string>('');

  // Admin Profile States
  const [adminNome, setAdminNome] = useState(user.nome);
  const [adminEmail, setAdminEmail] = useState(user.email || '');
  const [adminSenha, setAdminSenha] = useState(user.senha || '');
  const [adminWhatsapp, setAdminWhatsapp] = useState(user.whatsapp || '');
  const [adminPerfilLabel, setAdminPerfilLabel] = useState(user.perfilLabel || '');
  const [adminFoto, setAdminFoto] = useState(user.fotoPerfil || '');
  const [adminCpf, setAdminCpf] = useState(user.cpf || '');
  const [adminDataNascimento, setAdminDataNascimento] = useState(user.dataNascimento || '');
  const [adminEndereco, setAdminEndereco] = useState(user.endereco || '');
  const [adminTipoSangue, setAdminTipoSangue] = useState(user.tipoSangue || '');
  const [adminAlergico, setAdminAlergico] = useState(user.alergico || '');
  const [adminContatoEmergenciaNome, setAdminContatoEmergenciaNome] = useState(user.contatoEmergenciaNome || '');
  const [adminContatoEmergenciaTelefone, setAdminContatoEmergenciaTelefone] = useState(user.contatoEmergenciaTelefone || '');

  // Advertising management states
  const [pubPaginas, setPubPaginas] = useState<string[]>([]);
  const [pubMetodo, setPubMetodo] = useState<'url' | 'upload'>('url');
  const [pubUrlInput, setPubUrlInput] = useState('');
  const [selectedSlideNum, setSelectedSlideNum] = useState<number>(1);
  const [activeConfigPage, setActiveConfigPage] = useState<string>('inicio');

  // Dynamic style mappings for the Privacy Area (Meu Cadastro Pessoal) to respect the active theme
  const currentTheme = THEME_COLORS.find(c => c.key === themeKey) || THEME_COLORS[0];
  const themeTextClass = themeKey === 'white' ? 'text-white' : currentTheme.text;
  const themeBorderFocusClass = themeKey === 'white' ? 'focus:border-neutral-400' : 'focus:border-orange-500';
  const themeButtonBgClass = themeKey === 'white' 
    ? 'bg-neutral-200 hover:bg-neutral-100 text-black shadow-sm' 
    : 'bg-orange-500 hover:brightness-110 text-white shadow-orange-500/10';
  const themeFileBgClass = themeKey === 'white' 
    ? 'file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700' 
    : 'file:bg-orange-600 file:text-white hover:file:brightness-110';
  const themeShadowClass = themeKey === 'white' ? 'shadow-neutral-500/5' : 'shadow-orange-500/10';

  // Load configured settings for the selected slide on click
  const handleSelectSlide = (num: number) => {
    setSelectedSlideNum(num);
    const existingPub = publicidades.find((p) => p.slideNumero === num);
    if (existingPub) {
      setPubPaginas(existingPub.paginas || []);
      setPubUrlInput(!existingPub.imagemUrl.startsWith('data:image/') ? existingPub.imagemUrl : '');
    } else {
      setPubPaginas([]);
      setPubUrlInput('');
    }
  };

  // Mount sync once
  useEffect(() => {
    const existingPub = publicidades.find((p) => p.slideNumero === selectedSlideNum);
    if (existingPub) {
      setPubPaginas(existingPub.paginas || []);
      setPubUrlInput(!existingPub.imagemUrl.startsWith('data:image/') ? existingPub.imagemUrl : '');
    } else {
      setPubPaginas([]);
      setPubUrlInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePageCheckbox = (itemId: string) => {
    const isChecked = pubPaginas.includes(itemId);
    const newPages = isChecked
      ? pubPaginas.filter(p => p !== itemId)
      : [...pubPaginas, itemId];
    
    setPubPaginas(newPages);

    const existingPub = publicidades.find((p) => p.slideNumero === selectedSlideNum);
    if (existingPub && onUpdatePublicidadePages) {
      onUpdatePublicidadePages(existingPub.id, newPages);
    }
  };

  const handleAddPubImage = () => {
    if (pubPaginas.length === 0) {
      alert('⚠️ Selecione pelo menos uma página de destino para a publicidade.');
      return;
    }
    if (pubMetodo === 'url') {
      if (!pubUrlInput.trim()) {
        alert('⚠️ Por favor insira uma URL de imagem válida.');
        return;
      }
      onAddPublicidade(pubUrlInput.trim(), pubPaginas, selectedSlideNum);
      setPubUrlInput('');
      alert(`Slide ${selectedSlideNum} configurado com sucesso!`);
    }
  };

  const handlePubFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (pubPaginas.length === 0) {
      alert('⚠️ Selecione pelo menos uma página de destino para a publicidade.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onAddPublicidade(event.target.result as string, pubPaginas, selectedSlideNum);
          alert(`Slide ${selectedSlideNum} carregado com sucesso!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [pubToDelete, setPubToDelete] = useState<PublicidadeItem | null>(null);
  const [userToReject, setUserToReject] = useState<{ id: number; nome: string } | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [notifToDelete, setNotifToDelete] = useState<string | null>(null);

  // Helper function to normalize strings for comparison (case & accent insensitive)
  const normalizeStr = (str?: string) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // FILTRAGEM DO CRONOGRAMA DE TREINOS POR PERFIL E TURMA
  const cronogramaFiltrado = useMemo(() => {
    if (!trainingSchedules || trainingSchedules.length === 0) return [];

    const role = user?.tipo || 'aluno';

    // 1. ADMINISTRADOR: visualiza todas as aulas de todas as turmas cadastradas (sem qualquer filtro)
    if (role === 'admin') {
      return trainingSchedules;
    }

    // 2. PROFESSOR: visualiza apenas as turmas pelas quais é responsável
    if (role === 'professor') {
      return trainingSchedules.filter((item) => {
        if (item.professorId && Number(item.professorId) === Number(user.id)) return true;
        if (item.professorNome && user.nome) {
          const pName = normalizeStr(item.professorNome);
          const uName = normalizeStr(user.nome);
          if (pName.includes(uName) || uName.includes(pName)) return true;
        }
        return false;
      });
    }

    // 3. INSTRUTOR: visualiza apenas as turmas em que está vinculado
    if (role === 'instrutor') {
      return trainingSchedules.filter((item) => {
        if (item.professorId && Number(item.professorId) === Number(user.id)) return true;
        if (item.professorNome && user.nome) {
          const pName = normalizeStr(item.professorNome);
          const uName = normalizeStr(user.nome);
          if (pName.includes(uName) || uName.includes(pName)) return true;
        }
        return false;
      });
    }

    // 4. ALUNO: visualiza apenas as aulas das turmas em que está matriculado
    if (role === 'aluno') {
      const currentStudent = alunos.find(
        (a) =>
          (a.usuarioId && Number(a.usuarioId) === Number(user.id)) ||
          (user.cpf && a.cpf === user.cpf) ||
          (a.email && normalizeStr(a.email) === normalizeStr(user.email)) ||
          (a.nome && normalizeStr(a.nome) === normalizeStr(user.nome))
      );

      const enrolledTurmasSet = new Set<string>();

      const addTurmaRef = (val?: string) => {
        if (!val) return;
        val.split(',').forEach((t) => {
          const cleaned = normalizeStr(t);
          if (cleaned) enrolledTurmasSet.add(cleaned);
        });
      };

      if (currentStudent) {
        addTurmaRef(currentStudent.turma);
        addTurmaRef(currentStudent.turmaId);
      }
      if (user) {
        addTurmaRef((user as any).turma);
        addTurmaRef((user as any).turmaId);
        addTurmaRef(user.perfilLabel);
      }

      // Se o aluno não estiver matriculado em nenhuma turma, retornar lista vazia
      if (enrolledTurmasSet.size === 0) {
        return [];
      }

      return trainingSchedules.filter((item) => {
        const scheduleTurmaName = normalizeStr(item.nomeTurma || (item as any).nome);
        const scheduleId = normalizeStr(item.id);

        if (!scheduleTurmaName && !scheduleId) return false;

        for (const enrolled of enrolledTurmasSet) {
          if (
            scheduleTurmaName.includes(enrolled) ||
            enrolled.includes(scheduleTurmaName) ||
            scheduleId === enrolled
          ) {
            return true;
          }
        }
        return false;
      });
    }

    return trainingSchedules;
  }, [trainingSchedules, user, alunos]);

  const agendamentosExperimentais = notificacoes.filter(
    (n) => n.de === 'Visitante (Experimental)' || n.texto.includes('AULA EXPERIMENTAL')
  );

  // Sync selectedStudentId when alumnos prop changes
  useEffect(() => {
    if (alunos.length > 0) {
      if (!alunos.some((a) => a.id === selectedStudentId)) {
        setSelectedStudentId(alunos[0].id);
      }
    } else {
      setSelectedStudentId(0);
    }
  }, [alunos, selectedStudentId]);

  // Auto scroll slide every 1 minute
  useEffect(() => {
    if (carouselFotos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselFotos.length);
    }, 60000);
    return () => clearInterval(interval);
  }, [carouselFotos]);

  const handlePrevSlide = () => {
    if (carouselFotos.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + carouselFotos.length) % carouselFotos.length);
  };

  const handleNextSlide = () => {
    if (carouselFotos.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % carouselFotos.length);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onAdicionarFotoCarrossel(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        alert('⚠️ O arquivo de logotipo deve estar obrigatoriamente no formato PNG para preservar a transparência original.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onLogoChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper stats (Regras do Dashboard Principal)
  // Contas operacionais: Alunos, Professores e Instrutores. Exclui administradores e contas híbridas de administração (URI CRUZ).
  const isOperationalUser = (u: User) => {
    const isAdminAccount =
      u.tipo === 'admin' ||
      u.email === 'admin@admin.com' ||
      u.email === 'uricruz@gmail.com' ||
      u.email === 'smerelatorios@gmail.com' ||
      (u.nome && (u.nome.toUpperCase().includes('ADMINISTRADOR') || u.nome.toUpperCase().includes('URI CRUZ') || u.nome.toUpperCase().includes('YURI CRUZ')));

    if (isAdminAccount) return false;

    return u.tipo === 'aluno' || u.tipo === 'professor' || u.tipo === 'instrutor';
  };

  // 1. Total de Cadastrados: Alunos, professores e instrutores APROVADOS. Exclui pendentes e contas administrativas (REGRA 1).
  const totalCadastrados = usuarios.filter((u) => isOperationalUser(u) && u.aprovado !== false).length;

  // 2. Cadastros Ativos: Alunos, professores e instrutores APROVADOS e ativos. Exclui pendentes e contas administrativas (REGRA 1 & REGRA 9).
  const cadastrosAtivos = usuarios.filter((u) => {
    if (!isOperationalUser(u)) return false;
    if (u.aprovado === false) return false;

    // Se houver vinculo com cadastro de aluno em 'alunos', verificar se não está inativo
    const matchingAluno = alunos.find(
      (a) => a.usuarioId != null && Number(a.usuarioId) === Number(u.id)
    );

    if (matchingAluno && matchingAluno.ativo === false) {
      return false;
    }

    return true;
  }).length;
  const hojeStr = new Date().toISOString().split('T')[0];
  const presencasHoje = checkinsConfirmados.filter((c) => c.data === hojeStr && alunos.some((a) => a.id === c.alunoId)).length;
  const pendentesCount = checkinsPendentes.filter((req) => alunos.some((a) => a.id === req.alunoId)).length;

  // Aniversariantes de hoje
  const getAniversariantesHoje = () => {
    const hoje = new Date();
    const dh = hoje.getDate();
    const mh = hoje.getMonth() + 1;
    return alunos.filter((a) => {
      if (!a.dataNascimento) return false;
      const partes = a.dataNascimento.split('-');
      if (partes.length < 3) return false;
      return parseInt(partes[2]) === dh && parseInt(partes[1]) === mh;
    });
  };

  const aniversariantesHoje = getAniversariantesHoje();

  // Presence calendar generation
  const renderCalendarGrid = () => {
    const selectedStudent = alunos.find((a) => a.id === selectedStudentId);
    if (!selectedStudent) return <p className="text-neutral-500 text-sm">Selecione um aluno para visualizar o calendário.</p>;

    const ano = new Date().getFullYear();
    const diasNoMes = new Date(ano, selectedMonth + 1, 0).getDate();
    const gridElements = [];

    const getDayState = (dataStr: string) => {
      // 1. Is present? (Green)
      if (selectedStudent.checkins.includes(dataStr)) {
        return 'presente';
      }

      // 2. Is justified or past 23h59 deadline? (Orange)
      if (justificativasFaltas) {
        const just = justificativasFaltas.find(j => j.alunoId === selectedStudent.id && j.data === dataStr);
        if (just) {
          if (just.status === 'aprovada') return 'justificada';
          if (just.status === 'rejeitada') return 'falta';
        }
      }

      return 'normal';
    };

    for (let d = 1; d <= diasNoMes; d++) {
      const dataStr = `${ano}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const state = getDayState(dataStr);
      
      let classNames = '';
      let tooltipText = `Dia ${d}`;

      switch (state) {
        case 'presente':
          classNames = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20';
          tooltipText = `Dia ${d}: Presença`;
          break;
        case 'justificada':
          classNames = 'bg-orange-500 text-white shadow-md shadow-orange-500/20';
          tooltipText = `Dia ${d}: Falta Justificada`;
          break;
        case 'falta':
          classNames = 'bg-red-600 text-white shadow-md shadow-red-600/20';
          tooltipText = `Dia ${d}: Falta`;
          break;
        default:
          classNames = 'bg-neutral-850/60 text-neutral-500';
          break;
      }

      gridElements.push(
        <div
          key={d}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative ${classNames}`}
          title={tooltipText}
        >
          {d}
        </div>
      );
    }

    const treinosNoMes = selectedStudent.checkins.filter((c) =>
      c.startsWith(`${ano}-${String(selectedMonth + 1).padStart(2, '0')}`)
    ).length;

    return (
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center text-[10px] uppercase font-bold text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0"></span>
            <span>Presença</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-500 shrink-0"></span>
            <span>Justificado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-600 shrink-0"></span>
            <span>Falta</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto justify-items-center">
          {gridElements}
        </div>
        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/40 text-sm mt-4 text-left space-y-1.5">
          <p className="text-neutral-300 font-medium font-sans">
            🚀 Total de treinos em{' '}
            <strong className="text-orange-500">
              {new Date(ano, selectedMonth, 1).toLocaleString('pt-BR', { month: 'long' })}
            </strong>
            : <strong className="text-white text-base">{treinosNoMes}</strong> treinos
          </p>
          <p className="text-neutral-400 text-xs font-sans">
            📈 Aproveitamento do Mês: <strong className="text-emerald-500">{Math.min(Math.round((treinosNoMes / diasNoMes) * 100), 100)}%</strong> (com base nos {diasNoMes} dias do mês)
          </p>
        </div>
      </div>
    );
  };

  const meses = Array.from({ length: 12 }, (_, i) =>
    new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'long' })
  );

  return (
    <div className="space-y-6">
      {exibirPublicidadeAdmin && (
        <PublicidadeCarousel
          pagina="inicio"
          publicidades={publicidades}
          onRegistrarClique={onRegistrarCliquePublicidade}
          onRegistrarVisualizacao={onRegistrarVisualizacaoPublicidade}
        />
      )}

      {/* STATS BENTO GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* CARD 1: TOTAL DE CADASTRADOS */}
        <div
          title="Quantidade total de alunos, professores e instrutores cadastrados no sistema, incluindo cadastros pendentes e aprovados. Contas administrativas não são contabilizadas."
          className="bg-[#141414] p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group cursor-help transition-all duration-300 hover:border-orange-500/50"
        >
          <div className="absolute top-2 right-2 sm:top-0 sm:right-0 p-2 sm:p-4 text-orange-500/30 sm:text-orange-500/80 group-hover:scale-110 transition-transform pointer-events-none">
            <Users className="w-10 h-10 sm:w-16 sm:h-16" />
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <p className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total de Cadastrados</p>
            <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-orange-400 transition" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-orange-500 mt-1.5 sm:mt-2 relative z-10">{totalCadastrados}</p>
          <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500 absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* CARD 2: CADASTROS ATIVOS */}
        <div
          title="Quantidade de alunos, professores e instrutores aprovados e ativos no sistema. Contas administrativas e cadastros pendentes não são contabilizados."
          className="bg-[#141414] p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group cursor-help transition-all duration-300 hover:border-emerald-500/50"
        >
          <div className="absolute top-2 right-2 sm:top-0 sm:right-0 p-2 sm:p-4 text-emerald-500/30 sm:text-emerald-500/80 group-hover:scale-110 transition-transform pointer-events-none">
            <UserCheck className="w-10 h-10 sm:w-16 sm:h-16" />
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <p className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Cadastros Ativos</p>
            <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-emerald-400 transition" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-1.5 sm:mt-2 relative z-10">{cadastrosAtivos}</p>
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* CARD 3: PRESENÇAS DE HOJE */}
        <div
          title="Quantidade de check-ins confirmados na data atual."
          className="bg-[#141414] p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group cursor-help transition-all duration-300 hover:border-blue-500/50"
        >
          <div className="absolute top-2 right-2 sm:top-0 sm:right-0 p-2 sm:p-4 text-blue-500/30 sm:text-blue-500/80 group-hover:scale-110 transition-transform pointer-events-none">
            <CheckCircle2 className="w-10 h-10 sm:w-16 sm:h-16" />
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <p className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Presenças de Hoje</p>
            <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-blue-400 transition" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-500 mt-1.5 sm:mt-2 relative z-10">{presencasHoje}</p>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* CARD 4: CHECK-INS PENDENTES */}
        <div
          title="Quantidade de solicitações de check-in aguardando confirmação."
          className="bg-[#141414] p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-lg relative overflow-hidden group cursor-help transition-all duration-300 hover:border-amber-500/50"
        >
          <div className="absolute top-2 right-2 sm:top-0 sm:right-0 p-2 sm:p-4 text-amber-500/30 sm:text-amber-500/80 group-hover:scale-110 transition-transform pointer-events-none">
            <Clock className="w-10 h-10 sm:w-16 sm:h-16" />
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <p className="text-[#a3a3a3] text-[10px] sm:text-xs font-bold uppercase tracking-wider">Check-ins Pendentes</p>
            <Info className="w-3.5 h-3.5 text-neutral-500 hover:text-amber-400 transition" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1.5 sm:mt-2 relative z-10">{pendentesCount}</p>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* PLACAR E CRONÔMETRO CBJJ (EXCLUSIVE ADMIN CARD) */}
      {user.tipo === 'admin' && onOpenPlacar && (
        <div className="bg-[#141414] p-5 rounded-3xl border-2 border-orange-500/40 bg-gradient-to-r from-orange-950/20 via-[#181818] to-red-950/20 shadow-2xl text-left hover:border-orange-500 transition group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="w-8 h-8 text-orange-500 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full inline-block mb-1">
                  MÓDULO EXCLUSIVO ADMINISTRADOR
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Placar e Cronômetro (CBJJ)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-2xl leading-relaxed">
                  Gerenciamento oficial de lutas em tempo real segundo o regulamento da CBJJ. Painel de Operador (Controle), Telão de Exibição com sincronização instantânea e seleção inteligente de bandeiras.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenPlacar}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition cursor-pointer shadow-lg shadow-orange-500/20 shrink-0 flex items-center justify-center gap-2"
            >
              <Timer className="w-4 h-4 text-black" />
              <span>ACESSAR PLACAR</span>
            </button>
          </div>
        </div>
      )}

      {/* SEÇÃO DE AULAS EXPERIMENTAIS (ADMIN ONLY) */}
      {user.tipo === 'admin' && agendamentosExperimentais.length > 0 && (
        <div className="bg-[#141414] p-6 rounded-2xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent shadow-lg text-left">
          <div className="flex items-center gap-2.5 mb-4 text-orange-500 border-b border-neutral-900 pb-3">
            <Calendar className="w-5.5 h-5.5 text-orange-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Agendamentos de Aula Experimental</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Notificações exclusivas de visitas e novos interessados agendados</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agendamentosExperimentais.map((notif) => {
              const lines = notif.texto.split('\n');
              const waLine = lines.find((l) => l.toLowerCase().includes('whatsapp:'));
              const phoneOnly = waLine ? waLine.replace(/[^0-9]/g, '') : '';
              const waUrl = phoneOnly ? `https://wa.me/${phoneOnly.startsWith('55') ? phoneOnly : '55' + phoneOnly}` : '';

              return (
                <div key={notif.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 flex flex-col justify-between hover:border-orange-500/20 transition">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-mono block mb-2">{notif.data}</span>
                    <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">{notif.texto}</p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-neutral-900">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Falar no WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => onRemoverNotificacao(notif.id)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-[11px] py-1.5 px-3 rounded-lg transition cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PHOTO CAROUSEL (Renders only if photos are present) */}
      {carouselFotos.length > 0 && (
        <div className="relative w-full h-[260px] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800/80 group">
          <div
            className="flex flex-row flex-nowrap h-full transition-transform duration-700 ease-out"
            style={{ transform: `translate3d(-${currentSlide * 100}%, 0, 0)`, width: '100%' }}
          >
            {carouselFotos.map((foto, idx) => (
              <div
                key={idx}
                className="h-full w-full flex-shrink-0 shrink-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${foto}')` }}
              />
            ))}
          </div>

          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition border border-white/10 opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition border border-white/10 opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {carouselFotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide ? 'bg-orange-500 w-5' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ANIVERSARIANTES DE HOJE */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
        <div className="flex items-center gap-2 mb-4 text-amber-500 border-b border-neutral-900 pb-3">
          <Gift className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">🎂 Aniversariantes de Hoje</h3>
        </div>

        <div className="space-y-3">
          {aniversariantesHoje.length > 0 ? (
            aniversariantesHoje.map((aluno) => (
              <div
                key={aluno.id}
                className="p-4 rounded-xl border-2 border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 flex items-center justify-between animate-birthday-glow"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-3xl">🎂</span>
                  <div>
                    <strong className="text-white text-sm block">{aluno.nome}</strong>
                    <span className="text-xs text-yellow-500/90 font-medium block mt-0.5">Completando mais um ano de vida hoje! 🎉</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 opacity-50 text-sm">Nenhum aluno faz aniversário hoje</div>
          )}
        </div>
      </div>

      {/* ADMIN CAROUSEL AND LOGO MANAGE */}
      {user.tipo === 'admin' && (
        <div className="space-y-6">
          {/* ADMIN SETTINGS: LOGOTIPO */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 mb-4 text-orange-500">
              <Shield className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-left">Logotipo da Academia</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border shrink-0 shadow-lg transition-all duration-300 ${
                  logoApp && logoApp.startsWith('data:image/') 
                    ? 'bg-transparent p-0 border-neutral-800' 
                    : (themeKey === 'blue' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/20 shadow-blue-500/10' :
                       themeKey === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/20 shadow-emerald-500/10' :
                       themeKey === 'purple' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 border-purple-400/20 shadow-purple-500/10' :
                       themeKey === 'red' ? 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400/20 shadow-red-500/10' :
                       themeKey === 'yellow' ? 'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-400/20 shadow-yellow-500/10' :
                       themeKey === 'cyan' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400/20 shadow-cyan-500/10' :
                       themeKey === 'rose' ? 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400/20 shadow-rose-500/10' :
                       themeKey === 'fuchsia' ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 border-fuchsia-400/20 shadow-fuchsia-500/10' :
                       themeKey === 'lime' ? 'bg-gradient-to-br from-lime-500 to-emerald-600 border-lime-400/20 shadow-lime-500/10' :
                       themeKey === 'white' ? 'bg-white border-neutral-200 shadow-neutral-200/10' :
                       'bg-gradient-to-br from-orange-500 to-red-600 border-orange-400/20 shadow-orange-500/10')
                }`}
              >
                <img 
                  src={logoApp && (logoApp.startsWith('data:image/') || logoApp.startsWith('http://') || logoApp.startsWith('https://') || logoApp.startsWith('blob:')) ? logoApp : (themeKey === 'white' ? '/ARENADOCOMPETIDOR.png' : '/Logo%20branca.png')} 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="space-y-2 flex-1 w-full">
                <p className="text-xs text-neutral-400">Altere o logotipo do cabeçalho da Arena carregando uma nova imagem.</p>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-neutral-800 text-neutral-300 font-semibold text-xs py-2.5 px-3 rounded-lg cursor-pointer transition">
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {logoApp && logoApp.startsWith('data:image/') && (
                    <button
                      onClick={() => onLogoChange('')}
                      className="bg-neutral-900/60 hover:bg-red-900/20 text-neutral-400 hover:text-red-500 border border-neutral-800 hover:border-red-900/50 text-[11px] py-2 px-3 rounded-lg transition"
                    >
                      Restaurar Padrão
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRID DE PENDENCIAS E CALENDARIO */}
      {(() => {
        const myPendingCheckins = checkinsPendentes.filter((req) => alunos.some((a) => a.id === req.alunoId));
        const pendingJusts = justificativasFaltas.filter((j) => j.status === 'pendente');
        const todayCheckins = checkinsConfirmados.filter((c) => c.data === hojeStr);
        const hasLeftColumnItems = myPendingCheckins.length > 0 || pendingJusts.length > 0 || todayCheckins.length > 0;

        return (
          <div className={`grid grid-cols-1 ${hasLeftColumnItems ? 'xl:grid-cols-2' : ''} gap-6`}>
            {hasLeftColumnItems && (
              <div className="space-y-6">
                {/* CHECK-INS PENDENTES */}
                {myPendingCheckins.length > 0 && (
                  <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
                    <div className="flex justify-between items-center mb-4 border-b border-neutral-900 pb-3">
                      <div className="flex items-center gap-2 text-orange-500">
                        <Clock className="w-5 h-5" />
                        <h3 className="text-base font-bold text-white">Check-ins Pendentes</h3>
                      </div>
                      <button
                        onClick={onAprovarTodosCheckins}
                        className="bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold py-1.5 px-3 rounded-lg transition cursor-pointer"
                      >
                        Aprovar Todos
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {myPendingCheckins.map((req, idx) => {
                        const student = alunos.find((a) => a.id === req.alunoId);
                        return (
                          <div
                            key={idx}
                            className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-800/80 flex justify-between items-center shadow-sm hover:border-neutral-700 transition"
                          >
                            <div className="text-left">
                              <span className="font-semibold text-white text-sm block">🥋 {student?.nome || 'Desconhecido'}</span>
                              <span className="text-xs text-neutral-500 block mt-0.5">Solução enviada para: {req.data}</span>
                            </div>
                            <button
                              onClick={() => onAprovarCheckin(req.alunoId, req.data)}
                              className="bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition shadow-md shadow-orange-500/10 cursor-pointer"
                            >
                              Aprovar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* JUSTIFICATIVAS DE FALTA PENDENTES */}
                {pendingJusts.length > 0 && (
                  <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
                    <div className="flex items-center gap-2 mb-4 border-b border-neutral-900 pb-3 text-amber-500">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="text-base font-bold text-white">Justificativas de Falta</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pendingJusts.map((just) => {
                        return (
                          <div
                            key={just.id}
                            className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-800/80 flex flex-col justify-between gap-3 shadow-sm hover:border-neutral-700 transition text-left"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-semibold text-white text-sm block">🥋 {just.alunoNome}</span>
                                  <span className="text-xs text-amber-500 block mt-0.5">Falta no dia: {just.data}</span>
                                </div>
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0">Pendente</span>
                              </div>
                              <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 italic">
                                "{just.motivo}"
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                onClick={() => {
                                  const resp = prompt('Digite uma mensagem ou observação (opcional):') || undefined;
                                  onAprovarJustificativa?.(just.id, resp);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-[11px] py-1.5 px-3 rounded-lg transition cursor-pointer"
                              >
                                Aceitar & Abonar
                              </button>
                              <button
                                onClick={() => {
                                  const resp = prompt('Digite o motivo da rejeição (opcional):') || undefined;
                                  onRejeitarJustificativa?.(just.id, resp);
                                }}
                                className="bg-red-600/20 hover:bg-red-600 text-neutral-300 hover:text-white border border-red-500/20 text-[11px] py-1.5 px-3 rounded-lg transition cursor-pointer"
                              >
                                Rejeitar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CHECK-INS CONFIRMADOS HOJE */}
                {todayCheckins.length > 0 && (
                  <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
                    <div className="flex items-center gap-2 mb-4 text-emerald-500 border-b border-neutral-900 pb-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <h3 className="text-base font-bold text-white">Presenças Confirmadas Hoje</h3>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {todayCheckins.map((c, idx) => {
                        const student = alunos.find((a) => a.id === c.alunoId);
                        return (
                          <div
                            key={idx}
                            className="bg-[#1a1a1a] p-3 rounded-xl border border-neutral-800/60 flex items-center gap-3 text-left"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <div>
                              <span className="font-semibold text-white text-sm block">{student?.nome}</span>
                              <span className="text-[10px] text-neutral-500 block mt-0.5">Confirmado para {c.data}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6 flex flex-col justify-between h-full">
              {/* PALETA DE CORES DA ARENA */}
              {user.tipo === 'admin' && (
                <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md text-left">
                  <div className="flex items-center gap-2 mb-3 text-orange-500 border-b border-neutral-900 pb-3">
                    <Palette className="w-5 h-5" />
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Paleta de Cores da Arena</h3>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">Escolha a cor principal para os cabeçalhos, botões e detalhes visuais do sistema:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {THEME_COLORS.map((color) => {
                      const isSelected = themeKey === color.key;
                      return (
                        <button
                          key={color.key}
                          type="button"
                          onClick={() => {
                            onThemeChange(color.key);
                          }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            isSelected ? 'border-white text-white bg-white/5' : 'border-neutral-800 text-neutral-400 hover:border-neutral-750 hover:text-white'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                          <span className="truncate">{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CRONOGRAMA DE TREINOS SEMANAIS (CHECKLIST) */}
              <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md text-left flex-1 flex flex-col min-h-[320px]">
                <div className="flex items-center gap-2 mb-4 text-orange-500 border-b border-neutral-900 pb-3 shrink-0 justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <h3 className="text-base font-bold text-white">Cronograma de Treinos da Semana</h3>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-semibold bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
                    {cronogramaFiltrado.length} {cronogramaFiltrado.length === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>

                {/* List training schedules filtered by logged user role */}
                <div className="flex-1 overflow-y-auto max-h-[550px] pr-1">
                  <div className={`grid grid-cols-1 ${!hasLeftColumnItems ? 'sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'sm:grid-cols-2'} gap-3`}>
                    {cronogramaFiltrado.length > 0 ? (
                      cronogramaFiltrado.map((item) => {
                        const profDisplay = item.professorNome
                          ? item.professorNome.replace(/Y+URI/gi, 'YURI').replace(/\bURI\b/gi, 'YURI')
                          : (user.tipo === 'professor' ? user.nome : 'Não informado');
                        const turmaNome = item.nomeTurma || (item as any).nome || 'Turma Geral';

                        return (
                          <div
                            key={item.id}
                            className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800/80 hover:border-orange-500/40 flex flex-col justify-between gap-3 text-xs animate-fade-in transition shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-neutral-800/60 pb-2">
                              {/* 1. Nome da Aula / Turma */}
                              <div className="font-extrabold text-white text-sm tracking-tight leading-snug break-words">
                                {turmaNome}
                              </div>

                              <span
                                className={`text-[9px] font-extrabold uppercase py-1 px-2 rounded-lg border tracking-wide select-none shrink-0 ${
                                  item.status === 'confirmado'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                }`}
                              >
                                {item.status === 'confirmado' ? 'Confirmado' : 'Aguardando'}
                              </span>
                            </div>

                            <div className="text-left space-y-1.5 pt-0.5">
                              {/* 2. Nome do Professor Responsável */}
                              <div className="text-xs text-orange-400 font-bold tracking-wider flex items-start gap-1.5 break-words">
                                <span className="shrink-0">🥋</span>
                                <span className="break-words">Professor: {profDisplay}</span>
                              </div>

                              {/* 3. Dia da Semana */}
                              <div className="text-xs text-neutral-300 font-medium flex items-start gap-1.5 break-words">
                                <span className="shrink-0">📅</span>
                                <span className="break-words">{formatDiasSemana(item.diaSemana)}</span>
                              </div>

                              {/* 4. Horário da Aula */}
                              <div className="text-xs text-neutral-400 font-medium flex items-start gap-1.5 break-words">
                                <span className="shrink-0">⏰</span>
                                <span className="break-words">{item.horario}</span>
                              </div>

                              {/* 5. Turma correspondente (quando aplicável) */}
                              {item.nomeTurma && (item as any).nome && item.nomeTurma !== (item as any).nome && (
                                <div className="text-[11px] text-amber-400 font-semibold flex items-start gap-1.5 break-words pt-0.5">
                                  <span className="shrink-0">🏫</span>
                                  <span className="break-words">Turma: {item.nomeTurma}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 opacity-50 text-xs col-span-full">
                        Nenhuma aula encontrada no cronograma para o seu perfil.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PRESENÇA MENSAL GRIDS */}
      <div className="bg-[#141414] p-5 rounded-2xl border border-neutral-800 shadow-md">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-900 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-orange-500">
            <Calendar className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Presença Mensal</h3>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-[#1a1a1a] text-xs text-white border border-neutral-800 rounded-lg py-1 px-2 focus:border-orange-500 outline-none cursor-pointer"
            >
              {meses.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
              className="bg-[#1a1a1a] text-xs text-white border border-neutral-800 rounded-lg py-1 px-2 focus:border-orange-500 outline-none max-w-[150px] cursor-pointer"
            >
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {renderCalendarGrid()}
      </div>



      {userToReject !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar Recusa
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja mesmo recusar o cadastro de <strong className="text-white">{userToReject.nome}</strong>? Esta ação removerá a solicitação de cadastro do sistema permanentemente.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setUserToReject(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeletarUsuario(userToReject.id);
                  setUserToReject(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/15 transition cursor-pointer"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

      {scheduleToDelete !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar Exclusão
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja excluir este treino da grade semanal? Esta ação removerá o horário e seus check-ins.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setScheduleToDelete(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteTrainingSchedule(scheduleToDelete);
                  setScheduleToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/15 transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {notifToDelete !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar Exclusão de Notificação
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja excluir esta notificação permanentemente para todos os usuários? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setNotifToDelete(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onRemoverNotificacao) {
                    onRemoverNotificacao(notifToDelete);
                  }
                  setNotifToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/15 transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {pubToDelete !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Excluir Imagem
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Tem certeza de que deseja excluir esta imagem?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setPubToDelete(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRemovePublicidade(pubToDelete.id);
                  setPubToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/15 transition cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

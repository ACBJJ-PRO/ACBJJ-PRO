import React, { useState } from 'react';
import { Student, User, UserRole, isAdultPerson } from '../types';
import {
  Search,
  UserCheck,
  Shield,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  Key,
  Users,
  Award,
  Edit,
  Trash2,
  Check,
} from 'lucide-react';
import { maskPhone, formatDateBR } from '../utils/formatters';
import { validarCPF, maskCPF } from './OConfrontoModule';

interface AlunosPaneProps {
  currentUser?: User;
  alunos: Student[];
  onAddAluno?: (
    aluno: Omit<
      Student,
      | 'id'
      | 'usuarioId'
      | 'checkins'
      | 'pontosCompeticao'
      | 'notaAvaliacao'
      | 'mediaGeral'
      | 'medalhasOuro'
      | 'medalhasPrata'
      | 'medalhasBronze'
    >,
    fotoBase64: string
  ) => void;
  onToggleStatus: (id: number) => void;
  onDeletarAluno: (id: number) => void;
  onChangePassword?: (alunoId: number, novaSenha: string) => void;
  onDeletarUsuario?: (id: number) => void;
  onChangeUserPassword?: (id: number, novaSenha: string) => void;
  onAprovarUsuario?: (id: number) => void;
  isAdmin?: boolean;
  onUpdateAluno?: (id: number, updatedFields: Partial<Student> & { tipo?: UserRole }) => void;
  onUpdateUsuario?: (id: number, updatedFields: Partial<User>) => void;
  usuarios?: User[];
  onAddAuditLog?: (
    acao: string,
    entidade: string,
    detalhes: string,
    dadosAnt?: any,
    dadosNovos?: any
  ) => void;
}

export default function AlunosPane({
  currentUser,
  alunos,
  onToggleStatus,
  onDeletarAluno,
  onChangePassword,
  onDeletarUsuario,
  onChangeUserPassword,
  onAprovarUsuario,
  isAdmin = false,
  onUpdateAluno,
  onUpdateUsuario,
  usuarios = [],
  onAddAuditLog,
}: AlunosPaneProps) {
  // Active Quadro Tab: 'alunos' | 'professores' | 'instrutores'
  const [activeQuadro, setActiveQuadro] = useState<'alunos' | 'professores' | 'instrutores'>('alunos');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    nome: string;
    tipoEntidade: 'aluno' | 'usuario';
  } | null>(null);

  // Password Reset Modal State
  const [resetTarget, setResetTarget] = useState<{
    id: number;
    nome: string;
    isAluno: boolean;
    tipoLabel?: string;
  } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetType, setResetType] = useState<'manual' | 'padrao'>('manual');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Edit Student Modal State
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editDataNascimento, setEditDataNascimento] = useState('');
  const [editFaixa, setEditFaixa] = useState('');
  const [editStudentTipo, setEditStudentTipo] = useState<UserRole>('aluno');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editDataInicioTreino, setEditDataInicioTreino] = useState('');
  const [editContatoEmergenciaNome, setEditContatoEmergenciaNome] = useState('');
  const [editContatoEmergenciaTelefone, setEditContatoEmergenciaTelefone] = useState('');
  const [editProfId, setEditProfId] = useState<number | ''>('');
  const [editProfNome, setEditProfNome] = useState('');

  // User/Professor/Instrutor Edit State
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editUserNome, setEditUserNome] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserCpf, setEditUserCpf] = useState('');
  const [editUserDataNascimento, setEditUserDataNascimento] = useState('');
  const [editUserFaixa, setEditUserFaixa] = useState('');
  const [editUserWhatsapp, setEditUserWhatsapp] = useState('');
  const [editUserTipo, setEditUserTipo] = useState<UserRole>('professor');
  const [editUserContatoEmergenciaNome, setEditUserContatoEmergenciaNome] = useState('');
  const [editUserContatoEmergenciaTelefone, setEditUserContatoEmergenciaTelefone] = useState('');

  const handleStartEditUser = (user: User) => {
    setUserToEdit(user);
    setEditUserNome(user.nome || '');
    setEditUserEmail(user.email || '');
    setEditUserCpf(user.cpf || '');
    setEditUserDataNascimento(user.dataNascimento || '');
    setEditUserFaixa(user.faixa || 'Faixa Preta');
    setEditUserWhatsapp(user.whatsapp || '');
    setEditUserTipo(user.tipo || 'professor');
    setEditUserContatoEmergenciaNome(user.contatoEmergenciaNome || '');
    setEditUserContatoEmergenciaTelefone(user.contatoEmergenciaTelefone || '');
  };

  const handleStartEdit = (aluno: Student) => {
    setStudentToEdit(aluno);
    setEditNome(aluno.nome || '');
    setEditCpf(aluno.cpf || '');
    setEditDataNascimento(aluno.dataNascimento || '');
    setEditFaixa(aluno.faixa || 'Branca');
    setEditWhatsapp(aluno.whatsapp || '');
    setEditDataInicioTreino(aluno.dataInicioTreino || '');
    setEditContatoEmergenciaNome(aluno.contatoEmergenciaNome || '');
    setEditContatoEmergenciaTelefone(aluno.contatoEmergenciaTelefone || '');
    setEditProfId(aluno.professorResponsavelId || '');
    setEditProfNome(aluno.professorResponsavelNome || '');

    const matchedUser = usuarios.find((u) => {
      if (aluno.usuarioId != null && Number(u.id) === Number(aluno.usuarioId)) return true;
      if (Number(u.id) === Number(aluno.id)) return true;
      if (aluno.cpf && u.cpf && u.cpf.replace(/\D/g, '') === aluno.cpf.replace(/\D/g, '')) return true;
      if (aluno.email && u.email && u.email.trim().toLowerCase() === aluno.email.trim().toLowerCase()) return true;
      return false;
    });
    setEditStudentTipo((matchedUser?.tipo as UserRole) || (aluno as any).tipo || 'aluno');
  };

  // Independent Filters
  const [searchAluno, setSearchAluno] = useState('');
  const [statusAlunoFilter, setStatusAlunoFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [searchProf, setSearchProf] = useState('');
  const [statusProfFilter, setStatusProfFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [searchInstr, setSearchInstr] = useState('');
  const [statusInstrFilter, setStatusInstrFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Helper for WhatsApp URL
  const getWhatsAppUrl = (phone?: string) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    const fullDigits = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${fullDigits}`;
  };

  // STRICT PROFILE DISTRIBUTION
  // 1. Quadro de Alunos: ONLY show approved student records where the linked user profile is 'aluno' or unlinked
  const competidoresAlunos = alunos.filter((a) => {
    let matchedUser: User | undefined;
    if (a.usuarioId != null) {
      matchedUser = usuarios.find((u) => Number(u.id) === Number(a.usuarioId));
    }

    if (matchedUser) {
      if (matchedUser.aprovado === false) return false; // REGRA 1: Pending (unapproved) users must NOT appear in Gestão de Cadastrados!
      if (matchedUser.tipo === 'professor' || matchedUser.tipo === 'admin' || matchedUser.tipo === 'instrutor') {
        return false; // User has teacher/instructor/admin profile, exclude from Alunos
      }
    }

    // For Professors and Instructors: only show their own linked students
    if (currentUser && currentUser.tipo !== 'admin') {
      const isProfResp =
        a.professorResponsavelId === currentUser.id ||
        (a as any).professorId === currentUser.id ||
        (Boolean(a.professorResponsavelNome) && Boolean(currentUser.nome) && a.professorResponsavelNome!.trim().toLowerCase() === currentUser.nome.trim().toLowerCase());

      if (!isProfResp) {
        return false;
      }
    }

    return true;
  });

  const filteredAlunos = competidoresAlunos.filter((a) => {
    const term = searchAluno.toLowerCase();
    const matchesTerm =
      a.nome.toLowerCase().includes(term) ||
      a.faixa.toLowerCase().includes(term) ||
      (a.cpf && a.cpf.includes(term));
    const matchesStatus =
      statusAlunoFilter === 'todos' ||
      (statusAlunoFilter === 'ativo' && a.ativo) ||
      (statusAlunoFilter === 'inativo' && !a.ativo);
    return matchesTerm && matchesStatus;
  });

  // 2. Quadro de Professores: ONLY approved users registered as professor or admin
  const profList = usuarios.filter((u) => {
    if (u.tipo !== 'professor' && u.tipo !== 'admin') return false;
    // Exclude explicitly unapproved accounts from Gestão
    if (u.aprovado === false) return false;

    // EXCEÇÃO ESPECÍFICA REGRA 2: Na tela Gestão de Cadastro dentro do Quadro de Professores, a conta YURI CRUZ / URI CRUZ NÃO deverá aparecer.
    const isUriCruz =
      u.email === 'uricruz@gmail.com' ||
      u.email === 'smerelatorios@gmail.com' ||
      u.email === 'admin@admin.com' ||
      u.nome.toUpperCase().includes('YURI CRUZ') ||
      u.nome.toUpperCase().includes('URI CRUZ') ||
      u.nome.toUpperCase().includes('ADMINISTRADOR') ||
      u.tipo === 'admin';
    if (isUriCruz) return false;

    // For Professors and Instructors: never show ADMINISTRADOR accounts, and only show their own profile
    if (currentUser && currentUser.tipo !== 'admin') {
      if (u.id !== currentUser.id) {
        return false;
      }
    }
    return true;
  });

  const filteredProfs = profList.filter((p) => {
    const term = searchProf.toLowerCase();
    const matchesTerm =
      p.nome.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.faixa && p.faixa.toLowerCase().includes(term));
    const matchesStatus =
      statusProfFilter === 'todos' ||
      (statusProfFilter === 'ativo' && p.aprovado !== false) ||
      (statusProfFilter === 'inativo' && p.aprovado === false);
    return matchesTerm && matchesStatus;
  });

  // 3. Quadro de Instrutores: ONLY approved users registered as instrutor
  const instrList = usuarios.filter((u) => {
    if (u.tipo !== 'instrutor') return false;
    // Exclude explicitly unapproved accounts from Gestão
    if (u.aprovado === false) return false;

    // For Professors and Instructors: only show their own profile
    if (currentUser && currentUser.tipo !== 'admin') {
      if (u.id !== currentUser.id) {
        return false;
      }
    }
    return true;
  });
  const filteredInstrs = instrList.filter((i) => {
    const term = searchInstr.toLowerCase();
    const matchesTerm =
      i.nome.toLowerCase().includes(term) ||
      i.email.toLowerCase().includes(term) ||
      (i.faixa && i.faixa.toLowerCase().includes(term));
    const matchesStatus =
      statusInstrFilter === 'todos' ||
      (statusInstrFilter === 'ativo' && i.aprovado !== false) ||
      (statusInstrFilter === 'inativo' && i.aprovado === false);
    return matchesTerm && matchesStatus;
  });

  // Metrics calculation
  const totalAlunosAtivos = competidoresAlunos.filter((a) => a.ativo).length;
  const totalAlunosInativos = competidoresAlunos.filter((a) => !a.ativo).length;
  const totalAlunosEvasao = competidoresAlunos.filter((a) => (a.checkins?.length || 0) < 2).length;
  const totalAlunosPendentes = competidoresAlunos.filter((a) => !a.ativo).length;

  const totalProfsAtivos = profList.filter((p) => p.aprovado !== false).length;
  const totalProfsInativos = profList.filter((p) => p.aprovado === false).length;

  const totalInstrsAtivos = instrList.filter((i) => i.aprovado !== false).length;
  const totalInstrsInativos = instrList.filter((i) => i.aprovado === false).length;

  const getFaixaBadgeColor = (faixaStr: string) => {
    switch ((faixaStr || '').toLowerCase()) {
      case 'branca':
      case 'faixa branca':
        return 'bg-white text-black border border-neutral-400';
      case 'azul':
      case 'faixa azul':
        return 'bg-blue-600 text-white';
      case 'roxa':
      case 'faixa roxa':
        return 'bg-purple-600 text-white';
      case 'marrom':
      case 'faixa marrom':
        return 'bg-amber-900 text-white';
      case 'preta':
      case 'faixa preta':
        return 'bg-neutral-950 text-red-500 border border-red-500';
      default:
        return 'bg-orange-600 text-white';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER DAS SEÇÕES E MÓDULO */}
      <div className="bg-[#141414] p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Gestão de Cadastrados
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gerenciamento unificado isolado por perfis oficiais do sistema (Alunos, Professores e Instrutores).
            </p>
          </div>

          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            RBAC Sincronizado
          </span>
        </div>

        {resetSuccessMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{resetSuccessMessage}</span>
            </div>
            <button
              onClick={() => setResetSuccessMessage(null)}
              className="text-emerald-400 hover:text-white text-xs font-black cursor-pointer ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* SUB-TABS SELECTOR FOR THE 3 QUADROS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveQuadro('alunos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap border ${
              activeQuadro === 'alunos'
                ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/20'
                : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border-neutral-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Quadro de Alunos ({competidoresAlunos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQuadro('professores')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap border ${
              activeQuadro === 'professores'
                ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/20'
                : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border-neutral-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Quadro de Professores ({profList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQuadro('instrutores')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap border ${
              activeQuadro === 'instrutores'
                ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/20'
                : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border-neutral-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Quadro de Instrutores ({instrList.length})</span>
          </button>
        </div>
      </div>

      {/* 1. QUADRO DE ALUNOS */}
      {activeQuadro === 'alunos' && (
        <div className="bg-[#141414] p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-6">
          {/* INDICADORES INDIVIDUAIS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Ativos</span>
              <span className="text-xl font-black text-emerald-400 block">{totalAlunosAtivos}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Inativos</span>
              <span className="text-xl font-black text-red-400 block">{totalAlunosInativos}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Matriculados</span>
              <span className="text-xl font-black text-white block">{competidoresAlunos.length}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Risco Evasão</span>
              <span className="text-xl font-black text-amber-400 block">{totalAlunosEvasao}</span>
            </div>
          </div>

          {/* FILTROS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-900">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3.5 text-neutral-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, faixa, CPF..."
                value={searchAluno}
                onChange={(e) => setSearchAluno(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-orange-500 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusAlunoFilter}
                onChange={(e) => setStatusAlunoFilter(e.target.value as any)}
                className="bg-[#1a1a1a] text-neutral-300 font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Somente Ativos</option>
                <option value="inativo">Somente Inativos</option>
              </select>
            </div>
          </div>

          {/* LISTA DE ALUNOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlunos.length > 0 ? (
              filteredAlunos.map((aluno) => {
                const matchedUser = usuarios.find((u) => {
                  if (aluno.usuarioId && Number(u.id) === Number(aluno.usuarioId)) return true;
                  if (aluno.cpf && u.cpf && !aluno.cpf.startsWith('INF-') && !u.cpf.startsWith('INF-') && aluno.cpf.replace(/\D/g, '') === u.cpf.replace(/\D/g, '')) return true;
                  return false;
                });

                const emailDisplay = matchedUser?.email || 'Sem e-mail';
                const phoneDisplay = aluno.whatsapp || matchedUser?.whatsapp || '';
                const waUrl = getWhatsAppUrl(phoneDisplay);
                const isAdminAccount = matchedUser?.tipo === 'admin' || matchedUser?.email === 'admin@admin.com';

                return (
                  <div
                    key={aluno.id}
                    className="bg-[#1a1a1a] p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 hover:border-neutral-700 transition shadow-sm text-left"
                  >
                    {/* 1. Nome & Badge Perfil & Avatar */}
                    <div className="flex items-center gap-3">
                      {aluno.fotoPerfil ? (
                        <img
                          src={aluno.fotoPerfil}
                          alt={aluno.nome}
                          className="w-12 h-12 rounded-full object-cover border-2 border-neutral-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-sm font-black text-neutral-400 shrink-0 uppercase">
                          {aluno.nome.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-white text-sm truncate">{aluno.nome}</h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isAdminAccount ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                              Mestre / Admin
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Competidor
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getFaixaBadgeColor(aluno.faixa)}`}>
                            {aluno.faixa}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Status Acesso & CPF */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-850">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold block">Status Acesso</span>
                        <span className={`font-bold ${aluno.ativo ? 'text-emerald-400' : 'text-red-400'}`}>
                          {aluno.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold block">CPF</span>
                        {aluno.cpf?.startsWith('INF-') || aluno.isCpfProvisorio ? (
                          <span className="font-mono text-amber-300 text-[11px] font-bold truncate flex items-center gap-1" title="Identificador Provisório (IIP)">
                            <span>{aluno.cpf}</span>
                            <span className="bg-amber-500/20 text-amber-400 text-[8px] px-1 py-0.2 rounded border border-amber-500/30">IIP Provisório</span>
                          </span>
                        ) : (
                          <span className="font-mono text-neutral-300 text-[11px] truncate block">{aluno.cpf || 'Não cadastrado'}</span>
                        )}
                      </div>
                    </div>

                    {/* 3. Contatos: Telefone (Esquerda com WhatsApp) & E-mail (Direita) */}
                    <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-850/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          Telefone / WA
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white text-[11px] truncate">{phoneDisplay || 'N/A'}</span>
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition shrink-0"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="p-1 rounded-md bg-neutral-900 text-neutral-600 shrink-0 cursor-not-allowed" title="Sem WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-400" />
                          E-mail
                        </span>
                        <span className="font-mono text-neutral-300 text-[11px] truncate block" title={emailDisplay}>
                          {emailDisplay}
                        </span>
                      </div>
                    </div>

                    {/* RESPONSÁVEL LEGAL (SE HOUVER E FOR MENOR DE IDADE) */}
                    {(() => {
                      const isStudentMinor = (aluno.cpf && aluno.cpf.startsWith('INF-')) || aluno.isCpfProvisorio || !isAdultPerson({
                        dataNascimento: aluno.dataNascimento || matchedUser?.dataNascimento,
                        cpf: aluno.cpf || matchedUser?.cpf,
                        tipo: matchedUser?.tipo || 'aluno',
                      });
                      const respNome = isStudentMinor ? (aluno.responsavelNome || matchedUser?.responsavelNome) : undefined;
                      if (!isStudentMinor || !respNome) return null;

                      const respCpf = aluno.responsavelCpf || matchedUser?.responsavelCpf;
                      const respTel = aluno.responsavelTelefone || matchedUser?.responsavelTelefone;
                      const respEmail = aluno.responsavelEmail || matchedUser?.responsavelEmail;

                      return (
                        <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/25 text-[11px] text-amber-300 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">Responsável Legal</span>
                          <p className="font-extrabold text-white truncate">{respNome}</p>
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] text-neutral-300 font-mono">
                            {respCpf && <span>CPF: {respCpf}</span>}
                            {respTel && <span>Tel: {respTel}</span>}
                            {respEmail && <span className="col-span-2 text-neutral-400 truncate">Email: {respEmail}</span>}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. Action buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-900/60 flex-wrap">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(aluno)}
                          className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 cursor-pointer transition whitespace-nowrap"
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(aluno.id)}
                        className={`flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                          aluno.ativo
                            ? 'bg-red-500/15 hover:bg-red-600/20 text-red-400 border border-red-500/10'
                            : 'bg-emerald-500/15 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/10'
                        }`}
                      >
                        {aluno.ativo ? 'Desativar' : 'Ativar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetTarget({ id: aluno.id, nome: aluno.nome, isAluno: true, tipoLabel: 'Aluno' });
                          setResetPassword('');
                          setResetType('manual');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-orange-500 text-neutral-300 hover:text-white border border-neutral-700 hover:border-orange-500 cursor-pointer transition whitespace-nowrap"
                        title="Reset Manual de Senha"
                      >
                        <Key className="w-3 h-3 text-orange-400" />
                        Reset Senha
                      </button>

                      {!isAdminAccount && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ id: aluno.id, nome: aluno.nome, tipoEntidade: 'aluno' });
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/20 cursor-pointer transition whitespace-nowrap"
                          title="Excluir Cadastro"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-neutral-500 text-xs italic">
                Nenhum aluno encontrado no Quadro de Alunos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. QUADRO DE PROFESSORES */}
      {activeQuadro === 'professores' && (
        <div className="bg-[#141414] p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-6">
          {/* INDICADORES */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Total Professores</span>
              <span className="text-xl font-black text-white block">{profList.length}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Ativos / Aprovados</span>
              <span className="text-xl font-black text-emerald-400 block">{totalProfsAtivos}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">Inativos / Pendentes</span>
              <span className="text-xl font-black text-red-400 block">{totalProfsInativos}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Turmas Vinculadas</span>
              <span className="text-xl font-black text-orange-400 block">Todas as Turmas</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Modalidades</span>
              <span className="text-xl font-black text-amber-400 block">Jiu-Jitsu</span>
            </div>
          </div>

          {/* FILTROS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-900">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3.5 text-neutral-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar professor por nome, e-mail..."
                value={searchProf}
                onChange={(e) => setSearchProf(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-orange-500 outline-none transition"
              />
            </div>

            <select
              value={statusProfFilter}
              onChange={(e) => setStatusProfFilter(e.target.value as any)}
              className="bg-[#1a1a1a] text-neutral-300 font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Somente Aprovados</option>
              <option value="inativo">Somente Pendentes/Inativos</option>
            </select>
          </div>

          {/* LISTA DE PROFESSORES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfs.length > 0 ? (
              filteredProfs.map((prof) => {
                const isAdminAccount = prof.tipo === 'admin' || prof.email === 'admin@admin.com';
                const waUrl = getWhatsAppUrl(prof.whatsapp);

                return (
                  <div key={prof.id} className="bg-[#1a1a1a] p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 hover:border-neutral-700 transition shadow-sm text-left">
                    {/* 1. Nome & Perfil Badge & Avatar */}
                    <div className="flex items-center gap-3">
                      {prof.fotoPerfil ? (
                        <img
                          src={prof.fotoPerfil}
                          alt={prof.nome}
                          className="w-12 h-12 rounded-full object-cover border-2 border-neutral-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base shrink-0 uppercase border-2 ${
                          isAdminAccount
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        }`}>
                          {prof.nome.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-white text-sm truncate">{prof.nome}</h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isAdminAccount ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                              Mestre / Admin
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              Mestre / Professor
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getFaixaBadgeColor(prof.faixa || 'Faixa Preta')}`}>
                            {prof.faixa || 'Faixa Preta'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Status Acesso & Funçao */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-850">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold block">Status Acesso</span>
                        <span className={`font-bold ${prof.aprovado ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {prof.aprovado ? 'Aprovado' : 'Pendente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold block">Perfil Sistema</span>
                        <span className="font-bold text-white text-[11px] capitalize">{isAdminAccount ? 'Admin Principal' : prof.tipo}</span>
                      </div>
                    </div>

                    {/* 3. Contatos: Telefone (Esquerda com WhatsApp) & E-mail (Direita) */}
                    <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-850/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          Telefone / WA
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white text-[11px] truncate">{prof.whatsapp || 'N/A'}</span>
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition shrink-0"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="p-1 rounded-md bg-neutral-900 text-neutral-600 shrink-0 cursor-not-allowed" title="Sem WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-400" />
                          E-mail
                        </span>
                        <span className="font-mono text-neutral-300 text-[11px] truncate block" title={prof.email}>
                          {prof.email}
                        </span>
                      </div>
                    </div>

                    {/* 4. Action buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-900/60 flex-wrap">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleStartEditUser(prof)}
                          className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 cursor-pointer transition whitespace-nowrap"
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                      )}

                      {onAprovarUsuario && (
                        <button
                          type="button"
                          onClick={() => onAprovarUsuario(prof.id)}
                          className={`flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                            prof.aprovado
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20'
                          }`}
                        >
                          {prof.aprovado ? 'Aprovado' : 'Aprovar'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setResetTarget({ id: prof.id, nome: prof.nome, isAluno: false, tipoLabel: 'Professor' });
                          setResetPassword('');
                          setResetType('manual');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-orange-500 text-neutral-300 hover:text-white border border-neutral-700 hover:border-orange-500 cursor-pointer transition whitespace-nowrap"
                      >
                        <Key className="w-3 h-3 text-orange-400" />
                        Reset Senha
                      </button>

                      {!isAdminAccount && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ id: prof.id, nome: prof.nome, tipoEntidade: 'usuario' });
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/20 cursor-pointer transition whitespace-nowrap"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-neutral-500 text-xs italic">
                Nenhum mestre ou professor cadastrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. QUADRO DE INSTRUTORES */}
      {activeQuadro === 'instrutores' && (
        <div className="bg-[#141414] p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-md space-y-6">
          {/* INDICADORES */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Total Instrutores</span>
              <span className="text-xl font-black text-white block">{instrList.length}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Ativos / Aprovados</span>
              <span className="text-xl font-black text-emerald-400 block">{totalInstrsAtivos}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">Inativos / Pendentes</span>
              <span className="text-xl font-black text-red-400 block">{totalInstrsInativos}</span>
            </div>
            <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Turmas Auxiliares</span>
              <span className="text-xl font-black text-orange-400 block">Infantil / Iniciantes</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Especialidades</span>
              <span className="text-xl font-black text-amber-400 block">Fundamentos</span>
            </div>
          </div>

          {/* FILTROS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-900">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3.5 text-neutral-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar instrutor por nome, e-mail..."
                value={searchInstr}
                onChange={(e) => setSearchInstr(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-orange-500 outline-none transition"
              />
            </div>

            <select
              value={statusInstrFilter}
              onChange={(e) => setStatusInstrFilter(e.target.value as any)}
              className="bg-[#1a1a1a] text-neutral-300 font-bold text-xs py-2 px-3 rounded-xl border border-neutral-800 outline-none cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Somente Aprovados</option>
              <option value="inativo">Somente Pendentes/Inativos</option>
            </select>
          </div>

          {/* LISTA DE INSTRUTORES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstrs.length > 0 ? (
              filteredInstrs.map((instr) => {
                const isAdminAccount = instr.tipo === 'admin' || instr.email === 'admin@admin.com';
                const waUrl = getWhatsAppUrl(instr.whatsapp);

                return (
                  <div key={instr.id} className="bg-[#1a1a1a] p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 hover:border-neutral-700 transition shadow-sm text-left">
                    {/* 1. Nome & Perfil Badge & Avatar */}
                    <div className="flex items-center gap-3">
                      {instr.fotoPerfil ? (
                        <img
                          src={instr.fotoPerfil}
                          alt={instr.nome}
                          className="w-12 h-12 rounded-full object-cover border-2 border-neutral-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base shrink-0 uppercase">
                          {instr.nome.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-white text-sm truncate">{instr.nome}</h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isAdminAccount ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                              Mestre / Admin
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Instrutor
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getFaixaBadgeColor(instr.faixa || 'Faixa Marrom')}`}>
                            {instr.faixa || 'Faixa Marrom'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Status Acesso & Função */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-850">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold block">Status Acesso</span>
                        <span className={`font-bold ${instr.aprovado ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {instr.aprovado ? 'Aprovado' : 'Pendente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold block">Função</span>
                        <span className="font-bold text-white text-[11px]">Auxiliar / Instrutor</span>
                      </div>
                    </div>

                    {/* 3. Contatos: Telefone (Esquerda com WhatsApp) & E-mail (Direita) */}
                    <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-850/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          Telefone / WA
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white text-[11px] truncate">{instr.whatsapp || 'N/A'}</span>
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition shrink-0"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="p-1 rounded-md bg-neutral-900 text-neutral-600 shrink-0 cursor-not-allowed" title="Sem WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-400" />
                          E-mail
                        </span>
                        <span className="font-mono text-neutral-300 text-[11px] truncate block" title={instr.email}>
                          {instr.email}
                        </span>
                      </div>
                    </div>

                    {/* 4. Action buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-900/60 flex-wrap">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleStartEditUser(instr)}
                          className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 cursor-pointer transition whitespace-nowrap"
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                      )}

                      {onAprovarUsuario && (
                        <button
                          type="button"
                          onClick={() => onAprovarUsuario(instr.id)}
                          className={`flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                            instr.aprovado
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20'
                          }`}
                        >
                          {instr.aprovado ? 'Aprovado' : 'Aprovar'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setResetTarget({ id: instr.id, nome: instr.nome, isAluno: false, tipoLabel: 'Instrutor' });
                          setResetPassword('');
                          setResetType('manual');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-orange-500 text-neutral-300 hover:text-white border border-neutral-700 hover:border-orange-500 cursor-pointer transition whitespace-nowrap"
                      >
                        <Key className="w-3 h-3 text-orange-400" />
                        Reset Senha
                      </button>

                      {!isAdminAccount && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ id: instr.id, nome: instr.nome, tipoEntidade: 'usuario' });
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/20 cursor-pointer transition whitespace-nowrap"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-neutral-500 text-xs italic">
                Nenhum instrutor cadastrado no Quadro de Instrutores.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Confirmar Exclusão de Cadastro</h3>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <p className="font-semibold text-white">
                Deseja realmente excluir este cadastro (<strong className="text-orange-400">{deleteTarget.nome}</strong>)?
              </p>
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-1 text-neutral-400">
                <p className="text-[11px]">• O usuário será removido permanentemente da plataforma;</p>
                <p className="text-[11px]">• Seus vínculos de presença, turmas e histórico poderão ser afetados;</p>
                <p className="text-[11px]">• A ação poderá ser irreversível, conforme as regras do sistema.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  // Guard against deleting admin account
                  if (deleteTarget.tipoEntidade === 'usuario') {
                    const targetUser = usuarios.find((u) => u.id === deleteTarget.id);
                    if (targetUser?.tipo === 'admin' || targetUser?.email === 'admin@admin.com') {
                      alert('A conta administradora é a conta base da plataforma e não pode ser excluída.');
                      setDeleteTarget(null);
                      return;
                    }
                  }

                  if (deleteTarget.tipoEntidade === 'aluno') {
                    const targetStudent = alunos.find((a) => a.id === deleteTarget.id);
                    const targetUser = usuarios.find((u) => u.id === targetStudent?.usuarioId);
                    if (targetUser?.tipo === 'admin' || targetUser?.email === 'admin@admin.com') {
                      alert('A conta administradora é a conta base da plataforma e não pode ser excluída.');
                      setDeleteTarget(null);
                      return;
                    }
                    onDeletarAluno(deleteTarget.id);
                  } else if (onDeletarUsuario) {
                    onDeletarUsuario(deleteTarget.id);
                  }

                  if (onAddAuditLog) {
                    onAddAuditLog(
                      'EXCLUSAO',
                      'Gestão de Cadastrados',
                      `Exclusão do cadastro de ${deleteTarget.nome}`
                    );
                  }
                  setDeleteTarget(null);
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/20 cursor-pointer transition"
              >
                Excluir Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET MANUAL DE SENHA */}
      {resetTarget !== null && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
              <div className="flex items-center gap-2 text-orange-500">
                <Key className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Reset de Senha — {resetTarget.nome}
                </h3>
              </div>
              {resetTarget.tipoLabel && (
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 uppercase">
                  {resetTarget.tipoLabel}
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Informe a nova senha de acesso ou utilize a senha padrão da plataforma (<strong className="text-white">1234567</strong>).
            </p>

            <div className="space-y-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-850">
              <div className="flex justify-between items-center gap-2">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Nova Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetPassword('1234567');
                    setResetType('padrao');
                  }}
                  className="text-[10px] font-extrabold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/20 transition cursor-pointer flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  Usar Senha Padrão (1234567)
                </button>
              </div>

              <input
                type="text"
                placeholder="Digite a nova senha..."
                value={resetPassword}
                onChange={(e) => {
                  setResetPassword(e.target.value);
                  setResetType(e.target.value === '1234567' ? 'padrao' : 'manual');
                }}
                className="w-full bg-[#1a1a1a] text-white font-mono text-xs py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-orange-500 transition"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => {
                  setResetTarget(null);
                  setResetPassword('');
                }}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!resetPassword.trim()) {
                    alert('Por favor, informe a nova senha ou clique em "Usar Senha Padrão".');
                    return;
                  }

                  const newPass = resetPassword.trim();
                  if (resetTarget.isAluno && onChangePassword) {
                    onChangePassword(resetTarget.id, newPass);
                  }
                  if (onChangeUserPassword) {
                    onChangeUserPassword(resetTarget.id, newPass);
                  }

                  if (onAddAuditLog) {
                    onAddAuditLog(
                      'ATUALIZACAO',
                      'Reset de Senha',
                      `Reset de senha para ${resetTarget.nome} (${resetTarget.tipoLabel || 'Usuário'}) (Tipo: ${resetType === 'padrao' ? 'Padrão 1234567' : 'Personalizada'})`
                    );
                  }

                  const msg = `✓ Senha de ${resetTarget.nome} (${resetTarget.tipoLabel || 'Usuário'}) redefinida com sucesso (${resetType === 'padrao' ? 'Senha Padrão: 1234567' : 'Senha Personalizada'})!`;
                  setResetSuccessMessage(msg);
                  setTimeout(() => setResetSuccessMessage(null), 5000);

                  setResetTarget(null);
                  setResetPassword('');
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-orange-600/20 cursor-pointer transition"
              >
                Confirmar Redefinição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL DO ATLETA (ADMIN ONLY) */}
      {studentToEdit !== null && (() => {
        const currentIsProvisorio = studentToEdit.cpf?.startsWith('INF-') || studentToEdit.isCpfProvisorio;
        const newCpfTrim = editCpf.trim();
        const cleanedNewCpf = newCpfTrim.replace(/\D/g, '');

        const studentAge = (() => {
          if (!editDataNascimento) return 99;
          const bDate = new Date(editDataNascimento);
          if (isNaN(bDate.getTime())) return 99;
          const today = new Date();
          let age = today.getFullYear() - bDate.getFullYear();
          const m = today.getMonth() - bDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
          return age;
        })();
        const isStudentMinor = studentAge < 18 && studentAge >= 0;
        const isEditingWithProvisorio = newCpfTrim.toUpperCase().startsWith('INF-') || (currentIsProvisorio && cleanedNewCpf.length < 11);
        const isMinorProvisorio = isStudentMinor && isEditingWithProvisorio;

        let studentCpfError = '';
        if (!currentIsProvisorio && newCpfTrim.toUpperCase().startsWith('INF-')) {
          studentCpfError = 'Regra do Sistema: Não é permitido substituir um CPF oficial por um identificador provisório.';
        } else if (cleanedNewCpf.length > 0 && !newCpfTrim.toUpperCase().startsWith('INF-')) {
          if (cleanedNewCpf.length < 11) {
            studentCpfError = 'CPF incompleto! Digite os 11 dígitos do CPF.';
          } else if (!validarCPF(cleanedNewCpf)) {
            studentCpfError = 'CPF inválido! Digite um CPF válido com 11 dígitos e verificadores corretos.';
          } else if (!isStudentMinor) {
            const duplicateCpf =
              alunos.some((a) => Number(a.id) !== Number(studentToEdit.id) && isAdultPerson(a) && a.cpf && !a.cpf.startsWith('INF-') && a.cpf.replace(/\D/g, '') === cleanedNewCpf) ||
              usuarios.some((u) => Number(u.id) !== Number(studentToEdit.usuarioId) && isAdultPerson(u) && u.cpf && !u.cpf.startsWith('INF-') && u.cpf.replace(/\D/g, '') === cleanedNewCpf);
            if (duplicateCpf) {
              studentCpfError = 'Este CPF oficial já está cadastrado para outro usuário no sistema!';
            }
          }
        }

        const isPhoneEqual = Boolean(editWhatsapp && editContatoEmergenciaTelefone && editWhatsapp.replace(/\D/g, '') === editContatoEmergenciaTelefone.replace(/\D/g, ''));
        const showEmergencyError = !isMinorProvisorio && isPhoneEqual;

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141414] rounded-3xl p-6 max-w-xl w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left my-8">
              <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wider text-orange-500 flex items-center gap-2">
                <Shield className="w-5.5 h-5.5 text-orange-500" />
                Editar Ficha do Competidor
              </h3>
              <p className="text-neutral-400 text-xs mb-3">
                Altere os dados cadastrais, técnicos e de contato de <strong className="text-white">{studentToEdit.nome}</strong>.
              </p>

              {(studentToEdit.cpf?.startsWith('INF-') || studentToEdit.isCpfProvisorio) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1 mb-4 text-left">
                  <div className="flex items-center gap-2 font-bold uppercase text-[11px] text-amber-400">
                    <Shield className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Atleta com Identificador Provisório ({studentToEdit.cpf})</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Assim que o atleta obtiver seu CPF oficial, digite o número no campo CPF abaixo para substituir o identificador provisório sem perda de dados ou histórico.
                  </p>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editNome.trim()) {
                    alert('Por favor, informe o nome do aluno.');
                    return;
                  }

                  if (studentCpfError || showEmergencyError) {
                    return;
                  }

                  if (isStudentMinor && !isEditingWithProvisorio) {
                    if (!editContatoEmergenciaNome.trim() || !editContatoEmergenciaTelefone.trim()) {
                      alert('Para alunos menores de idade com CPF oficial, o Contato de Emergência (Nome e Telefone) é obrigatório!');
                      return;
                    }
                  }

                  let updatedIsProvisorio = studentToEdit.isCpfProvisorio;
                  let updatedSubstitutedEm = studentToEdit.cpfProvisorioSubstituidoEm;
                  let updatedSubstitutedPor = studentToEdit.cpfProvisorioSubstituidoPor;
                  let updatedAnterior = studentToEdit.cpfProvisorioAnterior || studentToEdit.cpf;

                  if (currentIsProvisorio && newCpfTrim && !newCpfTrim.toUpperCase().startsWith('INF-') && !newCpfTrim.toUpperCase().startsWith('IIP-') && cleanedNewCpf.length === 11) {
                    updatedIsProvisorio = false;
                    updatedSubstitutedEm = new Date().toISOString();
                    updatedSubstitutedPor = 'Mestre/Admin';
                    updatedAnterior = studentToEdit.cpf;

                    if (onAddAuditLog) {
                      onAddAuditLog(
                        'ATUALIZACAO',
                        'Substituição CPF Provisório',
                        `Substituição do CPF Provisório (${studentToEdit.cpf}) pelo CPF Oficial (${editCpf}) do aluno ${studentToEdit.nome}`
                      );
                    }
                  }

                  const finalUpperNome = editNome.trim().toUpperCase();

                  if (onUpdateAluno) {
                    onUpdateAluno(studentToEdit.id, {
                      nome: finalUpperNome,
                      cpf: editCpf.trim(),
                      dataNascimento: editDataNascimento,
                      isCpfProvisorio: updatedIsProvisorio,
                      cpfProvisorioSubstituidoEm: updatedSubstitutedEm,
                      cpfProvisorioSubstituidoPor: updatedSubstitutedPor,
                      cpfProvisorioAnterior: updatedAnterior,
                      faixa: editFaixa,
                      tipo: editStudentTipo,
                      whatsapp: editWhatsapp.trim(),
                      dataInicioTreino: editDataInicioTreino,
                      contatoEmergenciaNome: editContatoEmergenciaNome.trim().toUpperCase(),
                      contatoEmergenciaTelefone: editContatoEmergenciaTelefone.trim(),
                      professorResponsavelId: editProfId ? Number(editProfId) : null,
                      professorResponsavelNome: editProfNome || '',
                    });
                  }
                  setStudentToEdit(null);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value.toUpperCase())}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-semibold uppercase"
                    />
                  </div>

                  {/* CPF */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">CPF</label>
                    <input
                      type="text"
                      value={editCpf}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.toUpperCase().startsWith('INF-')) {
                          setEditCpf(val.toUpperCase());
                        } else {
                          setEditCpf(maskCPF(val));
                        }
                      }}
                      placeholder="000.000.000-00"
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono ${
                        studentCpfError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                    {studentCpfError && (
                      <p className="text-[11px] text-red-500 font-bold mt-1 bg-red-500/10 border border-red-500/30 p-1.5 rounded-lg leading-snug">
                        {studentCpfError}
                      </p>
                    )}
                  </div>

                  {/* Data de Nascimento */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Data de Nascimento</label>
                    <input
                      type="date"
                      value={editDataNascimento}
                      onChange={(e) => setEditDataNascimento(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                    />
                  </div>

                  {/* Faixa Atual */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">🥋 Faixa Atual</label>
                    <select
                      value={editFaixa.startsWith('Faixa ') ? editFaixa : (editFaixa ? `Faixa ${editFaixa}` : 'Faixa Branca')}
                      onChange={(e) => setEditFaixa(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                    >
                      <option value="Faixa Branca">Faixa Branca</option>
                      <option value="Faixa Cinza">Faixa Cinza</option>
                      <option value="Faixa Amarela">Faixa Amarela</option>
                      <option value="Faixa Laranja">Faixa Laranja</option>
                      <option value="Faixa Verde">Faixa Verde</option>
                      <option value="Faixa Azul">Faixa Azul</option>
                      <option value="Faixa Roxa">Faixa Roxa</option>
                      <option value="Faixa Marrom">Faixa Marrom</option>
                      <option value="Faixa Preta">Faixa Preta</option>
                      <option value="Faixa Preta-Vermelha">Faixa Preta-Vermelha</option>
                      <option value="Faixa Vermelha-Branca">Faixa Vermelha-Branca</option>
                      <option value="Faixa Vermelha">Faixa Vermelha</option>
                    </select>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">WhatsApp</label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => {
                        const newPhone = maskPhone(e.target.value);
                        setEditWhatsapp(newPhone);
                        if (isMinorProvisorio) {
                          setEditContatoEmergenciaTelefone(newPhone);
                        }
                      }}
                      placeholder="(98) 99999-9999"
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono ${
                        showEmergencyError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                  </div>

                  {/* Data Inicio */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Data de Início nos Treinos</label>
                    <input
                      type="date"
                      value={editDataInicioTreino}
                      onChange={(e) => setEditDataInicioTreino(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                    />
                  </div>

                  {/* Professor Responsavel */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Professor / Instrutor Responsável</label>
                    <select
                      value={editProfId}
                      onChange={(e) => {
                        const selectedId = Number(e.target.value) || '';
                        setEditProfId(selectedId);
                        const selectedUser = usuarios.find((u) => u.id === selectedId);
                        setEditProfNome(selectedUser ? selectedUser.nome : '');
                      }}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                    >
                      <option value="">Nenhum (Escolher depois)</option>
                      {usuarios
                        .filter((u) => u.aprovado && (u.tipo === 'professor' || u.tipo === 'instrutor' || u.tipo === 'admin' || u.email === 'admin@admin.com'))
                        .map((p) => {
                          const isUri = p.tipo === 'admin' || p.email === 'admin@admin.com' || p.nome.toLowerCase().includes('admin') || p.nome.toLowerCase().includes('uri cruz') || p.nome.toLowerCase().includes('yuri cruz');
                          return (
                            <option key={p.id} value={p.id}>
                              {isUri ? 'PROFESSOR YURI CRUZ' : `${p.nome} (${p.tipo === 'professor' ? 'Prof.' : 'Instr.'})`}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {/* Emergência Nome */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Contato de Emergência (Nome) {isStudentMinor && !isEditingWithProvisorio ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={editContatoEmergenciaNome}
                      onChange={(e) => setEditContatoEmergenciaNome(e.target.value.toUpperCase())}
                      placeholder="NOME DO PARENTE/AMIGO"
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-semibold uppercase"
                    />
                  </div>

                  {/* Emergência Telefone */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Contato de Emergência (Telefone) {isStudentMinor && !isEditingWithProvisorio ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={editContatoEmergenciaTelefone}
                      onChange={(e) => {
                        const newPhone = maskPhone(e.target.value);
                        setEditContatoEmergenciaTelefone(newPhone);
                        if (isMinorProvisorio) {
                          setEditWhatsapp(newPhone);
                        }
                      }}
                      placeholder="(98) 99999-9999"
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono ${
                        showEmergencyError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                    {showEmergencyError && (
                      <p className="text-[11px] text-red-500 font-bold mt-1.5 bg-red-500/10 border border-red-500/30 p-2 rounded-lg leading-snug">
                        Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato de emergência diferente.
                      </p>
                    )}
                  </div>

                  {/* Perfil de Acesso (Tipo de Usuário) - Somente Admin */}
                  {isAdmin && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                        Perfil de Acesso / Tipo de Cadastro (Restrito a Admins)
                      </label>
                      <select
                        value={editStudentTipo}
                        onChange={(e) => setEditStudentTipo(e.target.value as UserRole)}
                        className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                      >
                        <option value="aluno">Aluno / Competidor</option>
                        <option value="professor">Professor / Mestre</option>
                        <option value="instrutor">Instrutor Auxiliar</option>
                        <option value="admin">Administrador Geral</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-900/60 mt-6">
                  <button
                    type="button"
                    onClick={() => setStudentToEdit(null)}
                    className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer border border-neutral-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(studentCpfError) || showEmergencyError}
                    className={`font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer ${
                      studentCpfError || showEmergencyError
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/15'
                    }`}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL EDITAR PERFIL DO USUÁRIO/PROFESSOR/INSTRUTOR (ADMIN ONLY) */}
      {userToEdit !== null && (() => {
        const cleanedNewCpf = editUserCpf.trim().replace(/\D/g, '');
        const userToEditAge = (() => {
          if (!editUserDataNascimento) return 99;
          const bDate = new Date(editUserDataNascimento);
          if (isNaN(bDate.getTime())) return 99;
          const today = new Date();
          let age = today.getFullYear() - bDate.getFullYear();
          const m = today.getMonth() - bDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
          return age;
        })();
        const isUserMinor = userToEditAge < 18 && userToEditAge >= 0;
        const isUserEditingWithProvisorio = editUserCpf.trim().toUpperCase().startsWith('INF-') || (userToEdit.cpf?.startsWith('INF-') || userToEdit.isCpfProvisorio);
        const isUserMinorProvisorio = isUserMinor && isUserEditingWithProvisorio;

        let userCpfError = '';
        if (cleanedNewCpf.length > 0 && !editUserCpf.trim().toUpperCase().startsWith('INF-')) {
          if (cleanedNewCpf.length < 11) {
            userCpfError = 'CPF incompleto! Digite os 11 dígitos do CPF.';
          } else if (!validarCPF(cleanedNewCpf)) {
            userCpfError = 'CPF inválido! Digite um CPF válido com 11 dígitos e verificadores corretos.';
          } else if (!isUserMinor) {
            const duplicateCpf =
              usuarios.some((u) => Number(u.id) !== Number(userToEdit.id) && isAdultPerson(u) && u.cpf && !u.cpf.startsWith('INF-') && u.cpf.replace(/\D/g, '') === cleanedNewCpf) ||
              alunos.some((a) => Number(a.id) !== Number(userToEdit.id) && isAdultPerson(a) && a.cpf && !a.cpf.startsWith('INF-') && a.cpf.replace(/\D/g, '') === cleanedNewCpf);
            if (duplicateCpf) {
              userCpfError = 'Este CPF já está cadastrado para outro usuário!';
            }
          }
        }

        const isUserPhoneEqual = Boolean(
          editUserWhatsapp && editUserContatoEmergenciaTelefone && editUserWhatsapp.replace(/\D/g, '') === editUserContatoEmergenciaTelefone.replace(/\D/g, '')
        );
        const showUserEmergencyError = !isUserMinorProvisorio && isUserPhoneEqual;

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1200] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141414] rounded-3xl p-6 max-w-lg w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left my-8">
              <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wider text-orange-500 flex items-center gap-2">
                <Shield className="w-5.5 h-5.5 text-orange-500" />
                Editar Cadastro ({userToEdit.tipo.toUpperCase()})
              </h3>
              <p className="text-neutral-400 text-xs mb-4">
                Altere os dados cadastrais e perfil de <strong className="text-white">{userToEdit.nome}</strong>.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editUserNome.trim()) {
                    alert('Por favor, informe o nome.');
                    return;
                  }

                  if (userCpfError || showUserEmergencyError) {
                    return;
                  }

                  if (isUserMinor && !isUserEditingWithProvisorio) {
                    if (!editUserContatoEmergenciaNome.trim() || !editUserContatoEmergenciaTelefone.trim()) {
                      alert('Para menores de idade com CPF oficial, o Contato de Emergência (Nome e Telefone) é obrigatório!');
                      return;
                    }
                  }

                  const finalUpperNome = editUserNome.trim().toUpperCase();

                  const currentUserIsProvisorio = Boolean(userToEdit.cpf?.startsWith('INF-') || userToEdit.cpf?.startsWith('IIP-') || userToEdit.isCpfProvisorio);
                  let updatedUserIsProvisorio = userToEdit.isCpfProvisorio;
                  let updatedUserSubstitutedEm = userToEdit.cpfProvisorioSubstituidoEm;
                  let updatedUserSubstitutedPor = userToEdit.cpfProvisorioSubstituidoPor;
                  let updatedUserAnterior = userToEdit.cpfProvisorioAnterior || userToEdit.cpf;

                  const editUserCpfTrim = editUserCpf.trim();
                  if (currentUserIsProvisorio && editUserCpfTrim && !editUserCpfTrim.toUpperCase().startsWith('INF-') && !editUserCpfTrim.toUpperCase().startsWith('IIP-') && cleanedNewCpf.length === 11) {
                    updatedUserIsProvisorio = false;
                    updatedUserSubstitutedEm = new Date().toISOString();
                    updatedUserSubstitutedPor = 'Mestre/Admin';
                    updatedUserAnterior = userToEdit.cpf;
                    if (onAddAuditLog) {
                      onAddAuditLog(
                        'ATUALIZACAO',
                        'Substituição CPF Provisório',
                        `Substituição do CPF Provisório (${userToEdit.cpf}) pelo CPF Oficial (${editUserCpf}) do usuário ${userToEdit.nome}`
                      );
                    }
                  }

                  if (onUpdateUsuario) {
                    onUpdateUsuario(userToEdit.id, {
                      nome: finalUpperNome,
                      email: editUserEmail.trim().toLowerCase(),
                      cpf: editUserCpf.trim(),
                      isCpfProvisorio: updatedUserIsProvisorio,
                      cpfProvisorioSubstituidoEm: updatedUserSubstitutedEm,
                      cpfProvisorioSubstituidoPor: updatedUserSubstitutedPor,
                      cpfProvisorioAnterior: updatedUserAnterior,
                      dataNascimento: editUserDataNascimento,
                      whatsapp: editUserWhatsapp.trim(),
                      faixa: editUserFaixa,
                      tipo: editUserTipo,
                      contatoEmergenciaNome: editUserContatoEmergenciaNome.trim().toUpperCase(),
                      contatoEmergenciaTelefone: editUserContatoEmergenciaTelefone.trim(),
                    });
                  } else if (onUpdateAluno) {
                    onUpdateAluno(userToEdit.id, {
                      nome: finalUpperNome,
                      email: editUserEmail.trim().toLowerCase(),
                      cpf: editUserCpf.trim(),
                      isCpfProvisorio: updatedUserIsProvisorio,
                      cpfProvisorioSubstituidoEm: updatedUserSubstitutedEm,
                      cpfProvisorioSubstituidoPor: updatedUserSubstitutedPor,
                      cpfProvisorioAnterior: updatedUserAnterior,
                      dataNascimento: editUserDataNascimento,
                      whatsapp: editUserWhatsapp.trim(),
                      faixa: editUserFaixa,
                      contatoEmergenciaNome: editUserContatoEmergenciaNome.trim().toUpperCase(),
                      contatoEmergenciaTelefone: editUserContatoEmergenciaTelefone.trim(),
                    });
                  }
                  setUserToEdit(null);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={editUserNome}
                    onChange={(e) => setEditUserNome(e.target.value.toUpperCase())}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-semibold uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">E-mail</label>
                    <input
                      type="email"
                      required
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">CPF</label>
                    <input
                      type="text"
                      value={editUserCpf}
                      onChange={(e) => setEditUserCpf(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono ${
                        userCpfError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                    {userCpfError && (
                      <p className="text-[11px] text-red-500 font-bold mt-1 bg-red-500/10 border border-red-500/30 p-1.5 rounded-lg leading-snug">
                        {userCpfError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Data de Nascimento</label>
                    <input
                      type="date"
                      value={editUserDataNascimento}
                      onChange={(e) => setEditUserDataNascimento(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">WhatsApp</label>
                    <input
                      type="text"
                      value={editUserWhatsapp}
                      onChange={(e) => {
                        const newPhone = maskPhone(e.target.value);
                        setEditUserWhatsapp(newPhone);
                        if (isUserMinorProvisorio) {
                          setEditUserContatoEmergenciaTelefone(newPhone);
                        }
                      }}
                      placeholder="(98) 99999-9999"
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono ${
                        showUserEmergencyError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">🥋 Faixa</label>
                    <select
                      value={editUserFaixa.startsWith('Faixa ') ? editUserFaixa : (editUserFaixa ? `Faixa ${editUserFaixa}` : 'Faixa Preta')}
                      onChange={(e) => setEditUserFaixa(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                    >
                      <option value="Faixa Branca">Faixa Branca</option>
                      <option value="Faixa Cinza">Faixa Cinza</option>
                      <option value="Faixa Amarela">Faixa Amarela</option>
                      <option value="Faixa Laranja">Faixa Laranja</option>
                      <option value="Faixa Verde">Faixa Verde</option>
                      <option value="Faixa Azul">Faixa Azul</option>
                      <option value="Faixa Roxa">Faixa Roxa</option>
                      <option value="Faixa Marrom">Faixa Marrom</option>
                      <option value="Faixa Preta">Faixa Preta</option>
                      <option value="Faixa Preta-Vermelha">Faixa Preta-Vermelha</option>
                      <option value="Faixa Vermelha-Branca">Faixa Vermelha-Branca</option>
                      <option value="Faixa Vermelha">Faixa Vermelha</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Perfil de Acesso</label>
                    <select
                      value={editUserTipo}
                      onChange={(e) => setEditUserTipo(e.target.value as UserRole)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium cursor-pointer"
                    >
                      <option value="aluno">Aluno / Competidor</option>
                      <option value="professor">Professor / Mestre</option>
                      <option value="instrutor">Instrutor Auxiliar</option>
                      <option value="admin">Administrador Geral</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Contato Emergência (Nome) {isUserMinor && !isUserEditingWithProvisorio ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={editUserContatoEmergenciaNome}
                      onChange={(e) => setEditUserContatoEmergenciaNome(e.target.value.toUpperCase())}
                      placeholder="NOME DO CONTATO"
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-semibold uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Contato Emergência (Telefone) {isUserMinor && !isUserEditingWithProvisorio ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={editUserContatoEmergenciaTelefone}
                      onChange={(e) => {
                        const newPhone = maskPhone(e.target.value);
                        setEditUserContatoEmergenciaTelefone(newPhone);
                        if (isUserMinorProvisorio) {
                          setEditUserWhatsapp(newPhone);
                        }
                      }}
                      placeholder="(98) 99999-9999"
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono ${
                        showUserEmergencyError ? 'border-red-500 bg-red-500/10' : 'border-neutral-800'
                      }`}
                    />
                  </div>
                </div>

                {showUserEmergencyError && (
                  <p className="text-[11px] text-red-500 font-bold bg-red-500/10 border border-red-500/30 p-2 rounded-lg leading-snug">
                    Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato diferente.
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(userCpfError) || showUserEmergencyError}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                      userCpfError || showUserEmergencyError
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                        : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20'
                    }`}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

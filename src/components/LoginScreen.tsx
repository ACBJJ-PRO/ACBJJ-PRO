import React, { useState } from 'react';
import { User, Student, UserRole, ClassUnit, OfficialContract, ContractAcceptanceRecord, isAdultPerson } from '../types';
import { Shield, UserPlus, Calendar, Mail, Lock, Phone, User as UserIcon, CalendarDays, Clipboard, Eye, EyeOff, KeyRound, Trophy, Bot, FileText, CheckCircle2, ShieldCheck, Printer, X, Copy, Check, Download, Smartphone } from 'lucide-react';
import AiCentralModal from './AiCentralModal';
import { maskPhone } from '../utils/formatters';
import { CONTRATOS_INICIAIS } from '../data/contratosOficiais';
import { ContractLogoHeader } from './ContractLogoHeader';
import { updateFirestoreStateKey } from '../lib/firebase';

interface LoginScreenProps {
  usuarios: User[];
  alunos: Student[];
  logoApp: string;
  onLoginSuccess: (user: User) => void;
  onRegister: (newUser: User, newStudent?: Student) => void;
  activeTheme?: any;
  turmas?: ClassUnit[];
  onMandatoryPasswordChange?: (userId: number, newSenha: string) => void;
  onSubmitRecuperacao?: (cpf: string) => boolean | void;
  onOpenConfronto?: () => void;
  onRegisterAcceptance?: (record: Omit<ContractAcceptanceRecord, 'id'>) => void;
  contratosOficiais?: OfficialContract[];
  onAgendarExperimental?: (aula: any, notif: any) => void;
}

const formatCPF = (value: string) => {
  const nums = value.replace(/\D/g, '');
  const limited = nums.slice(0, 11);
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
};

const formatWhatsApp = (value: string) => {
  const nums = value.replace(/\D/g, '');
  const limited = nums.slice(0, 11);
  if (limited.length <= 2) return limited.length > 0 ? `(${limited}` : '';
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

const isValidCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  
  // Reject known invalid CPFs
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;
  
  return true;
};

const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 0;
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const generateProvisionalCPF = (usuariosList: User[], alunosList: Student[]): string => {
  let maxNum = 0;
  const parseNum = (cpfStr?: string) => {
    if (!cpfStr || !cpfStr.startsWith('INF-')) return;
    const num = parseInt(cpfStr.replace('INF-', ''), 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  };
  usuariosList.forEach((u) => parseNum(u.cpf));
  alunosList.forEach((a) => parseNum(a.cpf));
  const nextNum = maxNum + 1;
  return `INF-${String(nextNum).padStart(11, '0')}`;
};

export default function LoginScreen({
  usuarios,
  alunos,
  logoApp,
  onLoginSuccess,
  onRegister,
  activeTheme,
  turmas,
  onMandatoryPasswordChange,
  onSubmitRecuperacao,
  onOpenConfronto,
  onRegisterAcceptance,
  contratosOficiais = CONTRATOS_INICIAIS,
  onAgendarExperimental,
}: LoginScreenProps) {
  const [logoError, setLogoError] = useState(false);

  React.useEffect(() => {
    setLogoError(false);
  }, [logoApp, activeTheme]);

  const getLogoSrc = (theme: string) => {
    if (logoApp && (logoApp.startsWith('data:image/') || logoApp.startsWith('http://') || logoApp.startsWith('https://') || logoApp.startsWith('blob:'))) {
      return logoApp;
    }
    return theme === 'white' ? '/ARENADOCOMPETIDOR.png' : '/Logo%20branca.png';
  };

  const getLogoContainerStyle = (theme: string) => {
    switch (theme) {
      case 'blue':
        return 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/20 shadow-blue-500/10';
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/20 shadow-emerald-500/10';
      case 'purple':
        return 'bg-gradient-to-br from-purple-500 to-fuchsia-600 border-purple-400/20 shadow-purple-500/10';
      case 'red':
        return 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400/20 shadow-red-500/10';
      case 'yellow':
        return 'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-400/20 shadow-yellow-500/10';
      case 'cyan':
        return 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400/20 shadow-cyan-500/10';
      case 'rose':
        return 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400/20 shadow-rose-500/10';
      case 'fuchsia':
        return 'bg-gradient-to-br from-fuchsia-500 to-purple-600 border-fuchsia-400/20 shadow-fuchsia-500/10';
      case 'lime':
        return 'bg-gradient-to-br from-lime-500 to-emerald-600 border-lime-400/20 shadow-lime-500/10';
      case 'white':
        return 'bg-white border-neutral-200 shadow-neutral-200/10';
      case 'orange':
      default:
        return 'bg-gradient-to-br from-orange-500 to-red-600 border-orange-400/20 shadow-orange-500/10';
    }
  };

  const [loginCpf, setLoginCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCadPassword, setShowCadPassword] = useState(false);

  // Recovery State
  const [showRecuperarAcesso, setShowRecuperarAcesso] = useState(false);
  const [recuperarCpf, setRecuperarCpf] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // APK Download Modal State
  const [showDownloadApkModal, setShowDownloadApkModal] = useState(false);

  const handleDownloadApk = () => {
    const link = document.createElement('a');
    link.href = '/ACBJJ.apk';
    link.setAttribute('download', 'ACBJJ.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mandatory Reset State
  const [showMandatoryReset, setShowMandatoryReset] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [novaSenhaMandataria, setNovaSenhaMandataria] = useState('');
  const [confirmacaoSenhaMandataria, setConfirmacaoSenhaMandataria] = useState('');
  const [showNovaSenhaMandataria, setShowNovaSenhaMandataria] = useState(false);
  const [showConfirmacaoSenhaMandataria, setShowConfirmacaoSenhaMandataria] = useState(false);

  // Cadastro State
  const [showCadastro, setShowCadastro] = useState(false);
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadConfirmarSenha, setCadConfirmarSenha] = useState('');
  const [cadNome, setCadNome] = useState('');
  const [cadCpf, setCadCpf] = useState('');
  const [cadMenorSemCpf, setCadMenorSemCpf] = useState(false);
  const [cadMenorSemPhone, setCadMenorSemPhone] = useState(false);
  const [cadMenorSemEmail, setCadMenorSemEmail] = useState(false);
  const [cadNascimento, setCadNascimento] = useState('');
  const [cadGenero, setCadGenero] = useState('');
  const [cadWhatsapp, setCadWhatsapp] = useState('');
  const [cadTipo, setCadTipo] = useState<UserRole | ''>('');
  const [cadFaixa, setCadFaixa] = useState('');
  const [cadAcademia, setCadAcademia] = useState('');
  const [cadProfessorId, setCadProfessorId] = useState<number | ''>('');
  const [cadDataInicio, setCadDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [cadContatoEmergenciaNome, setCadContatoEmergenciaNome] = useState('');
  const [cadContatoEmergenciaTelefone, setCadContatoEmergenciaTelefone] = useState('');
  const [cadResponsavelNome, setCadResponsavelNome] = useState('');
  const [cadResponsavelCpf, setCadResponsavelCpf] = useState('');
  const [cadResponsavelTelefone, setCadResponsavelTelefone] = useState('');
  const [cadResponsavelEmail, setCadResponsavelEmail] = useState('');

  // Aceite dos Documentos Oficiais (Matrícula, LGPD e Uso de Imagem)
  const [aceitouMatricula, setAceitouMatricula] = useState(false);
  const [aceitouLgpd, setAceitouLgpd] = useState(false);
  const [aceitouImagem, setAceitouImagem] = useState(false);
  const [documentoParaVisualizar, setDocumentoParaVisualizar] = useState<OfficialContract | null>(null);

  // Modal para avisar aprovação pendente
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [registeredInfo, setRegisteredInfo] = useState<{ nome: string; perfil: string; responsavel: string; cpf?: string; isCpfProvisorio?: boolean }>({ nome: '', perfil: '', responsavel: '' });
  const [copiedCpfSuccess, setCopiedCpfSuccess] = useState(false);

  // Aula Experimental State
  const [showExperimental, setShowExperimental] = useState(false);
  const [expNome, setExpNome] = useState('');
  const [expWhatsapp, setExpWhatsapp] = useState('');
  const [expHorario, setExpHorario] = useState('');
  const [expTurma, setExpTurma] = useState('');

  // Extract unique horários available in registered turmas
  const availableHorarios = React.useMemo(() => {
    if (!turmas || turmas.length === 0) return [];
    const times = turmas.map((t) => t.horario).filter(Boolean);
    return Array.from(new Set(times)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [turmas]);

  // Extract turmas matching selected expHorario
  const turmasForSelectedHorario = React.useMemo(() => {
    if (!expHorario || !turmas) return [];
    return turmas.filter((t) => t.horario === expHorario);
  }, [expHorario, turmas]);

  // Auto-select turma if only 1 exists for chosen time, or reset invalid selection
  React.useEffect(() => {
    if (!expHorario) {
      setExpTurma('');
      return;
    }
    if (turmasForSelectedHorario.length === 1) {
      setExpTurma(turmasForSelectedHorario[0].nome);
    } else if (turmasForSelectedHorario.length > 1) {
      if (!turmasForSelectedHorario.some((t) => t.nome === expTurma)) {
        setExpTurma('');
      }
    } else {
      setExpTurma('');
    }
  }, [expHorario, turmasForSelectedHorario]);

  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2); // range -1 to 1
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2); // range -1 to 1
      setMouseOffset({ x: x * 18, y: y * 18 }); // moves up to 18px smoothly
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCpfInput = loginCpf ? loginCpf.trim() : '';
    const rawSenhaInput = senha ? senha.trim() : '';
    
    if (!rawCpfInput || !rawSenhaInput) {
      alert('Por favor, informe o CPF e a senha de acesso.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/cloudsql/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: rawCpfInput,
          senha: rawSenhaInput,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.warn('[LoginScreen] Failed to parse JSON response:', jsonErr);
          data = null;
        }
      } else {
        const textResp = await response.text().catch(() => '');
        console.warn(`[LoginScreen] Non-JSON response received (HTTP ${response.status}):`, textResp.slice(0, 150));
      }

      if (response.ok && data && (data.ok || data.success) && data.user) {
        if (data.requiresReset) {
          setUserToReset(data.user);
          setShowMandatoryReset(true);
          return;
        }

        onLoginSuccess(data.user);
        return;
      }

      // Handle specific status codes with user-friendly Portuguese error messages
      if (response.status === 400) {
        alert(data?.message || data?.error || 'Dados de entrada inválidos. Por favor, informe o CPF e a senha.');
      } else if (response.status === 401) {
        alert(data?.message || data?.error || 'CPF ou senha inválidos.');
      } else if (response.status === 403) {
        alert(data?.message || data?.error || 'Seu cadastro foi realizado com sucesso, porém sua conta ainda está aguardando aprovação do administrador. Aguarde a liberação para acessar o sistema.');
      } else if (response.status === 500 || response.status === 502 || response.status === 503) {
        alert(data?.message || data?.error || 'Erro interno de autenticação. Tente novamente.');
      } else {
        alert(data?.message || data?.error || 'Erro de conexão ao autenticar. Tente novamente.');
      }
    } catch (err) {
      console.error('[LoginScreen] Connection error during login request:', err);
      alert('Erro de conexão ao autenticar. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const clearCadastroFields = () => {
    setCadEmail('');
    setCadSenha('');
    setCadConfirmarSenha('');
    setCadNome('');
    setCadCpf('');
    setCadMenorSemCpf(false);
    setCadMenorSemPhone(false);
    setCadMenorSemEmail(false);
    setCadNascimento('');
    setCadGenero('');
    setCadWhatsapp('');
    setCadTipo('');
    setCadProfessorId('');
    setCadDataInicio(new Date().toISOString().split('T')[0]);
    setCadFaixa('');
    setCadAcademia('');
    setCadContatoEmergenciaNome('');
    setCadContatoEmergenciaTelefone('');
    setCadResponsavelNome('');
    setCadResponsavelCpf('');
    setCadResponsavelTelefone('');
    setCadResponsavelEmail('');
    setAceitouMatricula(false);
    setAceitouLgpd(false);
    setAceitouImagem(false);
  };

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Calculate age to determine if user is a minor
    const userAge = calculateAge(cadNascimento);
    const birthDate = new Date(cadNascimento);
    const today = new Date();
    if (isNaN(birthDate.getTime()) || birthDate > today) {
      alert('Data de nascimento inválida! A data de nascimento não pode ser em uma data futura.');
      return;
    }

    const isMinor = userAge < 18 && userAge >= 0;

    // 1.1 Validate required fields
    const missingFields: string[] = [];
    if (!cadNome.trim()) missingFields.push('Nome completo');
    if (!(isMinor && cadMenorSemEmail) && !cadEmail.trim()) missingFields.push('E-mail');
    if (!cadSenha.trim()) missingFields.push('Senha de acesso');
    if (!cadConfirmarSenha.trim()) missingFields.push('Confirmação de senha');
    if (!cadNascimento.trim()) missingFields.push('Data de nascimento');
    if (!isMinor && !cadMenorSemCpf && !cadCpf.trim()) missingFields.push('CPF');
    if (!(isMinor && cadMenorSemPhone) && !cadWhatsapp.trim()) missingFields.push('Número de contato');
    if (!cadTipo) missingFields.push('Tipo de Perfil');
    if (!cadFaixa.trim()) missingFields.push('Graduação');
    if (!cadDataInicio.trim()) missingFields.push('Data inicial do treino');

    if (missingFields.length > 0) {
      alert(`Por favor, preencha os seguintes campos obrigatórios:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // Password match check
    if (cadSenha !== cadConfirmarSenha) {
      alert('As senhas digitadas não coincidem! Por favor, digite a mesma senha no campo de confirmação.');
      return;
    }

    // Regra 14.6: Opção exclusiva para menores de idade
    if (cadMenorSemCpf && !isMinor) {
      alert('A opção "O menor não possui CPF" é permitida exclusivamente para menores de 18 anos.');
      return;
    }

    // 1.2.1 Regra Inteligente: Validação do Responsável Legal para Menores de 18 Anos
    if (isMinor) {
      const missingRespFields: string[] = [];
      if (!cadResponsavelNome.trim()) missingRespFields.push('Nome completo do responsável legal');
      if (!cadResponsavelCpf.trim()) missingRespFields.push('CPF do responsável legal');
      if (!cadResponsavelTelefone.trim()) missingRespFields.push('Telefone do responsável legal');
      if (!cadResponsavelEmail.trim()) missingRespFields.push('E-mail do responsável legal');

      if (missingRespFields.length > 0) {
        alert(`Atleta menor de 18 anos detectado (${userAge} anos).\nO preenchimento do Responsável Legal é OBRIGATÓRIO! Faltam:\n- ${missingRespFields.join('\n- ')}`);
        return;
      }

      const cleanedRespCpf = cadResponsavelCpf.replace(/\D/g, '');
      if (!isValidCPF(cleanedRespCpf)) {
        alert('CPF do Responsável Legal inválido! Insira um CPF de responsável com dígitos verificadores matematicamente corretos.');
        return;
      }

      if (!cadResponsavelEmail.includes('@')) {
        alert('E-mail do Responsável Legal inválido! Insira um e-mail válido contendo @.');
        return;
      }
    }

    // Compute final contact information
    const finalWhatsapp = (isMinor && cadMenorSemPhone) ? cadResponsavelTelefone.trim() : cadWhatsapp.trim();
    // E-mail de acesso do usuário. Se for menor sem e-mail próprio, fica vazio (não copia e-mail do responsável)
    const finalEmail = (isMinor && cadMenorSemEmail) ? '' : cadEmail.trim().toLowerCase();
    const finalEmergNome = isMinor ? cadResponsavelNome.trim() : cadContatoEmergenciaNome.trim();
    const finalEmergPhone = isMinor ? cadResponsavelTelefone.trim() : cadContatoEmergenciaTelefone.trim();

    // Regra 1: Validação de Telefone de Emergência vs WhatsApp (somente para maiores de idade)
    if (!isMinor) {
      const cleanWa = finalWhatsapp.replace(/\D/g, '');
      const cleanEmerg = finalEmergPhone.replace(/\D/g, '');
      if (cleanWa.length > 0 && cleanEmerg.length > 0 && cleanWa === cleanEmerg) {
        alert('Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato de emergência diferente.');
        return;
      }
    }

    // 1.3 Document acceptances validation
    if (!aceitouMatricula || !aceitouLgpd || !aceitouImagem) {
      alert('Você deve ler e aceitar obrigatoriamente o Contrato de Matrícula, o Termo de Privacidade (LGPD) e o Termo de Uso de Imagem para criar a sua conta.');
      return;
    }

    if (finalEmail && !finalEmail.includes('@')) {
      alert('Por favor, digite um e-mail válido contendo @!');
      return;
    }

    // 2. CPF Processing (Rule 14: Provisional vs Official)
    let finalCpf = '';
    let isCpfProvisorio = false;

    const cleanedCpf = cadCpf.replace(/\D/g, '');
    if (isMinor && (cadMenorSemCpf || !cadCpf.trim() || !isValidCPF(cleanedCpf))) {
      finalCpf = generateProvisionalCPF(usuarios, alunos);
      isCpfProvisorio = true;
    } else {
      if (!isValidCPF(cleanedCpf)) {
        alert('CPF inválido! Por favor, insira um CPF matematicamente válido com dígitos verificadores corretos.');
        return;
      }

      if (!isMinor && cleanedCpf) {
        const adultCpfExists =
          usuarios.some((u) => isAdultPerson(u) && u.cpf && !u.cpf.startsWith('INF-') && u.cpf.replace(/\D/g, '') === cleanedCpf) ||
          alunos.some((a) => isAdultPerson(a) && a.cpf && !a.cpf.startsWith('INF-') && a.cpf.replace(/\D/g, '') === cleanedCpf);
        if (adultCpfExists) {
          alert('Este CPF já está cadastrado no sistema!');
          return;
        }
      }
      finalCpf = formatCPF(cleanedCpf);
    }

    // 3. Password complexity check
    if (cadSenha.length < 7) {
      alert('A senha deve ter no mínimo 7 caracteres!');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(cadSenha);
    const hasNumber = /[0-9]/.test(cadSenha);
    if (!hasLetter || !hasNumber) {
      alert('A senha de acesso deve conter letras e números!');
      return;
    }

    // 4. Email uniqueness check (valida APENAS no E-mail de Acesso, nunca no E-mail do Responsável Legal)
    if (finalEmail && finalEmail.trim() !== '') {
      const emailTaken = usuarios.some((u) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        if (!uEmail) return false;
        if (uEmail === finalEmail) {
          // Se for um registro legado de menor cuja cópia do e-mail do responsável estava no u.email, ignora
          const uRespEmail = (u.responsavelEmail || '').trim().toLowerCase();
          const isMinorUser = u.dataNascimento ? calculateAge(u.dataNascimento) < 18 : false;
          if (isMinorUser && uRespEmail && uRespEmail === uEmail) {
            return false;
          }
          return true;
        }
        return false;
      });
      if (emailTaken) {
        alert('Este e-mail já está cadastrado!');
        return;
      }
    }

    const novoId = Math.max(...usuarios.map((u) => u.id), 0) + 1;
    const selectedProf = usuarios.find((u) => u.id === cadProfessorId);
    const todayStr = new Date().toISOString().split('T')[0];

    const novoUsuario: User = {
      id: novoId,
      email: finalEmail,
      senha: cadSenha,
      nome: cadNome,
      tipo: cadTipo as UserRole,
      aprovado: false, // Todos necessitam de aprovação
      fotoPerfil: '',
      whatsapp: finalWhatsapp,
      endereco: '',
      tipoSangue: '',
      alergico: '',
      dataNascimento: cadNascimento,
      genero: cadGenero || '',
      responsavelNome: isMinor ? cadResponsavelNome.trim() : '',
      responsavelCpf: isMinor ? cadResponsavelCpf.trim() : '',
      responsavelTelefone: isMinor ? cadResponsavelTelefone.trim() : '',
      responsavelEmail: isMinor ? cadResponsavelEmail.trim() : '',
      academia: cadAcademia || '',
      professorResponsavelId: Number(cadProfessorId) || null,
      professorResponsavelNome: selectedProf?.nome || '',
      dataInicioTreino: cadDataInicio || todayStr,
      dataCadastro: todayStr,
      createdAt: new Date().toISOString(),
      contatoEmergenciaNome: finalEmergNome,
      contatoEmergenciaTelefone: finalEmergPhone,
      cpf: finalCpf,
      isCpfProvisorio,
      cpfProvisorioDataCriacao: isCpfProvisorio ? new Date().toISOString() : '',
      faixa: cadFaixa,
    };

    let novoAluno: Student | undefined;
    if (cadTipo === 'aluno') {
      const alunoId = Math.max(...alunos.map((a) => a.id), 0) + 1;
      novoAluno = {
        id: alunoId,
        usuarioId: novoId,
        nome: cadNome,
        cpf: finalCpf,
        isCpfProvisorio,
        cpfProvisorioDataCriacao: isCpfProvisorio ? new Date().toISOString() : '',
        dataNascimento: cadNascimento,
        idade: userAge,
        genero: cadGenero || '',
        responsavelNome: isMinor ? cadResponsavelNome.trim() : '',
        responsavelCpf: isMinor ? cadResponsavelCpf.trim() : '',
        responsavelTelefone: isMinor ? cadResponsavelTelefone.trim() : '',
        responsavelEmail: isMinor ? cadResponsavelEmail.trim() : '',
        academia: cadAcademia || '',
        endereco: '',
        whatsapp: finalWhatsapp,
        tipoSangue: '',
        alergico: '',
        faixa: cadFaixa,
        fotoPerfil: '',
        ativo: false, // Inativo até ser aprovado
        checkins: [],
        pontosCompeticao: 0,
        notaAvaliacao: null,
        mediaGeral: 0,
        medalhasOuro: 0,
        medalhasPrata: 0,
        medalhasBronze: 0,
        professorResponsavelId: Number(cadProfessorId) || undefined,
        professorResponsavelNome: selectedProf?.nome || undefined,
        dataInicioTreino: cadDataInicio || todayStr,
        dataCadastro: todayStr,
        createdAt: new Date().toISOString(),
        contatoEmergenciaNome: finalEmergNome,
        contatoEmergenciaTelefone: finalEmergPhone,
      };
    }

    // Direct synchronous Cloud SQL Persistence
    fetch('/api/cloudsql/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: novoUsuario,
        student: novoAluno,
      }),
    }).catch((err) => console.warn('Cloud SQL register notice:', err));

    onRegister(novoUsuario, novoAluno);

    if (onRegisterAcceptance) {
      const dev = navigator.userAgent;
      const hashMatricula = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const hashLgpd = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const hashImagem = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      onRegisterAcceptance({
        usuarioId: novoUsuario.id,
        usuarioNome: cadNome.trim(),
        usuarioCpf: finalCpf,
        documentoId: 'doc_matricula_regulamento',
        documentoTitulo: 'Contrato Oficial de Matrícula e Regulamento Geral da Arena',
        versao: '1.0',
        dataHora: new Date().toLocaleString('pt-BR'),
        ip: '189.120.45.12',
        dispositivo: dev,
        navegador: dev,
        hashAssinatura: hashMatricula,
        origem: 'cadastro',
      });

      onRegisterAcceptance({
        usuarioId: novoUsuario.id,
        usuarioNome: cadNome.trim(),
        usuarioCpf: finalCpf,
        documentoId: 'doc_lgpd_privacidade',
        documentoTitulo: 'Termo de Consentimento para Tratamento de Dados Pessoais (LGPD)',
        versao: '1.0',
        dataHora: new Date().toLocaleString('pt-BR'),
        ip: '189.120.45.12',
        dispositivo: dev,
        navegador: dev,
        hashAssinatura: hashLgpd,
        origem: 'cadastro',
      });

      onRegisterAcceptance({
        usuarioId: novoUsuario.id,
        usuarioNome: cadNome.trim(),
        usuarioCpf: finalCpf,
        documentoId: 'doc_imagem_voz',
        documentoTitulo: 'Termo de Autorização de Uso de Imagem, Voz e Transmissão',
        versao: '1.0',
        dataHora: new Date().toLocaleString('pt-BR'),
        ip: '189.120.45.12',
        dispositivo: dev,
        navegador: dev,
        hashAssinatura: hashImagem,
        origem: 'cadastro',
      });
    }
    
    // Set registration info and open the pending modal
    setRegisteredInfo({
      nome: cadNome,
      perfil: cadTipo === 'aluno' ? 'Competidor' : cadTipo === 'professor' ? 'Professor(a)' : 'Instrutor(a)',
      responsavel: selectedProf?.nome || 'Administrador',
      cpf: finalCpf,
      isCpfProvisorio: isCpfProvisorio,
    });
    
    setShowCadastro(false);
    setShowApprovalModal(true);
    
    // Clear registration fields completely so they do not remain in memory
    clearCadastroFields();
    // Also clear login screen fields
    setLoginCpf('');
    setSenha('');
  };

  const handleExperimental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expNome.trim() || !expWhatsapp.trim() || !expHorario || !expTurma) {
      alert('Por favor, preencha o Nome Completo, WhatsApp, Horário Desejado e selecione a Turma!');
      return;
    }
    
    const formattedName = expNome.trim().toUpperCase();
    const formattedPhone = maskPhone(expWhatsapp.trim());
    const msg = `📅 NOVA AULA EXPERIMENTAL\nNome: ${formattedName}\nWhatsApp: ${formattedPhone}\nHorário Desejado: ${expHorario}\nTurma: ${expTurma}`;

    const newNotif = {
      id: Date.now().toString(),
      texto: msg,
      data: new Date().toLocaleString('pt-BR'),
      para: 'Administrador',
      de: 'Visitante (Experimental)'
    };

    const newAula = {
      id: 'exp_' + Date.now().toString(),
      nome: formattedName,
      whatsapp: formattedPhone,
      turma: expTurma,
      horario: expHorario,
      dataAula: new Date().toISOString().split('T')[0],
      status: 'Pendente',
      createdAt: new Date().toISOString(),
    };

    if (onAgendarExperimental) {
      onAgendarExperimental(newAula, newNotif);
    } else {
      // Emit a local storage notification for admin
      const pendingNotif = JSON.parse(localStorage.getItem('arena_notificacoes') || '[]');
      pendingNotif.unshift(newNotif);
      localStorage.setItem('arena_notificacoes', JSON.stringify(pendingNotif));
      updateFirestoreStateKey('notificacoes', pendingNotif);

      // Save to arena_aulas_experimentais
      try {
        const existingAulas = JSON.parse(localStorage.getItem('arena_aulas_experimentais') || '[]');
        existingAulas.unshift(newAula);
        localStorage.setItem('arena_aulas_experimentais', JSON.stringify(existingAulas));
        updateFirestoreStateKey('aulasExperimentais', existingAulas);
      } catch (e) {
        console.warn(e);
      }
    }

    
    alert(`Sua aula experimental para a turma "${expTurma}" às ${expHorario} foi agendada com sucesso! O professor entrará em contato via WhatsApp (${formattedPhone}).`);
    setShowExperimental(false);
    setExpNome('');
    setExpWhatsapp('');
    setExpHorario('');
    setExpTurma('');
  };

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] z-[1000] overflow-y-auto">
      <div className="min-h-full w-full flex flex-col items-center justify-center p-4 py-6 sm:py-8 relative">
        <div className="absolute inset-0 bg-radial-at-t from-orange-950/20 via-transparent to-transparent pointer-events-none login-bg-glow" />

        <div className="bg-[#141414] rounded-3xl p-5 sm:p-8 max-w-md w-full border border-neutral-800 shadow-2xl relative z-10 animate-fade-in my-4">
          <div 
            className={`w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center mx-auto mb-4 sm:mb-6 rounded-3xl overflow-hidden p-1 shadow-lg border transition-all duration-300 ${
              getLogoContainerStyle(activeTheme || 'orange')
            }`}
          >
            {logoError ? (
              <Shield className={`w-12 h-12 sm:w-16 sm:h-16 ${activeTheme === 'white' ? 'text-neutral-400' : 'text-white/90'}`} />
            ) : (
              <img 
                src={getLogoSrc(activeTheme || 'orange')} 
                alt="Arena do Competidor" 
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain animate-fade-in" 
              />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white text-center tracking-tight">
            ARENA DO COMPETIDOR
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm text-center mt-1 sm:mt-1.5 mb-6 sm:mb-8">
            ACBJJ PRO - GESTÃO DE EQUIPE
          </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">CPF</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-neutral-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={loginCpf}
                onChange={(e) => setLoginCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Senha</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-neutral-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-3 pl-11 pr-11 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-neutral-500 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            Acessar Área
          </button>
          <div className="text-center">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">( acesso restrito )</span>
          </div>
        </form>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => setShowCadastro(true)}
            className="flex items-center justify-center gap-2 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 bg-transparent py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Criar Conta
          </button>
          <button
            onClick={() => setShowExperimental(true)}
            className="flex items-center justify-center gap-2 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 bg-transparent py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Aula Experimental
          </button>
        </div>

        <button
          onClick={() => onOpenConfronto?.()}
          className="w-full mt-3 flex items-center justify-center gap-2 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 bg-transparent py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.98]"
        >
          <Trophy className="w-4 h-4" />
          CAMPEONATOS / INSCRIÇÕES
        </button>

        <button
          type="button"
          onClick={() => setShowDownloadApkModal(true)}
          className="w-full mt-3 flex items-center justify-center gap-2 border border-neutral-800 hover:border-orange-500 hover:text-orange-500 text-neutral-300 bg-transparent py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          BAIXAR APK
        </button>



        <div className="mt-6 pt-4 border-t border-neutral-900 text-center space-y-3">
          <button
            type="button"
            onClick={() => setShowRecuperarAcesso(true)}
            className="text-xs text-neutral-400 font-bold hover:text-orange-500 hover:underline transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Esqueci minha Senha / Recuperar Acesso
          </button>
          <div className="pt-4 border-t border-neutral-900/40 text-center text-xs text-neutral-500 leading-relaxed font-sans">
            <p className="font-medium text-neutral-400">Desenvolvido e Elaborado por:</p>
            <p className="font-extrabold text-orange-500 text-sm tracking-wide">YURI CRUZ ©</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-600 mt-0.5">Versão Atualizada 2026</p>
          </div>
        </div>
      </div>

      {/* MODAL CADASTRO */}
      {showCadastro && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-lg w-full border border-neutral-800 shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-5">
              <div className="flex items-center gap-3 text-orange-500">
                <UserPlus className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold text-white">Criar Nova Conta</h2>
                  <p className="text-[11px] text-neutral-400">Arena do Competidor — Ficha Oficial de Inscrição</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCadastro(false)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCadastro} className="space-y-6">
              {/* BLOCO 1: DADOS PESSOAIS */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-800/80">
                  <UserIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">1. Dados Pessoais</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Nome Completo *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: JOÃO DA SILVA (Somente letras)"
                      value={cadNome}
                      onChange={(e) => setCadNome(e.target.value.replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, '').toUpperCase())}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none uppercase font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">
                      CPF {cadMenorSemCpf ? '(Provisório INF-)' : '*'}
                    </label>
                    <input
                      type="text"
                      required={!cadMenorSemCpf}
                      disabled={cadMenorSemCpf}
                      placeholder={cadMenorSemCpf ? 'INF-00000000001 (CPF Provisório Autogerado)' : '000.000.000-00'}
                      value={cadMenorSemCpf ? 'Provisório (Gerado ao Salvar)' : cadCpf}
                      onChange={(e) => setCadCpf(formatCPF(e.target.value))}
                      className={`w-full text-white border rounded-xl py-2.5 px-4 text-sm outline-none transition ${
                        cadMenorSemCpf
                          ? 'bg-amber-500/10 text-amber-300 font-mono border-amber-500/40 cursor-not-allowed font-bold'
                          : 'bg-[#1a1a1a] focus:border-orange-500 ' +
                            (cadCpf.replace(/\D/g, '').length === 11 && !isValidCPF(cadCpf)
                              ? 'border-red-500/80 focus:border-red-500'
                              : 'border-neutral-800')
                      }`}
                    />
                    {!cadMenorSemCpf && cadCpf.replace(/\D/g, '').length === 11 && !isValidCPF(cadCpf) && (
                      <span className="text-[10px] text-red-500 font-semibold block">CPF inválido</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Data Nascimento *</label>
                    <input
                      type="date"
                      required
                      max="9999-12-31"
                      value={cadNascimento}
                      onChange={(e) => {
                        let newDate = e.target.value;
                        if (newDate) {
                          const parts = newDate.split('-');
                          if (parts[0] && parts[0].length > 4) {
                            parts[0] = parts[0].slice(0, 4);
                            newDate = parts.join('-');
                          }
                        }
                        setCadNascimento(newDate);
                        if (newDate && calculateAge(newDate) >= 18) {
                          setCadMenorSemCpf(false);
                        }
                      }}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.currentTarget;
                        if (target.value) {
                          const parts = target.value.split('-');
                          if (parts[0] && parts[0].length > 4) {
                            parts[0] = parts[0].slice(0, 4);
                            target.value = parts.join('-');
                            setCadNascimento(target.value);
                          }
                        }
                      }}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* REGRA 14.1: OPÇÃO CONDICIONAL PARA MENORES DE IDADE SEM CPF */}
                {cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/35 rounded-2xl text-left animate-fade-in space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-bold select-none">
                      <input
                        type="checkbox"
                        checked={cadMenorSemCpf}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setCadMenorSemCpf(checked);
                          if (checked) {
                            setCadCpf('');
                          }
                        }}
                        className="w-4 h-4 rounded border-amber-500/50 bg-neutral-900 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                      />
                      <span>O menor não possui CPF</span>
                    </label>
                    <p className="text-[10px] text-amber-400/90 pl-6 leading-relaxed">
                      Atleta menor de 18 anos sem CPF oficial. Será gerado um <strong>CPF Provisório</strong> exclusivo com 11 dígitos no padrão <span className="font-mono font-bold text-amber-300">INF-00000000001</span>, que poderá ser atualizado posteriormente pelo Mestre/Admin.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Gênero</label>
                    <select
                      value={cadGenero}
                      onChange={(e) => setCadGenero(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
                    >
                      <option value="">Selecione o gênero...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">
                      Telefone / WhatsApp {cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemPhone ? '' : '*'}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
                      <input
                        type="tel"
                        disabled={!!(cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemPhone)}
                        required={!(cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemPhone)}
                        placeholder={cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemPhone ? 'Utilizará Tel. do Responsável' : '(11) 99999-9999'}
                        value={cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemPhone ? (cadResponsavelTelefone ? `${cadResponsavelTelefone} (Resp.)` : 'Utilizará Tel. do Responsável') : cadWhatsapp}
                        onChange={(e) => setCadWhatsapp(formatWhatsApp(e.target.value))}
                        className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 pl-10 pr-3 text-sm focus:border-orange-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                          cadWhatsapp && cadContatoEmergenciaTelefone && cadWhatsapp.replace(/\D/g, '') === cadContatoEmergenciaTelefone.replace(/\D/g, '')
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-neutral-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-bold select-none p-1.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <input
                      type="checkbox"
                      checked={cadMenorSemPhone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCadMenorSemPhone(checked);
                        if (checked) {
                          setCadWhatsapp('');
                        }
                      }}
                      className="w-4 h-4 rounded border-amber-500/50 bg-neutral-900 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />
                    <span>O menor não possui telefone / WhatsApp próprio</span>
                  </label>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">
                    E-mail de Acesso {cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemEmail ? '' : '*'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
                    <input
                      type="email"
                      disabled={!!(cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemEmail)}
                      required={!(cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemEmail)}
                      placeholder={cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemEmail ? 'Utilizará E-mail do Responsável' : 'Ex: joao@email.com'}
                      value={cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && cadMenorSemEmail ? (cadResponsavelEmail ? `${cadResponsavelEmail} (Resp.)` : 'Utilizará E-mail do Responsável') : cadEmail}
                      onChange={(e) => setCadEmail(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  {cadNascimento && calculateAge(cadNascimento) < 18 && calculateAge(cadNascimento) >= 0 && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-bold select-none p-1.5 bg-amber-500/5 border border-amber-500/20 rounded-xl mt-1.5">
                      <input
                        type="checkbox"
                        checked={cadMenorSemEmail}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setCadMenorSemEmail(checked);
                          if (checked) {
                            setCadEmail('');
                          }
                        }}
                        className="w-4 h-4 rounded border-amber-500/50 bg-neutral-900 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                      />
                      <span>O menor não possui e-mail próprio</span>
                    </label>
                  )}
                </div>
              </div>

              {/* BLOCO 2: DADOS ESPORTIVOS */}
              <div className="space-y-3.5 pt-2 border-t border-neutral-900">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-800/80">
                  <Trophy className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">2. Dados Esportivos</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Tipo de Perfil *</label>
                    <select
                      required
                      value={cadTipo}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setCadTipo(val);
                        if (val === 'professor' || val === 'instrutor') {
                          setCadProfessorId('');
                        }
                      }}
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer ${
                        !cadTipo ? 'border-orange-500/50' : 'border-neutral-800'
                      }`}
                    >
                      <option value="">Selecione o perfil *</option>
                      <option value="aluno">Competidor</option>
                      <option value="professor">Professor(a)</option>
                      <option value="instrutor">Instrutor(a)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Graduação (Faixa) *</label>
                    <select
                      required
                      value={cadFaixa}
                      onChange={(e) => setCadFaixa(e.target.value)}
                      className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer ${
                        !cadFaixa ? 'border-orange-500/50' : 'border-neutral-800'
                      }`}
                    >
                      <option value="">Selecione sua graduação *</option>
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
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Academia / Equipe / Unidade</label>
                  <input
                    type="text"
                    placeholder="Ex: Arena Matriz - Centro"
                    value={cadAcademia}
                    onChange={(e) => setCadAcademia(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none uppercase font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">
                      Professor / Instrutor Resp. {cadTipo === 'aluno' ? '*' : ''}
                    </label>
                    <select
                      value={cadProfessorId}
                      onChange={(e) => setCadProfessorId(Number(e.target.value) || '')}
                      disabled={cadTipo === 'professor' || cadTipo === 'instrutor'}
                      required={cadTipo === 'aluno'}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {cadTipo === 'professor' || cadTipo === 'instrutor' ? 'Não aplicável (Perfil Professor/Instrutor)' : 'Selecione o Professor...'}
                      </option>
                      {usuarios
                        .filter((u) => u.aprovado && (u.tipo === 'professor' || u.tipo === 'instrutor' || u.tipo === 'admin' || u.email === 'admin@admin.com'))
                        .map((p) => {
                          const isUri = p.tipo === 'admin' || p.email === 'admin@admin.com' || p.nome.toLowerCase().includes('admin') || p.nome.toLowerCase().includes('uri cruz') || p.nome.toLowerCase().includes('yuri cruz');
                          return (
                            <option key={p.id} value={p.id}>
                              {isUri ? 'PROFESSOR YURI CRUZ' : `${p.nome} (${p.perfilLabel || (p.tipo === 'professor' ? 'Prof.' : 'Inst.')})`}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Data Início Treino *</label>
                    <input
                      type="date"
                      required
                      max="9999-12-31"
                      value={cadDataInicio}
                      onChange={(e) => {
                        let newDate = e.target.value;
                        if (newDate) {
                          const parts = newDate.split('-');
                          if (parts[0] && parts[0].length > 4) {
                            parts[0] = parts[0].slice(0, 4);
                            newDate = parts.join('-');
                          }
                        }
                        setCadDataInicio(newDate);
                      }}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.currentTarget;
                        if (target.value) {
                          const parts = target.value.split('-');
                          if (parts[0] && parts[0].length > 4) {
                            parts[0] = parts[0].slice(0, 4);
                            target.value = parts.join('-');
                            setCadDataInicio(target.value);
                          }
                        }
                      }}
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO 3: DADOS DE EMERGÊNCIA E RESPONSÁVEL LEGAL */}
              <div className="space-y-3.5 pt-2 border-t border-neutral-900">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-800/80">
                  <Phone className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">3. Responsável Legal e Contatos</span>
                </div>

                {/* REGRA INTELIGENTE RESPONSÁVEL LEGAL */}
                {cadNascimento ? (
                  (() => {
                    const userAge = calculateAge(cadNascimento);
                    const isMinor = userAge < 18 && userAge >= 0;

                    if (isMinor) {
                      return (
                        <div className="space-y-3 p-3.5 bg-amber-500/10 border border-amber-500/35 rounded-2xl animate-fade-in text-left">
                          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Atleta Menor de Idade ({userAge} anos) - Dados do Responsável Obrigatórios *</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Nome do Responsável */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-neutral-300 font-semibold uppercase tracking-wider block flex items-center justify-between">
                                <span>Nome do Resp. Legal *</span>
                                <span className="text-[10px] text-amber-400 font-normal">(Pai/Mãe/Tutor)</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="NOME COMPLETO DO RESPONSÁVEL"
                                value={cadResponsavelNome}
                                onChange={(e) => setCadResponsavelNome(e.target.value.toUpperCase())}
                                className="w-full bg-[#141414] text-white border border-amber-500/40 focus:border-amber-400 rounded-xl py-2 px-3 text-xs outline-none uppercase font-medium"
                              />
                            </div>

                            {/* CPF do Responsável */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-neutral-300 font-semibold uppercase tracking-wider block">
                                CPF do Resp. Legal *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="000.000.000-00"
                                value={cadResponsavelCpf}
                                onChange={(e) => setCadResponsavelCpf(formatCPF(e.target.value))}
                                className="w-full bg-[#141414] text-white border border-amber-500/40 focus:border-amber-400 rounded-xl py-2 px-3 text-xs outline-none font-mono"
                              />
                              {cadResponsavelCpf.replace(/\D/g, '').length === 11 && !isValidCPF(cadResponsavelCpf.replace(/\D/g, '')) && (
                                <span className="text-[10px] text-red-400 block font-semibold">CPF do responsável inválido!</span>
                              )}
                            </div>

                            {/* Telefone do Responsável */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-neutral-300 font-semibold uppercase tracking-wider block">
                                Tel. do Responsável *
                              </label>
                              <input
                                type="tel"
                                required
                                placeholder="(98) 99999-9999"
                                value={cadResponsavelTelefone}
                                onChange={(e) => setCadResponsavelTelefone(maskPhone(e.target.value))}
                                className="w-full bg-[#141414] text-white border border-amber-500/40 focus:border-amber-400 rounded-xl py-2 px-3 text-xs outline-none font-mono"
                              />
                            </div>

                            {/* E-mail do Responsável */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-neutral-300 font-semibold uppercase tracking-wider block">
                                E-mail do Resp. Legal *
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="responsavel@email.com"
                                value={cadResponsavelEmail}
                                onChange={(e) => setCadResponsavelEmail(e.target.value.toLowerCase())}
                                className="w-full bg-[#141414] text-white border border-amber-500/40 focus:border-amber-400 rounded-xl py-2 px-3 text-xs outline-none"
                              />
                              {cadResponsavelEmail && !cadResponsavelEmail.includes('@') && (
                                <span className="text-[10px] text-red-400 block font-semibold">E-mail inválido</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-medium text-left">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Atleta Maior de Idade ({userAge} anos) — Isento da seção de Responsável Legal.</span>
                        </div>
                      );
                    }
                  })()
                ) : (
                  <div className="p-2.5 bg-neutral-800/40 border border-neutral-800 rounded-xl text-neutral-400 text-xs flex items-center gap-2 text-left">
                    <UserIcon className="w-4 h-4 shrink-0 text-neutral-500" />
                    <span>Informe a Data de Nascimento para aplicar as regras de Responsável Legal.</span>
                  </div>
                )}

                {/* Contatos de Emergência - Ocultos para menores de idade pois os dados do Responsável Legal já são preenchidos obrigatoriamente */}
                {(!cadNascimento || calculateAge(cadNascimento) >= 18) && (
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Contato Emergência (Falar com)</label>
                      <input
                        type="text"
                        placeholder="Ex: MÃE, PAI, CÔNJUGE"
                        value={cadContatoEmergenciaNome}
                        onChange={(e) => setCadContatoEmergenciaNome(e.target.value.toUpperCase())}
                        className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none uppercase font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Tel. Emergência</label>
                      <input
                        type="tel"
                        placeholder="(98) 99999-9999"
                        value={cadContatoEmergenciaTelefone}
                        onChange={(e) => setCadContatoEmergenciaTelefone(maskPhone(e.target.value))}
                        className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none font-mono ${
                          cadWhatsapp && cadContatoEmergenciaTelefone && cadWhatsapp.replace(/\D/g, '') === cadContatoEmergenciaTelefone.replace(/\D/g, '')
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-neutral-800'
                        }`}
                      />
                      {cadWhatsapp && cadContatoEmergenciaTelefone && cadWhatsapp.replace(/\D/g, '') === cadContatoEmergenciaTelefone.replace(/\D/g, '') && (
                        <p className="text-[11px] text-red-500 font-bold mt-1.5 bg-red-500/10 border border-red-500/30 p-2 rounded-lg leading-snug">
                          Atenção! O número de emergência não pode ser igual ao número do WhatsApp. Informe um contato de emergência diferente.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* BLOCO 4: SEGURANÇA E ACESSO */}
              <div className="space-y-3.5 pt-2 border-t border-neutral-900">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-800/80">
                  <Lock className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">4. Segurança de Acesso</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Senha de Acesso *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
                      <input
                        type={showCadPassword ? 'text' : 'password'}
                        required
                        placeholder="Letras e números"
                        value={cadSenha}
                        onChange={(e) => setCadSenha(e.target.value)}
                        className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-9 pr-8 text-xs focus:border-orange-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCadPassword(!showCadPassword)}
                        className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white transition"
                      >
                        {showCadPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Confirmar Senha *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
                      <input
                        type={showCadPassword ? 'text' : 'password'}
                        required
                        placeholder="Repita a senha"
                        value={cadConfirmarSenha}
                        onChange={(e) => setCadConfirmarSenha(e.target.value)}
                        className={`w-full bg-[#1a1a1a] text-white border rounded-xl py-2.5 pl-9 pr-8 text-xs focus:border-orange-500 outline-none ${
                          cadConfirmarSenha && cadSenha !== cadConfirmarSenha
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-neutral-800'
                        }`}
                      />
                    </div>
                    {cadConfirmarSenha && cadSenha !== cadConfirmarSenha && (
                      <span className="text-[10px] text-red-500 font-semibold block">Senhas não coincidem</span>
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCO 5: TERMOS OBRIGATÓRIOS E ACEITE */}
              <div className="space-y-3 pt-3 border-t border-neutral-900 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  5. Aceite Obrigatório de Documentos Oficiais *
                </span>

                {/* DOCUMENTO 1: MATRÍCULA E REGULAMENTO */}
                <div className="bg-[#1c1c1c] p-3 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="chk-matricula-cad"
                      required
                      checked={aceitouMatricula}
                      onChange={(e) => setAceitouMatricula(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="chk-matricula-cad" className="text-xs text-neutral-200 leading-snug cursor-pointer font-medium">
                      Li e aceito o <strong className="text-white">Contrato Oficial de Matrícula e Regulamento Geral da Arena (v1.0)</strong>.
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const docObj = contratosOficiais.find((c) => c.id === 'doc_matricula_regulamento') || CONTRATOS_INICIAIS[0];
                      setDocumentoParaVisualizar(docObj);
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline flex items-center gap-1 ml-6 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Visualizar Documento Completo
                  </button>
                </div>

                {/* DOCUMENTO 2: PRIVACIDADE E LGPD */}
                <div className="bg-[#1c1c1c] p-3 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="chk-lgpd-cad"
                      required
                      checked={aceitouLgpd}
                      onChange={(e) => setAceitouLgpd(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="chk-lgpd-cad" className="text-xs text-neutral-200 leading-snug cursor-pointer font-medium">
                      Li e concordo com o <strong className="text-white">Termo de Consentimento para Tratamento de Dados (LGPD v1.0)</strong>.
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const docObj = contratosOficiais.find((c) => c.id === 'doc_lgpd_privacidade') || CONTRATOS_INICIAIS[1];
                      setDocumentoParaVisualizar(docObj);
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline flex items-center gap-1 ml-6 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Visualizar Termo de Privacidade
                  </button>
                </div>

                {/* DOCUMENTO 3: AUTORIZAÇÃO DE USO DE IMAGEM, VOZ E TRANSMISSÃO */}
                <div className="bg-[#1c1c1c] p-3 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="chk-imagem-cad"
                      required
                      checked={aceitouImagem}
                      onChange={(e) => setAceitouImagem(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="chk-imagem-cad" className="text-xs text-neutral-200 leading-snug cursor-pointer font-medium">
                      Li e aceito o <strong className="text-white">Termo de Autorização de Uso de Imagem, Voz e Transmissão (v1.0)</strong>.
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const docObj = contratosOficiais.find((c) => c.id === 'doc_imagem_voz') || CONTRATOS_INICIAIS[2];
                      setDocumentoParaVisualizar(docObj);
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline flex items-center gap-1 ml-6 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Visualizar Termo de Uso de Imagem
                  </button>
                </div>
              </div>

              <div className="text-left text-xs bg-orange-500/5 border border-orange-500/15 rounded-xl p-3 text-neutral-400 leading-relaxed font-medium animate-fade-in">
                <span className="text-orange-500 font-extrabold mr-1">*</span>
                Campos marcados com asterisco são de preenchimento obrigatório.
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowCadastro(false)}
                  className="flex-1 border border-neutral-800 text-neutral-400 py-3 rounded-xl hover:text-white hover:border-neutral-700 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    !aceitouMatricula ||
                    !aceitouLgpd ||
                    !aceitouImagem ||
                    !cadTipo ||
                    !cadFaixa ||
                    !cadNascimento ||
                    (!(Boolean(cadNascimento) && calculateAge(cadNascimento) < 18) && !cadMenorSemCpf && !cadCpf) ||
                    cadSenha !== cadConfirmarSenha ||
                    (Boolean(cadNascimento) && calculateAge(cadNascimento) < 18 && (
                      !cadResponsavelNome.trim() ||
                      !cadResponsavelCpf.trim() ||
                      !cadResponsavelTelefone.trim() ||
                      !cadResponsavelEmail.trim()
                    ))
                  }
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  Solicitar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE DOCUMENTO PARA CADASTRO */}
      {documentoParaVisualizar && (
        <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[88vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">{documentoParaVisualizar.titulo}</h3>
                  <span className="text-xs text-neutral-400">Versão Oficial {documentoParaVisualizar.versao} — Arena do Competidor</span>
                </div>
              </div>

              <button
                onClick={() => setDocumentoParaVisualizar(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white text-neutral-900 p-6 sm:p-8 rounded-2xl space-y-6 text-xs font-sans leading-relaxed border border-neutral-300">
              <div className="border-b border-neutral-300 pb-4 text-center space-y-2">
                <ContractLogoHeader />
                <h2 className="font-black text-base uppercase text-neutral-900">{documentoParaVisualizar.titulo}</h2>
                <p className="text-[10px] text-neutral-600">{documentoParaVisualizar.descricao}</p>
                <p className="text-[9px] font-mono text-neutral-500">Versão: {documentoParaVisualizar.versao} | Atualizado em: {documentoParaVisualizar.dataAtualizacao}</p>
              </div>

              <div className="space-y-4">
                {documentoParaVisualizar.capitulos.map((cap, i) => (
                  <div key={i} className="space-y-1.5 border-b border-neutral-200 pb-3 last:border-none">
                    <h3 className="font-black text-xs text-neutral-900 uppercase">{cap.titulo}</h3>
                    {cap.subtitulo && <h4 className="font-bold text-[11px] text-orange-600 uppercase">{cap.subtitulo}</h4>}
                    <p className="text-[11px] text-neutral-800 whitespace-pre-line text-justify">{cap.conteudo}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-300 font-mono text-[9px] text-neutral-500 text-center">
                HASH SHA-256: {documentoParaVisualizar.hashSHA256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setDocumentoParaVisualizar(null)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
              >
                Ciente / Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPERIMENTAL */}
      {showExperimental && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in">
            <div className="flex items-center gap-3 text-orange-500 mb-6 pb-2 border-b border-neutral-900">
              <CalendarDays className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Agendar Aula Experimental</h2>
            </div>

            <form onSubmit={handleExperimental} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Nome Completo *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="DIGITE SEU NOME COMPLETO"
                    value={expNome}
                    onChange={(e) => setExpNome(e.target.value.toUpperCase())}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none font-semibold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">WhatsApp *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
                  <input
                    type="tel"
                    required
                    placeholder="(98) 99999-9999"
                    value={expWhatsapp}
                    onChange={(e) => setExpWhatsapp(maskPhone(e.target.value))}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Horário Desejado *</label>
                  <select
                    required
                    value={expHorario}
                    onChange={(e) => setExpHorario(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="">Selecione o Horário...</option>
                    {availableHorarios.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Turma *</label>
                  <select
                    required
                    value={expTurma}
                    onChange={(e) => setExpTurma(e.target.value)}
                    disabled={!expHorario}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {!expHorario ? (
                      <option value="">Selecione o horário 1º...</option>
                    ) : (
                      <>
                        <option value="">Selecione a Turma...</option>
                        {turmasForSelectedHorario.map((t) => (
                          <option key={t.id} value={t.nome}>
                            {t.nome}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {availableHorarios.length === 0 && (
                <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-left font-medium">
                  ⚠️ Nenhuma turma/horário cadastrado pelo administrador no momento.
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowExperimental(false)}
                  className="flex-1 border border-neutral-800 text-neutral-400 py-3 rounded-xl hover:text-white hover:border-neutral-700 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={availableHorarios.length === 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SINALIZAÇÃO DE APROVAÇÃO PENDENTE */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-5 sm:p-8 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-center">
            <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">Solicitação de Cadastro Enviada!</h2>
            
            <p className="text-neutral-300 text-sm mt-4 leading-relaxed">
              Olá, <strong className="text-white">{registeredInfo.nome}</strong>! Sua solicitação de cadastro como <strong className="text-orange-500">{registeredInfo.perfil}</strong> foi registrada no sistema com sucesso.
            </p>

            <p className="text-neutral-400 text-xs mt-3 leading-relaxed">
              Para garantir a segurança da nossa equipe, todos os cadastros precisam ser liberados e homologados antes do primeiro login. 
            </p>

            <div className="mt-5 p-4 bg-[#1a1a1a] rounded-xl border border-neutral-800 text-left space-y-1 text-xs">
              <span className="text-neutral-500 block uppercase font-bold tracking-widest text-[9px]">Aprovação Necessária por</span>
              <p className="text-neutral-200 font-semibold">
                {registeredInfo.responsavel === 'Administrador' ? 'Administrador Geral da Equipe' : `Professor(a) / Instrutor(a): ${registeredInfo.responsavel}`}
              </p>
            </div>

            {registeredInfo.cpf && (
              <div className="mt-3 p-3.5 bg-[#181818] rounded-xl border border-neutral-800 flex items-center justify-between gap-3 text-xs">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">
                    {registeredInfo.isCpfProvisorio ? 'CPF Provisório Atribuído' : 'CPF Cadastrado'}
                  </span>
                  <span className="text-amber-400 font-mono font-black text-sm tracking-wide block">
                    {registeredInfo.cpf}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (registeredInfo.cpf) {
                      navigator.clipboard.writeText(registeredInfo.cpf);
                      setCopiedCpfSuccess(true);
                      setTimeout(() => setCopiedCpfSuccess(false), 2000);
                    }
                  }}
                  className="px-3 py-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-md"
                >
                  {copiedCpfSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-black">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>📋 Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowApprovalModal(false)}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer"
            >
              Entendi, Voltar para o Login
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RECUPERAÇÃO DE ACESSO */}
      {showRecuperarAcesso && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <div className="flex items-center gap-3 text-orange-500 mb-6 pb-2 border-b border-neutral-900">
              <KeyRound className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">Recuperar Acesso</h2>
            </div>
            
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Informe seu CPF cadastrado no sistema para solicitar a recuperação do seu acesso.
            </p>

            <div className="space-y-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">CPF *</label>
                <input
                  type="text"
                  required
                  value={recuperarCpf}
                  onChange={(e) => setRecuperarCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3.5 text-xs focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowRecuperarAcesso(false);
                  setRecuperarCpf('');
                }}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleanCpf = recuperarCpf.replace(/\D/g, '');
                  if (cleanCpf.length !== 11) {
                    alert('Por favor, informe um CPF válido com 11 dígitos.');
                    return;
                  }

                  // Verify if user exists in the database
                  const userExists = usuarios.some(
                    (u) => u.cpf && u.cpf.replace(/\D/g, '') === cleanCpf
                  );

                  if (!userExists) {
                    alert("O CPF informado não foi encontrado em nossa base de dados. Caso ainda não possua cadastro, acesse a opção 'Criar Conta' para realizar seu cadastro.");
                    return;
                  }

                  if (onSubmitRecuperacao) {
                    const success = onSubmitRecuperacao(recuperarCpf);
                    if (success === false) {
                      return;
                    }
                  }

                  alert('Solicitação enviada com sucesso. Aguarde a análise do suporte para reativação da sua conta ou redefinição da sua senha.');
                  setShowRecuperarAcesso(false);
                  setRecuperarCpf('');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-orange-500/15 transition cursor-pointer"
              >
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELA DE ALTERAÇÃO OBRIGATÓRIA DE SENHA */}
      {showMandatoryReset && userToReset && (
        <div className="fixed inset-0 bg-[#0f0f0f] z-[1100] overflow-y-auto">
          <div className="min-h-full w-full flex flex-col items-center justify-center p-4 py-6 sm:py-8 relative">
            <div className="absolute inset-0 bg-radial-at-t from-orange-950/20 via-transparent to-transparent pointer-events-none login-bg-glow" />
            
            <div className="bg-[#141414] rounded-3xl p-5 sm:p-8 max-w-md w-full border border-neutral-800 shadow-2xl relative z-10 animate-fade-in my-4 text-left">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20 overflow-hidden">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-extrabold text-white text-center tracking-tight mb-2 uppercase">
              Alteração Obrigatória de Senha
            </h2>
            <p className="text-neutral-400 text-xs text-center leading-relaxed mb-6">
              Detectamos que você está acessando o sistema com uma senha temporária. Para sua segurança, você deve definir uma nova senha personalizada agora.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const trimmedNova = novaSenhaMandataria.trim();
              const trimmedConfirm = confirmacaoSenhaMandataria.trim();
              if (trimmedNova.length < 3) {
                alert('A nova senha deve ter no mínimo 3 caracteres.');
                return;
              }
              if (trimmedNova === '1234567') {
                alert('A nova senha não pode ser igual à senha temporária 1234567.');
                return;
              }
              if (trimmedNova !== trimmedConfirm) {
                alert('As senhas informadas não coincidem. Verifique a confirmação.');
                return;
              }
              
              if (onMandatoryPasswordChange) {
                onMandatoryPasswordChange(userToReset.id, trimmedNova);
              }
              
              alert('✓ Senha atualizada com sucesso! Seu acesso foi liberado.');
              
              // Proceed with successful login
              onLoginSuccess({ ...userToReset, senha: trimmedNova });
              
              // Reset states
              setShowMandatoryReset(false);
              setUserToReset(null);
              setNovaSenhaMandataria('');
              setConfirmacaoSenhaMandataria('');
            }} className="space-y-4">
              
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showNovaSenhaMandataria ? 'text' : 'password'}
                    required
                    value={novaSenhaMandataria}
                    onChange={(e) => setNovaSenhaMandataria(e.target.value)}
                    placeholder="Defina sua nova senha"
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-3.5 pr-11 text-sm focus:border-orange-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNovaSenhaMandataria(!showNovaSenhaMandataria)}
                    className="absolute right-3.5 top-2.5 text-neutral-500 hover:text-white transition"
                  >
                    {showNovaSenhaMandataria ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmacaoSenhaMandataria ? 'text' : 'password'}
                    required
                    value={confirmacaoSenhaMandataria}
                    onChange={(e) => setConfirmacaoSenhaMandataria(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 pl-3.5 pr-11 text-sm focus:border-orange-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmacaoSenhaMandataria(!showConfirmacaoSenhaMandataria)}
                    className="absolute right-3.5 top-2.5 text-neutral-500 hover:text-white transition"
                  >
                    {showConfirmacaoSenhaMandataria ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition cursor-pointer mt-2"
              >
                Salvar Alteração & Acessar
              </button>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* MODAL BAIXAR APK */}
      {showDownloadApkModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-center">
            {/* Botão Fechar X */}
            <button
              type="button"
              onClick={() => setShowDownloadApkModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1.5 rounded-full hover:bg-neutral-800 cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo do Arena do Competidor */}
            <div 
              className={`w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mx-auto mb-4 rounded-2xl overflow-hidden p-1 shadow-lg border transition-all duration-300 ${
                getLogoContainerStyle(activeTheme || 'orange')
              }`}
            >
              {logoError ? (
                <Shield className={`w-12 h-12 ${activeTheme === 'white' ? 'text-neutral-400' : 'text-white/90'}`} />
              ) : (
                <img 
                  src={getLogoSrc(activeTheme || 'orange')} 
                  alt="Arena do Competidor" 
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain" 
                />
              )}
            </div>

            {/* Título Principal */}
            <h2 className="text-lg sm:text-xl font-extrabold text-white mb-2 leading-snug">
              Agora o Arena do Competidor também está disponível para Android!
            </h2>

            {/* Mensagem Informativa */}
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-3">
              Tenha mais praticidade e facilidade para acessar o Arena do Competidor diretamente pelo seu dispositivo Android.
            </p>

            <p className="text-neutral-400 text-xs leading-relaxed mb-6 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80">
              Instale o aplicativo oficial do Arena do Competidor no seu dispositivo Android.
            </p>

            {/* Botões do Modal */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleDownloadApk}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                BAIXAR APK
              </button>

              <button
                type="button"
                onClick={() => setShowDownloadApkModal(false)}
                className="w-full bg-transparent border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs active:scale-[0.98]"
              >
                VOLTAR
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <AiCentralModal onClose={() => setShowAiModal(false)} />
      )}
      </div>
    </div>
  );
}

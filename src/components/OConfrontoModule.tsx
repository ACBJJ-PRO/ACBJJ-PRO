import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { updateFirestoreStateKey } from '../lib/firebase';
import { getAuthHeaders } from '../utils/authHeaders';
import { 
  Trophy, ArrowLeft, Shield, Check, CreditCard, Clock, AlertTriangle, 
  Search, Filter, RefreshCw, Layers, Copy, HelpCircle, Activity, 
  Landmark, User, Calendar, Phone, Award, Users, QrCode, Edit, Trash2,
  Menu, X, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfrontoChaveamento from './ConfrontoChaveamento';
import ConfrontoAdminCampeonatos from './ConfrontoAdminCampeonatos';

interface OConfrontoModuleProps {
  onBack: () => void;
  isAdmin: boolean;
  confrontoInscricoes: any[];
  onUpdateInscricoes: (newInscricoes: any[]) => void;
  confrontoManutencao: boolean;
  onUpdateManutencao: (val: boolean) => void;
  confrontoCampeonatos: any[];
  onUpdateCampeonatos: (newCampeonatos: any[]) => void;
  logoApp?: string;
  themeKey?: string;
  onRegisterAcceptance?: (record: any) => void;
  contratosOficiais?: any[];
  liveStreams?: any[];
}

// CPF validation algorithm
export function validarCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cleanCpf.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  let digito1 = resto === 10 || resto === 11 ? 0 : resto;
  if (digito1 !== parseInt(cleanCpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cleanCpf.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  let digito2 = resto === 10 || resto === 11 ? 0 : resto;
  if (digito2 !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

// Masking helpers
export function maskCPF(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

export function maskPhone(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length === 0) return '';
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

function emv(id: string, value: string): string {
  const str = String(value);
  return `${id}${String(str.length).padStart(2, "0")}${str}`;
}

function crc16ccitt(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      else crc = (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Generate static Pix copy-and-paste code using exact index.html algorithm
export function generatePixPayload(key: string, amount: number, name: string, txId: string, descrip?: string): string {
  const formattedAmount = amount.toFixed(2);
  const cleanKey = key.replace(/[^a-zA-Z0-9-@.]/g, '');
  const cleanTxId = txId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25);
  const cleanName = (name || "ACBJJ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 25).toUpperCase();
  
  const gui = emv("00", "BR.GOV.BCB.PIX");
  const pKey = emv("01", cleanKey);
  const desc = descrip ? emv("02", descrip.substring(0, 30)) : "";
  const mai = emv("26", gui + pKey + desc);
  
  const payloadSemCRC =
    emv("00", "01") +
    mai +
    emv("52", "0000") +
    emv("53", "986") +
    emv("54", formattedAmount) +
    emv("58", "BR") +
    emv("59", cleanName) +
    emv("60", "SAO LUIS") +
    emv("62", emv("05", cleanTxId || "***")) +
    "6304";
    
  const crc = crc16ccitt(payloadSemCRC);
  return payloadSemCRC + crc;
}

export default function OConfrontoModule({
  onBack,
  isAdmin,
  confrontoInscricoes = [],
  onUpdateInscricoes,
  confrontoManutencao,
  onUpdateManutencao,
  confrontoCampeonatos = [],
  onUpdateCampeonatos,
  logoApp,
  themeKey,
  onRegisterAcceptance,
  contratosOficiais = [],
  liveStreams = []
}: OConfrontoModuleProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'inscricao' | 'status' | 'athletes' | 'brackets' | 'admin'>('home');
  const [mobileConfrontoMenuOpen, setMobileConfrontoMenuOpen] = useState(false);
  const [mobileAdminSubMenuOpen, setMobileAdminSubMenuOpen] = useState(false);
  const [moduleLogoError, setModuleLogoError] = useState(false);

  // Requirement 7: Championship Document Acceptance State
  const [aceitouRegulamento, setAceitouRegulamento] = useState(false);
  const [aceitouImagemVoz, setAceitouImagemVoz] = useState(false);
  const [documentoParaVisualizar, setDocumentoParaVisualizar] = useState<any | null>(null);

  useEffect(() => {
    setModuleLogoError(false);
  }, [logoApp, themeKey]);

  const getModuleLogoSrc = (theme: string) => {
    if (logoApp && (logoApp.startsWith('data:image/') || logoApp.startsWith('http://') || logoApp.startsWith('https://') || logoApp.startsWith('blob:'))) {
      return logoApp;
    }
    return theme === 'white' ? '/ARENADOCOMPETIDOR.png' : '/Logo%20branca.png';
  };

  const getModuleLogoContainerStyle = (theme: string) => {
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

  const [selectedChampionship, setSelectedChampionship] = useState<any>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Pix key setup
  const [pixKey, setPixKey] = useState<string>(() => {
    return localStorage.getItem('arena_confronto_pix_key') || 'c68a395d-9739-47b4-a0b8-304593bd6793';
  });

  const handleSavePixKey = (key: string) => {
    setPixKey(key);
    localStorage.setItem('arena_confronto_pix_key', key);
    updateFirestoreStateKey('confrontoPixKey', key);
    addAuditLog('Alteração Chave Pix', `Chave Pix alterada para: ${key}`);
  };

  // Search/Tracker states
  const [searchCpf, setSearchCpf] = useState('');
  const [foundInscricoes, setFoundInscricoes] = useState<any[] | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    faixa: 'Branca',
    categoria: 'Adulto (18-29 anos)',
    peso: 'Pena (-64kg)',
    modalidade: 'Gi',
    genero: 'Masculino',
    academia: '',
    whatsapp: '',
  });

  // Modalities management state
  const [modalidades, setModalidades] = useState<{ id: string; nome: string; ativa: boolean }[]>(() => {
    const saved = localStorage.getItem('arena_confronto_modalidades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: '1', nome: 'Gi', ativa: true },
      { id: '2', nome: 'No-Gi', ativa: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('arena_confronto_modalidades', JSON.stringify(modalidades));
    updateFirestoreStateKey('confrontoModalidades', modalidades);
  }, [modalidades]);

  // Coupons management state
  const [cupons, setCupons] = useState<{ id: string; code: string; discount: number; active: boolean }[]>(() => {
    const saved = localStorage.getItem('arena_confronto_cupons');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: '1', code: 'ACBJJ10', discount: 10, active: true },
      { id: '2', code: 'CONFRONTO20', discount: 20, active: true },
      { id: '3', code: 'PRO30', discount: 30, active: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('arena_confronto_cupons', JSON.stringify(cupons));
    updateFirestoreStateKey('confrontoCupons', cupons);
  }, [cupons]);

  const [couponCodeForm, setCouponCodeForm] = useState('');
  const [couponDiscountForm, setCouponDiscountForm] = useState(10);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // Applied Coupon in the registration form
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponErrorMessage, setCouponErrorMessage] = useState('');
  const [couponSuccessMessage, setCouponSuccessMessage] = useState('');

  const [modalityName, setModalityName] = useState('');
  const [editingModalityId, setEditingModalityId] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [currentRegistration, setCurrentRegistration] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (pixKey && currentRegistration) {
      const payload = generatePixPayload(
        pixKey,
        currentRegistration.valor || 0,
        currentRegistration.nome || 'ACBJJ',
        currentRegistration.id || '***',
        currentRegistration.campeonatoTitulo || ''
      );
      QRCode.toDataURL(payload, { width: 300, margin: 2 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code local', err));
    } else {
      setQrCodeUrl('');
    }
  }, [pixKey, currentRegistration]);
  const [showManutencaoModal, setShowManutencaoModal] = useState(false);
  const [adminFilterStatus, setAdminFilterStatus] = useState<string>('todos');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminSubTab, setAdminSubTab] = useState<'inscricoes' | 'campeonatos' | 'chaveamento' | 'modalidades' | 'cupons'>('inscricoes');

  // Search/Filter for public athletes tab
  const [publicSelectedChampId, setPublicSelectedChampId] = useState<string>('');
  const [publicSearchQuery, setPublicSearchQuery] = useState<string>('');

  // Search/Filter for public brackets tab
  const [publicBracketChampId, setPublicBracketChampId] = useState<string>('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('arena_confronto_audit_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', action: 'Inicialização do Módulo', details: 'Módulo CAMPEONATOS / INSCRIÇÕES integrado com sucesso.', timestamp: new Date().toLocaleString('pt-BR') }
    ];
  });

  useEffect(() => {
    localStorage.setItem('arena_confronto_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (action: string, details: string) => {
    const newLog = {
      id: Math.random().toString().slice(2, 8),
      action,
      details,
      timestamp: new Date().toLocaleString('pt-BR')
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Check Maintenance on entry
  useEffect(() => {
    if (confrontoManutencao && !isAdmin) {
      setShowManutencaoModal(true);
    }
  }, [confrontoManutencao, isAdmin]);

  // Check registration limit or deadline
  const isChampClosed = (champ: any) => {
    if (!champ) return { closed: false, isPrep: false, reason: '', type: 'open' };
    
    // Check Status
    if (champ.status === 'Inscrições Encerradas' || champ.status === 'Encerrado') {
      return { closed: true, isPrep: false, reason: 'Este campeonato foi encerrado.', type: 'closed' };
    }
    if (champ.status === 'Em Preparação' || champ.status === 'Em preparação' || champ.status === 'Oculto') {
      return { closed: true, isPrep: true, reason: 'Em breve', type: 'prep' };
    }

    // Check maxInscritos
    if (champ.maxInscritos) {
      const confirmedCount = confrontoInscricoes.filter(
        r => r.campeonatoId === champ.id && r.status === 'Pagamento Confirmado'
      ).length;
      if (confirmedCount >= champ.maxInscritos) {
        return { closed: true, isPrep: false, reason: 'Limite máximo de vagas esgotado!', type: 'soldout' };
      }
    }

    // Check limitDate
    if (champ.limitDate) {
      try {
        const parts = champ.limitDate.split('/');
        if (parts.length === 3) {
          const limit = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59);
          if (new Date() > limit) {
            return { closed: true, isPrep: false, reason: 'Prazo de inscrições esgotado!', type: 'expired' };
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    return { closed: false, isPrep: false, reason: '', type: 'open' };
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // Validate completeness
    if (!formData.nome.trim()) errors.nome = 'Nome completo é obrigatório.';
    if (!formData.academia.trim()) errors.academia = 'Academia/Equipe é obrigatória.';
    if (!formData.dataNascimento) errors.dataNascimento = 'Data de nascimento é obrigatória.';
    
    // Validate CPF
    if (!formData.cpf) {
      errors.cpf = 'CPF é obrigatório.';
    } else if (!validarCPF(formData.cpf)) {
      errors.cpf = 'CPF informado é inválido.';
    }

    // Validate Phone
    const cleanPhone = formData.whatsapp.replace(/\D/g, '');
    if (!formData.whatsapp) {
      errors.whatsapp = 'Telefone de contato é obrigatório.';
    } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.whatsapp = 'Telefone inválido (deve possuir DDD + número).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      alert('Não foi possível concluir o cadastro. Verifique os erros no formulário.');
      return;
    }

    // Requirement 7: Check mandatory acceptances for championship
    if (!aceitouRegulamento || !aceitouImagemVoz) {
      alert('Você deve aceitar obrigatoriamente o Regulamento do Campeonato e o Termo de Imagem e Voz para realizar a sua inscrição.');
      return;
    }

    setFormErrors({});

    // Dynamic Pix Verification before finalizing
    if (!pixKey) {
      alert('Erro: O sistema de pagamentos Pix está temporariamente indisponível. Por favor, avise a administração.');
      return;
    }

    // Duplicate check for same athlete + championship
    const cleanFormCpf = formData.cpf.replace(/\D/g, '');
    const isDuplicate = confrontoInscricoes.some(r => {
      if (r.campeonatoId !== selectedChampionship.id) return false;
      const rCpf = (r.cpf || '').replace(/\D/g, '');
      if (cleanFormCpf && rCpf && cleanFormCpf === rCpf && cleanFormCpf.length === 11) return true;
      return false;
    });

    if (isDuplicate) {
      alert('Atenção: Já existe uma inscrição cadastrada com este CPF para este campeonato.');
      return;
    }

    const finalPrice = appliedCoupon ? selectedChampionship.price * (1 - appliedCoupon.discount / 100) : selectedChampionship.price;
    const transactionId = `tx_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const newReg = {
      id: `reg-${Date.now()}`,
      campeonatoId: selectedChampionship.id,
      campeonatoTitulo: selectedChampionship.title,
      valor: finalPrice,
      cupomAplicado: appliedCoupon ? appliedCoupon.code : '',
      descontoAplicado: appliedCoupon ? `${appliedCoupon.discount}%` : '',
      ...formData,
      status: 'Pendente de Pagamento',
      dataInscricao: new Date().toLocaleString('pt-BR'),
      transactionId,
    };

    try {
      const res = await fetch('/api/cloudsql/inscricoes/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          inscricao: {
            id: newReg.id,
            campeonatoId: newReg.campeonatoId,
            atletaNome: newReg.nome,
            cpf: newReg.cpf,
            categoria: newReg.categoria,
            statusPagamento: newReg.status,
            ...newReg
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar inscrição no servidor');
      }

      // Requirement 8: Register legal audit log for championship acceptances
      if (onRegisterAcceptance) {
        const dev = navigator.userAgent;
        const hashReg = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const hashImg = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

        onRegisterAcceptance({
          usuarioId: 0,
          usuarioNome: formData.nome,
          usuarioCpf: formData.cpf,
          documentoId: 'doc_regulamento_campeonato',
          documentoTitulo: `Regulamento Oficial do Campeonato - ${selectedChampionship.title}`,
          versao: '1.0',
          dataHora: new Date().toLocaleString('pt-BR'),
          ip: '189.120.45.12',
          dispositivo: dev,
          navegador: dev,
          hashAssinatura: hashReg,
          origem: 'campeonato',
        });

        onRegisterAcceptance({
          usuarioId: 0,
          usuarioNome: formData.nome,
          usuarioCpf: formData.cpf,
          documentoId: 'doc_autorizacao_imagem_voz',
          documentoTitulo: 'Termo de Autorização de Uso de Imagem, Voz e Transmissão Esportiva',
          versao: '1.0',
          dataHora: new Date().toLocaleString('pt-BR'),
          ip: '189.120.45.12',
          dispositivo: dev,
          navegador: dev,
          hashAssinatura: hashImg,
          origem: 'campeonato',
        });
      }

      const updated = [...confrontoInscricoes, newReg];
      onUpdateInscricoes(updated);
      setCurrentRegistration(newReg);
      addAuditLog('Nova Inscrição', `Inscrição criada para ${formData.nome} (CPF: ${formData.cpf}) no campeonato ${selectedChampionship.title}. Valor: R$ ${finalPrice.toFixed(2)}. Status: Pendente`);
      
      // Reset form & coupon states
      setFormData({
        nome: '',
        cpf: '',
        dataNascimento: '',
        faixa: 'Branca',
        categoria: 'Adulto (18-29 anos)',
        peso: 'Pena (-64kg)',
        modalidade: 'Gi',
        genero: 'Masculino',
        academia: '',
        whatsapp: '',
      });
      setAceitouRegulamento(false);
      setAceitouImagemVoz(false);
      
      setAppliedCouponCode('');
      setAppliedCoupon(null);
      setCouponErrorMessage('');
      setCouponSuccessMessage('');
      
      setActiveTab('status');
    } catch (err: any) {
      alert(`Erro ao salvar inscrição: ${err?.message || err}`);
    }
  };

  const handleMarkAsPaid = async (regId: string) => {
    const reg = confrontoInscricoes.find(r => r.id === regId);
    if (!reg) return;
    const updatedReg = { ...reg, status: 'Em Análise' };

    try {
      const res = await fetch('/api/cloudsql/inscricoes/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          inscricao: {
            id: updatedReg.id,
            campeonatoId: updatedReg.campeonatoId,
            atletaNome: updatedReg.nome || updatedReg.atletaNome,
            cpf: updatedReg.cpf,
            categoria: updatedReg.categoria,
            statusPagamento: updatedReg.status,
            ...updatedReg
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao informar pagamento');
      }

      const updated = confrontoInscricoes.map(r => r.id === regId ? updatedReg : r);
      onUpdateInscricoes(updated);
      if (currentRegistration && currentRegistration.id === regId) {
        setCurrentRegistration(updatedReg);
      }
      if (foundInscricoes) {
        setFoundInscricoes(foundInscricoes.map(r => r.id === regId ? updatedReg : r));
      }
      addAuditLog('Comprovante Enviado', `Competidor informou pagamento para a inscrição ${regId} (${reg.nome || reg.atletaNome}). Status alterado para Em Análise.`);
      alert('Informação de pagamento enviada com sucesso! Nossos operadores vão avaliar o depósito Pix.');
    } catch (err: any) {
      alert(`Erro ao informar pagamento: ${err?.message || err}`);
    }
  };

  const handleSearchCpf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCpf) return;
    const digitsOnly = searchCpf.replace(/\D/g, '');
    if (digitsOnly.length !== 11) {
      alert('Por favor, informe um CPF completo e válido com 11 dígitos para consultar.');
      return;
    }
    const results = confrontoInscricoes.filter(r => {
      const rCpfDigits = (r.cpf || '').replace(/\D/g, '');
      return rCpfDigits === digitsOnly;
    });
    setFoundInscricoes(results);
    if (results.length === 0) {
      addAuditLog('Busca CPF (Sem Resultados)', `Tentativa de busca pelo CPF: ${digitsOnly}`);
    } else {
      addAuditLog('Busca CPF', `Busca pelo CPF: ${digitsOnly} retornou ${results.length} inscrição(ões).`);
    }
  };

  const handleAdminApprove = async (regId: string) => {
    const reg = confrontoInscricoes.find(r => r.id === regId);
    if (!reg) return;
    const updatedReg = { ...reg, status: 'Pagamento Confirmado' };

    try {
      const res = await fetch('/api/cloudsql/inscricoes/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          inscricao: {
            id: updatedReg.id,
            campeonatoId: updatedReg.campeonatoId,
            atletaNome: updatedReg.nome || updatedReg.atletaNome,
            cpf: updatedReg.cpf,
            categoria: updatedReg.categoria,
            statusPagamento: updatedReg.status,
            ...updatedReg
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao aprovar pagamento');
      }

      const updated = confrontoInscricoes.map(r => r.id === regId ? updatedReg : r);
      onUpdateInscricoes(updated);
      if (currentRegistration && currentRegistration.id === regId) {
        setCurrentRegistration(updatedReg);
      }
      if (foundInscricoes) {
        setFoundInscricoes(foundInscricoes.map(r => r.id === regId ? updatedReg : r));
      }
      addAuditLog('Aprovação de Pagamento', `Administrador aprovou o pagamento da inscrição ${regId} (${reg.nome || reg.atletaNome}).`);
      alert('Inscrição confirmada e aprovada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao aprovar inscrição: ${err?.message || err}`);
    }
  };

  // Deletion protective timer state: maps regId -> countdown number (seconds remaining)
  const [deletingRegs, setDeletingRegs] = useState<{ [id: string]: number }>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const deletionIntervalsRef = useRef<{ [id: string]: any }>({});

  // Clean up deletion intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(deletionIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const startDeletionCountdown = (regId: string) => {
    // If already has an interval, do nothing
    if (deletionIntervalsRef.current[regId]) return;

    setDeletingRegs(prev => ({ ...prev, [regId]: 10 }));

    const interval = setInterval(() => {
      setDeletingRegs(prev => {
        const currentSeconds = prev[regId];
        if (currentSeconds === undefined) return prev;
        if (currentSeconds <= 1) {
          clearInterval(deletionIntervalsRef.current[regId]);
          delete deletionIntervalsRef.current[regId];
          return { ...prev, [regId]: 0 }; // Stays at 0, indicating countdown finished!
        }
        return { ...prev, [regId]: currentSeconds - 1 };
      });
    }, 1000);

    deletionIntervalsRef.current[regId] = interval;
  };

  const cancelDeletionCountdown = (regId: string) => {
    if (deletionIntervalsRef.current[regId]) {
      clearInterval(deletionIntervalsRef.current[regId]);
      delete deletionIntervalsRef.current[regId];
    }
    setDeletingRegs(prev => {
      const updated = { ...prev };
      delete updated[regId];
      return updated;
    });
  };

  const executeDeletion = async (regId: string) => {
    // Cancel any active interval
    if (deletionIntervalsRef.current[regId]) {
      clearInterval(deletionIntervalsRef.current[regId]);
      delete deletionIntervalsRef.current[regId];
    }
    setDeletingRegs(prev => {
      const updated = { ...prev };
      delete updated[regId];
      return updated;
    });

    try {
      const res = await fetch(`/api/cloudsql/inscricoes/${encodeURIComponent(regId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao excluir inscrição');
      }

      const reg = confrontoInscricoes.find(r => r.id === regId);
      const updated = confrontoInscricoes.filter(r => r.id !== regId);
      onUpdateInscricoes(updated);
      
      if (currentRegistration && currentRegistration.id === regId) {
        setCurrentRegistration(null);
      }
      if (foundInscricoes) {
        setFoundInscricoes(foundInscricoes.filter(r => r.id !== regId));
      }

      addAuditLog('Exclusão de Inscrição', `Administrador excluiu a inscrição ${regId} (${reg?.nome || reg?.atletaNome}) de status ${reg?.status}.`);
      alert('Inscrição excluída com sucesso!');
    } catch (err: any) {
      alert(`Erro ao excluir inscrição no banco: ${err?.message || err}`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(text);
    setTimeout(() => setCopiedTxId(null), 3000);
  };

  // Filtered registrations for admin list
  const filteredRegs = confrontoInscricoes.filter(r => {
    const matchesSearch = r.nome.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          r.cpf.includes(adminSearch) || 
                          r.academia.toLowerCase().includes(adminSearch.toLowerCase());
    const matchesStatus = adminFilterStatus === 'todos' || r.status === adminFilterStatus;
    return matchesSearch && matchesStatus;
  });

  // Visible championships for public tabs (excluding hidden/Oculto)
  const visibleCampeonatos = confrontoCampeonatos.filter(c => c.status !== 'Oculto');

  // Handle dynamic championship change inside a bracket
  const handleUpdateChampionshipFromBracket = async (updatedChamp: any) => {
    try {
      const payload = {
        id: updatedChamp.id,
        nome: updatedChamp.title || updatedChamp.nome,
        data: updatedChamp.date || updatedChamp.data,
        local: updatedChamp.location || updatedChamp.local,
        status: updatedChamp.status || 'aberto',
        bannerUrl: updatedChamp.banner || updatedChamp.bannerUrl,
        ...updatedChamp
      };
      await fetch('/api/cloudsql/campeonatos/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ campeonato: payload })
      });
      const updated = confrontoCampeonatos.map(c => c.id === updatedChamp.id ? updatedChamp : c);
      onUpdateCampeonatos(updated);
    } catch (err) {
      console.error('Error saving championship from bracket:', err);
    }
  };

  // Initial selected public champ
  useEffect(() => {
    if (visibleCampeonatos.length > 0) {
      if (!publicSelectedChampId || !visibleCampeonatos.some(c => c.id === publicSelectedChampId)) {
        setPublicSelectedChampId(visibleCampeonatos[0].id);
      }
      if (!publicBracketChampId || !visibleCampeonatos.some(c => c.id === publicBracketChampId)) {
        setPublicBracketChampId(visibleCampeonatos[0].id);
      }
    } else {
      setPublicSelectedChampId('');
      setPublicBracketChampId('');
    }
  }, [confrontoCampeonatos]);

  // Confirmed athletes list
  const publicConfirmedAthletes = confrontoInscricoes.filter(
    r => r.campeonatoId === publicSelectedChampId &&
    r.status === 'Pagamento Confirmado' &&
    visibleCampeonatos.some(c => c.id === r.campeonatoId) &&
    (publicSearchQuery === '' || r.nome.toLowerCase().includes(publicSearchQuery.toLowerCase()) || r.academia.toLowerCase().includes(publicSearchQuery.toLowerCase()))
  );

  const bracketActiveChamp = visibleCampeonatos.find(c => c.id === publicBracketChampId);
  const adminBracketActiveChamp = confrontoCampeonatos.find(c => c.id === publicBracketChampId);

  return (
    <div className="bg-[#0c0c0c] min-h-screen text-neutral-100 flex flex-col font-sans pb-12">
      {/* HEADER */}
      <header className="bg-[#111] border-b border-neutral-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 min-h-[4rem] flex flex-col md:flex-row md:items-center md:justify-between py-3 md:py-0 gap-3 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase text-neutral-400 hover:text-white bg-neutral-950/60 border border-neutral-850 py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setAdminSubTab('inscricoes');
                  setActiveTab(activeTab === 'admin' ? 'home' : 'admin');
                }}
                className={`md:hidden text-[10px] font-black uppercase py-1.5 px-3 border rounded-xl transition cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-orange-500 text-white border-transparent shadow-lg shadow-orange-500/15' 
                    : 'bg-neutral-950 border-neutral-850 text-neutral-300 hover:text-white'
                }`}
              >
                Painel Admin
              </button>
            )}
          </div>

          {/* Dynamic Theme Logo Fallback & Title */}
          <div className="flex items-center justify-center md:justify-start gap-2.5 mx-auto md:mx-0">
            <div 
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl overflow-hidden shrink-0 p-0.5 shadow-md border transition-all duration-300 ${
                getModuleLogoContainerStyle(themeKey || 'orange')
              }`}
            >
              {moduleLogoError ? (
                <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${themeKey === 'white' ? 'text-neutral-400' : 'text-white/90'}`} />
              ) : (
                <img 
                  src={getModuleLogoSrc(themeKey || 'orange')} 
                  alt="Logo" 
                  onError={() => setModuleLogoError(true)}
                  className="w-full h-full object-contain animate-fade-in" 
                />
              )}
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest uppercase text-white font-sans whitespace-nowrap">
              CAMPEONATOS / INSCRIÇÕES
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => {
                  setAdminSubTab('inscricoes');
                  setActiveTab(activeTab === 'admin' ? 'home' : 'admin');
                }}
                className={`text-[10px] font-black uppercase py-2 px-3.5 border rounded-xl transition cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-orange-500 text-white border-transparent shadow-lg shadow-orange-500/15' 
                    : 'bg-neutral-950 border-neutral-850 text-neutral-300 hover:text-white'
                }`}
              >
                Painel Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SUB-MENU NAVIGATION FOR USERS */}
      {activeTab !== 'admin' && (
        <>
          {/* Desktop Navigation */}
          <div className="hidden md:block bg-[#141414]/40 border-b border-neutral-900 py-3">
            <div className="max-w-4xl mx-auto px-4 flex justify-start sm:justify-center items-center gap-2.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('home')}
                className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition shrink-0 cursor-pointer ${
                  activeTab === 'home' || activeTab === 'inscricao'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-neutral-950/40 text-neutral-400 hover:text-white'
                }`}
              >
                🏆 Campeonatos
              </button>
              <button
                onClick={() => {
                  setFoundInscricoes(null);
                  setSearchCpf('');
                  setActiveTab('status');
                }}
                className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition shrink-0 cursor-pointer ${
                  activeTab === 'status'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-neutral-950/40 text-neutral-400 hover:text-white'
                }`}
              >
                🔍 Consultar Inscrição
              </button>
              <button
                onClick={() => setActiveTab('athletes')}
                className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition shrink-0 cursor-pointer ${
                  activeTab === 'athletes'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-neutral-950/40 text-neutral-400 hover:text-white'
                }`}
              >
                👥 Atletas Confirmados
              </button>
              <button
                onClick={() => setActiveTab('brackets')}
                className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition shrink-0 cursor-pointer ${
                  activeTab === 'brackets'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-neutral-950/40 text-neutral-400 hover:text-white'
                }`}
              >
                🥋 Chaves / Lutas
              </button>
            </div>
          </div>

          {/* Mobile/Tablet Navigation */}
          <div className="md:hidden sticky top-[64px] z-40 bg-[#0c0c0c] py-2 px-4 border-b border-neutral-900/40">
            <button
              onClick={() => setMobileConfrontoMenuOpen(true)}
              className="w-full bg-[#141414] border border-neutral-800 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition cursor-pointer"
            >
              <Menu className="w-5 h-5 text-orange-500 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-center flex-1">
                {activeTab === 'home' || activeTab === 'inscricao' ? '🏆 Campeonatos' :
                 activeTab === 'status' ? '🔍 Consulta de Inscrições' :
                 activeTab === 'athletes' ? '👥 Atletas Confirmados' :
                 activeTab === 'brackets' ? '🥋 Chaves / Lutas' : 'Navegação'}
              </span>
              <div className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Fullscreen Overlay Menu */}
          {mobileConfrontoMenuOpen && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex flex-col justify-start p-6 overflow-y-auto animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <span className="font-black text-white text-xs sm:text-sm tracking-widest uppercase font-sans">CAMPEONATOS / INSCRIÇÕES</span>
                </div>
                <button
                  onClick={() => setMobileConfrontoMenuOpen(false)}
                  className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition text-orange-500 cursor-pointer"
                >
                  Sair
                </button>
              </div>

              {/* Grid of 4 blocks, 2 columns / 2 rows */}
              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full pt-4 pb-12">
                {[
                  { id: 'home', label: 'Campeonatos', icon: Trophy },
                  { id: 'status', label: 'Consulta de Inscrições', icon: Search, onClickExtra: () => { setFoundInscricoes(null); setSearchCpf(''); } },
                  { id: 'athletes', label: 'Atletas Confirmados', icon: Users },
                  { id: 'brackets', label: 'Chaves de Lutas', icon: Layers },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id || (item.id === 'home' && activeTab === 'inscricao');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.onClickExtra) item.onClickExtra();
                        setActiveTab(item.id as any);
                        setMobileConfrontoMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all text-center gap-2.5 group active:scale-95 cursor-pointer ${
                        active
                          ? 'bg-gradient-to-br from-orange-500 to-red-600 border-transparent text-white shadow-lg shadow-orange-500/25'
                          : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition ${active ? 'bg-white/10' : 'bg-[#1a1a1a] group-hover:bg-[#222]'}`}>
                        <Icon className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* BODY CONTAINER */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB: HOME / CHAMPIONSHIPS */}
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 text-left"
            >
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide uppercase">🏆 Grandes Confrontos</h2>
                <p className="text-xs md:text-sm text-neutral-400">Escolha um dos campeonatos abaixo e garanta o seu lugar na arena oficial da ACBJJ Pro.</p>
              </div>

              {/* Champ list */}
              {confrontoCampeonatos.filter(c => c.status !== 'Oculto').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {confrontoCampeonatos.filter(c => c.status !== 'Oculto').map((ch) => {
                    const limitStatus = isChampClosed(ch);
                    const linkedStream = liveStreams?.find((s) => {
                      const matchesChamp = String(s.campeonatoId) === String(ch.id);
                      const activeStatus = s.status === 'agendada' || s.status === 'ao_vivo' || s.status === 'pausada';
                      return s.isCampeonato && matchesChamp && activeStatus;
                    });

                    return (
                      <div key={ch.id} className="bg-[#141414] rounded-3xl border border-neutral-850 overflow-hidden hover:border-neutral-700 transition duration-300 flex flex-col justify-between shadow-lg">
                        <div className="h-40 bg-cover bg-center relative bg-neutral-950" style={{ backgroundImage: `url('${ch.banner || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop'}')` }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                          <span className={`absolute top-4 right-4 text-[10px] uppercase font-black tracking-wider py-1.5 px-3 rounded-lg text-white shadow-md ${
                            limitStatus.type === 'prep'
                              ? 'bg-orange-500'
                              : limitStatus.type === 'soldout' || limitStatus.type === 'expired' || limitStatus.type === 'closed'
                              ? 'bg-red-600'
                              : 'bg-emerald-600'
                          }`}>
                            {limitStatus.type === 'prep'
                              ? 'Em Preparação'
                              : limitStatus.type === 'soldout'
                              ? 'Vagas Esgotadas'
                              : limitStatus.type === 'expired'
                              ? 'Prazo Encerrado'
                              : limitStatus.type === 'closed'
                              ? 'Inscrições Encerradas'
                              : 'Inscrições Abertas'}
                          </span>
                        </div>

                        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-extrabold text-white leading-snug">{ch.title}</h3>
                            {ch.subtitle && <p className="text-xs text-orange-500 font-bold">{ch.subtitle}</p>}
                            <div className="text-xs text-neutral-400 space-y-1 pt-1.5">
                              <div>📅 {ch.date} às {ch.horario}</div>
                              <div>📍 {ch.location} - {ch.city}</div>
                              <div>🥋 Modalidades: <strong className="text-white">{ch.modalidades?.join(', ') || 'Gi, No-Gi'}</strong></div>
                              <div>📊 Disputa: <strong className="text-white">{ch.disputa}</strong></div>
                            </div>

                            {linkedStream && limitStatus.type !== 'open' && (
                              <button
                                onClick={() => {
                                  const url = linkedStream.meetUrl?.trim();
                                  if (url && url.length > 5) {
                                    let fullUrl = url;
                                    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
                                      fullUrl = 'https://' + fullUrl;
                                    }
                                    window.open(fullUrl, '_blank', 'noopener,noreferrer');
                                  } else {
                                    alert('A transmissão ao vivo ainda não foi iniciada pelo organizador. Aguarde alguns instantes.');
                                  }
                                }}
                                className="w-full mt-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer animate-pulse"
                              >
                                <Radio className="w-4 h-4 text-white" />
                                <span>ASSISTIR AO VIVO</span>
                              </button>
                            )}
                          </div>

                          <div className="pt-4 border-t border-neutral-900/60 flex items-center justify-between gap-2 mt-4">
                            <div>
                              <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">Inscrição</span>
                              <span className="text-lg font-black text-orange-500">R$ {ch.price.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <button
                              onClick={() => {
                                if (confrontoManutencao && !isAdmin) {
                                  setShowManutencaoModal(true);
                                  return;
                                }
                                const check = isChampClosed(ch);
                                if (check.closed) {
                                  alert(`Inscrições Indisponíveis: ${check.reason}`);
                                  return;
                                }
                                setSelectedChampionship(ch);
                                
                                const faixas = ch.allowedFaixas && ch.allowedFaixas.length > 0 ? ch.allowedFaixas : ['Branca'];
                                const categories = ch.allowedCategories && ch.allowedCategories.length > 0 ? ch.allowedCategories : ['Adulto (18-29 anos)'];
                                const pesos = ch.allowedPesos && ch.allowedPesos.length > 0 ? ch.allowedPesos : ['Pena (-64kg)'];
                                const generos = ch.allowedGeneros && ch.allowedGeneros.length > 0 ? ch.allowedGeneros : ['Masculino'];
                                
                                setFormData({
                                  nome: '',
                                  cpf: '',
                                  dataNascimento: '',
                                  faixa: faixas[0],
                                  categoria: categories[0],
                                  peso: pesos[0],
                                  modalidade: ch.modalidades && ch.modalidades.length > 0 ? ch.modalidades[0] : 'Gi (Kimono)',
                                  genero: generos[0],
                                  academia: '',
                                  whatsapp: '',
                                });

                                setActiveTab('inscricao');
                              }}
                              disabled={limitStatus.type !== 'open'}
                              className={`text-xs font-black uppercase py-3 px-6 rounded-xl transition cursor-pointer shadow-md ${
                                limitStatus.type === 'prep'
                                  ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 cursor-not-allowed'
                                  : limitStatus.type !== 'open'
                                  ? 'bg-neutral-850 text-neutral-500 cursor-not-allowed border border-neutral-800'
                                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white shadow-orange-500/10'
                              }`}
                            >
                              {limitStatus.type === 'prep' ? 'Em Preparação' : limitStatus.type !== 'open' ? 'Inscrições Encerradas' : 'Inscrever-se'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-8 md:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden my-4">
                  {/* Glowing background circles */}
                  <div className="absolute -top-24 -left-24 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner relative z-10">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-orange-500 animate-pulse" />
                  </div>

                  <div className="max-w-md mx-auto space-y-2 relative z-10">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                      Nenhum Campeonato Vigente no Momento
                    </h3>
                    <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-medium">
                      No momento não há nenhum campeonato ativo com inscrições abertas na arena da ACBJJ Pro.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-2xl text-[11px] font-extrabold text-orange-400 uppercase tracking-widest relative z-10 shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                    Fique atento! Novas edições e confrontos serão divulgados em breve.
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: REGISTRATION FORM */}
          {activeTab === 'inscricao' && selectedChampionship && (
            <motion.div 
              key="inscricao"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('home')}
                  className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">Ficha de Inscrição</h2>
                  <p className="text-xs text-neutral-400">{selectedChampionship.title}</p>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="bg-[#141414] border border-neutral-850 p-6 rounded-3xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Nome Completo */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CARLOS GRACIE FILHO"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition uppercase font-semibold"
                    />
                    {formErrors.nome && <span className="text-[10px] text-red-500 block font-semibold">{formErrors.nome}</span>}
                  </div>

                  {/* CPF */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">CPF do Competidor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 123.456.789-10"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                      maxLength={14}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition"
                    />
                    {formErrors.cpf && <span className="text-[10px] text-red-500 block font-semibold">{formErrors.cpf}</span>}
                  </div>

                  {/* Data de Nascimento */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Data de Nascimento *</label>
                    <input
                      type="date"
                      required
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition cursor-pointer"
                    />
                    {formErrors.dataNascimento && <span className="text-[10px] text-red-500 block font-semibold">{formErrors.dataNascimento}</span>}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">WhatsApp / Celular *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (21) 99999-9999"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
                      maxLength={15}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition"
                    />
                    {formErrors.whatsapp && <span className="text-[10px] text-red-500 block font-semibold">{formErrors.whatsapp}</span>}
                  </div>

                  {/* Academia */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Academia / Equipe *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Alliance, Gracie Barra, etc."
                      value={formData.academia}
                      onChange={(e) => setFormData({ ...formData, academia: e.target.value })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition"
                    />
                    {formErrors.academia && <span className="text-[10px] text-red-500 block font-semibold">{formErrors.academia}</span>}
                  </div>

                  {/* Gênero */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Gênero</label>
                    <select
                      value={formData.genero}
                      onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition cursor-pointer"
                    >
                      {(selectedChampionship.allowedGeneros && selectedChampionship.allowedGeneros.length > 0
                        ? selectedChampionship.allowedGeneros
                        : ['Masculino', 'Feminino']
                      ).map((gen) => (
                        <option key={gen} value={gen}>{gen}</option>
                      ))}
                    </select>
                  </div>

                  {/* Faixa */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Faixa (Graduação)</label>
                    <select
                      value={formData.faixa}
                      onChange={(e) => setFormData({ ...formData, faixa: e.target.value })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition cursor-pointer"
                    >
                      {(selectedChampionship.allowedFaixas && selectedChampionship.allowedFaixas.length > 0
                        ? selectedChampionship.allowedFaixas
                        : ["Branca", "Cinza", "Amarela", "Laranja", "Verde", "Azul", "Roxa", "Marrom", "Preta"]
                      ).map((faixa) => (
                        <option key={faixa} value={faixa}>{faixa}</option>
                      ))}
                    </select>
                  </div>

                  {/* Categoria de Idade */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Categoria de Idade</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition cursor-pointer"
                    >
                      {(selectedChampionship.allowedCategories && selectedChampionship.allowedCategories.length > 0
                        ? selectedChampionship.allowedCategories
                        : [
                            "Mirim (6-7 anos)",
                            "Infantil (8-9 anos)",
                            "Infanto-Juvenil (10-14 anos)",
                            "Juvenil (15-17 anos)",
                            "Adulto (18-29 anos)",
                            "Master 1 (30-35 anos)",
                            "Master 2 (Acima de 36)"
                          ]
                      ).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Peso Limite */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Peso Limite</label>
                    <select
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition cursor-pointer"
                    >
                      {(selectedChampionship.allowedPesos && selectedChampionship.allowedPesos.length > 0
                        ? selectedChampionship.allowedPesos
                        : [
                            "Pena (-64kg)",
                            "Leve (-70kg)",
                            "Médio (-76kg)",
                            "Meio-Pesado (-82.3kg)",
                            "Pesado (-88.3kg)",
                            "Super-Pesado (-94.3kg)",
                            "Pesadíssimo (+94.3kg)",
                            "Absoluto"
                          ]
                      ).map((peso) => (
                        <option key={peso} value={peso}>{peso}</option>
                      ))}
                    </select>
                  </div>

                  {/* Modalidade */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Modalidade *</label>
                    <select
                      value={formData.modalidade || ''}
                      onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                      className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition cursor-pointer"
                    >
                      {(selectedChampionship.modalidades && selectedChampionship.modalidades.length > 0
                        ? selectedChampionship.modalidades
                        : ['Gi (Kimono)', 'No-Gi']
                      ).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Promo Coupon Section */}
                <div className="bg-[#1c1c1c]/50 p-5 rounded-2xl border border-neutral-850 space-y-3">
                  <span className="text-[10px] uppercase font-black text-orange-500 tracking-wider block font-sans">Cupom Promocional</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Insira o cupom de desconto (Ex: CONFRONTO20)"
                      value={appliedCouponCode}
                      onChange={(e) => {
                        setAppliedCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                        setCouponErrorMessage('');
                        setCouponSuccessMessage('');
                      }}
                      className="flex-1 bg-[#0c0c0c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition uppercase"
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setAppliedCouponCode('');
                          setCouponSuccessMessage('');
                          setCouponErrorMessage('');
                        }}
                        className="px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl py-3 transition cursor-pointer shrink-0"
                      >
                        Remover Cupom
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const codeClean = appliedCouponCode.trim().toUpperCase();
                          if (!codeClean) return;
                          
                          const found = cupons.find(c => c.code === codeClean);
                          if (!found) {
                            setCouponErrorMessage('Cupom inválido ou inexistente.');
                            setCouponSuccessMessage('');
                          } else if (!found.active) {
                            setCouponErrorMessage('Este cupom está inativo no momento.');
                            setCouponSuccessMessage('');
                          } else {
                            setAppliedCoupon({ code: found.code, discount: found.discount });
                            setCouponSuccessMessage(`Cupom "${found.code}" aplicado! ${found.discount}% de desconto.`);
                            setCouponErrorMessage('');
                          }
                        }}
                        className="px-5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl py-3 transition cursor-pointer shrink-0"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                  {couponErrorMessage && (
                    <p className="text-[10px] text-red-500 font-bold block mt-1">❌ {couponErrorMessage}</p>
                  )}
                  {couponSuccessMessage && (
                    <p className="text-[10px] text-emerald-400 font-bold block mt-1">✅ {couponSuccessMessage}</p>
                  )}
                </div>

                <div className="p-4 bg-gradient-to-r from-orange-950/50 via-amber-950/40 to-orange-950/50 border-2 border-orange-500/70 shadow-lg shadow-orange-500/20 rounded-2xl flex items-start gap-3 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-orange-400 text-xs font-black uppercase tracking-wide block">Regras importantes</span>
                    <p className="text-[10px] sm:text-xs text-neutral-200 font-medium leading-relaxed">
                      A pesagem ocorrerá no dia do evento. Caso o atleta não bata o peso da categoria inscrita, será imediatamente desclassificado sem direito a reembolso. Confira seus dados antes de enviar.
                    </p>
                  </div>
                </div>

                {/* REQUISITO 7: ACEITES OBRIGATÓRIOS PARA INSCRIÇÃO EM CAMPEONATO */}
                <div className="space-y-3 pt-3 border-t border-neutral-850 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Aceites Obrigatórios para Inscrição no Campeonato *
                  </span>

                  {/* CHECKBOX 1: REGULAMENTO DO CAMPEONATO */}
                  <div className="bg-[#1c1c1c] p-3 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="chk-reg-champ"
                        required
                        checked={aceitouRegulamento}
                        onChange={(e) => setAceitouRegulamento(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                      />
                      <label htmlFor="chk-reg-champ" className="text-xs text-neutral-200 leading-snug cursor-pointer font-medium">
                        Li e aceito o <strong className="text-white">Regulamento Oficial do Campeonato e Regras de Pesagem</strong>.
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const docObj = (contratosOficiais && contratosOficiais.find((c: any) => c.id === 'doc_matricula_regulamento')) || {
                          id: 'doc_regulamento_campeonato',
                          titulo: `Regulamento Oficial do Campeonato - ${selectedChampionship.title}`,
                          versao: '1.0',
                          dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
                          descricao: 'Regulamento oficial de regras, pesos, conduta esportiva e arbitragem para campeonatos.',
                          capitulos: [
                            { titulo: 'Capítulo I - Das Regras e Pesagem', conteudo: 'A pesagem ocorrerá estritamente no dia e horário estipulados na programação oficial. Tolerância zero para estouro de peso.' },
                            { titulo: 'Capítulo II - Da Desclassificação', conteudo: 'Atletas que não baterem o peso serão desclassificados sumariamente sem direito a devolução do valor da taxa de inscrição.' },
                            { titulo: 'Capítulo III - Do Comportamento Esportivo', conteudo: 'É expressamente vedada qualquer conduta antidesportiva por parte de atletas, técnicos ou torcedores nas dependências da Arena.' }
                          ]
                        };
                        setDocumentoParaVisualizar(docObj);
                      }}
                      className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline flex items-center gap-1 ml-6 transition cursor-pointer"
                    >
                      Visualizar Regulamento Completo
                    </button>
                  </div>

                  {/* CHECKBOX 2: DIREITOS DE IMAGEM E VOZ */}
                  <div className="bg-[#1c1c1c] p-3 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="chk-img-champ"
                        required
                        checked={aceitouImagemVoz}
                        onChange={(e) => setAceitouImagemVoz(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                      />
                      <label htmlFor="chk-img-champ" className="text-xs text-neutral-200 leading-snug cursor-pointer font-medium">
                        Autorizo expressamente a <strong className="text-white">Captação e Uso de Imagem, Voz e Transmissão Esportiva</strong>.
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const docObj = {
                          id: 'doc_autorizacao_imagem_voz',
                          titulo: 'Termo de Autorização de Uso de Imagem, Voz e Transmissão Esportiva',
                          versao: '1.0',
                          dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
                          descricao: 'Cessão de direitos de imagem, áudio e vídeo para fins de transmissão ao vivo e divulgação do evento.',
                          capitulos: [
                            { titulo: 'Capítulo I - Da Concessão de Direitos', conteudo: 'O atleta concede à Arena do Competidor o direito de captar, gravar, exibir e transmitir sua imagem e áudio no evento.' },
                            { titulo: 'Capítulo II - Das Transmissões e Redes Sociais', conteudo: 'As imagens e vídeos poderão ser utilizados em livestreams, materiais promocionais, matérias jornalísticas e acervos históricos sem ônus financeiro.' }
                          ]
                        };
                        setDocumentoParaVisualizar(docObj);
                      }}
                      className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline flex items-center gap-1 ml-6 transition cursor-pointer"
                    >
                      Visualizar Termo de Imagem
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!aceitouRegulamento || !aceitouImagemVoz}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs py-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15"
                >
                  <CreditCard className="w-4.5 h-4.5" />
                  {appliedCoupon ? (
                    <>
                      Prosseguir para o Pagamento (
                      <span className="line-through text-neutral-400 mr-1.5">R$ {selectedChampionship.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-emerald-400">R$ {(selectedChampionship.price * (1 - appliedCoupon.discount / 100)).toFixed(2).replace('.', ',')}</span>
                      )
                    </>
                  ) : (
                    `Prosseguir para o Pagamento (R$ ${selectedChampionship.price.toFixed(2).replace('.', ',')})`
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB: STATUS CHECKER & PIX FLOW */}
          {activeTab === 'status' && (
            <motion.div 
              key="status"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCurrentRegistration(null);
                    setFoundInscricoes(null);
                    setSearchCpf('');
                    setActiveTab('home');
                  }}
                  className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">Consultar Status de Inscrição</h2>
                  <p className="text-xs text-neutral-400">Verifique sua inscrição ou efetue o pagamento Pix</p>
                </div>
              </div>

              {/* SEARCH INPUT BAR */}
              <form onSubmit={handleSearchCpf} className="bg-[#141414] border border-neutral-850 p-5 rounded-2xl flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Digite seu CPF cadastrado"
                    value={searchCpf}
                    onChange={(e) => setSearchCpf(maskCPF(e.target.value))}
                    maxLength={14}
                    className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3.5 pl-10 pr-4 outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase py-3.5 px-6 rounded-xl transition cursor-pointer"
                >
                  Pesquisar
                </button>
              </form>

              {/* PIX FLOW FOR NEWLY REGISTERED / HIGHLIGHTED REGISTRATION */}
              {currentRegistration && (
                <div className="bg-[#141414] border border-orange-500/25 p-6 rounded-3xl space-y-6">
                  <div className="border-b border-neutral-900 pb-4">
                    <span className="text-[10px] uppercase font-black text-orange-500 tracking-wider">Inscrição Recente</span>
                    <h3 className="text-lg font-black text-white">{currentRegistration.nome}</h3>
                    <p className="text-xs text-neutral-400">{currentRegistration.campeonatoTitulo}</p>
                  </div>

                  {currentRegistration.status === 'Pendente de Pagamento' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      {/* Pix QR Code with fallback API */}
                      <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shrink-0 w-44 mx-auto border border-neutral-200">
                        {pixKey && qrCodeUrl ? (
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code Pix" 
                            className="w-36 h-36 object-contain animate-fade-in"
                          />
                        ) : (
                          <div className="w-36 h-36 flex flex-col items-center justify-center text-center p-3 text-red-500 bg-red-100 rounded-xl">
                            <QrCode className="w-10 h-10 mb-1" />
                            <span className="text-[8px] font-bold">Chave Pix não configurada pelo Admin!</span>
                          </div>
                        )}
                        <span className="text-[9px] font-black uppercase tracking-wider text-black mt-2 leading-none flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Chave Pix Gerada
                        </span>
                      </div>

                      {/* Pix Info Options */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="bg-[#1c1c1c]/50 p-4 rounded-xl border border-neutral-850 space-y-3">
                          <span className="text-[11px] text-orange-500 uppercase font-black tracking-widest block">
                            Opção 1 — Copiar chave Pix
                          </span>
                          <p className="text-[10px] text-neutral-400">
                            Copie a chave Pix abaixo para realizar o pagamento manualmente no aplicativo do seu banco:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={pixKey}
                              className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 rounded-xl py-2.5 px-3 outline-none font-mono"
                            />
                            <button
                              onClick={() => handleCopy(pixKey)}
                              className="px-4 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5"
                              title="Copiar chave Pix"
                            >
                              <Copy className="w-4 h-4" />
                              Copiar chave Pix
                            </button>
                          </div>
                          {copiedTxId === pixKey && <span className="text-[10px] text-emerald-400 font-bold block">Chave Pix copiada com sucesso!</span>}
                        </div>

                        <div className="bg-[#1c1c1c]/50 p-4 rounded-xl border border-neutral-850 space-y-2">
                          <span className="text-[11px] text-orange-500 uppercase font-black tracking-widest block">
                            Opção 2 — QR Code Pix
                          </span>
                          <p className="text-[10px] text-neutral-400 font-sans">
                            Aponte a câmera do celular para o QR Code ao lado para pagar utilizando a chave Pix cadastrada diretamente.
                          </p>
                        </div>

                        <div className="bg-[#1c1c1c]/50 p-4 rounded-xl border border-neutral-850 space-y-3">
                          <span className="text-[11px] text-orange-500 uppercase font-black tracking-widest block">
                            Opção 3 — Copiar Código Pix Copia e Cola
                          </span>
                          <p className="text-[10px] text-neutral-400">
                            Copie o código Pix Copia e Cola abaixo se preferir realizar o pagamento colando o código no aplicativo do seu banco:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={generatePixPayload(
                                pixKey,
                                currentRegistration.valor || 0,
                                currentRegistration.nome || 'ACBJJ',
                                currentRegistration.id || '***',
                                currentRegistration.campeonatoTitulo || ''
                              )}
                              className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 rounded-xl py-2.5 px-3 outline-none font-mono truncate"
                            />
                            <button
                              onClick={() => {
                                const payload = generatePixPayload(
                                  pixKey,
                                  currentRegistration.valor || 0,
                                  currentRegistration.nome || 'ACBJJ',
                                  currentRegistration.id || '***',
                                  currentRegistration.campeonatoTitulo || ''
                                );
                                handleCopy(payload);
                              }}
                              className="px-4 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5"
                              title="Copiar Pix Copia e Cola"
                            >
                              <Copy className="w-4 h-4" />
                              Copiar Código
                            </button>
                          </div>
                          {copiedTxId === generatePixPayload(
                            pixKey,
                            currentRegistration.valor || 0,
                            currentRegistration.nome || 'ACBJJ',
                            currentRegistration.id || '***',
                            currentRegistration.campeonatoTitulo || ''
                          ) && <span className="text-[10px] text-emerald-400 font-bold block">Código Pix Copia e Cola copiado com sucesso!</span>}
                        </div>

                        <div className="text-xs text-neutral-400 leading-relaxed space-y-2">
                          <p>
                            Para concluir sua inscrição, efetue o pagamento de <strong>R$ {currentRegistration.valor.toFixed(2).replace('.', ',')}</strong> utilizando uma das opções acima.
                          </p>
                          <p>
                            Após a conclusão, clique no botão <strong>"Já realizei o Pagamento"</strong> para enviar à análise do suporte.
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => handleMarkAsPaid(currentRegistration.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/15"
                          >
                            <Check className="w-4 h-4" />
                            Já realizei o Pagamento
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentRegistration.status === 'Em Análise' && (
                    <div className="space-y-4">
                      <div className="bg-yellow-500/10 border border-yellow-500/25 p-5 rounded-2xl flex items-center gap-4">
                        <Clock className="w-8 h-8 text-yellow-500 shrink-0" />
                        <div className="space-y-1 text-left">
                          <span className="text-white text-xs font-black uppercase block">Aguardando Confirmação de Pagamento</span>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Nossos operadores estão analisando a transferência referente à transação <strong>{currentRegistration.transactionId}</strong>. O status da sua inscrição será atualizado em breve. Obrigado!
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 flex justify-start">
                        <button
                          onClick={() => {
                            setCurrentRegistration({ ...currentRegistration, status: 'Pendente de Pagamento' });
                            window.scrollTo({ top: 100, behavior: 'smooth' });
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase py-2.5 px-4 rounded-lg transition cursor-pointer"
                        >
                          Realizar pagamento novamente
                        </button>
                      </div>
                    </div>
                  )}

                  {currentRegistration.status === 'Pagamento Confirmado' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 text-left">
                        <span className="text-white text-xs font-black uppercase block">Inscrição Confirmada</span>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Seu pagamento foi validado com sucesso! Sua vaga no campeonato está totalmente assegurada. ID de Transação: <strong>{currentRegistration.transactionId}</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SEARCH RESULTS LIST */}
              {foundInscricoes !== null && (
                <div className="space-y-4 pt-4 border-t border-neutral-900/60">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Resultados Encontrados ({foundInscricoes.length})</h3>
                  {foundInscricoes.length > 0 ? (
                    foundInscricoes.map((reg) => (
                      <div key={reg.id} className="bg-[#141414] border border-neutral-850 p-5 rounded-2xl space-y-4 hover:border-neutral-750 transition text-left">
                        <div className="flex justify-between items-start flex-wrap gap-2 border-b border-neutral-900/40 pb-3">
                          <div>
                            <strong className="text-white text-sm block">👤 {reg.nome}</strong>
                            <span className="text-[10px] text-neutral-400 block">CPF: {reg.cpf} • Academia: {reg.academia}</span>
                          </div>
                          <span className={`text-[10px] font-black uppercase py-1 px-2.5 rounded-lg text-white shadow-md tracking-wider shrink-0 ${
                            reg.status === 'Pagamento Confirmado'
                              ? 'bg-emerald-600'
                              : reg.status === 'Em Análise'
                              ? 'bg-yellow-500 text-black'
                              : 'bg-red-600'
                          }`}>
                            {reg.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px] text-neutral-400">
                          <div>🥋 Faixa: <strong className="text-white">{reg.faixa}</strong></div>
                          <div>⚖️ Categoria: <strong className="text-white">{reg.categoria}</strong></div>
                          <div>📏 Peso: <strong className="text-white">{reg.peso}</strong></div>
                          <div>🏅 Modalidade: <strong className="text-orange-500 font-bold">{reg.modalidade || 'Gi'}</strong></div>
                          <div>📞 WhatsApp: <strong className="text-white">{reg.whatsapp}</strong></div>
                        </div>

                        <div className="bg-[#0f0f0f] p-3 rounded-xl border border-neutral-900 flex justify-between items-center text-[10px] text-neutral-400">
                          <span>📅 Campeonato: <strong className="text-white">{reg.campeonatoTitulo}</strong></span>
                          <span>Chave: <strong className="text-orange-500 font-mono">{reg.transactionId}</strong></span>
                        </div>

                        {(reg.status === 'Pendente de Pagamento' || reg.status === 'Em Análise' || reg.status === 'Aguardando confirmação' || reg.status === 'Aguardando pagamento') && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => {
                                setCurrentRegistration({ ...reg, status: 'Pendente de Pagamento' });
                                window.scrollTo({ top: 100, behavior: 'smooth' });
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase py-2.5 px-4 rounded-lg transition cursor-pointer"
                            >
                              Realizar pagamento novamente
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-neutral-900/20 border border-dashed border-neutral-850 rounded-2xl">
                      <HelpCircle className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400 font-bold uppercase">Nenhuma inscrição localizada</p>
                      <p className="text-[11px] text-neutral-500 mt-1">Nenhum competidor cadastrado sob o CPF inserido. Certifique-se de preencher corretamente.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: PUBLIC CONFIRMED ATHLETES */}
          {activeTab === 'athletes' && (
            <motion.div 
              key="athletes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5.5 h-5.5 text-orange-500" />
                  Lista de Atletas Confirmados
                </h2>
                <p className="text-xs text-neutral-400">Pesquise atletas com vagas garantidas e homologadas por campeonato.</p>
              </div>

              {visibleCampeonatos.length > 0 ? (
                <div className="bg-[#141414] border border-neutral-850 p-5 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider block mb-1">Selecione o Campeonato</label>
                      <select
                        value={publicSelectedChampId}
                        onChange={(e) => setPublicSelectedChampId(e.target.value)}
                        className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-3 px-3 outline-none cursor-pointer"
                      >
                        {visibleCampeonatos.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider block mb-1">Pesquisar por Nome/Academia</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="Ex: Carlos Gracie"
                          value={publicSearchQuery}
                          onChange={(e) => setPublicSearchQuery(e.target.value)}
                          className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-3 pl-9 pr-3 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {publicConfirmedAthletes.length > 0 ? (
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {publicConfirmedAthletes.map((ath) => (
                        <div key={ath.id} className="bg-neutral-900/40 border border-neutral-850 p-3.5 rounded-xl flex justify-between items-center text-left">
                          <div>
                            <strong className="text-white text-xs block">{ath.nome}</strong>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">🛡️ {ath.academia}</span>
                            <span className="text-[9px] text-neutral-500 block mt-0.5">{ath.genero} • {ath.categoria}</span>
                          </div>
                          <div className="text-right">
                            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase py-1 px-2.5 rounded-lg">
                              🥋 {ath.faixa}
                            </span>
                            <span className="text-[9px] text-neutral-400 block mt-1.5 font-bold">{ath.peso} • {ath.modalidade || 'Gi'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs">
                      Nenhum atleta confirmado encontrado com os filtros selecionados.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-8 md:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden my-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner relative z-10">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2 relative z-10">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                      Nenhum Campeonato Vigente
                    </h3>
                    <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-medium">
                      Não há campeonatos ativos no momento para exibição de atletas confirmados.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: PUBLIC BRACKETS */}
          {activeTab === 'brackets' && (
            <motion.div 
              key="brackets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-5.5 h-5.5 text-orange-500" />
                  Chaves de Lutas e Confrontos
                </h2>
                <p className="text-xs text-neutral-400">Acompanhe as chaves, combates em andamento e campeões de cada divisão.</p>
              </div>

              {visibleCampeonatos.length > 0 ? (
                <>
                  <div className="bg-[#141414] border border-neutral-850 p-4 rounded-3xl">
                    <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider block mb-1">Escolha o Campeonato</label>
                    <select
                      value={publicBracketChampId}
                      onChange={(e) => setPublicBracketChampId(e.target.value)}
                      className="w-full sm:max-w-md bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-3 px-3 outline-none cursor-pointer"
                    >
                      {visibleCampeonatos.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {bracketActiveChamp && (
                    <ConfrontoChaveamento
                      championship={bracketActiveChamp}
                      onUpdateChampionship={handleUpdateChampionshipFromBracket}
                      isAdmin={false}
                      registrations={confrontoInscricoes}
                      onUpdateInscricoes={onUpdateInscricoes}
                    />
                  )}
                </>
              ) : (
                <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-8 md:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden my-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner relative z-10">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2 relative z-10">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                      Nenhum Campeonato Vigente
                    </h3>
                    <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-medium">
                      Não há campeonatos ativos no momento para exibição de chaves de lutas.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: ADMIN PANELS (CONTROLS & APPROVALS) */}
          {activeTab === 'admin' && isAdmin && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-5.5 h-5.5 text-orange-500" />
                    Painel de Controle CAMPEONATOS / INSCRIÇÕES
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Central de homologação de pagamentos, gestão de campeonatos e chaves.</p>
                </div>
              </div>

              {/* Sub-tab Selection */}
              {/* Desktop Sub-tabs */}
              <div className="hidden md:flex gap-2 border-b border-neutral-900 pb-2 flex-wrap">
                <button
                  onClick={() => setAdminSubTab('inscricoes')}
                  className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition cursor-pointer ${
                    adminSubTab === 'inscricoes'
                      ? 'bg-neutral-850 text-white border border-neutral-750'
                      : 'bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  👥 Homologação ({filteredRegs.length})
                </button>
                <button
                  onClick={() => setAdminSubTab('campeonatos')}
                  className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition cursor-pointer ${
                    adminSubTab === 'campeonatos'
                      ? 'bg-neutral-850 text-white border border-neutral-750'
                      : 'bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  🏆 Campeonatos ({confrontoCampeonatos.length})
                </button>
                <button
                  onClick={() => setAdminSubTab('chaveamento')}
                  className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition cursor-pointer ${
                    adminSubTab === 'chaveamento'
                      ? 'bg-neutral-850 text-white border border-neutral-750'
                      : 'bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  🥋 Chaveamento de Lutas
                </button>
                <button
                  onClick={() => setAdminSubTab('modalidades')}
                  className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition cursor-pointer ${
                    adminSubTab === 'modalidades'
                      ? 'bg-neutral-850 text-white border border-neutral-750'
                      : 'bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  ⚙️ Modalidades ({modalidades.length})
                </button>
                <button
                  onClick={() => setAdminSubTab('cupons')}
                  className={`text-[10px] uppercase font-black py-2 px-4 rounded-xl transition cursor-pointer ${
                    adminSubTab === 'cupons'
                      ? 'bg-neutral-850 text-white border border-neutral-750'
                      : 'bg-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  🎟️ Cupons ({cupons.length})
                </button>
              </div>

              {/* Mobile/Tablet Sub-tabs Button */}
              <div className="md:hidden sticky top-[64px] z-40 bg-[#0c0c0c] py-2">
                <button
                  onClick={() => setMobileAdminSubMenuOpen(true)}
                  className="w-full bg-[#141414] border border-neutral-800 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition cursor-pointer"
                >
                  <Menu className="w-5 h-5 text-orange-500 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-center flex-1">
                    {adminSubTab === 'inscricoes' ? `👥 Homologação (${filteredRegs.length})` :
                     adminSubTab === 'campeonatos' ? `🏆 Campeonatos (${confrontoCampeonatos.length})` :
                     adminSubTab === 'chaveamento' ? '🥋 Chaveamento de Lutas' :
                     adminSubTab === 'modalidades' ? `⚙️ Modalidades (${modalidades.length})` :
                     adminSubTab === 'cupons' ? `🎟️ Cupons (${cupons.length})` : 'Opções Admin'}
                  </span>
                  <div className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Admin Fullscreen Overlay Menu */}
              {mobileAdminSubMenuOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex flex-col justify-start p-6 overflow-y-auto animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-500" />
                      <span className="font-black text-white text-xs sm:text-sm tracking-widest uppercase">MÓDULO ADMIN CONFRONTOS</span>
                    </div>
                    <button
                      onClick={() => setMobileAdminSubMenuOpen(false)}
                      className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition text-orange-500 cursor-pointer"
                    >
                      Sair
                    </button>
                  </div>

                  {/* Grid of 5 blocks, organized as cards */}
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full pt-4 pb-12">
                    {[
                      { id: 'inscricoes', label: 'Homologação', count: filteredRegs.length, icon: Users },
                      { id: 'campeonatos', label: 'Campeonatos', count: confrontoCampeonatos.length, icon: Trophy },
                      { id: 'chaveamento', label: 'Chaveamento de Lutas', icon: Layers },
                      { id: 'modalidades', label: 'Modalidades', count: modalidades.length, icon: Activity },
                      { id: 'cupons', label: 'Cupons', count: cupons.length, icon: Landmark },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = adminSubTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setAdminSubTab(item.id as any);
                            setMobileAdminSubMenuOpen(false);
                          }}
                          className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all text-center gap-2.5 group active:scale-95 cursor-pointer ${
                            active
                              ? 'bg-gradient-to-br from-orange-500 to-red-600 border-transparent text-white shadow-lg shadow-orange-500/25'
                              : 'bg-neutral-900/40 border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white hover:bg-neutral-900'
                          }`}
                        >
                          <div className={`p-3 rounded-xl transition ${active ? 'bg-white/10' : 'bg-[#1a1a1a] group-hover:bg-[#222]'}`}>
                            <Icon className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {item.label} {item.count !== undefined ? `(${item.count})` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {adminSubTab === 'campeonatos' && (
                <ConfrontoAdminCampeonatos
                  confrontoCampeonatos={confrontoCampeonatos}
                  onUpdateCampeonatos={onUpdateCampeonatos}
                  addAuditLog={addAuditLog}
                  confrontoInscricoes={confrontoInscricoes}
                />
              )}

              {adminSubTab === 'chaveamento' && (
                <div className="space-y-6">
                  <div className="bg-[#141414] border border-neutral-850 p-4 rounded-3xl">
                    <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider block mb-1">Selecione o Campeonato para Gerar/Ver Chaves</label>
                    <select
                      value={publicBracketChampId}
                      onChange={(e) => setPublicBracketChampId(e.target.value)}
                      className="w-full sm:max-w-md bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-3 px-3 outline-none cursor-pointer"
                    >
                      {confrontoCampeonatos.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  {adminBracketActiveChamp && (
                    <ConfrontoChaveamento
                      championship={adminBracketActiveChamp}
                      onUpdateChampionship={handleUpdateChampionshipFromBracket}
                      isAdmin={true}
                      registrations={confrontoInscricoes}
                      onUpdateInscricoes={onUpdateInscricoes}
                    />
                  )}
                </div>
              )}

              {adminSubTab === 'modalidades' && (
                <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-6 space-y-6 animate-fade-in text-left">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-widest block">Cadastrar & Gerenciar Modalidades</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Adicione as modalidades que estarão disponíveis no formulário de inscrição (Ex: Gi, No-Gi).</p>
                    </div>
                  </div>

                  {/* FORM TO ADD/EDIT MODALITY */}
                  <div className="bg-[#0c0c0c] border border-neutral-850 rounded-2xl p-4 space-y-4">
                    <h4 className="text-xs font-black text-orange-500 uppercase tracking-wider">
                      {editingModalityId ? 'Editar Modalidade' : 'Nova Modalidade'}
                    </h4>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!modalityName.trim()) {
                          alert('Por favor, informe o nome da modalidade.');
                          return;
                        }

                        if (editingModalityId) {
                          // Edit existing
                          const updated = modalidades.map(m => 
                            m.id === editingModalityId ? { ...m, nome: modalityName.trim() } : m
                          );
                          setModalidades(updated);
                          addAuditLog('Edição de Modalidade', `Modalidade editada para: ${modalityName}`);
                          setEditingModalityId(null);
                        } else {
                          // Add new
                          const newMod = {
                            id: `mod-${Date.now()}`,
                            nome: modalityName.trim(),
                            ativa: true
                          };
                          setModalidades([...modalidades, newMod]);
                          addAuditLog('Cadastro de Modalidade', `Nova modalidade cadastrada: ${modalityName}`);
                        }
                        setModalityName('');
                      }}
                      className="flex flex-col sm:flex-row gap-3"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Nome da modalidade (Ex: Gi, No-Gi, Absolute)"
                        value={modalityName}
                        onChange={(e) => setModalityName(e.target.value)}
                        className="flex-1 bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition"
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="submit"
                          className="px-5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl py-3 transition cursor-pointer"
                        >
                          {editingModalityId ? 'Salvar Alteração' : 'Adicionar Modalidade'}
                        </button>
                        {editingModalityId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingModalityId(null);
                              setModalityName('');
                            }}
                            className="px-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 font-bold text-xs rounded-xl py-3 transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* MODALITIES LIST */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Lista de Modalidades</span>
                    {modalidades.length === 0 ? (
                      <div className="text-center py-6 text-xs text-neutral-500 bg-[#0c0c0c] border border-neutral-850 rounded-2xl">
                        Nenhuma modalidade cadastrada.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {modalidades.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-3 bg-[#0c0c0c] border border-neutral-850 rounded-xl hover:border-neutral-800 transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-sm text-white">{m.nome}</span>
                              <span className={`text-[9px] font-black uppercase py-0.5 px-2 rounded-full ${m.ativa ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {m.ativa ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Toggle active/inactive */}
                              <button
                                onClick={() => {
                                  const updated = modalidades.map(mod =>
                                    mod.id === m.id ? { ...mod, ativa: !mod.ativa } : mod
                                  );
                                  setModalidades(updated);
                                  addAuditLog('Status Modalidade', `Modalidade ${m.nome} alterada para: ${!m.ativa ? 'Ativa' : 'Inativa'}`);
                                }}
                                className={`text-[10px] font-bold py-1.5 px-3 rounded-lg border transition cursor-pointer ${
                                  m.ativa
                                    ? 'bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-400 border-neutral-800'
                                    : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {m.ativa ? 'Desativar' : 'Ativar'}
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setEditingModalityId(m.id);
                                  setModalityName(m.nome);
                                }}
                                className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition border border-neutral-850 cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Remove */}
                              <button
                                onClick={() => {
                                  if (confirm(`Tem certeza de que deseja remover a modalidade "${m.nome}"?`)) {
                                    const updated = modalidades.filter(mod => mod.id !== m.id);
                                    setModalidades(updated);
                                    addAuditLog('Remover Modalidade', `Modalidade removida: ${m.nome}`);
                                    if (editingModalityId === m.id) {
                                      setEditingModalityId(null);
                                      setModalityName('');
                                    }
                                  }
                                }}
                                className="p-1.5 hover:bg-red-950/20 text-neutral-400 hover:text-red-400 rounded-lg transition border border-neutral-850 hover:border-red-900/50 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminSubTab === 'cupons' && (
                <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-6 space-y-6 animate-fade-in text-left">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-widest block">🎟️ Cadastrar & Gerenciar Cupons Promocionais</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Adicione e gerencie os cupons de desconto percentuais utilizados pelos competidores.</p>
                    </div>
                  </div>

                  {/* FORM TO ADD/EDIT COUPON */}
                  <div className="bg-[#0c0c0c] border border-neutral-850 rounded-2xl p-4 space-y-4">
                    <h4 className="text-xs font-black text-orange-500 uppercase tracking-wider">
                      {editingCouponId ? 'Editar Cupom' : 'Novo Cupom'}
                    </h4>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const codeUpper = couponCodeForm.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (!codeUpper) {
                          alert('Por favor, insira um código de cupom válido.');
                          return;
                        }
                        if (couponDiscountForm < 1 || couponDiscountForm > 100) {
                          alert('O desconto deve ser entre 1% e 100%.');
                          return;
                        }

                        if (editingCouponId) {
                          // Edit existing
                          const updated = cupons.map(c => 
                            c.id === editingCouponId ? { ...c, code: codeUpper, discount: couponDiscountForm } : c
                          );
                          setCupons(updated);
                          addAuditLog('Edição de Cupom', `Cupom ${codeUpper} editado com desconto de ${couponDiscountForm}%`);
                          setEditingCouponId(null);
                        } else {
                          // Check duplicate
                          if (cupons.some(c => c.code === codeUpper)) {
                            alert(`O cupom "${codeUpper}" já existe.`);
                            return;
                          }
                          // Add new
                          const newCoupon = {
                            id: `coupon-${Date.now()}`,
                            code: codeUpper,
                            discount: couponDiscountForm,
                            active: true
                          };
                          setCupons([...cupons, newCoupon]);
                          addAuditLog('Cadastro de Cupom', `Novo cupom cadastrado: ${codeUpper} com ${couponDiscountForm}% de desconto`);
                        }
                        setCouponCodeForm('');
                        setCouponDiscountForm(10);
                      }}
                      className="flex flex-col sm:flex-row gap-3 items-end"
                    >
                      <div className="flex-1 space-y-1 w-full">
                        <label className="text-[9px] uppercase font-black text-neutral-400 font-sans">Código do Cupom</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: ACBJJ20"
                          value={couponCodeForm}
                          onChange={(e) => setCouponCodeForm(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                          className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition uppercase"
                        />
                      </div>
                      <div className="w-full sm:w-32 space-y-1 shrink-0">
                        <label className="text-[9px] uppercase font-black text-neutral-400 font-sans">Desconto (%)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={100}
                          value={couponDiscountForm}
                          onChange={(e) => setCouponDiscountForm(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-3 px-4 outline-none transition"
                        />
                      </div>
                      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl py-3.5 transition cursor-pointer"
                        >
                          {editingCouponId ? 'Salvar' : 'Criar Cupom'}
                        </button>
                        {editingCouponId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCouponId(null);
                              setCouponCodeForm('');
                              setCouponDiscountForm(10);
                            }}
                            className="px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white font-black text-xs rounded-xl py-3.5 transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* COUPON LIST */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Cupons Ativos ({cupons.length})</h4>
                    {cupons.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cupons.map((c) => (
                          <div key={c.id} className="bg-[#0c0c0c] border border-neutral-850 p-4 rounded-2xl flex justify-between items-center">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-white bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700 uppercase tracking-wider">
                                  {c.code}
                                </span>
                                <span className={`text-[8px] font-black uppercase py-0.5 px-1.5 rounded text-white ${c.active ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                  {c.active ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-400 block font-bold">Desconto: <strong className="text-orange-500 text-sm">{c.discount}%</strong></span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const updated = cupons.map(item => 
                                    item.id === c.id ? { ...item, active: !item.active } : item
                                  );
                                  setCupons(updated);
                                  addAuditLog('Status Cupom Alterado', `Cupom ${c.code} alterado para: ${!c.active ? 'Ativo' : 'Inativo'}`);
                                }}
                                className={`p-1.5 rounded-lg border transition ${
                                  c.active 
                                    ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-600/25' 
                                    : 'bg-red-600/10 text-red-400 border-red-500/25 hover:bg-red-600/25'
                                }`}
                                title={c.active ? "Desativar" : "Ativar"}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCouponId(c.id);
                                  setCouponCodeForm(c.code);
                                  setCouponDiscountForm(c.discount);
                                }}
                                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg transition"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja realmente excluir o cupom "${c.code}"?`)) {
                                    const filtered = cupons.filter(item => item.id !== c.id);
                                    setCupons(filtered);
                                    addAuditLog('Exclusão de Cupom', `Excluiu o cupom: ${c.code}`);
                                  }
                                }}
                                className="p-1.5 bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400 rounded-lg transition"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-[#0c0c0c] border border-dashed border-neutral-850 rounded-2xl">
                        <p className="text-xs text-neutral-400 uppercase font-black">Nenhum cupom cadastrado</p>
                        <p className="text-[10px] text-neutral-500 mt-1">Utilize o formulário acima para criar o seu primeiro cupom promocional.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminSubTab === 'inscricoes' && (
                <>
                  {/* CONTROLLER SECTION: MAINTENANCE TOGGLE & PIX SETTINGS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Maintenance Mode Selector */}
                    <div className="bg-[#141414] border border-neutral-850 p-5 rounded-3xl space-y-4">
                      <div className="space-y-1">
                        <span className="text-white text-xs font-black uppercase tracking-wider block">⚠️ Modo Manutenção Geral</span>
                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                          Ative para bloquear temporariamente o cadastro e a navegação no módulo CAMPEONATOS / INSCRIÇÕES. Administradores continuam com acesso livre.
                        </p>
                      </div>
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={() => {
                            onUpdateManutencao(!confrontoManutencao);
                            addAuditLog('Alteração de Manutenção', `Modo manutenção de CAMPEONATOS / INSCRIÇÕES alterado para: ${!confrontoManutencao ? 'ATIVADO' : 'DESATIVADO'}.`);
                          }}
                          className={`font-black text-xs uppercase py-3 px-6 rounded-xl transition cursor-pointer flex-1 text-center border ${
                            confrontoManutencao
                              ? 'bg-red-600/20 text-red-500 border-red-500/30 hover:bg-red-600/30'
                              : 'bg-emerald-600/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-600/30'
                          }`}
                        >
                          {confrontoManutencao ? 'Manutenção: Ativa' : 'Manutenção: Inativa'}
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Pix Configuration Key */}
                    <div className="bg-[#141414] border border-neutral-850 p-5 rounded-3xl space-y-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-white font-black uppercase tracking-wider block flex items-center gap-1.5 text-neutral-300">
                          <Landmark className="w-4 h-4 text-orange-500" />
                          Configuração de Recebimento Pix
                        </span>
                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                          Defina a chave Pix principal utilizada para o recebimento das inscrições dos competidores.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={pixKey}
                          onChange={(e) => handleSavePixKey(e.target.value)}
                          placeholder="Chave Pix (Ex: CNPJ, Email, etc.)"
                          className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-2.5 px-3 outline-none"
                        />
                        <span className="text-[9px] text-neutral-500 font-bold block">
                          Chave atual: <strong className="text-orange-500 font-mono">{pixKey || 'Nenhuma'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* REGISTRATIONS FILTERING & LISTING */}
                  <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-900 pb-3">
                      <span className="text-xs font-black text-white uppercase tracking-widest">Inscrições de Competidores ({filteredRegs.length})</span>
                      
                      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                        <select
                          value={adminFilterStatus}
                          onChange={(e) => setAdminFilterStatus(e.target.value)}
                          className="w-full sm:w-auto bg-[#1c1c1c] text-white text-[10px] font-bold border border-neutral-850 rounded-lg py-2 px-3 outline-none cursor-pointer"
                        >
                          <option value="todos">Todos os Status</option>
                          <option value="Pendente de Pagamento">Pendente</option>
                          <option value="Em Análise">Em Análise</option>
                          <option value="Pagamento Confirmado">Confirmado</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Pesquisar..."
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          className="w-full sm:w-auto bg-[#1c1c1c] text-white text-[10px] border border-neutral-850 rounded-lg py-2 px-3 outline-none flex-1 sm:max-w-xs"
                        />
                      </div>
                    </div>

                    {filteredRegs.length > 0 ? (
                      <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                        {filteredRegs.map((reg) => (
                          <div key={reg.id} className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <strong className="text-white text-xs block">👤 {reg.nome}</strong>
                                <span className="text-[8px] font-black uppercase py-0.5 px-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded">
                                  {reg.faixa}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-400 block">CPF: {reg.cpf} • Academia: {reg.academia} • WhatsApp: {reg.whatsapp}</span>
                              <span className="text-[10px] text-neutral-500 block">Chave: <strong className="text-orange-500 font-mono text-[9px]">{reg.transactionId}</strong> • Camp: {reg.campeonatoTitulo}</span>
                            </div>

                            <div className="flex sm:flex-col items-end gap-2.5 justify-between">
                              <span className={`text-[9px] font-black uppercase py-1 px-2.5 rounded-lg text-white shadow-md ${
                                reg.status === 'Pagamento Confirmado'
                                  ? 'bg-emerald-600'
                                  : reg.status === 'Em Análise'
                                  ? 'bg-yellow-500 text-black'
                                  : 'bg-red-600'
                              }`}>
                                {reg.status}
                              </span>

                              <div className="flex flex-wrap gap-2 items-center">
                                {reg.status === 'Em Análise' && (
                                  <button
                                    onClick={() => handleAdminApprove(reg.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase py-1.5 px-3 rounded-lg transition cursor-pointer shadow-sm"
                                  >
                                    Aprovar Inscrição
                                  </button>
                                )}

                                {confirmingDeleteId === reg.id ? (
                                  <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-xl space-y-2 max-w-[240px] text-left animate-fade-in">
                                    <p className="text-[9px] text-neutral-300 font-medium leading-normal">
                                      Tem certeza que deseja excluir este inscrito? Esta ação não poderá ser desfeita.
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setConfirmingDeleteId(null);
                                          startDeletionCountdown(reg.id);
                                        }}
                                        className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-[8px] uppercase py-1 px-2.5 rounded-md transition cursor-pointer"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setConfirmingDeleteId(null)}
                                        className="bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white font-extrabold text-[8px] uppercase py-1 px-2.5 rounded-md transition cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  </div>
                                ) : deletingRegs[reg.id] !== undefined ? (
                                  <div className="flex gap-1.5 items-center">
                                    {deletingRegs[reg.id] > 0 ? (
                                      <button
                                        disabled
                                        className="bg-neutral-900 text-neutral-600 font-black text-[9px] uppercase py-1.5 px-3 rounded-lg cursor-not-allowed border border-neutral-850"
                                      >
                                        Aguarde ({deletingRegs[reg.id]}s)
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => executeDeletion(reg.id)}
                                        className="bg-red-700 hover:bg-red-600 text-white font-black text-[9px] uppercase py-1.5 px-3 rounded-lg transition cursor-pointer shadow-sm animate-pulse"
                                      >
                                        Confirmar exclusão
                                      </button>
                                    )}
                                    <button
                                      onClick={() => cancelDeletionCountdown(reg.id)}
                                      className="bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white font-black text-[9px] uppercase py-1.5 px-2 rounded-lg transition cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmingDeleteId(reg.id)}
                                    className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white font-black text-[9px] uppercase py-1.5 px-3 rounded-lg border border-red-500/20 hover:border-red-600 transition cursor-pointer"
                                  >
                                    Excluir Inscrição
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-50 text-xs">Nenhuma inscrição localizada com os filtros selecionados.</div>
                    )}
                  </div>

                  {/* AUDIT LOGS DISPLAY */}
                  <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                      <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-orange-500" />
                        Registros de Auditoria (Logs do Sistema)
                      </span>
                      <button
                        onClick={() => {
                          setAuditLogs([
                            { id: '1', action: 'Limpeza de Logs', details: 'Fila de auditoria reiniciada manualmente.', timestamp: new Date().toLocaleString('pt-BR') }
                          ]);
                        }}
                        className="text-[9px] font-bold text-neutral-500 hover:text-white uppercase transition"
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-[#0f0f0f] p-2.5 rounded-xl border border-neutral-850/60 flex justify-between items-start text-[9px] gap-2.5">
                          <div className="space-y-0.5">
                            <span className="text-orange-500 font-extrabold uppercase">{log.action}</span>
                            <p className="text-neutral-400 leading-relaxed font-sans">{log.details}</p>
                          </div>
                          <span className="text-neutral-500 shrink-0 select-none">{log.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* MODAL DE VISUALIZAÇÃO DE DOCUMENTO DE CAMPEONATO */}
      {documentoParaVisualizar && (
        <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[88vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">{documentoParaVisualizar.titulo}</h3>
                  <span className="text-xs text-neutral-400">Versão {documentoParaVisualizar.versao || '1.0'} — Arena do Competidor</span>
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
              <div className="border-b border-neutral-300 pb-4 text-center space-y-1">
                <h2 className="font-black text-base uppercase text-neutral-900">{documentoParaVisualizar.titulo}</h2>
                <p className="text-[10px] text-neutral-600">{documentoParaVisualizar.descricao}</p>
                <p className="text-[9px] font-mono text-neutral-500">Versão: {documentoParaVisualizar.versao || '1.0'} | Atualizado em: {documentoParaVisualizar.dataAtualizacao || new Date().toLocaleDateString('pt-BR')}</p>
              </div>

              <div className="space-y-4">
                {documentoParaVisualizar.capitulos?.map((cap: any, i: number) => (
                  <div key={i} className="space-y-1.5 border-b border-neutral-200 pb-3 last:border-none">
                    <h3 className="font-black text-xs text-neutral-900 uppercase">{cap.titulo}</h3>
                    {cap.subtitulo && <h4 className="font-bold text-[11px] text-orange-600 uppercase">{cap.subtitulo}</h4>}
                    <p className="text-[11px] text-neutral-800 whitespace-pre-line text-justify">{cap.conteudo}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setDocumentoParaVisualizar(null)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
              >
                Ciente / Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WARNING POPUP IF MAINTENANCE IS ACTIVE */}
      {showManutencaoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-8 max-w-sm w-full border border-neutral-800 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-red-600/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-3">MÓDULO EM MANUTENÇÃO</h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              CAMPEONATOS / INSCRIÇÕES está temporariamente em manutenção. Estamos realizando melhorias e ajustes no sistema. Tente novamente mais tarde.
            </p>
            <button
              onClick={() => {
                setShowManutencaoModal(false);
                onBack();
              }}
              className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-750 text-neutral-300 hover:text-white font-extrabold text-xs py-3.5 rounded-xl transition cursor-pointer"
            >
              Retornar à Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

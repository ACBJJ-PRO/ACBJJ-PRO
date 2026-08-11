import React, { useState } from 'react';
import { User, Student, isAdultPerson } from '../types';
import {
  UserCheck,
  Search,
  Check,
  X,
  Trash2,
  Eye,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  AlertTriangle,
  User as UserIcon,
  Filter,
  Shield,
  Award,
  Clock,
  ExternalLink,
  FileText
} from 'lucide-react';
import { maskPhone, maskCPF, formatDateBR } from '../utils/formatters';

interface SolicitacoesPendentesPaneProps {
  currentUser: User;
  usuarios: User[];
  alunos?: Student[];
  onAprovarUsuario: (id: number) => void;
  onDeletarUsuario: (id: number) => void;
}

export default function SolicitacoesPendentesPane({
  currentUser,
  usuarios,
  alunos = [],
  onAprovarUsuario,
  onDeletarUsuario,
}: SolicitacoesPendentesPaneProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'admin' | 'professor' | 'instrutor' | 'aluno'>('todos');
  
  // Modal states
  const [userToReject, setUserToReject] = useState<{ id: number; nome: string; isDeleteAction?: boolean } | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);

  // Filter pending users (not yet approved)
  const pendingUsers = usuarios.filter((u) => {
    if (u.aprovado) return false;

    // Non-admin can only see pending requests assigned to them
    if (currentUser.tipo !== 'admin') {
      if (u.professorResponsavelId !== currentUser.id) {
        return false;
      }
    }

    // Role filter
    if (typeFilter !== 'todos') {
      if (typeFilter === 'admin' && u.tipo !== 'admin') return false;
      if (typeFilter === 'professor' && u.tipo !== 'professor') return false;
      if (typeFilter === 'instrutor' && u.tipo !== 'instrutor') return false;
      if (typeFilter === 'aluno' && u.tipo !== 'aluno') return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = u.nome.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchCpf = u.cpf ? u.cpf.toLowerCase().includes(q) : false;
      const matchAcademia = u.academia ? u.academia.toLowerCase().includes(q) : false;
      const matchCidade = u.cidade ? u.cidade.toLowerCase().includes(q) : false;
      const matchEstado = u.estado ? u.estado.toLowerCase().includes(q) : false;
      const matchWhatsapp = u.whatsapp ? u.whatsapp.includes(q) : false;
      return matchName || matchEmail || matchCpf || matchAcademia || matchCidade || matchEstado || matchWhatsapp;
    }

    return true;
  });

  const getRoleLabel = (tipo: string) => {
    switch (tipo) {
      case 'admin':
        return 'Mestre / Admin';
      case 'professor':
        return 'Professor';
      case 'instrutor':
        return 'Instrutor';
      case 'aluno':
        return 'Competidor (Aluno)';
      default:
        return 'Usuário';
    }
  };

  const getRoleBadgeStyle = (tipo: string) => {
    switch (tipo) {
      case 'admin':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'professor':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'instrutor':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'aluno':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  const getWhatsAppUrl = (phone?: string) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    const fullDigits = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${fullDigits}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recente';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER & TOP CONTROLS */}
      <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-900">
          <div className="flex items-center gap-3 text-orange-500">
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <UserCheck className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Solicitações de Contas Pendentes
                </h3>
                {pendingUsers.length > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    {pendingUsers.length} PENDENTE{pendingUsers.length > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Gerencie, analise e aprove novos cadastros de Mestres, Professores, Instrutores e Competidores
              </p>
            </div>
          </div>

          {/* SEARCH FIELD */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, academia, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:border-orange-500 outline-none transition"
            />
          </div>
        </div>

        {/* ROLE FILTER BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
          <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-orange-500" /> Filtrar Por:
          </span>
          <button
            onClick={() => setTypeFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
              typeFilter === 'todos'
                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                : 'bg-[#1a1a1a] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Todas ({usuarios.filter((u) => !u.aprovado).length})
          </button>
          <button
            onClick={() => setTypeFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
              typeFilter === 'admin'
                ? 'bg-red-600 text-white border-red-500 shadow-md'
                : 'bg-[#1a1a1a] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Mestres ({usuarios.filter((u) => !u.aprovado && u.tipo === 'admin').length})
          </button>
          <button
            onClick={() => setTypeFilter('professor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
              typeFilter === 'professor'
                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                : 'bg-[#1a1a1a] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Professores ({usuarios.filter((u) => !u.aprovado && u.tipo === 'professor').length})
          </button>
          <button
            onClick={() => setTypeFilter('instrutor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
              typeFilter === 'instrutor'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : 'bg-[#1a1a1a] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Instrutores ({usuarios.filter((u) => !u.aprovado && u.tipo === 'instrutor').length})
          </button>
          <button
            onClick={() => setTypeFilter('aluno')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
              typeFilter === 'aluno'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-[#1a1a1a] text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Competidores ({usuarios.filter((u) => !u.aprovado && u.tipo === 'aluno').length})
          </button>
        </div>
      </div>

      {/* REQUESTS LIST GRID */}
      {pendingUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingUsers.map((user) => {
            const waUrl = getWhatsAppUrl(user.whatsapp);
            const userCity = user.cidade || (user.endereco && user.endereco.includes('-') ? user.endereco.split('-')[0].trim() : '');
            const userState = user.estado || (user.endereco && user.endereco.includes('-') ? user.endereco.split('-')[1]?.trim() : '');

            return (
              <div
                key={user.id}
                className="bg-[#141414] p-5 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition flex flex-col justify-between shadow-md relative group"
              >
                {/* CARD CONTENT */}
                <div>
                  {/* USER HEADER */}
                  <div className="flex items-start gap-3 pb-3 border-b border-neutral-900">
                    {user.fotoPerfil ? (
                      <img
                        src={user.fotoPerfil}
                        alt={user.nome}
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-orange-500">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getRoleBadgeStyle(user.tipo)}`}>
                          {getRoleLabel(user.tipo)}
                        </span>
                        <div className="flex items-center gap-1">
                          {(user.isCpfProvisorio || user.cpf?.startsWith('INF-') || !isAdultPerson(user)) && (
                            <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                              IIP Provisório
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            Aguardando Aprovação
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5 truncate" title={user.nome}>
                        {user.nome}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="mt-3.5 space-y-2 text-xs text-neutral-300">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                        <FileText className="w-3 h-3 text-neutral-500" /> Documento / CPF:
                      </span>
                      <span className="font-mono text-[11px] font-bold text-neutral-200">
                        {user.isCpfProvisorio || user.cpf?.startsWith('INF-') ? (
                          <span className="text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {user.cpf || 'IIP Provisório'}
                          </span>
                        ) : (
                          maskCPF(user.cpf || '') || 'Não informado'
                        )}
                      </span>
                    </div>

                    {!isAdultPerson(user) && user.responsavelNome && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-amber-400" /> Responsável:
                        </span>
                        <span className="font-medium text-amber-300 truncate max-w-[170px]" title={user.responsavelNome}>
                          {user.responsavelNome}
                        </span>
                      </div>
                    )}
                    {user.whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-500" /> WhatsApp:
                        </span>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{maskPhone(user.whatsapp)}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 transition"
                              title="Abrir no WhatsApp"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                        <Building className="w-3 h-3 text-neutral-500" /> Academia:
                      </span>
                      <span className="font-semibold text-neutral-200 truncate max-w-[170px]" title={user.academia || 'Não informada'}>
                        {user.academia || 'Não informada'}
                      </span>
                    </div>

                    {(userCity || userState) && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-500" /> Local:
                        </span>
                        <span className="font-medium text-neutral-300">
                          {userCity && userState ? `${userCity} - ${userState}` : userCity || userState}
                        </span>
                      </div>
                    )}

                    {user.faixa && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                          <Award className="w-3 h-3 text-neutral-500" /> Graduação:
                        </span>
                        <span className="font-bold text-orange-400">
                          {user.faixa}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[11px]">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" /> Solicitação em:
                      </span>
                      <span className="text-neutral-400 font-medium">
                        {formatDate(user.createdAt || user.dataCadastro)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-5 pt-3 border-t border-neutral-900 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      onAprovarUsuario(user.id);
                      alert(`Cadastro de ${user.nome} aprovado com sucesso!`);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/30"
                  >
                    <Check className="w-3.5 h-3.5" /> Aprovar
                  </button>

                  <button
                    onClick={() => setUserToReject({ id: user.id, nome: user.nome, isDeleteAction: false })}
                    className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Recusar cadastro"
                  >
                    <X className="w-3.5 h-3.5" /> Recusar
                  </button>

                  <button
                    onClick={() => setUserToReject({ id: user.id, nome: user.nome, isDeleteAction: true })}
                    className="bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 py-2 px-2.5 rounded-xl transition cursor-pointer"
                    title="Excluir solicitação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedUserDetail(user)}
                    className="bg-neutral-900 hover:bg-orange-500/20 text-neutral-300 hover:text-orange-400 border border-neutral-800 py-2 px-2.5 rounded-xl transition cursor-pointer"
                    title="Visualizar detalhes completos"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#141414] border border-neutral-850 rounded-2xl p-12 text-center text-neutral-400">
          <UserCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3 opacity-60" />
          <h4 className="text-base font-bold text-white">Nenhuma Solicitação Pendente</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            {typeFilter !== 'todos' || searchTerm
              ? 'Nenhuma solicitação encontrada com os filtros aplicados.'
              : 'Todas as solicitações de novas contas foram analisadas e aprovadas!'}
          </p>
        </div>
      )}

      {/* CONFIRM REJECT / DELETE MODAL */}
      {userToReject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative text-left">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {userToReject.isDeleteAction ? 'Excluir Solicitação' : 'Confirmar Recusa'}
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja realmente {userToReject.isDeleteAction ? 'excluir permanentemente a solicitação' : 'recusar o cadastro'} de <strong className="text-white">{userToReject.nome}</strong>? Esta ação removerá a solicitação do sistema.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setUserToReject(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeletarUsuario(userToReject.id);
                  setUserToReject(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-red-600/15 transition cursor-pointer"
              >
                {userToReject.isDeleteAction ? 'Excluir' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED USER VIEW MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-lg w-full border border-neutral-800 shadow-2xl relative text-left my-8">
            <button
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-neutral-900 p-2 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* USER PROFILE HEADER */}
            <div className="flex items-center gap-4 pb-4 border-b border-neutral-800">
              {selectedUserDetail.fotoPerfil ? (
                <img
                  src={selectedUserDetail.fotoPerfil}
                  alt={selectedUserDetail.nome}
                  className="w-16 h-16 rounded-2xl object-cover border border-neutral-700 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-orange-500">
                  <UserIcon className="w-8 h-8" />
                </div>
              )}
              <div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border inline-block mb-1 ${getRoleBadgeStyle(selectedUserDetail.tipo)}`}>
                  {getRoleLabel(selectedUserDetail.tipo)}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedUserDetail.nome}</h3>
                <p className="text-xs text-neutral-400">{selectedUserDetail.email}</p>
              </div>
            </div>

            {/* DETAILED GRID DATA */}
            <div className="mt-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#1a1a1a] p-3.5 rounded-2xl border border-neutral-800">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">CPF:</span>
                  <span className="text-white font-medium">{selectedUserDetail.cpf ? maskCPF(selectedUserDetail.cpf) : 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">WhatsApp / Tel:</span>
                  <span className="text-white font-medium">{selectedUserDetail.whatsapp ? maskPhone(selectedUserDetail.whatsapp) : 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Data Nascimento:</span>
                  <span className="text-white font-medium">{selectedUserDetail.dataNascimento ? formatDateBR(selectedUserDetail.dataNascimento) : 'Não informada'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Graduação / Faixa:</span>
                  <span className="text-orange-400 font-bold">{selectedUserDetail.faixa || 'Faixa Branca'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#1a1a1a] p-3.5 rounded-2xl border border-neutral-800">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Academia:</span>
                  <span className="text-white font-medium">{selectedUserDetail.academia || 'Não informada'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Professor Resp.:</span>
                  <span className="text-white font-medium">{selectedUserDetail.professorResponsavelNome || 'Nenhum'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Cidade:</span>
                  <span className="text-white font-medium">{selectedUserDetail.cidade || 'Não informada'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Estado:</span>
                  <span className="text-white font-medium">{selectedUserDetail.estado || 'Não informado'}</span>
                </div>
              </div>

              {!isAdultPerson(selectedUserDetail) && selectedUserDetail.responsavelNome && (
                <div className="bg-[#1a1a1a] p-3.5 rounded-2xl border border-neutral-800 space-y-1.5">
                  <span className="text-orange-400 block text-[10px] uppercase font-extrabold">Responsável Legal (Menor de Idade):</span>
                  <p className="text-white font-medium">Nome: {selectedUserDetail.responsavelNome}</p>
                  {selectedUserDetail.responsavelCpf && <p className="text-neutral-300">CPF: {maskCPF(selectedUserDetail.responsavelCpf)}</p>}
                  {selectedUserDetail.responsavelTelefone && <p className="text-neutral-300">Telefone: {maskPhone(selectedUserDetail.responsavelTelefone)}</p>}
                </div>
              )}

              {selectedUserDetail.contatoEmergenciaNome && (
                <div className="bg-[#1a1a1a] p-3.5 rounded-2xl border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Contato de Emergência:</span>
                  <p className="text-white font-medium">{selectedUserDetail.contatoEmergenciaNome} - {selectedUserDetail.contatoEmergenciaTelefone || ''}</p>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  const id = selectedUserDetail.id;
                  const nome = selectedUserDetail.nome;
                  setSelectedUserDetail(null);
                  setUserToReject({ id, nome, isDeleteAction: false });
                }}
                className="bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Recusar Solicitação
              </button>

              <button
                onClick={() => {
                  const id = selectedUserDetail.id;
                  const nome = selectedUserDetail.nome;
                  setSelectedUserDetail(null);
                  onAprovarUsuario(id);
                  alert(`Cadastro de ${nome} aprovado com sucesso!`);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/30"
              >
                <Check className="w-4 h-4" /> Aprovar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

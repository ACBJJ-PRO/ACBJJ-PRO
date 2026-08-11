import React, { useState } from 'react';
import { User, UserRole, isAdultPerson } from '../types';
import { Users, Search, Phone, Mail, MessageCircle, Key, Trash2, CheckCircle, Edit, Shield } from 'lucide-react';
import { maskPhone } from '../utils/formatters';
import { validarCPF, maskCPF } from './OConfrontoModule';

interface ProfessoresPaneProps {
  currentUser: User;
  usuarios: User[];
  onAprovarUsuario: (id: number) => void;
  onDeletarUsuario: (id: number) => void;
  onChangeUserPassword: (id: number, novaSenha: string) => void;
  onUpdateUsuario?: (id: number, updatedFields: Partial<User>) => void;
}

export default function ProfessoresPane({
  currentUser,
  usuarios,
  onAprovarUsuario,
  onDeletarUsuario,
  onChangeUserPassword,
  onUpdateUsuario,
}: ProfessoresPaneProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Password Change Modal State
  const [profToChangePassword, setProfToChangePassword] = useState<number | null>(null);
  const [profNameToChangePassword, setProfNameToChangePassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');

  // Delete Confirmation State
  const [profToDelete, setProfToDelete] = useState<number | null>(null);
  const [profNameToDelete, setProfNameToDelete] = useState<string>('');

  // Edit User Modal State
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editUserNome, setEditUserNome] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserCpf, setEditUserCpf] = useState('');
  const [editUserDataNascimento, setEditUserDataNascimento] = useState('');
  const [editUserFaixa, setEditUserFaixa] = useState('');
  const [editUserWhatsapp, setEditUserWhatsapp] = useState('');
  const [editUserTipo, setEditUserTipo] = useState<UserRole>('professor');

  const handleStartEditUser = (user: User) => {
    setUserToEdit(user);
    setEditUserNome(user.nome || '');
    setEditUserEmail(user.email || '');
    setEditUserCpf(user.cpf || '');
    setEditUserDataNascimento(user.dataNascimento || '');
    setEditUserFaixa(user.faixa || 'Faixa Preta');
    setEditUserWhatsapp(user.whatsapp || '');
    setEditUserTipo(user.tipo || 'professor');
  };

  // Helper for WhatsApp link
  const getWhatsAppUrl = (phone?: string) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    const fullDigits = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${fullDigits}`;
  };

  // Filter teachers, instructors and admins (ONLY APPROVED accounts)
  const filteredProfs = usuarios.filter((u) => {
    if (u.tipo === 'aluno') return false;
    // Exclude unapproved/pending accounts from Gestão
    if (!u.aprovado) return false;

    // For Professors and Instructors: never show ADMINISTRADOR accounts, and only show their own profile
    if (currentUser && currentUser.tipo !== 'admin') {
      if (u.tipo === 'admin' || u.email === 'admin@admin.com' || u.nome.toUpperCase().includes('ADMINISTRADOR')) {
        return false;
      }
      if (u.id !== currentUser.id) {
        return false;
      }
    }

    const term = searchTerm.toLowerCase();
    return (
      u.nome.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.whatsapp && u.whatsapp.includes(term))
    );
  });

  const getRoleBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'admin':
        return 'bg-red-600/20 text-red-400 border border-red-500/30';
      case 'professor':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'instrutor':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-neutral-800 text-neutral-400';
    }
  };

  const getRoleLabel = (tipo: string) => {
    switch (tipo) {
      case 'admin':
        return 'Mestre / Admin';
      case 'professor':
        return 'Mestre / Professor';
      case 'instrutor':
        return 'Instrutor';
      default:
        return tipo;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER E FILTRO */}
      <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-900 flex-wrap gap-4">
          <div className="flex items-center gap-2 text-orange-500">
            <Users className="w-5.5 h-5.5" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Corpo Docente & Administração</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Mestres, Professores, Instrutores e Administradores da plataforma</p>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-3 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Filtrar por nome, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:border-orange-500 outline-none transition"
            />
          </div>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto border border-neutral-800/80 rounded-2xl mt-6">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-neutral-800 text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Foto</th>
                <th className="py-3.5 px-4">Nome</th>
                <th className="py-3.5 px-4">Perfil</th>
                <th className="py-3.5 px-4">E-mail</th>
                <th className="py-3.5 px-4">Telefone / WA</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredProfs.length > 0 ? (
                filteredProfs.map((prof) => {
                  const isAdminAccount = prof.tipo === 'admin' || prof.email === 'admin@admin.com';
                  const waUrl = getWhatsAppUrl(prof.whatsapp);

                  return (
                    <tr key={prof.id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="py-3.5 px-4">
                        {prof.fotoPerfil ? (
                          <img
                            src={prof.fotoPerfil}
                            alt={prof.nome}
                            className="w-9 h-9 rounded-full object-cover border-2 border-neutral-800"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            isAdminAccount
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                          }`}>
                            {prof.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white text-xs">
                        {prof.nome}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider py-1 px-2.5 rounded-lg ${getRoleBadgeColor(prof.tipo)}`}>
                          {getRoleLabel(prof.tipo)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-300 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{prof.email}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-300">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-neutral-300 text-[11px]">
                            {prof.whatsapp || 'Não cadastrado'}
                          </span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {prof.aprovado ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 py-1 px-2.5 rounded-lg font-bold uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 py-1 px-2.5 rounded-lg font-bold uppercase tracking-wider animate-pulse">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs">
                        <div className="flex justify-end gap-1.5">
                          {/* APPROVE ACTION BUTTON */}
                          {!prof.aprovado && currentUser.tipo === 'admin' && (
                            <button
                              onClick={() => {
                                onAprovarUsuario(prof.id);
                                alert(`Perfil de "${prof.nome}" aprovado!`);
                              }}
                              className="inline-flex items-center font-bold text-[10px] py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                            >
                              Homologar
                            </button>
                          )}

                          {/* EDIT USER BUTTON */}
                          {currentUser.tipo === 'admin' && (
                            <button
                              onClick={() => handleStartEditUser(prof)}
                              className="inline-flex items-center gap-1 font-semibold text-[11px] py-1.5 px-3 rounded-lg transition bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 cursor-pointer"
                              title="Editar Cadastro"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          )}

                          {/* CHANGE PASSWORD BUTTON */}
                          {currentUser.tipo === 'admin' && (
                            <button
                              onClick={() => {
                                setProfToChangePassword(prof.id);
                                setProfNameToChangePassword(prof.nome);
                                setNewPassword('');
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-[11px] py-1.5 px-3 rounded-lg transition bg-neutral-850 hover:bg-orange-500 text-neutral-300 hover:text-white border border-neutral-700 hover:border-orange-500 cursor-pointer"
                              title="Alterar Senha"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Alterar Senha
                            </button>
                          )}

                          {/* EXCLUIR BUTTON - COMPLETELY HIDDEN FOR ADMIN ACCOUNTS */}
                          {!isAdminAccount && currentUser.tipo === 'admin' && (
                            <button
                              onClick={() => {
                                setProfToDelete(prof.id);
                                setProfNameToDelete(prof.nome);
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-[11px] py-1.5 px-3 rounded-lg transition bg-neutral-850 hover:bg-red-600 hover:text-white text-neutral-400 border border-neutral-700 hover:border-red-600 cursor-pointer"
                              title="Excluir cadastro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-500 text-xs">
                    Nenhum profissional localizado com este termo de busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="md:hidden space-y-3 mt-6">
          {filteredProfs.length > 0 ? (
            filteredProfs.map((prof) => {
              const isAdminAccount = prof.tipo === 'admin' || prof.email === 'admin@admin.com';
              const waUrl = getWhatsAppUrl(prof.whatsapp);

              return (
                <div key={prof.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800/80 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    {prof.fotoPerfil ? (
                      <img
                        src={prof.fotoPerfil}
                        alt={prof.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-neutral-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 uppercase border-2 ${
                        isAdminAccount
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}>
                        {prof.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{prof.nome}</h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg inline-block mt-1 ${getRoleBadgeColor(prof.tipo)}`}>
                        {getRoleLabel(prof.tipo)}
                      </span>
                    </div>
                  </div>

                  {/* Contatos: Telefone (Esquerda) & E-mail (Direita) */}
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 block">Telefone / WA</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-white text-[11px] truncate">{prof.whatsapp || 'N/A'}</span>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition shrink-0"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 block">E-mail</span>
                      <span className="font-mono text-neutral-300 text-[11px] truncate block mt-0.5" title={prof.email}>
                        {prof.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-900 justify-end flex-wrap">
                    {!prof.aprovado && currentUser.tipo === 'admin' && (
                      <button
                        onClick={() => {
                          onAprovarUsuario(prof.id);
                          alert(`Perfil de "${prof.nome}" aprovado!`);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition whitespace-nowrap"
                      >
                        Homologar
                      </button>
                    )}
                    {currentUser.tipo === 'admin' && (
                      <button
                        onClick={() => handleStartEditUser(prof)}
                        className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 cursor-pointer whitespace-nowrap"
                        title="Editar Cadastro"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                    )}
                    {currentUser.tipo === 'admin' && (
                      <button
                        onClick={() => {
                          setProfToChangePassword(prof.id);
                          setProfNameToChangePassword(prof.nome);
                          setNewPassword('');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-neutral-850 hover:bg-orange-500 text-neutral-300 hover:text-white border border-neutral-700 hover:border-orange-500 cursor-pointer whitespace-nowrap"
                      >
                        Alterar Senha
                      </button>
                    )}
                    {!isAdminAccount && currentUser.tipo === 'admin' && (
                      <button
                        onClick={() => {
                          setProfToDelete(prof.id);
                          setProfNameToDelete(prof.nome);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 font-bold text-[10px] py-1.5 px-2 rounded-lg bg-neutral-850 text-neutral-400 border border-neutral-700 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer whitespace-nowrap"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 opacity-50 text-xs">Nenhum profissional encontrado.</div>
          )}
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {profToDelete !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 text-red-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Remover Profissional
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Você tem certeza de que deseja excluir o perfil de <strong className="text-white">{profNameToDelete}</strong>? Esta ação é irreversível e removerá sua conta de acesso ao sistema.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setProfToDelete(null);
                  setProfNameToDelete('');
                }}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const targetUser = usuarios.find((u) => u.id === profToDelete);
                  if (targetUser?.tipo === 'admin' || targetUser?.email === 'admin@admin.com') {
                    alert('A conta administradora é a conta base da plataforma e não pode ser excluída.');
                    setProfToDelete(null);
                    setProfNameToDelete('');
                    return;
                  }

                  onDeletarUsuario(profToDelete);
                  setProfToDelete(null);
                  setProfNameToDelete('');
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-500/15 transition cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {profToChangePassword !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 text-orange-500 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Alterar Senha
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-4">
              Digite a nova senha para <strong className="text-white">{profNameToChangePassword}</strong>:
            </p>
            
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Insira a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setNewPassword('1234567')}
                className="text-[10px] text-neutral-400 hover:text-orange-500 font-semibold transition uppercase tracking-wider block"
              >
                Usar Senha Padrão (1234567)
              </button>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setProfToChangePassword(null);
                  setProfNameToChangePassword('');
                  setNewPassword('');
                }}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (newPassword.trim().length < 4) {
                    alert('Por segurança, insira uma senha com pelo menos 4 caracteres.');
                    return;
                  }
                  onChangeUserPassword(profToChangePassword, newPassword.trim());
                  alert(`Senha do usuário "${profNameToChangePassword}" redefinida com sucesso!`);
                  setProfToChangePassword(null);
                  setProfNameToChangePassword('');
                  setNewPassword('');
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-orange-500/15 transition cursor-pointer"
              >
                Salvar Nova Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL DO USUÁRIO/PROFESSOR/INSTRUTOR */}
      {userToEdit !== null && (() => {
        const cleanedNewCpf = editUserCpf.trim().replace(/\D/g, '');
        let userCpfError = '';
        if (cleanedNewCpf.length > 0) {
          if (cleanedNewCpf.length < 11) {
            userCpfError = 'CPF incompleto! Digite os 11 dígitos do CPF.';
          } else if (!validarCPF(cleanedNewCpf)) {
            userCpfError = 'CPF inválido! Digite um CPF válido com 11 dígitos e verificadores corretos.';
          } else {
            const duplicateCpf = usuarios.some((u) => Number(u.id) !== Number(userToEdit.id) && isAdultPerson(u) && u.cpf && !u.cpf.startsWith('INF-') && u.cpf.replace(/\D/g, '') === cleanedNewCpf);
            if (duplicateCpf) {
              userCpfError = 'Este CPF já está cadastrado para outro usuário!';
            }
          }
        }

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

                  if (userCpfError) {
                    return;
                  }

                  const finalUpperNome = editUserNome.trim().toUpperCase();

                  if (onUpdateUsuario) {
                    onUpdateUsuario(userToEdit.id, {
                      nome: finalUpperNome,
                      email: editUserEmail.trim().toLowerCase(),
                      cpf: editUserCpf.trim(),
                      dataNascimento: editUserDataNascimento,
                      whatsapp: editUserWhatsapp.trim(),
                      faixa: editUserFaixa,
                      tipo: editUserTipo,
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
                      onChange={(e) => setEditUserWhatsapp(maskPhone(e.target.value))}
                      placeholder="(98) 99999-9999"
                      className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 text-xs focus:border-orange-500 outline-none font-medium font-mono"
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
                    disabled={Boolean(userCpfError)}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                      userCpfError
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

import React, { useState } from 'react';
import { RecuperacaoSenha, User } from '../types';
import { KeyRound, CheckCircle, Trash2, Calendar, User as UserIcon, Mail, Fingerprint, Clock, Check, AlertTriangle } from 'lucide-react';

interface ResetRequestsPaneProps {
  recuperacoesSenha: RecuperacaoSenha[];
  usuarios: User[];
  onResetarSenha: (requestId: string) => void;
  onRemoverRequest: (requestId: string) => void;
}

export default function ResetRequestsPane({
  recuperacoesSenha,
  usuarios,
  onResetarSenha,
  onRemoverRequest,
}: ResetRequestsPaneProps) {

  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  return (
    <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
        <KeyRound className="w-5.5 h-5.5 text-orange-500" />
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Solicitações de Reset de Senha</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Gerencie os pedidos de redefinição de acesso enviados pelos alunos e professores</p>
        </div>
      </div>

      <div className="space-y-4">
        {recuperacoesSenha.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-850 text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Usuário / CPF</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {recuperacoesSenha.map((req) => {
                  const cleanReqCpf = req.cpf.replace(/\D/g, '');
                  const matchedUser = usuarios.find((u) => {
                    const uCpfClean = u.cpf ? u.cpf.replace(/\D/g, '') : '';
                    return uCpfClean && uCpfClean === cleanReqCpf;
                  });

                  const nomeExibicao = matchedUser ? matchedUser.nome : 'Usuário não encontrado';
                  const emailExibicao = req.email || (matchedUser ? matchedUser.email : 'N/A');

                  return (
                    <tr key={req.id} className="hover:bg-neutral-900/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                            {nomeExibicao}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <Fingerprint className="w-3.5 h-3.5 text-neutral-600" />
                            {formatCPF(req.cpf)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-300">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-500" />
                          {emailExibicao}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-300 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          {req.data}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {req.status === 'pendente' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Clock className="w-3 h-3 animate-pulse" />
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Resolvido
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {req.status === 'pendente' ? (
                            <button
                              onClick={() => {
                                setConfirmResetId(req.id);
                              }}
                              className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-wide transition active:scale-95 flex items-center gap-1 cursor-pointer"
                              title="Resetar Senha"
                            >
                              <KeyRound className="w-3 h-3" />
                              Resetar Senha
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide px-2.5 py-1.5 bg-neutral-900 border border-neutral-850 rounded-lg flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-500" />
                              Resolvida
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setConfirmDeleteId(req.id);
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition active:scale-95 cursor-pointer"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 text-sm">
            Nenhuma solicitação de recuperação de acesso no momento.
          </div>
        )}
      </div>

      {/* CONFIRM RESET PASSWORD MODAL */}
      {confirmResetId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1500] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 text-orange-500 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Redefinir Senha
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja realmente redefinir a senha deste usuário?
            </p>
            
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmResetId(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Não
              </button>
              <button
                onClick={() => {
                  onResetarSenha(confirmResetId);
                  setConfirmResetId(null);
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-orange-500/15 transition cursor-pointer"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE REQUEST MODAL */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1500] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Excluir Solicitação
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja realmente excluir esta solicitação de reset de senha?
            </p>
            
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Não
              </button>
              <button
                onClick={() => {
                  onRemoverRequest(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-500/15 transition cursor-pointer"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Notification, Student, User } from '../types';
import { Bell, Send, Users, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';

interface ChatPaneProps {
  user: User;
  alunos: Student[];
  notificacoes: Notification[];
  onEnviarNotificacao: (texto: string, para: string) => void;
  onRemoverNotificacao?: (id: string) => void;
}

export default function ChatPane({ user, alunos, notificacoes, onEnviarNotificacao, onRemoverNotificacao }: ChatPaneProps) {
  const [destino, setDestino] = useState<'todos' | 'individual'>('todos');
  const [selectedStudentId, setSelectedStudentId] = useState<number>(alunos[0]?.id || 0);
  const [notifToExclude, setNotifToExclude] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) {
      alert('Escreva a mensagem antes de enviar!');
      return;
    }

    let targetName = 'Enviar para todos';
    if (destino === 'individual') {
      const student = alunos.find((a) => a.id === selectedStudentId);
      if (!student) {
        alert('Selecione um aluno válido.');
        return;
      }
      targetName = student.nome;
    }

    onEnviarNotificacao(mensagem, targetName);
    alert('Notificação transmitida com sucesso para o canal!');
    setMensagem('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ENVIAR NOTIFICAÇÃO CARD */}
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md h-fit">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
            <Bell className="w-5.5 h-5.5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Central de Transmissão</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Dispare notificações urgentes para os celulares dos alunos</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-neutral-400 uppercase block">Canal de Destino *</label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value as 'todos' | 'individual')}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
              >
                <option value="todos">📣 Enviar para todos</option>
                <option value="individual">👤 Atleta Específico (Individual)</option>
              </select>
            </div>

            {destino === 'individual' && (
              <div className="space-y-1 text-left animate-scale-in">
                <label className="text-xs font-semibold text-neutral-400 uppercase block">Selecionar Atleta *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                >
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      🥋 {a.nome} ({a.faixa})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-neutral-400 uppercase block">Mensagem da Notificação *</label>
              <textarea
                required
                rows={4}
                placeholder="Escreva a mensagem técnica, aviso de feriado ou lembrete de mensalidade..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none transition min-h-[100px]"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg"
            >
              <Send className="w-4 h-4" />
              Disparar Notificação
            </button>
          </form>
        </div>

        {/* LISTA HISTÓRICO DE MENSAGENS */}
        <div className="lg:col-span-2 bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
            <Users className="w-5.5 h-5.5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Histórico de Mensagens</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Todas as transmissões e chats registrados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notificacoes.length > 0 ? (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-850 hover:border-neutral-700 transition text-left space-y-2 relative group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500 font-mono">📅 {n.data}</span>
                        {user.tipo === 'admin' && onRemoverNotificacao && (
                          <button
                            onClick={() => setNotifToExclude(n.id)}
                            className="text-red-400 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition cursor-pointer flex items-center justify-center border border-red-500/20 shadow-sm"
                            title="Excluir Notificação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-orange-400 font-bold uppercase bg-orange-500/5 px-2.5 py-0.5 rounded-md border border-orange-500/10 shrink-0">
                        Para: {n.para}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">{n.texto}</p>
                  </div>
                  <div className="text-[10px] text-neutral-500 text-right pt-1.5 border-t border-neutral-900/40 mt-2">
                    Enviado por: <strong className="text-neutral-400">{n.de}</strong>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 opacity-50 text-sm col-span-full">Nenhuma notificação registrada no histórico.</div>
            )}
          </div>
        </div>
      </div>

      {notifToExclude !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar Exclusão
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja excluir esta notificação permanentemente para todos os usuários? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setNotifToExclude(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onRemoverNotificacao) {
                    onRemoverNotificacao(notifToExclude);
                  }
                  setNotifToExclude(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/15 transition cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

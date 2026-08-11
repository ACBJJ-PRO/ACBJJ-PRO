import React, { useState } from 'react';
import { NewsItem, User } from '../types';
import { Newspaper, BellRing, AlertTriangle, Send, Trash2 } from 'lucide-react';

interface NoticiasPaneProps {
  user: User;
  noticias: NewsItem[];
  onPublicarNoticia: (titulo: string, conteudo: string, tipo: 'noticia' | 'aviso' | 'urgente') => void;
  onExcluirNoticia: (id: number) => void;
}

export default function NoticiasPane({ user, noticias, onPublicarNoticia, onExcluirNoticia }: NoticiasPaneProps) {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<'noticia' | 'aviso' | 'urgente'>('noticia');

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !conteudo) {
      alert('Preencha o título e o conteúdo da notícia!');
      return;
    }
    onPublicarNoticia(titulo, conteudo, tipo);
    setTitulo('');
    setConteudo('');
    setTipo('noticia');
    alert('Comunicado publicado com sucesso!');
  };

  const getTipoBadge = (tipoStr: string) => {
    switch (tipoStr) {
      case 'urgente':
        return 'bg-red-500/15 text-red-400 border border-red-500/20';
      case 'aviso':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PUBLICAR NOTÍCIA (Admin Only) */}
        {user.tipo === 'admin' && (
          <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md h-fit">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
              <Newspaper className="w-5.5 h-5.5 text-orange-500" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Publicar Informativo</h3>
                <p className="text-xs text-neutral-400 mt-0.5 font-medium">Envie avisos para o painel de todos os atletas</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Título do Comunicado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Treino Suspenso no Feriado"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none transition"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Tipo de Mensagem</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'noticia' | 'aviso' | 'urgente')}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="noticia">📰 Notícia Geral</option>
                  <option value="aviso">⚠️ Aviso Importante</option>
                  <option value="urgente">🔴 Alerta Urgente</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Conteúdo Informativo *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escreva a mensagem que deseja transmitir..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-xs focus:border-orange-500 outline-none transition min-h-[100px]"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Publicar Comunicado
              </button>
            </form>
          </div>
        )}

        {/* LISTA DE COMUNICADOS */}
        <div className={`${user.tipo === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md`}>
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
            <Newspaper className="w-5.5 h-5.5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Painel de Avisos & Notícias</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Últimas postagens e circulares oficiais da Arena</p>
            </div>
          </div>

          <div className="space-y-4">
            {noticias.length > 0 ? (
              noticias.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-[#1a1a1a]/40 border-l-4 text-left ${
                    item.tipo === 'urgente'
                      ? 'border-l-red-500'
                      : item.tipo === 'aviso'
                      ? 'border-l-amber-500'
                      : 'border-l-blue-500'
                  } border-r border-t border-b border-neutral-850 hover:border-neutral-700 transition shadow-sm`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-wider py-1 px-3 rounded-full ${getTipoBadge(item.tipo)}`}>
                      {item.tipo}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">{item.data}</span>
                  </div>

                  <h4 className="text-base font-bold text-white tracking-tight">{item.titulo}</h4>
                  <p className="text-neutral-300 text-xs mt-2.5 leading-relaxed whitespace-pre-wrap">{item.conteudo}</p>

                  <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-between text-[10px] text-neutral-500">
                    <span>Autor: <strong className="text-neutral-400">{item.autor}</strong></span>
                    <span>ACBJJ PRO</span>
                  </div>

                  {user.tipo === 'admin' && (
                    <div className="flex justify-end mt-2 pt-2 border-t border-neutral-900/40">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-500 font-bold uppercase">Tem certeza?</span>
                          <button
                            onClick={() => {
                              onExcluirNoticia(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] py-1 px-2.5 rounded transition cursor-pointer"
                          >
                            Sim, Excluir
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-[#1a1a1a] hover:bg-neutral-850 text-neutral-300 font-bold text-[10px] py-1 px-2.5 border border-neutral-800 rounded transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="flex items-center gap-1.5 text-red-500 hover:text-red-400 font-bold text-[10px] py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir Comunicado
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 opacity-50 text-sm">Nenhum informativo publicado no momento.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

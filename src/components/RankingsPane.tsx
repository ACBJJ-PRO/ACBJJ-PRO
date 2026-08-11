import React, { useState } from 'react';
import { Student } from '../types';
import { Trophy, Medal, Award, Flame, Plus, X } from 'lucide-react';

const getSharedRank = (index: number, list: Student[]) => {
  if (index === 0) return 1;
  let rank = 1;
  for (let i = 1; i <= index; i++) {
    const prevVal = list[i-1]?.pontosCompeticao || 0;
    const currVal = list[i]?.pontosCompeticao || 0;
    if (currVal < prevVal) {
      rank = i + 1;
    }
  }
  return rank;
};

interface RankingsPaneProps {
  alunos: Student[];
  currentUser?: any;
  onAdicionarMedalha: (alunoId: number, medalhaTipo: 'ouro' | 'prata' | 'bronze', evento: string) => void;
}

export default function RankingsPane({ alunos, currentUser, onAdicionarMedalha }: RankingsPaneProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(alunos[0]?.id || 0);
  const [medalhaTipo, setMedalhaTipo] = useState<'ouro' | 'prata' | 'bronze'>('ouro');
  const [evento, setEvento] = useState('');

  // Sorters
  const sortedComp = [...alunos].sort((a, b) => b.pontosCompeticao - a.pontosCompeticao);
  const top3 = sortedComp.slice(0, 3);
  const remainingComp = sortedComp.slice(3);

  const myStudent = currentUser
    ? alunos.find((a) => String(a.id) === String(currentUser.id) || String(a.usuarioId) === String(currentUser.id) || a.nome.toLowerCase() === currentUser.nome?.toLowerCase())
    : null;

  const sortedFreq = [...alunos].sort((a, b) => b.checkins.length - a.checkins.length).slice(0, 5);

  const handleOpenAddModal = () => {
    if (alunos.length === 0) {
      alert('Por favor, cadastre alunos antes de atribuir pontos.');
      return;
    }
    setSelectedStudentId(alunos[0].id);
    setShowAddModal(true);
  };

  const handleAddMedalhaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Selecione um aluno.');
      return;
    }
    onAdicionarMedalha(selectedStudentId, medalhaTipo, evento || 'Torneio Interno');
    alert('Pontuação e medalha atribuídas com sucesso!');
    setShowAddModal(false);
    setEvento('');
  };

  const [activeTab, setActiveTab] = useState<'competicao' | 'presenca'>('competicao');

  return (
    <div className="space-y-6">
      {/* Sub-tab Switcher */}
      <div className="flex gap-2 bg-[#141414] p-1.5 rounded-xl border border-neutral-800 max-w-md text-left">
        <button
          type="button"
          onClick={() => setActiveTab('competicao')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'competicao'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Ranking de Competição
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('presenca')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'presenca'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4" />
          Ranking por Presença
        </button>
      </div>

      {activeTab === 'competicao' ? (
        <>
          {/* SEÇÃO COMPETIÇÃO */}
          <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-neutral-900 flex-wrap gap-2 text-left">
              <div className="flex items-center gap-2 text-orange-500">
                <Trophy className="w-5.5 h-5.5" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Ranking de Competição</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Soma total de medalhas em torneios oficiais e internos</p>
                </div>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-orange-500/10 cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                Adicionar Medalha
              </button>
            </div>

            {/* PERSONAL MEDALS BANNER FOR CURRENT USER */}
            {myStudent && (
              <div className="mb-6 p-4 bg-[#1a1a1a] rounded-2xl border border-neutral-800 shadow-md">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest text-left mb-3 flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-400" />
                  Suas Medalhas Conquistadas ({myStudent.nome})
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-[#ffd700]/10 to-transparent p-3 sm:p-4 rounded-xl border border-[#ffd700]/20 text-center">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-1 drop-shadow" />
                    <p className="text-xl sm:text-2xl font-black text-yellow-500">{myStudent.medalhasOuro || 0}</p>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Ouro</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#c0c0c0]/10 to-transparent p-3 sm:p-4 rounded-xl border border-[#c0c0c0]/20 text-center">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-300 mx-auto mb-1 drop-shadow" />
                    <p className="text-xl sm:text-2xl font-black text-neutral-300">{myStudent.medalhasPrata || 0}</p>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Prata</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#cd7f32]/10 to-transparent p-3 sm:p-4 rounded-xl border border-[#cd7f32]/20 text-center">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mx-auto mb-1 drop-shadow" />
                    <p className="text-xl sm:text-2xl font-black text-orange-600">{myStudent.medalhasBronze || 0}</p>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Bronze</span>
                  </div>
                </div>
              </div>
            )}

            {/* PODIUM DISPLAY */}
            {sortedComp.length > 0 ? (
              <div className="py-6 sm:py-8 px-3 sm:px-6 bg-neutral-950/40 rounded-3xl border border-neutral-900 mb-8 max-w-2xl mx-auto">
                {/* Trophies Grid - Always horizontal flex row */}
                <div className="flex flex-row justify-center items-end gap-2 sm:gap-6 md:gap-10 pb-4">
                  {/* 2nd Place - Prata (Left) */}
                  {top3[1] ? (
                    <div className="flex-1 flex flex-col items-center order-1">
                      <div className="relative flex flex-col items-center group mb-2">
                        <div className="absolute inset-0 bg-neutral-400/10 blur-xl rounded-full w-14 h-14 sm:w-20 sm:h-20 -translate-y-3 opacity-60"></div>
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500 rounded-2xl border-2 border-neutral-400 shadow-lg flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-900 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.3)]" />
                          <span className="absolute -bottom-2 bg-neutral-300 text-neutral-900 text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full border border-neutral-400 uppercase tracking-wider shadow-md">
                            Prata
                          </span>
                        </div>
                      </div>
                      <div className="text-center mt-3 max-w-[85px] sm:max-w-[120px]">
                        <p className="font-bold text-neutral-200 text-[11px] sm:text-xs truncate">{top3[1].nome}</p>
                        <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5 font-semibold uppercase truncate">{top3[1].faixa}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 order-1" />
                  )}

                  {/* 1st Place - Ouro (Center) */}
                  {top3[0] ? (
                    <div className="flex-1 flex flex-col items-center order-2 -translate-y-2 sm:-translate-y-4">
                      <div className="relative flex flex-col items-center group mb-2">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full w-16 h-16 sm:w-24 sm:h-24 -translate-y-4 opacity-80 animate-pulse"></div>
                        <div className="relative w-15 h-15 sm:w-20 sm:h-20 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 rounded-2xl border-2 border-yellow-300 shadow-xl flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-950 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] animate-bounce" />
                          <span className="absolute -bottom-2.5 bg-yellow-400 text-yellow-950 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full border border-yellow-300 uppercase tracking-wider shadow-lg">
                            Ouro
                          </span>
                        </div>
                      </div>
                      <div className="text-center mt-3 max-w-[95px] sm:max-w-[130px]">
                        <p className="font-extrabold text-white text-xs sm:text-sm truncate">{top3[0].nome}</p>
                        <p className="text-[9px] sm:text-[10px] text-yellow-500 font-semibold uppercase tracking-wider truncate">{top3[0].faixa}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 order-2" />
                  )}

                  {/* 3rd Place - Bronze (Right) */}
                  {top3[2] ? (
                    <div className="flex-1 flex flex-col items-center order-3">
                      <div className="relative flex flex-col items-center group mb-2">
                        <div className="absolute inset-0 bg-amber-700/15 blur-lg rounded-full w-14 h-14 sm:w-20 sm:h-20 -translate-y-3 opacity-60"></div>
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 rounded-2xl border-2 border-amber-500 shadow-lg flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-100 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.3)]" />
                          <span className="absolute -bottom-2 bg-amber-700 text-amber-100 text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-500 uppercase tracking-wider shadow-md">
                            Bronze
                          </span>
                        </div>
                      </div>
                      <div className="text-center mt-3 max-w-[85px] sm:max-w-[120px]">
                        <p className="font-bold text-neutral-300 text-[11px] sm:text-xs truncate">{top3[2].nome}</p>
                        <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5 font-semibold uppercase truncate">{top3[2].faixa}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 order-3" />
                  )}
                </div>

                {/* Single horizontal points container aligned below */}
                <div className="mt-4 bg-[#1a1a1a]/85 border border-neutral-850 rounded-2xl p-4 grid grid-cols-3 divide-x divide-neutral-800 shadow-inner">
                  {/* Aligned with 2nd Place */}
                  <div className="flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">#2 Prata</span>
                    <span className="text-base font-extrabold text-neutral-200 mt-0.5">
                      {top3[1] ? `${top3[1].pontosCompeticao} pts` : '—'}
                    </span>
                  </div>

                  {/* Aligned with 1st Place */}
                  <div className="flex flex-col justify-center items-center">
                    <span className="text-[10px] font-extrabold text-yellow-500 uppercase tracking-wider">#1 Ouro</span>
                    <span className="text-lg font-black text-white mt-0.5">
                      {top3[0] ? `${top3[0].pontosCompeticao} pts` : '—'}
                    </span>
                  </div>

                  {/* Aligned with 3rd Place */}
                  <div className="flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">#3 Bronze</span>
                    <span className="text-base font-extrabold text-neutral-300 mt-0.5">
                      {top3[2] ? `${top3[2].pontosCompeticao} pts` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-neutral-500">Nenhum competidor pontuado ainda.</div>
            )}

            {/* LISTING COMP */}
            <div className="space-y-2 max-w-xl mx-auto">
              <h4 className="text-xs font-extrabold text-neutral-500 uppercase tracking-widest text-left mb-3">Tabela Geral de Atletas</h4>
              {sortedComp.map((aluno, index) => {
                const sharedRank = getSharedRank(index, sortedComp);
                return (
                  <div
                    key={aluno.id}
                    className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between shadow-sm hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center gap-3.5 text-left">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        sharedRank === 1 ? 'bg-yellow-500 text-black' : sharedRank === 2 ? 'bg-neutral-400 text-black' : sharedRank === 3 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {sharedRank}
                      </span>
                      <div>
                        <span className="font-bold text-white text-sm block">{aluno.nome}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-neutral-400 bg-neutral-900 py-0.5 px-2 rounded-md font-bold uppercase">{aluno.faixa}</span>
                          <span className="text-[10px] text-neutral-500">🥇 {aluno.medalhasOuro || 0}  🥈 {aluno.medalhasPrata || 0}  🥉 {aluno.medalhasBronze || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-orange-500 text-sm">{aluno.pontosCompeticao} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FREQUÊNCIA / TREINOS RANKING */}
          <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
              <Flame className="w-5.5 h-5.5 text-orange-500" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Top 5 - Frequência de Treinos</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Alunos mais presentes nos tatames (frequência total)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {sortedFreq.map((aluno, index) => (
                <div
                  key={aluno.id}
                  className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800/80 text-center relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-md"
                >
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs">
                    #{index + 1}
                  </div>
                  <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                  <strong className="text-white text-xs block truncate mt-1">{aluno.nome}</strong>
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block mt-1">{aluno.faixa}</span>
                  <p className="text-orange-500 text-sm font-black mt-3">{aluno.checkins.length} treinos</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
          <div className="flex items-center gap-2 mb-6 border-b border-neutral-900 pb-3 text-left">
            <Flame className="w-5.5 h-5.5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Ranking por Presença</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Todos os atletas ordenados pela frequência total de treinos</p>
            </div>
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            {[...alunos]
              .sort((a, b) => b.checkins.length - a.checkins.length)
              .map((a, idx) => (
                <div key={a.id} className="bg-[#1a1a1a] p-3.5 rounded-xl border border-neutral-850 flex justify-between items-center text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-neutral-500 w-5">#{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20" title="1º Colocado (Ouro)">
                          <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)] animate-pulse" />
                        </div>
                      )}
                      {idx === 1 && (
                        <div className="bg-neutral-400/10 p-1.5 rounded-lg border border-neutral-400/20" title="2º Colocado (Prata)">
                          <Trophy className="w-4 h-4 text-neutral-300" />
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="bg-amber-700/10 p-1.5 rounded-lg border border-amber-700/20" title="3º Colocado (Bronze)">
                          <Trophy className="w-4 h-4 text-amber-600" />
                        </div>
                      )}
                      <div>
                        <strong className="text-white text-sm block">{a.nome}</strong>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase block mt-0.5">{a.faixa}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-extrabold text-orange-500 text-sm">{a.checkins.length} treinos</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR MEDALHA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-md w-full border border-neutral-800 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-orange-500 mb-6 pb-2 border-b border-neutral-900">
              <Medal className="w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Atribuir Conquista de Competição</h2>
            </div>

            <form onSubmit={handleAddMedalhaSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Atleta Selecionado *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none cursor-pointer"
                >
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.faixa})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Conquista (Medalha) *</label>
                  <select
                    value={medalhaTipo}
                    onChange={(e) => setMedalhaTipo(e.target.value as 'ouro' | 'prata' | 'bronze')}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="ouro">🥇 Ouro - 300 pontos</option>
                    <option value="prata">🥈 Prata - 200 pontos</option>
                    <option value="bronze">🥉 Bronze - 150 pontos</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Evento / Campeonato *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Copa São Paulo ACBJJ PRO 2026"
                    value={evento}
                    onChange={(e) => setEvento(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-neutral-800 text-neutral-400 py-3 rounded-xl hover:text-white hover:border-neutral-700 transition font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-white font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  Atribuir Conquista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

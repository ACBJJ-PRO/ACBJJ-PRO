import React, { useState } from 'react';
import {
  EvaluationCycle,
  EvaluationSettings,
  User,
} from '../../types';
import {
  Settings,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface AbaConfiguracoesProps {
  currentUser: User;
  activeCycle: EvaluationCycle;
  allCycles: EvaluationCycle[];
  settings: EvaluationSettings;
  onUpdateSettings: (newSettings: EvaluationSettings) => void;
  onEncerrarCiclo: (nomeNovoCiclo: string) => void;
  onReabrirCiclo?: (cicloId: string) => void;
}

export default function AbaConfiguracoes({
  currentUser,
  activeCycle,
  allCycles,
  settings,
  onUpdateSettings,
  onEncerrarCiclo,
  onReabrirCiclo,
}: AbaConfiguracoesProps) {
  const isAdmin = currentUser?.tipo === 'admin';

  // Settings Local State
  const [notaMinima, setNotaMinima] = useState<number>(settings.notaMinima ?? 7.0);
  const [frequenciaMinima, setFrequenciaMinima] = useState<number>(
    settings.frequenciaMinima ?? 75
  );
  const [criterios, setCriterios] = useState(settings.criterios || []);

  // Encerrar Ciclo Modal state
  const [showEncerrarModal, setShowEncerrarModal] = useState(false);
  const [novoCicloNome, setNovoCicloNome] = useState('');

  // Delete Criterion Confirmation Modal state
  const [deletingCrit, setDeletingCrit] = useState<{ id: string; nome: string } | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (criterios.length === 0) {
      alert('Você deve manter ao menos um critério de avaliação!');
      return;
    }

    onUpdateSettings({
      notaMinima: Number(notaMinima),
      frequenciaMinima: Number(frequenciaMinima),
      criterios,
    });

    alert('Configurações de Avaliação salvas com sucesso!');
  };

  const handleAddCrit = () => {
    const id = `crit-${Date.now()}`;
    setCriterios([
      ...criterios,
      { id, nome: 'Novo Critério', peso: 1, descricao: '' },
    ]);
  };

  const handleConfirmRemoveCrit = () => {
    if (!deletingCrit) return;
    if (criterios.length <= 1) {
      alert('Você deve manter ao menos um critério!');
      setDeletingCrit(null);
      return;
    }
    setCriterios(criterios.filter((c) => c.id !== deletingCrit.id));
    setDeletingCrit(null);
  };

  const handleConfirmEncerrar = () => {
    if (!novoCicloNome.trim()) {
      alert('Digite o nome do novo ciclo (ex: 2º Semestre 2026)!');
      return;
    }

    onEncerrarCiclo(novoCicloNome.trim());
    setShowEncerrarModal(false);
    setNovoCicloNome('');
  };

  // Generate suggested next cycle name (e.g. 1º Semestre 2026 -> 2º Semestre 2026 -> 1º Semestre 2027)
  const getSuggestedNextCycleName = (currentName: string) => {
    if (currentName.includes('1º Semestre')) {
      return currentName.replace('1º Semestre', '2º Semestre');
    }
    if (currentName.includes('2º Semestre')) {
      const parts = currentName.split(' ');
      const year = parseInt(parts[parts.length - 1], 10) || new Date().getFullYear();
      return `1º Semestre ${year + 1}`;
    }
    return `Novo Ciclo ${new Date().getFullYear()}`;
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* HEADER */}
      <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-neutral-700 rounded-2xl text-white shadow-lg">
            <Settings className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
              Gestão de Parâmetros e Regras do Sistema
            </span>
            <h2 className="text-lg font-extrabold text-white">
              Configurações & Gestão de Ciclos
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Defina a nota e frequência mínimas para aprovação, gerencie critérios e encerre semestres.
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Somente Leitura (Apenas Admin pode editar)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PARAMETERS FORM */}
        <form
          onSubmit={handleSaveConfig}
          className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl space-y-6"
        >
          <div className="border-b border-neutral-850 pb-4">
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              Critérios Mínimos de Aprovação
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Para ser APROVADO, o aluno deve atender a AMBOS os critérios simultaneamente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300">
                Nota Mínima (Média Final):
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                disabled={!isAdmin}
                value={notaMinima}
                onChange={(e) => setNotaMinima(parseFloat(e.target.value) || 0)}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-xs text-white font-extrabold focus:border-orange-500 outline-none disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300">
                Frequência Mínima (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                disabled={!isAdmin}
                value={frequenciaMinima}
                onChange={(e) => setFrequenciaMinima(parseFloat(e.target.value) || 0)}
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-xs text-white font-extrabold focus:border-orange-500 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* CRITERIA LIST */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Critérios do Lançamento ({criterios.length})
              </h4>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleAddCrit}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-orange-400 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer border border-neutral-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Critério
                </button>
              )}
            </div>

            <div className="space-y-3">
              {criterios.map((c, idx) => (
                <div
                  key={c.id}
                  className="bg-[#181818] border border-neutral-850 p-3.5 rounded-2xl flex items-start gap-3"
                >
                  <span className="text-xs font-black text-neutral-500 pt-2 w-5 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 space-y-2 min-w-0">
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={c.nome}
                      placeholder="Nome do critério"
                      onChange={(e) => {
                        const copy = [...criterios];
                        copy[idx].nome = e.target.value;
                        setCriterios(copy);
                      }}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none disabled:opacity-50"
                    />
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={c.descricao || ''}
                      placeholder="Descrição do critério (ex: Avaliação técnica de postura e execuções)..."
                      onChange={(e) => {
                        const copy = [...criterios];
                        copy[idx].descricao = e.target.value;
                        setCriterios(copy);
                      }}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-xl px-3 py-1.5 text-[11px] text-neutral-300 placeholder-neutral-550 focus:border-orange-500/70 outline-none disabled:opacity-50"
                    />
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeletingCrit({ id: c.id, nome: c.nome })}
                      className="p-2 text-neutral-500 hover:text-red-400 transition cursor-pointer shrink-0 mt-1"
                      title="Excluir critério"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Salvar Parâmetros
            </button>
          )}
        </form>

        {/* CYCLE MANAGEMENT */}
        <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-neutral-850 pb-4">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Gerenciamento do Ciclo Atual
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Controle do período semestral vigente na academia.
              </p>
            </div>

            <div className="bg-[#181818] border border-neutral-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Ciclo Ativo
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-full uppercase">
                  ● Ativo Em Andamento
                </span>
              </div>

              <h4 className="text-xl font-black text-white">{activeCycle.nome}</h4>
              <p className="text-xs text-neutral-400">
                Iniciado em: {activeCycle.dataInicio || '01/01/2026'}
              </p>

              <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl text-xs text-neutral-400 leading-relaxed">
                ℹ️ Ao encerrar o ciclo, todas as avaliações atuais serão arquivadas no histórico permanente e um novo ciclo zerado será iniciado para os alunos.
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-neutral-850 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setNovoCicloNome(getSuggestedNextCycleName(activeCycle.nome));
                  setShowEncerrarModal(true);
                }}
                className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-orange-400 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Lock className="w-4 h-4 text-orange-400" />
                Encerrar Ciclo Atual & Iniciar Novo
              </button>

              {allCycles.filter((c) => c.status === 'encerrado').length > 0 && onReabrirCiclo && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                    Reabrir ciclo encerrado:
                  </span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        if (confirm('Tem certeza de que deseja reabrir este ciclo para edição?')) {
                          onReabrirCiclo(e.target.value);
                        }
                      }
                    }}
                    className="w-full bg-black border border-neutral-800 rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">-- Selecione para reabrir --</option>
                    {allCycles
                      .filter((c) => c.status === 'encerrado')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          Reabrir: {c.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR ENCERRAMENTO DO CICLO */}
      {showEncerrarModal && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#141414] border border-orange-500/30 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Encerrar Ciclo {activeCycle.nome}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Confirmar arquivamento semestral e início do próximo ciclo.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed bg-[#181818] p-4 rounded-2xl border border-neutral-850">
              <p>Ao encerrar este ciclo:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-400">
                <li>Todas as notas e frequências atuais serão <strong>arquivadas no Histórico</strong>.</li>
                <li>Nenhum dado será apagado.</li>
                <li>Um novo ciclo limpo será ativado para os alunos.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white">
                Nome do Novo Ciclo que será Criado:
              </label>
              <input
                type="text"
                value={novoCicloNome}
                onChange={(e) => setNovoCicloNome(e.target.value)}
                placeholder="Ex: 2º Semestre 2026"
                className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-xs text-white font-extrabold focus:border-orange-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => setShowEncerrarModal(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEncerrar}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xs font-extrabold shadow-lg transition cursor-pointer"
              >
                Confirmar e Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETING A CRITERION */}
      {deletingCrit && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#141414] border border-red-500/40 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Excluir Critério?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Confirmar exclusão do critério de lançamento.
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-[#181818] p-4 rounded-2xl border border-neutral-850">
              Tem certeza de que deseja excluir o critério <strong className="text-white font-bold">"{deletingCrit.nome}"</strong>? Esta ação não afetará os lançamentos já finalizados em ciclos passados.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => setDeletingCrit(null)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveCrit}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

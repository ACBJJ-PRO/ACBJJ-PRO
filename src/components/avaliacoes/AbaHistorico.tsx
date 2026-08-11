import React, { useState, useMemo } from 'react';
import {
  EvaluationCycle,
  StudentEvaluationRecord,
  EvaluationSettings,
} from '../../types';
import { formatGrade } from './evaluationUtils';
import {
  Archive,
  Calendar,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  User,
  GraduationCap,
  Eye,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';

interface AbaHistoricoProps {
  cycles: EvaluationCycle[];
  records: StudentEvaluationRecord[];
  settings: EvaluationSettings;
}

export default function AbaHistorico({
  cycles,
  records,
  settings,
}: AbaHistoricoProps) {
  // Only closed / archived cycles or past cycles
  const archivedCycles = useMemo(() => {
    return cycles.filter((c) => c.status === 'encerrado');
  }, [cycles]);

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeSelectedCycle = useMemo(() => {
    return cycles.find((c) => c.id === selectedCycleId) || null;
  }, [cycles, selectedCycleId]);

  // Filter records for selected cycle
  const cycleRecords = useMemo(() => {
    if (!selectedCycleId) return [];
    return records.filter((r) => r.cicloId === selectedCycleId);
  }, [records, selectedCycleId]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return cycleRecords;
    const term = searchTerm.toLowerCase();
    return cycleRecords.filter(
      (r) =>
        r.alunoNome.toLowerCase().includes(term) ||
        (r.alunoCpf || '').includes(term) ||
        (r.alunoFaixa || '').toLowerCase().includes(term)
    );
  }, [cycleRecords, searchTerm]);

  if (activeSelectedCycle) {
    return (
      <div className="space-y-6 text-left animate-fade-in">
        {/* READ ONLY ARCHIVED CYCLE HEADER */}
        <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCycleId(null)}
              className="p-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-2xl text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Arquivado (Somente Leitura)
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white mt-1">
                Histórico de Avaliações - {activeSelectedCycle.nome}
              </h2>
              <p className="text-xs text-neutral-400">
                Encerrado em:{' '}
                {activeSelectedCycle.dataEncerramento ||
                  activeSelectedCycle.dataFim ||
                  'Período Anterior'}{' '}
                • Encerrado por: {activeSelectedCycle.encerradoPor || 'Administrador'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Total Arquivado
            </span>
            <span className="text-xl font-black text-white">
              {cycleRecords.length} alunos
            </span>
          </div>
        </div>

        {/* SEARCH FILTER */}
        <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-500 ml-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar aluno no histórico por nome ou faixa..."
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>

        {/* ARCHIVED RECORDS GRID */}
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center bg-[#141414] rounded-2xl border border-neutral-850 text-neutral-400 text-xs">
              Nenhum registro de avaliação encontrado para este ciclo.
            </div>
          ) : (
            filteredRecords.map((r) => (
              <div
                key={r.id}
                className="bg-[#141414] border border-neutral-850 p-5 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-neutral-850 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-850 border border-neutral-700 flex items-center justify-center text-white font-black text-xs">
                      <User className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{r.alunoNome}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                        <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded font-bold uppercase text-neutral-300">
                          Faixa {r.alunoFaixa}
                        </span>
                        <span>Turma: {r.alunoTurma || 'Geral'}</span>
                        <span>• Prof: {r.professorNome}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {r.aprovado ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black px-3 py-1 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" /> APROVADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black px-3 py-1 rounded-xl">
                        <XCircle className="w-4 h-4" /> REPROVADO
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#181818] p-3 rounded-xl border border-neutral-850">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                      Média Final
                    </span>
                    <strong className="text-sm font-black text-orange-400">
                      {formatGrade(r.mediaFinal)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                      Frequência
                    </span>
                    <strong className="text-sm font-black text-white">
                      {r.frequenciaPercent}%
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                      Presenças / Aulas
                    </span>
                    <span className="text-xs font-bold text-neutral-300">
                      {r.presencasConfirmadas} / {r.totalAulasRealizadas}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                      Data da Avaliação
                    </span>
                    <span className="text-xs font-bold text-neutral-300">
                      {r.dataAvaliacao || 'Sem data'}
                    </span>
                  </div>
                </div>

                {r.observacoes && (
                  <p className="text-xs text-neutral-400 bg-[#0f0f0f] p-3 rounded-xl border border-neutral-850 italic">
                    "{r.observacoes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* HISTORICO HEADER */}
      <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              Acervo Permanente de Semestres Encerrados
            </span>
            <h2 className="text-lg font-extrabold text-white">
              Histórico de Avaliações
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Todos os ciclos passados permanecem arquivados em modo somente leitura.
            </p>
          </div>
        </div>
      </div>

      {/* ARCHIVED CYCLES LIST */}
      <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl space-y-4">
        {archivedCycles.length === 0 ? (
          <div className="p-12 text-center bg-[#181818] rounded-2xl border border-neutral-850 space-y-3">
            <Archive className="w-10 h-10 text-neutral-600 mx-auto" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Nenhum Ciclo Arquivado Ainda
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Quando um administrador clicar em "Encerrar Ciclo" na aba de Configurações, o período semestral será arquivado permanentemente aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedCycles.map((cycle) => {
              const count = records.filter((r) => r.cicloId === cycle.id).length;

              return (
                <div
                  key={cycle.id}
                  onClick={() => setSelectedCycleId(cycle.id)}
                  className="bg-[#181818] border border-neutral-800 hover:border-amber-500/50 p-5 rounded-2xl space-y-3 cursor-pointer transition hover:scale-[1.01] shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <h3 className="text-base font-black text-white group-hover:text-amber-400 transition">
                        {cycle.nome}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold rounded-full uppercase">
                      Arquivado
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400">
                    Encerrado em: {cycle.dataEncerramento || 'Data não informada'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-850 text-xs">
                    <span className="text-neutral-300 font-bold">
                      {count} avaliações arquivadas
                    </span>
                    <span className="text-amber-400 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition">
                      Visualizar <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

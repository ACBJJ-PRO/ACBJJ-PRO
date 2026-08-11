import React, { useMemo } from 'react';
import {
  Student,
  ClassUnit,
  EvaluationCycle,
  EvaluationSettings,
  StudentEvaluationRecord,
  CheckinRequest,
} from '../../types';
import {
  calculateStudentAttendance,
  formatGrade,
} from './evaluationUtils';
import {
  Users,
  CheckCircle2,
  Clock,
  Award,
  XCircle,
  TrendingUp,
  BarChart3,
  GraduationCap,
  ChevronRight,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface AbaDashboardProps {
  alunos: Student[];
  turmas: ClassUnit[];
  activeCycle: EvaluationCycle;
  settings: EvaluationSettings;
  records: StudentEvaluationRecord[];
  checkinsConfirmados?: CheckinRequest[];
  onSelectTurmaForEvaluation?: (turmaNome: string) => void;
}

export default function AbaDashboard({
  alunos,
  turmas,
  activeCycle,
  settings,
  records,
  checkinsConfirmados = [],
  onSelectTurmaForEvaluation,
}: AbaDashboardProps) {
  // Filter records for active cycle
  const activeRecords = useMemo(() => {
    return records.filter((r) => r.cicloId === activeCycle.id);
  }, [records, activeCycle.id]);

  const recordMap = useMemo(() => {
    const map = new Map<number, StudentEvaluationRecord>();
    activeRecords.forEach((r) => map.set(r.alunoId, r));
    return map;
  }, [activeRecords]);

  // Overall Metrics
  const totalAlunos = alunos.length;
  const totalAvaliados = activeRecords.length;
  const pendentes = Math.max(0, totalAlunos - totalAvaliados);
  const aprovados = activeRecords.filter((r) => r.aprovado).length;
  const reprovados = activeRecords.filter((r) => !r.aprovado).length;

  const mediaGeral = useMemo(() => {
    if (activeRecords.length === 0) return 0;
    const sum = activeRecords.reduce((acc, r) => acc + (r.mediaFinal || 0), 0);
    return Math.round((sum / activeRecords.length) * 100) / 100;
  }, [activeRecords]);

  const frequenciaMedia = useMemo(() => {
    if (alunos.length === 0) return 0;
    let sumFreq = 0;
    alunos.forEach((st) => {
      const att = calculateStudentAttendance(st, checkinsConfirmados);
      sumFreq += att.frequenciaPercent;
    });
    return Math.round((sumFreq / alunos.length) * 10) / 10;
  }, [alunos, checkinsConfirmados]);

  // Turmas Progress Breakdown
  const turmasBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        avaliados: number;
        aprovados: number;
        reprovados: number;
        sumMedia: number;
      }
    >();

    alunos.forEach((a) => {
      const turmaName = ((a as any).turma || a.professorResponsavelNome || 'Turma Principal').trim();
      if (!map.has(turmaName)) {
        map.set(turmaName, {
          total: 0,
          avaliados: 0,
          aprovados: 0,
          reprovados: 0,
          sumMedia: 0,
        });
      }
      const data = map.get(turmaName)!;
      data.total += 1;

      const rec = recordMap.get(a.id);
      if (rec) {
        data.avaliados += 1;
        data.sumMedia += rec.mediaFinal || 0;
        if (rec.aprovado) data.aprovados += 1;
        else data.reprovados += 1;
      }
    });

    return Array.from(map.entries()).map(([nome, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.avaliados / stats.total) * 100) : 0;
      const media = stats.avaliados > 0 ? Math.round((stats.sumMedia / stats.avaliados) * 100) / 100 : 0;
      return {
        nome,
        ...stats,
        pct,
        media,
      };
    });
  }, [alunos, recordMap]);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* DASHBOARD HEADER */}
      <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl text-white shadow-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
              Painel Administrativo do Ciclo
            </span>
            <h2 className="text-lg font-extrabold text-white">
              Dashboard de Avaliações - {activeCycle.nome}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Acompanhamento em tempo real das médias, frequências e aprovações.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-neutral-800 px-4 py-2 rounded-2xl">
          <Calendar className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-extrabold text-white">
            Status: <span className="text-emerald-400 uppercase">Ciclo Ativo</span>
          </span>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ALUNOS */}
        <div className="bg-[#141414] border border-neutral-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total de Alunos
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white block">{totalAlunos}</span>
          <span className="text-[10px] text-neutral-500 font-medium">
            Em todas as turmas participantes
          </span>
        </div>

        {/* TOTAL AVALIADOS */}
        <div className="bg-[#141414] border border-neutral-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Avaliados
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalAvaliados}</span>
            <span className="text-xs text-neutral-400 font-bold">({pendentes} pendentes)</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium">
            {totalAlunos > 0 ? Math.round((totalAvaliados / totalAlunos) * 100) : 0}% concluído
          </span>
        </div>

        {/* APROVADOS VS REPROVADOS */}
        <div className="bg-[#141414] border border-neutral-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Aprovados / Reprovados
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-emerald-400">{aprovados}</span>
            <span className="text-xs text-neutral-500 font-bold">/</span>
            <span className="text-2xl font-black text-red-400">{reprovados}</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium">
            Critérios: Nota ≥ {settings.notaMinima} e Freq ≥ {settings.frequenciaMinima}%
          </span>
        </div>

        {/* MÉDIA GERAL & FREQUÊNCIA MÉDIA */}
        <div className="bg-[#141414] border border-neutral-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Média & Frequência
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-orange-400">
              {formatGrade(mediaGeral)}
            </span>
            <span className="text-xs text-neutral-400 font-bold">
              | {frequenciaMedia}% freq
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium">
            Média geral da academia no ciclo
          </span>
        </div>
      </div>

      {/* TURMAS PROGRESS CARDS */}
      <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              Desempenho por Turma
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Clique em uma turma para abrir sua lista de avaliação direta.
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-xl">
            {turmasBreakdown.length} turmas mapeadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmasBreakdown.map((t) => (
            <div
              key={t.nome}
              onClick={() => onSelectTurmaForEvaluation?.(t.nome)}
              className="bg-[#181818] border border-neutral-800 hover:border-orange-500/50 p-5 rounded-2xl space-y-3 cursor-pointer transition hover:scale-[1.01] shadow-md group"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-orange-400 transition">
                  {t.nome}
                </h4>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-orange-400 transition" />
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-neutral-400">Progresso</span>
                  <span className="text-orange-400">{t.pct}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-850 text-center">
                <div className="bg-[#121212] p-2 rounded-xl border border-neutral-850">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                    Alunos
                  </span>
                  <strong className="text-xs font-black text-white">{t.total}</strong>
                </div>

                <div className="bg-[#121212] p-2 rounded-xl border border-neutral-850">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                    Aprovados
                  </span>
                  <strong className="text-xs font-black text-emerald-400">
                    {t.aprovados}
                  </strong>
                </div>

                <div className="bg-[#121212] p-2 rounded-xl border border-neutral-850">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                    Média
                  </span>
                  <strong className="text-xs font-black text-orange-400">
                    {formatGrade(t.media)}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Student,
  CheckinRequest,
  ClassUnit,
  EvaluationCycle,
  EvaluationSettings,
  StudentEvaluationRecord,
  SentExam,
} from '../../types';
import {
  calculateStudentAttendance,
  calculateMediaFinal,
  evaluateApproval,
  formatGrade,
} from './evaluationUtils';
import EvaluationModal from './EvaluationModal';
import ProvasPane from '../ProvasPane';
import {
  User,
  Users,
  Grid,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

interface AbaAvaliacoesProps {
  alunos: Student[];
  turmas: ClassUnit[];
  activeCycle: EvaluationCycle;
  settings: EvaluationSettings;
  records: StudentEvaluationRecord[];
  checkinsConfirmados?: CheckinRequest[];
  provasEnviadas?: SentExam[];
  currentUserNome?: string;
  currentUserId?: number;
  onSaveRecord: (
    record: StudentEvaluationRecord,
    andNext?: boolean
  ) => void;
  onEnviarProva?: (novaProva: SentExam) => void;
  onRemoverProva?: (id: number) => void;
  onLancarNotaProva?: (provaId: number, alunoId: number, nota: number) => void;
}

export default function AbaAvaliacoes({
  alunos,
  turmas,
  activeCycle,
  settings,
  records,
  checkinsConfirmados = [],
  provasEnviadas = [],
  currentUserNome,
  currentUserId,
  onSaveRecord,
  onEnviarProva,
  onRemoverProva,
  onLancarNotaProva,
}: AbaAvaliacoesProps) {
  // Operational Work Modes: 'individual' | 'turma' | 'geral'
  const [workMode, setWorkMode] = useState<'individual' | 'turma' | 'geral'>('geral');

  // Filters
  const [selectedTurma, setSelectedTurma] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<
    'todos' | 'pendentes' | 'avaliados' | 'aprovados' | 'reprovados' | 'aptos'
  >('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Student for Individual Mode or Modal Evaluation
  const [evaluatingStudent, setEvaluatingStudent] = useState<Student | null>(null);

  // Helper function to render student avatar without stock image fallback
  const renderStudentAvatar = (st: Student, sizeClass = "w-12 h-12") => {
    const hasCustomPhoto = st.fotoPerfil && !st.fotoPerfil.includes('unsplash.com');
    if (hasCustomPhoto) {
      return (
        <img
          src={st.fotoPerfil}
          alt={st.nome}
          className={`${sizeClass} rounded-xl object-cover border border-neutral-700 shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 flex items-center justify-center text-orange-400 font-extrabold text-xs shrink-0`}
      >
        {st.nome ? st.nome.substring(0, 2).toUpperCase() : <User className="w-5 h-5" />}
      </div>
    );
  };

  // Map evaluation records by studentId for fast lookup
  const recordMap = useMemo(() => {
    const map = new Map<number, StudentEvaluationRecord>();
    records.forEach((r) => {
      if (r.cicloId === activeCycle.id) {
        map.set(r.alunoId, r);
      }
    });
    return map;
  }, [records, activeCycle.id]);

  // Total Progress Indicator Metrics
  const totalAlunosCount = alunos.length;
  const avaliadosCount = useMemo(() => {
    return alunos.filter((a) => recordMap.has(a.id)).length;
  }, [alunos, recordMap]);

  const progressPercent = totalAlunosCount > 0
    ? Math.round((avaliadosCount / totalAlunosCount) * 100)
    : 0;

  // Filtered Students List
  const filteredAlunos = useMemo(() => {
    return alunos.filter((student) => {
      const rec = recordMap.get(student.id);
      const studentTurma = ((student as any).turma || student.professorResponsavelNome || 'Geral').trim();

      // Filter by Turma
      if (selectedTurma !== 'todas') {
        if (studentTurma.toLowerCase() !== selectedTurma.toLowerCase()) {
          return false;
        }
      }

      // Filter by Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = student.nome.toLowerCase().includes(term);
        const matchesCpf = (student.cpf || '').includes(term);
        if (!matchesName && !matchesCpf) return false;
      }

      // Filter by Status
      const attendance = calculateStudentAttendance(student, checkinsConfirmados);
      const isApto = attendance.frequenciaPercent >= (settings.frequenciaMinima || 75);

      if (selectedStatus === 'pendentes') return !rec;
      if (selectedStatus === 'avaliados') return Boolean(rec);
      if (selectedStatus === 'aprovados') return rec?.aprovado === true;
      if (selectedStatus === 'reprovados') return rec && rec.aprovado === false;
      if (selectedStatus === 'aptos') return isApto;

      return true;
    });
  }, [alunos, recordMap, selectedTurma, selectedStatus, searchTerm, checkinsConfirmados, settings]);

  // Grouped Students by Turma for Geral Mode
  const groupedByTurma: Record<string, Student[]> = useMemo(() => {
    const groups: Record<string, Student[]> = {};
    filteredAlunos.forEach((a) => {
      const turmaName = ((a as any).turma || a.professorResponsavelNome || 'Turma Principal').trim();
      if (!groups[turmaName]) groups[turmaName] = [];
      groups[turmaName].push(a);
    });
    return groups;
  }, [filteredAlunos]);

  // Next Student in Queue for Fast Navigation Modal
  const findNextStudent = (currentStudentId: number): Student | null => {
    const idx = filteredAlunos.findIndex((a) => a.id === currentStudentId);
    if (idx !== -1 && idx < filteredAlunos.length - 1) {
      return filteredAlunos[idx + 1];
    }
    return null;
  };

  const nextStudent = evaluatingStudent ? findNextStudent(evaluatingStudent.id) : null;

  const handleOpenEvaluationModal = (student: Student) => {
    setEvaluatingStudent(student);
  };

  const handleSaveModalRecord = (
    rec: StudentEvaluationRecord,
    andNext?: boolean
  ) => {
    onSaveRecord(rec, andNext);

    if (andNext && nextStudent) {
      setEvaluatingStudent(nextStudent);
    } else {
      setEvaluatingStudent(null);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* TOP PROGRESS INDICATOR */}
      <div className="bg-gradient-to-r from-[#141414] via-[#1a1a1a] to-[#141414] p-5 rounded-3xl border border-neutral-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl text-white shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
                Progresso Geral das Avaliações Semestrais
              </span>
              <h2 className="text-base font-extrabold text-white">
                {avaliadosCount} de {totalAlunosCount} alunos avaliados em{' '}
                <span className="text-orange-400 font-black">{activeCycle.nome}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-white">{progressPercent}%</span>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* WORK MODE SWITCHER & FILTERS BAR */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-neutral-800 space-y-4">
        {/* WORK MODES BUTTONS */}
        <div className="flex flex-wrap gap-2 bg-[#0d0d0d] p-1.5 rounded-2xl border border-neutral-850">
          <button
            onClick={() => setWorkMode('geral')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              workMode === 'geral'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>3. Avaliação Geral da Academia</span>
          </button>

          <button
            onClick={() => setWorkMode('turma')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              workMode === 'turma'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Avaliação por Turma</span>
          </button>

          <button
            onClick={() => setWorkMode('individual')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              workMode === 'individual'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Avaliação Individual</span>
          </button>
        </div>

        {/* SMART FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar aluno por nome ou CPF..."
              className="w-full bg-black border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 outline-none"
            />
          </div>

          {/* TURMA SELECTOR */}
          <div className="relative">
            <select
              value={selectedTurma}
              onChange={(e) => setSelectedTurma(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-orange-500 outline-none appearance-none cursor-pointer"
            >
              <option value="todas">Todas as Turmas ({alunos.length} alunos)</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.nome}>
                  Turma: {t.nome} ({t.horario})
                </option>
              ))}
            </select>
          </div>

          {/* STATUS SELECTOR */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as any)
              }
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-orange-500 outline-none appearance-none cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendentes">Apenas Pendentes (Não Avaliados)</option>
              <option value="avaliados">Apenas Avaliados</option>
              <option value="aprovados">Apenas Aprovados</option>
              <option value="reprovados">Apenas Reprovados</option>
              <option value="aptos">Apenas Aptos por Frequência (≥75%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* RENDER CONTENT ACCORDING TO WORK MODE */}

      {/* MODE 1: AVALIAÇÃO INDIVIDUAL */}
      {workMode === 'individual' && (
        <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl space-y-6">
          <div className="border-b border-neutral-850 pb-4">
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Modo 1: Avaliação Individual
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Selecione um único aluno na lista para abrir sua ficha de avaliação e lançar as notas.
            </p>
          </div>

          <div className="max-w-md space-y-2">
            <label className="text-xs font-bold text-neutral-300">
              Selecione o Aluno:
            </label>
            <select
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = alunos.find((a) => a.id === id);
                if (found) handleOpenEvaluationModal(found);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-orange-500 outline-none cursor-pointer"
            >
              <option value="">-- Clique para escolher um aluno --</option>
              {filteredAlunos.map((a) => {
                const rec = recordMap.get(a.id);
                return (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.faixa || 'Branca'}) -{' '}
                    {rec ? (rec.aprovado ? '✅ Aprovado' : '❌ Reprovado') : '⏳ Pendente'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredAlunos.map((a) => {
              const rec = recordMap.get(a.id);
              const attendance = calculateStudentAttendance(a, checkinsConfirmados);
              return (
                <div
                  key={a.id}
                  onClick={() => handleOpenEvaluationModal(a)}
                  className="bg-[#1a1a1a] border border-neutral-850 hover:border-orange-500/50 p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderStudentAvatar(a, "w-12 h-12")}
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-white block truncate">
                        {a.nome}
                      </strong>
                      <span className="text-[10px] text-neutral-400 block">
                        Faixa {a.faixa || 'Branca'} • Freq: {attendance.frequenciaPercent}%
                      </span>
                    </div>
                  </div>

                  {rec ? (
                    rec.aprovado ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-lg">
                        {formatGrade(rec.mediaFinal)}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black rounded-lg">
                        {formatGrade(rec.mediaFinal)}
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded-lg">
                      Avaliar
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: AVALIAÇÃO POR TURMA */}
      {workMode === 'turma' && (
        <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-neutral-850 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Modo 2: Avaliação por Turma
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Escolha uma turma específica para visualizar e avaliar rapidamente seus integrantes.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {Object.keys(groupedByTurma).length === 0 ? (
              <div className="p-8 text-center bg-[#181818] rounded-2xl border border-neutral-850 text-neutral-400 text-xs">
                Nenhum aluno encontrado para os filtros selecionados.
              </div>
            ) : (
              Object.entries(groupedByTurma).map(([turmaName, list]) => {
                const turmaAvaliados = list.filter((st) => recordMap.has(st.id)).length;
                const pct = list.length > 0 ? Math.round((turmaAvaliados / list.length) * 100) : 0;

                return (
                  <div
                    key={turmaName}
                    className="bg-[#181818] border border-neutral-800 rounded-2xl overflow-hidden shadow-lg"
                  >
                    <div className="bg-[#1f1f1f] px-5 py-3 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-orange-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Turma: {turmaName}
                        </h4>
                        <span className="text-[10px] bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full text-neutral-300 font-bold">
                          {list.length} alunos
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                        <span>Progresso:</span>
                        <span className="text-orange-400 font-black">{pct}%</span>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {list.map((st) => {
                        const rec = recordMap.get(st.id);
                        const attendance = calculateStudentAttendance(st, checkinsConfirmados);

                        return (
                          <div
                            key={st.id}
                            className="bg-[#121212] border border-neutral-850 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-neutral-700 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {renderStudentAvatar(st, "w-10 h-10")}
                              <div className="min-w-0">
                                <strong className="text-xs font-bold text-white block truncate">
                                  {st.nome}
                                </strong>
                                <span className="text-[10px] text-neutral-400 block">
                                  Faixa {st.faixa || 'Branca'} • Freq: {attendance.frequenciaPercent}%
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenEvaluationModal(st)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer shrink-0 ${
                                rec
                                  ? rec.aprovado
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                              }`}
                            >
                              {rec ? (
                                <span>{formatGrade(rec.mediaFinal)}</span>
                              ) : (
                                <span>Avaliar</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODE 3: AVALIAÇÃO GERAL DA ACADEMIA (CONTINUOUS LIST) */}
      {workMode === 'geral' && (
        <div className="bg-[#141414] border border-neutral-800 p-6 rounded-3xl space-y-6">
          <div className="border-b border-neutral-850 pb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-5 h-5 text-orange-500" />
                Modo 3: Avaliação Geral da Academia (Lista Contínua)
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Lista contínua de todos os alunos da academia. Avalie consecutivamente sem precisar trocar de tela.
              </p>
            </div>
            <span className="text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-xl">
              Exibindo {filteredAlunos.length} de {alunos.length} alunos
            </span>
          </div>

          <div className="space-y-6">
            {Object.keys(groupedByTurma).length === 0 ? (
              <div className="p-8 text-center bg-[#181818] rounded-2xl border border-neutral-850 text-neutral-400 text-xs">
                Nenhum aluno encontrado para os filtros selecionados.
              </div>
            ) : (
              Object.entries(groupedByTurma).map(([turmaName, list]) => (
                <div key={turmaName} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-850 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {turmaName}
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-bold">
                      ({list.length} alunos)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {list.map((st) => {
                      const rec = recordMap.get(st.id);
                      const attendance = calculateStudentAttendance(st, checkinsConfirmados);

                      return (
                        <div
                          key={st.id}
                          className="bg-[#181818] border border-neutral-850 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-neutral-700 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {renderStudentAvatar(st, "w-12 h-12")}
                            <div className="min-w-0">
                              <strong className="text-xs font-bold text-white block truncate">
                                {st.nome}
                              </strong>
                              <span className="text-[10px] text-neutral-400 block mt-0.5">
                                Faixa {st.faixa || 'Branca'}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[10px] font-bold ${
                                    attendance.frequenciaPercent >= (settings.frequenciaMinima || 75)
                                      ? 'text-emerald-400'
                                      : 'text-red-400'
                                  }`}
                                >
                                  Freq: {attendance.frequenciaPercent}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {rec ? (
                              <div className="space-y-1">
                                {rec.aprovado ? (
                                  <span className="inline-block px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-lg">
                                    APROVADO ({formatGrade(rec.mediaFinal)})
                                  </span>
                                ) : (
                                  <span className="inline-block px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black rounded-lg">
                                    REPROVADO ({formatGrade(rec.mediaFinal)})
                                  </span>
                                )}
                                <button
                                  onClick={() => handleOpenEvaluationModal(st)}
                                  className="block text-[10px] font-bold text-neutral-400 hover:text-white underline cursor-pointer mt-1"
                                >
                                  Editar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenEvaluationModal(st)}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                              >
                                <span>Avaliar</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {evaluatingStudent && (
        <EvaluationModal
          student={evaluatingStudent}
          activeCycle={activeCycle}
          settings={settings}
          existingRecord={recordMap.get(evaluatingStudent.id)}
          checkinsConfirmados={checkinsConfirmados}
          provasEnviadas={provasEnviadas}
          onSave={handleSaveModalRecord}
          onClose={() => setEvaluatingStudent(null)}
          hasNextStudent={Boolean(nextStudent)}
          currentUserNome={currentUserNome}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  CheckinRequest,
  EvaluationSettings,
  StudentEvaluationRecord,
  EvaluationCycle,
  SentExam,
} from '../../types';
import {
  calculateStudentAttendance,
  calculateMediaFinal,
  calculateTeoriaConceitosGrade,
  evaluateApproval,
  formatGrade,
} from './evaluationUtils';
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  Save,
  ArrowRight,
  User,
  CalendarCheck,
  Calculator,
  MessageSquare,
  Sparkles,
  BookOpen,
  Lock,
  Check,
} from 'lucide-react';

interface EvaluationModalProps {
  student: Student;
  activeCycle: EvaluationCycle;
  settings: EvaluationSettings;
  existingRecord?: StudentEvaluationRecord;
  checkinsConfirmados?: CheckinRequest[];
  provasEnviadas?: SentExam[];
  onSave: (
    record: StudentEvaluationRecord,
    andNext?: boolean
  ) => void;
  onClose: () => void;
  hasNextStudent?: boolean;
  currentUserNome?: string;
  currentUserId?: number;
}

export default function EvaluationModal({
  student,
  activeCycle,
  settings,
  existingRecord,
  checkinsConfirmados = [],
  provasEnviadas = [],
  onSave,
  onClose,
  hasNextStudent = false,
  currentUserNome = 'Mestre Carlos',
  currentUserId,
}: EvaluationModalProps) {
  // Initialize criterion grades state
  const [grades, setGrades] = useState<Record<string, number>>(() => {
    if (existingRecord?.notas) {
      return { ...existingRecord.notas };
    }
    const initial: Record<string, number> = {};
    settings.criterios.forEach((c) => {
      initial[c.id] = 8.0;
    });
    return initial;
  });

  const [observacoes, setObservacoes] = useState<string>(
    existingRecord?.observacoes || ''
  );

  // Re-sync if student changes
  useEffect(() => {
    if (existingRecord?.notas) {
      setGrades({ ...existingRecord.notas });
    } else {
      const initial: Record<string, number> = {};
      settings.criterios.forEach((c) => {
        initial[c.id] = 8.0;
      });
      setGrades(initial);
    }
    setObservacoes(existingRecord?.observacoes || '');
  }, [student.id, existingRecord]);

  // Attendance calculation
  const attendance = useMemo(() => {
    return calculateStudentAttendance(student, checkinsConfirmados);
  }, [student, checkinsConfirmados]);

  // Teoria & Conceitos automatic score calculation
  const teoriaConceitos = useMemo(() => {
    return calculateTeoriaConceitosGrade(student.id, provasEnviadas);
  }, [student.id, provasEnviadas]);

  // Computed Media Final (including Teoria & Conceitos)
  const mediaFinal = useMemo(() => {
    return calculateMediaFinal(grades, settings, teoriaConceitos.notaMedia);
  }, [grades, settings, teoriaConceitos.notaMedia]);

  // Computed Approval Status
  const approval = useMemo(() => {
    return evaluateApproval(mediaFinal, attendance.frequenciaPercent, settings);
  }, [mediaFinal, attendance.frequenciaPercent, settings]);

  const handleGradeChange = (critId: string, value: number) => {
    const clamped = Math.max(0, Math.min(10, value));
    setGrades((prev) => ({ ...prev, [critId]: clamped }));
  };

  const handleSaveSubmit = (andNext: boolean) => {
    const record: StudentEvaluationRecord = {
      id: existingRecord?.id || `eval-${student.id}-${activeCycle.id}`,
      cicloId: activeCycle.id,
      alunoId: student.id,
      alunoNome: student.nome,
      alunoCpf: student.cpf,
      alunoFaixa: student.faixa || 'Branca',
      alunoTurma: (student as any).turma || student.professorResponsavelNome || 'Geral',
      professorId: currentUserId || student.professorResponsavelId,
      professorNome: currentUserNome || student.professorResponsavelNome || 'Professor Responsável',
      dataAvaliacao: new Date().toISOString().split('T')[0],
      notas: grades,
      teoriaConceitosNota: teoriaConceitos.notaMedia,
      mediaFinal,
      presencasConfirmadas: attendance.presencasConfirmadas,
      totalAulasRealizadas: attendance.totalAulasRealizadas,
      frequenciaPercent: attendance.frequenciaPercent,
      aprovado: approval.aprovado,
      motivoReprovacao: approval.motivoReprovacao,
      observacoes,
    };

    onSave(record, andNext);
  };

  const hasCustomPhoto = student.fotoPerfil && !student.fotoPerfil.includes('unsplash.com');

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fade-in select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto text-left flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-neutral-900 via-[#181818] to-neutral-900 px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                Avaliação semestral
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                  {activeCycle.nome}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Preencha os critérios de desempenho e confira a aprovação.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/50 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* STUDENT IDENTIFICATION HEADER */}
          <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-4 flex items-center gap-4">
            {hasCustomPhoto ? (
              <img
                src={student.fotoPerfil}
                alt={student.nome}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/30 shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg shrink-0">
                {student.nome ? student.nome.substring(0, 2).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-white truncate">
                {student.nome}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[11px] font-bold rounded-lg uppercase">
                  Faixa {student.faixa || 'Branca'}
                </span>
                <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-medium rounded-lg">
                  Turma: {(student as any).turma || student.professorResponsavelNome || 'Geral'}
                </span>
              </div>
            </div>
          </div>

          {/* ATTENDANCE / FREQUENCY CARD (AUTOMATIC LOGIC) */}
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Frequência do Ciclo (Aulas da Turma)
                </span>
              </div>
              <span
                className={`text-sm font-black ${
                  attendance.frequenciaPercent >= (settings.frequenciaMinima || 75)
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {attendance.frequenciaPercent}%
              </span>
            </div>

            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className={`h-full transition-all duration-300 ${
                  attendance.frequenciaPercent >= (settings.frequenciaMinima || 75)
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-red-500 to-rose-600'
                }`}
                style={{ width: `${attendance.frequenciaPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
              <span>
                Presenças Confirmadas: <strong>{attendance.presencasConfirmadas}</strong>
              </span>
              <span>
                Aulas Realizadas na Turma: <strong>{attendance.totalAulasRealizadas}</strong>
              </span>
              <span>
                Mínimo Exigido: <strong>{settings.frequenciaMinima || 75}%</strong>
              </span>
            </div>
          </div>

          {/* TEORIA & CONCEITOS - AUTOMATIC CRITERION FROM PROVAS TEÓRICAS */}
          <div className="bg-[#161616] border border-cyan-500/30 p-4 rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-xs font-black text-white uppercase tracking-wider">
                      TEORIA & CONCEITOS
                    </h5>
                    <span className="text-[10px] bg-neutral-900 border border-neutral-700 text-neutral-300 px-2 py-0.5 rounded-lg font-mono font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      BLOQUEADO / AUTOMÁTICO
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Importado diretamente do Módulo Provas Teóricas
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xl font-black text-cyan-400 block font-mono">
                  {formatGrade(teoriaConceitos.notaMedia)}
                </span>
                <span className="text-[10px] text-neutral-500 block font-medium">/ 10,00</span>
              </div>
            </div>

            {/* LIST OF EXAMS FOR THIS STUDENT */}
            {teoriaConceitos.detalheProvas.length > 0 ? (
              <div className="space-y-2 pt-1 border-t border-neutral-800">
                {teoriaConceitos.detalheProvas.map((prova, idx) => (
                  <div
                    key={idx}
                    className="bg-[#121212] border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h6 className="text-xs font-bold text-white truncate">{prova.titulo}</h6>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Pontuação: <strong>{formatGrade(prova.nota)}</strong> / 10 pts (Convertida para 0-10)
                      </p>
                    </div>
                    <div className="shrink-0">
                      {prova.status === 'CONCLUÍDA' ? (
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> CONCLUÍDA
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                          PENDENTE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-neutral-400 italic bg-[#121212] border border-neutral-800/80 p-3 rounded-xl">
                Nenhuma prova teórica enviada no ciclo atual. (Média automática base: 10,00)
              </div>
            )}
          </div>

          {/* CRITERIA GRADES EDITING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <h4 className="text-xs font-extrabold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-orange-500" />
                Notas dos Critérios de Tatame
              </h4>
              <span className="text-[11px] text-neutral-500 font-medium">
                Escala de 0,0 a 10,0
              </span>
            </div>

            <div className="space-y-3">
              {settings.criterios.map((crit) => {
                const currentVal = Number(grades[crit.id] ?? 8.0);
                return (
                  <div
                    key={crit.id}
                    className="bg-[#181818] border border-neutral-850 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <label className="text-xs font-bold text-white block">
                            {crit.nome}
                          </label>
                          {crit.descricao && (
                            <span className="text-[11px] text-neutral-400 block font-normal">
                              {crit.descricao}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-extrabold text-orange-400 font-mono ml-2">
                          {formatGrade(currentVal)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={currentVal}
                        onChange={(e) =>
                          handleGradeChange(crit.id, parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-1"
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={currentVal}
                      onChange={(e) =>
                        handleGradeChange(
                          crit.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-20 bg-black border border-neutral-800 text-white font-extrabold text-xs text-center py-2 rounded-xl focus:border-orange-500 outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* OBSERVATIONS FIELD */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
              Observações do Professor
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite aqui recomendações técnicas, pontos fortes ou observações de comportamento do aluno..."
              className="w-full bg-[#181818] border border-neutral-800 rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500 outline-none resize-none"
            />
          </div>

          {/* LIVE COMPUTED RESULT & CRITERIA DISPLAY */}
          <div
            className={`p-4 rounded-2xl border ${
              approval.aprovado
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/20 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Média Final
                </span>
                <span className="text-2xl font-black text-white font-mono">
                  {formatGrade(mediaFinal)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Frequência
                </span>
                <span className="text-2xl font-black text-white font-mono">
                  {attendance.frequenciaPercent}%
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Situação Final
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                  {approval.aprovado ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black px-3 py-1 rounded-xl uppercase">
                      <CheckCircle2 className="w-4 h-4" /> APROVADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black px-3 py-1 rounded-xl uppercase">
                      <XCircle className="w-4 h-4" /> REPROVADO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!approval.aprovado && approval.motivoReprovacao && (
              <p className="text-xs text-red-400 mt-2 border-t border-red-500/20 pt-2 font-medium">
                ⚠️ Motivo: {approval.motivoReprovacao}
              </p>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#181818] px-6 py-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveSubmit(false)}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer border border-neutral-700"
            >
              <Save className="w-4 h-4 text-orange-400" />
              Salvar Avaliação
            </button>

            {hasNextStudent && (
              <button
                type="button"
                onClick={() => handleSaveSubmit(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <span>Salvar e Próximo Aluno</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

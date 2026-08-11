import React, { useState, useMemo } from 'react';
import { Student, CheckinRequest, TrainingSchedule, SentExam, ClassUnit } from '../types';
import {
  Star,
  Award,
  Check,
  AlertTriangle,
  Play,
  Save,
  Lock,
  CheckCircle2,
  XCircle,
  Info,
  BookOpen,
  CalendarCheck,
  UserCheck,
  Sparkles,
  ShieldAlert,
  Calculator,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

const formatNota = (nota: number) => {
  if (nota === 10) return '10,00';
  return nota.toFixed(2).replace('.', ',');
};

interface AvaliacoesPaneProps {
  alunos: Student[];
  checkinsConfirmados?: CheckinRequest[];
  trainingSchedules?: TrainingSchedule[];
  provasEnviadas?: SentExam[];
  turmas?: ClassUnit[];
  onSaveAvaliacao: (alunoId: number, media: number, detalheAvaliacao?: any) => void;
}

export default function AvaliacoesPane({
  alunos,
  checkinsConfirmados = [],
  trainingSchedules = [],
  provasEnviadas = [],
  turmas = [],
  onSaveAvaliacao,
}: AvaliacoesPaneProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<number>(alunos[0]?.id || 0);

  // Manual Criteria State (Only these 3 are editable manually by the teacher)
  const [desenvolvimento, setDesenvolvimento] = useState<number>(8);
  const [disciplina, setDisciplina] = useState<number>(9);
  const [pratica, setPratica] = useState<number>(8);

  const [previewMedia, setPreviewMedia] = useState<number | null>(null);

  // Selected Student Object
  const currentStudent = useMemo(() => {
    return alunos.find((a) => a.id === selectedStudentId) || alunos[0] || null;
  }, [alunos, selectedStudentId]);

  // =========================================================================
  // 1. AUTOMATIC PRESENCE / FREQUENCY CALCULATION (REGRAS 1 a 6)
  // =========================================================================
  const presenceCalc = useMemo(() => {
    if (!currentStudent) {
      return {
        presencasConfirmadas: 0,
        totalAulasRealizadas: 1,
        frequenciaPercent: 0,
        notaPresenca: 0,
        frequenciaAprovada: false,
      };
    }

    // A. Confirmed presences for this student
    const uniqueConfirmedDates = new Set<string>();

    // From student's local checkins array
    if (Array.isArray(currentStudent.checkins)) {
      currentStudent.checkins.forEach((d) => {
        if (d && typeof d === 'string') {
          uniqueConfirmedDates.add(d);
        }
      });
    }

    // From global checkinsConfirmados array
    checkinsConfirmados.forEach((c) => {
      if (
        c.alunoId === currentStudent.id &&
        (c.status === 'confirmado' || !c.status) &&
        c.data
      ) {
        uniqueConfirmedDates.add(c.data);
      }
    });

    const presencasConfirmadas = uniqueConfirmedDates.size;

    // B. Total classes held in period for student's group / turma ON or AFTER entry date
    const sameTurmaCheckinDates = new Set<string>();
    const studentTurmaClean = ((currentStudent as any).turma || currentStudent.professorResponsavelNome || '').toLowerCase().trim();
    const rawEntryDate =
      currentStudent.dataInicioTreino ||
      currentStudent.dataAprovacao ||
      currentStudent.dataCadastro ||
      currentStudent.createdAt ||
      new Date().toISOString().split('T')[0];
    const cleanEntryDate = rawEntryDate.slice(0, 10);

    checkinsConfirmados.forEach((c) => {
      if (c.data && c.data >= cleanEntryDate) {
        const student = alunos.find((a) => a.id === c.alunoId);
        const groupClean = ((student as any)?.turma || student?.professorResponsavelNome || '').toLowerCase().trim();
        if (
          !studentTurmaClean ||
          !groupClean ||
          groupClean === studentTurmaClean
        ) {
          sameTurmaCheckinDates.add(c.data);
        }
      }
    });

    // Also include student's own check-in dates
    uniqueConfirmedDates.forEach((d) => sameTurmaCheckinDates.add(d));

    // Determine real total classes conducted (minimum baseline of recorded sessions or 12 per cycle)
    const totalAulasRealizadas = Math.max(presencasConfirmadas, sameTurmaCheckinDates.size, 12);

    // C. Frequency %
    const frequenciaPercent = Math.min(
      100,
      Math.round((presencasConfirmadas / totalAulasRealizadas) * 10000) / 100
    );

    // D. Convert Frequency % to 0 - 10 scale
    const notaPresenca = Math.min(10, Math.max(0, frequenciaPercent / 10));

    // E. Minimum requirement: 75%
    const frequenciaAprovada = frequenciaPercent >= 75;

    return {
      presencasConfirmadas,
      totalAulasRealizadas,
      frequenciaPercent,
      notaPresenca,
      frequenciaAprovada,
    };
  }, [currentStudent, checkinsConfirmados, alunos]);

  // =========================================================================
  // 2. AUTOMATIC THEORETICAL EXAM INTEGRATION (REGRAS 7 & 8)
  // =========================================================================
  const theoryCalc = useMemo(() => {
    if (!currentStudent) {
      return {
        temProva: false,
        provaCorrigida: false,
        notaTeoria: 0,
        rawScore: 0,
        maxScore: 10,
        tituloProva: '',
      };
    }

    // Find exams assigned to this student or 'todos'
    const studentExams = provasEnviadas.filter(
      (p) => p.alunoId === 'todos' || p.alunoId === currentStudent.id
    );

    // Find exams answered by this student
    const answeredExams = studentExams.filter(
      (p) => p.respostas && p.respostas[currentStudent.id] !== undefined
    );

    if (answeredExams.length === 0) {
      return {
        temProva: false,
        provaCorrigida: false,
        notaTeoria: 0,
        rawScore: 0,
        maxScore: 10,
        tituloProva: 'Nenhuma Prova Teórica Realizada',
      };
    }

    // Take the latest answered exam
    const latestExam = answeredExams[answeredExams.length - 1];
    const scoreVal =
      latestExam.notas && latestExam.notas[currentStudent.id] !== undefined
        ? latestExam.notas[currentStudent.id]
        : null;

    if (scoreVal === null) {
      return {
        temProva: true,
        provaCorrigida: false,
        notaTeoria: 0,
        rawScore: 0,
        maxScore: latestExam.pontuacaoTotal || 10,
        tituloProva: latestExam.tituloProva,
      };
    }

    const rawScore = Number(scoreVal);
    const maxScore = latestExam.pontuacaoTotal || 10;
    // Normalized to 0 - 10 scale
    const notaTeoria = Math.min(10, Math.max(0, (rawScore / maxScore) * 10));

    return {
      temProva: true,
      provaCorrigida: true,
      notaTeoria,
      rawScore,
      maxScore,
      tituloProva: latestExam.tituloProva,
    };
  }, [currentStudent, provasEnviadas]);

  // Combined Average Grade
  const calculatedMedia = useMemo(() => {
    const sum =
      presenceCalc.notaPresenca +
      desenvolvimento +
      disciplina +
      pratica +
      theoryCalc.notaTeoria;
    return sum / 5;
  }, [presenceCalc.notaPresenca, desenvolvimento, disciplina, pratica, theoryCalc.notaTeoria]);

  // Handlers
  const handleVerPrevia = () => {
    if (!currentStudent) {
      alert('Selecione um aluno primeiro!');
      return;
    }
    setPreviewMedia(calculatedMedia);
  };

  const handleSalvar = () => {
    if (!currentStudent) {
      alert('Selecione um aluno primeiro!');
      return;
    }

    // Check if student hasn't taken theoretical exam
    if (!theoryCalc.temProva) {
      const confirmSave = window.confirm(
        `⚠️ ATENÇÃO: O aluno ${currentStudent.nome} ainda NÃO realizou a Prova Teórica no sistema.\n\nA nota de "Teoria e Conceitos" será lançada como 0,00.\n\nDeseja continuar e salvar a avaliação assim mesmo?`
      );
      if (!confirmSave) return;
    }

    const detalheAvaliacao = {
      alunoId: currentStudent.id,
      alunoNome: currentStudent.nome,
      presencaNota: presenceCalc.notaPresenca,
      frequenciaPercent: presenceCalc.frequenciaPercent,
      presencasConfirmadas: presenceCalc.presencasConfirmadas,
      totalAulas: presenceCalc.totalAulasRealizadas,
      frequenciaAprovada: presenceCalc.frequenciaAprovada,
      desenvolvimentoNota: desenvolvimento,
      disciplinaNota: disciplina,
      praticaNota: pratica,
      teoriaNota: theoryCalc.notaTeoria,
      teoriaStatus: theoryCalc.temProva ? 'Realizada' : 'Pendente',
      mediaGeral: calculatedMedia,
      dataAvaliacao: new Date().toLocaleDateString('pt-BR'),
    };

    onSaveAvaliacao(currentStudent.id, calculatedMedia, detalheAvaliacao);
    alert(
      `✅ Avaliação salva com sucesso para ${currentStudent.nome}!\n\nMédia Geral de Tatame: ${formatNota(
        calculatedMedia
      )}`
    );
    setPreviewMedia(null);
  };

  // Status Styling
  const getStatusColor = (nota: number) => {
    if (nota >= 7) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (nota >= 5) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-red-400 bg-red-500/15 border-red-500/30';
  };

  const getStatusLabel = (nota: number) => {
    if (nota >= 7) return 'APROVADO';
    if (nota >= 5) return 'RECUPERAÇÃO';
    return 'REPROVADO';
  };

  const getBarColorClass = (nota: number) => {
    if (nota >= 8) return 'from-emerald-500 to-teal-500';
    if (nota >= 6) return 'from-yellow-500 to-amber-500';
    if (nota >= 4) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-red-900';
  };

  const evaluatedAlunos = alunos.filter((a) => a.notaAvaliacao !== null);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* HEADER BANNER */}
      <div className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-2xl text-orange-500">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  Avaliações de Tatame & Graduação
                </h2>
                <span className="text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  Calculado Automaticamente
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Automação da Nota de Presença (Check-in) e Importação Direta da Prova Teórica.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* FORMULARIO DE AVALIAÇÃO */}
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-850">
            <Star className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Lançar Avaliação Periódica
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Critérios objetivos (Presença e Teoria) são automáticos; lance os critérios práticos.
              </p>
            </div>
          </div>

          {/* STUDENT SELECTOR */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-300 uppercase block">
              Atleta em Avaliação *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(parseInt(e.target.value));
                setPreviewMedia(null);
              }}
              className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-3 px-4 text-sm font-semibold focus:border-orange-500 outline-none cursor-pointer transition shadow-sm"
            >
              {alunos.length === 0 && <option value="0">Nenhum aluno cadastrado</option>}
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  🥋 {a.nome} — Faixa {a.faixa} ({(a as any).turma || a.professorResponsavelNome || 'Geral'})
                </option>
              ))}
            </select>
          </div>

          {/* CRITERIA LIST */}
          <div className="space-y-4 pt-1">
            {/* 1. CRITÉRIO AUTOMÁTICO: PRESENÇA (REGRAS 1 a 6) */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-neutral-800 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      Presença & Frequência
                      <span className="text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-500" /> BLOQUEADO / AUTOMÁTICO
                      </span>
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Sincronizado via Check-in de Aula ({presenceCalc.presencasConfirmadas} de {presenceCalc.totalAulasRealizadas} aulas realizadas)
                    </p>
                  </div>
                </div>

                {/* Score badge */}
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {formatNota(presenceCalc.notaPresenca)}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">/ 10,00</span>
                </div>
              </div>

              {/* Progress bar and frequency details */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400 font-medium">
                    Frequência Efetiva: <strong className="text-white">{presenceCalc.frequenciaPercent.toFixed(1)}%</strong>
                  </span>
                  <span className="text-neutral-400 font-medium">
                    Mínimo exigido: <strong className="text-neutral-300">75,0%</strong>
                  </span>
                </div>

                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      presenceCalc.frequenciaAprovada
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-red-500'
                    }`}
                    style={{ width: `${presenceCalc.frequenciaPercent}%` }}
                  />
                </div>
              </div>

              {/* WARNING REGARDING MINIMUM REQUIREMENT (< 75%) */}
              {!presenceCalc.frequenciaAprovada && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-red-200 block">
                      ⚠️ Atenção: Frequência Abaixo do Mínimo Exigido
                    </strong>
                    <p className="text-[11px] text-red-300/90 mt-0.5">
                      O atleta possui <strong>{presenceCalc.frequenciaPercent.toFixed(1)}%</strong> de frequência ({presenceCalc.presencasConfirmadas} presenças confirmadas em {presenceCalc.totalAulasRealizadas} aulas). O mínimo exigido pela academia é de 75,0%.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CRITÉRIO MANUAL: DESENVOLVIMENTO TÉCNICO */}
            <div className="p-3.5 bg-[#1a1a1a]/80 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Desenvolvimento Técnico
                </span>
                <span className="text-[10px] text-neutral-400">Avaliação da evolução dos golpes e movimentação</span>
              </div>
              <select
                value={desenvolvimento}
                onChange={(e) => {
                  setDesenvolvimento(parseFloat(e.target.value));
                  setPreviewMedia(null);
                }}
                className="bg-[#141414] text-orange-400 font-bold border border-neutral-800 rounded-lg py-1.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
              >
                {Array.from({ length: 21 }, (_, i) => {
                  const val = i / 2;
                  return (
                    <option key={val} value={val}>
                      {formatNota(val)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. CRITÉRIO MANUAL: DISCIPLINA E POSTURA */}
            <div className="p-3.5 bg-[#1a1a1a]/80 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Disciplina & Postura
                </span>
                <span className="text-[10px] text-neutral-400">Respeito às regras, tatame, colegas e hierarquia</span>
              </div>
              <select
                value={disciplina}
                onChange={(e) => {
                  setDisciplina(parseFloat(e.target.value));
                  setPreviewMedia(null);
                }}
                className="bg-[#141414] text-orange-400 font-bold border border-neutral-800 rounded-lg py-1.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
              >
                {Array.from({ length: 21 }, (_, i) => {
                  const val = i / 2;
                  return (
                    <option key={val} value={val}>
                      {formatNota(val)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 4. CRITÉRIO MANUAL: PROVA PRÁTICA */}
            <div className="p-3.5 bg-[#1a1a1a]/80 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Prova Prática / Desempenho
                </span>
                <span className="text-[10px] text-neutral-400">Execução técnica no rola e exame de faixas</span>
              </div>
              <select
                value={pratica}
                onChange={(e) => {
                  setPratica(parseFloat(e.target.value));
                  setPreviewMedia(null);
                }}
                className="bg-[#141414] text-orange-400 font-bold border border-neutral-800 rounded-lg py-1.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
              >
                {Array.from({ length: 21 }, (_, i) => {
                  const val = i / 2;
                  return (
                    <option key={val} value={val}>
                      {formatNota(val)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 5. CRITÉRIO AUTOMÁTICO: TEORIA E CONCEITOS (REGRAS 7 & 8) */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-neutral-800 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      Teoria & Conceitos
                      <span className="text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-500" /> BLOQUEADO / AUTOMÁTICO
                      </span>
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Importado diretamente do Módulo Provas Teóricas
                    </p>
                  </div>
                </div>

                {/* Score badge */}
                <div className="text-right">
                  <span className="text-xl font-black text-blue-400 font-mono">
                    {formatNota(theoryCalc.notaTeoria)}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">/ 10,00</span>
                </div>
              </div>

              {/* Status details from theoretical exam */}
              {theoryCalc.temProva ? (
                <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-850 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-300 font-bold block">{theoryCalc.tituloProva}</span>
                    <span className="text-[10px] text-neutral-400">
                      Pontuação: {theoryCalc.rawScore} / {theoryCalc.maxScore} pts (Convertida para 0-10)
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ✓ Concluída
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-200 block">
                      ⚠️ Prova Teórica Ainda Não Realizada
                    </strong>
                    <p className="text-[11px] text-amber-300/90 mt-0.5">
                      O atleta ainda não respondeu aos desafios teóricos cadastrados no sistema. A nota teórica atual é 0,00.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleVerPrevia}
              className="flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold text-xs py-3.5 px-4 rounded-xl hover:text-white hover:border-neutral-600 transition cursor-pointer"
            >
              <Play className="w-4 h-4 text-orange-500" />
              <span>Ver Prévia Média</span>
            </button>
            <button
              onClick={handleSalvar}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer transition uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Avaliação</span>
            </button>
          </div>
        </div>

        {/* PRÉVIA DA NOTA & HISTÓRICO */}
        <div className="space-y-6">
          {previewMedia !== null && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-neutral-950 to-neutral-900/80 shadow-2xl text-center animate-scale-in relative overflow-hidden space-y-4">
              <div className="flex items-center justify-center gap-2 text-orange-400 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                <span>Prévia do Resultado da Avaliação</span>
              </div>

              <div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-4 border-dashed border-neutral-800 my-2">
                <span className="text-4xl font-black text-white font-mono">
                  {formatNota(previewMedia)}
                </span>
              </div>

              <div className="inline-block">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${getStatusColor(
                    previewMedia
                  )}`}
                >
                  {getStatusLabel(previewMedia)}
                </span>
              </div>

              {/* Breakdown List */}
              <div className="grid grid-cols-2 gap-2 text-left bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 text-[11px] text-neutral-300 font-medium">
                <div>Presença (Auto): <strong className="text-emerald-400 font-mono">{formatNota(presenceCalc.notaPresenca)}</strong></div>
                <div>Técnica (Manual): <strong className="text-white font-mono">{formatNota(desenvolvimento)}</strong></div>
                <div>Disciplina (Manual): <strong className="text-white font-mono">{formatNota(disciplina)}</strong></div>
                <div>Prática (Manual): <strong className="text-white font-mono">{formatNota(pratica)}</strong></div>
                <div className="col-span-2 border-t border-neutral-800 pt-1 mt-1">
                  Teoria (Auto): <strong className="text-blue-400 font-mono">{formatNota(theoryCalc.notaTeoria)}</strong> ({theoryCalc.temProva ? 'Realizada' : 'Pendente'})
                </div>
              </div>
            </div>
          )}

          {/* LISTA DE AVALIAÇÕES REGISTRADAS */}
          <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-850">
              <Award className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Últimas Avaliações Registradas
              </h3>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {evaluatedAlunos.length > 0 ? (
                evaluatedAlunos.map((aluno) => {
                  const nota = aluno.notaAvaliacao || 0;
                  return (
                    <div
                      key={aluno.id}
                      className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 text-left hover:border-neutral-700 transition space-y-3"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <strong className="text-white text-sm block">🥋 {aluno.nome}</strong>
                          <span className="text-[10px] text-neutral-400 bg-neutral-900 py-0.5 px-2 rounded-md font-bold uppercase inline-block mt-1">
                            Faixa {aluno.faixa}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-orange-500 font-mono">
                            {formatNota(nota)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getStatusColor(
                            nota
                          )}`}
                        >
                          {getStatusLabel(nota)}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Aproveitamento: {Math.round(nota * 10)}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                          <div
                            className={`h-full bg-gradient-to-r rounded-full transition-all duration-1000 ${getBarColorClass(
                              nota
                            )}`}
                            style={{ width: `${Math.min(100, nota * 10)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-50 text-xs text-neutral-400">
                  Nenhuma avaliação registrada ainda no sistema.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

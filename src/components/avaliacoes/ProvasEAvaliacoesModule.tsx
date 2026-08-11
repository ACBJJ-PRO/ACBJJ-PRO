import React, { useState, useEffect, useMemo } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import {
  Student,
  ClassUnit,
  CheckinRequest,
  SentExam,
  User,
  EvaluationCycle,
  EvaluationSettings,
  StudentEvaluationRecord,
} from '../../types';
import {
  DEFAULT_EVALUATION_SETTINGS,
  DEFAULT_INITIAL_CYCLE,
  safeStorageParse,
} from './evaluationUtils';
import AbaAvaliacoes from './AbaAvaliacoes';
import AbaDashboard from './AbaDashboard';
import AbaHistorico from './AbaHistorico';
import AbaConfiguracoes from './AbaConfiguracoes';
import ProvasPane from '../ProvasPane';
import {
  Award,
  BarChart3,
  Archive,
  Settings,
  BookOpen,
} from 'lucide-react';

interface ProvasEAvaliacoesModuleProps {
  currentUser: User;
  alunos: Student[];
  turmas: ClassUnit[];
  usuarios?: User[];
  checkinsConfirmados?: CheckinRequest[];
  provasEnviadas?: SentExam[];
  onSaveAvaliacaoLegacy?: (alunoId: number, media: number, detalheAvaliacao?: any) => void;
  onEnviarProva?: (novaProva: SentExam) => void;
  onRemoverProva?: (id: number) => void;
  onLancarNotaProva?: (provaId: number, alunoId: number, nota: number) => void;
}

export default function ProvasEAvaliacoesModule({
  currentUser,
  alunos,
  turmas,
  usuarios = [],
  checkinsConfirmados = [],
  provasEnviadas = [],
  onSaveAvaliacaoLegacy,
  onEnviarProva,
  onRemoverProva,
  onLancarNotaProva,
}: ProvasEAvaliacoesModuleProps) {
  // Filter EXCLUSIVELY approved students (REGRA 3 & REGRA 5)
  const approvedAlunos = useMemo(() => {
    return alunos.filter((a) => {
      // Must not be inactive/unapproved
      if (a.ativo === false && a.usuarioId !== null && a.usuarioId !== undefined) {
        return false;
      }
      // Check linked user profile strictly by usuarioId
      let matchedUser: User | undefined;
      if (a.usuarioId != null) {
        matchedUser = usuarios.find((u) => Number(u.id) === Number(a.usuarioId));
      }

      if (matchedUser) {
        if (matchedUser.tipo !== 'aluno') return false; // Exclude admin, professor, instrutor
        if (!matchedUser.aprovado) return false; // Exclude pending
      }

      // Exclude Uri Cruz / Admin accounts from Provas & Avaliações
      const isUriOrAdmin =
        (a.nome && (a.nome.toUpperCase().includes('URI CRUZ') || a.nome.toUpperCase().includes('YURI CRUZ') || a.nome.toUpperCase().includes('ADMINISTRADOR'))) ||
        (a.email && (a.email.includes('admin') || a.email.includes('uricruz')));
      if (isUriOrAdmin) return false;

      return true;
    });
  }, [alunos, usuarios]);
  // Top Active Tab inside Provas e Avaliações
  const [activeTab, setActiveTab] = useState<'provas' | 'avaliacoes' | 'dashboard' | 'historico' | 'configuracoes'>('avaliacoes');

  // Cycles State
  const [cycles, setCycles] = useState<EvaluationCycle[]>(() => {
    const loaded = safeStorageParse<EvaluationCycle[]>('arena_avaliacoes_ciclos', [DEFAULT_INITIAL_CYCLE]);
    if (!loaded || loaded.length === 0) {
      return [DEFAULT_INITIAL_CYCLE];
    }
    return loaded.map((c) => {
      if (c.status === 'ativo' && (c.nome === '1º Semestre 2026' || c.dataInicio === '2026-01-01')) {
        return {
          ...c,
          id: 'ciclo-2026-2',
          nome: '2º Semestre 2026',
          dataInicio: '2026-08-01',
        };
      }
      return c;
    });
  });

  // Settings State
  const [settings, setSettings] = useState<EvaluationSettings>(() => {
    return safeStorageParse('arena_avaliacoes_config', DEFAULT_EVALUATION_SETTINGS);
  });

  // Evaluation Records State
  const [records, setRecords] = useState<StudentEvaluationRecord[]>(() => {
    return safeStorageParse('arena_avaliacoes_registros', []);
  });

  // Fetch from Cloud SQL on mount to make PostgreSQL single source of truth
  useEffect(() => {
    let mounted = true;

    async function loadCloudSQLData() {
      try {
        const [cyclesRes, evalsRes, settingsRes] = await Promise.all([
          fetch('/api/cloudsql/evaluation-cycles', { headers: getAuthHeaders() }).then((r) => r.ok ? r.json() : null),
          fetch('/api/cloudsql/evaluations', { headers: getAuthHeaders() }).then((r) => r.ok ? r.json() : null),
          fetch('/api/cloudsql/evaluation-settings', { headers: getAuthHeaders() }).then((r) => r.ok ? r.json() : null),
        ]);

        if (mounted) {
          if (cyclesRes?.cycles && Array.isArray(cyclesRes.cycles) && cyclesRes.cycles.length > 0) {
            setCycles(cyclesRes.cycles);
          }
          if (evalsRes?.evaluations && Array.isArray(evalsRes.evaluations) && evalsRes.evaluations.length > 0) {
            setRecords(evalsRes.evaluations);
          }
          if (settingsRes?.settings && typeof settingsRes.settings === 'object') {
            setSettings(settingsRes.settings);
          }
        }
      } catch (err) {
        console.warn('Could not load evaluation data directly from Cloud SQL endpoints:', err);
      }
    }

    loadCloudSQLData();
    return () => { mounted = false; };
  }, []);

  // Sync to LocalStorage as secondary local cache
  useEffect(() => {
    try {
      localStorage.setItem('arena_avaliacoes_ciclos', JSON.stringify(cycles));
    } catch (e) {
      console.warn(e);
    }
  }, [cycles]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_avaliacoes_config', JSON.stringify(settings));
    } catch (e) {
      console.warn(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('arena_avaliacoes_registros', JSON.stringify(records));
    } catch (e) {
      console.warn(e);
    }
  }, [records]);

  // Active Cycle
  const activeCycle = useMemo(() => {
    const active = cycles.find((c) => c.status === 'ativo');
    if (active) return active;
    // Fallback if none is active
    return cycles[0] || DEFAULT_INITIAL_CYCLE;
  }, [cycles]);

  // Handle Saving an Evaluation
  const handleSaveRecord = (
    rec: StudentEvaluationRecord,
    andNext?: boolean
  ) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === rec.id || (r.alunoId === rec.alunoId && r.cicloId === rec.cicloId));
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = rec;
        return copy;
      }
      return [rec, ...prev];
    });

    // Save directly to Cloud SQL
    fetch('/api/cloudsql/evaluations/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rec),
    }).catch((err) => console.error('Error saving evaluation in Cloud SQL:', err));

    // Keep legacy App.tsx state in sync so student list mediaGeral updates
    if (onSaveAvaliacaoLegacy) {
      onSaveAvaliacaoLegacy(rec.alunoId, rec.mediaFinal, rec);
    }
  };

  // Handle Updating Settings
  const handleUpdateSettings = (newSettings: EvaluationSettings) => {
    setSettings(newSettings);

    fetch('/api/cloudsql/evaluation-settings/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newSettings),
    }).catch((err) => console.error('Error saving evaluation settings in Cloud SQL:', err));
  };

  // Handle Encerrar Ciclo
  const handleEncerrarCiclo = (novoCicloNome: string) => {
    const nowIso = new Date().toISOString().split('T')[0];

    // 1. Mark current active cycle as archived/encerrado
    const updatedArchivedCycle: EvaluationCycle = {
      ...activeCycle,
      status: 'encerrado' as const,
      dataFim: nowIso,
      dataEncerramento: nowIso,
      encerradoPor: currentUser?.nome || 'Administrador',
    };

    const updatedCycles = cycles.map((c) => {
      if (c.id === activeCycle.id) {
        return updatedArchivedCycle;
      }
      return c;
    });

    // 2. Create new active cycle
    const newCycle: EvaluationCycle = {
      id: `ciclo-${Date.now()}`,
      nome: novoCicloNome,
      status: 'ativo',
      dataInicio: nowIso,
    };

    setCycles([newCycle, ...updatedCycles]);

    // Persist both cycles to Cloud SQL
    fetch('/api/cloudsql/evaluation-cycles/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedArchivedCycle),
    }).catch((err) => console.error('Error archiving cycle in Cloud SQL:', err));

    fetch('/api/cloudsql/evaluation-cycles/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newCycle),
    }).catch((err) => console.error('Error creating new cycle in Cloud SQL:', err));

    alert(`O ciclo "${activeCycle.nome}" foi encerrado e arquivado no histórico. O novo ciclo "${novoCicloNome}" já está ativo!`);
  };

  // Handle Reabrir Ciclo
  const handleReabrirCiclo = (cicloId: string) => {
    let targetCycle: EvaluationCycle | undefined;
    setCycles((prev) =>
      prev.map((c) => {
        if (c.id === cicloId) {
          targetCycle = { ...c, status: 'ativo' as const };
          return targetCycle;
        }
        return c;
      })
    );

    if (targetCycle) {
      fetch('/api/cloudsql/evaluation-cycles/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(targetCycle),
      }).catch((err) => console.error('Error reopening cycle in Cloud SQL:', err));
    }

    alert('Ciclo reaberto com sucesso!');
  };

  // Callback when a turma card is clicked on Dashboard to filter that turma on Avaliações tab
  const handleSelectTurmaForEvaluation = (turmaNome: string) => {
    setActiveTab('avaliacoes');
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* TOP FIVE MAIN TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 bg-[#141414] p-2 rounded-3xl border border-neutral-800 shadow-xl max-w-5xl">
        <button
          type="button"
          onClick={() => setActiveTab('provas')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'provas'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Provas Teóricas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('avaliacoes')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'avaliacoes'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Avaliações</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'historico'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Histórico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('configuracoes')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeTab === 'configuracoes'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg scale-[1.02]'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'provas' && (
        <ProvasPane
          alunos={approvedAlunos}
          provasEnviadas={provasEnviadas}
          onEnviarProva={onEnviarProva!}
          onRemoverProva={onRemoverProva!}
          onLancarNotaProva={onLancarNotaProva}
        />
      )}

      {activeTab === 'avaliacoes' && (
        <AbaAvaliacoes
          alunos={approvedAlunos}
          turmas={turmas}
          activeCycle={activeCycle}
          settings={settings}
          records={records}
          checkinsConfirmados={checkinsConfirmados}
          provasEnviadas={provasEnviadas}
          currentUserNome={currentUser?.nome}
          currentUserId={currentUser?.id}
          onSaveRecord={handleSaveRecord}
          onEnviarProva={onEnviarProva}
          onRemoverProva={onRemoverProva}
          onLancarNotaProva={onLancarNotaProva}
        />
      )}

      {activeTab === 'dashboard' && (
        <AbaDashboard
          alunos={approvedAlunos}
          turmas={turmas}
          activeCycle={activeCycle}
          settings={settings}
          records={records}
          checkinsConfirmados={checkinsConfirmados}
          onSelectTurmaForEvaluation={handleSelectTurmaForEvaluation}
        />
      )}

      {activeTab === 'historico' && (
        <AbaHistorico
          cycles={cycles}
          records={records}
          settings={settings}
        />
      )}

      {activeTab === 'configuracoes' && (
        <AbaConfiguracoes
          currentUser={currentUser}
          activeCycle={activeCycle}
          allCycles={cycles}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onEncerrarCiclo={handleEncerrarCiclo}
          onReabrirCiclo={handleReabrirCiclo}
        />
      )}
    </div>
  );
}

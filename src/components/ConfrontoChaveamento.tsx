import React, { useState } from 'react';
import { 
  Trophy, Shield, Check, RefreshCw, Layers, Award, Medal, CircleDot, 
  PlusCircle, UserPlus, Trash2, Shuffle, Settings, ChevronRight, X, AlertCircle, Edit2,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface Athlete {
  id: string;
  nome: string;
  academia: string;
  faixa: string;
  categoria: string;
  peso: string;
  genero: string;
  modalidade?: string;
  disputa?: string;
}

interface Match {
  id: string;
  round: string;
  player1: Athlete | null;
  player2: Athlete | null;
  winnerId: string | null;
  nextMatchId: string | null;
  winMethod?: 'WO' | 'Finalização' | 'Pontos' | 'Vantagens' | 'Decisão' | 'Desclassificação';
  score?: string; // e.g. "10x2", "Aguardando"
}

interface DivisionBracket {
  divisionId: string;
  gender: string;
  category: string;
  faixa: string;
  peso: string;
  modalidade: string;
  disputa: string;
  athletes: Athlete[];
  matches: Match[];
  publicada?: boolean;
}

interface ConfrontoChaveamentoProps {
  championship: any;
  onUpdateChampionship: (updatedChamp: any) => void;
  isAdmin: boolean;
  registrations: any[];
  onUpdateInscricoes?: (newInscricoes: any[]) => void;
}

export default function ConfrontoChaveamento({
  championship,
  onUpdateChampionship,
  isAdmin,
  registrations,
  onUpdateInscricoes
}: ConfrontoChaveamentoProps) {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [swappingMatchId, setSwappingMatchId] = useState<string | null>(null);
  const [swappingSlot, setSwappingSlot] = useState<1 | 2 | null>(null);
  
  // Manual athlete form states
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteAcademia, setNewAthleteAcademia] = useState('');
  const [newAthleteFaixa, setNewAthleteFaixa] = useState('');
  const [newAthletePeso, setNewAthletePeso] = useState('');
  const [newAthleteCategoria, setNewAthleteCategoria] = useState('');
  const [newAthleteGenero, setNewAthleteGenero] = useState('Masculino');

  // Match method declaration modal/state
  const [declaringWinnerMatchId, setDeclaringWinnerMatchId] = useState<string | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [winMethod, setWinMethod] = useState<'WO' | 'Finalização' | 'Pontos' | 'Vantagens' | 'Decisão' | 'Desclassificação'>('Pontos');
  const [winScore, setWinScore] = useState('');

  // Local settings state for criteria confirmation
  const [localSettings, setLocalSettings] = useState(() => {
    return championship.bracketSettings || {
      maxChavesSize: 16,
      sameFaixa: true,
      samePeso: true,
      sameCategory: true,
      sameModalidade: true,
      crossFaixaAllowed: false,
      specialGroupings: false,
    };
  });

  // Sync localSettings when championship.bracketSettings changes
  React.useEffect(() => {
    if (championship.bracketSettings) {
      setLocalSettings(championship.bracketSettings);
    }
  }, [championship.bracketSettings]);

  // Default bracket settings if not set on championship
  const bracketSettings = championship.bracketSettings || {
    maxChavesSize: 16,
    sameFaixa: true,
    samePeso: true,
    sameCategory: true,
    sameModalidade: true,
    crossFaixaAllowed: false,
    specialGroupings: false,
  };

  // Dynamic skeleton preview size for empty state
  const [skeletonSize, setSkeletonSize] = useState<number>(8);

  // Confirmed registrations
  const confirmedRegs = registrations.filter(
    (r) => r.campeonatoId === championship.id && r.status === 'Pagamento Confirmado'
  );

  const divisions: DivisionBracket[] = championship.chaves || [];
  const currentDiv = divisions.find(d => d.divisionId === selectedDivisionId) || divisions[0];

  // Auto sync registrations addition/removal
  const confirmedRegsSerialized = JSON.stringify(
    confirmedRegs.map(r => ({ id: r.id, status: r.status, nome: r.nome, academia: r.academia, faixa: r.faixa, peso: r.peso, categoria: r.categoria, genero: r.genero, modalidade: r.modalidade }))
  );

  React.useEffect(() => {
    if (!championship || !divisions || divisions.length === 0) return;

    let chavesChanged = false;
    const updatedChaves = divisions.map(div => {
      // Find all confirmed registrations that match this division's criteria
      const matchingRegs = confirmedRegs.filter(reg => {
        const faixaMatch = !bracketSettings.sameFaixa || div.faixa === 'Misto' || reg.faixa === div.faixa;
        const pesoMatch = !bracketSettings.samePeso || div.peso === 'Misto' || reg.peso === div.peso;
        const catMatch = !bracketSettings.sameCategory || div.category === 'Geral' || reg.categoria === div.category;
        const modMatch = !bracketSettings.sameModalidade || div.modalidade === 'Misto' || (reg.modalidade || 'Gi') === div.modalidade;
        const genderMatch = reg.genero === div.gender;
        return faixaMatch && pesoMatch && catMatch && modMatch && genderMatch;
      });

      // Ensure all matching registrations are in div.athletes
      const currentAthleteIds = new Set(div.athletes.map(a => a.id));
      const athletesToAdd: Athlete[] = [];
      
      matchingRegs.forEach(reg => {
        if (!currentAthleteIds.has(reg.id)) {
          athletesToAdd.push({
            id: reg.id,
            nome: reg.nome,
            academia: reg.academia || 'Avulso',
            faixa: reg.faixa,
            categoria: reg.categoria,
            peso: reg.peso,
            genero: reg.genero || 'Masculino',
            modalidade: reg.modalidade || 'Gi',
            disputa: championship.disputa || 'Geral'
          });
        }
      });

      // Also check if any athlete in div.athletes is no longer confirmed (or has been deleted/removed)
      const confirmedRegIds = new Set(matchingRegs.map(r => r.id));
      // Keep manually added ones if their ID starts with 'ath-'
      const athletesToRemove = div.athletes.filter(a => !confirmedRegIds.has(a.id) && !a.id.startsWith('ath-'));

      if (athletesToAdd.length > 0 || athletesToRemove.length > 0) {
        chavesChanged = true;
        
        // Add new ones
        let newAthletesList = [...div.athletes, ...athletesToAdd];
        
        // Remove deleted ones
        if (athletesToRemove.length > 0) {
          const removeIds = new Set(athletesToRemove.map(a => a.id));
          newAthletesList = newAthletesList.filter(a => !removeIds.has(a.id));
        }

        // Clean up matches slots for removed athletes
        const updatedMatches = div.matches.map(m => {
          let p1 = m.player1;
          let p2 = m.player2;
          let mChanged = false;
          if (p1 && athletesToRemove.some(a => a.id === p1!.id)) {
            p1 = null;
            mChanged = true;
          }
          if (p2 && athletesToRemove.some(a => a.id === p2!.id)) {
            p2 = null;
            mChanged = true;
          }
          return mChanged ? { ...m, player1: p1, player2: p2 } : m;
        });

        return {
          ...div,
          athletes: newAthletesList,
          matches: updatedMatches
        };
      }

      return div;
    });

    if (chavesChanged) {
      onUpdateChampionship({
        ...championship,
        chaves: updatedChaves
      });
    }
  }, [confirmedRegsSerialized, championship.id]);

  // Propagate winners general algorithm
  const propagateWinners = (matches: Match[]) => {
    if (matches.length === 0) return;

    // 1. Identify first round
    const roundGroups: Record<string, Match[]> = {};
    matches.forEach(m => {
      if (!roundGroups[m.round]) {
        roundGroups[m.round] = [];
      }
      roundGroups[m.round].push(m);
    });

    const sortedRounds = Object.entries(roundGroups)
      .map(([name, rMatches]) => ({ name, count: rMatches.length }))
      .sort((a, b) => b.count - a.count);
    
    if (sortedRounds.length === 0) return;
    const firstRoundName = sortedRounds[0].name;

    // 2. Clear player1 and player2 for all subsequent rounds so we rebuild them dynamically
    matches.forEach(m => {
      if (m.round !== firstRoundName) {
        m.player1 = null;
        m.player2 = null;
      }
    });

    // 3. Propagate step-by-step
    let changed = true;
    let iterations = 0;
    
    while (changed && iterations < 50) {
      changed = false;
      iterations++;
      
      for (const match of matches) {
        // If it is NOT the first round, and both feeder matches are completed, but it does not have players set,
        // we can check if we should assign them based on the winners of the previous round.
        // Actually, we do this by looking at matches that feed INTO this match.
        
        // If a match has no players, it cannot have a winner
        if (!match.player1 && !match.player2) {
          if (match.winnerId) {
            match.winnerId = null;
            match.winMethod = undefined;
            match.score = undefined;
            changed = true;
          }
        }

        // Auto-resolve BYEs for any match where only 1 player exists and we're not waiting on feeds
        const incomingFeeds = matches.filter(prev => prev.nextMatchId === match.id);
        const hasUnfinishedFeeds = incomingFeeds.some(prev => !prev.winnerId);

        if (!hasUnfinishedFeeds) {
          if (match.player1 && !match.player2 && !match.winnerId) {
            match.winnerId = match.player1.id;
            match.winMethod = 'WO';
            match.score = 'W.O.';
            changed = true;
          } else if (!match.player1 && match.player2 && !match.winnerId) {
            match.winnerId = match.player2.id;
            match.winMethod = 'WO';
            match.score = 'W.O.';
            changed = true;
          }
        } else {
          // If there are still pending feeds, this match cannot be resolved yet
          if (match.winnerId && (!match.player1 || !match.player2)) {
            match.winnerId = null;
            match.winMethod = undefined;
            match.score = undefined;
            changed = true;
          }
        }

        // Propagate winner to nextMatch
        if (match.winnerId && match.nextMatchId) {
          const nextMatch = matches.find(m => m.id === match.nextMatchId);
          if (nextMatch) {
            const winnerAthlete = match.player1?.id === match.winnerId ? match.player1 : match.player2;
            if (winnerAthlete) {
              const sameRoundMatches = matches.filter(m => m.round === match.round);
              sameRoundMatches.sort((a, b) => a.id.localeCompare(b.id));
              const matchIndex = sameRoundMatches.findIndex(m => m.id === match.id);
              const isPlayer1Slot = (matchIndex % 2 === 0);
              
              if (isPlayer1Slot) {
                if (!nextMatch.player1 || nextMatch.player1.id !== winnerAthlete.id) {
                  nextMatch.player1 = winnerAthlete;
                  changed = true;
                }
              } else {
                if (!nextMatch.player2 || nextMatch.player2.id !== winnerAthlete.id) {
                  nextMatch.player2 = winnerAthlete;
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  };

  // Generate dynamic matches based on power of 2
  const generateDivisionMatches = (athletes: Athlete[], divisionId: string, maxSize: number, manual: boolean = true): Match[] => {
    const N = athletes.length;
    if (N === 0) return [];

    // Determine target size
    let M = maxSize;

    const rounds: { name: string; size: number }[] = [];
    let currentSize = M;
    
    while (currentSize >= 2) {
      const matchCount = currentSize / 2;
      let rName = '';
      if (matchCount === 1) rName = 'Final';
      else if (matchCount === 2) rName = 'Semifinal';
      else if (matchCount === 4) rName = 'Quartas de Final';
      else if (matchCount === 8) rName = 'Oitavas de Final';
      else if (matchCount === 16) rName = 'Dezesseis Avos de Final';
      else if (matchCount === 32) rName = 'Trinta e Dois Avos de Final';
      else rName = `${matchCount} Avos`;

      rounds.push({
        name: rName,
        size: matchCount
      });
      currentSize /= 2;
    }

    const matches: Match[] = [];
    
    for (let r = 0; r < rounds.length; r++) {
      const roundInfo = rounds[r];
      for (let i = 0; i < roundInfo.size; i++) {
        const matchId = `${divisionId}-${roundInfo.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`;
        let nextMatchId: string | null = null;
        if (r < rounds.length - 1) {
          const nextRoundInfo = rounds[r + 1];
          const nextMatchIdx = Math.floor(i / 2);
          nextMatchId = `${divisionId}-${nextRoundInfo.name.toLowerCase().replace(/\s+/g, '-')}-${nextMatchIdx + 1}`;
        }
        
        matches.push({
          id: matchId,
          round: roundInfo.name,
          player1: null,
          player2: null,
          winnerId: null,
          nextMatchId: nextMatchId
        });
      }
    }

    if (!manual) {
      // Auto populate first round
      const firstRoundInfo = rounds[0];
      const firstRoundMatches = matches.filter(m => m.round === firstRoundInfo.name);
      
      for (let i = 0; i < firstRoundMatches.length; i++) {
        const m = firstRoundMatches[i];
        const p1Idx = i * 2;
        const p2Idx = i * 2 + 1;
        
        m.player1 = p1Idx < N ? athletes[p1Idx] : null;
        m.player2 = p2Idx < N ? athletes[p2Idx] : null;
        
        // Auto-resolve byes
        if (m.player1 && !m.player2) {
          m.winnerId = m.player1.id;
          m.winMethod = 'WO';
          m.score = 'W.O.';
        } else if (!m.player1 && m.player2) {
          m.winnerId = m.player2.id;
          m.winMethod = 'WO';
          m.score = 'W.O.';
        }
      }
      propagateWinners(matches);
    }

    return matches;
  };

  // Group and generate all brackets (manually by default)
  const handleGenerateBrackets = (customSettings?: typeof bracketSettings) => {
    const activeSettings = customSettings || bracketSettings;
    const grouped: { [key: string]: Athlete[] } = {};
    
    confirmedRegs.forEach((reg) => {
      const faixaPart = activeSettings.sameFaixa ? reg.faixa : 'Misto';
      const pesoPart = activeSettings.samePeso ? reg.peso : 'Misto';
      const catPart = activeSettings.sameCategory ? reg.categoria : 'Geral';
      const modPart = activeSettings.sameModalidade ? (reg.modalidade || 'Disputa') : 'Misto';
      
      const divKey = `${reg.genero || 'Masculino'}_${catPart}_${faixaPart}_${pesoPart}_${modPart}_${championship.disputa || 'Geral'}`;
      if (!grouped[divKey]) {
        grouped[divKey] = [];
      }
      grouped[divKey].push({
        id: reg.id || `ath-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        nome: reg.nome,
        academia: reg.academia || 'Avulso',
        faixa: reg.faixa,
        categoria: reg.categoria,
        peso: reg.peso,
        genero: reg.genero || 'Masculino',
        modalidade: reg.modalidade || 'Gi',
        disputa: championship.disputa || 'Geral'
      });
    });

    const newDivisions: DivisionBracket[] = [];

    Object.keys(grouped).forEach((key) => {
      const athletes = grouped[key];
      const [gender, category, faixa, peso, modalidade, disputa] = key.split('_');
      const divisionId = `${championship.id}-${key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      // manual: true by default to ensure manual distribution
      const matches = generateDivisionMatches(athletes, divisionId, Number(activeSettings.maxChavesSize), true);
      
      newDivisions.push({
        divisionId,
        gender,
        category,
        faixa,
        peso,
        modalidade,
        disputa,
        athletes,
        matches,
        publicada: false // Starts as Draft
      });
    });

    onUpdateChampionship({
      ...championship,
      chavesGeradas: true,
      bracketSettings: activeSettings,
      chaves: newDivisions
    });
    setShowSettings(false);
  };

  // Reset or clear
  const handleResetBrackets = () => {
    handleGenerateBrackets();
  };

  // Save settings
  const handleSaveSettings = (newSettings: any) => {
    onUpdateChampionship({
      ...championship,
      bracketSettings: newSettings
    });
  };

  // MANUAL POSITIONING HANDLERS
  const handlePlaceAthlete = (matchId: string, slot: 1 | 2, athleteId: string) => {
    if (!currentDiv || currentDiv.publicada) return;

    const updatedChaves = divisions.map(div => {
      if (div.divisionId !== currentDiv.divisionId) return div;
      
      const athlete = div.athletes.find(a => a.id === athleteId);
      if (!athlete) return div;

      // Find if athleteId was previously placed in some match/slot
      let prevMatchId: string | null = null;
      let prevSlot: 1 | 2 | null = null;
      
      div.matches.forEach(m => {
        if (m.player1 && m.player1.id === athleteId) {
          prevMatchId = m.id;
          prevSlot = 1;
        }
        if (m.player2 && m.player2.id === athleteId) {
          prevMatchId = m.id;
          prevSlot = 2;
        }
      });

      // Find target match and current occupant of target slot
      const targetMatch = div.matches.find(m => m.id === matchId);
      const targetOccupant = targetMatch ? (slot === 1 ? targetMatch.player1 : targetMatch.player2) : null;

      // Clean matches: remove the dragged athlete from their old slot
      let cleanedMatches = div.matches.map(m => {
        let p1 = m.player1;
        let p2 = m.player2;
        if (p1 && p1.id === athleteId) p1 = null;
        if (p2 && p2.id === athleteId) p2 = null;
        return { ...m, player1: p1, player2: p2 };
      });

      // Place the athlete in the target slot. If there was a target occupant:
      // - If the athlete had a previous slot, put target occupant in that previous slot (swap)!
      // - Otherwise, target occupant is simply evicted (goes back to idle list).
      const updatedMatches = cleanedMatches.map(m => {
        let p1 = m.id === matchId && slot === 1 ? athlete : m.player1;
        let p2 = m.id === matchId && slot === 2 ? athlete : m.player2;

        // If swapping, put evicted player in the dragged player's previous slot
        if (prevMatchId && prevSlot && targetOccupant && m.id === prevMatchId) {
          if (prevSlot === 1) p1 = targetOccupant;
          else p2 = targetOccupant;
        }

        return { ...m, player1: p1, player2: p2 };
      });

      return {
        ...div,
        matches: updatedMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  const handleClearSlot = (matchId: string, slot: 1 | 2) => {
    if (!currentDiv || currentDiv.publicada) return;

    const updatedChaves = divisions.map(div => {
      if (div.divisionId !== currentDiv.divisionId) return div;

      const updatedMatches = div.matches.map(m => {
        if (m.id !== matchId) return m;
        if (slot === 1) {
          return { ...m, player1: null };
        } else {
          return { ...m, player2: null };
        }
      });

      return {
        ...div,
        matches: updatedMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  const handleQuickShuffle = () => {
    if (!currentDiv || currentDiv.publicada) return;

    const athletes = [...currentDiv.athletes].sort(() => Math.random() - 0.5);
    const updatedChaves = divisions.map(div => {
      if (div.divisionId !== currentDiv.divisionId) return div;

      // Generate a new manual=false matches set so they are automatically positioned
      const autoMatches = generateDivisionMatches(athletes, div.divisionId, Number(bracketSettings.maxChavesSize), false);
      
      return {
        ...div,
        matches: autoMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  // VALIDATION & PUBLICATION
  const validateDivisionBracket = (division: DivisionBracket): string[] => {
    const errors: string[] = [];
    if (!division) return errors;

    // Identify first round matches
    const roundGroups: Record<string, Match[]> = {};
    division.matches.forEach(m => {
      if (!roundGroups[m.round]) {
        roundGroups[m.round] = [];
      }
      roundGroups[m.round].push(m);
    });

    const sortedRounds = Object.entries(roundGroups)
      .map(([name, matches]) => ({ name, count: matches.length }))
      .sort((a, b) => b.count - a.count);

    if (sortedRounds.length === 0) return errors;
    const firstRoundName = sortedRounds[0].name;
    const firstRoundMatches = division.matches.filter(m => m.round === firstRoundName);

    // 1. Check duplicated athletes placed in more than one slot
    const placedIds = new Set<string>();
    const duplicateNames = new Set<string>();
    firstRoundMatches.forEach(m => {
      if (m.player1) {
        if (placedIds.has(m.player1.id)) {
          duplicateNames.add(m.player1.nome);
        }
        placedIds.add(m.player1.id);
      }
      if (m.player2) {
        if (placedIds.has(m.player2.id)) {
          duplicateNames.add(m.player2.nome);
        }
        placedIds.add(m.player2.id);
      }
    });

    if (duplicateNames.size > 0) {
      errors.push(`Atletas posicionados em mais de uma vaga: ${Array.from(duplicateNames).join(', ')}`);
    }

    // 2. Unpositioned athletes / Mandatory slots check
    const unplacedAthletes = division.athletes.filter(a => !placedIds.has(a.id));
    if (unplacedAthletes.length > 0) {
      errors.push(`Existem ${unplacedAthletes.length} atletas pendentes de posicionamento: ${unplacedAthletes.map(a => a.nome).join(', ')}`);
    }

    // 3. Incompatible criteria check (faixa, peso, categoria, genero, modalidade)
    firstRoundMatches.forEach(m => {
      [m.player1, m.player2].forEach(p => {
        if (p) {
          if (bracketSettings.sameFaixa && p.faixa !== division.faixa && division.faixa !== 'Misto') {
            errors.push(`Critério incompatível: Atleta ${p.nome} possui a faixa ${p.faixa} mas está na divisão de faixa ${division.faixa}.`);
          }
          if (bracketSettings.samePeso && p.peso !== division.peso && division.peso !== 'Misto') {
            errors.push(`Critério incompatível: Atleta ${p.nome} possui o peso ${p.peso} mas está na divisão de peso ${division.peso}.`);
          }
          if (bracketSettings.sameCategory && p.categoria !== division.category && division.category !== 'Geral') {
            errors.push(`Critério incompatível: Atleta ${p.nome} possui a categoria de idade ${p.categoria} mas está na divisão ${division.category}.`);
          }
        }
      });
    });

    // 4. Invalid matches (e.g. both slots empty where they shouldn't be if we have players waiting)
    // Handled by our unplaced athletes check.
    
    return errors;
  };

  const handlePublishBracket = () => {
    if (!currentDiv) return;
    const errors = validateDivisionBracket(currentDiv);
    if (errors.length > 0) {
      alert(`Impossível publicar: corrija todas as pendências de validação primeiro.`);
      return;
    }

    const updatedChaves = divisions.map(div => {
      if (div.divisionId !== currentDiv.divisionId) return div;

      const matchesCopy = JSON.parse(JSON.stringify(div.matches)) as Match[];
      propagateWinners(matchesCopy);

      return {
        ...div,
        publicada: true,
        matches: matchesCopy
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  const handleUnpublishBracket = () => {
    if (!currentDiv) return;

    const updatedChaves = divisions.map(div => {
      if (div.divisionId !== currentDiv.divisionId) return div;

      const resetMatches = div.matches.map(m => ({
        ...m,
        winnerId: null,
        winMethod: undefined,
        score: undefined
      }));

      propagateWinners(resetMatches);

      return {
        ...div,
        publicada: false,
        matches: resetMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  // Declare winner modal trigger
  const handleOpenDeclareWinner = (matchId: string) => {
    if (!isAdmin) return;
    const div = currentDiv;
    const match = div.matches.find(m => m.id === matchId);
    if (!match || (!match.player1 && !match.player2)) return;

    setDeclaringWinnerMatchId(matchId);
    setSelectedWinnerId(match.player1?.id || match.player2?.id || '');
    setWinMethod('Pontos');
    setWinScore('');
  };

  const handleConfirmWinner = () => {
    if (!declaringWinnerMatchId) return;
    
    const updatedChaves = divisions.map((div) => {
      if (div.divisionId !== currentDiv.divisionId) return div;
      
      const updatedMatches = div.matches.map((m) => {
        if (m.id !== declaringWinnerMatchId) return m;
        return { 
          ...m, 
          winnerId: selectedWinnerId,
          winMethod: winMethod,
          score: winMethod === 'WO' ? 'W.O.' : winScore || 'Fim de combate'
        };
      });
      
      propagateWinners(updatedMatches);
      
      return {
        ...div,
        matches: updatedMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });

    setDeclaringWinnerMatchId(null);
  };

  const handleCancelMatchResult = (matchId: string) => {
    const updatedChaves = divisions.map((div) => {
      if (div.divisionId !== currentDiv.divisionId) return div;
      
      const updatedMatches = div.matches.map((m) => {
        if (m.id !== matchId) return m;
        return { 
          ...m, 
          winnerId: null,
          winMethod: undefined,
          score: undefined
        };
      });
      
      propagateWinners(updatedMatches);
      
      return {
        ...div,
        matches: updatedMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });

    setDeclaringWinnerMatchId(null);
  };

  // Advance by WO instantly
  const handleWOAdvance = (matchId: string, winnerId: string) => {
    const updatedChaves = divisions.map((div) => {
      if (div.divisionId !== currentDiv.divisionId) return div;
      
      const updatedMatches = div.matches.map((m) => {
        if (m.id !== matchId) return m;
        return { 
          ...m, 
          winnerId,
          winMethod: 'WO' as const,
          score: 'W.O.'
        };
      });
      
      propagateWinners(updatedMatches);
      
      return {
        ...div,
        matches: updatedMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  // Manual Athlete Add
  const handleAddAthleteManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthleteName.trim()) return;

    const newAth: Athlete = {
      id: `ath-manual-${Date.now()}`,
      nome: newAthleteName,
      academia: newAthleteAcademia || 'Avulso',
      faixa: newAthleteFaixa || currentDiv?.faixa || 'Branca',
      peso: newAthletePeso || currentDiv?.peso || 'Médio',
      categoria: newAthleteCategoria || currentDiv?.category || 'Adulto',
      genero: newAthleteGenero,
      modalidade: currentDiv?.modalidade || 'Gi',
      disputa: currentDiv?.disputa || 'Geral'
    };

    let updatedChaves = [...divisions];

    if (currentDiv) {
      // Add to active division
      updatedChaves = divisions.map(div => {
        if (div.divisionId !== currentDiv.divisionId) return div;
        const newAthletes = [...div.athletes, newAth];
        const newMatches = generateDivisionMatches(newAthletes, div.divisionId, Number(bracketSettings.maxChavesSize));
        return {
          ...div,
          athletes: newAthletes,
          matches: newMatches
        };
      });
    } else {
      // Create new division
      const divKey = `${newAth.genero}_${newAth.categoria}_${newAth.faixa}_${newAth.peso}_${newAth.modalidade}_Geral`;
      const divisionId = `${championship.id}-${divKey.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const matches = generateDivisionMatches([newAth], divisionId, Number(bracketSettings.maxChavesSize));
      
      updatedChaves.push({
        divisionId,
        gender: newAth.genero,
        category: newAth.categoria,
        faixa: newAth.faixa,
        peso: newAth.peso,
        modalidade: newAth.modalidade || 'Gi',
        disputa: 'Geral',
        athletes: [newAth],
        matches
      });
    }

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });

    // Reset Form
    setNewAthleteName('');
    setNewAthleteAcademia('');
    setShowManualAdd(false);
  };

  // Remove Athlete from bracket and registrations definitively
  const handleRemoveAthlete = (athleteId: string) => {
    const athlete = currentDiv?.athletes.find(a => a.id === athleteId);
    const athleteName = athlete ? athlete.nome : 'este atleta';

    if (!window.confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE a inscrição de ${athleteName}? Esta ação é irreversível, cancelará a inscrição do atleta no campeonato e o removerá do chaveamento.`)) {
      return;
    }
    
    const updatedChaves = divisions.map(div => {
      const newAthletes = div.athletes.filter(a => a.id !== athleteId);
      const updatedMatches = div.matches.map(m => {
        let p1 = m.player1;
        let p2 = m.player2;
        if (p1 && p1.id === athleteId) p1 = null;
        if (p2 && p2.id === athleteId) p2 = null;
        return { ...m, player1: p1, player2: p2 };
      });
      return {
        ...div,
        athletes: newAthletes,
        matches: updatedMatches
      };
    }).filter(div => div.athletes.length > 0); // remove division if empty

    if (onUpdateInscricoes) {
      const updatedInscricoes = registrations.filter(r => r.id !== athleteId);
      onUpdateInscricoes(updatedInscricoes);
    }

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  // Shuffle / Reface draws randomly
  const handleShuffleDivision = () => {
    if (!currentDiv) return;

    const shuffledAthletes = [...currentDiv.athletes].sort(() => Math.random() - 0.5);
    const regeneratedMatches = generateDivisionMatches(shuffledAthletes, currentDiv.divisionId, Number(bracketSettings.maxChavesSize));

    const updatedChaves = divisions.map(div => {
      if (div.divisionId !== currentDiv.divisionId) return div;
      return {
        ...div,
        athletes: shuffledAthletes,
        matches: regeneratedMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });
  };

  // Swapping / Manually modifying a player in a specific match slot
  const handleManualSwapPlayer = (matchId: string, slot: 1 | 2, athleteId: string) => {
    const updatedChaves = divisions.map(div => {
      if (div.divisionId !== currentDiv.divisionId) return div;
      const selectedAthlete = div.athletes.find(a => a.id === athleteId) || null;
      
      const updatedMatches = div.matches.map(m => {
        if (m.id !== matchId) return m;
        if (slot === 1) {
          return { ...m, player1: selectedAthlete };
        } else {
          return { ...m, player2: selectedAthlete };
        }
      });

      // Recalculate auto WO for matches that became byes after editing
      updatedMatches.forEach(m => {
        if (m.player1 && !m.player2) {
          m.winnerId = m.player1.id;
          m.winMethod = 'WO';
          m.score = 'W.O.';
        } else if (!m.player1 && m.player2) {
          m.winnerId = m.player2.id;
          m.winMethod = 'WO';
          m.score = 'W.O.';
        } else if (m.player1 && m.player2 && m.winMethod === 'WO') {
          // Reset WO if we added an opponent
          m.winnerId = null;
          m.winMethod = undefined;
          m.score = undefined;
        }
      });

      propagateWinners(updatedMatches);

      return {
        ...div,
        matches: updatedMatches
      };
    });

    onUpdateChampionship({
      ...championship,
      chaves: updatedChaves
    });

    setSwappingMatchId(null);
    setSwappingSlot(null);
  };

  // Export Bracket as a high-fidelity printable layout
  const handleExportPDF = (withAthletes: boolean) => {
    const getAthleteHTML = (player: Athlete | null, isWinner: boolean) => {
      if (!withAthletes) {
        return `
          <div class="athlete-slot">
            <span class="athlete-name">________________________</span>
            <div class="athlete-academy">Academia: ________________</div>
          </div>
        `;
      }
      if (!player) {
        return `
          <div class="athlete-slot">
            <span class="athlete-name" style="color: #9ca3af; font-style: italic;">Aguardando adversário</span>
          </div>
        `;
      }
      return `
        <div class="athlete-slot ${isWinner ? 'winner' : ''}">
          <span class="athlete-name">${player.nome}</span>
          <div class="athlete-academy">🛡️ ${player.academia}</div>
        </div>
      `;
    };

    const cols = currentDiv 
      ? getActiveBracketColumns(currentDiv) 
      : getSkeletonBracketColumns(skeletonSize);

    let columnsHTML = '';
    cols.forEach((col) => {
      let matchesHTML = '';
      col.matches.forEach((m) => {
        // If skeleton items, handle placeholders gracefully
        if (m.id.startsWith('mock-')) {
          const matchGlobalIdx = m.index;
          matchesHTML += `
            <div class="match-box" style="opacity: 0.6; border-style: dashed;">
              <div class="match-number">
                <span>Combate Provisório</span>
                <span>Aguardando</span>
              </div>
              <div class="athlete-slot">
                <span class="athlete-name" style="color: #9ca3af; font-style: italic;">Competidor # ${(matchGlobalIdx * 2) + 1}</span>
              </div>
              <div class="vs-divider">VS</div>
              <div class="athlete-slot">
                <span class="athlete-name" style="color: #9ca3af; font-style: italic;">Competidor # ${(matchGlobalIdx * 2) + 2}</span>
              </div>
            </div>
          `;
          return;
        }

        const isP1Winner = m.winnerId !== null && m.winnerId === m.player1?.id;
        const isP2Winner = m.winnerId !== null && m.winnerId === m.player2?.id;

        const p1HTML = getAthleteHTML(m.player1, isP1Winner);
        const p2HTML = getAthleteHTML(m.player2, isP2Winner);

        const resultHTML = m.winnerId
          ? `<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 3px; font-size: 8px; text-align: center; margin-top: 4px; color: #15803d; font-weight: 700;">
               Vencedor por ${m.winMethod} ${m.score ? `(${m.score})` : ''}
             </div>`
          : '';

        matchesHTML += `
          <div class="match-box">
            <div class="match-number">
              <span>Luta #${m.id.split('-').pop()}</span>
              <span>${m.winnerId ? 'Finalizado' : 'Pendente'}</span>
            </div>
            ${p1HTML}
            <div class="vs-divider">VS</div>
            ${p2HTML}
            ${resultHTML}
          </div>
        `;
      });

      // Append champion podium for center column if match is final
      if (col.name === 'Final') {
        const finalMatch = currentDiv?.matches.find(m => m.round === 'Final');
        if (finalMatch && finalMatch.winnerId) {
          const champion = finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player1 : finalMatch.player2;
          if (champion) {
            matchesHTML += `
              <div style="margin-top: 20px; border-top: 1.5px dashed #d1d5db; padding-top: 15px; text-align: center;">
                <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <div style="font-size: 20px; margin-bottom: 5px;">🏆</div>
                  <span style="font-size: 8px; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; color: #047857; display: block; margin-bottom: 2px;">Campeão Absoluto</span>
                  <strong style="font-size: 13px; color: #065f46; display: block;">${champion.nome}</strong>
                  <span style="font-size: 10px; color: #047857; font-weight: 600; display: block; margin-top: 2px;">🛡️ ${champion.academia}</span>
                </div>
              </div>
            `;
          }
        } else {
          matchesHTML += `
            <div style="margin-top: 20px; border-top: 1.5px dashed #d1d5db; padding-top: 15px; text-align: center;">
              <div style="background-color: #f9fafb; border: 1.5px dashed #d1d5db; border-radius: 12px; padding: 15px; color: #9ca3af; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                🏆 Aguardando Final
              </div>
            </div>
          `;
        }
      }

      columnsHTML += `
        <div class="round-column">
          <div class="round-header">${col.name} ${col.side ? `(${col.side === 'left' ? 'Esq.' : 'Dir.'})` : ''}</div>
          ${matchesHTML}
        </div>
      `;
    });

    const divisionName = currentDiv
      ? `${currentDiv.gender}-${currentDiv.faixa}-${currentDiv.category}-${currentDiv.peso}`.replace(/\s+/g, '_')
      : `esqueleto_${skeletonSize}_competidores`;

    const getPesoLimite = (pesoStr: string) => {
      if (!pesoStr) return 'Livre';
      const match = pesoStr.match(/\(([^)]+)\)/);
      return match ? match[1] : 'Livre';
    };

    const currentTheme = localStorage.getItem('arena_theme_key') || localStorage.getItem('themeKey') || 'emerald';
    const savedLogo = localStorage.getItem('arena_logo');
    const logoSrc = (savedLogo && (savedLogo.startsWith('data:image/') || savedLogo.startsWith('http://') || savedLogo.startsWith('https://')))
      ? savedLogo
      : (currentTheme === 'white' ? '/ARENADOCOMPETIDOR.png' : '/Logo%20branca.png');

    const modalidadeVal = currentDiv?.modalidade || (championship.modalidades && championship.modalidades[0]) || 'Gi';
    const disputaVal = currentDiv?.disputa || championship.disputa || 'Geral';
    const categoriaVal = currentDiv?.category || 'Esqueleto Técnico';
    const faixaVal = currentDiv?.faixa || 'Geral';
    const pesoVal = currentDiv?.peso || 'Todos os Pesos';
    const pesoLimiteVal = currentDiv ? getPesoLimite(currentDiv.peso) : 'Livre';
    const atletasInscritosVal = currentDiv?.athletes?.length || 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Chaveamento - ${categoriaVal} (${pesoVal})</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;750;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #ffffff;
      color: #111111;
      margin: 0;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #111;
      padding-bottom: 20px;
      position: relative;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .logo-img {
      height: 60px;
      max-width: 250px;
      object-fit: contain;
    }
    .header h1 {
      font-size: 24px;
      margin: 0 0 5px 0;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .header h2 {
      font-size: 15px;
      color: #4b5563;
      margin: 0 0 15px 0;
      font-weight: 600;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-cols: repeat(4, 1fr);
      gap: 12px 15px;
      font-size: 10px;
      background-color: #f8fafc;
      padding: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-weight: 700;
      text-transform: uppercase;
      text-align: left;
      margin-bottom: 25px;
    }
    .info-item span {
      display: block;
      color: #6b7280;
      font-size: 9px;
      margin-bottom: 2px;
    }
    .info-item strong {
      color: #111827;
    }
    .bracket-container {
      display: flex;
      flex-direction: row;
      gap: 30px;
      justify-content: space-between;
      align-items: stretch;
      margin-top: 30px;
      min-height: 500px;
    }
    .round-column {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      flex: 1;
      min-width: 180px;
    }
    .round-header {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      text-align: center;
      letter-spacing: 1px;
      color: #374151;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .match-box {
      background-color: #ffffff;
      border: 1.5px solid #111111;
      border-radius: 8px;
      padding: 10px;
      font-size: 11px;
      margin: 10px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      text-align: left;
    }
    .match-number {
      font-weight: 900;
      font-size: 9px;
      text-transform: uppercase;
      color: #f97316;
      margin-bottom: 6px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 3px;
      display: flex;
      justify-content: space-between;
    }
    .athlete-slot {
      padding: 5px 8px;
      border-radius: 6px;
      background-color: #f9fafb;
      margin-bottom: 4px;
      border: 1px solid #e5e7eb;
    }
    .athlete-slot.winner {
      background-color: #ecfdf5;
      border-color: #a7f3d0;
    }
    .athlete-slot.winner .athlete-name {
      color: #065f46;
      font-weight: 900;
    }
    .athlete-name {
      font-weight: 700;
      color: #111827;
      display: block;
    }
    .athlete-academy {
      font-size: 9px;
      color: #6b7280;
      margin-top: 1px;
    }
    .vs-divider {
      font-size: 8px;
      font-weight: 800;
      color: #9ca3af;
      text-align: center;
      margin: 2px 0;
    }
    .no-print-btn {
      background-color: #f97316;
      color: white;
      border: none;
      padding: 8px 16px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      text-transform: uppercase;
    }
    .no-print-btn:hover {
      background-color: #ea580c;
    }
    @media print {
      @page {
        size: landscape;
        margin: 10mm;
      }
      body {
        padding: 0;
        background-color: white;
      }
      .match-box {
        page-break-inside: avoid;
      }
      .no-print-btn {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <img src="${logoSrc}" class="logo-img" alt="Arena do Competidor / ACBJJ Pro" />
      <button class="no-print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
    </div>
    <h1>${championship.title || championship.nome || 'Campeonato'}</h1>
    <h2>Chaveamento Oficial do Torneio</h2>
    
    <div class="info-grid">
      <div class="info-item">
        <span>Campeonato</span>
        <strong>${championship.title || championship.nome || 'Campeonato'}</strong>
      </div>
      <div class="info-item">
        <span>Modalidade</span>
        <strong>${modalidadeVal}</strong>
      </div>
      <div class="info-item">
        <span>Tipo de Disputa</span>
        <strong>${disputaVal}</strong>
      </div>
      <div class="info-item">
        <span>Categoria</span>
        <strong>${categoriaVal}</strong>
      </div>
      <div class="info-item">
        <span>Faixa</span>
        <strong>${faixaVal}</strong>
      </div>
      <div class="info-item">
        <span>Peso</span>
        <strong>${pesoVal}</strong>
      </div>
      <div class="info-item">
        <span>Peso Limite</span>
        <strong>${pesoLimiteVal}</strong>
      </div>
      <div class="info-item">
        <span>Data do Campeonato</span>
        <strong>${championship.date || championship.data || 'N/A'}</strong>
      </div>
      <div class="info-item">
        <span>Horário</span>
        <strong>${championship.horario || 'N/A'}</strong>
      </div>
      <div class="info-item">
        <span>Local</span>
        <strong>${championship.location || championship.local || 'N/A'}</strong>
      </div>
      <div class="info-item">
        <span>Cidade</span>
        <strong>${championship.city || championship.cidade || 'N/A'}</strong>
      </div>
      <div class="info-item">
        <span>Atletas Inscritos</span>
        <strong>${atletasInscritosVal} Atleta(s)</strong>
      </div>
    </div>
  </div>

  <div class="bracket-container">
    ${columnsHTML}
  </div>
</body>
</html>
    `;

    const element = document.createElement('a');
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `chaveamento_${divisionName}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Symmetrical Bracket Columns structure and generator helpers
  interface BracketColumn {
    key: string;
    name: string;
    side?: 'left' | 'right';
    matches: any[];
  }

  const getActiveBracketColumns = (division: DivisionBracket): BracketColumn[] => {
    // 1. Group and count matches per round
    const roundGroups: Record<string, Match[]> = {};
    division.matches.forEach(m => {
      if (!roundGroups[m.round]) {
        roundGroups[m.round] = [];
      }
      roundGroups[m.round].push(m);
    });

    // Sort matches within each round group by their ID to ensure stable ordering
    Object.keys(roundGroups).forEach(rName => {
      roundGroups[rName].sort((a, b) => a.id.localeCompare(b.id));
    });

    // 2. Identify and sort rounds by size (descending)
    const sortedRounds = Object.entries(roundGroups)
      .map(([name, matches]) => ({ name, matches, count: matches.length }))
      .sort((a, b) => b.count - a.count);

    if (sortedRounds.length === 0) return [];

    // Find the Final round (count === 1)
    const finalRound = sortedRounds.find(r => r.count === 1);
    const precedingRounds = sortedRounds.filter(r => r.count > 1);

    const leftCols: BracketColumn[] = [];
    const rightCols: BracketColumn[] = [];

    precedingRounds.forEach(r => {
      const halfSize = Math.floor(r.count / 2);
      leftCols.push({
        key: `${r.name}-left`,
        name: r.name,
        side: 'left',
        matches: r.matches.slice(0, halfSize)
      });
      rightCols.push({
        key: `${r.name}-right`,
        name: r.name,
        side: 'right',
        matches: r.matches.slice(halfSize)
      });
    });

    // Right cols are in reverse order of left cols (from smallest to largest)
    const reversedRightCols = [...rightCols].reverse();

    const cols: BracketColumn[] = [];
    cols.push(...leftCols);
    if (finalRound) {
      cols.push({
        key: `${finalRound.name}-center`,
        name: finalRound.name,
        matches: finalRound.matches
      });
    }
    cols.push(...reversedRightCols);

    return cols;
  };

  const getSkeletonBracketColumns = (size: number): BracketColumn[] => {
    // Generate the rounds from largest to smallest (ending at Final with count = 1)
    const rounds: { name: string; count: number }[] = [];
    let current = size;
    while (current >= 2) {
      const matchCount = current / 2;
      let rName = '';
      if (matchCount === 1) rName = 'Final';
      else if (matchCount === 2) rName = 'Semifinal';
      else if (matchCount === 4) rName = 'Quartas de Final';
      else if (matchCount === 8) rName = 'Oitavas de Final';
      else if (matchCount === 16) rName = 'Dezesseis Avos de Final';
      else if (matchCount === 32) rName = 'Trinta e Dois Avos de Final';
      else rName = `${matchCount} Avos`;

      rounds.push({
        name: rName,
        count: matchCount
      });
      current /= 2;
    }

    if (rounds.length === 0) return [];

    const finalRound = rounds.find(r => r.count === 1);
    const precedingRounds = rounds.filter(r => r.count > 1);

    const leftCols: BracketColumn[] = [];
    const rightCols: BracketColumn[] = [];

    precedingRounds.forEach(r => {
      const halfSize = Math.floor(r.count / 2);
      
      const leftMatches = Array.from({ length: halfSize }).map((_, mIndex) => ({
        id: `mock-left-${r.name}-${mIndex}`,
        index: mIndex
      }));

      const rightMatches = Array.from({ length: halfSize }).map((_, mIndex) => ({
        id: `mock-right-${r.name}-${mIndex}`,
        index: mIndex + halfSize
      }));

      leftCols.push({
        key: `${r.name}-left`,
        name: r.name,
        side: 'left',
        matches: leftMatches
      });

      rightCols.push({
        key: `${r.name}-right`,
        name: r.name,
        side: 'right',
        matches: rightMatches
      });
    });

    const reversedRightCols = [...rightCols].reverse();

    const cols: BracketColumn[] = [];
    cols.push(...leftCols);
    if (finalRound) {
      cols.push({
        key: `${finalRound.name}-center`,
        name: finalRound.name,
        matches: [{ id: `mock-center-${finalRound.name}-0`, index: 0 }]
      });
    }
    cols.push(...reversedRightCols);

    return cols;
  };

  // SKELETON TREE GENERATOR for Empty State
  const renderSkeletonTree = (size: number) => {
    const cols = getSkeletonBracketColumns(size);

    return (
      <div 
        className="grid gap-4 items-stretch pt-6 overflow-x-auto pb-4"
        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(190px, 1fr))` }}
      >
        {cols.map((col) => {
          const isCenter = col.name === 'Final';
          return (
            <div key={col.key} className="space-y-4 min-w-[190px] flex flex-col justify-around bg-neutral-900/10 p-2.5 rounded-2xl border border-neutral-900/40">
              <span className="text-[9px] uppercase font-black tracking-widest text-neutral-500 block text-center border-b border-neutral-900 pb-1.5">
                {col.name} {col.side ? `(${col.side === 'left' ? 'Esq.' : 'Dir.'})` : ''}
              </span>
              {col.matches.map((m) => {
                const matchGlobalIdx = m.index;
                return (
                  <div key={m.id} className="bg-neutral-900/40 border border-neutral-850/60 rounded-xl p-2.5 opacity-50 space-y-1.5 border-dashed">
                    <div className="bg-[#111] py-1 px-2 rounded text-[8px] text-neutral-600 font-bold uppercase flex justify-between">
                      <span>Combate Provisório</span>
                      <span>Aguardando Geração</span>
                    </div>
                    <div className="p-1.5 rounded-lg border border-neutral-850 bg-neutral-950/20 text-left">
                      <span className="text-neutral-600 text-[10px] font-black italic block">Competidor #{(matchGlobalIdx * 2) + 1}</span>
                    </div>
                    <div className="text-[8px] text-neutral-700 text-center font-black select-none">VS</div>
                    <div className="p-1.5 rounded-lg border border-neutral-850 bg-neutral-950/20 text-left">
                      <span className="text-neutral-600 text-[10px] font-black italic block">Competidor #{(matchGlobalIdx * 2) + 2}</span>
                    </div>
                  </div>
                );
              })}

              {/* Final podium placeholder for skeleton */}
              {isCenter && (
                <div className="mt-4 border-t border-neutral-900/40 pt-4">
                  <div className="bg-neutral-900/30 border border-neutral-850/50 rounded-2xl p-4 text-center text-neutral-600 py-6 border-dashed">
                    <Trophy className="w-6 h-6 text-neutral-700 mx-auto mb-1" />
                    <span className="text-[9px] uppercase font-bold tracking-wider block">Pódio de Ouro</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Group confirmedRegs based on localSettings for preview when divisions.length === 0
  const groupedCompetitors: { [key: string]: typeof confirmedRegs } = {};
  confirmedRegs.forEach((reg) => {
    const faixaPart = localSettings.sameFaixa ? reg.faixa : 'Misto';
    const pesoPart = localSettings.samePeso ? reg.peso : 'Misto';
    const catPart = localSettings.sameCategory ? reg.categoria : 'Geral';
    const modPart = localSettings.sameModalidade ? (reg.modalidade || 'Gi') : 'Misto';
    const genderPart = reg.genero || 'Masculino';
    
    const key = `${genderPart} • ${catPart} • ${faixaPart} • ${pesoPart} • ${modPart}`;
    if (!groupedCompetitors[key]) {
      groupedCompetitors[key] = [];
    }
    groupedCompetitors[key].push(reg);
  });

  return (
    <div className="space-y-6">
      {/* Admin Action Control & Setup Panel */}
      {isAdmin && (
        <div className="bg-[#141414] border border-neutral-850 p-5 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-orange-500" />
                Painel Administrativo de Chaveamento
              </h4>
              <p className="text-[10px] text-neutral-400">
                {divisions.length > 0
                  ? 'Estruturas geradas com sucesso. Configure os parâmetros ou faça ajustes finos nas lutas.'
                  : 'Nenhuma chave de lutas gerada ainda. Defina os critérios avançados abaixo e clique em Gerar.'}
              </p>
            </div>
            
            <div className="flex gap-2.5 w-full sm:w-auto flex-wrap">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`border font-extrabold text-[11px] uppercase py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  showSettings 
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                    : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Critérios & Regras
              </button>

              <button
                onClick={() => handleExportPDF(true)}
                className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white font-extrabold text-[11px] uppercase py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Baixar a estrutura do torneio selecionado em PDF"
              >
                <Download className="w-3.5 h-3.5 text-orange-500" />
                Baixar Estrutura do Torneio (PDF)
              </button>

              {divisions.length > 0 ? (
                <button
                  onClick={handleResetBrackets}
                  className="bg-neutral-900 hover:bg-[#1a1a1a] border border-neutral-800 text-neutral-300 hover:text-white font-extrabold text-[11px] uppercase py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
                  Recriar Chaves
                </button>
              ) : (
                <button
                  onClick={handleGenerateBrackets}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-500/15"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Gerar Chaves Automáticas ({confirmedRegs.length} atletas)
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Rules Settings Panel */}
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-neutral-900 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left"
            >
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Tamanho Máximo da Chave</label>
                <select
                  value={localSettings.maxChavesSize}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxChavesSize: Number(e.target.value) })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2 px-3 outline-none cursor-pointer"
                >
                  <option value="2">Final (2 competidores)</option>
                  <option value="4">Semifinal (4 competidores)</option>
                  <option value="8">Quartas de Final (8 competidores)</option>
                  <option value="16">Oitavas de Final (16 competidores)</option>
                  <option value="32">Dezesseis avos (32 competidores)</option>
                  <option value="64">Trinta e dois avos (64 competidores)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Agrupamento por Faixa</label>
                <select
                  value={localSettings.sameFaixa ? 'true' : 'false'}
                  onChange={(e) => setLocalSettings({ ...localSettings, sameFaixa: e.target.value === 'true' })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2 px-3 outline-none cursor-pointer"
                >
                  <option value="true">Somente atletas da mesma faixa</option>
                  <option value="false">Permitir cruzamento de faixas (Misto)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Agrupamento por Peso</label>
                <select
                  value={localSettings.samePeso ? 'true' : 'false'}
                  onChange={(e) => setLocalSettings({ ...localSettings, samePeso: e.target.value === 'true' })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2 px-3 outline-none cursor-pointer"
                >
                  <option value="true">Somente atletas do mesmo peso</option>
                  <option value="false">Permitir cruzamento de pesos (Misto)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Agrupamento de Idade</label>
                <select
                  value={localSettings.sameCategory ? 'true' : 'false'}
                  onChange={(e) => setLocalSettings({ ...localSettings, sameCategory: e.target.value === 'true' })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2 px-3 outline-none cursor-pointer"
                >
                  <option value="true">Mesma Categoria de Idade</option>
                  <option value="false">Cruzar Categorias de Idade (Geral)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Mesma Modalidade</label>
                <select
                  value={localSettings.sameModalidade ? 'true' : 'false'}
                  onChange={(e) => setLocalSettings({ ...localSettings, sameModalidade: e.target.value === 'true' })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2 px-3 outline-none cursor-pointer"
                >
                  <option value="true">Separar Gi / No-Gi</option>
                  <option value="false">Cruzar Modalidades</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 justify-end pb-1.5 md:col-span-2 lg:col-span-1">
                <button
                  onClick={() => handleGenerateBrackets(localSettings)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/15"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Confirmar Critérios
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* RENDER EMPTY STATE SKELETON OR SETUP WIZARD */}
      {divisions.length === 0 ? (
        <div className="space-y-6">
          {isAdmin ? (
            <div className="bg-[#141414] border border-neutral-850 p-6 rounded-3xl text-left space-y-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-yellow-600/10 border border-yellow-500/20 text-yellow-500 rounded-lg py-1 px-2.5 text-[9px] font-black uppercase flex items-center gap-1 tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                Aguardando Confirmação
              </div>

              <div>
                <span className="text-[10px] text-orange-500 uppercase font-black tracking-widest block">
                  📋 Lista de Competidores Aptos ao Chaveamento
                </span>
                <h4 className="text-white font-extrabold uppercase text-lg tracking-wide mt-1">Competidores Selecionados pelos Critérios</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                  Abaixo estão exibidos os atletas agrupados em conformidade com as regras de chaveamento definidas no painel superior (faixa, peso, idade, modalidade).
                  Clique em <strong className="text-orange-500">Confirmar Critérios</strong> ou <strong className="text-orange-500">Gerar Chaves Automáticas</strong> acima para finalizar a estrutura competitiva e liberar a montagem por arrastar e soltar (drag & drop).
                </p>
              </div>

              {/* Listed Groups of compatible competitors */}
              <div className="space-y-4 border-t border-neutral-900 pt-5">
                {confirmedRegs.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs">
                    Nenhum competidor com pagamento confirmado neste campeonato ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(groupedCompetitors).map(([groupKey, list]) => (
                      <div key={groupKey} className="bg-[#1a1a1a]/40 border border-neutral-850 p-4 rounded-2xl space-y-2.5">
                        <span className="text-[9px] uppercase font-black tracking-wider text-orange-400 block border-b border-neutral-900 pb-1.5 truncate">
                          {groupKey}
                        </span>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {list.map((ath) => (
                            <div key={ath.id} className="bg-[#1c1c1c] border border-neutral-900/60 p-2 rounded-xl flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <strong className="text-white text-[11px] block truncate font-extrabold">{ath.nome}</strong>
                                <span className="text-[9px] text-neutral-500 block truncate">{ath.academia} • {ath.faixa}</span>
                              </div>
                              <span className="text-[9px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded uppercase font-black">
                                {ath.peso}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-neutral-500 text-right">
                          Total: <strong className="text-white">{list.length}</strong> competidor(es)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#141414] border border-neutral-850 p-6 rounded-3xl text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-red-600/10 border border-red-500/20 text-red-500 rounded-lg py-1 px-2.5 text-[9px] font-black uppercase flex items-center gap-1 tracking-wider animate-pulse">
                <AlertCircle className="w-3 h-3" />
                Inscrições em Andamento
              </div>

              <Trophy className="w-12 h-12 text-neutral-700 mx-auto animate-bounce" />
              <h4 className="text-white font-extrabold uppercase text-sm tracking-widest">Esqueleto de Chaveamento Oficial</h4>
              <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
                O chaveamento oficial definitivo será liberado logo após o encerramento e confirmação de todas as inscrições. 
                Visualize abaixo a estrutura de árvore competitiva projetada para este torneio.
              </p>

              <div className="flex items-center justify-center gap-3 max-w-xs mx-auto border-t border-neutral-900 pt-3">
                <label className="text-[9px] uppercase font-black text-neutral-500 tracking-wider">Visualizar tamanho:</label>
                <select
                  value={skeletonSize}
                  onChange={(e) => setSkeletonSize(Number(e.target.value))}
                  className="bg-[#1c1c1c] text-white text-[11px] border border-neutral-800 rounded-lg py-1 px-2.5 outline-none cursor-pointer"
                >
                  <option value="2">Final (2 atletas)</option>
                  <option value="4">Semifinal (4 atletas)</option>
                  <option value="8">Quartas (8 atletas)</option>
                  <option value="16">Oitavas (16 atletas)</option>
                  <option value="32">32 Avos (32 atletas)</option>
                </select>
              </div>
            </div>
          )}

          {/* Render the selected skeleton size bracket tree */}
          <div className="bg-[#141414] border border-neutral-850 p-3 sm:p-6 rounded-2xl sm:rounded-3xl overflow-hidden">
            <span className="text-[10px] text-neutral-500 uppercase font-black block tracking-widest text-left">
              🌳 Estrutura Simulada • Chave de {skeletonSize} Competidores
            </span>
            {renderSkeletonTree(skeletonSize)}
          </div>
        </div>
      ) : (
        /* ACTIVE DIVISION BRACKET TREE */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Active Divisions selector and athletes list */}
          {isAdmin && (
            <div className="md:col-span-1 space-y-4 text-left">
            
            {/* List divisions */}
            <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-4 space-y-3">
              <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block border-b border-neutral-900 pb-2 flex justify-between items-center">
                <span>🥋 Divisões ({divisions.length})</span>
                {/* "Adicionar Luta" removed per request */}
              </span>

              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {divisions.map((div) => {
                  const isSelected = (selectedDivisionId === div.divisionId) || (!selectedDivisionId && div.divisionId === divisions[0].divisionId);
                  return (
                    <button
                      key={div.divisionId}
                      onClick={() => setSelectedDivisionId(div.divisionId)}
                      className={`w-full text-left p-2.5 rounded-xl transition text-[11px] font-bold border block ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500/30 text-white'
                          : 'bg-[#1c1c1c] border-neutral-900 hover:border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-black tracking-wider text-orange-500 block truncate">
                        {div.gender} • {div.faixa}
                      </span>
                      <span className="block text-white mt-0.5 truncate">{div.category}</span>
                      <span className="text-[10px] text-neutral-500 block mt-0.5 truncate">{div.peso} • {div.athletes.length} atleta(s)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Athletes in current division */}
            {currentDiv && (
              <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-4 space-y-3">
                <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block border-b border-neutral-900 pb-2 flex justify-between items-center">
                  <span>🏃 Competidores Selecionados pelos Critérios ({currentDiv.athletes.length})</span>
                  {isAdmin && (
                    <button
                      onClick={handleShuffleDivision}
                      title="Embaralhar atletas e re-sortear chaves"
                      className="text-neutral-400 hover:text-white transition cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>

                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {currentDiv.athletes.map((ath) => {
                    const isPlaced = currentDiv.matches.some(m => m.player1?.id === ath.id || m.player2?.id === ath.id);
                    return (
                      <div 
                        key={ath.id} 
                        draggable={isAdmin && !currentDiv.publicada}
                        onDragStart={(e) => {
                          if (isAdmin && !currentDiv.publicada) {
                            e.dataTransfer.setData('text/plain', ath.id);
                          }
                        }}
                        className={`bg-[#1c1c1c] border border-neutral-900 p-2 rounded-xl flex items-center justify-between gap-2 ${
                          isAdmin && !currentDiv.publicada ? 'cursor-grab active:cursor-grabbing hover:border-orange-500/40' : ''
                        } ${isPlaced ? 'opacity-60' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white text-[11px] block truncate font-extrabold">{ath.nome}</strong>
                            {isPlaced && (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1 rounded-sm uppercase font-black">
                                Alocado
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-neutral-500 block truncate">{ath.academia} • {ath.faixa}</span>
                        </div>
                        {/* Trash2 button removed per request */}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          {/* ACTIVE BRACKET VISUAL TREE */}
          <div className={`${isAdmin ? 'md:col-span-3' : 'md:col-span-4'} bg-[#141414] border border-neutral-850 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-6 text-left overflow-hidden`}>
            {currentDiv ? (
              <>
                <div className="border-b border-neutral-900 pb-4 space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-orange-500 uppercase font-black tracking-widest block">
                          🥋 Chave Oficial • {currentDiv.modalidade || 'Gi'}
                        </span>
                        {currentDiv.publicada ? (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase py-0.5 px-2 rounded-full flex items-center gap-1">
                            ● Publicada
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase py-0.5 px-2 rounded-full flex items-center gap-1 animate-pulse">
                            ● Rascunho (Não Publicada)
                          </span>
                        )}
                      </div>

                      {!isAdmin && (
                        <div className="mt-3 bg-[#1c1c1c]/50 border border-neutral-850 p-4 rounded-2xl max-w-xl">
                          <label className="text-[10px] uppercase font-black text-neutral-400 tracking-wider block mb-1.5">🥋 Selecione a Categoria / Divisão</label>
                          <select
                            value={selectedDivisionId || (divisions[0]?.divisionId || '')}
                            onChange={(e) => setSelectedDivisionId(e.target.value)}
                            className="bg-neutral-950 text-white text-xs border border-neutral-800 focus:border-orange-500 rounded-xl py-2.5 px-3.5 outline-none cursor-pointer w-full"
                          >
                            {divisions.map((div) => (
                              <option key={div.divisionId} value={div.divisionId}>
                                {div.gender} • {div.faixa} • {div.category} ({div.peso}) • {div.athletes.length} Atleta(s)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <h3 className="text-base font-black text-white uppercase tracking-wide mt-1">
                        {currentDiv.gender} - {currentDiv.faixa} - {currentDiv.category} ({currentDiv.peso})
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {currentDiv.publicada 
                          ? 'Torneio publicado e em progresso. Toque nos confrontos para registrar os resultados de combate.' 
                          : 'Arraste os atletas nas vagas vazias do chaveamento para estruturar as lutas iniciais.'}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleExportPDF(true)}
                          className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white font-extrabold text-[10px] uppercase py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5 text-orange-500" />
                          Exportar PDF Com Atletas
                        </button>
                        <button
                          onClick={() => handleExportPDF(false)}
                          className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white font-extrabold text-[10px] uppercase py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CircleDot className="w-3.5 h-3.5 text-neutral-500" />
                          Exportar PDF Sem Atletas
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ADMIN BRACKET CONTROLS & STATUS (DRAFT VS PUBLISHED) */}
                  {isAdmin && (
                    <div className="bg-[#1c1c1c]/50 border border-neutral-850/60 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2.5">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-orange-500" />
                          <span className="text-[10px] uppercase font-black tracking-wider text-neutral-300">
                            Status do Pareamento: {currentDiv.publicada ? 'Liberado para Lutas' : 'Ajuste de Grade'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!currentDiv.publicada ? (
                            <>
                              <button
                                onClick={handleQuickShuffle}
                                className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Distribuir todos os atletas pendentes de forma aleatória nas vagas"
                              >
                                <Shuffle className="w-3 h-3 text-orange-500" />
                                Sorteio Rápido
                              </button>
                              <button
                                onClick={handlePublishBracket}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center gap-1 shadow shadow-emerald-600/25"
                              >
                                <Check className="w-3 h-3" />
                                Publicar Chaveamento Oficial
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleUnpublishBracket}
                              className="bg-red-950/40 hover:bg-red-950/60 border border-red-900/30 text-red-400 font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Desfazer Publicação
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Warnings and validation results */}
                      {!currentDiv.publicada && (
                        <div className="border-t border-neutral-900 pt-2.5">
                          {(() => {
                            const errs = validateDivisionBracket(currentDiv);
                            if (errs.length === 0) {
                              return (
                                <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 py-1.5 px-3 rounded-xl flex items-center gap-1.5">
                                  <span>✓</span>
                                  <span>Todos os atletas foram devidamente alocados nas vagas. Pronto para publicar o chaveamento definitivo!</span>
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider block">
                                  ⚠️ Pendências de Alocação ({errs.length}):
                                </span>
                                <ul className="list-disc pl-4 space-y-1 text-[9px] text-neutral-400">
                                  {errs.map((e, idx) => (
                                    <li key={idx}>{e}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tree grid column */}
                <div 
                  className="grid gap-4 items-stretch pt-2 overflow-x-auto pb-4"
                  style={{ gridTemplateColumns: `repeat(${getActiveBracketColumns(currentDiv).length}, minmax(190px, 1fr))` }}
                >
                  {getActiveBracketColumns(currentDiv).map((col) => {
                    const isCenter = col.name === 'Final';
                    return (
                      <div key={col.key} className="space-y-4 min-w-[190px] flex flex-col justify-around bg-neutral-950/20 p-2.5 rounded-2xl border border-neutral-900/50">
                        <span className="text-[9px] uppercase font-black tracking-widest text-neutral-500 block text-center border-b border-neutral-900/60 pb-1.5">
                          {col.name} {col.side ? `(${col.side === 'left' ? 'Esq.' : 'Dir.'})` : ''}
                        </span>
                        
                        {col.matches.map((m) => (
                          <div key={m.id} className="relative group">
                            
                            {/* Visual tree connectors (pure aesthetics) */}
                            <div className="bg-[#1c1c1c] border border-neutral-850 rounded-xl overflow-hidden shadow-sm hover:border-neutral-700 transition duration-150 p-2 space-y-1.5 text-left">
                              <div className="bg-[#161616] py-1 px-1.5 rounded text-[8px] text-neutral-400 font-extrabold uppercase flex justify-between">
                                <span>Luta #{m.id.split('-').pop()}</span>
                                <span className={m.winnerId ? 'text-emerald-500' : 'text-orange-500 font-black'}>
                                  {m.winnerId ? 'Finalizado' : 'Pendente'}
                                </span>
                              </div>

                              {/* Slot 1 athlete */}
                              <div 
                                onDragOver={(e) => {
                                  if (isAdmin && !currentDiv.publicada) {
                                    e.preventDefault();
                                  }
                                }}
                                onDrop={(e) => {
                                  if (isAdmin && !currentDiv.publicada) {
                                    e.preventDefault();
                                    const athId = e.dataTransfer.getData('text/plain');
                                    if (athId) handlePlaceAthlete(m.id, 1, athId);
                                  }
                                }}
                                draggable={isAdmin && !currentDiv.publicada && !!m.player1}
                                onDragStart={(e) => {
                                  if (isAdmin && !currentDiv.publicada && m.player1) {
                                    e.dataTransfer.setData('text/plain', m.player1.id);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 transition relative ${
                                  m.winnerId && m.winnerId === m.player1?.id
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : m.winnerId
                                    ? 'bg-neutral-950/20 border-neutral-950 opacity-40'
                                    : !m.player1 && isAdmin && !currentDiv.publicada
                                    ? 'border-dashed border-neutral-800 bg-neutral-950/40 hover:border-orange-500/40 hover:bg-orange-500/5 cursor-pointer'
                                    : 'bg-neutral-950 border-neutral-900'
                                }`}
                                title={isAdmin && !currentDiv.publicada && !m.player1 ? "Arraste um atleta aqui para posicioná-lo" : undefined}
                              >
                                <div className="min-w-0 flex-1">
                                  {m.player1 ? (
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="truncate min-w-0 flex-1">
                                        <strong className="text-white text-[10px] block truncate font-extrabold">
                                          {m.player1.nome}
                                        </strong>
                                        <span className="text-[8px] text-neutral-400 block truncate">
                                          🛡️ {m.player1.academia}
                                        </span>
                                      </div>
                                      {isAdmin && !currentDiv.publicada && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearSlot(m.id, 1);
                                          }}
                                          className="text-neutral-500 hover:text-red-500 p-0.5 shrink-0"
                                          title="Remover atleta da vaga"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <span className="text-neutral-600 text-[9px] font-extrabold italic block">VAGO</span>
                                      {isAdmin && !currentDiv.publicada && (
                                        <select
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              handlePlaceAthlete(m.id, 1, e.target.value);
                                            }
                                          }}
                                          className="bg-neutral-900 text-[8px] text-neutral-400 border border-neutral-800 rounded px-1 outline-none max-w-[80px]"
                                        >
                                          <option value="">Alocar...</option>
                                          {currentDiv.athletes
                                            .filter(a => !currentDiv.matches.some(match => match.player1?.id === a.id || match.player2?.id === a.id))
                                            .map(a => (
                                              <option key={a.id} value={a.id}>{a.nome}</option>
                                            ))
                                          }
                                        </select>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {isAdmin && m.player1 && m.player2 && currentDiv.publicada && (
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      onClick={() => handleWOAdvance(m.id, m.player1!.id)}
                                      className="bg-neutral-900 hover:bg-neutral-850 text-[8px] text-neutral-400 hover:text-orange-500 px-1 py-0.5 rounded transition font-bold"
                                      title="Avançar por W.O."
                                    >
                                      W.O.
                                    </button>
                                    <button
                                      onClick={() => handleOpenDeclareWinner(m.id)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-0.5 rounded transition cursor-pointer flex items-center justify-center"
                                      title="Declarar Vencedor"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* VS label */}
                              <div className="text-[8px] text-neutral-500 text-center font-black select-none leading-none">VS</div>

                              {/* Slot 2 athlete */}
                              <div 
                                onDragOver={(e) => {
                                  if (isAdmin && !currentDiv.publicada) {
                                    e.preventDefault();
                                  }
                                }}
                                onDrop={(e) => {
                                  if (isAdmin && !currentDiv.publicada) {
                                    e.preventDefault();
                                    const athId = e.dataTransfer.getData('text/plain');
                                    if (athId) handlePlaceAthlete(m.id, 2, athId);
                                  }
                                }}
                                draggable={isAdmin && !currentDiv.publicada && !!m.player2}
                                onDragStart={(e) => {
                                  if (isAdmin && !currentDiv.publicada && m.player2) {
                                    e.dataTransfer.setData('text/plain', m.player2.id);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 transition relative ${
                                  m.winnerId && m.winnerId === m.player2?.id
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : m.winnerId
                                    ? 'bg-neutral-950/20 border-neutral-950 opacity-40'
                                    : !m.player2 && isAdmin && !currentDiv.publicada
                                    ? 'border-dashed border-neutral-800 bg-neutral-950/40 hover:border-orange-500/40 hover:bg-orange-500/5 cursor-pointer'
                                    : 'bg-neutral-950 border-neutral-900'
                                }`}
                                title={isAdmin && !currentDiv.publicada && !m.player2 ? "Arraste um atleta aqui para posicioná-lo" : undefined}
                              >
                                <div className="min-w-0 flex-1">
                                  {m.player2 ? (
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="truncate min-w-0 flex-1">
                                        <strong className="text-white text-[10px] block truncate font-extrabold">
                                          {m.player2.nome}
                                        </strong>
                                        <span className="text-[8px] text-neutral-400 block truncate">
                                          🛡️ {m.player2.academia}
                                        </span>
                                      </div>
                                      {isAdmin && !currentDiv.publicada && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearSlot(m.id, 2);
                                          }}
                                          className="text-neutral-500 hover:text-red-500 p-0.5 shrink-0"
                                          title="Remover atleta da vaga"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <span className="text-neutral-600 text-[9px] font-extrabold italic block">VAGO</span>
                                      {isAdmin && !currentDiv.publicada && (
                                        <select
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              handlePlaceAthlete(m.id, 2, e.target.value);
                                            }
                                          }}
                                          className="bg-neutral-900 text-[8px] text-neutral-400 border border-neutral-800 rounded px-1 outline-none max-w-[80px]"
                                        >
                                          <option value="">Alocar...</option>
                                          {currentDiv.athletes
                                            .filter(a => !currentDiv.matches.some(match => match.player1?.id === a.id || match.player2?.id === a.id))
                                            .map(a => (
                                              <option key={a.id} value={a.id}>{a.nome}</option>
                                            ))
                                          }
                                        </select>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {isAdmin && m.player2 && m.player1 && currentDiv.publicada && (
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      onClick={() => handleWOAdvance(m.id, m.player2!.id)}
                                      className="bg-neutral-900 hover:bg-neutral-850 text-[8px] text-neutral-400 hover:text-orange-500 px-1 py-0.5 rounded transition font-bold"
                                      title="Avançar por W.O."
                                    >
                                      W.O.
                                    </button>
                                    <button
                                      onClick={() => handleOpenDeclareWinner(m.id)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-0.5 rounded transition cursor-pointer flex items-center justify-center"
                                      title="Declarar Vencedor"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Match Result Display if finished */}
                              {m.winnerId && (
                                <div className="bg-emerald-550/5 border border-emerald-500/10 rounded-lg p-1 text-[8px] text-neutral-400 flex items-center justify-between">
                                  <span className="flex-1 text-center">
                                    Vencedor por <span className="text-emerald-400 font-extrabold">{m.winMethod}</span> {m.score && `(${m.score})`}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleCancelMatchResult(m.id)}
                                      className="text-neutral-500 hover:text-red-500 p-0.5 shrink-0"
                                      title="Cancelar resultado e resetar chaves posteriores"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                        ))}

                        {/* If this is the center final column, render the podium right under the final match */}
                        {isCenter && (
                          <div className="mt-4 border-t border-neutral-900 pt-4">
                            {currentDiv.matches.find(m => m.round === 'Final')?.winnerId ? (
                              (() => {
                                const finalMatch = currentDiv.matches.find(m => m.round === 'Final')!;
                                const champion = finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player1 : finalMatch.player2;
                                return (
                                  <div className="bg-emerald-550/10 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2 animate-pulse">
                                    <Medal className="w-8 h-8 text-yellow-500 mx-auto" />
                                    <span className="text-[8px] text-neutral-400 uppercase font-black block tracking-wider">Campeão Absoluto</span>
                                    <strong className="text-white text-[11px] block truncate font-extrabold">
                                      🏆 {champion?.nome}
                                    </strong>
                                    <span className="text-[9px] text-emerald-400 font-extrabold block truncate">
                                      {champion?.academia}
                                    </span>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="bg-neutral-900/30 border border-neutral-850/50 rounded-2xl p-4 text-center text-neutral-600 py-6 border-dashed">
                                <Trophy className="w-6 h-6 text-neutral-700 mx-auto mb-1" />
                                <span className="text-[9px] uppercase font-bold tracking-wider block">Aguardando Final</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-neutral-500">Selecione uma divisão ao lado.</div>
            )}
          </div>

        </div>
      )}

      {/* MANUAL ATHLETE ADD MODAL / SLIDE-IN */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999]">
          <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-6 w-full max-w-md space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-orange-500" />
                Inserir Competidor Manualmente
              </h3>
              <button onClick={() => setShowManualAdd(false)} className="text-neutral-500 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAthleteManual} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Nome do Atleta</label>
                <input
                  type="text"
                  required
                  placeholder="Nome Completo"
                  value={newAthleteName}
                  onChange={(e) => setNewAthleteName(e.target.value)}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-2.5 px-3.5 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Academia / Equipe</label>
                <input
                  type="text"
                  placeholder="Ex: ACBJJ Pro"
                  value={newAthleteAcademia}
                  onChange={(e) => setNewAthleteAcademia(e.target.value)}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-2.5 px-3.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Faixa</label>
                  <select
                    value={newAthleteFaixa}
                    onChange={(e) => setNewAthleteFaixa(e.target.value)}
                    className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2.5 px-3 outline-none cursor-pointer"
                  >
                    <option value="Branca">Branca</option>
                    <option value="Cinza">Cinza</option>
                    <option value="Amarela">Amarela</option>
                    <option value="Laranja">Laranja</option>
                    <option value="Verde">Verde</option>
                    <option value="Azul">Azul</option>
                    <option value="Roxa">Roxa</option>
                    <option value="Marrom">Marrom</option>
                    <option value="Preta">Preta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Peso</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: -77kg"
                    value={newAthletePeso}
                    onChange={(e) => setNewAthletePeso(e.target.value)}
                    className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-2.5 px-3.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Idade / Categoria</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Adulto"
                    value={newAthleteCategoria}
                    onChange={(e) => setNewAthleteCategoria(e.target.value)}
                    className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-2.5 px-3.5 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Gênero</label>
                  <select
                    value={newAthleteGenero}
                    onChange={(e) => setNewAthleteGenero(e.target.value)}
                    className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2.5 px-3 outline-none cursor-pointer"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Confirmar e Adicionar na Chave
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DECLARE WINNER DETAILED MODAL */}
      {declaringWinnerMatchId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[999]">
          <div className="bg-[#141414] border border-neutral-850 rounded-3xl p-6 w-full max-w-md space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-orange-500" />
                Declarar Resultado do Combate
              </h3>
              <button onClick={() => setDeclaringWinnerMatchId(null)} className="text-neutral-500 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Select Winner athlete */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Vencedor</label>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const match = currentDiv.matches.find(m => m.id === declaringWinnerMatchId)!;
                    return (
                      <>
                        {match.player1 && (
                          <button
                            type="button"
                            onClick={() => setSelectedWinnerId(match.player1!.id)}
                            className={`p-3 rounded-xl border text-xs font-bold transition text-left block truncate ${
                              selectedWinnerId === match.player1.id
                                ? 'bg-orange-500/10 border-orange-500 text-white'
                                : 'bg-[#1c1c1c] border-neutral-900 hover:border-neutral-800 text-neutral-400'
                            }`}
                          >
                            <span className="text-[9px] uppercase font-black text-orange-400 block">KIMONO AZUL</span>
                            <span className="block truncate mt-0.5">{match.player1.nome}</span>
                          </button>
                        )}
                        {match.player2 && (
                          <button
                            type="button"
                            onClick={() => setSelectedWinnerId(match.player2!.id)}
                            className={`p-3 rounded-xl border text-xs font-bold transition text-left block truncate ${
                              selectedWinnerId === match.player2.id
                                ? 'bg-orange-500/10 border-orange-500 text-white'
                                : 'bg-[#1c1c1c] border-neutral-900 hover:border-neutral-800 text-neutral-400'
                            }`}
                          >
                            <span className="text-[9px] uppercase font-black text-red-400 block">KIMONO VERMELHO</span>
                            <span className="block truncate mt-0.5">{match.player2.nome}</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Select method */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Método de Vitória</label>
                <select
                  value={winMethod}
                  onChange={(e) => setWinMethod(e.target.value as any)}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 rounded-xl py-2.5 px-3 outline-none cursor-pointer"
                >
                  <option value="Pontos">Pontos</option>
                  <option value="Finalização">Finalização</option>
                  <option value="Vantagens">Vantagens</option>
                  <option value="Decisão">Decisão de Juíz</option>
                  <option value="WO">Desqualificação / W.O.</option>
                </select>
              </div>

              {/* Score / details */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Placar / Tempo / Detalhes</label>
                <input
                  type="text"
                  placeholder="Ex: 12x2, Chave de Braço aos 3:45"
                  value={winScore}
                  onChange={(e) => setWinScore(e.target.value)}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-2.5 px-3.5 outline-none"
                />
              </div>

              <button
                onClick={handleConfirmWinner}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer mt-2"
              >
                Confirmar Resultado do Combate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

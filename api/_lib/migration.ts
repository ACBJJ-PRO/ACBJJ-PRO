import { db, ensureSchema, isDatabaseUrlConfigured } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

function normalizeList(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && val !== null) return Object.values(val);
  return [];
}

export async function migrateDataToCloudSQL(sourceData: Record<string, any>) {
  const stats: Record<string, number> = {};

  if (!isDatabaseUrlConfigured) {
    console.warn('[Cloud SQL] DATABASE_URL is not configured — skipping DB migration');
    return { success: true, stats, note: 'DATABASE_URL is not configured' };
  }

  try {
    await ensureSchema();
    // 1. USUÁRIOS
    const existingActiveUserRows = await db.select({ uid: schema.users.uid }).from(schema.users).where(eq(schema.users.status, 'ativo'));
    const activeUids = new Set(existingActiveUserRows.map((r) => String(r.uid)));

    const usuariosList = normalizeList(sourceData.usuarios || sourceData.users);
    let userCount = 0;
    for (const u of usuariosList) {
      if (!u) continue;
      try {
        const uid = String(u.uid || u.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
        const email = u.email || `${uid}@arenadocompetidor.com.br`;
        const name = u.nome || u.name || 'Usuário Arena';
        const tipo = u.tipo || 'aluno';
        const perfilLabel = u.perfilLabel || null;
        const fotoPerfil = u.fotoPerfil || u.foto || null;
        
        // Priority rule for status:
        // 1. If u.aprovado === true OR u.status === 'ativo' OR user is admin OR user is already active in Cloud SQL -> status = 'ativo'
        // 2. Only if not approved and not active -> 'pendente'
        const isApproved = u.aprovado === true || u.status === 'ativo' || tipo === 'admin' || activeUids.has(uid);
        const status = isApproved ? 'ativo' : (u.status || 'pendente');
        
        const rawUser = typeof u === 'object' ? {
          ...u,
          aprovado: isApproved,
          status,
        } : { val: u };

        await db.insert(schema.users)
          .values({
            uid,
            email,
            name,
            tipo,
            perfilLabel,
            fotoPerfil,
            status,
            rawUser,
          })
          .onConflictDoUpdate({
            target: schema.users.uid,
            set: {
              email,
              name,
              tipo,
              perfilLabel,
              fotoPerfil,
              status,
              rawUser,
              updatedAt: new Date(),
            },
          });
        userCount++;
      } catch (err) {
        console.error('Error inserting user record:', err);
      }
    }
    stats.users = userCount;

    // 2. ALUNOS
    const existingActiveStudentRows = await db.select({ id: schema.alunos.id }).from(schema.alunos).where(eq(schema.alunos.status, 'ativo'));
    const activeStudentIds = new Set(existingActiveStudentRows.map((r) => String(r.id)));

    const alunosList = normalizeList(sourceData.alunos);
    let alunoCount = 0;
    for (const a of alunosList) {
      if (!a) continue;
      try {
        const id = String(a.id || `aluno-${alunoCount + 1}`);
        const userId = a.userId ? String(a.userId) : id;
        const nome = a.nome || 'Aluno Arena';

        const isActive = a.ativo === true || a.status === 'ativo' || a.aprovado === true || activeStudentIds.has(id);
        const status = isActive ? 'ativo' : (a.status || 'pendente');

        const rawStudent = typeof a === 'object' ? {
          ...a,
          ativo: isActive,
          status,
        } : { val: a };

        await db.insert(schema.alunos)
          .values({
            id,
            userId,
            nome,
            cpf: a.cpf || null,
            rg: a.rg || null,
            email: a.email || null,
            telefone: a.telefone || null,
            dataNascimento: a.dataNascimento || null,
            faixa: a.faixa || null,
            graus: typeof a.graus === 'number' && Number.isFinite(a.graus) ? Math.floor(a.graus) : 0,
            status,
            academias: a.academias || a.academia || null,
            professorResponsavel: a.professorResponsavel || null,
            fotoPerfil: a.fotoPerfil || a.foto || null,
            rawStudent,
          })
          .onConflictDoUpdate({
            target: schema.alunos.id,
            set: {
              userId,
              nome,
              cpf: a.cpf || null,
              rg: a.rg || null,
              email: a.email || null,
              telefone: a.telefone || null,
              dataNascimento: a.dataNascimento || null,
              faixa: a.faixa || null,
              graus: typeof a.graus === 'number' && Number.isFinite(a.graus) ? Math.floor(a.graus) : 0,
              status,
              academias: a.academias || a.academia || null,
              professorResponsavel: a.professorResponsavel || null,
              fotoPerfil: a.fotoPerfil || a.foto || null,
              rawStudent,
              updatedAt: new Date(),
            },
          });
        alunoCount++;
      } catch (err) {
        console.error('Error inserting aluno record:', err);
      }
    }
    stats.alunos = alunoCount;

    // 3. PROFESSORES
    const profsList = normalizeList(sourceData.professores);
    let profCount = 0;
    for (const p of profsList) {
      if (!p) continue;
      try {
        const id = String(p.id || `prof-${profCount + 1}`);
        const userId = p.userId ? String(p.userId) : id;
        const nome = p.nome || 'Professor Arena';

        await db.insert(schema.professores)
          .values({
            id,
            userId,
            nome,
            email: p.email || null,
            telefone: p.telefone || null,
            faixa: p.faixa || null,
            grau: typeof p.grau === 'number' && Number.isFinite(p.grau) ? Math.floor(p.grau) : 0,
            bio: p.bio || null,
            fotoPerfil: p.fotoPerfil || p.foto || null,
            rawProfessor: typeof p === 'object' ? p : { val: p },
          })
          .onConflictDoUpdate({
            target: schema.professores.id,
            set: {
              userId,
              nome,
              email: p.email || null,
              telefone: p.telefone || null,
              faixa: p.faixa || null,
              grau: typeof p.grau === 'number' && Number.isFinite(p.grau) ? Math.floor(p.grau) : 0,
              bio: p.bio || null,
              fotoPerfil: p.fotoPerfil || p.foto || null,
              rawProfessor: typeof p === 'object' ? p : { val: p },
            },
          });
        profCount++;
      } catch (err) {
        console.error('Error inserting professor record:', err);
      }
    }
    stats.professores = profCount;

    // 4. TURMAS
    const turmasList = normalizeList(sourceData.turmas);
    let turmaCount = 0;
    for (const t of turmasList) {
      if (!t) continue;
      try {
        const id = String(t.id || `turma-${turmaCount + 1}`);
        await db.insert(schema.turmas)
          .values({
            id,
            nome: t.nome || t.disciplina || 'Turma Arena',
            modulo: t.modulo || null,
            horario: t.horario || null,
            dias: t.dias || null,
            professor: t.professor || null,
            status: t.status || 'ativa',
            rawTurma: typeof t === 'object' ? t : { val: t },
          })
          .onConflictDoUpdate({
            target: schema.turmas.id,
            set: {
              nome: t.nome || t.disciplina || 'Turma Arena',
              modulo: t.modulo || null,
              horario: t.horario || null,
              dias: t.dias || null,
              professor: t.professor || null,
              status: t.status || 'ativa',
              rawTurma: typeof t === 'object' ? t : { val: t },
            },
          });
        turmaCount++;
      } catch (err) {
        console.error('Error inserting turma record:', err);
      }
    }
    stats.turmas = turmaCount;

    // 5. TRAINING SCHEDULES
    const schedules = normalizeList(sourceData.trainingSchedules);
    let scheduleCount = 0;
    for (const s of schedules) {
      if (!s) continue;
      try {
        const id = String(s.id || `schedule-${scheduleCount + 1}`);
        await db.insert(schema.trainingSchedules)
          .values({
            id,
            turmaId: s.turmaId ? String(s.turmaId) : null,
            diaSemana: s.diaSemana || null,
            horarioInicio: s.horarioInicio || null,
            horarioFim: s.horarioFim || null,
            disciplina: s.disciplina || null,
            professor: s.professor || null,
            rawSchedule: typeof s === 'object' ? s : { val: s },
          })
          .onConflictDoUpdate({
            target: schema.trainingSchedules.id,
            set: {
              turmaId: s.turmaId ? String(s.turmaId) : null,
              diaSemana: s.diaSemana || null,
              horarioInicio: s.horarioInicio || null,
              horarioFim: s.horarioFim || null,
              disciplina: s.disciplina || null,
              professor: s.professor || null,
              rawSchedule: typeof s === 'object' ? s : { val: s },
            },
          });
        scheduleCount++;
      } catch (err) {
        console.error('Error inserting schedule record:', err);
      }
    }
    stats.trainingSchedules = scheduleCount;

    // 6. AULAS EXPERIMENTAIS
    const aulasExp = normalizeList(sourceData.aulasExperimentais);
    let aulaCount = 0;
    for (const a of aulasExp) {
      if (!a) continue;
      try {
        const id = String(a.id || `aulaexp-${aulaCount + 1}`);
        await db.insert(schema.aulasExperimentais)
          .values({
            id,
            nome: a.nome || 'Visitante',
            email: a.email || null,
            telefone: a.telefone || null,
            turmaId: a.turmaId ? String(a.turmaId) : null,
            data: a.data || null,
            status: a.status || 'pendente',
            observacoes: a.observacoes || null,
            rawAula: typeof a === 'object' ? a : { val: a },
          })
          .onConflictDoUpdate({
            target: schema.aulasExperimentais.id,
            set: {
              nome: a.nome || 'Visitante',
              email: a.email || null,
              telefone: a.telefone || null,
              turmaId: a.turmaId ? String(a.turmaId) : null,
              data: a.data || null,
              status: a.status || 'pendente',
              observacoes: a.observacoes || null,
              rawAula: typeof a === 'object' ? a : { val: a },
            },
          });
        aulaCount++;
      } catch (err) {
        console.error('Error inserting aula experimental record:', err);
      }
    }
    stats.aulasExperimentais = aulaCount;

    // 7. CHECKINS
    const allCheckins = [
      ...normalizeList(sourceData.checkinsPendentes).map((c: any) => ({ ...c, status: c.status || 'pendente', tipoCheckin: c.tipoCheckin || 'aluno' })),
      ...normalizeList(sourceData.checkinsConfirmados).map((c: any) => ({ ...c, status: c.status || 'confirmado', tipoCheckin: c.tipoCheckin || 'aluno' })),
      ...normalizeList(sourceData.professorCheckins).map((c: any) => ({ ...c, status: c.status || 'PENDENTE', tipoCheckin: 'professor' })),
      ...normalizeList(sourceData.checkins),
    ];

    let checkinCount = 0;
    for (const ch of allCheckins) {
      if (!ch) continue;
      try {
        const id = String(
          ch.id ||
          (ch.alunoId && ch.data ? `chk-aluno-${ch.alunoId}-${ch.data}` :
          (ch.usuarioId && ch.data ? `chk-prof-${ch.usuarioId}-${ch.data}` :
          `chk-${checkinCount + 1}`))
        );
        const userId = String(ch.userId || ch.alunoId || ch.usuarioId || ch.professorId || '0');
        const dataHora = ch.dataHora || ch.data || new Date().toISOString();
        const statusVal = String(ch.status || 'confirmado');
        const tipoCheckinVal = String(ch.tipoCheckin || (ch.usuarioId ? 'professor' : 'aluno'));

        // Ensure object rawCheckin contains generated id and status
        const rawObj = typeof ch === 'object' ? { ...ch, id, status: statusVal, tipoCheckin: tipoCheckinVal } : { val: ch, id, status: statusVal };

        await db.insert(schema.checkins)
          .values({
            id,
            userId,
            alunoId: ch.alunoId ? String(ch.alunoId) : null,
            turmaId: ch.turmaId ? String(ch.turmaId) : null,
            professorId: ch.professorId ? String(ch.professorId) : null,
            dataHora,
            status: statusVal,
            tipoCheckin: tipoCheckinVal,
            justificativa: ch.justificativa || null,
            rawCheckin: rawObj,
          })
          .onConflictDoUpdate({
            target: schema.checkins.id,
            set: {
              userId,
              alunoId: ch.alunoId ? String(ch.alunoId) : null,
              turmaId: ch.turmaId ? String(ch.turmaId) : null,
              professorId: ch.professorId ? String(ch.professorId) : null,
              dataHora,
              status: statusVal,
              tipoCheckin: tipoCheckinVal,
              justificativa: ch.justificativa || null,
              rawCheckin: rawObj,
            },
          });
        checkinCount++;
      } catch (err) {
        console.error('Error inserting checkin record:', err);
      }
    }
    stats.checkins = checkinCount;

    // 8. JUSTIFICATIVAS DE FALTAS
    const justifs = normalizeList(sourceData.justificativasFaltas);
    let justifCount = 0;
    for (const j of justifs) {
      if (!j) continue;
      try {
        const id = String(j.id || `justif-${justifCount + 1}`);
        await db.insert(schema.justificativasFaltas)
          .values({
            id,
            alunoId: j.alunoId ? String(j.alunoId) : null,
            dataFalta: j.dataFalta || j.data || null,
            motivo: j.motivo || null,
            status: j.status || 'pendente',
            fotoComprovante: j.fotoComprovante || null,
            rawJustificativa: typeof j === 'object' ? j : { val: j },
          })
          .onConflictDoUpdate({
            target: schema.justificativasFaltas.id,
            set: {
              alunoId: j.alunoId ? String(j.alunoId) : null,
              dataFalta: j.dataFalta || j.data || null,
              motivo: j.motivo || null,
              status: j.status || 'pendente',
              fotoComprovante: j.fotoComprovante || null,
              rawJustificativa: typeof j === 'object' ? j : { val: j },
            },
          });
        justifCount++;
      } catch (err) {
        console.error('Error inserting justificativa record:', err);
      }
    }
    stats.justificativasFaltas = justifCount;

    // 9. CARTEIRINHAS E CREDENCIAIS
    const credList = normalizeList(sourceData.carteirinhasMap || sourceData.carteirinhas);
    let credCount = 0;
    for (const c of credList) {
      if (!c || !c.credentialId || !c.authCode) continue;
      try {
        const id = String(c.userId || c.id || `cred-${c.credentialId}`);
        const userId = String(c.userId || id);
        const credentialId = String(c.credentialId);
        const authCode = String(c.authCode);

        await db.insert(schema.carteirinhas)
          .values({
            id,
            credentialId,
            authCode,
            userId,
            userNome: c.userNome || 'Titular',
            userTipo: c.userTipo || 'aluno',
            fotoPerfil: c.fotoPerfil || null,
            status: c.status || 'ativo',
            validade: c.validade || 'DEZ/2027',
            registro: c.registro || null,
            qrToken: (c.qrToken && !c.qrToken.includes('arenadocompetidor.ai.studio')) ? c.qrToken : `/verify/card/${credentialId}`,
            rawCarteirinha: typeof c === 'object' ? c : { val: c },
          })
          .onConflictDoUpdate({
            target: schema.carteirinhas.id,
            set: {
              credentialId,
              authCode,
              userId,
              userNome: c.userNome || 'Titular',
              userTipo: c.userTipo || 'aluno',
              fotoPerfil: c.fotoPerfil || null,
              status: c.status || 'ativo',
              validade: c.validade || 'DEZ/2027',
              registro: c.registro || null,
              qrToken: (c.qrToken && !c.qrToken.includes('arenadocompetidor.ai.studio')) ? c.qrToken : `/verify/card/${credentialId}`,
              rawCarteirinha: typeof c === 'object' ? c : { val: c },
              updatedAt: new Date(),
            },
          });
        credCount++;
      } catch (err) {
        console.error('Error inserting carteirinha record:', err);
      }
    }
    stats.carteirinhas = credCount;

    // 10. NOTIFICAÇÕES
    const notifs = normalizeList(sourceData.notificacoes);
    let notifCount = 0;
    for (const n of notifs) {
      if (!n) continue;
      try {
        const id = String(n.id || `notif-${notifCount + 1}`);
        await db.insert(schema.notificacoes)
          .values({
            id,
            texto: n.texto || '',
            data: n.data || new Date().toISOString(),
            para: n.para || 'Todos',
            de: n.de || 'Sistema',
            lida: Boolean(n.lida),
            rawNotificacao: typeof n === 'object' ? n : { val: n },
          })
          .onConflictDoUpdate({
            target: schema.notificacoes.id,
            set: {
              texto: n.texto || '',
              data: n.data || new Date().toISOString(),
              para: n.para || 'Todos',
              de: n.de || 'Sistema',
              lida: Boolean(n.lida),
              rawNotificacao: typeof n === 'object' ? n : { val: n },
            },
          });
        notifCount++;
      } catch (err) {
        console.error('Error inserting notificacao record:', err);
      }
    }
    stats.notificacoes = notifCount;

    // 11. PUBLICIDADES
    if (sourceData.publicidades !== undefined) {
      const pubs = normalizeList(sourceData.publicidades);
      const incomingIds = new Set<string>();
      let pubCount = 0;
      for (const p of pubs) {
        if (!p) continue;
        try {
          const id = String(p.id || `pub-${pubCount + 1}`);
          incomingIds.add(id);
          const parsedOrdem = typeof p.ordem === 'number' && Number.isFinite(p.ordem)
            ? Math.floor(p.ordem)
            : (parseInt(String(p.ordem), 10) || pubCount);

          const isAtivo = p.ativo !== undefined
            ? Boolean(p.ativo)
            : (p.status !== 'arquivada' && p.status !== 'inativa');

          await db.insert(schema.publicidades)
            .values({
              id,
              titulo: p.nomeEmpresa || p.titulo || 'Anúncio Arena',
              imagemUrl: p.imagemUrl || p.imagem || null,
              linkUrl: p.linkUrl || p.link || null,
              posicao: p.posicao || sourceData.publicidadePosicao || 'topo',
              ordem: parsedOrdem,
              ativo: isAtivo,
              rawPublicidade: typeof p === 'object' ? p : { val: p },
            })
            .onConflictDoUpdate({
              target: schema.publicidades.id,
              set: {
                titulo: p.nomeEmpresa || p.titulo || 'Anúncio Arena',
                imagemUrl: p.imagemUrl || p.imagem || null,
                linkUrl: p.linkUrl || p.link || null,
                posicao: p.posicao || sourceData.publicidadePosicao || 'topo',
                ordem: parsedOrdem,
                ativo: isAtivo,
                rawPublicidade: typeof p === 'object' ? p : { val: p },
              },
            });
          pubCount++;
        } catch (err) {
          console.error('Error inserting publicidade record:', err);
        }
      }

      // Delete publicidades missing from the incoming list (persistent removal in Cloud SQL)
      try {
        const existingPubs = await db.select({ id: schema.publicidades.id }).from(schema.publicidades);
        for (const existing of existingPubs) {
          if (!incomingIds.has(existing.id)) {
            await db.delete(schema.publicidades).where(eq(schema.publicidades.id, existing.id));
          }
        }
      } catch (err) {
        console.error('Error deleting removed publicidades from Cloud SQL:', err);
      }

      stats.publicidades = pubCount;
    }

    // 12. NOTÍCIAS, VÍDEOS, LIVES
    const noticiasList = normalizeList(sourceData.noticias);
    let newsCount = 0;
    for (const news of noticiasList) {
      if (!news) continue;
      try {
        const id = String(news.id || `news-${newsCount + 1}`);
        await db.insert(schema.noticias)
          .values({
            id,
            titulo: news.titulo || 'Notícia',
            resumo: news.resumo || null,
            conteudo: news.conteudo || null,
            imagemUrl: news.imagemUrl || news.imagem || null,
            data: news.data || null,
            rawNoticia: typeof news === 'object' ? news : { val: news },
          })
          .onConflictDoUpdate({
            target: schema.noticias.id,
            set: {
              titulo: news.titulo || 'Notícia',
              resumo: news.resumo || null,
              conteudo: news.conteudo || null,
              imagemUrl: news.imagemUrl || news.imagem || null,
              data: news.data || null,
              rawNoticia: typeof news === 'object' ? news : { val: news },
            },
          });
        newsCount++;
      } catch (err) {
        console.error('Error inserting noticia record:', err);
      }
    }
    stats.noticias = newsCount;

    const videosList = normalizeList(sourceData.videos);
    let videoCount = 0;
    for (const v of videosList) {
      if (!v) continue;
      try {
        const id = String(v.id || `video-${videoCount + 1}`);
        await db.insert(schema.videos)
          .values({
            id,
            titulo: v.titulo || 'Vídeo',
            descricao: v.descricao || null,
            videoUrl: v.videoUrl || v.url || null,
            thumbUrl: v.thumbUrl || v.thumb || null,
            categoria: v.categoria || null,
            rawVideo: typeof v === 'object' ? v : { val: v },
          })
          .onConflictDoUpdate({
            target: schema.videos.id,
            set: {
              titulo: v.titulo || 'Vídeo',
              descricao: v.descricao || null,
              videoUrl: v.videoUrl || v.url || null,
              thumbUrl: v.thumbUrl || v.thumb || null,
              categoria: v.categoria || null,
              rawVideo: typeof v === 'object' ? v : { val: v },
            },
          });
        videoCount++;
      } catch (err) {
        console.error('Error inserting video record:', err);
      }
    }
    stats.videos = videoCount;

    const liveList = normalizeList(sourceData.liveStreams);
    let liveCount = 0;
    for (const l of liveList) {
      if (!l) continue;
      try {
        const id = String(l.id || `live-${liveCount + 1}`);
        await db.insert(schema.liveStreams)
          .values({
            id,
            titulo: l.titulo || 'Transmissão Ao Vivo',
            descricao: l.descricao || null,
            streamUrl: l.embedUrl || l.streamUrl || l.url || null,
            status: l.status || 'agendado',
            rawLive: typeof l === 'object' ? l : { val: l },
          })
          .onConflictDoUpdate({
            target: schema.liveStreams.id,
            set: {
              titulo: l.titulo || 'Transmissão Ao Vivo',
              descricao: l.descricao || null,
              streamUrl: l.embedUrl || l.streamUrl || l.url || null,
              status: l.status || 'agendado',
              rawLive: typeof l === 'object' ? l : { val: l },
            },
          });
        liveCount++;
      } catch (err) {
        console.error('Error inserting live stream record:', err);
      }
    }
    stats.liveStreams = liveCount;

    // 13. CAMPEONATOS & INSCRIÇÕES
    const champList = normalizeList(sourceData.confrontoCampeonatos || sourceData.campeonatos);
    let champCount = 0;
    for (const c of champList) {
      if (!c) continue;
      try {
        const id = String(c.id || `champ-${champCount + 1}`);
        await db.insert(schema.campeonatos)
          .values({
            id,
            nome: c.nome || c.titulo || 'Campeonato Arena',
            data: c.data || null,
            local: c.local || null,
            status: c.status || 'aberto',
            bannerUrl: c.bannerUrl || c.imagem || null,
            rawCampeonato: typeof c === 'object' ? c : { val: c },
          })
          .onConflictDoUpdate({
            target: schema.campeonatos.id,
            set: {
              nome: c.nome || c.titulo || 'Campeonato Arena',
              data: c.data || null,
              local: c.local || null,
              status: c.status || 'aberto',
              bannerUrl: c.bannerUrl || c.imagem || null,
              rawCampeonato: typeof c === 'object' ? c : { val: c },
            },
          });
        champCount++;
      } catch (err) {
        console.error('Error inserting campeonato record:', err);
      }
    }
    stats.campeonatos = champCount;

    const inscList = normalizeList(sourceData.confrontoInscricoes || sourceData.campeonatoInscricoes);
    let inscCount = 0;
    for (const ins of inscList) {
      if (!ins) continue;
      try {
        const id = String(ins.id || `insc-${inscCount + 1}`);
        await db.insert(schema.campeonatoInscricoes)
          .values({
            id,
            campeonatoId: ins.campeonatoId ? String(ins.campeonatoId) : null,
            atletaId: ins.atletaId || ins.userId ? String(ins.atletaId || ins.userId) : null,
            atletaNome: ins.atletaNome || ins.nome || 'Atleta',
            cpf: ins.cpf || null,
            categoria: ins.categoria || null,
            statusPagamento: ins.statusPagamento || ins.status || 'pendente',
            rawInscricao: typeof ins === 'object' ? ins : { val: ins },
          })
          .onConflictDoUpdate({
            target: schema.campeonatoInscricoes.id,
            set: {
              campeonatoId: ins.campeonatoId ? String(ins.campeonatoId) : null,
              atletaId: ins.atletaId || ins.userId ? String(ins.atletaId || ins.userId) : null,
              atletaNome: ins.atletaNome || ins.nome || 'Atleta',
              cpf: ins.cpf || null,
              categoria: ins.categoria || null,
              statusPagamento: ins.statusPagamento || ins.status || 'pendente',
              rawInscricao: typeof ins === 'object' ? ins : { val: ins },
            },
          });
        inscCount++;
      } catch (err) {
        console.error('Error inserting campeonatoInscricao record:', err);
      }
    }
    stats.campeonatoInscricoes = inscCount;

    // 14. CERTIFICADOS & PROVAS
    const certs = normalizeList(sourceData.certificados);
    let certCount = 0;
    for (const c of certs) {
      if (!c) continue;
      try {
        const id = String(c.id || `cert-${certCount + 1}`);
        await db.insert(schema.certificados)
          .values({
            id,
            alunoId: c.alunoId ? String(c.alunoId) : null,
            userNome: c.userNome || c.nome || 'Aluno',
            curso: c.curso || c.modulo || null,
            dataEmissao: c.dataEmissao || c.data || null,
            codigoValidacao: c.codigoValidacao || c.codigo || null,
            status: c.status || 'emitido',
            rawCertificado: typeof c === 'object' ? c : { val: c },
          })
          .onConflictDoUpdate({
            target: schema.certificados.id,
            set: {
              alunoId: c.alunoId ? String(c.alunoId) : null,
              userNome: c.userNome || c.nome || 'Aluno',
              curso: c.curso || c.modulo || null,
              dataEmissao: c.dataEmissao || c.data || null,
              codigoValidacao: c.codigoValidacao || c.codigo || null,
              status: c.status || 'emitido',
              rawCertificado: typeof c === 'object' ? c : { val: c },
            },
          });
        certCount++;
      } catch (err) {
        console.error('Error inserting certificado record:', err);
      }
    }
    stats.certificados = certCount;

    // 14b. PROVAS ENVIADAS
    const rawExams = normalizeList(sourceData.provasEnviadas || sourceData.arena_provas || sourceData.provas);
    let examCount = 0;
    for (const p of rawExams) {
      if (!p) continue;
      try {
        const id = String(p.id || `exam-${examCount + 1}`);
        await db.insert(schema.provasEnviadas)
          .values({
            id,
            alunoId: p.alunoId ? String(p.alunoId) : 'todos',
            userNome: p.enviadoPor || p.userNome || 'Professor',
            modulo: p.tituloProva || p.modulo || 'Prova',
            nota: p.notas ? JSON.stringify(p.notas) : null,
            status: p.tipo || 'objetiva',
            rawProva: typeof p === 'object' ? p : { val: p },
          })
          .onConflictDoUpdate({
            target: schema.provasEnviadas.id,
            set: {
              alunoId: p.alunoId ? String(p.alunoId) : 'todos',
              userNome: p.enviadoPor || p.userNome || 'Professor',
              modulo: p.tituloProva || p.modulo || 'Prova',
              nota: p.notas ? JSON.stringify(p.notas) : null,
              status: p.tipo || 'objetiva',
              rawProva: typeof p === 'object' ? p : { val: p },
            },
          });
        examCount++;
      } catch (err) {
        console.error('Error inserting exam record:', err);
      }
    }
    stats.provasEnviadas = examCount;

    // 14c. EVALUATION CYCLES
    const rawCycles = normalizeList(sourceData.evaluationCycles || sourceData.avaliacoesCiclos || sourceData.arena_avaliacoes_ciclos);
    let cycleCount = 0;
    for (const cy of rawCycles) {
      if (!cy) continue;
      try {
        const id = String(cy.id || `cycle-${cycleCount + 1}`);
        await db.insert(schema.evaluationCycles)
          .values({
            id,
            nome: cy.nome || 'Ciclo de Avaliação',
            descricao: cy.descricao || null,
            semestre: cy.semestre || null,
            dataInicio: cy.dataInicio || cy.data_inicio || null,
            dataFim: cy.dataFim || cy.data_fim || null,
            status: cy.status || 'ativo',
            encerrado: cy.status === 'encerrado' || cy.encerrado === true,
            criadoPor: cy.criadoPor || cy.criado_por || null,
            rawCycle: typeof cy === 'object' ? cy : { val: cy },
            createdAt: cy.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.evaluationCycles.id,
            set: {
              nome: cy.nome || 'Ciclo de Avaliação',
              descricao: cy.descricao || null,
              semestre: cy.semestre || null,
              dataInicio: cy.dataInicio || cy.data_inicio || null,
              dataFim: cy.dataFim || cy.data_fim || null,
              status: cy.status || 'ativo',
              encerrado: cy.status === 'encerrado' || cy.encerrado === true,
              criadoPor: cy.criadoPor || cy.criado_por || null,
              rawCycle: typeof cy === 'object' ? cy : { val: cy },
              updatedAt: new Date().toISOString(),
            },
          });
        cycleCount++;
      } catch (err) {
        console.error('Error inserting evaluationCycle record:', err);
      }
    }
    stats.evaluationCycles = cycleCount;

    // 14d. STUDENT EVALUATIONS
    const rawEvals = normalizeList(sourceData.studentEvaluations || sourceData.avaliacoesRegistros || sourceData.arena_avaliacoes_registros);
    let evalCount = 0;
    for (const ev of rawEvals) {
      if (!ev) continue;
      try {
        const id = String(ev.id || `eval-${evalCount + 1}`);
        await db.insert(schema.studentEvaluations)
          .values({
            id,
            alunoId: ev.alunoId ? String(ev.alunoId) : null,
            cicloId: ev.cicloId ? String(ev.cicloId) : null,
            professorId: ev.professorId ? String(ev.professorId) : null,
            professorNome: ev.professorNome || null,
            notas: ev.notas || {},
            mediaFinal: ev.mediaFinal !== undefined ? String(ev.mediaFinal) : '0',
            frequenciaPercent: ev.frequenciaPercent !== undefined ? String(ev.frequenciaPercent) : '0',
            notaTeorica: ev.teoriaConceitosNota !== undefined ? String(ev.teoriaConceitosNota) : null,
            status: ev.aprovado ? 'aprovado' : 'reprovado',
            aprovado: Boolean(ev.aprovado),
            observacoes: ev.observacoes || null,
            dataAvaliacao: ev.dataAvaliacao || new Date().toISOString(),
            rawEvaluation: typeof ev === 'object' ? ev : { val: ev },
            createdAt: ev.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.studentEvaluations.id,
            set: {
              alunoId: ev.alunoId ? String(ev.alunoId) : null,
              cicloId: ev.cicloId ? String(ev.cicloId) : null,
              professorId: ev.professorId ? String(ev.professorId) : null,
              professorNome: ev.professorNome || null,
              notas: ev.notas || {},
              mediaFinal: ev.mediaFinal !== undefined ? String(ev.mediaFinal) : '0',
              frequenciaPercent: ev.frequenciaPercent !== undefined ? String(ev.frequenciaPercent) : '0',
              notaTeorica: ev.teoriaConceitosNota !== undefined ? String(ev.teoriaConceitosNota) : null,
              status: ev.aprovado ? 'aprovado' : 'reprovado',
              aprovado: Boolean(ev.aprovado),
              observacoes: ev.observacoes || null,
              dataAvaliacao: ev.dataAvaliacao || new Date().toISOString(),
              rawEvaluation: typeof ev === 'object' ? ev : { val: ev },
              updatedAt: new Date().toISOString(),
            },
          });
        evalCount++;
      } catch (err) {
        console.error('Error inserting studentEvaluation record:', err);
      }
    }
    stats.studentEvaluations = evalCount;

    // 14e. EVALUATION SETTINGS
    const rawSettings = sourceData.evaluationSettings || sourceData.avaliacoesConfig || sourceData.arena_avaliacoes_config;
    if (rawSettings && typeof rawSettings === 'object') {
      try {
        await db.insert(schema.evaluationSettings)
          .values({
            id: 'global',
            notaMinima: String(rawSettings.notaMinima ?? 7.0),
            frequenciaMinima: String(rawSettings.frequenciaMinima ?? 75),
            criterios: rawSettings.criterios || [],
            rawSettings,
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.evaluationSettings.id,
            set: {
              notaMinima: String(rawSettings.notaMinima ?? 7.0),
              frequenciaMinima: String(rawSettings.frequenciaMinima ?? 75),
              criterios: rawSettings.criterios || [],
              rawSettings,
              updatedAt: new Date().toISOString(),
            },
          });
        stats.evaluationSettings = 1;
      } catch (err) {
        console.error('Error inserting evaluationSettings record:', err);
      }
    }

    // 14f. MENSALIDADES ALUNOS
    const mensalidadesList = normalizeList(sourceData.mensalidades || sourceData.mensalidadesAlunos);
    let mensalidadeCount = 0;
    for (const m of mensalidadesList) {
      if (!m || !m.alunoId) continue;
      try {
        const id = String(m.id || `m_${Date.now()}_${mensalidadeCount + 1}`);
        await db.insert(schema.mensalidadesAlunos)
          .values({
            id,
            alunoId: String(m.alunoId),
            alunoNome: m.alunoNome || null,
            valor: Number(m.valor) || 0,
            valorOriginal: Number(m.valorOriginal) || Number(m.valor) || 0,
            desconto: Number(m.desconto) || 0,
            competencia: m.competencia || null,
            dataVencimento: m.dataVencimento || null,
            dataPagamento: m.dataPagamento || null,
            status: m.status || 'Pendente',
            metodoPagamento: m.metodoPagamento || null,
            transactionId: m.transactionId || null,
            pixTxid: m.pixTxid || null,
            observacao: m.observacao || null,
            rawMensalidade: typeof m === 'object' ? m : { val: m },
            createdAt: m.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.mensalidadesAlunos.id,
            set: {
              alunoId: String(m.alunoId),
              alunoNome: m.alunoNome || null,
              valor: Number(m.valor) || 0,
              valorOriginal: Number(m.valorOriginal) || Number(m.valor) || 0,
              desconto: Number(m.desconto) || 0,
              competencia: m.competencia || null,
              dataVencimento: m.dataVencimento || null,
              dataPagamento: m.dataPagamento || null,
              status: m.status || 'Pendente',
              metodoPagamento: m.metodoPagamento || null,
              transactionId: m.transactionId || null,
              pixTxid: m.pixTxid || null,
              observacao: m.observacao || null,
              rawMensalidade: typeof m === 'object' ? m : { val: m },
              updatedAt: new Date().toISOString(),
            },
          });
        mensalidadeCount++;
      } catch (err) {
        console.error('Error inserting mensalidade record:', err);
      }
    }
    stats.mensalidadesAlunos = mensalidadeCount;

    // 15. SYSTEM CONFIGS & OTHER CONFIG KEYS
    const knownTableKeys = new Set([
      'usuarios', 'users', 'alunos', 'professores', 'turmas', 'trainingSchedules',
      'aulasExperimentais', 'checkins', 'checkinsPendentes', 'checkinsConfirmados',
      'professorCheckins', 'justificativasFaltas', 'carteirinhas', 'notificacoes',
      'publicidades', 'noticias', 'videos', 'liveStreams', 'campeonatos',
      'confrontoCampeonatos', 'campeonatoInscricoes', 'confrontoInscricoes', 'certificados',
      'provasEnviadas', 'arena_provas', 'provas',
      'evaluationCycles', 'avaliacoesCiclos', 'arena_avaliacoes_ciclos',
      'studentEvaluations', 'avaliacoesRegistros', 'arena_avaliacoes_registros',
      'evaluationSettings', 'avaliacoesConfig', 'arena_avaliacoes_config',
    ]);

    for (const key of Object.keys(sourceData)) {
      if (!knownTableKeys.has(key) && sourceData[key] !== undefined) {
        try {
          await db.insert(schema.systemConfigs)
            .values({
              key,
              value: sourceData[key],
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: schema.systemConfigs.key,
              set: {
                value: sourceData[key],
                updatedAt: new Date(),
              },
            });
        } catch (err) {
          console.error(`Error inserting systemConfig key ${key}:`, err);
        }
      }
    }

    return { success: true, stats };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error), stats };
  }
}

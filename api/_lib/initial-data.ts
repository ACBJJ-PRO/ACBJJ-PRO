import type { User, Student, Professor, ClassUnit, NewsItem, VideoItem, TrainingSchedule, LiveStreamItem } from '../../src/types';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'admin@admin.com',
    senha: '123',
    nome: 'Administrador',
    tipo: 'admin',
    aprovado: true,
    fotoPerfil: '',
    whatsapp: '(11) 98888-7777',
    endereco: 'Rua das Lutas, 450 - São Paulo',
    tipoSangue: 'A+',
    alergico: 'Nenhum',
    dataNascimento: '1980-01-01',
    cpf: '123.456.789-12',
  }
];

export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_PROFESSORS: Professor[] = [];
export const INITIAL_TURMAS: ClassUnit[] = [];
export const INITIAL_TRAINING_SCHEDULES: TrainingSchedule[] = [];
export const INITIAL_GRADE: string[] = [];
export const INITIAL_NEWS: NewsItem[] = [];
export const INITIAL_VIDEOS: VideoItem[] = [];
export const INITIAL_CAROUSEL_FOTOS: string[] = [];

export const INITIAL_LIVE_STREAMS: LiveStreamItem[] = [
  {
    id: 'live-1',
    titulo: 'Aulão Ao Vivo — Passagem de Guarda & Defesas com Mestre Responsável',
    descricao: 'Aula em tempo real transmitida com infraestrutura oficial do Google Meet e gravação automática para o Google Drive.',
    dataHoraAgendada: new Date().toISOString(),
    duracaoMinutos: 60,
    professorNome: 'Mestre Responsável',
    status: 'ao_vivo',
    publicoAlvo: 'todos',
    tipoProvedor: 'google_meet',
    meetUrl: 'https://meet.google.com/arena-ao-vivo-acbjj',
    meetSpaceName: 'spaces/arena-ao-vivo-acbjj',
    diasRetencao: 15,
    isCampeonato: false,
    patrocinadores: [
      {
        id: 'patro-1',
        nome: 'Keiko Raca Fightwear',
        imagemUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
        tempoExibicaoSegundos: 15,
        ativo: false,
      },
      {
        id: 'patro-2',
        nome: 'Koral Fightwear',
        imagemUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=80',
        tempoExibicaoSegundos: 20,
        ativo: false,
      }
    ],
    createdAt: new Date().toISOString(),
  }
];

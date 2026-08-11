import React, { useState, useEffect } from 'react';
import { googleSignIn, logout, initAuth, auth } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { Users, Calendar, Plus, RefreshCw, Loader2, Check, ExternalLink, CalendarDays, Contact, UserPlus, AlertCircle, Video, Copy, Send, HardDrive, UploadCloud, FileText, File, Trash2 } from 'lucide-react';

interface GoogleContact {
  resourceName: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  relationship?: string;
  notes?: string;
}

interface GoogleEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

interface CreatedMeetRoom {
  id: string;
  title: string;
  meetingUri: string;
  createdAt: string;
}

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
}

export default function GoogleIntegrationsPane() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'calendar' | 'meet' | 'drive'>('contacts');

  // Contacts States
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [fetchingContacts, setFetchingContacts] = useState(false);
  const [newContact, setNewContact] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    relationship: 'Aluno',
    notes: '',
  });

  // Calendar States
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: 'ACBJJ Arena',
    includeMeet: true,
  });

  // Google Meet States
  const [meetTitle, setMeetTitle] = useState('Aula Virtual — Arena do Competidor');
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [meetRooms, setMeetRooms] = useState<CreatedMeetRoom[]>([]);
  const [copiedMeetUri, setCopiedMeetUri] = useState<string | null>(null);

  // Google Drive States
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [fetchingDrive, setFetchingDrive] = useState(false);
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<{ id: string; name: string } | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Listen for auth state change
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setGoogleToken(token);
        // Sync user with backend Cloud SQL db
        const idToken = await firebaseUser.getIdToken();
        await fetch('/api/cloudsql/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
        });
      },
      () => {
        setUser(null);
        setGoogleToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && googleToken) {
      fetchSyncedContacts();
      fetchSyncedEvents();
      fetchDriveFiles();
    }
  }, [user, googleToken]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setGoogleToken(result.accessToken);
        showToast('Conectado com sucesso ao Google!', 'success');
      }
    } catch (error: any) {
      console.error(error);
      showToast('Falha na autenticação do Google.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setGoogleToken(null);
      setContactsList([]);
      setEventsList([]);
      showToast('Desconectado da conta Google.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao desconectar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncedContacts = async () => {
    if (!user) return;
    setFetchingContacts(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cloudsql/contacts/sync-db', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setContactsList(data.contacts || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingContacts(false);
    }
  };

  const fetchSyncedEvents = async () => {
    if (!user) return;
    setFetchingEvents(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cloudsql/calendar/sync-db', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEventsList(data.events || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingEvents(false);
    }
  };

  const fetchDriveFiles = async () => {
    if (!user || !googleToken) return;
    setFetchingDrive(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cloudsql/drive/files', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'x-google-token': googleToken,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      } else {
        const err = await res.json();
        console.error('Drive fetch error:', err);
      }
    } catch (error) {
      console.error('Error fetching drive files:', error);
    } finally {
      setFetchingDrive(false);
    }
  };

  const handleUploadDriveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !googleToken || !selectedUploadFile) return;

    setUploadingDrive(true);
    try {
      const idToken = await user.getIdToken();

      // Read file as base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedUploadFile);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/cloudsql/drive/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
              'x-google-token': googleToken,
            },
            body: JSON.stringify({
              fileName: selectedUploadFile.name,
              fileType: selectedUploadFile.type || 'application/octet-stream',
              fileData: base64Data,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            showToast(`Arquivo "${selectedUploadFile.name}" enviado com sucesso para o Google Drive!`, 'success');
            setSelectedUploadFile(null);
            fetchDriveFiles();
          } else {
            const err = await res.json();
            showToast(err.error || 'Erro ao enviar arquivo para o Google Drive', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Falha no upload do arquivo.', 'error');
        } finally {
          setUploadingDrive(false);
        }
      };
      reader.onerror = () => {
        showToast('Erro ao ler o arquivo selecionado.', 'error');
        setUploadingDrive(false);
      };
    } catch (error) {
      console.error(error);
      showToast('Ocorreu um erro ao preparar o arquivo.', 'error');
      setUploadingDrive(false);
    }
  };

  const handleConfirmDeleteDrive = async () => {
    if (!user || !googleToken || !deleteConfirmFile) return;

    setDeletingFileId(deleteConfirmFile.id);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/cloudsql/drive/files/${deleteConfirmFile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'x-google-token': googleToken,
        },
      });

      if (res.ok) {
        showToast(`Arquivo "${deleteConfirmFile.name}" excluído do Google Drive!`, 'success');
        setDriveFiles((prev) => prev.filter((f) => f.id !== deleteConfirmFile.id));
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao excluir arquivo do Google Drive', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Ocorreu um erro ao excluir o arquivo.', 'error');
    } finally {
      setDeletingFileId(null);
      setDeleteConfirmFile(null);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !googleToken) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cloudsql/contacts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'x-google-token': googleToken,
        },
        body: JSON.stringify(newContact),
      });

      if (res.ok) {
        showToast('Contato adicionado e sincronizado com o Google!', 'success');
        setNewContact({
          fullName: '',
          email: '',
          phoneNumber: '',
          relationship: 'Aluno',
          notes: '',
        });
        fetchSyncedContacts();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao sincronizar contato', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Ocorreu um erro ao salvar o contato.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !googleToken) return;

    if (!newEvent.startTime || !newEvent.endTime) {
      showToast('Por favor, defina horários de início e término.', 'error');
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cloudsql/calendar/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'x-google-token': googleToken,
        },
        body: JSON.stringify(newEvent),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(
          data.hangoutLink
            ? 'Evento agendado com link do Google Meet gerado com sucesso!'
            : 'Evento agendado e inserido na sua agenda do Google!',
          'success'
        );
        setNewEvent({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          location: 'ACBJJ Arena',
          includeMeet: true,
        });
        fetchSyncedEvents();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao agendar o evento', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Ocorreu um erro ao salvar o evento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeetSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !googleToken) return;

    setCreatingMeet(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cloudsql/meet/create-space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'x-google-token': googleToken,
        },
        body: JSON.stringify({ title: meetTitle }),
      });

      if (res.ok) {
        const data = await res.json();
        const newRoom: CreatedMeetRoom = {
          id: data.name || `room-${Date.now()}`,
          title: meetTitle,
          meetingUri: data.meetingUri,
          createdAt: new Date().toISOString(),
        };
        setMeetRooms((prev) => [newRoom, ...prev]);
        showToast('Sala do Google Meet gerada com sucesso!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao criar sala no Google Meet', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Ocorreu um erro ao criar a reunião no Google Meet.', 'error');
    } finally {
      setCreatingMeet(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMeetUri(text);
    showToast('Link do Google Meet copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedMeetUri(null), 3000);
  };

  return (
    <div className="bg-[#141414] rounded-3xl p-6 border border-neutral-800 shadow-md">
      {/* Toast Messages */}
      {message && (
        <div className={`fixed bottom-5 right-5 z-[1000] p-4 rounded-xl shadow-lg border text-xs font-bold transition flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-5 mb-6 text-left w-full gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wider uppercase">💳 Integração Google Workspace</h2>
          <p className="text-xs text-neutral-400 mt-1">Conecte sua conta do Google para sincronizar contatos dos alunos e agendar aulas na Agenda.</p>
        </div>

        {user ? (
          <div className="flex items-center gap-3 bg-[#1c1c1c] p-2.5 rounded-2xl border border-neutral-800">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-neutral-700" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 font-bold flex items-center justify-center uppercase">{user.displayName?.charAt(0) || 'G'}</div>
            )}
            <div className="text-left">
              <span className="text-xs font-bold text-white block leading-none">{user.displayName || 'Usuário Google'}</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5 max-w-[150px] truncate">{user.email}</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 py-1 px-2.5 bg-red-500/10 border border-red-500/20 rounded-lg transition ml-2 shrink-0 cursor-pointer"
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3 px-6 rounded-2xl transition shadow-lg shadow-orange-500/15 cursor-pointer disabled:opacity-50 select-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Conectar Conta Google
              </span>
            )}
          </button>
        )}
      </div>

      {!user ? (
        <div className="text-center py-16 bg-[#1a1a1a]/40 rounded-2xl border border-neutral-850/60 flex flex-col items-center">
          <div className="w-16 h-16 bg-neutral-900 rounded-3xl flex items-center justify-center border border-neutral-800 shadow-md mb-4 text-orange-500">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Acesso ao Workspace Requerido</h3>
          <p className="text-xs text-neutral-450 max-w-md mx-auto mt-2 leading-relaxed px-4">
            Após a conexão com sua conta Google, você poderá integrar sua listagem de contatos e agenda acadêmica em tempo real de forma segura.
          </p>
          <button
            onClick={handleConnect}
            className="mt-6 bg-neutral-900 border border-neutral-800 hover:border-neutral-750 text-neutral-200 hover:text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            Sincronizar Agora
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section Selector Subtabs */}
          <div className="flex flex-wrap gap-2 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-850 max-w-2xl text-left">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                activeTab === 'contacts'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Contatos
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Agenda
            </button>
            <button
              onClick={() => setActiveTab('meet')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                activeTab === 'meet'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              Google Meet
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                activeTab === 'drive'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              Google Drive
            </button>
          </div>

          {activeTab === 'contacts' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Add Contact Form */}
              <div className="lg:col-span-1 bg-[#1a1a1a]/50 border border-neutral-850 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserPlus className="w-4.5 h-4.5 text-orange-500" />
                  Sincronizar Novo Aluno
                </h3>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: John Doe"
                      value={newContact.fullName}
                      onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">E-mail</label>
                    <input
                      type="email"
                      placeholder="Ex: aluno@domain.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="Ex: +55 11 99999-9999"
                      value={newContact.phoneNumber}
                      onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Relacionamento / Função</label>
                    <select
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    >
                      <option value="Aluno">Aluno</option>
                      <option value="Professor">Professor</option>
                      <option value="Responsavel">Responsável</option>
                      <option value="Lead">Lead / Interessado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Observações</label>
                    <textarea
                      placeholder="Alguma nota importante sobre a graduação ou academia"
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition min-h-[60px]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sincronizar no Google Contatos'}
                  </button>
                </form>
              </div>

              {/* Sync list from Cloud SQL */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Contatos Sincronizados (Cloud SQL + Google Contacts)</h3>
                  <button
                    onClick={fetchSyncedContacts}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-orange-500 hover:text-white transition cursor-pointer"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${fetchingContacts ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {fetchingContacts ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                ) : contactsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {contactsList.map((contact) => (
                      <div key={contact.id} className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl text-left hover:border-neutral-750 transition flex flex-col justify-between">
                        <div>
                          <strong className="text-white text-sm block">👤 {contact.fullName}</strong>
                          <span className="text-[9px] uppercase font-black tracking-wider text-orange-500 inline-block mt-1.5 py-0.5 px-2 bg-orange-500/10 border border-orange-500/20 rounded-md">
                            {contact.relationship || 'Aluno'}
                          </span>
                          <div className="text-[11px] text-neutral-400 mt-2.5 space-y-1">
                            {contact.email && <div className="truncate">📧 {contact.email}</div>}
                            {contact.phoneNumber && <div>📞 {contact.phoneNumber}</div>}
                            {contact.notes && <div className="text-neutral-500 italic mt-2.5 bg-neutral-950/40 p-2 rounded-lg border border-neutral-900">"{contact.notes}"</div>}
                          </div>
                        </div>
                        <div className="text-[9px] text-neutral-500 font-semibold mt-4 text-right">
                          Sincronizado: {new Date(contact.syncedAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-850 flex flex-col items-center">
                    <Contact className="w-10 h-10 text-neutral-600 mb-3" />
                    <p className="text-xs text-neutral-500 font-bold uppercase">Nenhum contato sincronizado nesta sessão.</p>
                    <p className="text-[11px] text-neutral-600 max-w-xs mt-1">Insira os contatos à esquerda para preencher e sincronizar em nuvem no Cloud SQL.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Add Event Form */}
              <div className="lg:col-span-1 bg-[#1a1a1a]/50 border border-neutral-850 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CalendarDays className="w-4.5 h-4.5 text-orange-500" />
                  Agendar Evento no Google
                </h3>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Título do Evento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Seminário de Jiu-Jitsu ou Exame"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Início</label>
                    <input
                      type="datetime-local"
                      required
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Término</label>
                    <input
                      type="datetime-local"
                      required
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Localização</label>
                    <input
                      type="text"
                      placeholder="Ex: ACBJJ Arena"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Descrição / Notas</label>
                    <textarea
                      placeholder="Notas adicionais sobre o cronograma, palestrantes ou requisitos"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition min-h-[60px]"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1 pb-1">
                    <input
                      type="checkbox"
                      id="includeMeetCheckbox"
                      checked={newEvent.includeMeet}
                      onChange={(e) => setNewEvent({ ...newEvent, includeMeet: e.target.checked })}
                      className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                    />
                    <label htmlFor="includeMeetCheckbox" className="text-xs text-neutral-300 font-semibold cursor-pointer flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-orange-500" />
                      Incluir link do Google Meet automaticamente
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar e Agendar'}
                  </button>
                </form>
              </div>

              {/* Events list from Cloud SQL */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Eventos Sincronizados no Cloud SQL</h3>
                  <button
                    onClick={fetchSyncedEvents}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-orange-500 hover:text-white transition cursor-pointer"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${fetchingEvents ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {fetchingEvents ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                ) : eventsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {eventsList.map((event) => (
                      <div key={event.id} className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl text-left hover:border-neutral-750 transition flex flex-col justify-between">
                        <div>
                          <strong className="text-white text-sm block">📅 {event.title}</strong>
                          <div className="text-[11px] text-neutral-400 mt-2.5 space-y-1 leading-relaxed">
                            <div>🕒 Início: {new Date(event.startTime).toLocaleString('pt-BR')}</div>
                            <div>🕒 Fim: {new Date(event.endTime).toLocaleString('pt-BR')}</div>
                            {event.location && <div className="truncate">📍 Local: {event.location}</div>}
                            {event.description && <div className="text-neutral-500 italic mt-2.5 bg-neutral-950/40 p-2 rounded-lg border border-neutral-900 whitespace-pre-line">"{event.description}"</div>}
                          </div>
                        </div>
                        <div className="text-[9px] text-neutral-500 font-semibold mt-4 text-right">
                          Registrado: {new Date(event.syncedAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-850 flex flex-col items-center">
                    <Calendar className="w-10 h-10 text-neutral-600 mb-3" />
                    <p className="text-xs text-neutral-500 font-bold uppercase">Nenhum evento agendado nesta sessão.</p>
                    <p className="text-[11px] text-neutral-600 max-w-xs mt-1">Crie novos agendamentos à esquerda para sincronizá-los diretamente na sua conta do Google.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'meet' ? (
            /* Google Meet Tab */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Create Meet Room Form */}
              <div className="lg:col-span-1 bg-[#1a1a1a]/50 border border-neutral-850 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Video className="w-4.5 h-4.5 text-orange-500" />
                  Gerar Sala do Google Meet
                </h3>
                <form onSubmit={handleCreateMeetSpace} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Título / Assunto da Aula</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Aula Virtual de Jiu-Jitsu ou Reunião de Faixas Pretas"
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                    />
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                    Ao clicar no botão abaixo, uma sala de vídeo conferência oficial do <strong>Google Meet</strong> será gerada instantaneamente usando a API oficial do Google Workspace.
                  </p>

                  <button
                    type="submit"
                    disabled={creatingMeet}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15"
                  >
                    {creatingMeet ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        Criar Sala no Google Meet Agora
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Generated Meet Rooms List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Salas de Reunião Criadas no Google Meet</h3>
                  <span className="text-[10px] text-neutral-500 font-bold">{meetRooms.length} sala(s) gerada(s)</span>
                </div>

                {meetRooms.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {meetRooms.map((room) => (
                      <div key={room.id} className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl text-left hover:border-orange-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <strong className="text-white text-sm font-black">{room.title}</strong>
                          </div>
                          <p className="text-xs text-orange-400 font-mono font-bold select-all truncate max-w-md">
                            {room.meetingUri}
                          </p>
                          <span className="text-[9px] text-neutral-500 block">
                            Criado em: {new Date(room.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => copyToClipboard(room.meetingUri)}
                            className="bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-neutral-700"
                          >
                            {copiedMeetUri === room.meetingUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-300" />}
                            {copiedMeetUri === room.meetingUri ? 'Copiado!' : 'Copiar'}
                          </button>

                          <a
                            href={room.meetingUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Entrar na Sala
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-850 flex flex-col items-center">
                    <Video className="w-10 h-10 text-neutral-600 mb-3" />
                    <p className="text-xs text-neutral-500 font-bold uppercase">Nenhuma sala do Google Meet criada ainda.</p>
                    <p className="text-[11px] text-neutral-600 max-w-xs mt-1">Utilize o formulário à esquerda para gerar links instantâneos do Google Meet para suas aulas e eventos virtuais.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Google Drive Tab */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Upload to Google Drive Form */}
              <div className="lg:col-span-1 bg-[#1a1a1a]/50 border border-neutral-850 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UploadCloud className="w-4.5 h-4.5 text-orange-500" />
                  Enviar Arquivo para o Google Drive
                </h3>
                <form onSubmit={handleUploadDriveFile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">
                      Selecionar Arquivo
                    </label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setSelectedUploadFile(e.target.files?.[0] || null)}
                      className="w-full bg-neutral-950 text-neutral-300 border border-neutral-800 rounded-xl py-2 px-3 text-xs focus:border-orange-500 outline-none transition file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-500/20 file:text-orange-400 hover:file:bg-orange-500/30"
                    />
                  </div>

                  {selectedUploadFile && (
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs text-neutral-300 space-y-1">
                      <div className="font-bold text-white truncate">📄 {selectedUploadFile.name}</div>
                      <div className="text-[10px] text-neutral-500">
                        Tamanho: {(selectedUploadFile.size / 1024).toFixed(1)} KB | Tipo: {selectedUploadFile.type || 'Desconhecido'}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                    Sua conta oficial do <strong>Google Drive</strong> será utilizada para armazenar documentos, fotos de exames, contratos e arquivos acadêmicos com total segurança.
                  </p>

                  <button
                    type="submit"
                    disabled={uploadingDrive || !selectedUploadFile}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15 disabled:opacity-50"
                  >
                    {uploadingDrive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        Enviar Arquivo para o Drive
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Drive Files List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    Arquivos no Google Drive ({driveFiles.length})
                  </h3>
                  <button
                    onClick={fetchDriveFiles}
                    className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-orange-500 hover:text-white transition cursor-pointer"
                    title="Atualizar arquivos"
                  >
                    <RefreshCw className={`w-4 h-4 ${fetchingDrive ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {fetchingDrive ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                ) : driveFiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl text-left hover:border-orange-500/40 transition flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {file.mimeType?.includes('image') ? (
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : file.mimeType?.includes('pdf') ? (
                                <FileText className="w-4 h-4 text-red-400 shrink-0" />
                              ) : (
                                <File className="w-4 h-4 text-orange-400 shrink-0" />
                              )}
                              <strong className="text-white text-xs font-bold truncate block">{file.name}</strong>
                            </div>
                          </div>

                          <div className="text-[10px] text-neutral-400 space-y-0.5">
                            <div>Tipo: {file.mimeType}</div>
                            {file.createdTime && (
                              <div>Criado em: {new Date(file.createdTime).toLocaleString('pt-BR')}</div>
                            )}
                            {file.size && (
                              <div>Tamanho: {(parseInt(file.size, 10) / 1024).toFixed(1)} KB</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-neutral-850">
                          {file.webViewLink ? (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Abrir no Google Drive
                            </a>
                          ) : (
                            <span className="text-[10px] text-neutral-600">Sem link direto</span>
                          )}

                          <button
                            onClick={() => setDeleteConfirmFile({ id: file.id, name: file.name })}
                            disabled={deletingFileId === file.id}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer"
                            title="Excluir do Google Drive"
                          >
                            {deletingFileId === file.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-850 flex flex-col items-center">
                    <HardDrive className="w-10 h-10 text-neutral-600 mb-3" />
                    <p className="text-xs text-neutral-500 font-bold uppercase">Nenhum arquivo encontrado no Google Drive.</p>
                    <p className="text-[11px] text-neutral-600 max-w-xs mt-1">
                      Envie documentos, contratos ou comprovantes à esquerda para sincronizá-los com sua nuvem do Google.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal (Mandatory explicit confirmation for Drive deletion) */}
          {deleteConfirmFile && (
            <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-left space-y-4">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Confirmar Exclusão do Arquivo</h3>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Tem certeza de que deseja excluir o arquivo <strong className="text-white font-bold">"{deleteConfirmFile.name}"</strong> do seu Google Drive?
                  <br />
                  <span className="text-neutral-400 text-[11px] block mt-2">
                    Esta ação removerá o arquivo permanentemente da sua conta do Google Drive.
                  </span>
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeleteConfirmFile(null)}
                    className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDeleteDrive}
                    className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/20"
                  >
                    {deletingFileId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Confirmar Exclusão
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

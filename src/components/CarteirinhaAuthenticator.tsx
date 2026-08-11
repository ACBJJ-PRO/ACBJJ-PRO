import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { User, Student, CarteirinhaCredential, UserCarteirinhaData } from '../types';
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  X,
  History,
  QrCode,
  Lock,
} from 'lucide-react';
import {
  verifyCredentialQuery,
  verifyCarteirinhaRemoteCloudSQL,
  getCarteirinhaAuthLogs,
  getPerfilCarteirinhaLabel,
  applyAuthCodeMask,
  auditAndDeduplicateCredentials,
} from '../utils/carteirinhaUtils';

interface CarteirinhaAuthenticatorProps {
  usuarios?: User[];
  alunos?: Student[];
  currentUser?: User | null;
}

export default function CarteirinhaAuthenticator({
  usuarios = [],
  alunos = [],
  currentUser,
}: CarteirinhaAuthenticatorProps) {
  // Mode selection: 'scanner' | 'manual'
  const [activeMode, setActiveMode] = useState<'scanner' | 'manual'>('scanner');

  // Manual input state
  const [manualCode, setManualCode] = useState('');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Result state
  const [authResult, setAuthResult] = useState<{
    success: boolean;
    credential?: CarteirinhaCredential;
    userCardData?: UserCarteirinhaData;
    reason?: 'VALID' | 'NOT_FOUND' | 'EXPIRED' | 'CANCELLED' | 'REVOKED';
    message: string;
    verifiedAt?: string;
    scannedPayload?: string;
    diagnostic?: any;
  } | null>(null);

  // History state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [authLogs, setAuthLogs] = useState(() => getCarteirinhaAuthLogs());

  // Refs for camera video, canvas frame, stream and scanning lock
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Stop camera helper
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup on unmount or mode change, and run audit on mount
  useEffect(() => {
    auditAndDeduplicateCredentials();
    return () => {
      stopCamera();
    };
  }, []);

  // Enumerate video devices - filter for rear/environment cameras only
  const isFrontCameraLabel = (label: string = ''): boolean => {
    const l = label.toLowerCase();
    return (
      l.includes('front') ||
      l.includes('user') ||
      l.includes('frontal') ||
      l.includes('facing front') ||
      l.includes('selfie') ||
      l.includes('dianteira')
    );
  };

  const isRearCameraLabel = (label: string = ''): boolean => {
    if (isFrontCameraLabel(label)) return false;
    const l = label.toLowerCase();
    return (
      l.includes('back') ||
      l.includes('rear') ||
      l.includes('traseira') ||
      l.includes('environment') ||
      l.includes('facing back') ||
      l.includes('tras') ||
      l.includes('atrás')
    );
  };

  const enumerateVideoDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        // Filter out front/user-facing cameras so selector offers only rear cameras
        const rearDevices = videoDevices.filter((device) => !isFrontCameraLabel(device.label));

        setAvailableCameras(rearDevices.length > 0 ? rearDevices : videoDevices);
      }
    } catch (e) {
      console.warn('Erro ao enumerar dispositivos de vídeo:', e);
    }
  };

  // Start camera handler
  const startCamera = async (targetDeviceId?: string) => {
    setCameraError(null);
    setAuthResult(null);
    isProcessingRef.current = false;

    // Check secure context
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setCameraError('A câmera requer uma conexão segura (HTTPS).');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Nenhuma câmera disponível neste dispositivo.');
      return;
    }

    try {
      stopCamera(); // Ensure clean slate

      let stream: MediaStream | null = null;

      // Primary constraints strategy
      if (targetDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: targetDeviceId } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: targetDeviceId },
            audio: false,
          });
        }
      } else {
        // Step 1: Force environment (rear) camera via facingMode exact
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' } },
            audio: false,
          });
        } catch {
          // Step 2: Fallback to string facingMode environment
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' },
              audio: false,
            });
          } catch {
            // Step 3: Fallback to ideal environment
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
              });
            } catch {
              // Step 4: Fallback to basic video
              stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
          }
        }
      }

      if (!stream) {
        throw new Error('Não foi possível obter a transmissão de vídeo.');
      }

      streamRef.current = stream;

      // Enumerate cameras after permission is granted so device labels are available
      await enumerateVideoDevices();

      // Ensure we switch to a rear camera if the currently acquired camera is a front camera
      const currentTrack = stream.getVideoTracks()[0];
      const currentSettings = currentTrack?.getSettings();
      const currentLabel = currentTrack?.label || '';
      const isCurrentFront =
        currentSettings?.facingMode === 'user' || isFrontCameraLabel(currentLabel);

      if ((isCurrentFront || !targetDeviceId) && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');

          // Find a rear camera device
          const rearCam =
            videoInputs.find((d) => isRearCameraLabel(d.label)) ||
            videoInputs.find((d) => !isFrontCameraLabel(d.label) && d.deviceId !== currentSettings?.deviceId);

          if (rearCam && rearCam.deviceId && rearCam.deviceId !== currentSettings?.deviceId) {
            try {
              const rearStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: rearCam.deviceId } },
                audio: false,
              });
              stream.getTracks().forEach((t) => t.stop());
              stream = rearStream;
              streamRef.current = rearStream;
              setSelectedDeviceId(rearCam.deviceId);
            } catch (switchErr) {
              console.warn('Erro ao alternar para câmera traseira:', switchErr);
            }
          } else if (currentSettings?.deviceId) {
            setSelectedDeviceId(currentSettings.deviceId);
          }
        } catch (e) {
          console.warn('Erro ao verificar lista de câmeras traseiras:', e);
        }
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Erro ao acessar a câmera:', err);
      setIsCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Permissão da câmera negada. Autorize o acesso à câmera nas configurações do navegador.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmera disponível neste dispositivo.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('A câmera está sendo usada por outro aplicativo ou não pôde ser iniciada.');
      } else if (err.name === 'OverconstrainedError') {
        setCameraError(
          `Configuração de câmera incompatível${err.constraint ? ` (${err.constraint})` : ''}. Tente selecionar outra câmera.`
        );
      } else if (err.name === 'SecurityError') {
        setCameraError('Acesso à câmera bloqueado por política de segurança.');
      } else if (err.name === 'AbortError') {
        setCameraError('A inicialização da câmera foi interrompida.');
      } else {
        setCameraError('Nenhuma câmera disponível neste dispositivo.');
      }
    }
  };

  // Attach stream to video element when active and mounted
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.setAttribute('playsinline', 'true'); // Required for iOS Safari
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            requestScanFrame();
          })
          .catch((err) => {
            console.error('Erro ao reproduzir o vídeo da câmera:', err);
            requestScanFrame();
          });
      } else {
        requestScanFrame();
      }
    }
  }, [isCameraActive]);

  // Continuous frame scanning loop
  const requestScanFrame = () => {
    if (!videoRef.current || isProcessingRef.current) {
      return;
    }

    const video = videoRef.current;

    if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim().length > 0 && !isProcessingRef.current) {
          // QR Code detected! Lock immediately to prevent duplicate scans
          isProcessingRef.current = true;
          stopCamera();
          processAuthentication(code.data, 'qr_code');
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(requestScanFrame);
  };

  // Authenticate query logic
  const processAuthentication = async (query: string, method: 'qr_code' | 'codigo_manual') => {
    setIsProcessing(true);
    const verifierName = currentUser?.nome || 'Administrador';
    
    // First try direct Cloud SQL remote verification
    const remoteResult = await verifyCarteirinhaRemoteCloudSQL(query);
    let finalResult = null;

    if (remoteResult && remoteResult.credential) {
      finalResult = {
        success: remoteResult.success,
        credential: remoteResult.credential,
        holderNome: remoteResult.holderNome,
        holderFoto: remoteResult.holderFoto,
        holderPerfilLabel: remoteResult.holderPerfilLabel,
        reason: remoteResult.reason,
        message: remoteResult.message,
        scannedPayload: query,
      };
    } else {
      finalResult = verifyCredentialQuery(query, method, verifierName, usuarios, alunos, currentUser);
    }

    setAuthResult({
      ...finalResult,
      verifiedAt: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    });
    setIsProcessing(false);
    setAuthLogs(getCarteirinhaAuthLogs());
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processAuthentication(manualCode, 'codigo_manual');
  };

  // Find holder user and student details with explicit entityType separation
  const cred = authResult?.credential;
  const entityType = cred?.entityType || (cred?.id?.startsWith('student-') ? 'student' : 'user');
  const entityId = String(cred?.entityId || cred?.userId || '').replace(/^(user-|student-)/, '');

  const targetUser = (cred && entityType === 'user')
    ? usuarios.find((u) => String(u.id) === entityId) || null
    : null;
  const targetStudent = (cred && entityType === 'student')
    ? alunos.find((a) => String(a.id) === entityId) || null
    : null;

  const holderFoto = authResult?.holderFoto || targetStudent?.fotoPerfil || targetUser?.fotoPerfil || cred?.fotoPerfil || '';
  const holderNome = authResult?.holderNome || targetStudent?.nome || targetUser?.nome || cred?.userNome || 'Titular';
  const holderPerfilLabel = authResult?.holderPerfilLabel || (entityType === 'student' ? 'Atleta / Aluno' : getPerfilCarteirinhaLabel(
    targetUser?.tipo || cred?.userTipo,
    targetUser?.perfilLabel
  ));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-[10px] uppercase tracking-wider">
              Segurança e Autenticidade
            </span>
            <span className="text-xs text-neutral-500">• Validação Oficial</span>
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            Autenticação da Carteirinha Digital
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Verifique instantaneamente a autenticidade da carteirinha do atleta ou instrutor lendo o QR Code com a câmera do celular ou digitando o código impresso.
          </p>
        </div>

        <button
          onClick={() => {
            setAuthLogs(getCarteirinhaAuthLogs());
            setShowHistoryModal(true);
          }}
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold px-4 py-2.5 rounded-2xl border border-neutral-700/80 transition-all text-xs flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <History className="w-4 h-4 text-orange-400" />
          <span>Histórico de Validações</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-[#111111] p-1.5 rounded-2xl border border-neutral-800 max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveMode('scanner');
            setAuthResult(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMode === 'scanner'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Ler QR Code (Câmera)</span>
        </button>

        <button
          onClick={() => {
            stopCamera();
            setActiveMode('manual');
            setAuthResult(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMode === 'manual'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Digitar Código</span>
        </button>
      </div>

      {/* MAIN AUTHENTICATION PANEL */}
      <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto text-center space-y-6">
        {activeMode === 'scanner' ? (
          /* SCANNER MODE */
          <div className="space-y-4">
            {!isCameraActive ? (
              <div className="space-y-4 py-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400 shadow-xl">
                  <Camera className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    Leitor de QR Code
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                    Aponte a câmera do seu dispositivo para o QR Code localizado no verso da carteirinha virtual.
                  </p>
                </div>

                {cameraError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-2xl flex items-center justify-center gap-2 max-w-md mx-auto">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black py-3.5 px-8 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Ativar Câmera do Celular</span>
                </button>
              </div>
            ) : (
              /* LIVE CAMERA VIEW */
              <div className="space-y-4">
                <div className="relative w-full max-w-sm aspect-square mx-auto rounded-3xl overflow-hidden border-2 border-orange-500 shadow-2xl bg-black">
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target Overlay */}
                  <div className="absolute inset-0 border-[3px] border-orange-500/40 m-12 rounded-2xl pointer-events-none flex flex-col justify-between p-2 animate-pulse">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl" />
                      <div className="w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl" />
                      <div className="w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 inset-x-0 mx-auto bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-extrabold text-orange-400 uppercase tracking-wider w-fit border border-orange-500/30 shadow-lg">
                    Câmera ativa. Posicione o QR Code dentro da área de leitura.
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {availableCameras.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => startCamera(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-bold py-2.5 px-3 rounded-2xl outline-none cursor-pointer max-w-[220px] truncate"
                    >
                      {availableCameras.map((cam, idx) => (
                        <option key={cam.deviceId || idx} value={cam.deviceId}>
                          {cam.label || `Câmera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={stopCamera}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-extrabold py-2.5 px-6 rounded-2xl border border-neutral-700 transition-all text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Desativar Câmera
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MANUAL CODE INPUT MODE */
          <form onSubmit={handleManualSubmit} className="space-y-4 py-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-orange-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-white uppercase tracking-wider">
                Digite o Código de Autenticação
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Insira o código alfanumérico do verso da carteirinha (Ex: <span className="font-mono text-orange-400 font-bold">ACBJJ-7K4P-92XM</span> ou <span className="font-mono text-orange-400 font-bold">CARD-0001</span>)
              </p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                Código ou Credencial ID
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(applyAuthCodeMask(e.target.value))}
                placeholder="Ex: ACBJJ-7K4P-92XM ou CARD-0001-Y9DE"
                maxLength={100}
                className="w-full bg-[#0d0d0d] border border-neutral-700 focus:border-orange-500 text-white font-mono font-bold text-center text-lg py-3.5 px-4 rounded-2xl tracking-widest outline-none uppercase placeholder:text-neutral-600 transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/20 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Autenticar Carteirinha</span>
            </button>
          </form>
        )}

        {/* PROCESSING INDICATOR */}
        {isProcessing && (
          <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center gap-3 text-orange-400 font-bold text-sm animate-pulse">
            <RotateCcw className="w-5 h-5 animate-spin" />
            <span>Consultando credencial no sistema oficial...</span>
          </div>
        )}

        {/* AUTHENTICATION RESULT PANEL */}
        {authResult && !isProcessing && (
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 text-left space-y-6 transition-all animate-scale-in shadow-2xl ${
              authResult.success
                ? 'bg-emerald-950/30 border-emerald-500/60 shadow-emerald-500/10'
                : authResult.reason === 'EXPIRED'
                ? 'bg-amber-950/30 border-amber-500/60 shadow-amber-500/10'
                : 'bg-red-950/30 border-red-500/60 shadow-red-500/10'
            }`}
          >
            {/* Header Status Badge */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                {authResult.success ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                ) : authResult.reason === 'EXPIRED' ? (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}

                <div>
                  <h4
                    className={`text-lg font-black uppercase tracking-wider ${
                      authResult.success
                        ? 'text-emerald-400'
                        : authResult.reason === 'EXPIRED'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {authResult.success
                      ? '✓ CARTEIRINHA AUTENTICADA'
                      : authResult.reason === 'EXPIRED'
                      ? '⚠ CARTEIRINHA EXPIRADA'
                      : authResult.reason === 'CANCELLED'
                      ? '✕ CARTEIRINHA CANCELADA'
                      : authResult.reason === 'REVOKED'
                      ? '✕ CREDENCIAL REVOGADA'
                      : '✕ CARTEIRINHA NÃO AUTENTICADA'}
                  </h4>
                  <p className="text-xs text-neutral-300 font-medium mt-0.5">
                    {authResult.message}
                  </p>
                </div>
              </div>

              {authResult.verifiedAt && (
                <span className="text-[10px] text-neutral-400 font-mono font-semibold shrink-0 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                  {authResult.verifiedAt}
                </span>
              )}
            </div>

            {/* Holder Identity Details if matched */}
            {authResult.credential && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-black/40 p-4 rounded-2xl border border-white/10">
                {/* Photo */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-neutral-900 border-2 border-neutral-700 overflow-hidden flex items-center justify-center shadow-md">
                    {holderFoto ? (
                      <img src={holderFoto} alt={holderNome} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-neutral-600" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5">
                    {holderPerfilLabel}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="sm:col-span-2 space-y-2">
                  <div>
                    <span className="text-[8px] font-extrabold text-neutral-400 uppercase tracking-widest block">
                      Titular da Carteirinha
                    </span>
                    <h5 className="text-base font-black text-white truncate">{holderNome}</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Registro
                      </span>
                      <span className="font-mono font-extrabold text-orange-400">
                        {authResult.credential.registro}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Validade
                      </span>
                      <span className="font-extrabold text-white">
                        {authResult.userCardData?.validade || authResult.credential.validade}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Status no Sistema
                      </span>
                      <span
                        className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                          authResult.userCardData?.status === 'ativo'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {authResult.userCardData?.status?.toUpperCase() || 'INATIVO'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Código Auth
                      </span>
                      <span className="font-mono font-extrabold text-white text-[11px]">
                        {authResult.credential.authCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                        ID Credencial
                      </span>
                      <span className="font-mono font-extrabold text-amber-400 text-[11px]">
                        {authResult.credential.credentialId}
                      </span>
                    </div>
                  </div>

                  {authResult.scannedPayload && (
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Conteúdo Lido (QR Code / Query)
                      </span>
                      <span className="font-mono text-[10px] text-neutral-300 break-all bg-black/50 px-2 py-1 rounded-md block mt-0.5 border border-neutral-800">
                        {authResult.scannedPayload}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnostic Information Panel */}
            {authResult.diagnostic && (
              <div className="mt-3 p-3 bg-black/60 rounded-xl border border-neutral-800 text-[10px] font-mono text-neutral-400 space-y-1">
                <div className="text-[9px] font-extrabold text-orange-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Diagnóstico de Validação</span>
                  <span>{authResult.diagnostic.detectedType}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="text-neutral-500">Entrada Recebida: </span>
                    <span className="text-neutral-300 break-all">{authResult.diagnostic.rawInput}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Valor Normalizado: </span>
                    <span className="text-neutral-300">{authResult.diagnostic.normalizedQuery}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Registros Analisados: </span>
                    <span className="text-neutral-300">{authResult.diagnostic.searchedCount}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Credencial / Titular: </span>
                    <span className={authResult.diagnostic.credentialFound ? 'text-emerald-400' : 'text-red-400'}>
                      {authResult.diagnostic.credentialFound ? 'Localizada' : 'Não Localizada'}
                    </span>
                  </div>
                  {authResult.diagnostic.userId && (
                    <div>
                      <span className="text-neutral-500">User ID Interno: </span>
                      <span className="text-neutral-300">{authResult.diagnostic.userId}</span>
                    </div>
                  )}
                  {authResult.diagnostic.failedStep && (
                    <div className="col-span-2 text-red-400 font-semibold">
                      <span>Falha: </span>
                      <span>{authResult.diagnostic.failedStep}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setAuthResult(null);
                  setManualCode('');
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold py-2.5 px-6 rounded-2xl border border-neutral-700 transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Nova Consulta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Histórico de Autenticações Recentes
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-xl bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {authLogs.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  Nenhuma autenticação registrada até o momento.
                </div>
              ) : (
                authLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-[#0d0d0d] border border-neutral-800 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{log.userNome}</span>
                        <span className="text-[9px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                          {log.credentialId}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        Método: {log.metodo === 'qr_code' ? 'QR Code' : 'Código Digitado'} •
                        Verificado por: {log.verificadoPor || 'Admin'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border block ${
                          log.resultado === 'valido'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : log.resultado === 'expirado'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {log.resultado.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 block mt-0.5">
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

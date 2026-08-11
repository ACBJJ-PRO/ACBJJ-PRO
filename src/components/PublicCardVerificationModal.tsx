import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, User, QrCode, Award, ExternalLink } from 'lucide-react';
import { verifyCredentialQuery, verifyCarteirinhaRemoteCloudSQL } from '../utils/carteirinhaUtils';
import { CarteirinhaCredential } from '../types';
import BarcodeSvg from './BarcodeSvg';

interface PublicCardVerificationModalProps {
  code: string;
  onClose: () => void;
  usuarios?: any[];
  alunos?: any[];
  currentUser?: any;
}

export const PublicCardVerificationModal: React.FC<PublicCardVerificationModalProps> = ({
  code,
  onClose,
  usuarios = [],
  alunos = [],
  currentUser = null,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [credential, setCredential] = useState<CarteirinhaCredential | null>(null);
  const [statusReason, setStatusReason] = useState<'VALID' | 'REVOKED' | 'CANCELLED' | 'NOT_FOUND'>('NOT_FOUND');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function runVerify() {
      if (!code) {
        setLoading(false);
        setStatusReason('NOT_FOUND');
        setMessage('Nenhum código fornecido para verificação.');
        return;
      }

      setLoading(true);

      // 1. First try local storage matching (instant)
      const localResult = verifyCredentialQuery(code, 'qr_code', 'Verificador Público QR Code', usuarios, alunos, currentUser);

      if (localResult.success && localResult.credential) {
        if (isMounted) {
          setCredential(localResult.credential);
          setStatusReason(localResult.reason || 'VALID');
          setMessage(localResult.message);
          setLoading(false);
        }
      }

      // 2. Try remote Cloud SQL API matching to confirm or retrieve latest state
      try {
        const remoteRes = await verifyCarteirinhaRemoteCloudSQL(code);
        if (isMounted && remoteRes) {
          if (remoteRes.success && remoteRes.credential) {
            setCredential(remoteRes.credential);
            setStatusReason('VALID');
            setMessage(remoteRes.message || '✓ CARTEIRINHA AUTENTICADA');
          } else if (remoteRes.reason === 'REVOKED' || remoteRes.reason === 'CANCELLED') {
            setStatusReason(remoteRes.reason);
            setMessage(remoteRes.message || '✕ CARTEIRINHA NÃO AUTENTICADA');
          } else if (!localResult.success) {
            setStatusReason('NOT_FOUND');
            setMessage(remoteRes.message || '✕ CARTEIRINHA NÃO ENCONTRADA');
          }
        }
      } catch (err) {
        console.warn('Remote verification fallback:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    runVerify();

    return () => {
      isMounted = false;
    };
  }, [code]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl my-auto text-white">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-neutral-900 to-black p-4 border-b border-orange-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Award className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-wider uppercase">Arena do Competidor</h3>
              <p className="text-[11px] text-orange-300 font-medium">Autenticidade de Carteirinha Digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 p-2 rounded-full transition"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-neutral-300">Consultando autenticidade no sistema...</p>
            </div>
          ) : statusReason === 'VALID' && credential ? (
            <div className="space-y-5 animate-scaleUp">
              
              {/* Authenticated Banner */}
              <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-4 flex items-center space-x-3 text-emerald-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-200 uppercase">Carteirinha Oficial Válida</h4>
                  <p className="text-xs text-emerald-300/80">Credencial autêntica registrada no ACBJJ PRO.</p>
                </div>
              </div>

              {/* Holder Profile Card */}
              <div className="bg-neutral-800/80 border border-neutral-700 rounded-xl p-4 flex items-center space-x-4">
                {credential.fotoPerfil ? (
                  <img
                    src={credential.fotoPerfil}
                    alt={credential.userNome}
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-neutral-700 border-2 border-orange-500 flex items-center justify-center text-neutral-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-1">
                    {credential.userTipo || 'ATLETA / COMPETIDOR'}
                  </span>
                  <h3 className="font-bold text-base text-white truncate">{credential.userNome}</h3>
                  {credential.registro && (
                    <p className="text-xs font-mono text-neutral-400">REG: {credential.registro}</p>
                  )}
                </div>
              </div>

              {/* Technical Details Grid */}
              <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">CREDENCIAL ID:</span>
                  <span className="font-bold text-orange-400">{credential.credentialId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">CÓD. AUTENTICAÇÃO:</span>
                  <span className="font-bold text-white">{credential.authCode}</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">STATUS:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                    {credential.status || 'ATIVO'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">VALIDADE:</span>
                  <span className="font-bold text-neutral-200">{credential.validade || 'DEZ/2027'}</span>
                </div>
              </div>

              {/* Barcode SVG display */}
              <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center space-y-1 text-black">
                <p className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">Código de Barras Oficial</p>
                <BarcodeSvg value={credential.credentialId} height={36} width={280} />
                <p className="text-[10px] font-mono font-bold text-neutral-800">{credential.credentialId}</p>
              </div>

            </div>
          ) : (
            <div className="space-y-4 text-center py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/50 mx-auto flex items-center justify-center text-red-400">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-bold text-base text-red-300">Consulta Não Verificada</h4>
                <p className="text-xs text-neutral-400 mt-1">{message || 'Credencial não localizada no banco de dados oficial.'}</p>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-left font-mono text-xs text-neutral-400">
                <p><strong className="text-white">Código consultado:</strong> {code}</p>
                <p className="mt-1 text-[11px] text-neutral-500">Verifique se o QR Code ou código foi escaneado corretamente.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-orange-500" /> Sistema ACBJJ PRO
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg transition shadow-md"
          >
            Concluir / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default PublicCardVerificationModal;

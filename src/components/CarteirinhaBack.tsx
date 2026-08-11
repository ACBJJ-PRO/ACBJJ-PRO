import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { User, Student, CarteirinhaConfig, UserCarteirinhaData, CarteirinhaCredential } from '../types';
import { Shield, QrCode as QrIcon, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { getOrCreateUserCredential, getCarteirinhaConfig } from '../utils/carteirinhaUtils';
import BarcodeSvg from './BarcodeSvg';

interface CarteirinhaBackProps {
  user: User;
  student?: Student | null;
  config: CarteirinhaConfig;
  userCardData?: UserCarteirinhaData | null;
  credential?: CarteirinhaCredential | null;
}

export default function CarteirinhaBack({
  user,
  student,
  config: initialConfig,
  userCardData,
  credential: initialCredential,
}: CarteirinhaBackProps) {
  const [currentConfig, setCurrentConfig] = useState<CarteirinhaConfig>(() => ({
    ...getCarteirinhaConfig(),
    ...initialConfig,
  }));

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const [credentialTrigger, setCredentialTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentConfig(getCarteirinhaConfig());
      setCredentialTrigger((prev) => prev + 1);
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('arena_carteirinha_config_updated', handleUpdate);
    window.addEventListener('arena_carteirinha_credentials_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('arena_carteirinha_config_updated', handleUpdate);
      window.removeEventListener('arena_carteirinha_credentials_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (initialConfig) {
      setCurrentConfig((prev) => ({ ...getCarteirinhaConfig(), ...initialConfig }));
    }
  }, [initialConfig]);

  const config = currentConfig;
  const credential = initialCredential || getOrCreateUserCredential(
    student ? 'student' : 'user',
    student ? student.id : user.id,
    user,
    student
  );
  const status = userCardData?.status || credential.status || 'ativo';
  const validadeStr = userCardData?.validade || credential.validade || 'DEZ/2027';

  // Logo URL: Dark background strictly requires white logo
  const logoUrl = config.logoPrincipalUrl || '/Logo branca.png';

  useEffect(() => {
    let active = true;
    if (credential?.qrToken) {
      QRCode.toDataURL(credential.qrToken, { width: 300, margin: 1 })
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch(() => {
          if (active) {
            setQrDataUrl(
              `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                credential.qrToken
              )}`
            );
          }
        });
    }
    return () => {
      active = false;
    };
  }, [credential?.qrToken]);

  const bgStyle = config.versoUsarGradient !== false
    ? { background: `linear-gradient(135deg, ${config.versoCorPrincipal || '#0f0f0f'} 0%, ${config.versoCorSecundaria || '#1c1c1c'} 100%)` }
    : { backgroundColor: config.versoCorPrincipal || '#0f0f0f' };

  return (
    <div
      style={bgStyle}
      className="relative w-full aspect-[1.58/1] rounded-2xl border border-neutral-800 shadow-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden group transition-all duration-300 text-left"
    >
      {/* Glowing border frame */}
      <div className="absolute inset-0 border-2 border-orange-500/15 rounded-2xl pointer-events-none group-hover:border-orange-500/30 transition-colors duration-500" />

      {/* Institutional Watermark for Verso */}
      {config.versoMarcaDaguaExibir !== false && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
          style={{ opacity: config.versoMarcaDaguaOpacidade ?? 0.08 }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Watermark Logo"
              style={{
                width: `${config.versoMarcaDaguaTamanho ?? 100}px`,
                transform: `translate(${config.versoMarcaDaguaOffsetX ?? 0}px, ${config.versoMarcaDaguaOffsetY ?? 0}px) rotate(${config.versoMarcaDaguaRotacao ?? -10}deg)`,
                filter: config.logoUsarBranca ? 'brightness(0) invert(1)' : 'none',
              }}
            />
          ) : (
            <span
              className="font-black tracking-tighter text-orange-500 uppercase transition-all duration-150"
              style={{
                fontFamily: `'${config.fonteMarcaDagua || 'JetBrains Mono'}', monospace, sans-serif`,
                fontSize: `${config.versoMarcaDaguaTamanho ?? 100}px`,
                transform: `translate(${config.versoMarcaDaguaOffsetX ?? 0}px, ${config.versoMarcaDaguaOffsetY ?? 0}px) rotate(${config.versoMarcaDaguaRotacao ?? -10}deg)`,
                whiteSpace: 'nowrap',
              }}
            >
              {config.textoMarcaDagua || 'CBJJ'}
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center z-10">
        {config.versoLogoExibir !== false && (
          <div className="flex items-center gap-2.5">
            <div
              className="rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 overflow-hidden p-1"
              style={{ width: `${config.versoLogoTamanho || 32}px`, height: `${config.versoLogoTamanho || 32}px` }}
            >
              <img
                src={logoUrl}
                alt="Logo Branca Oficial"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h4 className="text-white text-[10px] font-black tracking-widest uppercase leading-tight">
                {config.nomeInstituicao || 'ARENA DO COMPETIDOR'}
              </h4>
              <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">
                SISTEMA OFICIAL DE IDENTIFICAÇÃO VIRTUAL
              </span>
            </div>
          </div>
        )}

        {config.versoExibirStatus !== false && (
          <span
            className={`text-[8px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${
              status === 'ativo'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}
          >
            ● {status.toUpperCase()}
          </span>
        )}
      </div>

      {/* Main Body - QR Code & Details */}
      <div className="my-auto z-10 flex items-center justify-between gap-3 py-1">
        {/* Individual QR Code */}
        <div className="flex flex-col items-center bg-white/95 p-1 rounded-xl border border-neutral-700 shadow-xl shrink-0">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code de Autenticação"
              style={{ width: `${config.versoQrTamanho || 75}px`, height: `${config.versoQrTamanho || 75}px` }}
              className="rounded-lg object-contain"
            />
          ) : (
            <div
              style={{ width: `${config.versoQrTamanho || 75}px`, height: `${config.versoQrTamanho || 75}px` }}
              className="bg-neutral-100 flex items-center justify-center rounded-lg"
            >
              <QrIcon className="w-8 h-8 text-neutral-400 animate-pulse" />
            </div>
          )}
          <span className="text-[6px] font-mono font-bold text-neutral-800 tracking-tighter mt-0.5 uppercase">
            VERIFICAÇÃO QR
          </span>
        </div>

        {/* Individual Authentication Details & Barcode */}
        <div className="flex-1 min-w-0 space-y-1 pl-1">
          <div>
            <span className="text-[6.5px] text-neutral-400 font-extrabold uppercase tracking-widest block">
              CÓDIGO DE AUTENTICAÇÃO
            </span>
            <span
              className="text-orange-400 font-black block tracking-wider truncate"
              style={{
                fontFamily: `'${config.versoCodigoFonte || 'JetBrains Mono'}', monospace`,
                fontSize: `${config.versoCodigoTamanho || 11}px`,
              }}
            >
              {credential.authCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {config.versoExibirRegistro !== false && (
              <div>
                <span className="text-[6px] text-neutral-400 font-bold uppercase tracking-wider block">
                  REGISTRO
                </span>
                <span className="text-white font-mono text-[9px] font-bold block truncate">
                  {credential.registro}
                </span>
              </div>
            )}

            {config.versoExibirValidade !== false && (
              <div>
                <span className="text-[6px] text-neutral-400 font-bold uppercase tracking-wider block">
                  VALIDADE
                </span>
                <span className="text-white font-black text-[9px] block truncate">
                  {validadeStr}
                </span>
              </div>
            )}
          </div>

          {/* Barcode representing Credencial ID */}
          <div className="pt-1.5 border-t border-neutral-800/80">
            <BarcodeSvg
              value={credential.credentialId}
              height={32}
              width={1.4}
              displayValue={true}
              background="#ffffff"
              lineColor="#000000"
              textColor="#000000"
              margin={10}
            />
          </div>
        </div>
      </div>

      {/* Footer Security Message */}
      {config.versoExibirMensagem !== false && (
        <div className="z-10 border-t border-neutral-800/80 pt-1 flex items-center gap-1.5">
          <Lock className="w-2.5 h-2.5 text-orange-500 shrink-0" />
          <p className="text-[6.5px] text-neutral-400 font-medium leading-tight truncate">
            {config.versoMensagemSeguranca ||
              'Carteirinha oficial. Autentique através do QR Code, Código de Barras ou Credencial ID.'}
          </p>
        </div>
      )}
    </div>
  );
}

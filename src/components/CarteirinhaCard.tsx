import React from 'react';
import QRCode from 'qrcode';
import { User, Student, CarteirinhaConfig, UserCarteirinhaData } from '../types';
import { Shield, User as UserIcon, Printer, QrCode, Layers, RotateCw } from 'lucide-react';
import { getPerfilCarteirinhaLabel, getCarteirinhaConfig, getOrCreateUserCredential } from '../utils/carteirinhaUtils';
import CarteirinhaBack from './CarteirinhaBack';

interface CarteirinhaCardProps {
  user: User;
  student?: Student | null;
  config: CarteirinhaConfig;
  userCardData?: UserCarteirinhaData | null;
  showPrintButton?: boolean;
  isSimulatedAvatar?: boolean;
}

export const BrazilFlagSvg = () => (
  <svg className="w-3.5 h-2.5 inline-block ml-1 rounded-[1px] shadow-sm shrink-0" viewBox="0 0 720 504" fill="none">
    <rect width="720" height="504" fill="#009933" />
    <polygon points="360,36 684,252 360,468 36,252" fill="#FFCC00" />
    <circle cx="360" cy="252" r="126" fill="#002776" />
    <path d="M 238,270 A 136,136 0 0,1 482,234" stroke="#FFFFFF" strokeWidth="16" />
  </svg>
);

export default function CarteirinhaCard({
  user,
  student,
  config: initialConfig,
  userCardData,
  showPrintButton = true,
  isSimulatedAvatar = false,
}: CarteirinhaCardProps) {
  const [currentConfig, setCurrentConfig] = React.useState<CarteirinhaConfig>(() => ({
    ...getCarteirinhaConfig(),
    ...initialConfig,
  }));

  const [activeSide, setActiveSide] = React.useState<'frente' | 'verso' | 'ambos'>('frente');

  const [credentialTrigger, setCredentialTrigger] = React.useState(0);

  React.useEffect(() => {
    const handleConfigUpdate = () => {
      setCurrentConfig(getCarteirinhaConfig());
      setCredentialTrigger((prev) => prev + 1);
    };
    window.addEventListener('storage', handleConfigUpdate);
    window.addEventListener('arena_carteirinha_config_updated', handleConfigUpdate);
    window.addEventListener('arena_carteirinha_credentials_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('storage', handleConfigUpdate);
      window.removeEventListener('arena_carteirinha_config_updated', handleConfigUpdate);
      window.removeEventListener('arena_carteirinha_credentials_updated', handleConfigUpdate);
    };
  }, []);

  React.useEffect(() => {
    if (initialConfig) {
      setCurrentConfig((prev) => ({ ...getCarteirinhaConfig(), ...initialConfig }));
    }
  }, [initialConfig]);

  const config = currentConfig;
  const credential = student
    ? getOrCreateUserCredential('student', student.id, null, student)
    : getOrCreateUserCredential('user', user.id, user, null);
  const roleLabel = student ? 'Atleta / Aluno' : getPerfilCarteirinhaLabel(user.tipo, user.perfilLabel);

  const foto = student?.fotoPerfil || user.fotoPerfil || '';
  const rawProf = student?.professorResponsavelNome || user.professorResponsavelNome || 'PROFESSOR YURI CRUZ';
  const professorNome = rawProf.replace(/Y+URI/gi, 'YURI').replace(/\bURI\b/gi, 'YURI');
  const turmaNome = (student as any)?.turma || (user as any)?.turma || 'Turma Principal';

  const regNumber = credential.registro || (student?.id
    ? `ACBJJ2026${String(student.id).padStart(3, '0')}`
    : `ACBJJ2026${String(user.id).padStart(3, '0')}`);

  const status = userCardData?.status || credential.status || 'ativo';
  const validadeStr = userCardData?.validade || credential.validade || 'DEZ/2026';

  const rawCpf = student?.cpf || user.cpf || '';
  const isCpfProvisorio = Boolean(user.isCpfProvisorio || student?.isCpfProvisorio || rawCpf.startsWith('INF-') || rawCpf.startsWith('IIP-'));
  const cleanCpfDigits = rawCpf.replace(/\D/g, '');
  const hasValidCpf = !isCpfProvisorio && cleanCpfDigits.length === 11;
  const formattedCpf = hasValidCpf
    ? `CPF: ${cleanCpfDigits.slice(0, 3)}.${cleanCpfDigits.slice(3, 6)}.${cleanCpfDigits.slice(6, 9)}-${cleanCpfDigits.slice(9)}`
    : '';
  const isIIPProvisorio = isCpfProvisorio || !hasValidCpf;
  const iipLabel = rawCpf ? (rawCpf.startsWith('INF-') ? `IIP Provisório: ${rawCpf}` : rawCpf.startsWith('IIP-') ? `IIP Provisório: ${rawCpf}` : `IIP Provisório: ${rawCpf}`) : 'IIP Provisório: INF-PROVISORIO';

  const beltName = student?.faixa || user.faixa || 'Faixa Branca';
  const isPreta = beltName.toLowerCase().includes('preta');
  const isBranca = beltName.toLowerCase().includes('branca');
  const isCinza = beltName.toLowerCase().includes('cinza');
  const isAmarela = beltName.toLowerCase().includes('amarela');
  const isLaranja = beltName.toLowerCase().includes('laranja');
  const isVerde = beltName.toLowerCase().includes('verde');
  const isAzul = beltName.toLowerCase().includes('azul');
  const isRoxa = beltName.toLowerCase().includes('roxa');
  const isMarrom = beltName.toLowerCase().includes('marrom');

  let beltBg = 'bg-white border border-neutral-300';
  let beltText = 'text-black';
  let barBg = 'bg-black';

  if (isPreta) { beltBg = 'bg-black border border-neutral-800'; beltText = 'text-white'; barBg = 'bg-red-600'; }
  else if (isMarrom) { beltBg = 'bg-[#5c3818]'; beltText = 'text-white'; barBg = 'bg-black'; }
  else if (isRoxa) { beltBg = 'bg-purple-800'; beltText = 'text-white'; barBg = 'bg-black'; }
  else if (isAzul) { beltBg = 'bg-blue-700'; beltText = 'text-white'; barBg = 'bg-black'; }
  else if (isVerde) { beltBg = 'bg-emerald-700'; beltText = 'text-white'; barBg = 'bg-black'; }
  else if (isLaranja) { beltBg = 'bg-orange-500'; beltText = 'text-white'; barBg = 'bg-black'; }
  else if (isAmarela) { beltBg = 'bg-yellow-400'; beltText = 'text-black'; barBg = 'bg-black'; }
  else if (isCinza) { beltBg = 'bg-neutral-500'; beltText = 'text-white'; barBg = 'bg-black'; }
  else if (isBranca) { beltBg = 'bg-white border border-neutral-400'; beltText = 'text-black'; barBg = 'bg-black'; }

  const handleImprimir = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups para imprimir/baixar o PDF da sua carteirinha.');
      return;
    }

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(credential.qrToken, { width: 300, margin: 1 });
    } catch (e) {
      console.error('Erro ao gerar QR Code para impressão:', e);
    }

    let cssBeltBg = 'background-color: #ffffff; color: #000000; border: 1px solid #ccc;';
    let cssBarBg = 'background-color: #000000;';
    if (isPreta) { cssBeltBg = 'background-color: #000000; color: #ffffff; border: 1px solid #333;'; cssBarBg = 'background-color: #dc2626;'; }
    else if (isMarrom) { cssBeltBg = 'background-color: #5c3818; color: #ffffff;'; cssBarBg = 'background-color: #000000;'; }
    else if (isRoxa) { cssBeltBg = 'background-color: #6b21a8; color: #ffffff;'; cssBarBg = 'background-color: #000000;'; }
    else if (isAzul) { cssBeltBg = 'background-color: #1d4ed8; color: #ffffff;'; cssBarBg = 'background-color: #000000;'; }
    else if (isVerde) { cssBeltBg = 'background-color: #047857; color: #ffffff;'; cssBarBg = 'background-color: #000000;'; }
    else if (isLaranja) { cssBeltBg = 'background-color: #f97316; color: #ffffff;'; cssBarBg = 'background-color: #000000;'; }
    else if (isAmarela) { cssBeltBg = 'background-color: #facc15; color: #000000;'; cssBarBg = 'background-color: #000000;'; }
    else if (isCinza) { cssBeltBg = 'background-color: #737373; color: #ffffff;'; cssBarBg = 'background-color: #000000;'; }
    else if (isBranca) { cssBeltBg = 'background-color: #ffffff; color: #000000; border: 1px solid #bbb;'; cssBarBg = 'background-color: #000000;'; }

    const photoHtml = foto
      ? `<img src="${foto}" style="width: 100%; height: 100%; object-fit: cover;" />`
      : `<div style="font-size: 36px; color: #555; text-align: center; line-height: 85px;">🥋</div>`;

    const bgStyleFront = config.usarGradient
      ? `background: linear-gradient(135deg, ${config.corPrincipal || '#0f0f0f'} 0%, ${config.corSecundaria || '#1c1c1c'} 100%);`
      : `background-color: ${config.corPrincipal || '#0f0f0f'};`;

    const bgStyleBack = config.versoUsarGradient !== false
      ? `background: linear-gradient(135deg, ${config.versoCorPrincipal || '#0f0f0f'} 0%, ${config.versoCorSecundaria || '#1c1c1c'} 100%);`
      : `background-color: ${config.versoCorPrincipal || '#0f0f0f'};`;

    const logoHtml = `<div style="display: flex; align-items: center; gap: 8px;">
         <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 3px; box-sizing: border-box;">
           ${config.logoPrincipalUrl
             ? `<img src="${config.logoPrincipalUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: ${config.logoUsarBranca ? 'brightness(0) invert(1)' : 'none'};" />`
             : `<span style="font-size: 18px; color: white;">🛡️</span>`}
         </div>
         <div>
           <div style="font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">${config.nomeInstituicao || 'ARENA DO COMPETIDOR'}</div>
           ${config.exibirNumeroAcademia ? `<div style="font-size: 8px; color: #aaa; font-weight: bold; letter-spacing: 1px;">ID ACADEMIA: ${config.numeroAcademia || '#9240'}</div>` : ''}
         </div>
       </div>`;

    const flagSvgString = `<svg style="width: 14px; height: 10px; display: inline-block; vertical-align: middle; margin-left: 4px; border-radius: 1px;" viewBox="0 0 720 504">
      <rect width="720" height="504" fill="#009933"/>
      <polygon points="360,36 684,252 360,468 36,252" fill="#FFCC00"/>
      <circle cx="360" cy="252" r="126" fill="#002776"/>
      <path d="M 238,270 A 136,136 0 0,1 482,234" stroke="#FFFFFF" stroke-width="16"/>
    </svg>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Carteira Virtual (Frente + Verso) ${config.textoMarcaDagua || 'ACBJJ'} - ${user.nome}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@700;900&display=swap');
            
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background-color: #0a0a0a;
              font-family: 'Inter', sans-serif;
              color: #ffffff;
            }

            .print-page {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            }

            .card {
              width: 500px;
              height: 315px;
              border: 1px solid #333;
              border-radius: 18px;
              padding: 20px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              box-shadow: 0 12px 35px rgba(0,0,0,0.6);
              overflow: hidden;
            }

            .card.frente {
              ${bgStyleFront}
            }

            .card.verso {
              ${bgStyleBack}
            }

            .cut-line {
              width: 500px;
              border-top: 2px dashed #f97316;
              text-align: center;
              margin: 10px 0;
              position: relative;
            }

            .cut-label {
              background-color: #0a0a0a;
              color: #f97316;
              font-size: 10px;
              font-weight: 900;
              font-family: 'JetBrains Mono', monospace;
              padding: 0 10px;
              position: relative;
              top: -8px;
              display: inline-block;
              letter-spacing: 1px;
            }

            .card::before {
              content: '';
              position: absolute;
              inset: 0;
              border: 2px solid rgba(249, 115, 22, 0.15);
              border-radius: 18px;
              pointer-events: none;
            }

            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(calc(-50% + ${config.offsetXMarcaDagua ?? 55}px), calc(-50% + ${config.offsetYMarcaDagua ?? 30}px)) rotate(${config.rotacaoMarcaDagua ?? 0}deg);
              font-size: ${config.tamanhoFonteMarcaDagua ?? 120}px;
              font-weight: 900;
              font-family: '${config.fonteMarcaDagua || 'JetBrains Mono'}', monospace, sans-serif;
              color: #f97316;
              opacity: ${config.opacidadeMarcaDagua ?? 0.06};
              pointer-events: none;
              user-select: none;
              white-space: nowrap;
              z-index: 0;
              letter-spacing: -3px;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 10;
            }

            .status-badge {
              font-size: 8px;
              background-color: ${status === 'ativo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
              color: ${status === 'ativo' ? '#10b981' : '#ef4444'};
              border: 1px solid ${status === 'ativo' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
              padding: 4px 10px;
              border-radius: 99px;
              font-weight: 900;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            .content {
              display: flex;
              gap: 16px;
              align-items: center;
              margin: auto 0;
              z-index: 10;
            }

            .photo {
              width: 85px;
              height: 85px;
              border-radius: 12px;
              border: 2px solid #333;
              background-color: #111;
              overflow: hidden;
              flex-shrink: 0;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
            }

            .metadata {
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex-grow: 1;
              min-width: 0;
            }

            .meta-item {
              display: flex;
              flex-direction: column;
            }

            .meta-label {
              font-size: 7px;
              color: #888;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .meta-val {
              font-size: 13px;
              font-weight: 900;
              color: #fff;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .meta-val.reg {
              color: #f97316;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
            }

            .meta-val.prof {
              color: #ddd;
              font-size: 11px;
              font-weight: 700;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 1px solid rgba(255,255,255,0.1);
              padding-top: 10px;
              z-index: 10;
            }

            .location-text {
              font-size: 8px;
              font-weight: 800;
              color: #aaa;
              display: flex;
              align-items: center;
              gap: 2px;
              letter-spacing: 0.5px;
              margin-top: 3px;
            }

            .belt {
              height: 24px;
              border-radius: 5px;
              padding: 0 10px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              min-width: 130px;
              position: relative;
              overflow: hidden;
              box-sizing: border-box;
              ${cssBeltBg}
            }

            .belt-bar {
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 34px;
              ${cssBarBg}
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .belt-stripe {
              display: flex;
              gap: 2px;
            }

            .stripe {
              width: 2px;
              height: 12px;
              background-color: #fff;
            }

            @media print {
              body {
                background-color: #ffffff;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .card {
                box-shadow: none;
                border: 1px solid #111;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .cut-label {
                background-color: #ffffff;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-page">
            <!-- FRENTE DA CARTEIRINHA -->
            <div class="card frente">
              ${config.exibirMarcaDagua ? `<div class="watermark">${config.textoMarcaDagua || 'ACBJJ'}</div>` : ''}

              <div class="header">
                ${logoHtml}
                ${config.exibirStatus ? `<div class="status-badge">● ${status.toUpperCase()}</div>` : ''}
              </div>

              <div class="content">
                ${config.exibirFoto ? `
                  <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0; max-width: 95px;">
                    <div class="photo">${photoHtml}</div>
                    <div style="margin-top: 3px; text-align: center; font-size: 7.5px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: ${isIIPProvisorio ? '#fcd34d' : '#ddd'}; letter-spacing: -0.2px;">
                      ${hasValidCpf && !isIIPProvisorio ? formattedCpf : iipLabel}
                    </div>
                  </div>
                ` : ''}
                
                <div class="metadata">
                  ${config.exibirNome ? `
                    <div class="meta-item">
                      <span class="meta-label">${roleLabel}</span>
                      <span class="meta-val">${user.nome}</span>
                    </div>
                  ` : ''}

                  <div class="grid">
                    ${config.exibirRegistro ? `
                      <div class="meta-item">
                        <span class="meta-label">Registro ${config.textoMarcaDagua || 'ACBJJ'}</span>
                        <span class="meta-val reg">${regNumber}</span>
                      </div>
                    ` : ''}

                    ${config.exibirProfessor ? `
                      <div class="meta-item">
                        <span class="meta-label">Professor</span>
                        <span class="meta-val prof">${professorNome}</span>
                      </div>
                    ` : ''}

                    ${config.exibirTurma ? `
                      <div class="meta-item">
                        <span class="meta-label">Turma</span>
                        <span class="meta-val prof">${turmaNome}</span>
                      </div>
                    ` : ''}

                    ${config.exibirGraduacao ? `
                      <div class="meta-item">
                        <span class="meta-label">Graduação</span>
                        <span class="meta-val prof">${beltName}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>

              <div class="footer">
                <div>
                  ${config.exibirValidade ? `
                    <div class="meta-item">
                      <span class="meta-label">Validade</span>
                      <span style="font-size: 10px; font-weight: 900; color: #fff;">${validadeStr}</span>
                    </div>
                  ` : ''}
                  ${config.exibirLocalizacao ? `
                    <div class="location-text">
                      <span>${config.localizacaoTexto || 'São Luís – Maranhão / Brasil'}</span>
                      ${config.exibirBandeiraBrasil ? flagSvgString : ''}
                    </div>
                  ` : ''}
                </div>

                ${config.exibirGraduacao ? `
                  <div class="belt">
                    <span>${beltName.replace('Faixa ', '')}</span>
                    <div class="belt-bar">
                      <div class="belt-stripe">
                        <div class="stripe"></div>
                        <div class="stripe"></div>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- LINHA DE CORTE / DOBRA -->
            <div class="cut-line">
              <span class="cut-label">✂ LINHA DE CORTE E DOBRA PARA ENCADERNAÇÃO</span>
            </div>

            <!-- VERSO DA CARTEIRINHA -->
            <div class="card verso">
              <div class="header">
                ${logoHtml}
                <div class="status-badge">● ${status.toUpperCase()}</div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: auto 0; z-index: 10;">
                <div style="background-color: #ffffff; padding: 6px; border-radius: 12px; flex-shrink: 0;">
                  ${qrDataUrl ? `<img src="${qrDataUrl}" style="width: 85px; height: 85px; display: block;" />` : ''}
                  <div style="font-size: 6px; font-weight: 900; color: #000; text-align: center; margin-top: 2px;">AUTENTICAÇÃO OFICIAL</div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                  <div>
                    <span style="font-size: 7px; color: #888; font-weight: 900; text-transform: uppercase;">CÓDIGO DE AUTENTICAÇÃO</span>
                    <div style="font-size: 13px; font-weight: 900; color: #f97316; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px;">
                      ${credential.authCode}
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    <div>
                      <span style="font-size: 7px; color: #888; font-weight: bold;">REGISTRO</span>
                      <div style="font-size: 10px; font-weight: 900; color: #fff; font-family: 'JetBrains Mono', monospace;">${credential.registro}</div>
                    </div>
                    <div>
                      <span style="font-size: 7px; color: #888; font-weight: bold;">VALIDADE</span>
                      <div style="font-size: 10px; font-weight: 900; color: #fff;">${validadeStr}</div>
                    </div>
                  </div>

                  <div style="font-size: 7px; color: #aaa; font-family: 'JetBrains Mono', monospace;">
                    CREDENCIAL ID: ${credential.credentialId}
                  </div>
                </div>
              </div>

              <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; font-size: 7px; color: #aaa; z-index: 10;">
                🔒 ${config.versoMensagemSeguranca || 'Carteirinha oficial. Autentique esta identificação através do QR Code ou código de autenticação no sistema Arena do Competidor.'}
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const bgStyle = config.usarGradient
    ? { background: `linear-gradient(135deg, ${config.corPrincipal || '#0f0f0f'} 0%, ${config.corSecundaria || '#1c1c1c'} 100%)` }
    : { backgroundColor: config.corPrincipal || '#0f0f0f' };

  return (
    <div className="space-y-4">
      {/* Side Switcher Control Tabs */}
      <div className="flex bg-[#111111] p-1 rounded-2xl border border-neutral-800 max-w-xs mx-auto">
        <button
          onClick={() => setActiveSide('frente')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer ${
            activeSide === 'frente'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Frente
        </button>
        <button
          onClick={() => setActiveSide('verso')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer ${
            activeSide === 'verso'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Verso
        </button>
        <button
          onClick={() => setActiveSide('ambos')}
          className={`flex-1 py-1.5 px-3 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer ${
            activeSide === 'ambos'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Ambos
        </button>
      </div>

      {/* PHYSICAL DIGITAL CARDS VIEW */}
      <div className="space-y-4">
        {/* FRONT CARD */}
        {(activeSide === 'frente' || activeSide === 'ambos') && (
          <div
            style={bgStyle}
            className="relative w-full aspect-[1.58/1] rounded-2xl border border-neutral-800 shadow-2xl p-5 flex flex-col justify-between overflow-hidden group transition-all duration-300"
          >
            {/* Glowing border frame */}
            <div className="absolute inset-0 border-2 border-orange-500/15 rounded-2xl pointer-events-none group-hover:border-orange-500/30 transition-colors duration-500" />

            {/* Institutional Watermark ACBJJ */}
            {config.exibirMarcaDagua && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
                style={{ opacity: config.opacidadeMarcaDagua ?? 0.06 }}
              >
                <span
                  className="font-black tracking-tighter text-orange-500 uppercase transition-all duration-150"
                  style={{
                    fontFamily: `'${config.fonteMarcaDagua || 'JetBrains Mono'}', monospace, sans-serif`,
                    fontSize: `${config.tamanhoFonteMarcaDagua ?? 120}px`,
                    transform: `translate(${config.offsetXMarcaDagua ?? 55}px, ${config.offsetYMarcaDagua ?? 30}px) rotate(${config.rotacaoMarcaDagua ?? 0}deg)`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {config.textoMarcaDagua || 'ACBJJ'}
                </span>
              </div>
            )}

            {/* Card Header */}
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 overflow-hidden p-1">
                  {config.logoPrincipalUrl ? (
                    <img
                      src={config.logoPrincipalUrl}
                      alt="Logo da Academia"
                      className={`max-w-full max-h-full object-contain ${config.logoUsarBranca ? 'brightness-0 invert' : ''}`}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Shield className="w-5 h-5 text-white shrink-0" />
                  )}
                </div>
                <div>
                  <h4 className="text-white text-[11px] font-black tracking-widest uppercase leading-tight">
                    {config.nomeInstituicao || 'ARENA DO COMPETIDOR'}
                  </h4>
                  {config.exibirNumeroAcademia && (
                    <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block">
                      ID DA ACADEMIA: {config.numeroAcademia || '#9240'}
                    </span>
                  )}
                </div>
              </div>

              {config.exibirStatus && (
                <div className="text-right">
                  <span
                    className={`text-[8px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                      status === 'ativo'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}
                  >
                    ● {status.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="flex gap-4 items-center my-auto z-10">
              {config.exibirFoto && (
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 border-2 border-neutral-700/80 overflow-hidden shrink-0 shadow-lg flex items-center justify-center relative">
                    {isSimulatedAvatar ? (
                      <div className="w-full h-full flex flex-col items-center justify-between p-1 bg-neutral-900 relative">
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px] pointer-events-none" />
                        <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shadow-inner mt-1">
                          <UserIcon className="w-5 h-5 text-neutral-400" />
                        </div>
                        <span className="text-[7px] font-black tracking-tighter text-orange-400 uppercase bg-orange-500/10 px-1 py-0.5 rounded border border-orange-500/20 w-full text-center truncate z-10">
                          FOTO ATLETA
                        </span>
                      </div>
                    ) : foto ? (
                      <img src={foto} alt={user.nome} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-neutral-700" />
                    )}
                  </div>
                  <div className="mt-1 text-center max-w-[105px]">
                    {hasValidCpf && !isIIPProvisorio ? (
                      <span className="text-[7.5px] font-mono font-bold text-neutral-300 block tracking-tight">
                        {formattedCpf}
                      </span>
                    ) : (
                      <span className="text-[7.5px] font-mono font-bold text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 block tracking-tight truncate" title={iipLabel}>
                        {iipLabel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="space-y-1.5 flex-1 min-w-0 text-left">
                {config.exibirNome && (
                  <div>
                    <span className="text-[7px] text-neutral-400 font-extrabold uppercase tracking-widest block">
                      {roleLabel}
                    </span>
                    <h5 className="text-white text-xs sm:text-sm font-black truncate leading-tight">{user.nome}</h5>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {config.exibirRegistro && (
                    <div>
                      <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">
                        Registro {config.textoMarcaDagua || 'ACBJJ'}
                      </span>
                      <span className="text-orange-500 font-mono text-[10px] font-bold block truncate">
                        {regNumber}
                      </span>
                    </div>
                  )}

                  {config.exibirProfessor && (
                    <div>
                      <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">
                        Professor
                      </span>
                      <span className="text-neutral-200 text-[10px] font-bold block truncate">
                        {professorNome}
                      </span>
                    </div>
                  )}

                  {config.exibirTurma && (
                    <div>
                      <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">
                        Turma
                      </span>
                      <span className="text-neutral-200 text-[10px] font-bold block truncate">
                        {turmaNome}
                      </span>
                    </div>
                  )}

                  {config.exibirGraduacao && (
                    <div>
                      <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">
                        Graduação
                      </span>
                      <span className="text-neutral-200 text-[10px] font-bold block truncate">
                        {beltName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex justify-between items-end z-10 border-t border-neutral-800/60 pt-2.5">
              <div className="text-left">
                {config.exibirValidade && (
                  <div>
                    <span className="text-[7px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Validade
                    </span>
                    <span className="text-neutral-200 font-black text-[9px]">{validadeStr}</span>
                  </div>
                )}

                {config.exibirLocalizacao && (
                  <div className="flex items-center gap-1 text-[8px] font-bold text-neutral-400 mt-0.5">
                    <span>📍 {config.localizacaoTexto || 'São Luís – Maranhão / Brasil'}</span>
                    {config.exibirBandeiraBrasil && <BrazilFlagSvg />}
                  </div>
                )}
              </div>

              {config.exibirGraduacao && (
                <div
                  className={`relative h-6 rounded px-2 flex items-center justify-between gap-3 overflow-hidden font-mono text-[9px] font-black uppercase tracking-wider ${beltBg} ${beltText} min-w-[115px] shadow-sm`}
                >
                  <span>{beltName.replace('Faixa ', '')}</span>
                  <div className={`absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center ${barBg} text-white`}>
                    <div className="flex gap-0.5 justify-center">
                      <div className="w-0.5 h-3 bg-white" />
                      <div className="w-0.5 h-3 bg-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BACK CARD */}
        {(activeSide === 'verso' || activeSide === 'ambos') && (
          <CarteirinhaBack
            user={user}
            student={student}
            config={config}
            userCardData={userCardData}
            credential={credential}
          />
        )}
      </div>

      {/* PRINT / DOWNLOAD PDF BUTTON */}
      {showPrintButton && (
        <button
          onClick={handleImprimir}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm uppercase tracking-wider cursor-pointer active:scale-[0.98]"
        >
          <Printer className="w-5 h-5 text-white" />
          <span>Imprimir Frente e Verso em Folha Única (PDF)</span>
        </button>
      )}
    </div>
  );
}

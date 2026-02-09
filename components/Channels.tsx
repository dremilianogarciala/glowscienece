
import React, { useState } from 'react';
import { Phone, Instagram, MessageCircle, Link2, ExternalLink, ShieldCheck, Zap, X, Key, Save, QrCode, Smartphone, Loader2, CheckCircle2, AlertTriangle, Webhook, Copy, Facebook } from 'lucide-react';
import { ChannelConfig } from '../types';

interface ChannelsProps {
  channels: ChannelConfig[];
  setChannels: React.Dispatch<React.SetStateAction<ChannelConfig[]>>;
}

const Channels: React.FC<ChannelsProps> = ({ channels, setChannels }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  
  // Connection Logic State
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'WEBHOOK'>('LOGIN');
  const [connectionStep, setConnectionStep] = useState<'IDLE' | 'SCANNING' | 'CONNECTING' | 'SUCCESS'>('IDLE');
  const [simulationStatus, setSimulationStatus] = useState<string>(''); // For visual feedback during connection
  
  // Inputs
  const [webhookToken, setWebhookToken] = useState('');
  const [tokenTouched, setTokenTouched] = useState(false);
  
  // Webhook URL pointing to our local server port 3001
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  const webhookUrl = `${backendUrl}/api/webhook`;

  const getIcon = (id: string) => {
    switch (id) {
      case 'whatsapp': return Phone;
      case 'instagram': return Instagram;
      case 'messenger': return MessageCircle;
      default: return Link2;
    }
  };

  const openConfig = (id: string) => {
    setActiveChannelId(id);
    const ch = channels.find(c => c.id === id);
    
    // Reset states
    setConnectionStep('IDLE');
    setSimulationStatus('');
    setWebhookToken('');
    setTokenTouched(false);
    
    // Default to Login tab unless it was connected via webhook
    if (ch?.credentials?.method === 'WEBHOOK') {
        setActiveTab('WEBHOOK');
        setWebhookToken(ch.credentials.webhookVerifyToken || '');
    } else {
        setActiveTab('LOGIN');
    }

    setModalOpen(true);
  };

  const simulateConnection = () => {
    setConnectionStep('CONNECTING');
    
    // Step 1: Initiating
    setSimulationStatus('Conectando con Meta Platforms...');
    
    setTimeout(() => {
        // Step 2: Fetching Accounts
        const channelName = activeChannelId === 'instagram' ? 'Instagram' : 'Facebook Pages';
        setSimulationStatus(`Obteniendo cuentas de ${channelName}...`);
        
        setTimeout(() => {
             // Step 3: Verifying Permissions
             setSimulationStatus('Verificando permisos de mensajería...');
             
             setTimeout(() => {
                setConnectionStep('SUCCESS');
                setSimulationStatus('');
                setTimeout(() => {
                    handleSave('OAUTH'); 
                }, 1500);
             }, 1500);
        }, 1500);
    }, 1500);
  };

  const handleSave = (method: 'OAUTH' | 'WEBHOOK') => {
    if (!activeChannelId) return;
    
    let credentials: ChannelConfig['credentials'] = { method };

    if (method === 'OAUTH') {
        // Generate mock credentials specific to the channel for realism
        const isInsta = activeChannelId === 'instagram';
        credentials.accessToken = `mock_${isInsta ? 'ig' : 'fb'}_token_${Date.now()}`;
        credentials.accountId = isInsta ? "IG-8829102" : "FB-1102938";
    } else {
        if (!webhookToken.trim()) {
            setTokenTouched(true);
            return;
        }
        credentials.webhookVerifyToken = webhookToken.trim();
        credentials.webhookCallbackUrl = webhookUrl;
    }

    setChannels(prev => prev.map(c => {
      if (c.id === activeChannelId) {
        return {
          ...c,
          connected: true,
          credentials
        };
      }
      return c;
    }));
    setModalOpen(false);
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const ActiveIcon = activeChannel ? getIcon(activeChannel.id) : Link2;

  // --- RENDERERS ---

  const renderWhatsAppContent = () => (
      <div className="flex flex-col items-center text-center space-y-6 py-4">
          {connectionStep === 'IDLE' && (
              <>
                <div className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-xl relative group cursor-pointer" onClick={() => setConnectionStep('SCANNING')}>
                    <QrCode className="w-48 h-48 text-slate-800" />
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-lg">
                        <span className="font-bold text-slate-800 flex items-center gap-2"><Smartphone className="w-5 h-5" /> Simular Escaneo</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-white">Escanea para conectar</h4>
                    <ol className="text-sm text-slate-500 dark:text-slate-400 text-left list-decimal list-inside space-y-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                        <li>Abre WhatsApp en tu teléfono</li>
                        <li>Ve a Menú {'>'} Dispositivos vinculados</li>
                        <li>Toca en "Vincular un dispositivo"</li>
                        <li>Apunta tu cámara al código QR</li>
                    </ol>
                </div>
              </>
          )}

          {connectionStep === 'SCANNING' && (
              <div className="flex flex-col items-center py-12 animate-in fade-in">
                  <div className="relative">
                      <Smartphone className="w-24 h-24 text-emerald-500 animate-pulse" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-100 rounded-full -z-10 animate-ping"></div>
                  </div>
                  <p className="mt-8 font-bold text-emerald-700">Conectando con WhatsApp...</p>
                  {(() => { setTimeout(simulateConnection, 1500); return null; })()}
              </div>
          )}
      </div>
  );

  const renderMetaContent = () => (
    <div className="w-full">
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-6">
            <button 
                onClick={() => setActiveTab('LOGIN')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'LOGIN' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}
            >
                Iniciar Sesión (Recomendado)
            </button>
            <button 
                onClick={() => setActiveTab('WEBHOOK')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'WEBHOOK' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}
            >
                Webhook Manual
            </button>
        </div>

        {activeTab === 'LOGIN' ? (
            <div className="flex flex-col items-center text-center space-y-8 py-4">
                <div className="w-20 h-20 bg-[#1877F2] rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                     <Facebook className="w-10 h-10 text-white fill-current" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">Conectar con Facebook</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                        {activeChannelId === 'instagram' 
                            ? "Vincula tu cuenta de Instagram Business a través de Facebook Login." 
                            : "Da permisos a OmniAgent para gestionar tu Fanpage y Messenger."}
                    </p>
                </div>
                <button 
                    onClick={simulateConnection}
                    className="bg-[#1877F2] text-white w-full py-4 rounded-xl font-bold text-lg hover:bg-[#166fe5] transition-colors shadow-lg flex items-center justify-center gap-3"
                >
                    <Facebook className="w-6 h-6 fill-current" />
                    Continuar con Facebook
                </button>
                <p className="text-[10px] text-slate-400">
                    Se abrirá una ventana emergente segura de Meta.
                </p>
            </div>
        ) : (
            <div className="space-y-6">
                 <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Avanzado: Configura estos datos en el panel de desarrolladores de Meta.</span>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-2">Callback URL</label>
                    <div className="flex gap-2">
                        <input 
                            readOnly
                            value={webhookUrl}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-mono text-slate-600 dark:text-slate-300 outline-none"
                        />
                        <button 
                             onClick={() => { navigator.clipboard.writeText(webhookUrl); alert('Copiado!'); }}
                             className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Copia esto en el campo "Webhook URL" de Meta.</p>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-2 flex items-center gap-2">
                        Verify Token <Key className="w-3 h-3 text-slate-400" />
                    </label>
                    <input 
                        value={webhookToken}
                        onBlur={() => setTokenTouched(true)}
                        onChange={(e) => {
                          setWebhookToken(e.target.value);
                          if (e.target.value.trim()) setTokenTouched(false);
                        }}
                        placeholder="Crea un token seguro (ej: omni_secret_123)"
                        className={`w-full bg-slate-50 dark:bg-slate-800 border ${tokenTouched && !webhookToken.trim() ? 'border-rose-500 animate-shake' : 'border-slate-200 dark:border-slate-600'} rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white transition-all`}
                    />
                    {tokenTouched && !webhookToken.trim() && (
                      <p className="text-[10px] text-rose-500 mt-1 font-bold">El token de verificación es obligatorio.</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Escribe el mismo token aquí y en Meta para validar.</p>
                </div>

                <button 
                    onClick={() => handleSave('WEBHOOK')}
                    disabled={!webhookToken.trim()}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Webhook className="w-4 h-4" />
                    Guardar Configuración
                </button>
            </div>
        )}
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto custom-scrollbar relative">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Canales de Conexión</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Vincula tu OmniAgent con tus redes sociales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => {
          const Icon = getIcon(channel.id);
          return (
            <div key={channel.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
              <div className={`${channel.color} p-6 flex justify-between items-start text-white h-32 relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md inline-block mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">{channel.name}</h3>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform">
                   <Icon className="w-32 h-32" />
                </div>
                {channel.connected && (
                  <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md z-10 animate-pulse">
                    Activo
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {channel.desc}
                </p>
                
                <div className="mt-auto space-y-3">
                  {channel.connected ? (
                    <>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50 dark:border-slate-700">
                        <span className="text-slate-400">Estado:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Conectado
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50 dark:border-slate-700">
                        <span className="text-slate-400">Método:</span>
                        <span className="text-slate-600 dark:text-slate-300 font-mono truncate max-w-[120px]">
                          {channel.credentials?.method === 'WEBHOOK' ? 'Webhook' : 'OAuth'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500"></div>
                      <p className="text-[10px] font-bold">No vinculado</p>
                    </div>
                  )}

                  <button 
                    onClick={() => openConfig(channel.id)}
                    className={`w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                      channel.connected 
                        ? 'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                    }`}
                  >
                    {channel.connected ? 'Configurar / Desconectar' : <><Link2 className="w-4 h-4" /> Conectar Ahora</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {modalOpen && activeChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className={`${activeChannel.color} p-6 flex justify-between items-center text-white shrink-0`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ActiveIcon className="w-5 h-5" /> {activeChannel.name}
              </h3>
              <button onClick={() => setModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                {connectionStep === 'SUCCESS' || connectionStep === 'CONNECTING' ? (
                     <div className="flex flex-col items-center justify-center h-full py-12">
                        {connectionStep === 'CONNECTING' ? (
                            <>
                                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Autenticando...</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-center animate-pulse">{simulationStatus}</p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-emerald-700">¡Conexión Exitosa!</h3>
                            </>
                        )}
                     </div>
                ) : (
                    <>
                        {activeChannel.id === 'whatsapp' ? renderWhatsAppContent() : renderMetaContent()}
                    </>
                )}
            </div>
            
            {activeChannel.connected && connectionStep === 'IDLE' && (
                 <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <button 
                        onClick={() => { handleSave('OAUTH'); setChannels(prev => prev.map(c => c.id === activeChannel.id ? {...c, connected: false, credentials: undefined} : c)); setModalOpen(false); }}
                        className="w-full py-3 text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                    >
                        Desconectar Canal
                    </button>
                 </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Channels;

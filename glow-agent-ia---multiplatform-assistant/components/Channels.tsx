import React, { useState, useEffect } from 'react';
import { ChannelConfig } from '../types';
import { 
  Phone, Instagram, MessageCircle, CheckCircle, ExternalLink, X, Copy, 
  Calendar, Key, Globe, ShieldCheck, Zap, ArrowRight, Loader2, Lock, 
  Link2, Trash2, Wifi, WifiOff, AlertTriangle
} from 'lucide-react';

interface ChannelsViewProps {
  channels: ChannelConfig[];
  setChannels: React.Dispatch<React.SetStateAction<ChannelConfig[]>>;
  onConnect: (platformId: string) => void;
  onDisconnect: (platformId: string) => void;
  webhookUrl: string;
}

const ChannelsView: React.FC<ChannelsViewProps> = ({ channels, setChannels, onConnect, onDisconnect, webhookUrl }) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // ESTADOS DE PRUEBA DE CONEXIÓN
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // ESTADOS DE CONFIGURACIÓN
  const [webhookConfig, setWebhookConfig] = useState({
    url: webhookUrl,
    verifyToken: 'omni123',
    resourceId: '', 
  });
  
  const [googleConfig, setGoogleConfig] = useState({
    calendarId: localStorage.getItem('g_cal_id') || '',
    apiKey: localStorage.getItem('g_api_key') || '',
  });

  useEffect(() => {
    if (!selectedChannel) {
        // Al abrir, si la URL externa está vacía, la dejamos vacía para obligar al usuario a pegar
        setWebhookConfig(prev => ({ ...prev, url: webhookUrl }));
        setTestStatus('idle'); 
        setErrorMessage('');
    }
  }, [webhookUrl, selectedChannel]);

  // --- 🔒 VALIDACIÓN REAL (SIN SIMULACIONES) ---
  const handleConnect = async () => {
    setErrorMessage('');
    setTestStatus('idle');

    // 1. VALIDACIÓN: ¿Está vacío?
    if (!webhookConfig.url || webhookConfig.url.trim() === '') {
        setErrorMessage('⚠️ El campo URL no puede estar vacío.');
        setTestStatus('error');
        return;
    }

    // 2. VALIDACIÓN: ¿Es una URL válida?
    if (!webhookConfig.url.startsWith('http')) {
        setErrorMessage('⚠️ La URL debe comenzar con https://');
        setTestStatus('error');
        return;
    }

    setIsVerifying(true);

    try {
        // 3. VALIDACIÓN: PING AL SERVIDOR
        // Intentamos conectar a la raíz (quitando /api/webhook) para ver si el servidor existe
        const baseUrl = webhookConfig.url.replace(/\/api\/webhook\/?$/, '');
        
        // Usamos un timeout de 5 segundos para no esperar eternamente
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(baseUrl, { 
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            // ¡ÉXITO REAL! 🎉
            setTestStatus('success');
            
            // Guardamos configuración de Google si aplica
            if (selectedChannel?.platformId === 'google_calendar') {
                localStorage.setItem('g_cal_id', googleConfig.calendarId);
                localStorage.setItem('g_api_key', googleConfig.apiKey);
            }
            
            // Esperamos un segundo para que el usuario vea el check verde antes de cerrar
            await new Promise(r => setTimeout(r, 1000));
            
            onConnect(selectedChannel!.platformId);
            setSelectedChannel(null);
        } else {
            throw new Error(`Error del servidor: ${response.status}`);
        }

    } catch (error: any) {
        console.error("Fallo de conexión:", error);
        setTestStatus('error');
        
        if (error.name === 'AbortError') {
            setErrorMessage('⏳ Tiempo de espera agotado. El servidor tarda en responder.');
        } else if (error.message.includes('Failed to fetch')) {
            setErrorMessage('🚫 No se encontró el servidor. Verifica la URL.');
        } else {
            setErrorMessage('❌ Error de conexión. El servidor no está disponible.');
        }
    } finally {
        setIsVerifying(false);
    }
  };

  const handleDisconnectAction = async () => {
    if (!selectedChannel) return;
    setIsDisconnecting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onDisconnect(selectedChannel.platformId);
    setIsDisconnecting(false);
    setSelectedChannel(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  const getIcon = (platformId: string, size = "w-8 h-8") => {
    switch (platformId) {
      case 'whatsapp': return <Phone className={`${size} text-white`} />;
      case 'instagram': return <Instagram className={`${size} text-white`} />;
      case 'messenger': return <MessageCircle className={`${size} text-white`} />;
      case 'google_calendar': return <Calendar className={`${size} text-indigo-600`} />;
      default: return <Zap className={`${size}`} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-700 pb-32">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">CONEXIONES</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
            Vincula tus canales. El sistema verificará la conexión real antes de activar el canal.
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
           <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
           <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Servidor de Webhooks: Activo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {channels.map((channel) => (
          <div 
            key={channel.id} 
            className={`bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-xl border transition-all duration-500 group relative overflow-hidden ${
                channel.connected 
                ? 'border-emerald-100 dark:border-emerald-900/50' 
                : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900'
            }`}
          >
            <div className={`absolute -top-6 -right-6 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-all transform group-hover:rotate-12 duration-700 ${channel.connected ? 'text-emerald-500' : 'text-slate-400'}`}>
              {getIcon(channel.platformId, "w-32 h-32")}
            </div>
            
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-lg transition-all group-hover:scale-110 group-hover:rotate-3 duration-500 ${channel.color}`}>
              {getIcon(channel.platformId)}
            </div>

            <div className="mb-8">
                <h3 className="font-black text-2xl text-slate-800 dark:text-white mb-2 tracking-tight">{channel.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{channel.desc}</p>
            </div>

            <div className="flex items-center justify-between mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${channel.connected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-300'}`}></div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${channel.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {channel.connected ? 'CONECTADO' : 'SIN VÍNCULO'}
                </span>
              </div>
              {channel.connected && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>

            <button 
              onClick={() => setSelectedChannel(channel)}
              className={`w-full py-5 rounded-[22px] font-black text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 ${
                channel.connected 
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 hover:-translate-y-1'
              }`}
            >
              {channel.connected ? 'CONFIGURAR' : 'CONECTAR AHORA'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* --- MODAL DE CONFIGURACIÓN --- */}
      {selectedChannel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[48px] w-full max-w-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
            
            <div className={`h-56 ${selectedChannel.color} relative flex flex-col items-center justify-center text-white p-8 shrink-0`}>
              <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
              <button onClick={() => setSelectedChannel(null)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/30 rounded-full text-white transition-all z-20 hover:rotate-90">
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative z-10 text-center">
                <div className="mx-auto w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mb-6 backdrop-blur-2xl border border-white/20 shadow-2xl">
                  {getIcon(selectedChannel.platformId, "w-10 h-10")}
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase">{selectedChannel.name}</h3>
                <p className="text-white/60 text-[10px] font-black tracking-[0.3em] mt-2 uppercase">Verificación en Tiempo Real</p>
              </div>
            </div>

            <div className="p-12 overflow-y-auto custom-scrollbar">
              
              {selectedChannel.platformId === 'google_calendar' ? (
                /* ... (Código de Calendar igual que antes) ... */
                <div className="space-y-8">
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl p-6 flex gap-4">
                     <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                     <p className="text-xs text-indigo-800 dark:text-indigo-300 font-bold leading-relaxed">
                       Requiere URL de Callback en Google Cloud Console.
                     </p>
                   </div>
                   {/* Inputs de Calendar */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Calendar ID</label>
                       <input type="text" value={googleConfig.calendarId} onChange={(e) => setGoogleConfig({...googleConfig, calendarId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"/>
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">API Key</label>
                       <input type="password" value={googleConfig.apiKey} onChange={(e) => setGoogleConfig({...googleConfig, apiKey: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"/>
                     </div>
                   </div>
                </div>
              ) : (
                /* Sección Meta */
                <div className="space-y-8">
                  {/* MENSAJES DE ESTADO DE CONEXIÓN */}
                  {testStatus === 'success' && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-3xl p-4 flex gap-4 items-center animate-in slide-in-from-top-2">
                       <Wifi className="w-6 h-6 text-emerald-600" />
                       <div>
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">¡Conexión Verificada!</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">El servidor respondió correctamente. Guardando...</p>
                       </div>
                    </div>
                  )}
                  
                  {testStatus === 'error' && (
                    <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 rounded-3xl p-4 flex gap-4 items-center animate-in slide-in-from-top-2">
                       <AlertTriangle className="w-6 h-6 text-rose-600" />
                       <div>
                          <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Conexión Fallida</p>
                          <p className="text-xs text-rose-600 dark:text-rose-400">{errorMessage || 'No se pudo conectar al servidor.'}</p>
                       </div>
                    </div>
                  )}

                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-3xl p-6 flex gap-4">
                    <Lock className="w-6 h-6 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
                      El sistema realizará un "Ping" a esta URL. Si no responde, no podrás guardar.
                    </p>
                  </div>

                  <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Callback URL (Webhook)</label>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            value={webhookConfig.url} 
                            onChange={(e) => setWebhookConfig({...webhookConfig, url: e.target.value})}
                            placeholder="https://tu-app.run.app/api/webhook"
                            className={`flex-1 bg-slate-100 dark:bg-slate-950 border rounded-2xl px-6 py-4 text-xs text-slate-500 font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${testStatus === 'error' ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-800'}`}
                          />
                          <button onClick={() => copyToClipboard(webhookConfig.url)} className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl text-slate-500 transition-all shadow-sm">
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                           Verify Token <ShieldCheck className="w-3 h-3" />
                        </label>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                value={webhookConfig.verifyToken}
                                onChange={(e) => setWebhookConfig({...webhookConfig, verifyToken: e.target.value})}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm dark:text-white font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                      </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-12 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-4">
                
                <button 
                    onClick={handleConnect}
                    disabled={isVerifying || isDisconnecting}
                    className={`w-full font-black text-xs uppercase tracking-[0.3em] py-5 rounded-[24px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${
                        testStatus === 'error' 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                    }`}
                >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : selectedChannel.connected ? <CheckCircle className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                    {isVerifying ? 'PROBANDO CONEXIÓN...' : selectedChannel.connected ? 'GUARDADO' : 'VERIFICAR Y CONECTAR'}
                </button>
                
                {selectedChannel.connected && (
                  <button onClick={handleDisconnectAction} disabled={isVerifying || isDisconnecting} className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-[24px] border border-rose-100 dark:border-rose-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      DESCONECTAR CANAL
                  </button>
                )}

                <button onClick={() => setSelectedChannel(null)} className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest">
                    Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsView;
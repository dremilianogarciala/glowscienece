import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import MarketingStudio from './components/ImageGenerator';
import CalendarView from './components/Calendar';
import AgentBuilder from './components/AgentBuilder';
import ChannelsView from './components/Channels';
import UnifiedInbox from './components/UnifiedInbox';
import VoiceStudio from './components/VoiceAgent';
import AgentNetwork from './components/AgentNetwork';
import AgentManagement from './components/AgentManagement';
import SettingsView from './components/SettingsView';
import { AppView, AIAgent, ChannelConfig, UnifiedMessage, Appointment, MarketingAsset } from './types';
import { UserCircle, Moon, Sun, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('es');
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [marketingAssets, setMarketingAssets] = useState<MarketingAsset[]>([]);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);

  // --- ESTADO DE CANALES ---
  const [channels, setChannels] = useState<ChannelConfig[]>([
    { 
      id: 'whatsapp', name: 'WhatsApp Business', platformId: 'whatsapp',
      color: 'bg-emerald-500', connected: false, desc: 'API oficial de WhatsApp Cloud.'
    },
    { 
      id: 'instagram', name: 'Instagram Direct', platformId: 'instagram',
      color: 'bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600', 
      connected: false, desc: 'Responde DMs automáticamente.'
    },
    { 
      id: 'messenger', name: 'Facebook Messenger', platformId: 'messenger',
      color: 'bg-blue-600', connected: false, desc: 'Integración con Fanpages.'
    },
    { 
      id: 'google_calendar', name: 'Google Calendar', platformId: 'google_calendar',
      color: 'bg-white text-slate-800 border border-slate-200', connected: false, desc: 'Sincroniza citas y disponibilidad en tiempo real.'
    }
  ]);

  const handleConnectChannel = (platformId: string) => {
    setChannels(prev => prev.map(ch => 
        ch.platformId === platformId ? { ...ch, connected: true } : ch
    ));
    localStorage.setItem(`connected_${platformId}`, 'true');
  };

  const handleDisconnectChannel = (platformId: string) => {
    setChannels(prev => prev.map(ch => 
        ch.platformId === platformId ? { ...ch, connected: false } : ch
    ));
    localStorage.removeItem(`connected_${platformId}`);
    if (platformId === 'google_calendar') {
      localStorage.removeItem('g_cal_id');
      localStorage.removeItem('g_api_key');
    }
  };

  useEffect(() => {
    setChannels(prev => prev.map(ch => ({
        ...ch,
        connected: localStorage.getItem(`connected_${ch.platformId}`) === 'true'
    })));
  }, []);

  const [inboxMessages, setInboxMessages] = useState<UnifiedMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', time: '09:00', title: 'Corte de Cabello', client: 'Carlos Ruiz', platform: 'WhatsApp', status: 'confirmed' },
  ]);

  // --- SSE Y NOTIFICACIONES (Conexión Unificada) ---
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
    
    // 1. Carga inicial de mensajes (Ruta relativa)
    const loadInitialMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (response.ok) {
          const data = await response.json();
          setInboxMessages(data.map((msg: any) => ({...msg, timestamp: new Date(msg.timestamp)})));
          // Si responde el fetch, ya estamos conectados
          setBackendConnected(true); 
        }
      } catch (e) { 
          console.warn("Backend offline o error de red:", e); 
          setBackendConnected(false);
      }
    };
    loadInitialMessages();

    // 2. Conexión en tiempo real (SSE)
    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      // Usamos '/api/events' directamente. El navegador sabe que es en el mismo servidor.
      console.log("🔵 Intentando conectar SSE a /api/events...");
      eventSource = new EventSource('/api/events');
      
      eventSource.onopen = () => {
          setBackendConnected(true);
          console.log("🟢 Conexión SSE establecida");
      };

      eventSource.onmessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          // Recibir cualquier dato confirma que estamos online
          setBackendConnected(true);

          if (newMsg.type === 'ping') return;
          
          newMsg.timestamp = new Date(newMsg.timestamp);
          
          setInboxMessages(prev => {
             // Evitar duplicados
             if (prev.some(m => m.id === newMsg.id)) return prev;
             
             // Notificación navegador
             if (Notification.permission === "granted" && newMsg.avatar !== 'OA') {
                 new Notification(`Mensaje de ${newMsg.contactName}`, { body: newMsg.lastMessage });
             }
             return [newMsg, ...prev];
          });
        } catch (e) { console.error(e); }
      };

      eventSource.onerror = (err) => { 
          console.error("🔴 Error SSE:", err);
          setBackendConnected(false); 
          eventSource?.close(); 
          // Reintentar conexión en 3 segundos
          setTimeout(connectSSE, 3000); 
      };
    };

    connectSSE();
    return () => eventSource?.close();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: 
        return <Dashboard channels={channels} messages={inboxMessages} appointments={appointments} isConnected={backendConnected} />;
      case AppView.CHANNELS: 
        return <ChannelsView 
          channels={channels} 
          setChannels={setChannels} 
          onConnect={handleConnectChannel} 
          onDisconnect={handleDisconnectChannel}
          // Calculamos la URL completa para mostrarla en la pantalla de Configuración
          webhookUrl={`${window.location.origin}/api/webhook`} 
        />;
      case AppView.IMAGE_STUDIO:
        return <MarketingStudio agents={agents} assets={marketingAssets} setAssets={setMarketingAssets} />;
      case AppView.VOICE_STUDIO:
        return <VoiceStudio agents={agents} />;
      case AppView.CALENDAR:
        return <CalendarView agents={agents} />;
      case AppView.UNIFIED_INBOX: return <UnifiedInbox messages={inboxMessages} channels={channels} />;
      case AppView.AGENT_BUILDER: return <AgentBuilder onSave={(a) => { setAgents(prev => [...prev, a]); setCurrentView(AppView.AGENT_MANAGEMENT); }} initialAgent={editingAgent} existingAgents={agents} />;
      case AppView.AGENT_MANAGEMENT: return <AgentManagement agents={agents} onDelete={(id) => setAgents(prev => prev.filter(a => a.id !== id))} onEdit={(a) => { setEditingAgent(a); setCurrentView(AppView.AGENT_BUILDER); }} onCreate={() => { setEditingAgent(null); setCurrentView(AppView.AGENT_BUILDER); }} />;
      case AppView.AGENT_NETWORK: return <AgentNetwork agents={agents} onAgentClick={(a) => { setEditingAgent(a); setCurrentView(AppView.AGENT_BUILDER); }} />;
      case AppView.SETTINGS: return <SettingsView darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} language={language} setLanguage={setLanguage} />;
      default: return <Dashboard channels={channels} messages={inboxMessages} appointments={appointments} isConnected={backendConnected} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-500">
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} language={language} />
      </div>
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 z-30 transition-colors duration-500">
          <div className="flex items-center gap-2 lg:hidden">
             <Sparkles className="w-6 h-6 text-indigo-600" />
             <h1 className="font-black text-slate-800 dark:text-white text-xl tracking-tighter">GLOW</h1>
          </div>
          <div className="hidden lg:block">
             <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.3em] uppercase">
                {currentView.replace('_', ' ')}
             </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* INDICADOR DE ESTADO DEL SISTEMA */}
            <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${backendConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              {backendConnected ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'}
            </div>
            
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1"></div>
            
            <div className="flex items-center gap-3 pl-2">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Admin</p>
                  <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">PRO PLAN</p>
               </div>
               <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <UserCircle className="w-6 h-6" />
               </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};
export default App;

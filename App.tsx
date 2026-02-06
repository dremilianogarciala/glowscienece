
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
import GuidedTutorial from './components/GuidedTutorial';
import { AppView, AIAgent, ChannelConfig, UnifiedMessage, Appointment, MarketingAsset } from './types';
import { Settings, Bell, Search, UserCircle, Phone, Instagram, MessageCircle, Moon, Sun, HelpCircle } from 'lucide-react';

const BACKEND_PORT = 3001;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('es');
  const [backendConnected, setBackendConnected] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('omniagent_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);

  const [channels, setChannels] = useState<ChannelConfig[]>([
    { 
      id: 'whatsapp', 
      name: 'WhatsApp Business', 
      platformId: 'whatsapp',
      color: 'bg-emerald-500', 
      connected: false,
      desc: 'API oficial de WhatsApp Cloud.'
    },
    { 
      id: 'instagram', 
      name: 'Instagram Direct', 
      platformId: 'instagram',
      color: 'bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600', 
      connected: false,
      desc: 'Responde DMs automáticamente.'
    },
    { 
      id: 'messenger', 
      name: 'Facebook Messenger', 
      platformId: 'messenger',
      color: 'bg-blue-600', 
      connected: false,
      desc: 'Integración con Fanpages.'
    }
  ]);

  const [inboxMessages, setInboxMessages] = useState<UnifiedMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', time: '09:00', title: 'Corte de Cabello', client: 'Carlos Ruiz', platform: 'WhatsApp', status: 'confirmed' },
  ]);

  const [marketingAssets, setMarketingAssets] = useState<MarketingAsset[]>([]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
      }
    };
    checkApiKey();
  }, []);

  const handleSaveAgent = (savedAgent: AIAgent) => {
    setAgents(prev => {
        let updatedList = [...prev];
        const existingIndex = updatedList.findIndex(a => a.id === savedAgent.id);
        if (existingIndex >= 0) {
            updatedList[existingIndex] = savedAgent;
        } else {
            updatedList.push(savedAgent);
        }
        
        if (savedAgent.isRouter) {
            updatedList = updatedList.map(a => a.id === savedAgent.id ? a : {...a, isRouter: false});
        }
        return updatedList;
    });
    setEditingAgent(null);
    setCurrentView(AppView.AGENT_MANAGEMENT);
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este agente?')) {
      setAgents(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent);
    setCurrentView(AppView.AGENT_BUILDER);
  };

  const finishTutorial = () => {
    localStorage.setItem('omniagent_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: 
        return (
          <Dashboard 
            channels={channels} 
            messages={inboxMessages} 
            appointments={appointments} 
            agents={agents}
            isConnected={backendConnected} 
            onNavigate={setCurrentView}
            onEditAgent={handleEditAgent}
          />
        );
      case AppView.AGENT_BUILDER: 
        return <AgentBuilder onSave={handleSaveAgent} initialAgent={editingAgent} existingAgents={agents} />;
      case AppView.CHAT_IA:
        return <div className="h-full p-8 max-w-6xl mx-auto"><ChatBot agents={agents} /></div>;
      case AppView.IMAGE_STUDIO: 
        return <MarketingStudio agents={agents} assets={marketingAssets} setAssets={setMarketingAssets} />;
      case AppView.CALENDAR: 
        return <CalendarView />; 
      case AppView.CHANNELS: 
        return <ChannelsView channels={channels} setChannels={setChannels} />;
      case AppView.UNIFIED_INBOX: 
        return <UnifiedInbox messages={inboxMessages} channels={channels} />;
      case AppView.VOICE_STUDIO: 
        return <VoiceStudio agents={agents} />;
      case AppView.AGENT_NETWORK: 
        return <AgentNetwork agents={agents} onAgentClick={handleEditAgent} />;
      case AppView.AGENT_MANAGEMENT: 
        return <AgentManagement agents={agents} onDelete={handleDeleteAgent} onEdit={handleEditAgent} onCreate={() => { setEditingAgent(null); setCurrentView(AppView.AGENT_BUILDER); }} />;
      case AppView.SETTINGS:
        return <SettingsView darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} language={language} setLanguage={setLanguage} />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden selection:bg-indigo-100 selection:text-indigo-700 transition-colors duration-300">
      {showTutorial && <GuidedTutorial onFinish={finishTutorial} onNavigate={setCurrentView} />}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} language={language} />
      </div>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4 w-1/3">
             <h1 className="font-black text-indigo-600 text-xl tracking-tighter">OMNIAGENT AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowTutorial(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
              <HelpCircle className="w-4 h-4" /> Tutorial
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setCurrentView(AppView.SETTINGS)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl"><Settings className="w-5 h-5" /></button>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserCircle className="w-6 h-6" /></div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden bg-[#fafbff] dark:bg-slate-950 transition-colors duration-300">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;

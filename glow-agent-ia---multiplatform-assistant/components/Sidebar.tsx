
import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Image as ImageIcon, 
  Calendar as CalendarIcon, 
  Share2,
  Bot,
  PlusCircle,
  Inbox,
  Mic2,
  Network,
  Users,
  Settings,
  Sparkles
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  language?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, language = 'es' }) => {
  const translations: any = {
    es: {
      dashboard: 'Dashboard',
      messaging: 'Mensajería',
      network: 'Red de Agentes',
      agents: 'Mis Agentes',
      voice: 'Voice Studio',
      marketing: 'Marketing Studio',
      agenda: 'Agenda Smart',
      connections: 'Conexiones',
      settings: 'Configuración',
      engine: 'IA Engine'
    },
    en: {
      dashboard: 'Dashboard',
      messaging: 'Messaging',
      network: 'Agent Network',
      agents: 'My Agents',
      voice: 'Voice Studio',
      marketing: 'Marketing Studio',
      agenda: 'Smart Agenda',
      connections: 'Connections',
      settings: 'Settings',
      engine: 'AI Engine'
    },
    pt: {
      dashboard: 'Painel',
      messaging: 'Mensagens',
      network: 'Rede de Agentes',
      agents: 'Meus Agentes',
      voice: 'Estúdio de Voz',
      marketing: 'Estúdio de Marketing',
      agenda: 'Agenda Smart',
      connections: 'Conexões',
      settings: 'Configurações',
      engine: 'IA Engine'
    }
  };

  const t = translations[language] || translations.es;

  const menuItems = [
    { id: AppView.DASHBOARD, icon: LayoutDashboard, label: t.dashboard },
    { id: AppView.UNIFIED_INBOX, icon: Inbox, label: t.messaging },
    { id: AppView.AGENT_NETWORK, icon: Network, label: t.network },
    { id: AppView.AGENT_MANAGEMENT, icon: Users, label: t.agents },
    { id: AppView.VOICE_STUDIO, icon: Mic2, label: t.voice },
    { id: AppView.IMAGE_STUDIO, icon: ImageIcon, label: t.marketing },
    { id: AppView.CALENDAR, icon: CalendarIcon, label: t.agenda },
    { id: AppView.CHANNELS, icon: Share2, label: t.connections },
  ];

  return (
    <div className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-500">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
            <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tighter leading-none">GLOW AGENT</h1>
            <span className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] mt-0.5">INTELLIGENCE</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none font-semibold translate-x-1' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-2">
         <button 
           onClick={() => onViewChange(AppView.SETTINGS)}
           className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === AppView.SETTINGS 
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-white font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
           }`}
         >
           <Settings className="w-5 h-5" />
           <span className="text-sm">{t.settings}</span>
         </button>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-4 border border-indigo-100/50 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{t.engine}</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Gemini 2.5 Flash Native</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

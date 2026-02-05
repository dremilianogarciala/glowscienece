import React, { useState, useEffect } from 'react';
import { Bot, Save, Sparkles, Calendar, Settings2, ListChecks, X, Globe, FileText, ToggleLeft, Lock, Key, MessageSquare, Mic, Search, Megaphone, CheckCircle2 } from 'lucide-react';
import { AIAgent, AgentType, VoiceSettings, AgendaSettings, MarketingSettings } from '../types';
import ChatBot from './ChatBot';

interface AgentBuilderProps {
  onSave: (agent: AIAgent) => void;
  initialAgent?: AIAgent | null;
  existingAgents?: AIAgent[];
}

const COUNTRY_CODES = [
  { code: '+1', country: 'USA/Canada' },
  { code: '+52', country: 'México' },
  { code: '+34', country: 'España' },
  { code: '+57', country: 'Colombia' },
  { code: '+56', country: 'Chile' },
  { code: '+51', country: 'Perú' },
  { code: '+55', country: 'Brasil' },
];

const AgentBuilder: React.FC<AgentBuilderProps> = ({ onSave, initialAgent, existingAgents = [] }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [type, setType] = useState<AgentType>('GENERAL');
  const [prompt, setPrompt] = useState('');
  
  const [strictMode, setStrictMode] = useState(false);
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [webSearchQueryTemplate, setWebSearchQueryTemplate] = useState('');
  const [enableKnowledgeBase, setEnableKnowledgeBase] = useState(true);

  // Voice Settings
  const [voiceName, setVoiceName] = useState<VoiceSettings['voiceName']>('Zephyr');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceIsPrimary, setVoiceIsPrimary] = useState(false);

  // Agenda Settings
  const [agendaConfig, setAgendaConfig] = useState<AgendaSettings>({
    googleCalendarId: '',
    googleApiKey: '',
    autoReportTime: '08:00',
    reportPhoneNumber: '',
    calendarSyncEnabled: false
  });

  // Marketing Settings
  const [marketingConfig, setMarketingConfig] = useState<MarketingSettings>({
    stylePreference: 'Modern & Clean',
    autoPostEnabled: false
  });
  
  const [phoneCountryCode, setPhoneCountryCode] = useState('+52');
  const [phoneNumberBody, setPhoneNumberBody] = useState('');

  const [triggers, setTriggers] = useState<string[]>([]);
  const [triggerInput, setTriggerInput] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [constraintInput, setConstraintInput] = useState('');
  const [handoffInstructions, setHandoffInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAgent) {
      setName(initialAgent.name);
      setRole(initialAgent.role);
      setType(initialAgent.type);
      setPrompt(initialAgent.systemPrompt);
      setStrictMode(initialAgent.strictMode);
      setAllowWebSearch(initialAgent.allowWebSearch || false);
      setWebSearchQueryTemplate(initialAgent.webSearchQueryTemplate || '');
      setEnableKnowledgeBase(initialAgent.enableKnowledgeBase !== undefined ? initialAgent.enableKnowledgeBase : true);
      setTriggers(initialAgent.triggers || []);
      setPriority(initialAgent.priority);
      setConstraints(initialAgent.constraints || []);
      setHandoffInstructions(initialAgent.handoffInstructions || '');
      
      if (initialAgent.voiceConfig) {
        setVoiceName(initialAgent.voiceConfig.voiceName);
        setVoiceSpeed(initialAgent.voiceConfig.speed);
        setVoiceIsPrimary(initialAgent.voiceConfig.isPrimary || false);
      }
      if (initialAgent.agendaConfig) {
        setAgendaConfig(initialAgent.agendaConfig);
        const storedPhone = initialAgent.agendaConfig.reportPhoneNumber;
        const knownCode = COUNTRY_CODES.find(c => storedPhone.startsWith(c.code));
        if (knownCode) {
          setPhoneCountryCode(knownCode.code);
          setPhoneNumberBody(storedPhone.replace(knownCode.code, ''));
        } else {
          setPhoneNumberBody(storedPhone);
        }
      }
      if (initialAgent.marketingConfig) {
        setMarketingConfig(initialAgent.marketingConfig);
      }
    }
  }, [initialAgent]);

  const applyTemplate = (templateType: AgentType) => {
    setType(templateType);
    setError(null);

    switch (templateType) {
        case 'AGENDA':
            setName('Agenda Smart Assistant');
            setRole('Coordinador de Citas');
            setPrompt('Eres un experto en agendamiento. Tu objetivo es ayudar a los usuarios a programar citas. Pregunta siempre por nombre, fecha y servicio deseado.');
            setTriggers(['agendar', 'cita', 'hora', 'reservar']);
            setPriority('HIGH');
            break;
        case 'VOICE':
            setName('Voice Operator');
            setRole('Asistente de Voz Live');
            setPrompt('Eres un operador telefónico. Responde de manera breve y natural. No uses listas largas.');
            setVoiceIsPrimary(true);
            setPriority('HIGH');
            break;
        case 'MARKETING':
            setName('Creative Mind');
            setRole('Estratega de Contenido');
            setPrompt('Eres un diseñador creativo. Ayudas a generar prompts visuales impactantes y copys para redes sociales.');
            setTriggers(['marketing', 'imagen', 'post']);
            break;
        default:
            setName('Asistente General');
            setRole('Soporte');
            setPrompt('Eres un asistente servicial.');
            break;
    }
  };

  const handleSubmit = () => {
    if (!name || !prompt) return;
    setIsSaving(true);
    
    const finalPhone = `${phoneCountryCode}${phoneNumberBody.replace(/\D/g,'')}`;
    
    const agent: AIAgent = {
      id: initialAgent?.id || Date.now().toString(),
      name,
      role,
      type,
      systemPrompt: prompt,
      knowledgeBase: [],
      knowledgeContent: initialAgent?.knowledgeContent || "",
      enableKnowledgeBase,
      allowWebSearch,
      webSearchQueryTemplate,
      avatarColor: 'indigo',
      strictMode,
      constraints,
      triggers,
      priority,
      isRouter: type === 'ORCHESTRATOR',
      handoffInstructions,
      voiceConfig: type === 'VOICE' ? { voiceName, speed: voiceSpeed, pitch: 1, isPrimary: voiceIsPrimary } : undefined,
      agendaConfig: type === 'AGENDA' ? { ...agendaConfig, reportPhoneNumber: finalPhone } : undefined,
      marketingConfig: type === 'MARKETING' ? marketingConfig : undefined
    };

    setTimeout(() => {
      onSave(agent);
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Agent Builder</h2>
            <p className="text-slate-500 dark:text-slate-400">Configura el cerebro de tu asistente Glow.</p>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={!name || !prompt || isSaving}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20"
          >
            {isSaving ? <Sparkles className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Agente
          </button>
        </div>

        <div className="space-y-8">
          {/* Tipo de Agente */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Bot className="text-indigo-600 w-5 h-5" /> Especialización
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {(['GENERAL', 'MARKETING', 'VOICE', 'SALES', 'AGENDA', 'ORCHESTRATOR'] as AgentType[]).map(t => (
                <button 
                  key={t}
                  onClick={() => applyTemplate(t)}
                  className={`py-3 rounded-2xl border text-[10px] font-black tracking-widest transition-all ${type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* Identidad */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre del Agente</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm dark:text-white" placeholder="Ej: Glow Creative" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rol / Cargo</label>
                <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm dark:text-white" placeholder="Ej: Director Creativo" />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Instrucciones de Sistema (Core Prompt)</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] p-4 text-sm dark:text-white h-40 resize-none" placeholder="Define cómo debe comportarse..." />
            </div>
          </section>

          {/* Configuración Específica por Tipo */}
          {type === 'AGENDA' && (
            <section className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[32px] border border-emerald-100 dark:border-emerald-800/50 space-y-6 animate-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Configuración Google Calendar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Calendar ID</label>
                  <input type="text" value={agendaConfig.googleCalendarId} onChange={e => setAgendaConfig({...agendaConfig, googleCalendarId: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-sm dark:text-white" placeholder="ej: tu-correo@gmail.com" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">API Key (Cloud Console)</label>
                  <input type="password" value={agendaConfig.googleApiKey} onChange={e => setAgendaConfig({...agendaConfig, googleApiKey: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-sm dark:text-white" placeholder="AIza..." />
                </div>
                <div className="flex items-center gap-4 py-2">
                   <input type="checkbox" checked={agendaConfig.calendarSyncEnabled} onChange={e => setAgendaConfig({...agendaConfig, calendarSyncEnabled: e.target.checked})} className="w-5 h-5 accent-emerald-600" id="sync" />
                   <label htmlFor="sync" className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Habilitar sincronización bidireccional real</label>
                </div>
              </div>
            </section>
          )}

          {type === 'VOICE' && (
            <section className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[32px] border border-amber-100 dark:border-amber-800/50 space-y-6 animate-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <Mic className="w-5 h-5" /> Configuración de Voz Studio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">Voz Predeterminada</label>
                  <select value={voiceName} onChange={e => setVoiceName(e.target.value as any)} className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm dark:text-white">
                    <option value="Zephyr">Zephyr (Varón - Enérgico)</option>
                    <option value="Puck">Puck (Juvenil)</option>
                    <option value="Kore">Kore (Femenino - Calmo)</option>
                    <option value="Charon">Charon (Deep)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">Velocidad: {voiceSpeed}x</label>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={voiceSpeed} onChange={e => setVoiceSpeed(parseFloat(e.target.value))} className="w-full accent-amber-600 mt-2" />
                </div>
              </div>
            </section>
          )}

          {type === 'MARKETING' && (
            <section className="bg-rose-50 dark:bg-rose-900/10 p-8 rounded-[32px] border border-rose-100 dark:border-rose-800/50 space-y-6 animate-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                <Megaphone className="w-5 h-5" /> Preferencias Creativas (Nano Banana)
              </h3>
              <div>
                <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-2">Estilo de Generación</label>
                <select value={marketingConfig.stylePreference} onChange={e => setMarketingConfig({...marketingConfig, stylePreference: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-sm dark:text-white">
                  <option>Fotorrealista</option>
                  <option>Cyberpunk / Neon</option>
                  <option>Minimalista / Plano</option>
                  <option>Óleo / Artístico</option>
                </select>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Simulador */}
      <div className="w-[450px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-indigo-500" /> Prueba de Agente
           </h3>
           <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-emerald-500 tracking-widest">LIVE</span>
           </div>
        </div>
        <div className="flex-1 overflow-hidden">
           <ChatBot agents={existingAgents} forcedAgent={{
              id: initialAgent?.id || 'temp',
              name: name || 'Agente Nuevo',
              role,
              type,
              systemPrompt: prompt,
              strictMode,
              knowledgeBase: [],
              knowledgeContent: initialAgent?.knowledgeContent || "",
              enableKnowledgeBase,
              allowWebSearch,
              avatarColor: 'indigo',
              constraints: [],
              triggers: [],
              priority: 'MEDIUM',
              isRouter: false,
              handoffInstructions: ""
           }} />
        </div>
      </div>
    </div>
  );
};

export default AgentBuilder;
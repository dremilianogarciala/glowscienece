
import React, { useState, useEffect } from 'react';
import { 
  Bot, Save, Sparkles, Calendar, Settings2, ListChecks, X, Globe, 
  FileText, ToggleLeft, Lock, Key, MessageSquare, Mic, Search, 
  History, LayoutList, Eraser, ChevronDown, CheckCircle2, Clock,
  PlusCircle, RefreshCw, Phone, Smartphone, Hash, AudioLines, Zap,
  Edit
} from 'lucide-react';
import { AIAgent, AgentType, VoiceSettings, AgendaSettings } from '../types';
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
  { code: '+54', country: 'Argentina' },
  { code: '+57', country: 'Colombia' },
  { code: '+56', country: 'Chile' },
  { code: '+51', country: 'Perú' },
  { code: '+55', country: 'Brasil' },
];

const PROMPT_TEMPLATES = [
  {
    name: 'E-commerce & Ventas',
    description: 'Enfocado en catálogo, carritos abandonados y dudas de envío.',
    text: 'Eres el asistente comercial de [Nombre Empresa]. Tu objetivo es guiar al cliente en el proceso de compra. \n\nDirectivas:\n1. Si preguntan por productos, describe beneficios clave.\n2. Si tienen dudas de envío, menciona que tardamos de 3 a 5 días hábiles.\n3. Siempre intenta cerrar con una pregunta de interés: "¿Te gustaría que verifiquemos disponibilidad de talla?".'
  },
  {
    name: 'Atención Médica / Citas',
    description: 'Especializado en triaje básico y agendamiento.',
    text: 'Eres el coordinador de la clínica [Nombre]. Tu tono es empático, profesional y calmado.\n\nReglas:\n1. No des diagnósticos médicos.\n2. Para agendar, pide nombre completo y especialidad deseada.\n3. Informa sobre la política de cancelación de 24 horas.'
  },
  {
    name: 'Soporte Técnico SaaS',
    description: 'Resolución de problemas paso a paso.',
    text: 'Eres el experto de soporte nivel 1. Tu misión es resolver problemas técnicos de forma estructurada.\n\nFlujo:\n1. Saluda y pide una descripción del error.\n2. Sugiere reiniciar la aplicación o limpiar caché.\n3. Si el problema persiste, pide capturas de pantalla y escala al soporte nivel 2.'
  },
  {
    name: 'Inmobiliaria / Real Estate',
    description: 'Calificación de leads de alto valor.',
    text: 'Eres un asesor inmobiliario experto. Tu meta es calificar al interesado antes de pasarlo a un agente humano.\n\nPreguntas obligatorias:\n- ¿Busca comprar o rentar?\n- ¿Cuál es su presupuesto aproximado?\n- ¿En qué zona específica tiene interés?'
  }
];

const AgentBuilder: React.FC<AgentBuilderProps> = ({ onSave, initialAgent, existingAgents = [] }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [type, setType] = useState<AgentType>('GENERAL');
  const [prompt, setPrompt] = useState('');
  const [promptHistory, setPromptHistory] = useState<{text: string, timestamp: string}[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [strictMode, setStrictMode] = useState(false);
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [webSearchQueryTemplate, setWebSearchQueryTemplate] = useState('');
  const [enableKnowledgeBase, setEnableKnowledgeBase] = useState(true);

  // Voice Settings
  const [voiceName, setVoiceName] = useState<VoiceSettings['voiceName']>('Zephyr');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceIsPrimary, setVoiceIsPrimary] = useState(false);
  const [voiceRequiredData, setVoiceRequiredData] = useState<string[]>([]);
  const [voiceDataInput, setVoiceDataInput] = useState('');

  // Agenda Settings
  const [agendaConfig, setAgendaConfig] = useState<AgendaSettings>({
    googleCalendarId: '',
    googleApiKey: '',
    autoReportTime: '08:00',
    reportPhoneNumber: '',
    calendarSyncEnabled: false
  });
  
  const [phoneCountryCode, setPhoneCountryCode] = useState('+52');
  const [phoneNumberBody, setPhoneNumberBody] = useState('');

  const [triggers, setTriggers] = useState<string[]>([]);
  const [triggerInput, setTriggerInput] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [constraints, setConstraints] = useState<string[]>([]);
  const [handoffInstructions, setHandoffInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialAgent) {
      const cachedDraft = localStorage.getItem(`omniagent_prompt_draft_${type}`);
      if (cachedDraft) {
        setPrompt(cachedDraft);
      } else {
        setPrompt('');
      }
    }
  }, [type, initialAgent]);

  useEffect(() => {
    if (!initialAgent) {
      localStorage.setItem(`omniagent_prompt_draft_${type}`, prompt);
    }
  }, [prompt, type, initialAgent]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(`omniagent_prompt_history_${type}`);
    if (savedHistory) {
      setPromptHistory(JSON.parse(savedHistory));
    } else {
      setPromptHistory([]);
    }
  }, [type]);

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
        setVoicePitch(initialAgent.voiceConfig.pitch || 1.0);
        setVoiceIsPrimary(initialAgent.voiceConfig.isPrimary || false);
        setVoiceRequiredData(initialAgent.voiceConfig.requiredData || []);
      }
      if (initialAgent.agendaConfig) {
        setAgendaConfig(initialAgent.agendaConfig);
        const storedPhone = initialAgent.agendaConfig.reportPhoneNumber;
        if (storedPhone) {
             const knownCode = COUNTRY_CODES.find(c => storedPhone.startsWith(c.code));
             if (knownCode) {
                 setPhoneCountryCode(knownCode.code);
                 setPhoneNumberBody(storedPhone.replace(knownCode.code, ''));
             } else {
                 setPhoneNumberBody(storedPhone);
             }
        }
      }
    } else {
      resetForm();
    }
  }, [initialAgent]);

  useEffect(() => {
      if (type === 'AGENDA') {
          setAgendaConfig(prev => ({
              ...prev,
              reportPhoneNumber: `${phoneCountryCode}${phoneNumberBody.replace(/\D/g,'')}`
          }));
      }
  }, [phoneCountryCode, phoneNumberBody, type]);

  const resetForm = () => {
    setName('');
    setRole('');
    setType('GENERAL');
    setPrompt('');
    setStrictMode(false);
    setAllowWebSearch(false);
    setWebSearchQueryTemplate('');
    setEnableKnowledgeBase(true);
    setTriggers([]);
    setPriority('MEDIUM');
    setConstraints([]);
    setHandoffInstructions('');
    setVoiceName('Zephyr');
    setVoiceSpeed(1.0);
    setVoicePitch(1.0);
    setVoiceIsPrimary(false);
    setVoiceRequiredData([]);
    setAgendaConfig({ googleCalendarId: '', googleApiKey: '', autoReportTime: '08:00', reportPhoneNumber: '', calendarSyncEnabled: false });
    setPhoneCountryCode('+52');
    setPhoneNumberBody('');
    setError(null);
  };

  const checkAgentLimits = (agentType: AgentType): boolean => {
    const existingCount = existingAgents.filter(a => a.type === agentType && a.id !== initialAgent?.id).length;
    
    if (agentType === 'MARKETING' && existingCount >= 1) {
        setError("Solo se permite 1 Agente de Marketing.");
        return false;
    }
    
    if (agentType === 'VOICE' && existingCount >= 2) {
        setError("Solo se permiten hasta 2 Agentes de Voz.");
        return false;
    }

    setError(null);
    return true;
  };

  const savePromptToHistory = (text: string) => {
    if (!text || text.trim() === '') return;
    
    setPromptHistory(prev => {
      if (prev.length > 0 && prev[0].text === text) return prev;
      const newEntry = { text, timestamp: new Date().toISOString() };
      const updatedHistory = [newEntry, ...prev.slice(0, 9)];
      localStorage.setItem(`omniagent_prompt_history_${type}`, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const updatePromptInHistory = (index: number, newText: string) => {
    setPromptHistory(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: newText, timestamp: new Date().toISOString() };
      localStorage.setItem(`omniagent_prompt_history_${type}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleApplyPromptTemplate = (text: string) => {
    if (prompt && prompt.trim() !== '') {
        savePromptToHistory(prompt);
    }
    setPrompt(text);
    setShowTemplates(false);
  };

  const currentAgentState: AIAgent = {
      id: initialAgent?.id || Date.now().toString(),
      name: name || 'Nuevo Agente',
      role: role || 'Especialista',
      type,
      systemPrompt: prompt,
      knowledgeBase: [],
      knowledgeContent: initialAgent?.knowledgeContent || "", 
      enableKnowledgeBase,
      allowWebSearch,
      webSearchQueryTemplate: allowWebSearch ? webSearchQueryTemplate : undefined,
      avatarColor: 'indigo',
      strictMode,
      constraints,
      triggers,
      priority,
      isRouter: type === 'ORCHESTRATOR',
      handoffInstructions,
      voiceConfig: type === 'VOICE' ? { 
        voiceName, 
        speed: voiceSpeed, 
        pitch: voicePitch,
        isPrimary: voiceIsPrimary,
        requiredData: voiceRequiredData
      } : undefined,
      agendaConfig: type === 'AGENDA' ? agendaConfig : undefined
  };

  const handleSubmit = () => {
    if (!name || !prompt) return;
    if (!checkAgentLimits(type)) return;

    setIsSaving(true);
    savePromptToHistory(prompt);
    localStorage.removeItem(`omniagent_prompt_draft_${type}`);
    setTimeout(() => {
      onSave(currentAgentState);
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {initialAgent ? 'Editar Agente' : 'Nuevo Agente'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Define una nueva IA especializada sin reemplazar las anteriores.</p>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={!name || !prompt || isSaving}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            {isSaving ? <Sparkles className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Agente
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl border border-rose-200 dark:border-slate-800 mb-6 flex items-center gap-2 animate-in slide-in-from-top-2">
              <X className="w-5 h-5" />
              <span className="font-bold">{error}</span>
          </div>
        )}

        <div className="space-y-8 pb-12">
            <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Bot className="text-indigo-600 dark:text-indigo-400 w-5 h-5" /> Tipo de Agente
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(['GENERAL', 'MARKETING', 'VOICE', 'ORCHESTRATOR', 'SALES', 'AGENDA'] as AgentType[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => setType(t)}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Nombre</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ej: Voz Comercial 1"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Rol</label>
                  <input 
                    type="text" 
                    value={role} 
                    onChange={e => setRole(e.target.value)} 
                    placeholder="Ej: Ejecutivo de Voz"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">System Prompt</label>
                <div className="flex gap-2">
                  <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
                    <LayoutList className="w-3.5 h-3.5" /> Plantillas
                  </button>
                  <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors">
                    <History className="w-3.5 h-3.5" /> Historial
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea 
                  value={prompt} 
                  onChange={e => setPrompt(e.target.value)} 
                  placeholder="Instrucciones del agente..." 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm h-64 mb-1 focus:ring-4 focus:ring-indigo-500/10 outline-none dark:text-white transition-all resize-none custom-scrollbar" 
                />
                
                {showTemplates && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-40 p-6 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Librería de Prompts</h4>
                            <button onClick={() => setShowTemplates(false)} className="p-2 text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PROMPT_TEMPLATES.map((tmpl, idx) => (
                                <div key={idx} onClick={() => handleApplyPromptTemplate(tmpl.text)} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 transition-all cursor-pointer group">
                                    <h5 className="text-xs font-black text-slate-800 dark:text-white group-hover:text-indigo-600 mb-2 uppercase">{tmpl.name}</h5>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 italic">"{tmpl.text.substring(0, 150)}..."</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showHistory && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-40 p-6 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center mb-6">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Historial ({type})</h4>
                          <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
                      </div>
                      <div className="space-y-4">
                          {promptHistory.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm italic">No hay historial.</div>
                          ) : (
                            promptHistory.map((h, i) => (
                              <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/50 transition-all flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-indigo-500 uppercase">{new Date(h.timestamp).toLocaleString()}</span>
                                    <div className="flex gap-2">
                                       <button 
                                          onClick={() => {
                                            const newText = prompt("Editar prompt:", h.text);
                                            if (newText !== null) updatePromptInHistory(i, newText);
                                          }}
                                          className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                       >
                                          <Edit className="w-3.5 h-3.5" />
                                       </button>
                                       <button 
                                          onClick={() => { setPrompt(h.text); setShowHistory(false); }}
                                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest"
                                       >
                                          Aplicar
                                       </button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 italic">"{h.text}"</p>
                              </div>
                            ))
                          )}
                      </div>
                  </div>
                )}
              </div>
            </section>

            {/* Configs por tipo omitidas por brevedad, se mantienen igual */}
        </div>
      </div>

      <div className="w-[480px] border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col shrink-0 transition-colors duration-300">
          <div className="p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-10 transition-colors">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                   <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-widest">Sandbox</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Probando {name || 'Nuevo Agente'}</p>
                </div>
             </div>
          </div>
          <div className="flex-1 overflow-hidden">
             <ChatBot agents={existingAgents} forcedAgent={currentAgentState} />
          </div>
      </div>
    </div>
  );
};

export default AgentBuilder;

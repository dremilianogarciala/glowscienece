
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Phone, Instagram, MessageCircle, ChevronDown, Sparkles, Network, Megaphone, DollarSign, Mic, GitMerge, FileText, Cpu, Trash2 } from 'lucide-react';
import { Message, AIAgent } from '../types';
import { chatWithGemini, generateAIImage } from '../services/geminiService';

interface ChatBotProps {
  agents: AIAgent[];
  forcedAgent?: AIAgent | null; // Prop para modo Simulador
}

const MESSAGES_STORAGE_KEY = 'omniagent_chat_history';
const PLATFORM_STORAGE_KEY = 'omniagent_active_platform';

const ChatBot: React.FC<ChatBotProps> = ({ agents, forcedAgent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'whatsapp' | 'instagram' | 'messenger'>('whatsapp');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cargar historial y preferencias al montar
  useEffect(() => {
    // Si estamos en modo simulador, no cargamos el historial global
    if (forcedAgent) {
        setMessages([{
            id: 'sim-' + Date.now().toString(),
            role: 'assistant',
            content: `Modo Prueba: Soy ${forcedAgent.name}. Estoy configurado como ${forcedAgent.role}. ¿Cómo puedo ayudarte hoy?`,
            timestamp: new Date()
        }]);
        return;
    }

    // Cargar mensajes guardados
    const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Revivir objetos Date ya que JSON los convierte a string
        const revived = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(revived);
      } catch (e) {
        console.error("Error al cargar historial de chat", e);
        initializeDefaultMessage();
      }
    } else {
      initializeDefaultMessage();
    }

    // Cargar preferencia de plataforma
    const savedPlatform = localStorage.getItem(PLATFORM_STORAGE_KEY);
    if (savedPlatform && ['whatsapp', 'instagram', 'messenger'].includes(savedPlatform)) {
        setActivePlatform(savedPlatform as any);
    }
  }, [forcedAgent]);

  // Guardar mensajes en localStorage cada vez que cambian
  useEffect(() => {
    if (!forcedAgent && messages.length > 0) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, forcedAgent]);

  // Guardar preferencia de plataforma
  useEffect(() => {
    if (!forcedAgent) {
        localStorage.setItem(PLATFORM_STORAGE_KEY, activePlatform);
    }
  }, [activePlatform, forcedAgent]);

  const initializeDefaultMessage = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy la Red OmniAgent. Escribe tu consulta y el enrutador inteligente (Auto-Routing) dirigirá el mensaje al agente más capacitado.',
        timestamp: new Date()
      }
    ]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearHistory = () => {
    if (confirm('¿Deseas borrar todo el historial de conversación activa?')) {
      localStorage.removeItem(MESSAGES_STORAGE_KEY);
      initializeDefaultMessage();
    }
  };

  // Lógica de enrutamiento semántico
  const routeMessageToAgent = (text: string): AIAgent | undefined => {
    const lowerText = text.toLowerCase();
    const matchingAgents = agents.filter(agent => 
      agent.triggers && agent.triggers.some(trigger => lowerText.includes(trigger.toLowerCase()))
    );

    if (matchingAgents.length > 0) {
      const priorityMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      matchingAgents.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);
      return matchingAgents[0];
    }

    const routerAgent = agents.find(a => a.isRouter);
    return routerAgent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      platform: activePlatform
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let activeAgent = forcedAgent || selectedAgent;
    
    if (!activeAgent) {
      activeAgent = routeMessageToAgent(input) || null;
    }

    // Caso Especial: Generación de Imagen
    const isCreativeIntent = input.toLowerCase().includes('imagen') || input.toLowerCase().includes('crea') || input.toLowerCase().includes('dibuja');
    
    if (activeAgent?.type === 'MARKETING' && isCreativeIntent) {
        try {
            const imageUrl = await generateAIImage(input, '1K', '1:1');
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `He generado esta pieza visual para ti basada en: "${input}"`,
                mediaUrl: imageUrl,
                timestamp: new Date(),
                agentName: activeAgent?.name
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsLoading(false);
            return;
        } catch (e) {
            console.error("Fallo generación de imagen en Chat", e);
        }
    }

    const history = newMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }]
    }));

    const responseText = await chatWithGemini(input, history, activeAgent || undefined);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText || 'No he podido procesar la respuesta, intenta de nuevo.',
      timestamp: new Date(),
      agentName: activeAgent?.name 
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'MARKETING': return <Megaphone className="w-3 h-3" />;
      case 'SALES': return <DollarSign className="w-3 h-3" />;
      case 'VOICE': return <Mic className="w-3 h-3" />;
      case 'ORCHESTRATOR': return <GitMerge className="w-3 h-3" />;
      default: return <Bot className="w-3 h-3" />;
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'MARKETING': return 'bg-rose-500';
      case 'SALES': return 'bg-emerald-500';
      case 'VOICE': return 'bg-amber-500';
      case 'ORCHESTRATOR': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className={`flex flex-col h-full w-full ${forcedAgent ? '' : 'max-w-4xl mx-auto p-0'}`}>
      <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full ${forcedAgent ? 'shadow-none border-0 rounded-none' : ''}`}>
        {/* Cabecera persistente */}
        <div className={`${forcedAgent ? 'bg-slate-800' : 'bg-indigo-600'} p-5 flex items-center justify-between text-white shrink-0`}>
          <div className="flex items-center gap-4">
            <div className="relative">
               <div className={`p-2.5 rounded-2xl transition-colors ${selectedAgent || forcedAgent ? getAgentTypeColor((selectedAgent || forcedAgent)!.type) + ' bg-opacity-30' : 'bg-indigo-500/50'}`}>
                {selectedAgent || forcedAgent ? getAgentTypeIcon((selectedAgent || forcedAgent)!.type) : <Network className="w-6 h-6 text-indigo-200" />}
              </div>
              <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 border-2 ${forcedAgent ? 'border-slate-800' : 'border-indigo-600'} rounded-full animate-pulse ${selectedAgent || forcedAgent ? 'bg-emerald-500' : 'bg-indigo-300'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm uppercase tracking-tight">{forcedAgent ? forcedAgent.name : selectedAgent ? selectedAgent.name : 'Omni-Core Router'}</h3>
                {!forcedAgent && <ChevronDown className="w-4 h-4 opacity-50" />}
              </div>
              <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-black flex items-center gap-2">
                <Cpu className="w-3 h-3" /> GEMINI 3 PRO
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!forcedAgent && messages.length > 1 && (
              <button 
                onClick={clearHistory}
                className="p-2 bg-white/10 hover:bg-rose-500/20 rounded-xl transition-all text-white/70 hover:text-white"
                title="Borrar historial"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="flex gap-1.5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
              {[
                {id: 'whatsapp', icon: Phone},
                {id: 'instagram', icon: Instagram},
                {id: 'messenger', icon: MessageCircle}
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setActivePlatform(p.id as any)}
                  className={`p-2 rounded-xl transition-all ${activePlatform === p.id ? 'bg-white text-indigo-600 shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  <p.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selector rápido de Agentes */}
        {!forcedAgent && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-2.5 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
            <button 
                onClick={() => setSelectedAgent(null)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border shadow-sm ${!selectedAgent ? 'bg-indigo-600 text-white border-indigo-600 scale-105 ring-4 ring-indigo-500/10' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
            >
                <Network className="w-3 h-3" /> Auto-Routing
            </button>
            {agents.map(agent => (
                <button 
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border ${selectedAgent?.id === agent.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                {getAgentTypeIcon(agent.type)} {agent.name}
                </button>
            ))}
            </div>
        )}

        {/* Flujo de Conversación */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 dark:bg-slate-950 custom-scrollbar"
        >
          {messages.map((m) => (
            <div 
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
            >
              <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="w-full">
                  {m.agentName && m.role === 'assistant' && (
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 mb-1.5 block ml-1 uppercase tracking-widest">
                      {m.agentName}
                    </span>
                  )}
                  <div className={`px-6 py-4 rounded-[1.5rem] shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    {m.mediaUrl && (
                        <div className="mb-4 rounded-2xl overflow-hidden shadow-inner border border-black/5 bg-slate-900">
                            <img src={m.mediaUrl} alt="Generated content" className="w-full h-auto object-cover max-h-96" />
                        </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                  <span className={`text-[10px] mt-2 block px-1 font-bold ${m.role === 'user' ? 'text-right text-indigo-400' : 'text-slate-400'}`}>
                    {m.timestamp instanceof Date ? m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} • {activePlatform.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-4 items-center text-indigo-400">
                <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Cpu className="w-5 h-5 animate-spin" />
                </div>
                <div className="text-xs font-black uppercase tracking-widest">IA Procesando...</div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de entrada */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.08)]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={forcedAgent ? `Prueba a ${forcedAgent.name}...` : "Escribe una consulta..."}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl py-5 pl-8 pr-16 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm dark:text-white shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-4 p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50 shadow-xl shadow-indigo-200 dark:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {!forcedAgent && !selectedAgent && (
              <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> 
                  Omni-Core Engine: El historial y la plataforma activa se han guardado automáticamente.
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

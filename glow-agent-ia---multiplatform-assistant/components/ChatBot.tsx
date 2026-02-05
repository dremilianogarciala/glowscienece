
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Phone, Instagram, MessageCircle, ChevronDown, Sparkles, Network } from 'lucide-react';
import { Message, AIAgent } from '../types';
import { chatWithGemini } from '../services/geminiService';

interface ChatBotProps {
  agents: AIAgent[];
  forcedAgent?: AIAgent | null; // New prop for Simulator mode
}

const ChatBot: React.FC<ChatBotProps> = ({ agents, forcedAgent }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: forcedAgent 
        ? `Hola, soy ${forcedAgent.name}. Estoy listo para probar mis instrucciones.` 
        : '¡Hola! Soy la Red OmniAgent. Escribe tu consulta y el agente más capacitado te responderá automáticamente.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'whatsapp' | 'instagram' | 'messenger'>('whatsapp');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset messages when forcedAgent changes
    if (forcedAgent) {
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: `Modo Prueba: Soy ${forcedAgent.name} (${forcedAgent.role}).`,
            timestamp: new Date()
        }]);
    }
  }, [forcedAgent?.id, forcedAgent?.systemPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Logic to determine which agent should respond
  const routeMessageToAgent = (text: string): AIAgent | undefined => {
    const lowerText = text.toLowerCase();
    
    // 1. Find agents with matching triggers
    const matchingAgents = agents.filter(agent => 
      agent.triggers && agent.triggers.some(trigger => lowerText.includes(trigger.toLowerCase()))
    );

    if (matchingAgents.length > 0) {
      // 2. Sort by Priority (HIGH > MEDIUM > LOW)
      const priorityMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      matchingAgents.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);
      return matchingAgents[0];
    }

    // 3. Fallback to Router Agent
    const routerAgent = agents.find(a => a.isRouter);
    if (routerAgent) return routerAgent;

    // 4. Ultimate fallback (undefined uses generic OmniAgent)
    return undefined;
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

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Determine Agent
    let activeAgent = forcedAgent || selectedAgent;
    
    // Only route if not forced and not manually selected
    if (!activeAgent) {
      activeAgent = routeMessageToAgent(input) || null;
    }

    const history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }]
    }));

    const responseText = await chatWithGemini(input, history, activeAgent || undefined);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText || 'Lo siento, no pude procesar eso.',
      timestamp: new Date(),
      agentName: activeAgent?.name // Track who responded
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const isSimulator = !!forcedAgent;

  return (
    <div className={`flex flex-col h-full w-full ${isSimulator ? '' : 'max-w-4xl mx-auto p-4 lg:p-8'}`}>
      <div className={`bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-full ${isSimulator ? 'shadow-none border-0 rounded-none' : ''}`}>
        {/* Header Superior */}
        <div className={`${isSimulator ? 'bg-slate-800' : 'bg-indigo-600'} p-4 flex items-center justify-between text-white shrink-0`}>
          <div className="flex items-center gap-4">
            <div className="relative">
               <div className={`bg-white/20 p-2 rounded-xl ${selectedAgent || forcedAgent ? 'bg-emerald-400/20' : 'bg-indigo-500/50'}`}>
                {selectedAgent || forcedAgent ? <Bot className="w-6 h-6 text-emerald-300" /> : <Network className="w-6 h-6 text-indigo-200" />}
              </div>
              <div className={`absolute -top-1 -right-1 w-3 h-3 border-2 ${isSimulator ? 'border-slate-800' : 'border-indigo-600'} rounded-full animate-pulse ${selectedAgent || forcedAgent ? 'bg-emerald-500' : 'bg-indigo-300'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">{forcedAgent ? forcedAgent.name : selectedAgent ? selectedAgent.name : 'Red Neuronal (Auto)'}</h3>
                {!isSimulator && <ChevronDown className="w-3 h-3 opacity-50" />}
              </div>
              <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">
                {forcedAgent ? 'Entorno de Pruebas' : selectedAgent ? 'Modo Manual' : 'Enrutamiento Inteligente'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1.5 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
            {[
              {id: 'whatsapp', icon: Phone},
              {id: 'instagram', icon: Instagram},
              {id: 'messenger', icon: MessageCircle}
            ].map(p => (
              <button 
                key={p.id}
                onClick={() => setActivePlatform(p.id as any)}
                className={`p-2 rounded-lg transition-all ${activePlatform === p.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
              >
                <p.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Agente (Solo si no es simulador forzado) */}
        {!isSimulator && (
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
            <button 
                onClick={() => setSelectedAgent(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${!selectedAgent ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
                <Network className="w-3 h-3" /> Auto-Router
            </button>
            {agents.map(agent => (
                <button 
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${selectedAgent?.id === agent.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                >
                <Sparkles className="w-3 h-3" /> {agent.name}
                </button>
            ))}
            </div>
        )}

        {/* Contenido del Chat */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar"
        >
          {messages.map((m) => (
            <div 
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-400'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div>
                  {m.agentName && m.role === 'assistant' && (
                    <span className="text-[9px] font-bold text-indigo-600 mb-1 block ml-1">
                      {m.agentName}
                    </span>
                  )}
                  <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                  <span className={`text-[10px] mt-1 block px-1 ${m.role === 'user' ? 'text-right text-indigo-400' : 'text-slate-400'}`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activePlatform}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-3 items-center text-indigo-400">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Network className="w-4 h-4 animate-spin" />
                </div>
                <div className="text-xs font-bold">Escribiendo...</div>
              </div>
            </div>
          )}
        </div>

        {/* Entrada de Mensaje */}
        <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={forcedAgent ? `Prueba a ${forcedAgent.name}...` : "Escribe algo..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

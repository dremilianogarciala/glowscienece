
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Bot, Sparkles, Waves, Loader2, CheckSquare, Square, Shield, ArrowRight, CheckCircle2, AlertCircle, User, Mail, Phone, Info } from 'lucide-react';
import { AIAgent } from '../types';

interface VoiceAgentProps {
  agents: AIAgent[];
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ agents }) => {
  const voiceAgents = agents.filter(a => a.type === 'VOICE');
  voiceAgents.sort((a, b) => (a.voiceConfig?.isPrimary ? -1 : 1));
  
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [collectedData, setCollectedData] = useState<Record<string, string | null>>({});
  const [showExitWarning, setShowExitWarning] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (voiceAgents.length > 0 && !selectedAgent) {
      const primary = voiceAgents.find(a => a.voiceConfig?.isPrimary);
      const agentToSelect = primary || voiceAgents[0];
      handleSelectAgent(agentToSelect);
    }
  }, [agents]);

  // Enhanced heuristic for value extraction from live transcription
  useEffect(() => {
    if (isActive && transcription && selectedAgent?.voiceConfig?.requiredData) {
      const text = transcription.toLowerCase();
      const required = selectedAgent.voiceConfig.requiredData;
      
      const newCollected = { ...collectedData };
      let changed = false;

      required.forEach(field => {
        if (!newCollected[field]) {
          const fieldKey = field.toLowerCase();
          
          // Regex-based extraction logic
          if (fieldKey === 'nombre') {
            const match = transcription.match(/(?:mi nombre es|me llamo|soy|nombre es)\s+([a-zA-Z\s]{2,30})(?:\s+y|$|\.|\!|\?)/i);
            if (match && match[1]) {
              newCollected[field] = match[1].trim();
              changed = true;
            }
          } else if (fieldKey === 'correo' || fieldKey === 'email') {
            const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
            if (match) {
              newCollected[field] = match[0];
              changed = true;
            }
          } else if (fieldKey === 'teléfono' || fieldKey === 'telefono' || fieldKey === 'numero') {
            const match = text.match(/\d{7,15}/);
            if (match) {
              newCollected[field] = match[0];
              changed = true;
            }
          } else {
            // Generic keyword fallback for other fields
            const keywords: Record<string, string[]> = {
              'motivo': ['quiero', 'necesito', 'problema', 'soporte', 'ayuda', 'cita'],
              'fecha': ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo', 'enero', 'febrero', 'marzo'],
              'presupuesto': ['pesos', 'dólares', 'presupuesto', 'puedo pagar']
            };

            const triggers = keywords[fieldKey] || [fieldKey];
            if (triggers.some(t => text.includes(t))) {
              // For generic fields, just mark as detected if we can't extract a clean value
              newCollected[field] = "Capturado";
              changed = true;
            }
          }
        }
      });

      if (changed) setCollectedData(newCollected);
    }
  }, [transcription, isActive, selectedAgent]);

  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    if (agent.voiceConfig?.requiredData) {
      const initial: Record<string, string | null> = {};
      agent.voiceConfig.requiredData.forEach(field => initial[field] = null);
      setCollectedData(initial);
    }
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const startCall = async () => {
    if (!selectedAgent) return;
    setIsConnecting(true);
    setShowExitWarning(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputContext.createMediaStreamSource(stream);
            const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => (prev + " " + message.serverContent?.outputTranscription?.text).trim());
            } else if (message.serverContent?.inputTranscription) {
              setTranscription(prev => (prev + " " + message.serverContent?.inputTranscription?.text).trim());
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e: any) => {
            console.error("Gemini Live Error:", e);
            setIsConnecting(false);
            setIsActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `
            IDENTIDAD: ${selectedAgent.name}. 
            ROL: ${selectedAgent.role}. 
            OBJETIVO: Recopilar los siguientes datos: ${selectedAgent.voiceConfig?.requiredData?.join(', ') || 'Nombre, Motivo'}.
            Si el usuario olvida alguno, pregúntalo suavemente antes de despedirte.
            IMPORTANTE: Cuando el usuario diga su nombre, correo o teléfono, repíteselo para confirmar que lo has entendido correctamente.
            Sé eficiente y cálido.
          `,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedAgent.voiceConfig?.voiceName || 'Zephyr' } }
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Connection Error:", err);
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    const missing = selectedAgent?.voiceConfig?.requiredData?.filter(f => !collectedData[f]);
    if (missing && missing.length > 0 && !showExitWarning) {
      setShowExitWarning(true);
      return;
    }

    if (sessionRef.current) sessionRef.current.close();
    setIsActive(false);
    setTranscription('');
    setShowExitWarning(false);
    for (const source of sourcesRef.current.values()) source.stop();
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const getFieldIcon = (field: string) => {
    const f = field.toLowerCase();
    if (f === 'nombre') return <User className="w-4 h-4" />;
    if (f === 'correo' || f === 'email') return <Mail className="w-4 h-4" />;
    if (f === 'teléfono' || f === 'telefono' || f === 'numero') return <Phone className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  return (
    <div className="h-full flex bg-slate-900 text-white overflow-hidden">
      {!isActive && (
        <div className="w-80 border-r border-slate-800 bg-slate-900 p-8 flex flex-col shrink-0">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Sparkles className="text-indigo-400 w-5 h-5" /> Centro de Voz</h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Línea Principal</label>
              {voiceAgents.filter(a => a.voiceConfig?.isPrimary).map(a => (
                <button 
                  key={a.id} 
                  onClick={() => handleSelectAgent(a)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${selectedAgent?.id === a.id ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{a.name}</span>
                    <Mic className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[10px] text-slate-400">Estado: Disponible</span>
                </button>
              ))}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 flex items-center gap-2">Backups <Shield className="w-3 h-3" /></label>
              {voiceAgents.filter(a => !a.voiceConfig?.isPrimary).map(a => (
                <button key={a.id} onClick={() => handleSelectAgent(a)} className={`w-full p-4 rounded-2xl border transition-all text-left group relative ${selectedAgent?.id === a.id ? 'bg-purple-600 border-purple-500' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-1"><span className="font-bold text-sm">{a.name}</span><Shield className="w-3 h-3 text-purple-300" /></div>
                  <span className="text-[10px] text-slate-400">Estado: Standby</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        {isActive && (
          <div className="absolute top-8 left-8 bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl w-80 z-50 shadow-2xl animate-in slide-in-from-left duration-300">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                <span>Captura Inteligente</span>
                <Bot className="w-3 h-3 text-indigo-400" />
             </h4>
             <div className="space-y-4">
               {selectedAgent?.voiceConfig?.requiredData?.map(field => (
                 <div key={field} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        {collectedData[field] 
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in" />
                          : <div className="w-5 h-5 rounded-md border-2 border-slate-600"></div>
                        }
                        <div className="flex items-center gap-2 text-slate-400">
                            {getFieldIcon(field)}
                            <span className={`text-xs uppercase tracking-wider font-bold transition-all ${collectedData[field] ? 'text-emerald-400' : ''}`}>{field}</span>
                        </div>
                    </div>
                    {collectedData[field] && (
                        <div className="ml-8 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <span className="text-xs font-mono text-emerald-200 truncate block">{collectedData[field]}</span>
                        </div>
                    )}
                 </div>
               ))}
             </div>

             {showExitWarning && (
                <div className="mt-6 p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl animate-in fade-in">
                   <div className="flex items-center gap-2 text-rose-300 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Datos Incompletos</span>
                   </div>
                   <p className="text-[10px] text-rose-200">Aún faltan datos por recolectar. ¿Deseas finalizar de todos modos?</p>
                   <button onClick={() => { setShowExitWarning(false); endCall(); }} className="mt-2 w-full py-1.5 bg-rose-600 text-[10px] font-bold rounded-lg hover:bg-rose-500 transition-colors uppercase">Forzar Cierre</button>
                </div>
             )}
          </div>
        )}

        <div className="max-w-md w-full text-center space-y-12">
          <div className="relative">
            <div className={`w-48 h-48 bg-indigo-600/20 rounded-full mx-auto flex items-center justify-center relative z-10 transition-all duration-700 ${isActive ? 'scale-110 shadow-[0_0_100px_rgba(79,70,229,0.3)]' : ''}`}>
               <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-600 animate-pulse' : 'bg-slate-700'}`}>
                 <Mic className={`w-16 h-16 ${isActive ? 'text-white' : 'text-slate-500'}`} />
               </div>
            </div>
            {isActive && <div className="absolute inset-0 flex items-center justify-center"><div className="w-64 h-64 border-2 border-indigo-500/30 rounded-full animate-ping"></div></div>}
          </div>

          <div>
            <h2 className="text-4xl font-black mb-2 tracking-tight">{isActive ? selectedAgent?.name : 'OmniVoice AI'}</h2>
            <p className="text-indigo-400 text-xs tracking-widest uppercase font-bold">{isActive ? `Conectado via PCM Stream` : 'Listo para llamada entrante'}</p>
          </div>

          <div className="h-24 flex flex-col items-center justify-center">
            {isActive ? (
              <div className="space-y-4 w-full">
                <div className="flex justify-center gap-1 h-12 items-center">
                  {[...Array(12)].map((_, i) => <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.08}s` }}></div>)}
                </div>
                <div className="text-[10px] font-mono text-indigo-200/50 uppercase tracking-widest line-clamp-1 px-4">
                  {transcription || "Escuchando entrada..."}
                </div>
              </div>
            ) : <p className="text-slate-500 text-sm font-medium">Selecciona un agente y haz clic en Iniciar.</p>}
          </div>

          <div className="flex justify-center items-center gap-8">
            {isActive ? (
              <>
                <button onClick={() => setIsMuted(!isMuted)} className={`p-6 rounded-full transition-all border ${isMuted ? 'bg-rose-500 border-rose-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button onClick={endCall} className="p-8 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-2xl transition-all scale-110">
                  <PhoneOff className="w-8 h-8" />
                </button>
              </>
            ) : (
              <button onClick={startCall} disabled={isConnecting || !selectedAgent} className="bg-indigo-600 text-white px-14 py-6 rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-2xl transition-all flex items-center gap-4 group">
                {isConnecting ? <Loader2 className="w-7 h-7 animate-spin" /> : <Waves className="w-7 h-7 group-hover:animate-pulse" />}
                {isConnecting ? 'CONECTANDO...' : 'INICIAR LLAMADA'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;

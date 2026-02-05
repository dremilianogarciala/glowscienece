
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Bot, Sparkles, Waves, Loader2, PhoneCall, History, ShieldAlert } from 'lucide-react';
import { AIAgent } from '../types';

interface VoiceAgentProps {
  agents: AIAgent[];
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ agents }) => {
  const voiceAgents = agents.filter(a => a.type === 'VOICE');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(voiceAgents.find(a => a.voiceConfig?.isPrimary) || voiceAgents[0] || null);
  
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callStatus, setCallStatus] = useState<'IDLE' | 'RINGING' | 'CONNECTED'>('IDLE');

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (voiceAgents.length > 0 && !selectedAgent) {
      setSelectedAgent(voiceAgents[0]);
    }
  }, [voiceAgents]);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startCall = async () => {
    if (!selectedAgent) return;
    setIsConnecting(true);
    setCallStatus('RINGING');
    
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
            setCallStatus('CONNECTED');
            const source = inputContext.createMediaStreamSource(stream);
            const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { 
                    data: encode(new Uint8Array(int16.buffer)), 
                    mimeType: 'audio/pcm;rate=16000' 
                  } 
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => {
            console.error(e);
            endCall();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: `
            IDENTIDAD: ${selectedAgent.name}. 
            ROL: ${selectedAgent.role}. 
            INSTRUCCIÓN: ${selectedAgent.systemPrompt}. 
            HABLA CON VOZ: ${selectedAgent.voiceConfig?.voiceName || 'Zephyr'}.
            VELOCIDAD: ${selectedAgent.voiceConfig?.speed || 1.0}x.
            Sé breve y telefónicamente eficiente.
          ` }]},
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: selectedAgent.voiceConfig?.voiceName || 'Zephyr' 
              } 
            }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      setIsConnecting(false);
      setCallStatus('IDLE');
    }
  };

  const endCall = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsActive(false);
    setCallStatus('IDLE');
    for (const source of sourcesRef.current.values()) source.stop();
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="h-full flex bg-slate-950 text-white overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar de Agentes de Voz */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 p-8 flex flex-col shrink-0">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3 tracking-tight">
          <Waves className="text-indigo-500 w-6 h-6" /> VOICE STUDIO
        </h3>

        <div className="space-y-6">
           <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-4">Seleccionar Agente</label>
              <div className="space-y-3">
                {voiceAgents.length > 0 ? (
                  voiceAgents.map(a => (
                    <button 
                      key={a.id}
                      onClick={() => !isActive && setSelectedAgent(a)}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${selectedAgent?.id === a.id ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/10' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                    >
                      <div>
                        <p className="font-bold text-sm">{a.name}</p>
                        <p className="text-[10px] text-white/50">{a.voiceConfig?.voiceName} • {a.voiceConfig?.speed}x</p>
                      </div>
                      <Bot className={`w-4 h-4 ${selectedAgent?.id === a.id ? 'text-white' : 'text-slate-600'}`} />
                    </button>
                  ))
                ) : (
                  <div className="p-4 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-xs text-center">
                    Crea un agente tipo VOICE en "Mis Agentes".
                  </div>
                )}
              </div>
           </div>

           <div className="bg-slate-800/50 p-6 rounded-[24px] border border-slate-700">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Parámetros de Voz</h4>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Modelo</span>
                    <span className="font-bold text-indigo-400">Gemini 2.5 Live</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Latencia</span>
                    <span className="font-bold text-emerald-400">Real-time</span>
                 </div>
              </div>
           </div>
        </div>

        <button className="mt-auto flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors">
          <History className="w-4 h-4" /> Historial de Llamadas
        </button>
      </div>

      {/* Interfaz de Llamada Principal */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] transition-all duration-1000 ${isActive ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`}></div>
        </div>

        <div className="max-w-md w-full text-center space-y-12 relative z-10">
          <div className="relative">
            <div className={`w-56 h-56 bg-white/5 dark:bg-slate-800/50 rounded-[60px] mx-auto flex items-center justify-center relative z-10 border border-white/10 transition-all duration-700 ${isActive ? 'scale-110 shadow-[0_0_80px_rgba(79,70,229,0.3)] rotate-3' : ''}`}>
               <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 animate-pulse' : 'bg-slate-800'}`}>
                 <Bot className="w-20 h-20 text-white" />
               </div>
            </div>
            
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 border border-indigo-500/40 rounded-full animate-ping"></div>
                <div className="w-80 h-80 border border-indigo-500/20 rounded-full animate-ping delay-300"></div>
              </div>
            )}
          </div>

          <div className="space-y-3">
             <h2 className="text-4xl font-black tracking-tighter uppercase">{isActive ? selectedAgent?.name : 'ESPERA'}</h2>
             <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.4em]">
                {callStatus === 'RINGING' ? 'Estableciendo Conexión...' : callStatus === 'CONNECTED' ? 'En Llamada' : 'Seleccionar Línea'}
             </p>
          </div>

          <div className="flex justify-center items-center gap-8">
            {isActive ? (
              <>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-6 rounded-[24px] transition-all border ${isMuted ? 'bg-rose-500/20 text-rose-500 border-rose-500/50' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <button 
                  onClick={endCall}
                  className="p-10 bg-rose-600 text-white rounded-[32px] hover:bg-rose-700 shadow-2xl shadow-rose-900/40 transition-all hover:scale-105"
                >
                  <PhoneOff className="w-10 h-10" />
                </button>
              </>
            ) : (
              <button 
                onClick={startCall}
                disabled={isConnecting || !selectedAgent}
                className="bg-indigo-600 text-white px-16 py-6 rounded-[32px] font-black text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-900/40 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <PhoneCall className="w-6 h-6" />}
                {isConnecting ? 'CONECTANDO...' : 'LLAMAR'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;

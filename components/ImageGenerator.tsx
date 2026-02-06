
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Download, Loader2, Image as ImageIcon, X, Megaphone, 
  Video, CalendarClock, Layers, Repeat, Trash2, Bot, Edit3, 
  ArrowRight, Play, Maximize2, History, Film, Camera, Clock, 
  Instagram, Smartphone, Facebook, Calendar, CheckCircle2, Share2,
  FileText
} from 'lucide-react';
import { ImageSize, AspectRatio, AIAgent, MarketingAsset } from '../types';
import { generateAIImage, editAIImage, generateAIVideo } from '../services/geminiService';

interface MarketingStudioProps {
  agents: AIAgent[];
  assets: MarketingAsset[];
  setAssets: React.Dispatch<React.SetStateAction<MarketingAsset[]>>;
}

type SocialFormat = {
  id: string;
  label: string;
  ratio: AspectRatio;
  icon: React.ElementType;
};

const SOCIAL_FORMATS: SocialFormat[] = [
  { id: 'ig-post', label: 'Instagram Post', ratio: '1:1', icon: Instagram },
  { id: 'ig-story', label: 'Instagram Story', ratio: '9:16', icon: Smartphone },
  { id: 'tiktok', label: 'TikTok Post', ratio: '9:16', icon: Play },
  { id: 'fb-post', label: 'Facebook Post', ratio: '4:3', icon: Facebook },
  { id: 'yt-thumb', label: 'YouTube Thumb', ratio: '16:9', icon: Play },
  { id: 'custom-portrait', label: 'Format Retrato', ratio: '3:4', icon: Camera },
];

const videoLoadingMessages = [
  "Iniciando motor cinematográfico Veo 3.1...",
  "Analizando coherencia semántica del prompt...",
  "Renderizando fotogramas clave con alta fidelidad...",
  "Generando flujo óptico y movimiento natural...",
  "Ajustando coherencia temporal y física...",
  "Aplicando post-procesamiento HDR...",
  "Finalizando composición de video..."
];

const MarketingStudio: React.FC<MarketingStudioProps> = ({ agents, assets, setAssets }) => {
  const marketingAgent = agents.find(a => a.type === 'MARKETING');
  
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [size, setSize] = useState<ImageSize>('1K');
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>(SOCIAL_FORMATS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [mode, setMode] = useState<'CREATE' | 'EDIT' | 'SCHEDULE'>('CREATE');
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null);
  const [editingSourceAsset, setEditingSourceAsset] = useState<MarketingAsset | null>(null);

  // Scheduling State
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [schedulePlatform, setSchedulePlatform] = useState<'instagram' | 'tiktok' | 'whatsapp' | 'facebook'>('instagram');
  const [scheduleCaption, setScheduleCaption] = useState('');

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      if (contentType === 'VIDEO') {
        let idx = 0;
        setStatusMessage(videoLoadingMessages[0]);
        interval = setInterval(() => {
          idx = (idx + 1) % videoLoadingMessages.length;
          setStatusMessage(videoLoadingMessages[idx]);
        }, 5000); // Faster cycle for more dynamic feel
      } else {
        setStatusMessage('Generando contenido optimizado...');
      }
    } else {
      setStatusMessage('');
    }
    return () => clearInterval(interval);
  }, [isGenerating, contentType]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (!marketingAgent) {
      setError("Necesitas configurar un Agente de Marketing primero.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      let mediaUrl = '';
      if (mode === 'EDIT' && editingSourceAsset) {
        mediaUrl = await editAIImage(editingSourceAsset.url, prompt, selectedFormat.ratio);
      } else if (contentType === 'VIDEO') {
        mediaUrl = await generateAIVideo(prompt, selectedFormat.ratio === '9:16' ? '9:16' : '16:9');
      } else {
        mediaUrl = await generateAIImage(prompt, size, selectedFormat.ratio);
      }
      
      const newAsset: MarketingAsset = {
          id: Date.now().toString(),
          url: mediaUrl,
          prompt: prompt,
          type: contentType,
          createdAt: new Date(),
          agentName: marketingAgent.name
      };

      setAssets(prev => [newAsset, ...prev]);
      setSelectedAsset(newAsset);
      setMode('CREATE');
      setEditingSourceAsset(null);
      setPrompt('');
    } catch (err: any) {
      if (err.message === "AUTH_REQUIRED") {
        await window.aistudio?.openSelectKey();
      } else {
        setError("Error de motor IA: " + err.message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleSubmit = () => {
    if (!selectedAsset || !scheduleDate) return;
    
    const updatedAssets = assets.map(a => {
        if (a.id === selectedAsset.id) {
            return {
                ...a,
                scheduledFor: new Date(`${scheduleDate}T${scheduleTime}`),
                targetPlatform: schedulePlatform,
                caption: scheduleCaption
            };
        }
        return a;
    });

    setAssets(updatedAssets);
    const updated = updatedAssets.find(a => a.id === selectedAsset.id);
    if (updated) setSelectedAsset(updated);
    setMode('CREATE');
    setScheduleCaption('');
    alert(`Post programado con éxito.`);
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar bg-[#f8fafc] dark:bg-slate-950">
      <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[700px]">
        
        <div className="w-full lg:w-[420px] space-y-6 shrink-0">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl transition-all">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Megaphone className="text-indigo-600 w-6 h-6" /> Marketing Hub
              </h2>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
                <button 
                  onClick={() => setMode('CREATE')} 
                  className={`p-2.5 rounded-xl transition-all ${mode === 'CREATE' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-400'}`}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button 
                  disabled={!selectedAsset} 
                  onClick={() => { setMode('SCHEDULE'); if(selectedAsset?.caption) setScheduleCaption(selectedAsset.caption); }} 
                  className={`p-2.5 rounded-xl transition-all ${mode === 'SCHEDULE' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-400 disabled:opacity-20'}`}
                >
                  <CalendarClock className="w-4 h-4" />
                </button>
              </div>
            </div>

            {mode === 'SCHEDULE' ? (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-indigo-600" /> Programar Post
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plataforma</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['instagram', 'tiktok', 'facebook', 'whatsapp'].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setSchedulePlatform(p as any)}
                                        className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${schedulePlatform === p ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Texto del Post (Copy)</label>
                            <textarea 
                                value={scheduleCaption}
                                onChange={e => setScheduleCaption(e.target.value)}
                                placeholder="Escribe el copy persuasivo que acompañará a la imagen..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs dark:text-white h-24 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha</label>
                                <input 
                                    type="date" 
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hora</label>
                                <input 
                                    type="time" 
                                    value={scheduleTime}
                                    onChange={e => setScheduleTime(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold dark:text-white"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleScheduleSubmit}
                            disabled={!scheduleDate}
                            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-5 h-5" /> AGENDAR PUBLICACIÓN
                        </button>
                        <button onClick={() => setMode('CREATE')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Volver</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                        <button 
                        onClick={() => setContentType('IMAGE')} 
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl flex items-center justify-center gap-2 transition-all ${contentType === 'IMAGE' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                        <Camera className="w-4 h-4" /> IMAGEN PRO
                        </button>
                        <button 
                        onClick={() => setContentType('VIDEO')} 
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl flex items-center justify-center gap-2 transition-all ${contentType === 'VIDEO' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600' : 'text-slate-500'}`}
                        >
                        <Film className="w-4 h-4" /> VIDEO VEO
                        </button>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Prompt Creativo</label>
                        <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={contentType === 'VIDEO' ? "Ej: Un drone recorriendo una ciudad futurista..." : "Ej: Un post aesthetic para Instagram..."}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm focus:ring-4 focus:ring-indigo-500/10 h-32 resize-none transition-all dark:text-white shadow-inner"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Formatos de Redes</label>
                        <div className="grid grid-cols-2 gap-2">
                            {SOCIAL_FORMATS.map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setSelectedFormat(f)}
                                    className={`p-3 rounded-xl border text-[9px] font-black uppercase flex flex-col items-center gap-1.5 transition-all ${selectedFormat.id === f.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}
                                >
                                    <f.icon className="w-4 h-4" />
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={!prompt.trim() || isGenerating} 
                        className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        contentType === 'VIDEO' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                        } disabled:opacity-50 dark:shadow-none`}
                    >
                        {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                        {isGenerating ? 'PROCESANDO...' : 'GENERAR Y OPTIMIZAR'}
                    </button>
                </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[350px]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" /> Galería Studio
               </h3>
               <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-[10px] font-black">{assets.length}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
               {assets.map(asset => (
                   <div 
                    key={asset.id} 
                    onClick={() => setSelectedAsset(asset)}
                    className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative group ${selectedAsset?.id === asset.id ? 'border-indigo-600 scale-95 shadow-inner' : 'border-transparent hover:border-slate-300'}`}
                   >
                     {asset.type === 'VIDEO' ? (
                       <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white/50" />
                          <div className="absolute top-1 right-1 bg-rose-600 rounded p-0.5"><Film className="w-2.5 h-2.5 text-white" /></div>
                       </div>
                     ) : (
                       <img src={asset.url} className="w-full h-full object-cover" />
                     )}
                     
                     {asset.scheduledFor && (
                         <div className="absolute bottom-1 left-1 bg-emerald-500 text-white rounded p-0.5 shadow-sm">
                            <Clock className="w-3 h-3" />
                         </div>
                     )}

                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white" />
                     </div>
                   </div>
               ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex-1 flex items-center justify-center relative overflow-hidden group min-h-[400px]">
             
             {isGenerating ? (
               <div className="text-center space-y-6 animate-pulse max-w-sm px-4">
                  <Loader2 className="w-20 h-20 text-indigo-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase leading-tight tracking-tighter">{statusMessage}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Motor de Generación Activo</p>
               </div>
             ) : selectedAsset ? (
               <div className="w-full h-full flex flex-col p-4">
                  <div className="flex-1 rounded-[2rem] overflow-hidden bg-black flex items-center justify-center shadow-2xl relative">
                    {selectedAsset.type === 'VIDEO' ? (
                       <video 
                        key={selectedAsset.url} 
                        src={selectedAsset.url} 
                        controls 
                        autoPlay 
                        loop 
                        className="max-w-full max-h-full"
                       />
                    ) : (
                       <img src={selectedAsset.url} className="max-w-full max-h-full object-contain" />
                    )}
                    
                    <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => setMode('SCHEDULE')} className="p-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white shadow-2xl">
                          <CalendarClock className="w-6 h-6" />
                       </button>
                       <a href={selectedAsset.url} download={`omni_${selectedAsset.id}`} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white">
                          <Download className="w-6 h-6" />
                       </a>
                       <button onClick={() => deleteAsset(selectedAsset.id)} className="p-4 bg-rose-600/20 hover:bg-rose-600 rounded-2xl text-white">
                          <Trash2 className="w-6 h-6" />
                       </button>
                    </div>

                    {selectedAsset.scheduledFor && (
                        <div className="absolute bottom-6 left-6 right-6 bg-emerald-500/90 backdrop-blur text-white px-6 py-4 rounded-2xl text-xs font-bold animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-2 font-black uppercase tracking-widest text-[10px]">
                                <Clock className="w-4 h-4" /> Programado para {selectedAsset.targetPlatform}
                            </div>
                            {selectedAsset.caption && (
                                <p className="line-clamp-2 bg-black/20 p-2 rounded-lg italic">"{selectedAsset.caption}"</p>
                            )}
                            <div className="mt-2 text-[10px] opacity-80">
                                {selectedAsset.scheduledFor.toLocaleDateString()} a las {selectedAsset.scheduledFor.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    )}
                  </div>

                  <div className="mt-6 px-4 pb-4">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Prompt Utilizado</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed">
                        "{selectedAsset.prompt}"
                    </p>
                  </div>
               </div>
             ) : (
               <div className="text-center opacity-10 space-y-4">
                  <Layers className="w-32 h-32 mx-auto text-slate-400" />
                  <p className="text-3xl font-black uppercase">Workspace Studio</p>
               </div>
             )}
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] backdrop-blur-xl flex items-center justify-center">
                   <Bot className="w-8 h-8" />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight">Post Scheduler Engine</h4>
                   <p className="text-indigo-100 text-sm font-medium">Automatización de contenido inteligente.</p>
                </div>
             </div>
             <div className="text-center px-6">
                <p className="text-[10px] font-black uppercase text-indigo-200">Formatos Optimizados</p>
                <p className="text-2xl font-black">Activos</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingStudio;

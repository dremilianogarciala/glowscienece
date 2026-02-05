
import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  Loader2, 
  Image as ImageIcon,
  Instagram,
  Send,
  X,
  Megaphone,
  Layers,
  Trash2,
  Bot,
  Zap,
  Layout
} from 'lucide-react';
import { ImageSize, AspectRatio, AIAgent, MarketingAsset } from '../types';
import { generateAIImage } from '../services/geminiService';

interface MarketingStudioProps {
  agents: AIAgent[];
  assets: MarketingAsset[];
  setAssets: React.Dispatch<React.SetStateAction<MarketingAsset[]>>;
}

const MarketingStudio: React.FC<MarketingStudioProps> = ({ agents, assets, setAssets }) => {
  const marketingAgents = agents.filter(a => a.type === 'MARKETING');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(marketingAgents[0] || null);
  
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (!selectedAgent) {
      setError("Debes seleccionar o crear un Agente de Marketing primero.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    
    try {
      // Usamos el servicio que ya integra gemini-2.5-flash-image (Nano Banana)
      const mediaUrl = await generateAIImage(prompt, '1K', ratio);
      
      const newAsset: MarketingAsset = {
          id: Date.now().toString(),
          url: mediaUrl,
          prompt: prompt,
          type: 'IMAGE',
          createdAt: new Date(),
          agentName: selectedAgent.name
      };

      setAssets(prev => [newAsset, ...prev]);
      setPreviewImage(mediaUrl);

    } catch (err: any) {
      if (err.message === "AUTH_REQUIRED") await window.aistudio?.openSelectKey();
      else setError("Error al generar imagen: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteAsset = (id: string) => {
      setAssets(prev => prev.filter(a => a.id !== id));
      if (previewImage === assets.find(a => a.id === id)?.url) setPreviewImage(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-8 h-full">
        
        {/* Panel de Control Izquierdo */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-500 p-2 rounded-xl">
                <Megaphone className="text-white w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">STUDIO</h2>
            </div>

            <div className="space-y-5">
              {/* Selector de Agente Marketing */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Agente Creativo</label>
                <select 
                  value={selectedAgent?.id || ''} 
                  onChange={(e) => setSelectedAgent(agents.find(a => a.id === e.target.value) || null)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-rose-500/20 outline-none"
                >
                  {marketingAgents.length > 0 ? (
                    marketingAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  ) : (
                    <option value="">Sin Agentes Marketing</option>
                  )}
                </select>
              </div>

              {/* Prompt de Diseño */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Prompt de Diseño</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Un banner minimalista para una peluquería con tonos neon..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm dark:text-white focus:ring-2 focus:ring-rose-500/20 outline-none h-32 resize-none"
                />
              </div>

              {/* Ajustes de Imagen */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Formato</label>
                   <div className="grid grid-cols-3 gap-2">
                     {(['1:1', '9:16', '16:9'] as AspectRatio[]).map(r => (
                       <button 
                        key={r} 
                        onClick={() => setRatio(r)}
                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${ratio === r ? 'bg-rose-500 text-white border-rose-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                       >
                         {r}
                       </button>
                     ))}
                   </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={!prompt.trim() || isGenerating || !selectedAgent}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGenerating ? 'Generando con Nano Banana...' : 'Generar Arte IA'}
              </button>

              {error && <p className="text-[10px] text-rose-500 text-center font-bold bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">{error}</p>}
            </div>
          </div>
          
          {/* Tip de Agente */}
          <div className="bg-indigo-600 p-6 rounded-3xl text-white relative overflow-hidden group">
             <div className="relative z-10">
                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Bot className="w-4 h-4" /> Tip Creativo
                </h4>
                <p className="text-[10px] text-indigo-100 leading-relaxed">
                  Tu agente {selectedAgent?.name || 'Marketing'} usará su "Instrucción de Sistema" para dar contexto a tus prompts automáticamente.
                </p>
             </div>
             <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 group-hover:rotate-12 transition-transform" />
          </div>
        </div>

        {/* Área de Visualización y Galería */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Preview Principal */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 flex-1 flex items-center justify-center relative overflow-hidden min-h-[400px] group">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4 animate-pulse">
                 <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-rose-500 animate-spin" />
                 </div>
                 <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Transformando Prompt en Píxeles...</p>
              </div>
            ) : previewImage ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                 <img src={previewImage} alt="Generado" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain bg-black/10 transition-all duration-700" />
                 <div className="absolute top-8 right-8 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={previewImage} download="glow-agent-art.png" className="bg-white text-slate-800 p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform"><Download className="w-5 h-5" /></a>
                    <button onClick={() => setPreviewImage(null)} className="bg-rose-500 text-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform"><X className="w-5 h-5" /></button>
                 </div>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-xs">
                 <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl mx-auto flex items-center justify-center shadow-sm">
                   <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                 </div>
                 <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">Describe tu idea en el panel izquierdo para empezar a crear contenido visual.</p>
              </div>
            )}
          </div>

          {/* Galería Inferior */}
          <div className="h-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Layout className="w-3 h-3" /> RECIENTES ({assets.length})
              </h3>
            </div>
            
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-2 h-full">
              {assets.length === 0 ? (
                <div className="w-full flex items-center justify-center opacity-20 italic text-xs">Aún no has generado activos.</div>
              ) : (
                assets.map(asset => (
                  <div 
                    key={asset.id} 
                    onClick={() => setPreviewImage(asset.url)}
                    className={`h-24 w-24 rounded-2xl shrink-0 cursor-pointer border-2 transition-all relative group overflow-hidden ${previewImage === asset.url ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-100 dark:border-slate-800'}`}
                  >
                    <img src={asset.url} alt="Gal" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                      className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingStudio;

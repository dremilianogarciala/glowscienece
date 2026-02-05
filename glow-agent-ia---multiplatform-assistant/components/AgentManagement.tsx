
import React from 'react';
import { AIAgent } from '../types';
import { Trash2, Edit, Bot, Mic, Megaphone, GitMerge, DollarSign, Plus } from 'lucide-react';

interface AgentManagementProps {
  agents: AIAgent[];
  onDelete: (id: string) => void;
  onEdit: (agent: AIAgent) => void;
  onCreate: () => void;
}

const AgentManagement: React.FC<AgentManagementProps> = ({ agents, onDelete, onEdit, onCreate }) => {
  const getIcon = (type: string) => {
    switch(type) {
      case 'VOICE': return <Mic className="w-5 h-5 text-amber-600" />;
      case 'MARKETING': return <Megaphone className="w-5 h-5 text-rose-600" />;
      case 'SALES': return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'ORCHESTRATOR': return <GitMerge className="w-5 h-5 text-indigo-600" />;
      default: return <Bot className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800">Gestión de Agentes</h2>
        <p className="text-slate-500">Administra, edita o elimina tus inteligencias artificiales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Agent Card */}
        <button 
          onClick={onCreate}
          className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-indigo-50 hover:border-indigo-400 transition-all group h-full min-h-[300px]"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-indigo-900 text-lg">Crear Nuevo Agente</h3>
            <p className="text-sm text-indigo-500/80">Añadir una nueva inteligencia</p>
          </div>
        </button>

        {agents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                {getIcon(agent.type)}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(agent)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(agent.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-800 text-lg mb-1">{agent.name}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{agent.role} • {agent.type}</p>
            
            <p className="text-sm text-slate-500 line-clamp-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100 h-20">
              {agent.systemPrompt}
            </p>

            <div className="flex flex-wrap gap-2">
               {agent.triggers.slice(0, 3).map((t, i) => (
                 <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                   {t}
                 </span>
               ))}
               {agent.triggers.length > 3 && <span className="text-[10px] text-slate-400 px-1">+{agent.triggers.length - 3}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentManagement;

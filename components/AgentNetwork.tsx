
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AIAgent, AgentType } from '../types';
import { 
  Network, Zap, GitMerge, User, AlertTriangle, Info, Settings, 
  Activity, Filter, Eye, EyeOff, CheckCircle2, AlertCircle, XCircle,
  ArrowRight, Bot, Target, RefreshCw, Cpu
} from 'lucide-react';

interface AgentNetworkProps {
  agents: AIAgent[];
  onAgentClick: (agent: AIAgent) => void;
}

type HealthStatus = 'Online' | 'Degraded' | 'Offline';

interface HealthMetrics {
  status: HealthStatus;
  uptime: string;
  latency: number;
}

interface Connection {
  id: string;
  fromId: string; // Agent ID or 'USER'
  toId: string;   // Agent ID
  fromName: string;
  toName: string;
  type: 'FLOW' | 'HANDOFF';
  isValid: boolean;
  warning?: string;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ agents, onAgentClick }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [filterAgentType, setFilterAgentType] = useState<AgentType | 'ALL'>('ALL');
  const [visibleConnectionTypes, setVisibleConnectionTypes] = useState<Set<string>>(new Set(['FLOW', 'HANDOFF']));

  // --- HEALTH SIMULATION ---
  const [nodeHealth, setNodeHealth] = useState<Record<string, HealthMetrics>>({});

  const generateHealthData = () => {
    const health: Record<string, HealthMetrics> = {};
    agents.forEach(agent => {
      const rand = Math.random();
      let status: HealthStatus = 'Online';
      if (rand > 0.97) status = 'Offline';
      else if (rand > 0.85) status = 'Degraded';
      
      health[agent.id] = {
        status,
        uptime: (98.5 + Math.random() * 1.4).toFixed(2) + '%',
        latency: status === 'Online' ? Math.floor(Math.random() * 60 + 15) : status === 'Degraded' ? Math.floor(Math.random() * 600 + 200) : 0
      };
    });
    setNodeHealth(health);
  };

  useEffect(() => {
    generateHealthData();
    const interval = setInterval(generateHealthData, 15000); // Dynamic update every 15s
    return () => clearInterval(interval);
  }, [agents]);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const routerAgent = agents.find(a => a.isRouter);
  
  // Filter specialists based on selected type
  const visibleAgents = useMemo(() => {
    let list = agents;
    if (filterAgentType !== 'ALL') {
      list = list.filter(a => a.type === filterAgentType || a.isRouter);
    }
    return list;
  }, [agents, filterAgentType]);

  const specialists = visibleAgents.filter(a => !a.isRouter);

  // --- ARCHITECTURAL VALIDATION ---
  const validateConnection = (from: AIAgent | 'USER', to: AIAgent): { isValid: boolean; warning?: string } => {
    if (from === 'USER') return { isValid: true };
    
    // NEW RULE: Prevent direct Marketing -> Sales without Orchestrator
    if (from.type === 'MARKETING' && to.type === 'SALES' && !routerAgent) {
      return { 
        isValid: false, 
        warning: 'BLOQUEO ARQUITECTÓNICO: No se permiten conexiones directas Marketing -> Ventas sin un Orquestador para centralizar la atribución.' 
      };
    }

    if (from.type === 'VOICE' && to.type === 'MARKETING') return { isValid: false, warning: 'ERROR: Voz no debe derivar a Marketing sin Orquestador.' };
    if (from.type === 'AGENDA' && to.type === 'SALES' && !routerAgent) return { isValid: false, warning: 'RIESGO: Agenda a Ventas sin validación central.' };
    if (from.type === 'MARKETING' && to.type === 'AGENDA' && !routerAgent) return { isValid: false, warning: 'INCOMPLETO: Marketing requiere paso de calificación previo.' };
    
    return { isValid: true };
  };

  const connections = useMemo(() => {
    const newConnections: Connection[] = [];
    const visibleIds = new Set(visibleAgents.map(a => a.id));

    if (routerAgent && visibleIds.has(routerAgent.id)) {
      newConnections.push({ id: `USER-${routerAgent.id}`, fromId: 'USER', toId: routerAgent.id, fromName: 'Usuario', toName: routerAgent.name, type: 'FLOW', isValid: true });
      specialists.forEach(spec => {
        newConnections.push({ id: `${routerAgent.id}-${spec.id}`, fromId: routerAgent.id, toId: spec.id, fromName: routerAgent.name, toName: spec.name, type: 'FLOW', isValid: true });
      });
    } else {
      specialists.forEach(spec => {
        newConnections.push({ id: `USER-${spec.id}`, fromId: 'USER', toId: spec.id, fromName: 'Usuario', toName: spec.name, type: 'FLOW', isValid: true });
      });
    }

    agents.forEach(source => {
      if (source.handoffInstructions && visibleIds.has(source.id)) {
        agents.forEach(target => {
          if (source.id !== target.id && visibleIds.has(target.id) && source.handoffInstructions.toLowerCase().includes(target.name.toLowerCase())) {
            const val = validateConnection(source, target);
            newConnections.push({ id: `${source.id}-${target.id}`, fromId: source.id, toId: target.id, fromName: source.name, toName: target.name, type: 'HANDOFF', isValid: val.isValid, warning: val.warning });
          }
        });
      }
    });

    return newConnections;
  }, [agents, routerAgent, visibleAgents]);

  const updatePositions = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions: Record<string, NodePosition> = {};
    nodeRefs.current.forEach((el, id) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      newPositions[id] = { x: rect.left - containerRect.left, y: rect.top - containerRect.top, width: rect.width, height: rect.height };
    });
    setPositions(newPositions);
  };

  useEffect(() => {
    updatePositions();
    const t = setTimeout(updatePositions, 300);
    window.addEventListener('resize', updatePositions);
    return () => { window.removeEventListener('resize', updatePositions); clearTimeout(t); };
  }, [visibleAgents.length]);

  const getLineCoords = (conn: Connection) => {
    const start = positions[conn.fromId];
    const end = positions[conn.toId];
    if (!start || !end) return null;
    return { x1: start.x + start.width, y1: start.y + start.height / 2, x2: end.x, y2: end.y + end.height / 2 };
  };

  const activeHighlightId = hoveredNodeId || selectedNodeId;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar flex flex-col">
      <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-left">
          <h2 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4">
            <Network className="text-indigo-600 w-10 h-10" /> Topología OmniAgent
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl font-medium">
            Monitorización en tiempo real de la salud y conectividad de tu red de agentes IA. 
            Haz clic en un nodo para auditar flujos.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-800 p-3 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 px-4 border-r border-slate-100 dark:border-slate-700">
             <Filter className="w-4 h-4 text-slate-400" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista de Red</span>
          </div>
          
          <div className="flex gap-2">
            <select 
              value={filterAgentType}
              onChange={(e) => setFilterAgentType(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border-none text-[10px] font-black text-slate-500 rounded-xl px-4 py-2 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer uppercase transition-all"
            >
              <option value="ALL">TODOS LOS AGENTES</option>
              <option value="VOICE">VOICE AGENTS</option>
              <option value="MARKETING">MARKETING AGENTS</option>
              <option value="SALES">SALES AGENTS</option>
              <option value="AGENDA">AGENDA AGENTS</option>
              <option value="ORCHESTRATOR">ORCHESTRATORS</option>
            </select>
            <button 
              onClick={generateHealthData} 
              className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
              title="Actualizar Salud"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div 
        className="relative flex-1 min-h-[700px] flex items-center justify-center bg-slate-50/40 dark:bg-slate-900/40 rounded-[4rem] border border-slate-200 dark:border-slate-800 p-12 overflow-hidden transition-colors duration-500" 
        ref={containerRef}
        onClick={() => { setSelectedNodeId(null); setSelectedConnection(null); }}
      >
        {selectedConnection && (
          <div className="absolute top-10 right-10 z-50 w-80 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-[2.5rem] shadow-2xl p-7 animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedConnection.isValid ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                    {selectedConnection.isValid ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Detalle de Flujo</h4>
               </div>
               <button onClick={() => setSelectedConnection(null)} className="text-slate-300 hover:text-rose-500 p-1"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
               <span className="text-xs font-black truncate max-w-[80px] text-slate-700 dark:text-slate-200">{selectedConnection.fromName}</span>
               <ArrowRight className="w-5 h-5 text-indigo-400 animate-pulse" />
               <span className="text-xs font-black truncate max-w-[80px] text-slate-700 dark:text-slate-200">{selectedConnection.toName}</span>
            </div>
            {!selectedConnection.isValid && (
              <div className="mt-5 p-5 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 rounded-2xl text-[10px] text-rose-700 dark:text-rose-400 font-bold leading-relaxed flex gap-3">
                <AlertTriangle className="w-6 h-6 shrink-0" /> {selectedConnection.warning}
              </div>
            )}
          </div>
        )}

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" /></marker>
                <marker id="arrow-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" /></marker>
                <marker id="arrow-warning" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker>
            </defs>
            {connections.filter(c => visibleConnectionTypes.has(c.type)).map(conn => {
                const coords = getLineCoords(conn);
                if (!coords) return null;
                const isActive = activeHighlightId === conn.fromId || activeHighlightId === conn.toId;
                const isWarning = !conn.isValid;
                
                let stroke = isWarning ? '#ef4444' : (isActive ? '#6366f1' : '#cbd5e1');
                let marker = isWarning ? 'arrow-warning' : (isActive ? 'arrow-active' : 'arrow');

                const midX = coords.x1 + (coords.x2 - coords.x1) * 0.5;
                const midY = coords.y1 + (coords.y2 - coords.y1) * 0.5;

                return (
                    <g key={conn.id} opacity={activeHighlightId && !isActive && !isWarning ? 0.1 : 1} className="transition-all duration-500 cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); setSelectedConnection(conn); }}>
                        <path d={`M ${coords.x1} ${coords.y1} C ${midX} ${coords.y1}, ${midX} ${coords.y2}, ${coords.x2} ${coords.y2}`} fill="none" stroke="transparent" strokeWidth="20" />
                        <path d={`M ${coords.x1} ${coords.y1} C ${midX} ${coords.y1}, ${midX} ${coords.y2}, ${coords.x2} ${coords.y2}`} fill="none" stroke={stroke} strokeWidth={isWarning ? 3 : (isActive ? 3 : 1.5)} strokeDasharray={isWarning ? "5,5" : (conn.type === 'HANDOFF' ? "6,6" : "none")} markerEnd={`url(#${marker})`} />
                        {isWarning && (
                          <g transform={`translate(${midX - 10}, ${midY - 10})`}>
                            <rect width="20" height="20" rx="4" fill="#ef4444" />
                            <text x="10" y="15" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">!</text>
                          </g>
                        )}
                    </g>
                );
            })}
        </svg>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-32 w-full relative z-10">
          <div 
            ref={el => { if (el) nodeRefs.current.set('USER', el); }}
            className="flex flex-col items-center gap-6 cursor-pointer group"
            onMouseEnter={() => setHoveredNodeId('USER')}
            onMouseLeave={() => setHoveredNodeId(null)}
            onClick={(e) => { e.stopPropagation(); setSelectedNodeId('USER'); }}
          >
            <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-2xl ${activeHighlightId === 'USER' ? 'bg-indigo-600 border-indigo-400 scale-110' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
              <User className={`w-14 h-14 transition-colors ${activeHighlightId === 'USER' ? 'text-white' : 'text-slate-300'}`} />
            </div>
            <div className="px-6 py-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">GATEWAY</div>
          </div>

          {routerAgent && (
             <div className="flex flex-col items-center group">
                 <div 
                    ref={el => { if (el) nodeRefs.current.set(routerAgent.id, el); }}
                    onMouseEnter={() => setHoveredNodeId(routerAgent.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={(e) => { e.stopPropagation(); setSelectedNodeId(routerAgent.id); }}
                    className={`w-80 p-9 rounded-[3rem] border-4 shadow-2xl relative transition-all duration-500 cursor-pointer ${activeHighlightId === routerAgent.id ? 'bg-white dark:bg-slate-800 border-indigo-600 scale-105 z-20' : 'bg-white dark:bg-slate-800 border-indigo-50'}`}
                 >
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAgentClick(routerAgent); }}
                      className="absolute top-5 right-5 p-3 bg-indigo-50 dark:bg-slate-700 rounded-2xl text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                      title="Editar Agente"
                    >
                       <Settings className="w-5 h-5" />
                    </button>
                    <div className="absolute top-0 left-0 bg-indigo-600 text-white px-6 py-2.5 rounded-br-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><GitMerge className="w-5 h-5" /> NÚCLEO</div>
                    <div className="w-24 h-24 mx-auto rounded-[2rem] mb-8 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-5xl border border-indigo-50">{routerAgent.name.charAt(0)}</div>
                    <h3 className="font-black text-slate-800 dark:text-white text-2xl mb-2">{routerAgent.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{routerAgent.role}</p>
                    <div className="mt-10 flex items-center justify-center gap-6 border-t border-slate-50 pt-6">
                       <div className="flex items-center gap-2">
                          {nodeHealth[routerAgent.id]?.status === 'Online' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : nodeHealth[routerAgent.id]?.status === 'Degraded' ? <AlertCircle className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                          <span className={`text-[10px] font-black uppercase ${nodeHealth[routerAgent.id]?.status === 'Offline' ? 'text-rose-500' : 'text-slate-500'}`}>{nodeHealth[routerAgent.id]?.status || 'Online'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <span className="text-[10px] font-black text-slate-500">{nodeHealth[routerAgent.id]?.latency || 0}ms</span>
                       </div>
                    </div>
                 </div>
             </div>
          )}

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-h-[650px] overflow-y-auto custom-scrollbar p-6">
            {specialists.map(agent => {
                const health = nodeHealth[agent.id] || { status: 'Online', uptime: '100%', latency: 25 };
                const isActive = activeHighlightId === agent.id;
                return (
                    <div 
                        key={agent.id}
                        ref={el => { if (el) nodeRefs.current.set(agent.id, el); }}
                        onMouseEnter={() => setHoveredNodeId(agent.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={(e) => { e.stopPropagation(); setSelectedNodeId(agent.id); }}
                        className={`p-8 rounded-[3rem] border-2 transition-all duration-500 relative bg-white dark:bg-slate-800 group shadow-2xl cursor-pointer ${isActive ? 'border-indigo-500 scale-105 z-20' : 'border-slate-100 dark:border-slate-700'}`}
                    >
                        <button 
                          onClick={(e) => { e.stopPropagation(); onAgentClick(agent); }}
                          className="absolute top-5 right-5 p-3 bg-indigo-50 dark:bg-slate-700 rounded-2xl text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                          title="Editar"
                        >
                           <Settings className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-5 mb-8">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-xl transform transition-transform group-hover:rotate-6 ${agent.type === 'MARKETING' ? 'bg-gradient-to-br from-rose-400 to-rose-600' : agent.type === 'VOICE' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>{agent.name.charAt(0)}</div>
                            <div>
                                <h4 className="font-black text-xl text-slate-800 dark:text-white tracking-tight leading-none mb-2">{agent.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{agent.role}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                   {health.status === 'Online' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : health.status === 'Degraded' ? <AlertCircle className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                                   <span className={`text-[9px] font-black uppercase ${health.status === 'Offline' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{health.status}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                   <Activity className="w-4 h-4 text-indigo-400" />
                                   <span className="text-[9px] font-black text-slate-400">{health.latency}ms</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Uptime</p>
                                <p className="text-[10px] font-black text-emerald-600">{health.uptime}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
          </div>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-14 px-14 py-8 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4"><div className="w-12 h-2 bg-emerald-500 rounded-full"></div><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Salud Óptima</span></div>
          <div className="flex items-center gap-4"><div className="w-12 h-2 bg-amber-500 rounded-full"></div><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Latencia Elevada</span></div>
          <div className="flex items-center gap-4"><div className="w-12 h-2 bg-rose-500 rounded-full"></div><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sin Conexión</span></div>
          <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
          <div className="flex items-center gap-4"><Info className="w-6 h-6 text-indigo-400" /><span className="text-[10px] text-slate-400 font-bold italic">Simulación de tráfico real mediante Google GenAI Live API.</span></div>
      </div>
    </div>
  );
};

export default AgentNetwork;

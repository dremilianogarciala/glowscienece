
import React, { useState, useEffect, useRef } from 'react';
import { AIAgent } from '../types';
import { Network, Zap, ShieldCheck, GitMerge, User, Edit2, ArrowRight, Activity } from 'lucide-react';

interface AgentNetworkProps {
  agents: AIAgent[];
  onAgentClick: (agent: AIAgent) => void;
}

interface Connection {
  id: string;
  from: string; // Agent ID or 'USER' or 'ROUTER'
  to: string;   // Agent ID
  type: 'FLOW' | 'HANDOFF';
  active: boolean;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const AgentNetwork: React.FC<AgentNetworkProps> = ({ agents, onAgentClick }) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const routerAgent = agents.find(a => a.isRouter);
  const specialists = agents.filter(a => !a.isRouter);

  // 1. Calculate Logic Connections
  useEffect(() => {
    const newConnections: Connection[] = [];

    // User -> Router (or first agent if no router)
    if (routerAgent) {
      newConnections.push({
        id: `USER-${routerAgent.id}`,
        from: 'USER',
        to: routerAgent.id,
        type: 'FLOW',
        active: true
      });

      // Router -> Specialists (Based on triggers)
      specialists.forEach(spec => {
        newConnections.push({
          id: `${routerAgent.id}-${spec.id}`,
          from: routerAgent.id,
          to: spec.id,
          type: 'FLOW',
          active: true
        });
      });
    }

    // Specialist -> Specialist (Handoff Detection)
    agents.forEach(source => {
      if (source.handoffInstructions) {
        agents.forEach(target => {
          if (source.id !== target.id) {
            // Simple heuristic: if instructions mention the target's name
            if (source.handoffInstructions.toLowerCase().includes(target.name.toLowerCase())) {
              newConnections.push({
                id: `${source.id}-${target.id}`,
                from: source.id,
                to: target.id,
                type: 'HANDOFF',
                active: true
              });
            }
          }
        });
      }
    });

    setConnections(newConnections);
  }, [agents]);

  // 2. Calculate Positions for SVG Lines
  const updatePositions = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions: Record<string, NodePosition> = {};

    nodeRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      newPositions[id] = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      };
    });

    setPositions(newPositions);
  };

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    // Slight delay to ensure DOM is rendered
    const timeout = setTimeout(updatePositions, 100);
    return () => {
        window.removeEventListener('resize', updatePositions);
        clearTimeout(timeout);
    };
  }, [agents, highlightedId]);

  // Helper to get line coordinates
  const getLineCoords = (conn: Connection) => {
    const start = positions[conn.from];
    const end = positions[conn.to];
    if (!start || !end) return null;

    // Connect from right side of Start to left side of End (generally)
    // Or optimize based on relative position
    const isHorizontal = Math.abs(start.y - end.y) < 100;

    let x1, y1, x2, y2;

    if (conn.from === 'USER') {
        x1 = start.x + start.width;
        y1 = start.y + start.height / 2;
        x2 = end.x;
        y2 = end.y + end.height / 2;
    } else {
        // Center to Center logic with edge adjustment
        if (start.x < end.x) { // Left to Right
            x1 = start.x + start.width;
            y1 = start.y + start.height / 2;
            x2 = end.x;
            y2 = end.y + end.height / 2;
        } else { // Grid items or back flow
            x1 = start.x + start.width / 2;
            y1 = start.y + start.height;
            x2 = end.x + end.width / 2;
            y2 = end.y;
        }
    }

    return { x1, y1, x2, y2 };
  };

  const isConnectionActive = (conn: Connection) => {
    if (!highlightedId) return true; // Show all by default if nothing selected
    return conn.from === highlightedId || conn.to === highlightedId;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-3">
          <Network className="text-indigo-600 w-8 h-8" /> Red Neuronal de Agentes
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
          Visualiza el flujo de información. Haz clic en un nodo para resaltar sus conexiones.
        </p>
      </div>

      <div className="relative min-h-[600px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-8" ref={containerRef}>
        
        {/* SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                </marker>
                <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
            </defs>
            {connections.map(conn => {
                const coords = getLineCoords(conn);
                if (!coords) return null;
                const active = isConnectionActive(conn);
                const color = active ? (conn.type === 'HANDOFF' ? '#ec4899' : '#6366f1') : '#cbd5e1';
                const opacity = highlightedId && !active ? 0.1 : 1;
                const strokeWidth = active ? 2 : 1;
                
                // Curve logic
                const dx = coords.x2 - coords.x1;
                const controlX = coords.x1 + dx * 0.5;
                
                return (
                    <g key={conn.id} opacity={opacity} className="transition-opacity duration-300">
                        <path 
                            d={`M ${coords.x1} ${coords.y1} C ${controlX} ${coords.y1}, ${controlX} ${coords.y2}, ${coords.x2} ${coords.y2}`}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={conn.type === 'HANDOFF' ? "5,5" : "none"}
                            markerEnd={`url(#${active ? 'arrowhead-active' : 'arrowhead'})`}
                        />
                        {active && conn.type === 'HANDOFF' && (
                             <circle cx={(coords.x1 + coords.x2)/2} cy={(coords.y1 + coords.y2)/2} r="3" fill={color} />
                        )}
                    </g>
                );
            })}
        </svg>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-20 w-full relative z-10">
          
          {/* USER NODE */}
          <div 
            ref={el => { if (el) nodeRefs.current.set('USER', el); }}
            className="flex flex-col items-center gap-4 cursor-default self-center"
            onMouseEnter={() => setHighlightedId('USER')}
            onMouseLeave={() => setHighlightedId(null)}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all ${highlightedId === 'USER' ? 'bg-indigo-100 border-indigo-500 scale-110' : 'bg-slate-200 border-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}>
              <User className={`w-10 h-10 ${highlightedId === 'USER' ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <p className="font-bold text-slate-400 text-xs uppercase tracking-widest bg-white dark:bg-slate-900 px-2 py-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">Usuario</p>
          </div>

          {/* ROUTER NODE */}
          {routerAgent ? (
             <div className="self-center">
                 <div 
                    ref={el => { if (el) nodeRefs.current.set(routerAgent.id, el); }}
                    onClick={() => onAgentClick(routerAgent)}
                    onMouseEnter={() => setHighlightedId(routerAgent.id)}
                    onMouseLeave={() => setHighlightedId(null)}
                    className={`w-64 p-6 rounded-3xl border-2 shadow-xl relative text-center transition-all cursor-pointer ${
                        highlightedId === routerAgent.id 
                            ? 'bg-white dark:bg-slate-800 border-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/20 scale-105 z-20' 
                            : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900'
                    }`}
                 >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-md">
                        <GitMerge className="w-3 h-3" /> Orquestador
                    </div>
                    <div className="w-16 h-16 mx-auto rounded-2xl mb-4 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
                        {routerAgent.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{routerAgent.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{routerAgent.role}</p>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl text-[10px] text-slate-400 border border-slate-100 dark:border-slate-700">
                        Enrutamiento centralizado
                    </div>
                 </div>
             </div>
          ) : (
             <div className="self-center p-8 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 text-center">
                 Sin Orquestador
             </div>
          )}

          {/* SPECIALISTS GRID */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {specialists.map(agent => {
                const isHovered = highlightedId === agent.id;
                const isLinked = highlightedId === routerAgent?.id; // Highlight if router selected
                const opacity = highlightedId && !isHovered && !isLinked && highlightedId !== 'USER' ? 0.4 : 1;

                return (
                    <div 
                        key={agent.id}
                        ref={el => { if (el) nodeRefs.current.set(agent.id, el); }}
                        onClick={() => onAgentClick(agent)}
                        onMouseEnter={() => setHighlightedId(agent.id)}
                        onMouseLeave={() => setHighlightedId(null)}
                        style={{ opacity }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative bg-white dark:bg-slate-800 ${
                            isHovered 
                            ? 'border-indigo-500 shadow-xl shadow-indigo-100 dark:shadow-none scale-105 z-20' 
                            : 'border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-200'
                        }`}
                    >
                        {agent.handoffInstructions && (
                            <div className="absolute -top-2 -right-2 bg-pink-500 text-white p-1 rounded-full shadow-sm" title="Tiene reglas de Handoff">
                                <Activity className="w-3 h-3" />
                            </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${agent.type === 'MARKETING' ? 'bg-rose-500' : agent.type === 'VOICE' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                    {agent.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{agent.name}</h4>
                                    <p className="text-[10px] text-slate-400">{agent.role}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${agent.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30' : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>
                                {agent.priority}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-500" /> Activadores (Triggers)
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {agent.triggers.length > 0 ? agent.triggers.slice(0, 4).map((t, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] text-slate-600 dark:text-slate-300 font-medium">
                                        {t}
                                    </span>
                                    )) : <span className="text-[9px] text-slate-300 italic">Global</span>}
                                </div>
                            </div>
                            
                            {agent.strictMode && (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                    <ShieldCheck className="w-3 h-3" /> Conocimiento Protegido
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AgentNetwork;

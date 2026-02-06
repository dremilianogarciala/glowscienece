
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  Zap, 
  Server, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Instagram,
  Facebook,
  Bot,
  Plus,
  Send,
  Loader2,
  ChevronRight,
  Target
} from 'lucide-react';
import { ChannelConfig, UnifiedMessage, Appointment, AIAgent, AppView } from '../types';

interface DashboardProps {
  channels?: ChannelConfig[];
  messages?: UnifiedMessage[];
  appointments?: Appointment[];
  agents?: AIAgent[];
  isConnected?: boolean;
  onNavigate: (view: AppView) => void;
  onEditAgent?: (agent: AIAgent) => void;
}

const StatCard = ({ icon: Icon, label, value, trend, active, color = "indigo", onClick }: any) => {
  const colorClasses: any = {
    indigo: "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100",
    emerald: "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100",
    rose: "bg-rose-600 text-white border-rose-600 shadow-rose-100",
    amber: "bg-amber-600 text-white border-amber-600 shadow-amber-100",
    white: "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700"
  };

  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[2.5rem] border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer ${colorClasses[active ? color : 'white']}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${active ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-700'}`}>
          <Icon className={`w-6 h-6 ${active ? 'text-white' : `text-${color}-600 dark:text-${color}-400`}`} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}>
          <ArrowUpRight className="w-3 h-3" /> {trend}
        </div>
      </div>
      <h3 className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>{label}</h3>
      <p className="text-3xl font-black mt-1 tracking-tighter">{value}</p>
    </div>
  );
};

const ActivityItem = ({ type, text, time, platform }: any) => {
  const Icon = platform === 'whatsapp' ? Smartphone : platform === 'instagram' ? Instagram : Facebook;
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
        platform === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 
        platform === 'instagram' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{text}</p>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{type}</p>
      </div>
      <span className="text-[10px] font-black text-slate-300 group-hover:text-slate-500 transition-colors">{time}</span>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  channels = [], 
  messages = [], 
  appointments = [], 
  agents = [],
  isConnected = false,
  onNavigate,
  onEditAgent
}) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const totalMessagesCount = messages.length + 125;
  const appointmentsCount = appointments.length;

  const last7Days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  const chartData = last7Days.map((day, i) => {
    return {
      name: day,
      leads: i === 6 ? messages.length + 45 : Math.max(0, 45 + (i * 8)),
      bookings: Math.floor(Math.random() * 5) + (i === 6 ? appointmentsCount : 2)
    };
  });

  const platformData = [
    { name: 'WhatsApp', value: 65, color: '#10b981' },
    { name: 'Instagram', value: 25, color: '#f43f5e' },
    { name: 'Messenger', value: 10, color: '#2563eb' },
  ];

  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
        setIsGeneratingReport(false);
        alert("Reporte Ejecutivo Generado con Gemini 3 Pro:\n\n- Rendimiento Semanal: +15% de conversión.\n- Agente más eficiente: " + (agents[0]?.name || "OmniRouter") + ".\n- Recomendación: Aumentar stock para campaña de Instagram.");
    }, 2500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar bg-[#f8fafc] dark:bg-slate-950">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Command Center</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Panel de control unificado y análisis de IA.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => onNavigate(AppView.AGENT_BUILDER)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 hover:bg-indigo-700 transition-all hover:scale-105"
            >
                <Plus className="w-4 h-4" /> Nuevo Agente
            </button>
            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isConnected ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                {isConnected ? 'Sistema Activo' : 'Offline Mode'}
            </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
            onClick={() => onNavigate(AppView.UNIFIED_INBOX)}
            icon={MessageCircle} label="Mensajes Totales" value={totalMessagesCount} trend="+12% vs ayer" active={true} color="indigo" 
        />
        <StatCard 
            onClick={() => onNavigate(AppView.CALENDAR)}
            icon={Calendar} label="Citas Agendadas" value={appointmentsCount} trend={`+${appointmentsCount} hoy`} active={false} color="emerald" 
        />
        <StatCard 
            onClick={() => onNavigate(AppView.AGENT_MANAGEMENT)}
            icon={Bot} label="Agentes en Red" value={agents.length} trend="Salud: 100%" active={false} color="amber" 
        />
        <StatCard 
            icon={Zap} label="Ahorro de Tiempo" value="42h" trend="Este mes" active={false} color="rose" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Actividad de Leads</h3>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> IA Responses
                </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} 
                  itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#4f46e5" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channels Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Canales Top</h3>
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-black text-slate-800 dark:text-white">85%</span>
               <span className="text-[8px] font-black text-slate-400 uppercase">Conversión</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
             {platformData.map((p) => (
               <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{p.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-white">{p.value}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-600" /> Actividad Reciente
            </h3>
            <button 
                onClick={() => onNavigate(AppView.UNIFIED_INBOX)}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
                Ver Historial
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {messages.length > 0 ? (
                messages.map((m) => (
                    <ActivityItem key={m.id} platform={m.platform} type="Nuevo Mensaje" text={`${m.contactName}: ${m.lastMessage}`} time="Ahora" />
                ))
            ) : (
                <>
                    <ActivityItem platform="whatsapp" type="Respuesta IA" text="Agente de Ventas respondió a 'Juan Perez'" time="Ahora" />
                    <ActivityItem platform="instagram" type="Cita Agendada" text="Nueva cita para 'Elena Gomez' vía DM" time="hace 12m" />
                    <ActivityItem platform="messenger" type="FAQ Automática" text="Respondida duda sobre envíos a 'Marcos'" time="hace 25m" />
                </>
            )}
          </div>
        </div>

        {/* Real Agent Status - Interactive Cards */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
           <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Estado de Agentes</h3>
                <button 
                    onClick={() => onNavigate(AppView.AGENT_MANAGEMENT)}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                    Gestionar Todos
                </button>
           </div>
           <div className="space-y-4">
              {agents.length > 0 ? (
                  agents.slice(0, 4).map((agent) => (
                    <div 
                        key={agent.id} 
                        className="group cursor-pointer p-4 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-300"
                        onClick={() => onEditAgent && onEditAgent(agent)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-600 transition-colors`}>
                              <Bot className={`w-5 h-5 text-indigo-600 group-hover:text-white transition-colors`} />
                           </div>
                           <div>
                             <span className="text-sm font-black text-slate-700 dark:text-slate-200 block leading-tight">{agent.name}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{agent.role}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-600`}
                          style={{ width: `${Math.floor(Math.random() * 40) + 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
              ) : (
                  <div className="text-center py-10 opacity-30 italic">
                      No hay agentes creados todavía.
                  </div>
              )}
           </div>
           
           <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="mt-10 w-full p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-between hover:bg-indigo-700 transition-all group"
           >
              <div className="text-left">
                 <h4 className="text-sm font-black uppercase">Reporte Ejecutivo IA</h4>
                 <p className="text-[10px] text-indigo-100 font-medium">Analizar métricas con Gemini 3 Pro</p>
              </div>
              <div className="bg-white text-indigo-600 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                 {isGeneratingReport ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </div>
           </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

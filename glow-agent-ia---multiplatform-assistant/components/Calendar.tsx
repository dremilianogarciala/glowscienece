import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Phone, 
  AlertTriangle, 
  Loader2, 
  Bot, 
  CalendarDays, 
  BellRing, 
  CheckCircle2, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { Appointment, AIAgent } from '../types';

interface CalendarProps {
  agents: AIAgent[];
}

const Calendar: React.FC<CalendarProps> = ({ agents }) => {
  const agendaAgent = agents.find(a => a.type === 'AGENDA');
  
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchGoogleEvents = async () => {
    if (!agendaAgent?.agendaConfig?.googleCalendarId || !agendaAgent?.agendaConfig?.googleApiKey) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calendarId = encodeURIComponent(agendaAgent.agendaConfig.googleCalendarId);
      const apiKey = agendaAgent.agendaConfig.googleApiKey;
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date();
      timeMax.setHours(23, 59, 59, 999);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Error al conectar con Google Calendar");
      }

      const mappedEvents: Appointment[] = (data.items || []).map((item: any) => ({
        id: item.id,
        time: item.start.dateTime ? new Date(item.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Todo el día',
        title: item.summary || 'Cita sin título',
        client: item.description || 'Cliente Externo',
        platform: 'Google Cal',
        status: 'confirmed'
      }));

      setAppointments(mappedEvents);
      setLastSync(new Date());
    } catch (err: any) {
      console.error("G-Cal Sync Error:", err);
      setError(err.message || "Fallo en la conexión directa con Google Calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agendaAgent?.agendaConfig?.calendarSyncEnabled) {
      fetchGoogleEvents();
    } else {
      // Mock data if no sync enabled
      setAppointments([
        { id: 'm1', time: '10:00', title: 'Corte Premium', client: 'Andrés López', platform: 'WhatsApp', status: 'confirmed' },
        { id: 'm2', time: '12:30', title: 'Manicura Glow', client: 'Sofía Rey', platform: 'Instagram', status: 'pending' }
      ]);
    }
  }, [agendaAgent]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Vista Principal */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
               <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-500/20">
                  <CalendarDays className="text-white w-7 h-7" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">AGENDA GLOW</h2>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`w-2 h-2 rounded-full ${agendaAgent?.agendaConfig?.calendarSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {agendaAgent?.agendaConfig?.calendarSyncEnabled ? 'CONEXIÓN DIRECTA ACTIVA' : 'MODO LOCAL'}
                     </p>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                  onClick={fetchGoogleEvents}
                  disabled={loading || !agendaAgent?.agendaConfig?.calendarSyncEnabled}
                  className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all disabled:opacity-30"
               >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
               </button>
               <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/10">
                  <Plus className="w-4 h-4" /> NUEVA CITA
               </button>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-3">
               <AlertTriangle className="w-5 h-5" /> {error}
            </div>
          )}

          {/* Calendario Visual */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => (
              <div key={day} className="bg-slate-50 dark:bg-slate-900 p-5 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">{day}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const isToday = i === 15; // Simulado
              return (
                <div key={i} className={`bg-white dark:bg-slate-900 h-36 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative group ${isToday ? 'ring-4 ring-indigo-500/20 ring-inset' : ''}`}>
                  <span className={`text-xs font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-700'}`}>{i - 3 > 0 && i - 3 <= 31 ? i - 3 : ''}</span>
                  {isToday && (
                    <div className="mt-2 space-y-1.5 overflow-hidden">
                      {appointments.slice(0, 3).map(apt => (
                        <div key={apt.id} className={`text-[8px] p-2 rounded-xl border font-black truncate shadow-sm ${getStatusColor(apt.status)}`}>
                          {apt.time} • {apt.client}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="w-full lg:w-96 space-y-8 shrink-0">
           {/* Agente de Agenda */}
           <div className="bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-indigo-600 dark:to-indigo-800 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-xl border border-white/10">
                       <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <h3 className="font-black text-lg tracking-tight">AGENT STATUS</h3>
                       <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Orchestration</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                       <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-1">Nombre del Agente</p>
                       <p className="text-sm font-bold flex items-center gap-2">
                          {agendaAgent?.name || 'Asistente de Agenda'}
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                       </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                       <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-1">Google Cal ID</p>
                       <p className="text-xs font-mono font-bold truncate">{agendaAgent?.agendaConfig?.googleCalendarId || 'N/A'}</p>
                    </div>
                    {lastSync && (
                       <p className="text-[9px] text-indigo-200/50 italic text-center">Última sincronización: {lastSync.toLocaleTimeString()}</p>
                    )}
                 </div>
              </div>
              <CalendarIcon className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
           </div>

           {/* Citas del Día */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <BellRing className="w-5 h-5 text-indigo-500" /> Citas de Hoy
            </h3>
            <div className="space-y-5">
              {appointments.length > 0 ? appointments.map(apt => (
                <div key={apt.id} className="flex gap-5 items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group">
                  <div className={`w-3 h-12 rounded-full shadow-inner ${apt.status === 'confirmed' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{apt.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{apt.client}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white">{apt.time}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{apt.platform}</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-30">
                   <CalendarIcon className="w-12 h-12 mx-auto mb-4" />
                   <p className="text-xs font-bold">SIN CITAS</p>
                </div>
              )}
            </div>
            
            <button className="w-full mt-8 py-4 text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-800">
               VER AGENDA COMPLETA <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
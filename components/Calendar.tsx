
import React, { useState, useEffect } from 'react';
import { RefreshCw, Phone, ListChecks, CheckCircle2, Circle, Clock, Plus, Bot, Calendar as CalendarIcon, Filter, MoreHorizontal } from 'lucide-react';
import { Appointment, Task } from '../types';

const Calendar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 't1', title: 'Confirmar stock de insumos con proveedor', dueTime: '10:00 AM', completed: false, priority: 'HIGH', agentSource: 'AgendaBot' },
    { id: 't2', title: 'Revisar métricas de campaña semanal', dueTime: '12:30 PM', completed: true, priority: 'MEDIUM', agentSource: 'MarketingBot' },
    { id: 't3', title: 'Follow-up cliente inmobiliaria #23', dueTime: '03:15 PM', completed: false, priority: 'HIGH', agentSource: 'SalesAgent' },
    { id: 't4', title: 'Limpiar base de datos de correos duplicados', dueTime: '05:00 PM', completed: false, priority: 'LOW', agentSource: 'SystemCleaner' },
  ]);

  const [config, setConfig] = useState({
    googleCalendarId: '',
    googleApiKey: '',
    autoReportTime: '08:00',
    reportPhone: '',
    sync: false
  });

  useEffect(() => {
    setAppointments([
      { id: '1', time: '09:00', title: 'Consulta General', client: 'Carlos Ruiz', platform: 'WhatsApp', status: 'confirmed' },
      { id: '2', time: '11:30', title: 'Limpieza Dental', client: 'Elena Gomez', platform: 'Instagram', status: 'pending' },
      { id: '3', time: '14:00', title: 'Extracción Muela de Juicio', client: 'Juan Perez', platform: 'Messenger', status: 'cancelled' },
    ]);
  }, []);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleSync = () => {
    const calId = prompt("Google Calendar ID:", config.googleCalendarId);
    if (!calId) return;
    const apiKey = prompt("API Key:", config.googleApiKey);
    if (!apiKey) return;
    setConfig(prev => ({ ...prev, googleCalendarId: calId, googleApiKey: apiKey, sync: true }));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Principal Calendar Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <CalendarIcon className="w-6 h-6 text-indigo-600" /> Agenda Smart IA
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión centralizada de citas y flujos automatizados.</p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={handleSync} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${config.sync ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {config.sync ? 'CONECTADO G-CAL' : 'VINCULAR G-CAL'}
               </button>
               <button onClick={() => setSendingReport(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                <Phone className="w-4 h-4" /> Reporte Diario
              </button>
            </div>
          </div>

          {/* Simple Month View Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-10">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => <div key={day} className="bg-slate-50 dark:bg-slate-800 p-4 text-center text-[10px] font-bold text-slate-400 uppercase">{day}</div>)}
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className={`bg-white dark:bg-slate-900 h-28 p-3 relative group transition-colors ${i === 14 ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                <span className={`text-[10px] font-bold ${i === 14 ? 'text-indigo-600' : 'text-slate-400'}`}>{i + 1}</span>
                {i === 14 && (
                  <div className="mt-2 space-y-1.5 overflow-y-auto max-h-16 custom-scrollbar pr-1">
                    {appointments.map(apt => (
                       <div key={apt.id} className={`text-[9px] p-1.5 rounded-lg border font-bold truncate leading-tight shadow-sm ${getStatusColor(apt.status)}`}>
                          {apt.time} - {apt.client}
                       </div>
                    ))}
                  </div>
                )}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/10 pointer-events-none rounded-xl m-1"></div>
              </div>
            ))}
          </div>

          {/* Tasks Section */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-indigo-600" /> Tareas Programadas
                   </h3>
                   <p className="text-xs text-slate-500">Acciones delegadas a tus agentes IA para hoy.</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-indigo-50 transition-colors">
                   <Plus className="w-3.5 h-3.5" /> AGREGAR TAREA
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${task.completed ? 'bg-slate-50/50 dark:bg-slate-800/50 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'}`}
                  >
                    <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0 transition-transform active:scale-90">
                      {task.completed 
                        ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> 
                        : <Circle className="w-6 h-6 text-slate-300 hover:text-indigo-400" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                       <h4 className={`text-sm font-bold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {task.title}
                       </h4>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                             <Clock className="w-3 h-3" /> {task.dueTime}
                          </span>
                          <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                             {task.priority}
                          </span>
                       </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl flex items-center gap-2 shrink-0">
                       <Bot className="w-3 h-3 text-indigo-600" />
                       <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-tighter">{task.agentSource}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="w-full xl:w-80 space-y-6 shrink-0">
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl">
             <div className="flex justify-between items-start mb-6">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                   <Bot className="w-6 h-6" />
                </div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
             </div>
             <h3 className="font-black text-xl mb-1">Status de Agenda</h3>
             <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-6">Inteligencia Activa</p>
             
             <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                   <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1">Próximo Reporte</p>
                   <p className="text-lg font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> {config.autoReportTime} AM</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                   <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1">Tareas Hoy</p>
                   <div className="flex items-end gap-2">
                      <p className="text-2xl font-black">{tasks.filter(t => !t.completed).length}</p>
                      <p className="text-[10px] text-indigo-200 mb-1">pendientes de {tasks.length}</p>
                   </div>
                </div>
             </div>
           </div>
           
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Filter className="w-4 h-4" /> Filtro Rápido</h3>
                <button className="text-slate-400"><MoreHorizontal className="w-4 h-4" /></button>
             </div>
             <div className="space-y-2">
                {['Confirmados', 'Pendientes', 'Cancelados'].map(label => (
                  <button key={label} className="w-full p-3 rounded-xl border border-slate-50 dark:border-slate-700 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex justify-between">
                    {label}
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">12</span>
                  </button>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

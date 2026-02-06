
import React, { useState } from 'react';
import { 
  Search, 
  Phone, 
  Instagram, 
  MessageCircle, 
  MoreVertical, 
  Send, 
  User, 
  Filter,
  CheckCheck,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { UnifiedMessage, ChannelConfig } from '../types';

interface UnifiedInboxProps {
  messages: UnifiedMessage[];
  channels: ChannelConfig[];
}

const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ messages, channels }) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'instagram'>('all');

  // Filter messages based on Active Channels AND Filter Selection
  const connectedPlatforms = channels.filter(c => c.connected).map(c => c.platformId);
  
  const visibleMessages = messages.filter(msg => {
    // 1. Must be from a connected platform
    if (!connectedPlatforms.includes(msg.platform)) return false;
    // 2. Must match UI filter
    if (filter !== 'all' && msg.platform !== filter) return false;
    return true;
  });

  // Sort by newest
  visibleMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Sidebar de Chats */}
      <div className="w-96 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900">
        <div className="p-6 shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Mensajería</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar chats..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none dark:text-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2 mt-4">
            {['all', 'whatsapp', 'instagram'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {connectedPlatforms.length === 0 ? (
            <div className="p-8 text-center">
               <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
               <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Sin Conexiones</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ve a la pestaña "Conexiones" para activar WhatsApp o Instagram.</p>
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
               No hay mensajes nuevos en los canales conectados.
            </div>
          ) : (
            visibleMessages.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`p-4 flex gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-l-4 ${activeChat === chat.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-600' : 'border-transparent'}`}
              >
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 shrink-0 relative">
                  {chat.avatar}
                  <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${chat.platform === 'whatsapp' ? 'bg-emerald-500' : chat.platform === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 to-rose-500' : 'bg-blue-600'}`}>
                    {chat.platform === 'whatsapp' ? <Phone className="w-2 h-2 text-white" /> : <Instagram className="w-2 h-2 text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold text-sm truncate ${activeChat === chat.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>{chat.contactName}</h4>
                    <span className="text-[10px] text-slate-400">{chat.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className={`text-xs truncate ${chat.unread ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-500 dark:text-slate-500'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ventana de Chat */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950">
          <div className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                {visibleMessages.find(c => c.id === activeChat)?.avatar}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{visibleMessages.find(c => c.id === activeChat)?.contactName}</h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> en línea
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"><Phone className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm max-w-md text-sm text-slate-700 dark:text-slate-200">
                {visibleMessages.find(c => c.id === activeChat)?.lastMessage}
              </div>
            </div>
            {/* Simulation of AI Reply */}
            <div className="flex justify-end">
              <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none text-white shadow-md shadow-indigo-100 dark:shadow-none max-w-md text-sm">
                 Autorespuesta Omni: Gracias por contactarnos. ¿En qué podemos ayudarte hoy?
                <div className="flex justify-end mt-1">
                  <CheckCheck className="w-3 h-3 text-indigo-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-4 items-center">
              <button className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-600 transition-colors">
                <PlusCircle className="w-6 h-6" />
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Escribe una respuesta..." 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
          <MessageCircle className="w-20 h-20 text-slate-200 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Selecciona un chat</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {connectedPlatforms.length > 0 
              ? "Tus canales están conectados. Esperando mensajes..." 
              : "Conecta WhatsApp o Instagram para recibir mensajes aquí."}
          </p>
        </div>
      )}
    </div>
  );
};

export default UnifiedInbox;

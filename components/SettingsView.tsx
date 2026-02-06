
import React, { useEffect, useState } from 'react';
import { Moon, Sun, Globe, Bell, Shield, Smartphone, Monitor, Clock } from 'lucide-react';

interface SettingsViewProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ darkMode, toggleDarkMode, language, setLanguage }) => {
  
  // Auto-detect system timezone
  const [userTimezone, setUserTimezone] = useState('');

  useEffect(() => {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz);
    } catch (e) {
        setUserTimezone('UTC');
    }
  }, []);

  const translations: any = {
    es: {
      title: 'Configuración',
      subtitle: 'Personaliza tu experiencia en OmniAgent.',
      appearance: 'Apariencia',
      darkMode: 'Modo Oscuro',
      darkModeDesc: darkMode ? 'Actualmente en Modo Oscuro' : 'Actualmente en Modo Claro (Blanco)',
      langRegion: 'Idioma y Región',
      interfaceLang: 'Idioma de la Interfaz',
      timezone: 'Zona Horaria del Sistema',
      timezoneDesc: 'Sincronizado con tu equipo',
      notifications: 'Notificaciones',
      notifDashboard: 'Notificar nuevos mensajes en Dashboard',
      notifSound: 'Sonido al recibir alertas críticas',
      notifEmail: 'Correos semanales de resumen',
      system: 'Sistema',
      apiKey: 'API Key de Google Gemini',
      managedBy: 'Gestionada por Google AI Studio',
      changeKey: 'Cambiar Llave'
    },
    en: {
      title: 'Settings',
      subtitle: 'Customize your OmniAgent experience.',
      appearance: 'Appearance',
      darkMode: 'Dark Mode',
      darkModeDesc: darkMode ? 'Currently in Dark Mode' : 'Currently in Light Mode',
      langRegion: 'Language & Region',
      interfaceLang: 'Interface Language',
      timezone: 'System Timezone',
      timezoneDesc: 'Synced with your device',
      notifications: 'Notifications',
      notifDashboard: 'Notify new messages on Dashboard',
      notifSound: 'Sound on critical alerts',
      notifEmail: 'Weekly summary emails',
      system: 'System',
      apiKey: 'Google Gemini API Key',
      managedBy: 'Managed by Google AI Studio',
      changeKey: 'Change Key'
    },
    pt: {
      title: 'Configurações',
      subtitle: 'Personalize sua experiência OmniAgent.',
      appearance: 'Aparência',
      darkMode: 'Modo Escuro',
      darkModeDesc: darkMode ? 'Atualmente em Modo Escuro' : 'Atualmente em Modo Claro',
      langRegion: 'Idioma e Região',
      interfaceLang: 'Idioma da Interface',
      timezone: 'Fuso Horário do Sistema',
      timezoneDesc: 'Sincronizado com seu dispositivo',
      notifications: 'Notificações',
      notifDashboard: 'Notificar novas mensagens no Painel',
      notifSound: 'Som em alertas críticos',
      notifEmail: 'E-mails de resumo semanal',
      system: 'Sistema',
      apiKey: 'Chave API Google Gemini',
      managedBy: 'Gerenciado pelo Google AI Studio',
      changeKey: 'Alterar Chave'
    }
  };

  const t = translations[language] || translations.es;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">{t.title}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
      </div>

      <div className="space-y-6">
        
        {/* Apariencia */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t.appearance}
           </h3>
           
           <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                 <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{t.darkMode}</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">{t.darkModeDesc}</p>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${darkMode ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
              >
                 <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                    {darkMode ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-amber-500" />}
                 </div>
              </button>
           </div>
        </section>

        {/* Idioma y Región */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t.langRegion}
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">{t.interfaceLang}</label>
                 <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                 >
                    <option value="es">Español (Latinoamérica)</option>
                    <option value="en">English (US)</option>
                    <option value="pt">Português (Brasil)</option>
                 </select>
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">{t.timezone}</label>
                 <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-mono font-bold">{userTimezone}</span>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> {t.timezoneDesc}
                 </p>
              </div>
           </div>
        </section>

        {/* Notificaciones */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t.notifications}
           </h3>
           
           <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600 rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t.notifDashboard}</span>
               </div>
               <div className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600 rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t.notifSound}</span>
               </div>
               <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{t.notifEmail}</span>
               </div>
           </div>
        </section>

        {/* Seguridad */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t.system}
           </h3>
           <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl flex justify-between items-center">
              <div>
                 <p className="text-sm font-bold text-slate-800 dark:text-white">{t.apiKey}</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">{t.managedBy}</p>
              </div>
              <button onClick={() => window.aistudio?.openSelectKey()} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition-colors">
                 {t.changeKey}
              </button>
           </div>
           <div className="mt-4 text-xs text-slate-400 text-center">
              Versión OmniAgent v2.5.0 (Beta)
           </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsView;

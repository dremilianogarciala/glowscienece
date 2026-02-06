
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, Bot, Zap, Calendar, MessageSquare, Megaphone, Smartphone } from 'lucide-react';

interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  icon: React.ElementType;
  position: 'right' | 'left' | 'top' | 'bottom' | 'center';
}

interface GuidedTutorialProps {
  onFinish: () => void;
  onNavigate: (viewId: any) => void;
}

const steps: TutorialStep[] = [
  {
    targetId: 'tutorial-welcome',
    title: '¡Bienvenido a OmniAgent AI!',
    content: 'Tu plataforma todo-en-uno para automatizar la atención al cliente, agendamiento y marketing con Inteligencia Artificial. Permítenos mostrarte cómo transformar tu negocio.',
    icon: Bot,
    position: 'center'
  },
  {
    targetId: 'nav-connections',
    title: 'Paso 1: Conecta tus Canales',
    content: 'Aquí puedes vincular tus cuentas de WhatsApp Business, Instagram Direct y Facebook Messenger. OmniAgent responderá por ti en todas las plataformas simultáneamente.',
    icon: Smartphone,
    position: 'right'
  },
  {
    targetId: 'nav-agents',
    title: 'Paso 2: Crea tus Especialistas',
    content: 'Define agentes expertos con personalidades únicas. Sube tu base de conocimiento para automatizar FAQs con precisión total usando Gemini 3 Pro.',
    icon: Zap,
    position: 'right'
  },
  {
    targetId: 'nav-calendar',
    title: 'Paso 3: Agenda Inteligente',
    content: 'Tus agentes pueden consultar tu Google Calendar en tiempo real, agendar citas y enviarte reportes diarios por WhatsApp automáticamente.',
    icon: Calendar,
    position: 'right'
  },
  {
    targetId: 'nav-marketing',
    title: 'Paso 4: Marketing Studio',
    content: 'Genera contenido visual de alta fidelidad para tus redes sociales. Pide imágenes, Reels o campañas completas y OmniAgent las creará por ti.',
    icon: Megaphone,
    position: 'right'
  },
  {
    targetId: 'nav-chat',
    title: 'Paso 5: Probeta de IA',
    content: 'Prueba a tus agentes en un entorno seguro. Cambia de plataforma y observa cómo el enrutador inteligente dirige cada consulta al especialista adecuado.',
    icon: MessageSquare,
    position: 'right'
  }
];

const GuidedTutorial: React.FC<GuidedTutorialProps> = ({ onFinish, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const updateSpotlight = useCallback(() => {
    const step = steps[currentStep];
    if (step.targetId === 'tutorial-welcome') {
      setSpotlightRect(null);
      return;
    }
    const element = document.getElementById(step.targetId);
    if (element) {
      setSpotlightRect(element.getBoundingClientRect());
    }
  }, [currentStep]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const activeStep = steps[currentStep];
  const Icon = activeStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Dimmed Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]" />

      {/* Spotlight Effect */}
      {spotlightRect && (
        <div 
          className="absolute border-2 border-indigo-400 rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] pointer-events-none transition-all duration-500 ease-in-out"
          style={{
            top: spotlightRect.top - 8,
            left: spotlightRect.left - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
          }}
        />
      )}

      {/* Step Content Card */}
      <div 
        className={`relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 ${
          activeStep.position === 'center' ? '' : 'lg:ml-64'
        }`}
      >
        <button 
          onClick={onFinish}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200 dark:shadow-none animate-bounce">
            <Icon className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
            {activeStep.title}
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
            {activeStep.content}
          </p>

          <div className="flex items-center justify-between w-full">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="p-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={handleNext}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
              >
                {currentStep === steps.length - 1 ? '¡Empezar!' : 'Siguiente'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="tutorial-welcome" className="absolute top-1/2 left-1/2 w-1 h-1 opacity-0 pointer-events-none" />
    </div>
  );
};

export default GuidedTutorial;

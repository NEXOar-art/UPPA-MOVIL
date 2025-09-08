
import React from 'react';
import { GlobalChatMessage, UserProfile } from '../types';
import MicromobilityChatWindow from './MicromobilityChatWindow';

interface MicromobilityChatProps {
  isOpen: boolean;
  onToggle: () => void;
  hasAvailableServices: boolean;
  onOpenChat: () => void;
}

const MicromobilityChat: React.FC<MicromobilityChatProps> = ({
  isOpen,
  onToggle,
  hasAvailableServices,
  onOpenChat,
}) => {
  const availabilityColor = hasAvailableServices ? 'bg-cyan-500/80 text-cyan-100 border-cyan-400' : 'bg-red-500/80 text-red-100 border-red-400';
  const availabilityPulse = hasAvailableServices ? 'animate-pulse' : '';

  return (
    <div className="ps-card p-4">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <i className="fas fa-motorcycle text-xl text-sky-300 -mr-2 z-10"></i>
            <i className="fas fa-car-side text-2xl text-indigo-300"></i>
          </div>
          <h3 className="text-lg font-bold text-blue-300 font-orbitron">Nexo Micromovilidad</h3>
        </div>
        <div className="flex items-center space-x-3">
            <div
                className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-semibold border ${availabilityColor}`}
                title={hasAvailableServices ? "Hay servicios de micromovilidad disponibles para contacto" : "No hay servicios de micromovilidad disponibles en este momento"}
            >
                <div className={`w-2 h-2 rounded-full ${availabilityPulse} ${hasAvailableServices ? 'bg-cyan-300' : 'bg-red-400'}`}></div>
                <span>{hasAvailableServices ? "Disponibles" : "Sin Servicios"}</span>
            </div>
          <i className={`fas fa-chevron-down text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-blue-500/20 text-center">
          <p className="text-sm text-slate-400 mb-4">
            Conéctate con otros pilotos y pasajeros en tiempo real para coordinar viajes y compartir información de la zona.
          </p>
          <button
            onClick={onOpenChat}
            className="w-full ps-button active py-3 text-base ps-button-glow-effect"
          >
            <i className="fas fa-satellite-dish mr-2"></i> Entrar al Nexo de Comunicación
          </button>
        </div>
      )}
    </div>
  );
};

export default MicromobilityChat;
import React from 'react';
import { Coordinates, TravelMode } from '../types';

interface PointsOfInterestProps {
  onNavigate: (destination: Coordinates, travelMode: TravelMode) => void;
}

const POI_DATA = [
  {
    id: 'mcdonalds-campana',
    name: "McDonald's 24hs",
    description: "Campana",
    icon: 'fas fa-hamburger',
    iconColor: 'text-red-500',
    bgColor: 'bg-yellow-400',
    glowColor: 'shadow-yellow-400/50',
    coordinates: { lat: -34.191397, lng: -58.944674 },
    travelMode: 'DRIVE' as TravelMode,
  }
];

const PointsOfInterest: React.FC<PointsOfInterestProps> = ({ onNavigate }) => {
  const poi = POI_DATA[0];

  return (
    <div className="ps-card p-4">
      <h3 className="text-xl font-orbitron text-amber-300 border-b border-amber-500/20 pb-2 mb-3 flex items-center">
        <i className="fas fa-star text-amber-400 mr-3"></i>
        Puntos de Interés
      </h3>
      <div className="space-y-3">
        <div className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between gap-3 border border-slate-700/80">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center 
                    ${poi.bgColor} shadow-lg ${poi.glowColor} 
                    border-2 border-red-500
                `}>
                    <i className={`${poi.icon} ${poi.iconColor} text-2xl`}></i>
                </div>
                <div className="overflow-hidden">
                    <p className="font-semibold text-white truncate" title={poi.name}>{poi.name}</p>
                    <p className="text-xs text-slate-400 truncate" title={poi.description}>
                        {poi.description}
                    </p>
                </div>
            </div>
            <button
                onClick={() => onNavigate(poi.coordinates, poi.travelMode)}
                className="ps-button active whitespace-nowrap px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 border-red-500"
                title={`Trazar ruta a ${poi.name}`}
            >
                <i className="fas fa-route mr-2"></i>
                Ir Ahora
            </button>
        </div>
      </div>
    </div>
  );
};

export default PointsOfInterest;

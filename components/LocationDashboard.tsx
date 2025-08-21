import React, { useState } from 'react';
import { Coordinates, Report, ScheduleDetail } from '../types';

interface LocationDashboardProps {
  data: {
    location: Coordinates;
    address: string | null;
    weather: {
      condition: string;
      temp: number;
      icon: string;
    };
    reports: Report[];
    schedule: ScheduleDetail | null;
  };
}

const DashboardTile: React.FC<{
  icon: string;
  title: string;
  children: React.ReactNode;
  iconColor?: string;
  animationDelay: string;
}> = ({ icon, title, children, iconColor = 'text-cyan-400', animationDelay }) => (
  <div
    className="dashboard-tile p-4 rounded-lg flex flex-col"
    style={{ animationDelay }}
  >
    <div className="flex items-center text-slate-300 text-sm mb-2">
      <i className={`${icon} ${iconColor} mr-2 w-5 text-center`}></i>
      <h3 className="font-semibold uppercase tracking-wider">{title}</h3>
    </div>
    <div className="flex-grow flex items-center justify-center text-center">
      {children}
    </div>
  </div>
);

const LocationDashboard: React.FC<LocationDashboardProps> = ({ data }) => {
  const { address, weather, reports, schedule } = data;
  const [isIntelExpanded, setIsIntelExpanded] = useState(false);
  const [isAdExpanded, setIsAdExpanded] = useState(false);

  return (
    <div className="location-dashboard font-inter p-4 md:p-8">
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-6 text-center" style={{ animation: 'futuristic-tile-in 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.1s forwards', opacity: 0 }}>
                <h2 className="font-orbitron text-3xl text-glow text-cyan-300">Análisis de Misión en Curso</h2>
                <p className="text-slate-400"><i className="fas fa-map-marker-alt mr-2"></i>{address || "Ubicación actual"}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <DashboardTile title="Clima" icon={weather.icon} iconColor="text-yellow-300" animationDelay="0.25s">
                    <div>
                        <p className="text-5xl font-bold text-white text-glow">{weather.temp}°C</p>
                        <p className="text-slate-300">{weather.condition}</p>
                    </div>
                </DashboardTile>

                <DashboardTile title="Horarios Línea" icon="fas fa-clock" iconColor="text-green-300" animationDelay="0.4s">
                    {schedule ? (
                        <div>
                            <p className="text-3xl font-bold text-white text-glow">{schedule.frequency}</p>
                            <p className="text-slate-300">{schedule.days}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 italic text-sm">No hay línea seleccionada.</p>
                    )}
                </DashboardTile>

                <DashboardTile title="Intel de Campo" icon="fas fa-satellite-dish" iconColor="text-purple-300" animationDelay="0.55s">
                   <div className="w-full h-full flex flex-col justify-between">
                        <div>
                            {isIntelExpanded ? (
                                <div className="w-full max-h-32 overflow-y-auto text-left text-xs space-y-2 pr-2 scrollbar-thin">
                                    {reports.length > 0 ? (
                                        reports.map((report, index) => (
                                            <div key={index} className="border-l-2 border-purple-400/50 pl-2 py-0.5">
                                                <p className="font-semibold text-purple-300">{report.type}</p>
                                                <p className="text-slate-300 italic">"{report.description}"</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 italic text-center">Sin reportes recientes</p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-5xl font-bold text-white text-glow">{reports.length}</p>
                                    <p className="text-slate-300">Reportes Recientes</p>
                                </div>
                            )}
                        </div>
                        {reports.length > 0 && (
                            <button
                                onClick={() => setIsIntelExpanded(!isIntelExpanded)}
                                className="text-xs text-cyan-400 hover:text-cyan-200 flex items-center justify-center w-full pt-2"
                            >
                                {isIntelExpanded ? 'Ocultar Detalles' : 'Ver Detalles'} 
                                <i className={`fas fa-chevron-down ml-1 text-xs transition-transform duration-200 ${isIntelExpanded ? 'rotate-180' : ''}`}></i>
                            </button>
                        )}
                    </div>
                </DashboardTile>

                <DashboardTile title="Emergencias" icon="fas fa-phone-alt" iconColor="text-red-400" animationDelay="0.7s">
                    <div>
                        <p className="text-6xl font-orbitron text-red-300 text-glow">911</p>
                        <p className="text-slate-400">Canal Directo</p>
                    </div>
                </DashboardTile>
                
                <DashboardTile title="Publicidad" icon="fas fa-bullhorn" iconColor="text-lime-300" animationDelay="0.85s">
                    <div className="w-full h-full flex flex-col justify-center items-center space-y-3">
                        <p className="text-slate-400 text-xs">Espacio para futuros anunciantes.</p>
                        <button
                          onClick={() => setIsAdExpanded(!isAdExpanded)}
                          className="ps-button text-sm px-4 py-2"
                          aria-expanded={isAdExpanded}
                        >
                          {isAdExpanded ? 'Ocultar' : 'Ver Ejemplo'}
                          <i className={`fas fa-chevron-down ml-2 text-xs transition-transform duration-200 ${isAdExpanded ? 'rotate-180' : ''}`}></i>
                        </button>
                    </div>
                </DashboardTile>
            </div>
            
            {isAdExpanded && (
              <div className="mt-4 dashboard-tile" style={{ animationDelay: '1.0s', opacity: 0 }}>
                <div className="grid md:grid-cols-3 gap-6 p-6 items-center bg-gradient-to-br from-lime-800/30 to-slate-900/10 rounded-lg">
                  <div className="md:col-span-1 flex justify-center items-center p-4">
                    <svg className="w-32 h-32 text-lime-300 animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                      <circle cx="50" cy="50" r="45" strokeDasharray="10 5" />
                      <path d="M30 60 L50 30 L70 60" strokeWidth="3"/>
                      <path d="M40 50 H60" strokeWidth="3"/>
                      <text x="50" y="85" textAnchor="middle" fontSize="10" fill="currentColor" className="font-orbitron tracking-widest">UPPA-AD</text>
                    </svg>
                  </div>
                  <div className="md:col-span-2 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-lime-200 text-glow font-audiowide">ANUNCIA CON NOSOTROS</h3>
                    <p className="text-slate-300 mt-2 text-lg">
                      Llega a miles de pilotos y pasajeros en tiempo real. Tu marca en el centro de la acción urbana.
                    </p>
                    <a 
                      href="https://api.whatsapp.com/send?phone=+543834689137&text=UppA!%20Quiero%20mas%20informaci%C3%B3n!!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ps-button active mt-6 px-6 py-3 text-base inline-block"
                    >
                      Contactar a Ventas <i className="fab fa-whatsapp ml-2"></i>
                    </a>
                  </div>
                </div>
              </div>
            )}
        </div>
    </div>
  );
};

export default LocationDashboard;
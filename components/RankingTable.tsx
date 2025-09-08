import React, { useState, useMemo } from 'react';
import { MicromobilityService, UserProfile, MicromobilityServiceType } from '../types';
import { MICROMOBILITY_SERVICE_ICONS } from '../constants';

interface RankingTableProps {
  services: MicromobilityService[];
  currentUser: UserProfile;
}

const RankingTable: React.FC<RankingTableProps> = ({ services, currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);

    const sortedServices = useMemo(() => {
        return [...services]
            .filter(s => s.isActive && s.numberOfRatings > 0) // Only rank active, rated services
            .sort((a, b) => {
                if (b.rating !== a.rating) {
                    return b.rating - a.rating; // Primary sort: rating descending
                }
                return b.completedTrips - a.completedTrips; // Secondary sort: trips descending
            });
    }, [services]);

    const renderIcon = (type: MicromobilityServiceType) => {
        const iconClass = MICROMOBILITY_SERVICE_ICONS[type] || 'fa-question-circle';
        const colorClass = type === MicromobilityServiceType.Moto ? 'text-sky-400' : 'text-indigo-400';
        return <i className={`fas ${iconClass} ${colorClass}`} title={type}></i>;
    };

    return (
        <div className="ps-card p-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center space-x-3">
                    <i className="fas fa-trophy text-2xl text-yellow-400 rank-glow"></i>
                    <h3 className="text-lg font-bold text-blue-300 font-orbitron">Ranking de Servicio de Motos y Remis</h3>
                </div>
                <i className={`fas fa-chevron-down text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-blue-500/20 max-h-96 overflow-y-auto scrollbar-thin">
                    {sortedServices.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-cyan-300 uppercase font-orbitron">
                                <tr>
                                    <th scope="col" className="p-2 text-center">Rank</th>
                                    <th scope="col" className="p-2">Piloto</th>
                                    <th scope="col" className="p-2 text-center">Tipo</th>
                                    <th scope="col" className="p-2 text-center">Rating</th>
                                    <th scope="col" className="p-2 text-center">Viajes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedServices.map((service, index) => {
                                    const isCurrentUser = service.providerId === currentUser.id;
                                    return (
                                        <tr 
                                            key={service.id} 
                                            className={`border-b border-slate-700/50 ${isCurrentUser ? 'bg-cyan-500/10' : 'hover:bg-slate-800/50'}`}
                                        >
                                            <td className="p-2 text-center font-bold font-orbitron">
                                                <span className={index < 3 ? 'rank-glow' : ''}>
                                                    {index === 0 && '🥇'}
                                                    {index === 1 && '🥈'}
                                                    {index === 2 && '🥉'}
                                                    {index > 2 && `#${index + 1}`}
                                                </span>
                                            </td>
                                            <td className={`p-2 font-semibold ${isCurrentUser ? 'text-cyan-300' : 'text-slate-200'}`}>
                                                {service.providerName}
                                            </td>
                                            <td className="p-2 text-center text-lg">
                                                {renderIcon(service.type)}
                                            </td>
                                            <td className="p-2 text-center font-mono text-yellow-300">
                                                {service.rating.toFixed(2)} ★
                                            </td>
                                            <td className="p-2 text-center font-mono text-slate-300">
                                                {service.completedTrips}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-slate-400 italic py-4">
                            No hay servicios activos con calificaciones para mostrar en el ranking.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default RankingTable;

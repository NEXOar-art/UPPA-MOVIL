import React from 'react';
import { MicromobilityService, UserProfile, MicromobilityServiceType } from '../types';
import { MICROMOBILITY_SERVICE_ICONS } from '../constants';

interface AvailableServicesProps {
    services: MicromobilityService[];
    currentUser: UserProfile;
    serviceToConfirm: string | null;
    confirmationCountdown: number;
    onInitiateRequest: (serviceId: string) => void;
    onCancelRequest: () => void;
}

const AvailableServices: React.FC<AvailableServicesProps> = ({ 
    services, 
    currentUser, 
    serviceToConfirm, 
    confirmationCountdown, 
    onInitiateRequest, 
    onCancelRequest 
}) => {
    if (services.length === 0) {
        return null;
    }

    return (
        <div className="ps-card p-4">
            <h3 className="text-xl font-orbitron text-lime-300 border-b border-lime-500/20 pb-2 mb-3 flex items-center">
                <i className="fas fa-satellite-dish text-lime-400 mr-3 animate-pulse"></i>
                Micromovilidad Disponible
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin pr-2 -mr-2">
                {services.map(service => {
                    const isOwnService = service.providerId === currentUser.id;
                    const isBeingConfirmed = service.id === serviceToConfirm;
                    const isAnyServiceBeingConfirmed = !!serviceToConfirm;
                    const iconClass = MICROMOBILITY_SERVICE_ICONS[service.type] || 'fa-question-circle';
                    const colorClass = service.type === MicromobilityServiceType.Moto ? 'text-sky-400' : 'text-indigo-400';
                    const progressPercentage = (confirmationCountdown / 60) * 100;

                    return (
                        <div key={service.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between gap-3 border border-slate-700/80">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <i className={`fas ${iconClass} ${colorClass} text-2xl`}></i>
                                <div className="overflow-hidden">
                                    <p className="font-semibold text-white truncate" title={service.serviceName}>{service.serviceName}</p>
                                    <p className="text-xs text-slate-400 truncate" title={service.address}>
                                        <i className="fas fa-map-marker-alt mr-1.5 opacity-70"></i>
                                        {service.address || 'Ubicación no disponible'}
                                    </p>
                                </div>
                            </div>

                            {isBeingConfirmed ? (
                                <button
                                    onClick={onCancelRequest}
                                    className="ps-button whitespace-nowrap px-3 py-1.5 text-xs relative overflow-hidden bg-yellow-600 hover:bg-yellow-700 border-yellow-500 hover:border-yellow-400 text-black"
                                >
                                    <span 
                                        className="absolute top-0 left-0 h-full bg-yellow-500/50 transition-all duration-1000 linear"
                                        style={{ width: `${progressPercentage}%` }}
                                    ></span>
                                    <span className="relative z-10 flex items-center">
                                        <i className="fas fa-hourglass-half mr-2 animate-spin [animation-duration:2s]"></i>
                                        Cancelar ({confirmationCountdown}s)
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => onInitiateRequest(service.id)}
                                    disabled={isOwnService || isAnyServiceBeingConfirmed}
                                    className="ps-button active whitespace-nowrap px-3 py-1.5 text-xs"
                                    title={isOwnService ? "No puedes solicitar tu propio servicio" : isAnyServiceBeingConfirmed ? "Espera a que termine la solicitud actual" : `Solicitar ${service.type}`}
                                >
                                    <i className="fas fa-paper-plane mr-2"></i>
                                    Solicitar
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AvailableServices;
import React, { useState, useRef } from 'react';
import { Bus, BusLineDetails, RatingHistoryEntry, MicromobilityService, UserProfile } from '../types';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

interface BusCardProps {
  bus: Bus;
  onSelect: () => void;
  isSelected: boolean;
  onReport: () => void;
  details: BusLineDetails | null;
  children?: React.ReactNode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onFindRouteToStop: (stopName: string) => void;
}

export const BusCard: React.FC<BusCardProps> = ({ bus, onSelect, isSelected, onReport, details, children, isFavorite, onToggleFavorite, onFindRouteToStop }) => {
    const [showRouteDetails, setShowRouteDetails] = useState(false);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection when clicking favorite
        onToggleFavorite();
    };

    return (
        <div className={`ps-card p-4 border-2 transition-all duration-300 ${isSelected ? 'border-cyan-400 shadow-lg shadow-cyan-500/10' : 'border-transparent hover:border-blue-500/50 cursor-pointer'}`} onClick={!isSelected ? onSelect : undefined}>
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className={`w-2 h-8 rounded-full ${bus.color}`}></div>
                    <div>
                        <h3 className="text-xl font-bold font-orbitron">{bus.lineName}</h3>
                        <p className="text-sm text-slate-400">{bus.description}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleFavoriteClick}
                        className={`p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                            ${isFavorite
                                ? 'text-yellow-400 hover:text-yellow-300 focus:ring-yellow-400'
                                : 'text-slate-400 hover:text-white focus:ring-cyan-400'
                            }`}
                        title={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
                        aria-label={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
                    >
                        <i className={`${isFavorite ? 'fas' : 'far'} fa-star text-lg ${isFavorite ? 'rank-glow text-yellow-400' : ''}`}></i>
                    </button>
                    {isSelected ? (
                        <button onClick={onReport} className="ps-button active">
                            <i className="fas fa-bullhorn mr-2"></i> Reportar
                        </button>
                    ) : (
                        <button onClick={onSelect} className="ps-button">
                            Seleccionar
                        </button>
                    )}
                </div>
            </div>
            {details && isSelected && (
                 <div className="mt-4 pt-4 border-t border-blue-500/20 text-xs text-slate-300 space-y-1">
                    <p><strong>Operador:</strong> {details.operator || 'No disponible'}</p>
                    <p><strong>Info:</strong> {details.generalDescription || 'No disponible'}</p>

                    <div className="text-center pt-2">
                        <button 
                            onClick={() => setShowRouteDetails(!showRouteDetails)}
                            className="ps-button text-xs py-1 px-3"
                        >
                            <i className={`fas ${showRouteDetails ? 'fa-chevron-up' : 'fa-route'} mr-2`}></i>
                            {showRouteDetails ? 'Ocultar Detalles de Ruta' : 'Ver Detalles de Ruta'}
                        </button>
                    </div>

                    {showRouteDetails && (
                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-blue-500/20 max-h-64 overflow-y-auto scrollbar-thin animate-[preloader-fade-in_0.5s_ease-out]">
                            <h4 className="font-bold text-sm text-cyan-300 font-orbitron mb-2">Segmentos Principales</h4>
                            <ul className="space-y-2 text-xs mb-4">
                                {details.segments.map((segment, index) => (
                                    <li key={index} className="flex items-start">
                                        <i className="fas fa-map-signs text-cyan-400 mt-0.5 mr-2 w-4 text-center"></i>
                                        <div>
                                            <span className="text-slate-200">{segment.name}</span>
                                            {segment.details && <p className="text-slate-400 italic">({segment.details})</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {details.specificRoutes.map((route, index) => (
                                <div key={index} className="pt-2 border-t border-blue-500/10">
                                    <h4 className="font-bold text-sm text-cyan-300 font-orbitron mt-1 mb-2">Recorrido: {route.name}</h4>
                                    <div className="grid grid-cols-2 gap-2 text-center mb-3">
                                        <div className="bg-slate-800 p-2 rounded">
                                            <p className="font-orbitron text-cyan-400">{route.stopsCount}</p>
                                            <p className="text-slate-400 text-[10px] uppercase">Paradas</p>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded">
                                            <p className="font-orbitron text-cyan-400">{route.approxDuration}</p>
                                            <p className="text-slate-400 text-[10px] uppercase">Duración</p>
                                        </div>
                                    </div>
                                    <h5 className="font-semibold text-slate-300 mb-1">Paradas Clave:</h5>
                                    <ul className="space-y-1 text-xs">
                                        {route.keyStops.map((stop, stopIndex) => (
                                            <li key={stopIndex} className="text-slate-400 flex items-start">
                                                <i className="fas fa-map-pin text-blue-400 mr-2 mt-0.5 w-3 text-center"></i>
                                                <button onClick={() => onFindRouteToStop(stop)} className="text-left text-blue-300 hover:text-cyan-300 hover:underline focus:outline-none">
                                                    {stop}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            )}
            {isSelected && <div className="mt-4 pt-4 border-t border-blue-500/20">{children}</div>}
        </div>
    );
};


interface PostTripReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: Omit<RatingHistoryEntry, 'userId' | 'timestamp' | 'sentiment'>) => void;
  service: MicromobilityService;
  currentUser: UserProfile;
}

const ReviewSlider: React.FC<{ label: string; value: number; onChange: (newValue: number) => void; icon: string }> = ({ label, value, onChange, icon }) => {
    const [hoverValue, setHoverValue] = useState(0);

    return (
        <div>
            <label className="flex items-center text-slate-300 mb-2">
                <i className={`${icon} w-6 text-center mr-2 text-cyan-400`}></i>
                <span className="font-semibold">{label}</span>
                <span className="ml-auto font-orbitron text-lg text-white">{hoverValue || value}</span>
            </label>
            <div 
                className="flex justify-between items-center space-x-2"
                onMouseLeave={() => setHoverValue(0)}
            >
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    const isFilled = ratingValue <= (hoverValue || value);
                    return (
                        <button
                            type="button"
                            key={ratingValue}
                            onClick={() => onChange(ratingValue)}
                            onMouseEnter={() => setHoverValue(ratingValue)}
                            className={`flex-1 h-3 rounded-sm transition-all duration-150 ease-in-out transform hover:scale-y-150
                                ${isFilled ? 'bg-cyan-400 shadow-[0_0_8px_var(--ps-cyan)]' : 'bg-slate-600 hover:bg-slate-500'}`
                            }
                            aria-label={`Calificar ${ratingValue} de 5`}
                        />
                    );
                })}
            </div>
        </div>
    );
};


const PostTripReviewModal: React.FC<PostTripReviewModalProps> = ({ isOpen, onClose, onSubmit, service, currentUser }) => {
    const [scores, setScores] = useState({ punctuality: 3, safety: 3, cleanliness: 3, kindness: 3 });
    const [comment, setComment] = useState('');
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                alert("Por favor, sube solo archivos de imagen o video.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const calculatedOverallRating = (scores.punctuality + scores.safety + scores.cleanliness + scores.kindness) / 4;

        setTimeout(() => {
            onSubmit({
                overallRating: calculatedOverallRating,
                scores,
                comment,
                mediaUrl: mediaUrl || undefined,
            });
            setIsSubmitting(false);
            resetForm();
        }, 1000);
    };

    const resetForm = () => {
        setScores({ punctuality: 3, safety: 3, cleanliness: 3, kindness: 3 });
        setComment('');
        setMediaUrl(null);
    };
    
    const handleClose = () => {
        resetForm();
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reporte de Misión">
            <div className="text-center mb-4">
                <h3 className="text-lg text-slate-300">Califica tu viaje con</h3>
                <h2 className="text-2xl font-audiowide text-blue-300">{service.serviceName}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5 pt-4 border-t border-blue-500/20">
                    <h4 className="text-center font-semibold text-slate-200 -mb-2">Métricas Detalladas</h4>
                    <ReviewSlider label="Puntualidad" icon="fas fa-clock" value={scores.punctuality} onChange={newValue => setScores(s => ({ ...s, punctuality: newValue }))} />
                    <ReviewSlider label="Seguridad al Conducir" icon="fas fa-shield-alt" value={scores.safety} onChange={newValue => setScores(s => ({ ...s, safety: newValue }))} />
                    <ReviewSlider label="Limpieza de la Unidad" icon="fas fa-soap" value={scores.cleanliness} onChange={newValue => setScores(s => ({ ...s, cleanliness: newValue }))} />
                    <ReviewSlider label="Amabilidad del Piloto" icon="fas fa-handshake" value={scores.kindness} onChange={newValue => setScores(s => ({ ...s, kindness: newValue }))} />
                </div>

                <div className="pt-4 border-t border-blue-500/20">
                    <label htmlFor="comment" className="block text-sm font-medium text-blue-300 mb-1">Comentario (Opcional)</label>
                    <textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3} className="w-full p-3 ps-input" placeholder="Describe tu experiencia..." />
                </div>

                <div>
                    <label htmlFor="media" className="block text-sm font-medium text-blue-300 mb-1">Cargar Evidencia (Opcional)</label>
                    <p className="text-xs text-slate-500 mb-2">Sube una foto o video corto sobre el estado de la unidad. El contenido será analizado por IA.</p>
                    <input type="file" id="media" accept="image/*,video/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:ps-button" />
                    {mediaUrl && (
                        <div className="mt-2 text-center">
                            {mediaUrl.startsWith('data:image') && <img src={mediaUrl} alt="Previsualización" className="max-h-40 rounded-md border border-gray-600 mx-auto" />}
                            {mediaUrl.startsWith('data:video') && <video src={mediaUrl} controls className="max-h-40 rounded-md border border-gray-600 mx-auto" />}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-blue-500/20">
                    <button type="button" onClick={handleClose} disabled={isSubmitting} className="ps-button">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="ps-button active flex items-center">
                        {isSubmitting ? <LoadingSpinner size="w-5 h-5 mr-2" /> : <i className="fas fa-paper-plane mr-2"></i>}
                        Enviar Evaluación
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PostTripReviewModal;
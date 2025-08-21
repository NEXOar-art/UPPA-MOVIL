import React, { useState, useRef } from 'react';
import { RatingHistoryEntry, MicromobilityService, UserProfile } from '../types';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

interface PostTripReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: Omit<RatingHistoryEntry, 'userId' | 'timestamp' | 'sentiment'>) => void;
  service: MicromobilityService;
  currentUser: UserProfile;
}

const HolographicStar: React.FC<{ filled: boolean; onHover: () => void; onClick: () => void; starSize?: string; glowColor?: string; }> = ({ filled, onHover, onClick, starSize = 'w-12 h-12', glowColor = 'cyan' }) => (
    <button type="button" onMouseEnter={onHover} onClick={onClick} className={`relative ${starSize} transition-all duration-200 ease-in-out transform hover:scale-125 focus:outline-none`}>
        <svg viewBox="0 0 24 24" className="absolute inset-0">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke={`url(#glow-grad-${glowColor})`}
                strokeWidth="1"
                fill="none"
                style={{ filter: `drop-shadow(0 0 8px var(--ps-${glowColor}))` }}
            />
        </svg>
        <svg viewBox="0 0 24 24" className="absolute inset-0 transition-opacity duration-300" style={{ opacity: filled ? 1 : 0.2 }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={`url(#fill-grad-${glowColor})`}
            />
        </svg>
        <defs>
            <radialGradient id={`fill-grad-${glowColor}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: 'var(--ps-cyan)', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: `var(--ps-${glowColor})`, stopOpacity: 0.3 }} />
            </radialGradient>
            <linearGradient id={`glow-grad-${glowColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: `var(--ps-${glowColor})` }} />
                <stop offset="100%" style={{ stopColor: 'var(--ps-blue)' }} />
            </linearGradient>
        </defs>
    </button>
);


const ReviewSlider: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; icon: string }> = ({ label, value, onChange, icon }) => {
    const percentage = ((value - 1) / 4) * 100;
    return (
        <div>
            <label className="flex items-center text-slate-300 mb-2">
                <i className={`${icon} w-6 text-center mr-2 text-cyan-400`}></i>
                <span className="font-semibold">{label}</span>
                <span className="ml-auto font-orbitron text-lg text-white">{value}</span>
            </label>
            <div className="relative">
                <input
                    type="range"
                    min="1" max="5" step="1"
                    value={value}
                    onChange={onChange}
                    className="w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                    style={{'--thumb-percentage': `${percentage}%`} as React.CSSProperties}
                />
            </div>
        </div>
    );
};


const PostTripReviewModal: React.FC<PostTripReviewModalProps> = ({ isOpen, onClose, onSubmit, service, currentUser }) => {
    const [overallRating, setOverallRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [scores, setScores] = useState({ punctuality: 3, safety: 3, cleanliness: 3, kindness: 3 });
    const [comment, setComment] = useState('');
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            // Basic validation for content type (client-side)
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
        if (overallRating === 0) {
            alert("Por favor, proporciona una calificación general.");
            return;
        }
        setIsSubmitting(true);
        
        // Simulate a delay for a better UX
        setTimeout(() => {
            onSubmit({
                overallRating,
                scores,
                comment,
                mediaUrl: mediaUrl || undefined,
            });
            setIsSubmitting(false);
            resetForm();
        }, 1000);
    };

    const resetForm = () => {
        setOverallRating(0);
        setHoverRating(0);
        setScores({ punctuality: 3, safety: 3, cleanliness: 3, kindness: 3 });
        setComment('');
        setMediaUrl(null);
    };
    
    const handleClose = () => {
        resetForm();
        onClose();
    }

    const displayRating = hoverRating || overallRating;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reporte de Misión">
            <div className="text-center mb-4">
                <h3 className="text-lg text-slate-300">Califica tu viaje con</h3>
                <h2 className="text-2xl font-audiowide text-blue-300">{service.serviceName}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h4 className="text-center font-semibold text-slate-200 mb-2">Calificación General</h4>
                    <div className="flex justify-center items-center space-x-2">
                        {[...Array(5)].map((_, i) => (
                            <HolographicStar key={i} filled={displayRating > i} onHover={() => setHoverRating(i + 1)} onClick={() => setOverallRating(i + 1)} />
                        ))}
                    </div>
                </div>

                <div className="space-y-5 pt-4 border-t border-blue-500/20">
                    <h4 className="text-center font-semibold text-slate-200 -mb-2">Métricas Detalladas</h4>
                    <ReviewSlider label="Puntualidad" icon="fas fa-clock" value={scores.punctuality} onChange={e => setScores(s => ({ ...s, punctuality: +e.target.value }))} />
                    <ReviewSlider label="Seguridad al Conducir" icon="fas fa-shield-alt" value={scores.safety} onChange={e => setScores(s => ({ ...s, safety: +e.target.value }))} />
                    <ReviewSlider label="Limpieza de la Unidad" icon="fas fa-soap" value={scores.cleanliness} onChange={e => setScores(s => ({ ...s, cleanliness: +e.target.value }))} />
                    <ReviewSlider label="Amabilidad del Piloto" icon="fas fa-handshake" value={scores.kindness} onChange={e => setScores(s => ({ ...s, kindness: +e.target.value }))} />
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
                    <button type="submit" disabled={isSubmitting || overallRating === 0} className="ps-button active flex items-center">
                        {isSubmitting ? <LoadingSpinner size="w-5 h-5 mr-2" /> : <i className="fas fa-paper-plane mr-2"></i>}
                        Enviar Evaluación
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PostTripReviewModal;

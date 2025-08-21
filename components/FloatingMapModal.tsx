

import React, { useState, useEffect } from 'react';
import { MicromobilityService, RatingHistoryEntry } from '../types';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { getPredictiveAlerts, getReviewSummary } from '../services/geminiService';

interface OperatorInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: MicromobilityService[];
}

const StatCard: React.FC<{ title: string; value: string; icon: string; colorClass?: string }> = ({ title, value, icon, colorClass = 'text-cyan-400' }) => (
    <div className="ps-card p-4 text-center bg-slate-800/50">
        <i className={`${icon} ${colorClass} text-3xl mb-2`}></i>
        <p className="text-2xl font-orbitron text-white">{value}</p>
        <p className="text-xs text-slate-400 uppercase tracking-wider">{title}</p>
    </div>
);

const DocumentationSection: React.FC = () => {
    const [showDocs, setShowDocs] = useState(false);

    return (
        <div>
            <button 
                onClick={() => setShowDocs(!showDocs)}
                className="w-full text-left text-sm text-cyan-400 hover:text-cyan-200 transition-colors flex justify-between items-center p-2 rounded-md hover:bg-slate-800/50"
            >
                <span><i className="fas fa-book-open mr-2"></i> Documentación de Indicadores</span>
                <i className={`fas fa-chevron-down transition-transform ${showDocs ? 'rotate-180' : ''}`}></i>
            </button>
            {showDocs && (
                <div className="mt-2 p-4 bg-slate-900/60 rounded-lg border border-blue-500/20 text-sm text-slate-300 space-y-4">
                    <div>
                        <h4 className="font-bold text-white">KPIs (Indicadores Clave de Rendimiento)</h4>
                        <ul className="list-disc list-inside space-y-2 pl-2 mt-1">
                            <li><strong>Servicios Activos:</strong> El número total de proveedores que han completado el registro y el pago, y cuyo tiempo de publicación no ha expirado.</li>
                            <li><strong>Viajes Totales:</strong> La suma de todos los viajes marcados como "completados" por los proveedores en la aplicación.</li>
                            <li><strong>Reviews Totales:</strong> El recuento de todas las evaluaciones (calificaciones con estrellas) enviadas por los pasajeros después de un viaje.</li>
                            <li><strong>Rating Global:</strong> El promedio de todas las calificaciones con estrellas de todos los servicios. Se calcula como (Suma de todas las estrellas) / (Reviews Totales).</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Análisis IA</h4>
                        <ul className="list-disc list-inside space-y-2 pl-2 mt-1">
                           <li><strong>Resumen IA de Comunidad:</strong> La IA de Gemini lee los comentarios más recientes de los usuarios y genera un resumen conciso de los temas principales y el sentimiento general.</li>
                           <li><strong>Análisis Predictivo de Riesgos:</strong> La IA analiza patrones en las reseñas con bajas calificaciones (menos de 3 estrellas) que contienen comentarios, para detectar problemas recurrentes (Ej: un conductor con quejas de seguridad repetidas) y sugerir acciones proactivas.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};


const OperatorInsightsModal: React.FC<OperatorInsightsModalProps> = ({ isOpen, onClose, services }) => {
    const [predictiveAlert, setPredictiveAlert] = useState<string | null>(null);
    const [isAlertLoading, setIsAlertLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setPredictiveAlert(null);
            
            // Auto-generate summary on open
            const allComments = services.flatMap(s => s.ratingHistory.map(r => r.comment).filter(Boolean) as string[]);
            if (allComments.length > 2) {
                setIsSummaryLoading(true);
                getReviewSummary(allComments.slice(-20)) // Summarize last 20 comments for relevance
                    .then(setSummary)
                    .finally(() => setIsSummaryLoading(false));
            } else {
                setSummary("Se necesitan al menos 3 comentarios para generar un resumen.");
            }
        }
    }, [isOpen, services]);

    const handleGenerateAlert = () => {
        const allReviews = services.flatMap(s => s.ratingHistory);
        const negativeReviewsWithContext = allReviews.filter(r => r.overallRating < 3 && r.comment && r.comment.trim() !== '');

        if (negativeReviewsWithContext.length < 3) {
            setPredictiveAlert("No hay suficientes reseñas negativas CON COMENTARIOS para un análisis predictivo. Se necesitan al menos 3 reseñas con texto para obtener contexto real y generar una alerta precisa.");
            return;
        }

        setIsAlertLoading(true);
        setPredictiveAlert(null);
        getPredictiveAlerts(negativeReviewsWithContext)
            .then(setPredictiveAlert)
            .catch(err => setPredictiveAlert("Error al contactar la IA para el análisis."))
            .finally(() => setIsAlertLoading(false));
    };

    const totalServices = services.length;
    const totalTrips = services.reduce((acc, s) => acc + s.completedTrips, 0);
    const totalRatings = services.reduce((acc, s) => acc + s.numberOfRatings, 0);
    const globalAvgRating = totalRatings > 0 
        ? services.reduce((acc, s) => acc + s.totalRatingPoints, 0) / totalRatings
        : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Panel de Control Operativo IA">
            <div className="space-y-6">
                <DocumentationSection />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Servicios Activos" value={totalServices.toString()} icon="fas fa-satellite-dish" />
                    <StatCard title="Viajes Totales" value={totalTrips.toString()} icon="fas fa-route" colorClass="text-green-400" />
                    <StatCard title="Reviews Totales" value={totalRatings.toString()} icon="fas fa-star" colorClass="text-yellow-400" />
                    <StatCard title="Rating Global" value={globalAvgRating.toFixed(2)} icon="fas fa-globe" colorClass="text-purple-400" />
                </div>
                
                <div className="ps-card p-4 bg-slate-800/50">
                    <h3 className="font-semibold text-lg text-blue-300 mb-2 flex items-center"><i className="fas fa-brain mr-2"></i>Resumen IA de Comunidad</h3>
                     {isSummaryLoading ? (
                        <div className="flex items-center space-x-2 text-slate-400"><LoadingSpinner size="w-5 h-5"/><span>Generando resumen...</span></div>
                    ) : (
                        <p className="text-sm text-slate-300 italic">"{summary}"</p>
                    )}
                </div>

                <div className="ps-card p-4 bg-slate-800/50">
                    <h3 className="font-semibold text-lg text-red-400 mb-2 flex items-center"><i className="fas fa-exclamation-triangle mr-2"></i>Análisis Predictivo de Riesgos</h3>
                    <button onClick={handleGenerateAlert} disabled={isAlertLoading} className="ps-button active w-full mb-4">
                        {isAlertLoading ? (
                            <span className="flex items-center justify-center"><LoadingSpinner size="w-5 h-5 mr-2" /> Procesando Datos...</span>
                        ) : (
                            <><i className="fas fa-search mr-2"></i> Analizar Reseñas Negativas</>
                        )}
                    </button>

                    {predictiveAlert && (
                        <div className="p-3 bg-red-900/40 border-l-4 border-red-500 rounded-r-md">
                            <p className="text-sm text-red-200 whitespace-pre-wrap">{predictiveAlert}</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default OperatorInsightsModal;